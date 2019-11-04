import Modal from "react-bootstrap/Modal";
import { Button } from "react-bootstrap";
import React from "react";

export const HelpModal = ({ show, onHide }) => (
  <Modal show={show} onHide={() => onHide()}>
    <Modal.Header closeButton>
      <Modal.Title>
        <img src="assets/favicon.png" /> Code Converter
      </Modal.Title>
    </Modal.Header>

    <Modal.Body>
      <blockquote>
        <p>
          <b>Code Chameleon</b> is a tool to convert between the most common
          encoding types.{" "}
        </p>
        <p>Why would you use this rather than other tools?</p>
        <ul>
          <li>Does not send your code to a third-party.</li>
          <li>Supports more encodings.</li>
        </ul>
      </blockquote>
    </Modal.Body>

    <Modal.Footer>
      <Button variant="secondary" onClick={() => onHide()}>
        Close
      </Button>
    </Modal.Footer>
  </Modal>
);
