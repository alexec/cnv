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

const example = {
  value: JSON.stringify({ foo: 1, bar: [2, 3], baz: { qux: true } }, null, 2),
  type: "json"
};

const blank = { value: "", type: "text" };

export class Converter extends Component {
  constructor(props) {
    super(props);
    const item = this.readFromLocalStorage();

    this.state = item || {};
    this.state.a = this.state.a || example;
    this.state.b = this.state.b || blank;
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
    const text = this.state.a.value;
    try {
      const newText = convert(text, from, to);

      this.store(s => {
        s.b = { value: newText, type: to };
        s.error = null;
      });
    } catch (e) {
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
    });
  }

  swap() {
    this.store(s => {
      const a = s.a;
      s.a = s.b;
      s.b = a;
    });
  }

  clear() {
    this.store(s => {
      s.a = example;
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
              <h4>{this.state.a.type}</h4>
            </Col>
            <Col sm={2} style={{ textAlign: "center" }}>
              <Button variant="secondary" onClick={() => this.swap()}>
                <i className="fa fa-arrow-left" />
                <i className="fa fa-arrow-right" />
              </Button>
            </Col>
            <Col sm={5}>
              <h4>
                {this.state.b.type}{" "}
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
              </h4>
            </Col>
          </Row>
          <Row>
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
            <Col sm={2} style={{ textAlign: "center", verticalAlign: "center" }}>
              <p>
                <Button variant="secondary" onClick={() => this.convert("base64", "text")} title={"Convert from Base 64"}>
                  Base 64 <i className="fa fa-caret-right" />
                </Button>
                <br />
                <Button variant="secondary" onClick={() => this.convert("hex", "text")} title={"Convert from hex"}>
                  Hex <i className="fa fa-caret-right" />
                </Button>
                <br />
                <Button variant="secondary" onClick={() => this.convert("url", "text")} title={"Convert from URL"}>
                  URL <i className="fa fa-caret-right" />
                </Button>
              </p>
              <p>
                <Button variant="secondary" onClick={() => this.convert("jwt", "json")} title={"Convert from JWT to JSON"}>
                  JWT <i className="fa fa-caret-right" /> JSON
                </Button>
                <br />
                <Button variant="secondary" onClick={() => this.convert("yaml", "json")} title={"Convert from YAML to JSON"}>
                  YAML <i className="fa fa-caret-right" /> JSON
                </Button>
                <br />
                <Button variant="secondary" onClick={() => this.convert("xml", "json")} title={"Convert from XML to JSON"}>
                  XML <i className="fa fa-caret-right" /> JSON
                </Button>
              </p>
              <p>
                <Button variant="secondary" onClick={() => this.convert("json", "yaml")} title={"Convert from JSON to YAML"}>
                  JSON <i className="fa fa-caret-right" /> YAML
                </Button>
              </p>
              <p>
                <Button variant="secondary" onClick={() => this.convert("text", "base64")} title={"Convert to base 64"}>
                  <i className="fa fa-caret-right" /> Base 64
                </Button>
                <br />
                <Button variant="secondary" onClick={() => this.convert("text", "hex")} title={"Convert to hex"}>
                  <i className="fa fa-caret-right" /> Hex
                </Button>
                <br />
                <Button variant="secondary" onClick={() => this.convert("text", "sha1")} title={"Convert to SHA-1"}>
                  <i className="fa fa-caret-right" /> SHA-1
                </Button>
                <br />
                <Button variant="secondary" onClick={() => this.convert("text", "sha256")} title={"Convert to SHA-256"}>
                  <i className="fa fa-caret-right" /> SHA-256
                </Button>
                <br />
                <Button variant="secondary" onClick={() => this.convert("text", "url")} title={"Convert to URL"}>
                  <i className="fa fa-caret-right" /> URL
                </Button>
              </p>
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
