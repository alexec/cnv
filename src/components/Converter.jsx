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
import { convert } from "./convert";
import { HelpModal } from "./HelpModal";

import "./styles.css"

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
    const item = this.readFromLocalStorage();

    this.state = item || {};
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

  convert(to) {
    const text = this.state.stack[0].value;
    const from = this.state.stack[0].type;

    try {
      const newText = convert(text, from, to);

      this.store(s => {
        s.stack.unshift({ value: newText, type: to });
        s.stack = s.stack.slice(0, 10);
      });
    } catch (e) {
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

  openModal() {
    this.store(s => {
      s.modalIsOpen = true;
    });
  }

  closeModal() {
    this.store(s => {
      s.modalIsOpen = false;
    });
  }

  render() {
    return (
      <React.Fragment>
        <Navbar bg="light" expand="lg">
          <Navbar.Brand href="http://bit.ly/cnvcode">
            <i className="fa fa-code logo" />{" "}
            Code Chameleon <Badge variant="secondary">Beta</Badge>
          </Navbar.Brand>
          <Navbar.Toggle />
          <NavbarCollapse className="justify-content-end">
            <Nav.Item>
              <Nav.Link href="#" onClick={() => this.openModal()} title="Help">
                <i className="fa fa-question-circle" /> Help
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link href="https://github.com/alexec/cnv" title="Github" variant='secondary'>
                <i className="fa fa-github" /> Github
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Button variant="secondary" onClick={() => {this.clearHistory();}} title="Clear history">
                <i className="fa fa-trash" /> Clear history
              </Button>
            </Nav.Item>
          </NavbarCollapse>
        </Navbar>

        <HelpModal show={this.state.modalIsOpen} onHide={() => this.closeModal()}/>
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
                          <i className="fa fa-clipboard" /> Copy
                        </Button>
                      </CopyToClipboard>

                      <Button onClick={() => this.undo()} title="Discard">
                        <i className="fa fa-times" /> Discard
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
