import React, { Component } from "react";
import {
  Alert,
  Button,
  ButtonGroup,
  Col,
  Container,
  Navbar,
  Row
} from "react-bootstrap";
import YAML from "yaml";
import JWT from "jsonwebtoken";
import sha1 from "sha1";
import parser from "fast-xml-parser";

import { CopyToClipboard } from "react-copy-to-clipboard";
import Nav from "react-bootstrap/Nav";
import NavbarCollapse from "react-bootstrap/NavbarCollapse";
import ButtonToolbar from "react-bootstrap/ButtonToolbar";
import AceEditor from "react-ace";

import "ace-builds/src-noconflict/mode-json";
import "ace-builds/src-noconflict/mode-xml";
import "ace-builds/src-noconflict/mode-yaml";
import "ace-builds/src-noconflict/theme-github";
import Badge from "react-bootstrap/Badge";

const example = {
  value: JSON.stringify({ foo: 1, bar: [2, 3], baz: { qux: true } }, null, 2),
  type: "json"
};

export class Converter extends Component {
  constructor(props) {
    super(props);
    let item = this.readFromLocalStorage();

    this.state = item || {};
    this.state.copied = false;
    if (!Array.isArray(this.state.stack)) {
      this.state.stack = [];
    }
    try {
      if (this.state.stack.length === 0) {
        this.state.stack.push({ value: example, type: "json" });
      }
    } catch (e) {
      this.state.error = e;
    }
  }

  readFromLocalStorage() {
    let item;
    try {
      item = JSON.parse(localStorage.getItem("state"));
    } catch (e) {
      console.log(e);
    }
    return item;
  }

  hexDecode(text) {
    const hexes = text.match(/.{1,4}/g) || [];
    let back = "";
    for (let j = 0; j < hexes.length; j++) {
      back += String.fromCharCode(parseInt(hexes[j], 16));
    }
    return back;
  }

  hexEncode(text) {
    let result = "";
    for (let i = 0; i < text.length; i++) {
      result += ("000" + text.charCodeAt(i).toString(16)).slice(-4);
    }
    return result;
  }

  convert(to) {
    let text = this.state.stack[0].value;
    let from = this.state.stack[0].type;
    let obj = null;

    try {
      switch (from) {
        case "base64":
          text = atob(text);
          break;
        case "hex":
          text = this.hexDecode(text);
          break;
        case "json":
          obj = JSON.parse(text);
          break;
        case "jwt":
          text = JSON.stringify(JWT.decode(text));
          break;
        case "text":
        case "sha1":
          break;
        case "xml":
          obj = parser.parse(text, {});
          break;
        case "url":
          text = decodeURI(text);
          break;
        case "yaml":
          obj = YAML.parse(text);
          break;
        default:
          throw new Error("cannot convert from " + from);
      }

      switch (to) {
        case "base64":
          text = btoa(text);
          break;
        case "hex":
          text = this.hexEncode(text);
          break;
        case "json":
          if (obj === null) {
            obj = JSON.parse(text);
          }
          text = JSON.stringify(obj, null, 2);
          break;
        case "sha1":
          text = sha1(text);
          break;
        case "text":
          break;
        case "url":
          text = encodeURI(text);
          break;
        case "yaml":
          if (obj === null) {
            obj = YAML.parse(text);
          }
          text = YAML.stringify(obj);
          break;
        default:
          throw new Error("cannot convert to " + to);
      }

      console.log("from=" + from + ", to=" + to + ", text=" + typeof text);

      this.store(s => {
        s.stack.unshift({ value: text, type: to });
        s.stack = s.stack.slice(0, 10);
        s.error = null;
      });
    } catch (e) {
      this.store(s => {
        s.error = e;
      });
    }
  }

  store(fn) {
    this.setState(s => {
      fn(s);
      localStorage.setItem("state", JSON.stringify(s));
      return s;
    });
  }

  type(type) {
    this.store(s => {
      s.stack[0].type = type;
    });
  }

  change(val) {
    this.store(s => {
      s.stack[0].value = val;
      s.copied = false;
    });
  }

  clearHistory() {
    this.store(s => {
      s.stack = [example];
      s.error = null;
      s.copied = false;
    });
  }

  undo() {
    this.store(s => {
      if (s.stack.length >= 2) {
        s.stack.shift();
        s.error = null;
        s.copied = false;
      }
    });
  }

  setCopied() {
    this.store(s => {
      s.copied = true;
    });
  }

  render() {
    return (
      <React.Fragment>
        <Navbar bg="light" expand="lg">
          <Navbar.Brand href="http://bit.ly/cnvcode">
            <i style={{ color: "red" }} className="fa fa-code" />{" "}
            http://bit.ly/cnvcode <Badge variant="secondary">Beta</Badge>
          </Navbar.Brand>
          <Navbar.Toggle />
          <NavbarCollapse className="justify-content-end">
            <Nav.Item>
              <Nav.Link href="https://github.com/alexec/cnv" title="Github">
                <i className="fa fa-github" />
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Button
                variant="danger"
                onClick={() => {
                  this.clearHistory();
                }}
                title="Clear history"
              >
                <i className="fa fa-trash" />
              </Button>
            </Nav.Item>
          </NavbarCollapse>
        </Navbar>
        <Container fluid={true}>
          {this.state.error && (
            <Alert key="error" variant="warning">
              {this.state.error.message}
            </Alert>
          )}
        </Container>
        {this.state.stack.map((entry, i) => (
          <Container key={`container-${i}`} fluid={true}>
            <h4>#{this.state.stack.length - i}</h4>
            {i === 0 && (
              <Row>
                <Col>
                  <ButtonToolbar className="justify-content-between">
                    <ButtonGroup>
                      <Button disabled>From:</Button>
                      {[
                        "text",
                        "json",
                        "yaml",
                        "xml",
                        "hex",
                        "base64",
                        "jwt",
                        "url"
                      ].map(type => (
                        <Button
                          key={`button-type-${i}-${type}`}
                          variant={`${
                            this.state.stack[i].type === type
                              ? "primary"
                              : "secondary"
                          }`}
                          onClick={() => {
                            this.type(type);
                          }}
                        >
                          {type}
                        </Button>
                      ))}
                    </ButtonGroup>
                    <ButtonGroup>
                      <Button disabled>To:</Button>
                      {[
                        "text",
                        "json",
                        "yaml",
                        "hex",
                        "base64",
                        "sha1",
                        "url"
                      ].map(type => (
                        <Button
                          key={`button-convert-${i}-${type}`}
                          variant="secondary"
                          onClick={() => {
                            this.convert(type);
                          }}
                        >
                          {type}
                        </Button>
                      ))}
                    </ButtonGroup>
                    &nbsp;
                    <ButtonGroup>
                      <Button onClick={() => this.undo()}>
                        <i className="fa fa-undo" />
                      </Button>
                      <CopyToClipboard
                        text={this.state.stack[i].value}
                        onCopy={() => {
                          this.setCopied();
                        }}
                      >
                        <Button
                          variant="secondary"
                          disabled={this.state.copied}
                        >
                          <i className="fa fa-clipboard" />
                        </Button>
                      </CopyToClipboard>
                    </ButtonGroup>
                  </ButtonToolbar>
                </Col>
              </Row>
            )}
            <Row>
              <Col>
                <AceEditor
                  mode={this.state.stack[i].type}
                  theme={"github"}
                  tabSize={2}
                  name={`editor-${i}`}
                  value={this.state.stack[i].value}
                  readOnly={i > 0}
                  width={"auto"}
                  onChange={e => this.change(e.target.value)}
                />
              </Col>
            </Row>
          </Container>
        ))}
      </React.Fragment>
    );
  }
}

export default Converter;
