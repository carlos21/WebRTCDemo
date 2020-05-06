import React, { Component } from 'react';
import { Modal, Button } from 'react-bootstrap';

interface State {

}

interface Props {
  title: string;
  body: string;
  visible: boolean;
  onDismiss?: () => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export default class ConfirmModal extends Component<Props, State> {

  render = () => {
    return (
      <Modal animation={false} show={this.props.visible} onHide={this.props.onDismiss}>
        <Modal.Header closeButton>
          <Modal.Title>{this.props.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>{this.props.body}</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={this.props.onCancel}>
            Close
          </Button>
          <Button variant="primary" onClick={this.props.onConfirm}>
            Confirm
          </Button>
        </Modal.Footer>
      </Modal>
    );
  }
}