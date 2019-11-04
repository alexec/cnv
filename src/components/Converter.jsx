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
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const example = {
  value: JSON.stringify({ foo: 1, bar: [2, 3], baz: { qux: true } }, null, 2),
  type: "json"
};

const types = {
  text: { name: "Text" },
  json: { name: "JSON" },
  jwt: { name: "JWT" },
  yaml: { name: "YAML" },
  hex: { name: "Hex" },
  base64: { name: "Base 64" },
  sha1: { name: "SHA1" },
  url: { name: "URL" },
  xml: { name: "XML" }
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
        this.state.stack.push(example);
      }
    } catch (e) {
      console.log(e);
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

  hexDecode(str1) {
    const hex = str1.toString();
    let str = "";
    for (let n = 0; n < hex.length; n += 2) {
      str += String.fromCharCode(parseInt(hex.substr(n, 2), 16));
    }
    return str;
  }

  hexEncode(str) {
    const arr1 = [];
    for (let n = 0, l = str.length; n < l; n++) {
      const hex = Number(str.charCodeAt(n)).toString(16);
      arr1.push(hex);
    }
    return arr1.join("");
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
      });
    } catch (e) {
      console.log(e);
      const annotation = this.annotation(e, text);
      this.store(s => {
        if (annotation) {
          s.stack[0].error = {
            message: "line " + (annotation.row + 1) + ": " + e.message
          };
          s.stack[0].annotations = [annotation];
        } else {
          s.stack[0].error = { message: e.message };
        }
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
    });
  }

  clearHistory() {
    this.store(s => {
      s.stack = [example];
    });
  }

  undo() {
    this.store(s => {
      if (s.stack.length >= 2) {
        s.stack.shift();
      }
    });
  }

  position(e) {
    const match = e.message.match(/at position [0-9]*/);
    if (match) {
      return parseInt(match[0].substring(9));
    }
    if (e.source && e.source.range) {
      return e.source.range.start;
    }
    return null;
  }

  annotation(e, value) {
    const p = this.position(e);
    if (p != null) {
      const text = value.substring(0, p);
      const row = text.split("\n").length - 1;
      const col = text.substring(text.lastIndexOf("\n")).length;
      return {
        row: row,
        column: col,
        text: e.message.replace(/at position [0-9]*/, ""),
        type: "error"
      };
    }
    return null;
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
        {this.state.stack.map((entry, i) => (
          <Container key={`container-${i}`} fluid={true}>
            <h4>#{this.state.stack.length - i}</h4>
            {i === 0 && (
              <Row>
                <Col>
                  {this.state.stack[i].error && (
                    <Alert key="error" variant="danger">
                      {this.state.stack[i].error.message}
                    </Alert>
                  )}
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
                          {types[type].name}
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
                          variant={`${
                            this.state.stack[i].type === type
                              ? "primary"
                              : "secondary"
                          }`}
                          onClick={() => {
                            this.convert(type);
                          }}
                        >
                          {types[type].name}
                        </Button>
                      ))}
                    </ButtonGroup>
                    &nbsp;
                    <ButtonGroup>
                      <CopyToClipboard
                        text={this.state.stack[i].value}
                        onCopy={() => {
                          toast("Copied to clipboard");
                        }}
                      >
                        <Button variant="secondary" title="Copy to clipboard">
                          <i className="fa fa-clipboard" />
                        </Button>
                      </CopyToClipboard>

                      <Button onClick={() => this.undo()} title="Discard">
                        <i className="fa fa-times" />
                      </Button>
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
                  onChange={value => this.change(value)}
                  annotations={this.state.stack[i].annotations || []}
                />
              </Col>
            </Row>
          </Container>
        ))}
        <ToastContainer />
      </React.Fragment>
    );
  }
}

export default Converter;
