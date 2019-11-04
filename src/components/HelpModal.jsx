import Modal from "react-bootstrap/Modal";
import { Button } from "react-bootstrap";
import React from "react";

export const HelpModal = (show, onHide) => <Modal show={show} onHide={onHide}>
  <Modal.Header closeButton>
    <Modal.Title>
      {" "}
      <i className="fa fa-code logo"/> Code
      Converter
    </Modal.Title>
  </Modal.Header>

  <Modal.Body>
    <blockquote>
      <p>
        I am a <b>software engineer</b>,
      </p>
      <p>
        I am trying to{" "}
        <b>
          convert code between different encodings, such as JSON and
          YAML, reliably and quickly.
        </b>
        ,{" "}
      </p>
      <p>
        but{" "}
        <b>
          I have to use many different websites and tools, some of which
          send my data to a third-party server
        </b>
        ,
      </p>
      <p>
        because <b>nothing currently exists</b>,
      </p>
      <p>
        which makes me feel <b>frustrated and worried</b>.
      </p>
    </blockquote>
  </Modal.Body>

  <Modal.Footer>
    <Button variant="secondary" onClick={() => this.closeModal()}>
      Close
    </Button>
  </Modal.Footer>
</Modal>;