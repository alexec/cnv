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
  json: { name: "JSON", syntax: true, to: ["base64", "hex", "sha1", "sha256", "url", "yaml"] },
  jwt: { name: "JWT", to: ["json"] },
  sha1: { name: "SHA-1", to: [] },
  sha256: { name: "SHA-256", to: [] },
  text: { name: "Text", to: ["base64", "hex", "sha1", "sha256", "url"] },
  xml: { name: "XML", syntax: true, to: ["json", "yaml"] },
  yaml: { name: "YAML", syntax: true, to: ["base64", "hex", "json", "sha1", "sha256", "url"] },
  url: { name: "URL", to: ["text"] }
};

const blank = { value: "", type: "text", types: ["text"] };

export class Converter extends Component {
  constructor(props) {
    super(props);
    const item = this.readFromLocalStorage();

    this.state = item || {};
    delete this.state.stack;
    delete this.state.copied;
    delete this.state.modalIsOpen;
    if (typeof this.state.a !== "object") {
      Object.assign(this.state.a, blank);
    }
    if (typeof this.state.b !== "object") {
      Object.assign(this.state.b, blank);
    }
    this.state.a.type = this.state.a.type || blank.type;
    this.state.b.type = this.state.b.type || blank.type;
    this.state.a.types = this.state.a.types || [this.state.a.type];
    this.state.b.types = this.state.b.types || [this.state.b.type];
    if (this.state.a.annotations) {
      if (this.state.a.annotations[0] === null) {
        delete this.state.a.annotations;
      }
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

  detectTypes(text) {
    const ok = type => {
      try {
        convert(text, type, "text");
        return true;
      } catch (e) {
        return false;
      }
    };

    const types = ["base64", "hex", "jwt", "text", "url"].filter(ok);

    if (text.startsWith("{") || text.startsWith("[")) {
      types.push("json");
    } else if (text.startsWith("<")) {
      types.push("xml");
    } else {
      types.push("yaml");
    }

    return types;
  }

  convert(from, to) {
    const text = this.state.a.value;
    try {
      const newText = convert(text, from, to);
      this.store(s => {
        s.a.type = from;
        s.b = { value: newText, type: to, types: [to] };
        delete s.error;
      });
    } catch (e) {
      this.annotate(text, e);
    }
  }

  annotate(text, e) {
    const annotation = this.annotation(e, text);
    this.store(s => {
      s.a.annotations = [annotation];
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
      delete s.a.annotations;
      delete s.error;
      try {
        convert(s.a.value, s.a.type, s.a.type);
      } catch (e) {
        s.a.annotations = [this.annotation(e, s.a.value)];
      }
    });
  }

  change(text) {
    this.store(s => {
      s.a.value = text;
      s.a.types = this.detectTypes(text);
      if (!s.a.types.includes(s.a.type)) {
        s.a.type = s.a.types.length > 0 ? s.a.types[0] : "text";
      }
      delete s.a.annotations;
      delete s.error;
      try {
        convert(s.a.value, s.a.type, s.a.type);
      } catch (e) {
        s.a.annotations = [this.annotation(e, s.a.value)];
      }
    });
  }

  swap() {
    this.store(s => {
      const a = s.a;
      s.a = s.b;
      s.b = a;
      delete s.a.annotations;
      delete s.error;
    });
  }

  clear() {
    this.store(s => {
      s.a = {};
      s.b = {};
      Object.assign(s.a, blank);
      Object.assign(s.b, blank);
      delete s.error;
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
    return {
      row: 1,
      column: 1,
      text: e.message,
      type: "error"
    };
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
      delete s.error;
    });
  }

  format() {
    try {
      const newText = convert(this.state.a.value, this.state.a.type, this.state.a.type);
      this.store(s => {
        s.a.value = newText;
        delete s.error;
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
                <Button variant="secondary" onClick={() => this.format()}>
                  <i className="fa fa-code" /> Format
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
                mode={types[this.state.a.type].syntax ? this.state.a.type : "text"}
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
              {this.state.a.value === "" ? (
                <React.Fragment>
                  {["base64", "hex", "json", "jwt", "text", "url", "xml", "yaml"].map(type => (
                    <React.Fragment>
                      <Button key={`btn-eg-${type}`} variant="secondary" onClick={() => this.example(type)}>
                        {types[type].name}
                      </Button>
                      <br />
                    </React.Fragment>
                  ))}
                </React.Fragment>
              ) : (
                (this.state.a.types || []).map(from => (
                  <React.Fragment>
                    <Button
                      key={`btn-from-${from}`}
                      variant={from === this.state.a.type ? "secondary" : "light"}
                      onClick={() => {
                        this.type(from);
                      }}
                    >
                      {from === this.state.a.type && <i className="fa fa-check" />} {types[from].name}
                    </Button>
                    <br />
                  </React.Fragment>
                ))
              )}
            </Col>
            <Col sm={1} style={{ textAlign: "center", verticalAlign: "center" }}>
              {types[this.state.a.type].to.map(to => (
                <React.Fragment>
                  <Button key={`btn-to-${to}`} variant="secondary" onClick={() => this.convert(this.state.a.type, to)}>
                    {types[to].name}
                  </Button>
                  <br />
                </React.Fragment>
              ))}
            </Col>
            <Col sm={5}>
              <AceEditor
                mode={types[this.state.b.type].syntax ? this.state.b.type : "text"}
                theme="textmate"
                tabSize={2}
                name={`editor-b`}
                value={this.state.b.value}
                readOnly={true}
                width={"auto"}
              />
            </Col>
          </Row>
        </Container>
        <ToastContainer />
      </React.Fragment>
    );
  }
}

export default Converter;
