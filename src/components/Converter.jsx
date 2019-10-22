import React, { Component } from "react";
import { Alert, Button, ButtonGroup, Col, Container, Navbar, Row } from "react-bootstrap";
import YAML from "yaml";
import JWT from "jsonwebtoken";
import { CopyToClipboard } from "react-copy-to-clipboard";
import Form from "react-bootstrap/Form";

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
        this.state.stack.push({ value: "{}", type: "json" });
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

  convert(to) {
    let text = this.state.stack[0].value;
    let from = this.state.stack[0].type;
    let obj = null;

    try {
      switch (from) {
        case "base64":
          text = atob(text);
          break;
        case "json":
          obj = JSON.parse(text);
          break;
        case "jwt":
          text = JSON.stringify(JWT.decode(text));
          break;
        case "text":
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
        case "json":
          text = JSON.stringify(obj, null, 2);
          break;
        case "text":
          break;
        case "yaml":
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
    this.store((s) => {
      s.stack = [{ value: "{}", type: "json" }];
      s.error = null;
      s.copied = false;
    });
  }

  undo() {
    this.store(s => {
      if (s.stack.length >= 2) {
        s.stack.shift();
      }
    });
  }

  setCopied() {
    this.store((s) => {
      s.copied = true;
    });
  }


  render() {

    return (
      <React.Fragment>
        <Navbar bg="light" expand="lg">
          <Navbar.Brand href="#home"><i style={{ color: "red" }} className="fa fa-code"/> Converter</Navbar.Brand>
          <Button key='clear-history' variant='danger' onClick={() => {
            this.clearHistory();
          }} title='Clear history'><i className="fa fa-trash"/></Button>
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
              {i === 0 &&
              <Row>
                <Col>
                  From:
                  <ButtonGroup>
                    {["text", "json", "yaml", "base64", "jwt"].map(type => (
                      <Button
                        key={`button-type-${i}-${type}`}
                        variant={`${this.state.stack[i].type === type ? "primary" : "secondary"}`}
                        onClick={() => {
                          this.type(type);
                        }}>{type}</Button>
                    ))}
                  </ButtonGroup>
                  To:
                  <ButtonGroup>
                    {["text", "json", "yaml", "base64", "jwt"].map(type => (
                      <Button key={`button-convert-${i}-${type}`} variant="secondary" onClick={() => {
                        this.convert(type);
                      }}>{type}</Button>
                    ))}
                  </ButtonGroup>
                  &nbsp;
                  <Button onClick={() => this.undo()}><i className='fa fa-undo'/></Button>
                  <CopyToClipboard text={this.state.stack[i].value} onCopy={() => {
                    this.setCopied();
                  }}>
                    <Button variant="secondary" disabled={this.state.copied}><i className="fa fa-clipboard"/></Button>
                  </CopyToClipboard>
                </Col>
              </Row>}
              <Row>
                <Col>
                  <Form.Control as='textarea' rows={10} key={`editor-${i}`} value={this.state.stack[i].value}
                                onChange={e => this.change(e.target.value)}/>
                </Col>
              </Row>
            </Container>
          )
        )
        }
      </React.Fragment>
    );
  }
}

export default Converter;