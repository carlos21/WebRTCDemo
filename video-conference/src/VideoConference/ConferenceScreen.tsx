import React, { Component, createRef } from 'react';
import './conference.css';
import { RouteComponentProps, StaticContext } from 'react-router';
import * as constants from '../constants';
import SocketContext from '../SocketContext';
import PeerClient from '../connection/PeerClient';
import SocketEvent from '../connection/SocketEvent';

interface MatchParams {
  room: string;
  
}

interface LocationState {
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
}

interface Props extends RouteComponentProps<MatchParams, StaticContext, LocationState> {
  
}

// interface Props extends RouteComponentProps<MatchParams> {
  
// }

interface State {
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
}

export default class ConferenceScreen extends Component<Props, State> {

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
      isAudioEnabled: this.props.location.state.isAudioEnabled,
      isVideoEnabled: this.props.location.state.isVideoEnabled
    }
  }

  componentDidMount = () => {
    this.peer = this.context.peer;
    this.peer?.on(SocketEvent.ReceivedStream, this.onStreamReceived);
    this.peer?.on(SocketEvent.RemoteAudioMuted, this.onRemoteAudioMuted);
    this.peer?.on(SocketEvent.RemoteVideoMuted, this.onRemoteVideoMuted);
    this.requestPermission();
  }

  getAudioTrack = (stream?: MediaStream): MediaStreamTrack | undefined => {
    return stream?.getTracks().find(track => track.kind === 'audio')
  }

  getVideoTrack = (stream?: MediaStream): MediaStreamTrack | undefined => {
    return stream?.getTracks().find(track => track.kind === 'video')
  }

  onStreamReceived = (remoteStream: MediaStream) => {
    console.log("onReceivedStream");
    this.remoteStream = remoteStream;

    if (this.remoteVideo.current) {
      this.remoteVideo.current.srcObject = remoteStream;
    }
  }

  onRemoteAudioMuted = (enabled: boolean) => {
    console.log("onRemoteAudioMuted", enabled);
    const track = this.getAudioTrack(this.remoteStream);
    if (track) {
      track.enabled = enabled;
    }
  }

  onRemoteVideoMuted = (enabled: boolean) => {
    console.log("onRemoteVideoMuted", enabled);
    const track = this.getVideoTrack(this.remoteStream);
    if (track) {
      track.enabled = enabled;
    }
  }

  requestPermission = () => {
    navigator.mediaDevices.getUserMedia(constants.streamConstraints)
      .then(stream => {
        this.localStream = stream;
        if (this.localVideo.current) {
          this.localVideo.current.srcObject = stream;
        }
      })
      .catch(error => {
        console.log('An error occurred');
        console.log(error);
      });
  }

  onToggleAudio = () => {
    const enabled = !this.state.isAudioEnabled;
    this.setState({ isAudioEnabled: enabled });

    const track = this.getAudioTrack(this.localStream);
    if (track) {
      track.enabled = enabled;
      this.peer?.emit("mute-audio", enabled);
    }
  }

  onToggleVideo = () => {
    console.log("onToggleVideo");
    const enabled = !this.state.isVideoEnabled;
    this.setState({ isVideoEnabled: enabled });

    const track = this.getVideoTrack(this.localStream);
    if (track) {
      track.enabled = enabled;
      this.peer?.emit("mute-video", enabled);
    }

    // this.peer?.toggleVideo(enabled);
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
            autoPlay>
          </video>

          <video
            ref={this.localVideo}
            className="localVideo"
            width="200"
            height="200"
            autoPlay 
            muted>
          </video>

          <div className="buttonsContainer">
            <button
              // ref={this.muteAudioButton}
              className="roundButton"
              style={{ marginRight: '15px' }}
              onClick={this.onToggleAudio}>
              <i className={`fa fa-${this.state.isAudioEnabled ? "microphone" : "microphone-slash"}`} style={{ color: "white" }}></i>
            </button>

            <button
              // ref={this.muteVideoButton}
              className="roundButton"
              style={{ marginLeft: '15px' }}
              onClick={this.onToggleVideo}>
              <i className={`fa fa-${this.state.isVideoEnabled ? "video" : "video-slash"}`} style={{ color: "white" }}></i>
            </button>
          </div>
        </div>
        <div className="rightPanel"></div>
      </div>
    )
  }
}

ConferenceScreen.contextType = SocketContext;