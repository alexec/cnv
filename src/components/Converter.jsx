import React, { Component } from "react";
import { Button, ButtonGroup, Col, FormGroup } from "react-bootstrap";
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

  convert(val, from, to) {
    switch (from) {
      case "base64":
        val = btoa(val);
        break;
      case "json":
        val = JSON.parse(val);
        break;
      case "text":
        break;
      case "yaml":
        val = YAML.parse(val);
        break;
      default:
        throw new Error();
    }
    console.log(val);
    switch (to) {
      case "base64":
        return atob(val);
      case "json":
        return JSON.stringify(val, null, 2);
      case "text":
        return text;
      case "yaml":
        return YAML.stringify(val);
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
        } catch (e) {
          console.log(e);
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
      <Form>
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
                  height="600"
                />
              </FormGroup>
            </Col>
          ))}
        </Form.Row>
      </Form>
    );
  }
}

export default Converter;
