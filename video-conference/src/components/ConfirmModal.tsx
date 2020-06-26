import React, { Component } from 'react';
import { Modal, Button } from 'react-bootstrap';

interface State {

}

interface Props {
  title: string;
  body: string;
  visible: boolean;
  alertType: 'confirm' | 'alert';
  onDismiss?: () => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export default class ConfirmModal extends Component<Props, State> {

  renderCancel = () => {
    if (this.props.alertType === 'alert') {
      return null;
    }
    
    return (
      <Button variant="secondary" onClick={this.props.onCancel}>
        Cancel
      </Button>
    )
  }
  render = () => {
    return (
      <Modal animation={false} show={this.props.visible} onHide={this.props.onDismiss}>
        <Modal.Header closeButton>
          <Modal.Title>{this.props.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>{this.props.body}</Modal.Body>
        <Modal.Footer>
          {this.renderCancel()}
          <Button variant="primary" onClick={this.props.onConfirm}>
            Ok
          </Button>
        </Modal.Footer>
      </Modal>
    );
  }
}