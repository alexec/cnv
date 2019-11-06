import React, { Component } from "react";
import { Alert, Button, Container, Navbar } from "react-bootstrap";
import sha1 from "sha1";

import { CopyToClipboard } from "react-copy-to-clipboard";
import Nav from "react-bootstrap/Nav";
import NavbarCollapse from "react-bootstrap/NavbarCollapse";
import ButtonToolbar from "react-bootstrap/ButtonToolbar";
import AceEditor from "react-ace";

import "ace-builds/src-noconflict/mode-json";
import "ace-builds/src-noconflict/mode-xml";
import "ace-builds/src-noconflict/mode-yaml";
import "ace-builds/src-noconflict/theme-textmate";
import Badge from "react-bootstrap/Badge";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { convert } from "./convert";
import { HelpModal } from "./HelpModal";

import "./styles.css";
import { Logo } from "./logo";
import ButtonGroup from "react-bootstrap/ButtonGroup";

const example = {
  value: JSON.stringify({ foo: 1, bar: [2, 3], baz: { qux: true } }, null, 2),
  type: "json"
};

export class Converter extends Component {
  constructor(props) {
    super(props);
    const item = this.readFromLocalStorage();

    this.state = item || {};
    if (!Array.isArray(this.state.stack)) {
      this.state.stack = [];
    }
    if (this.state.stack.length === 0) {
      this.state.stack.push(example);
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

  convert(from, to) {
    const text = this.state.stack[0].value;
    try {
      const newText = convert(text, from, to);

      this.store(s => {
        s.stack.unshift({ value: newText, type: to });
        s.stack = s.stack.slice(0, 10);
        s.error = null;
      });
    } catch (e) {
      const annotation = this.annotation(e, text);
      this.store(s => {
        if (annotation) {
          s.error = {
            message: "line " + (annotation.row + 1) + ": " + e.message
          };
          s.stack[0].annotations = [annotation];
        } else {
          s.error = { message: e.message };
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
      s.error = null;
    });
  }

  undo() {
    this.store(s => {
      if (s.stack.length >= 2) {
        s.stack.shift();
        s.error = null;
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
            <Logo/> Code Chameleon <Badge variant="secondary">Beta</Badge>
          </Navbar.Brand>
          <Navbar.Toggle/>
          <NavbarCollapse className="justify-content-end">
            <Nav.Item>
              <Button
                onClick={() => this.openModal()}
                title="Help"
                variant="light"
              >
                <i className="fa fa-question-circle"/> Help
              </Button>
            </Nav.Item>
            <Nav.Item>
              <Button
                onClick={() =>
                  (document.location.href = "https://github.com/alexec/cnv")
                }
                title="Github"
                variant="light"
              >
                <i className="fa fa-github"/> Github
              </Button>
            </Nav.Item>
            <Nav.Item>
              <Button
                variant="light"
                onClick={() => {
                  this.clearHistory();
                }}
                title="Clear history"
              >
                <i className="fa fa-trash"/> Clear history
              </Button>
            </Nav.Item>
          </NavbarCollapse>
        </Navbar>

        <HelpModal
          show={this.state.modalIsOpen}
          onHide={() => this.closeModal()}
        />
        {this.state.error &&
        <Alert key="error" variant="danger">
          {this.state.error.message}
        </Alert>
        }
        {this.state.stack.map((entry, i) => (
          <React.Fragment>
            <Container fluid={true}><h4>#{this.state.stack.length - i}</h4></Container>
            {i === 0 && <Container fluid={true} style={{paddingBottom: '5px'}}>
              <ButtonToolbar className="justify-content-between">
                <ButtonGroup>
                  <Button
                    variant="secondary"
                    onClick={() => this.convert("base64", "text")}
                  >
                    Base 64 <i className="fa fa-caret-right"/>
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => this.convert("hex", "text")}
                  >
                    Hex <i className="fa fa-caret-right"/>
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => this.convert("url", "text")}
                  >
                    URL <i className="fa fa-caret-right"/>
                  </Button>
                </ButtonGroup>
                <ButtonGroup>
                  <Button
                    variant="secondary"
                    onClick={() => this.convert("jwt", "json")}
                  >
                    JWT <i className="fa fa-caret-right"/> JSON
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => this.convert("yaml", "json")}
                  >
                    YAML <i className="fa fa-caret-right"/> JSON
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => this.convert("xml", "json")}
                  >
                    XML <i className="fa fa-caret-right"/> JSON
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => this.convert("json", "yaml")}
                  >
                    JSON <i className="fa fa-caret-right"/> YAML
                  </Button>
                </ButtonGroup>
                <ButtonGroup>
                  <Button
                    variant="secondary"
                    onClick={() => this.convert("text", "base64")}
                  >
                    <i className="fa fa-caret-right"/> Base 64
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => this.convert("text", "hex")}
                  >
                    <i className="fa fa-caret-right"/> Hex
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => this.convert("text", "sha1")}
                  >
                    <i className="fa fa-caret-right"/> SHA-1
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => this.convert("text", "sha256")}
                  >
                    <i className="fa fa-caret-right"/> SHA-256
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => this.convert("text", "url")}
                  >
                    <i className="fa fa-caret-right"/> URL
                  </Button>
                </ButtonGroup>
                <ButtonGroup>
                  <CopyToClipboard
                    text={this.state.stack[i].value}
                    onCopy={() => {
                      toast("Copied to clipboard");
                    }}
                  >

                    <Button variant="light" title="Copy to clipboard">
                      <i className="fa fa-clipboard"/> Copy
                    </Button>
                  </CopyToClipboard>

                  <Button
                    variant="light"
                    onClick={() => this.undo()}
                    title="Discard"
                  >
                    <i className="fa fa-times"/> Discard
                  </Button>
                </ButtonGroup>
              </ButtonToolbar>
            </Container>
            }
            <Container fluid={true} style={{paddingBottom: '5px'}}>
              <AceEditor
                mode={this.state.stack[i].type}
                theme="textmate"
                tabSize={2}
                name={`editor-${i}`}
                value={this.state.stack[i].value}
                readOnly={i > 0}
                width={"auto"}
                onChange={value => this.change(value)}
                annotations={this.state.stack[i].annotations || []}
              />
            </Container>
          </React.Fragment>
        ))}
        <ToastContainer/>
        <Container fluid={true}>
          Icons made by{" "}
          <a href="https://www.flaticon.com/authors/freepik" title="Freepik">
            Freepik
          </a>{" "}
          from{" "}
          <a href="https://www.flaticon.com/" title="Flaticon">
            www.flaticon.com
          </a>
        </Container>
      </React.Fragment>
    );
  }
}

export default Converter;
