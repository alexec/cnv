import React, { Component } from "react";
import { Alert, Button, ButtonGroup, ButtonToolbar, Container, FormGroup } from "react-bootstrap";
import Form from "react-bootstrap/Form";
import MonacoEditor from "react-monaco-editor";
import YAML from "yaml";
import JWT from "jsonwebtoken";

export class Converter extends Component {
  constructor(props) {
    super(props);
    let item = this.readFromLocalStorage();

    this.state = item || {};
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

    console.log("from " + from + ", to " + to);

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

      console.log("text=" + text);
      console.log(obj);

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

      console.log("text=" + text);

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
    });
  }

  clearHistory() {
    this.store((s) => {
      s.stack = [{ value: "{}", type: "json" }];
      s.error = null;
    });
  }

  render() {
    return (
      <Container>
        {this.state.error && (
          <Alert key="error" variant="warning">
            {this.state.error.message}
          </Alert>
        )}
        {this.state.stack.map((entry, i) => (
          <Form key={`form-${i}`}>
            <FormGroup controlId="a">
              <h4>#{this.state.stack.length - i}</h4>
              {i === 0 && <ButtonToolbar>
                <ButtonGroup>
                  {["text", "json", "yaml", "base64", "jwt"].map(type => (
                    <Button
                      key={`button-type-${i}-${type}`}
                      variant={`outline-${this.state.stack[i].type === type ? "primary" : "secondary"}`}
                      onClick={() => {
                        this.type(type);
                      }}>{type}</Button>
                  ))}
                </ButtonGroup>
                <i className='fa fa-right-arrow'/>
                <ButtonGroup>
                  {["text", "json", "yaml", "base64", "jwt"].map(type => (
                    <Button
                      key={`button-convert-${i}-${type}`}
                      variant="secondary"
                      onClick={() => {
                        this.convert(type);
                      }}>{type}</Button>
                  ))}
                </ButtonGroup>
                <ButtonGroup>
                  <Button key='clear-history' variant='danger' onClick={() => {
                    this.clearHistory();
                  }}>Clear History</Button>
                </ButtonGroup>
              </ButtonToolbar>
              }
              <MonacoEditor
                language={this.state.stack[i].type}
                key={`editor-${i}`}
                value={this.state.stack[i].value}
                onChange={val => this.change(val)}
                height="400px"
              />
            </FormGroup>

          </Form>
        ))}
      </Container>
    );
  }
}

export default Converter;
