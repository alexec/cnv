import React, { Component } from "react";
import {
  Alert,
  Container,
  Button,
  ButtonGroup,
  Col,
  FormGroup
} from "react-bootstrap";
import Form from "react-bootstrap/Form";
import MonacoEditor from "react-monaco-editor";
import YAML from "yaml";

export class Converter extends Component {
  constructor(props) {
    super(props);
    let item = this.readFromLocalStorage();

    this.state = item || {
      a: { value: "", types: this.detectTypes("") },
      b: { value: "", types: this.detectTypes("") }
    };
    this.state.ab = this.state.ab || "a";
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

  detectTypes(val) {
    const types = ["text"];
    try {
      JSON.parse(val);
      types.push("json");
    } catch (ignored) {}
    try {
      YAML.parse(val);
      types.push("yaml");
    } catch (ignored) {}
    try {
      atob(val);
      types.push("base64");
    } catch (ignored) {}
    return types;
  }

  convert(text, from, to) {
    const reps = {
      base64: "text",
      text: "text",
      json: "obj",
      yaml: "obj"
    };

    let obj;
    switch (from) {
      case "base64":
        text = btoa(text);
        break;
      case "json":
        obj = JSON.parse(text);
        break;
      case "text":
        break;
      case "yaml":
        obj = YAML.parse(text);
        break;
      default:
        throw new Error();
    }

    console.log(text);

    switch (to) {
      case "base64":
        return atob(text);
      case "json":
        return JSON.stringify(obj, null, 2);
      case "text":
        return text;
      case "yaml":
        return YAML.stringify(obj);
      default:
        throw new Error();
    }
  }

  store(fn) {
    this.setState(s => {
      fn(s);
      const ab = s.ab;
      s[ab].types = this.detectTypes(s[ab].value);
      if (s[ab].type === undefined) {
        if (s[ab].types.length === 1) {
          s[ab].type = s[ab].types[0];
        }
      }
      const ba = ab === "a" ? "b" : "a";

      if (s[ab].type !== undefined && s[ba].type !== undefined) {
        try {
          s[ba].value = this.convert(s[ab].value, s[ab].type, s[ba].type);
          s.error = null;
        } catch (e) {
          s.error = e;
        }
      }
      localStorage.setItem("state", JSON.stringify(s));
      return s;
    });
  }

  type(ab, type) {
    this.store(s => {
      s[ab].type = type;
    });
  }

  change(ab, val) {
    this.store(s => {
      s.ab = ab;
      s[ab].value = val;
    });
  }

  render() {
    return (
      <Container>
        <Form>
          <Form.Row>
            <Col>
              {this.state.error && (
                <Alert key="error" variant="warning">
                  {this.state.error.message}
                </Alert>
              )}
            </Col>
          </Form.Row>
          <Form.Row>
            {["a", "b"].map(ab => (
              <Col key={`col-${ab}`}>
                <FormGroup controlId="a">
                  <ButtonGroup>
                    {["text", "json", "yaml", "base64"].map(type => (
                      <Button
                        key={`button-${ab}-${type}`}
                        variant={`${
                          this.state[ab].type === type ? "primary" : "secondary"
                        }`}
                        onClick={() => {
                          this.type(ab, type);
                        }}
                      >
                        {type}
                      </Button>
                    ))}
                  </ButtonGroup>
                  <MonacoEditor
                    language={this.state[ab].type}
                    key={`editor-${ab}`}
                    value={this.state[ab].value}
                    onChange={val => this.change(ab, val)}
                    height="800"
                  />
                </FormGroup>
              </Col>
            ))}
          </Form.Row>
        </Form>
      </Container>
    );
  }
}

export default Converter;
