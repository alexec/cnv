import React, {Component} from 'react';
import {Button, Col, Container, Row} from "react-bootstrap";
import Form from "react-bootstrap/Form";

export class HelloWorld extends Component {
    detectType(s)  {
        if (s.startsWith('{')) {
            return 'json';
        }
        if (s.startsWith('[')) {
            return 'json';
        }
    }

    render() {
        return (
            <Container>
                <Form>
                    <Row>
                        <Col>
                            <Form.Text as="textarea" rows="10"/>
                            <Form.Text type='text' placeholder='...'/>
                        </Col>
                        <Col>
                            <Form.Text as="textarea" rows="10" />
                            <Form.Text type='text' placeholder='...'/>
                        </Col>
                    </Row>
                </Form>
            </Container>
        );
    }
}

export default HelloWorld;