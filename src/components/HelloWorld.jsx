import React, {Component} from 'react';
import {Col, FormText} from "react-bootstrap";

export class HelloWorld extends Component {
    render() {
        return (
            <div>
                <Row>
                    <Col >
                        <FormText/>
                    </Col>
                    <Col>
                        &larr; &rarr;
                    </Col>
                    <Col>
                        <FormText/>
                    </Col>
                </Row>
            </div>
        );
    }
}

export default HelloWorld;