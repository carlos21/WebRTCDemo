import React, { Component, createRef } from 'react';
import './conference.css';
import { RouteComponentProps } from 'react-router';
import * as constants from '../constants';
import SocketContext from '../SocketContext';
import PeerClient from '../connection/PeerClient';
import SocketEvent from '../connection/SocketEvent';

interface MatchParams {
  room: string;
}

// interface LocationState {
//   localStream: MediaStream;
// }

// interface Props extends RouteComponentProps<MatchParams, StaticContext, LocationState> {

// }

interface Props extends RouteComponentProps<MatchParams> {

}

export default class ConferenceScreen extends Component<Props> {

  // Properties

  peer?: PeerClient;
  localVideo = createRef<HTMLVideoElement>();
  remoteVideo = createRef<HTMLVideoElement>();
  localStream?: MediaStream;
  remoteStream?: MediaStream;

  // Initialize

  constructor(props: Props) {
    super(props)

    this.state = {

    }
  }

  componentDidMount = () => {
    this.peer = this.context.peer;
    this.peer?.on(SocketEvent.ReceivedStream, this.onStreamReceived);
    this.requestPermission();
  }

  onStreamReceived = (remoteStream: MediaStream) => {
    console.log("onReceivedStream");
    this.remoteStream = remoteStream;
    this.remoteVideo.current!.srcObject = remoteStream;
  }

  requestPermission = () => {
    navigator.mediaDevices.getUserMedia(constants.streamConstraints)
      .then(stream => {
        this.localStream = stream;
        this.localVideo.current!.srcObject = stream;
      })
      .catch(error => {
        console.log('An error occurred');
        console.log(error);
      });
  }

  // Render

  render = () => {
    return (
      <div className="mainContainer">
        <div className="leftPanel">
          <video
            ref={this.remoteVideo}
            className="remoteVideo"
            width="100%"
            height="100%"
            autoPlay muted>
          </video>
          <video
            ref={this.localVideo}
            className="localVideo"
            width="200"
            height="200"
            autoPlay muted>
          </video>
        </div>
        <div className="rightPanel"></div>
      </div>
    )
  }
}

ConferenceScreen.contextType = SocketContext;