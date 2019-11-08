import React, { Component } from "react";
import { Alert, Button, Container, Navbar } from "react-bootstrap";
import sha1 from "sha1";

import { CopyToClipboard } from "react-copy-to-clipboard";
import Nav from "react-bootstrap/Nav";
import NavbarCollapse from "react-bootstrap/NavbarCollapse";
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
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import YAML from "yaml";

const examples = {
  base64: "SGVsbG8gV29ybGQh",
  hex: "48656c6c6f20576f726c6421",
  json: JSON.stringify({ hello: "World!" }, null, 2),
  jwt: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0IiwibmFtZSI6IkhlbGxvIFdvcmxkISIsImlhdCI6NTY3OH0.Z8e1JNb8vgSxmahjSEztZBwWfA1l4xr5A98D5kp-aGI",
  text: "Hello World!",
  url: "Hello%20World!",
  xml: `<hello><![CDATA[World!]]></hello>`,
  yaml: YAML.stringify({ hello: "World!" })
};

const types = {
  base64: { name: "Base 64", to: ["text"] },
  hex: { name: "Hex", to: ["text"] },
  json: { name: "JSON", to: ["base64", "hex", "sha1", "sha256", "url", "yaml"] },
  jwt: { name: "JWT", to: ["json"] },
  sha1: { name: "SHA-1", to: [] },
  sha256: { name: "SHA-256", to: [] },
  text: { name: "Text", to: ["base64", "hex", "sha1", "sha256", "url"] },
  xml: { name: "XML", to: ["json", "yaml"] },
  yaml: { name: "YAML", to: ["base64", "hex", "json", "sha1", "sha256", "url"] },
  url: { name: "URL", to: ["text"] }
};

const blank = { value: "", type: "text", types: ["text"] };

export class Converter extends Component {
  constructor(props) {
    super(props);
    const item = this.readFromLocalStorage();

    this.state = item || {};
    this.state.a = this.state.a || blank;
    this.state.b = this.state.b || blank;
    this.state.a = typeof this.state.a === "object" ? this.state.a : blank;
    this.state.b = typeof this.state.b === "object" ? this.state.b : blank;
    this.state.a.type = this.state.a.type || blank.type;
    this.state.b.type = this.state.b.type || blank.type;
    this.state.a.types = this.state.a.types || [this.state.a.type];
    this.state.b.types = this.state.b.types || [this.state.b.type];
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

  detectTypes(text) {
    const types = [];
    ["base64", "hex", "url", "json", "jwt", "yaml", "xml"].forEach(type => {
      try {
        if (type === "yaml" && (types.includes("jwt") || types.includes("json"))) {
          throw new Error();
        }
        convert(text, type, "text");
        types.push(type);
      } catch (ignored) {}
    });
    return types;
  }

  convert(from, to) {
    const text = this.state.a.value;
    try {
      const newText = convert(text, from, to);
      this.store(s => {
        s.a.type = from;
        s.b = { value: newText, type: to, types: [to] };
        s.error = null;
      });
    } catch (e) {
      this.annotation(text, e);
    }
  }

  annotate(text, e) {
    const annotation = this.annotation(e, text);
    this.store(s => {
      if (annotation) {
        s.error = {
          message: "line " + (annotation.row + 1) + ": " + e.message
        };
        s.a.annotations = [annotation];
      } else {
        s.error = { message: e.message };
      }
    });
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
      s.a.type = type;
    });
  }

  change(val) {
    this.store(s => {
      s.a.value = val;
      s.a.types = this.detectTypes(val);
      s.a.annotations = [];
      s.error = null;
    });
  }

  swap() {
    this.store(s => {
      const a = s.a;
      s.a = s.b;
      s.b = a;
      s.a.annotations = [];
      s.error = null;
    });
  }

  clear() {
    this.store(s => {
      s.a = blank;
      s.b = blank;
      s.error = null;
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
      s.modalIsClosed = false;
    });
  }

  closeModal() {
    this.store(s => {
      s.modalIsClosed = true;
    });
  }

  example(type) {
    this.store(s => {
      s.a = { value: examples[type], type: type, types: [type] };
      s.error = null;
    });
  }

  pretty() {
    try {
      const newText = convert(this.state.a.value, this.state.a.type, this.state.a.type);
      this.store(s => {
        s.a.value = newText;
        s.error = null;
      });
    } catch (e) {
      this.annotate(this.state.a.value, e);
    }
  }

  render() {
    return (
      <React.Fragment>
        <Navbar bg="light" expand="lg">
          <Navbar.Brand href="http://bit.ly/cnvcode">
            <Logo /> Code Chameleon <Badge variant="secondary">Beta</Badge>
          </Navbar.Brand>
          <Navbar.Toggle />
          <NavbarCollapse className="justify-content-end">
            <Nav.Item>
              <Button onClick={() => this.openModal()} title="Help" variant="light">
                <i className="fa fa-question-circle" /> Help
              </Button>
            </Nav.Item>
            <Nav.Item>
              <Button onClick={() => (document.location.href = "https://github.com/alexec/cnv")} title="Github" variant="light">
                <i className="fa fa-github" /> Github
              </Button>
            </Nav.Item>
            <Nav.Item>
              <Button
                variant="light"
                onClick={() => {
                  this.clear();
                }}
                title="Clear"
              >
                <i className="fa fa-trash" /> Clear
              </Button>
            </Nav.Item>
          </NavbarCollapse>
        </Navbar>

        <HelpModal show={!this.state.modalIsClosed} onHide={() => this.closeModal()} />
        {this.state.error && (
          <Alert key="error" variant="danger">
            {this.state.error.message}
          </Alert>
        )}
        <Container fluid={true} style={{ paddingTop: "5px" }}>
          <Row>
            <Col sm={5}>
              <h4>
                <Button variant="secondary" onClick={() => this.pretty()}>
                  <i className="fa fa-code" /> Pretty
                </Button>
                <span className={"pull-right"}>{types[this.state.a.type].name}</span>
              </h4>
            </Col>
            <Col sm={2} style={{ textAlign: "center" }}>
              <Button variant="secondary" onClick={() => this.swap()}>
                <i className="fa fa-arrow-left" />
                <i className="fa fa-arrow-right" /> Swap
              </Button>
            </Col>
            <Col sm={5}>
              <h4>
                <span>{types[this.state.b.type].name}</span>
                <span className={"pull-right"}>
                  <CopyToClipboard
                    text={this.state.b.value}
                    onCopy={() => {
                      toast("Copied to clipboard");
                    }}
                  >
                    <Button variant="light" title="Copy to clipboard">
                      <i className="fa fa-clipboard" /> Copy
                    </Button>
                  </CopyToClipboard>
                </span>
              </h4>
            </Col>
          </Row>
          <Row className="align-items-center">
            <Col sm={5}>
              <AceEditor
                mode={this.state.a.type}
                theme="textmate"
                tabSize={2}
                name={`editor-a`}
                value={this.state.a.value}
                readOnly={false}
                width={"auto"}
                onChange={value => this.change(value)}
                annotations={this.state.a.annotations || []}
              />
            </Col>
            <Col sm={1} style={{ textAlign: "center", verticalAlign: "center" }}>
              {this.state.a === blank ? (
                <React.Fragment>
                  <Button variant="secondary" onClick={() => this.example("base64")}>
                    Base 64
                  </Button>
                  <br />
                  <Button variant="secondary" onClick={() => this.example("hex")}>
                    Hex
                  </Button>
                  <br />
                  <Button variant="secondary" onClick={() => this.example("json")}>
                    JSON
                  </Button>
                  <br />
                  <Button variant="secondary" onClick={() => this.example("jwt")}>
                    JWT
                  </Button>
                  <br />
                  <Button variant="secondary" onClick={() => this.example("text")}>
                    Text
                  </Button>
                  <br />
                  <Button variant="secondary" onClick={() => this.example("xml")}>
                    XML
                  </Button>
                  <br />
                  <Button variant="secondary" onClick={() => this.example("yaml")}>
                    YAML
                  </Button>
                </React.Fragment>
              ) : (
                (this.state.a.types || []).map(type => (
                  <React.Fragment>
                    <Button
                      variant={type === this.state.a.type ? "secondary" : "light"}
                      onClick={() => {
                        this.type(type);
                      }}
                    >
                      {type === this.state.a.type && <i className="fa fa-check" />} {types[type].name}
                    </Button>
                    <br />
                  </React.Fragment>
                ))
              )}
            </Col>
            <Col sm={1} style={{ textAlign: "center", verticalAlign: "center" }}>
              {types[this.state.a.type].to.map(to => (
                <React.Fragment>
                  <Button variant="secondary" onClick={() => this.convert(this.state.a.type, to)}>
                    {types[to].name}
                  </Button>
                  <br />
                </React.Fragment>
              ))}
            </Col>
            <Col sm={5}>
              <AceEditor mode={this.state.b.type} theme="textmate" tabSize={2} name={`editor-b`} value={this.state.b.value} readOnly={true} width={"auto"} />
            </Col>
          </Row>
        </Container>
        <ToastContainer />
        <Container fluid={true}>
          <small>
            Icons made by{" "}
            <a href="https://www.flaticon.com/authors/freepik" title="Freepik">
              Freepik
            </a>{" "}
            from{" "}
            <a href="https://www.flaticon.com/" title="Flaticon">
              www.flaticon.com
            </a>
          </small>
        </Container>
      </React.Fragment>
    );
  }
}

export default Converter;
