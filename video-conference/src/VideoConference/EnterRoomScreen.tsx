import React, { Component, createRef } from 'react';
import PeerClient from '../connection/PeerClient';
import * as constants from '../constants';
import { config } from '../connection/Constants';
import { RouteComponentProps } from 'react-router';
import SocketContext from '../SocketContext';
import SocketEvent from '../connection/SocketEvent';
import LoadingStatus from './LoadingStatus';
import LoginService from '../services/LoginService';
import ConfirmModal from '../components/ConfirmModal';
import { style } from 'typestyle';
import { NestedCSSProperties } from 'typestyle/lib/types';

interface MatchParams {
  room: string;
}

interface Props extends RouteComponentProps<MatchParams> {

}

interface State {
  name: string;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  confirmTitle: string;
  confirmBody: string;
  confirmVisible: boolean;
  cameraStatus: LoadingStatus;
  authorizationStatus: LoadingStatus;
}

export default class EnterRoomScreen extends Component<Props, State> {

  // Properties

  peer?: PeerClient;
  loginService: LoginService;

  containerDiv = createRef<HTMLDivElement>();
  localVideo = createRef<HTMLVideoElement>();
  muteAudioButton = createRef<HTMLButtonElement>();
  muteVideoButton = createRef<HTMLButtonElement>();
  nameInputText = createRef<HTMLInputElement>();
  localStream?: MediaStream;

  // Initialize

  constructor(props: Props) {
    super(props)

    this.state = {
      cameraStatus: LoadingStatus.Idle,
      authorizationStatus: LoadingStatus.Idle,
      name: 'cduclos',
      isVideoEnabled: true,
      isAudioEnabled: true,
      confirmTitle: 'Confirm',
      confirmBody: '',
      confirmVisible: false
    }

    this.loginService = new LoginService();
  }

  componentDidMount = () => {  
    this.requestPermission();
    console.log('Room:', this.props.match.params.room);
  }

  // Methods

  getAudioTrack = (): MediaStreamTrack | undefined => {
    return this.localStream?.getTracks().find(track => track.kind === 'audio')
  }

  getVideoTrack = (): MediaStreamTrack | undefined => {
    return this.localStream?.getTracks().find(track => track.kind === 'video')
  }

  requestPermission = () => {
    this.setState({ cameraStatus: LoadingStatus.Loading });
    navigator.mediaDevices.getUserMedia(constants.streamConstraints)
      .then(stream => {
        this.localStream = stream;
        this.localVideo.current!.srcObject = stream;
        this.setState({ cameraStatus: LoadingStatus.Success });
      })
      .catch(error => {
        console.log('An error occurred');
        console.log(error);
        this.setState({ cameraStatus: LoadingStatus.Error });
      });
  }

  startConnection = (localStream: MediaStream, context: any, force: boolean) => {
    const username = this.nameInputText.current!.value;
    const room = this.props.match.params.room;
    this.loginService.login(username, result => {
      this.peer = new PeerClient(config, username, room, result.token, localStream, force);
      this.peer.on(SocketEvent.JoinedRoom, this.onJoinedRoom);
      this.peer.on(SocketEvent.ConfirmNewSession, this.onShowConfirmNewSession);
      this.peer.on(SocketEvent.Unauthorized, this.onUnauthorized);
      this.peer.authenticate();
      context.setPeer(this.peer);
    }, error => {
      console.log(":(  ", error);
    });
  }

  onShowConfirmNewSession = (payload: string) => {
    this.setState({
      confirmTitle: "Confirm",
      confirmBody: payload,
      confirmVisible: true
    });
  }

  onJoinedRoom = () => {
    console.log('onJoinedRoom');
    const room = this.props.match.params.room;
    console.log("Room", room);
    this.props.history.push(`/conference/${room}`, { 
      isAudioEnabled: this.state.isAudioEnabled,
      isVideoEnabled: this.state.isVideoEnabled
    });
  }

  onUnauthorized = () => {
    console.log('onUnauthorized');
  }

  onJoinPressed = (context: any) => {
    if (this.localStream) {
      this.startConnection(this.localStream, context, false);
    }
  }

  onNameChanged = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ name: event.target.value });
  }

  onConfirmPressed = () => {
    if (this.localStream) {
      this.startConnection(this.localStream, this.context, true);
    }
  }

  onCancel = () => {
    this.setState({
      confirmVisible: false
    });
  }

  onToggleAudio = () => {
    const enabled = !this.state.isAudioEnabled;
    this.setState({ isAudioEnabled: enabled });

    const track = this.getAudioTrack();
    if (track) {
      track.enabled = enabled;
    }
  }

  onToggleVideo = () => {
    const enabled = !this.state.isVideoEnabled;
    this.setState({ isVideoEnabled: enabled });

    const track = this.getVideoTrack();
    if (track) {
      track.enabled = enabled;
    }
  }

  // Render

  render = () => {
    return (
      <div style={mainContainer}>
        <div ref={this.containerDiv} style={container}>
          <div style={videoContainer}>

            <video 
              ref={this.localVideo} 
              style={video} 
              width="100%"
              height="100%"
              autoPlay 
              muted>  
            </video>

            <button 
              ref={this.muteAudioButton} 
              className={muteMicrophoneButton}
              onClick={this.onToggleAudio}>
              <i className={`fa fa-${this.state.isAudioEnabled ? "microphone" : "microphone-slash"}` } style={{color: "white"}}></i>
            </button>

            <button 
              ref={this.muteVideoButton} 
              className={muteVideoButton}
              onClick={this.onToggleVideo}>
              <i className={`fa fa-${this.state.isVideoEnabled ? "video" : "video-slash"}`} style={{ color: "white" }}></i>
            </button>

          </div>

          <div style={rightPanel}>
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
              <h2>Ready to Join?</h2>
              <input 
                ref={this.nameInputText} 
                style={input} 
                placeholder="Name" 
                type="text" 
                value={this.state.name}
                onChange={this.onNameChanged}>  
              </input>
              <SocketContext.Consumer>
                { context => {
                  return (
                    <button
                      style={button}
                      onClick={this.onJoinPressed.bind(this, context)}>
                      Join
                    </button>
                  )
                }}
              </SocketContext.Consumer>
            </div>
          </div>
        </div>

        <ConfirmModal
          title={this.state.confirmTitle}
          body={this.state.confirmBody}
          onConfirm={this.onConfirmPressed}
          onCancel={this.onCancel}
          visible={this.state.confirmVisible} />
      </div>
    )
  }
}

EnterRoomScreen.contextType = SocketContext;

const mainContainer: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  width: '100%',
  height: '100%'
};

const container: React.CSSProperties = {
  flexDirection: 'row',
  display: 'flex',
  width: '1000px',
  height: '400px'
};

const videoContainer: React.CSSProperties = {
  flex: 2,
  position: 'relative',
  height: '100%',
};

const rightPanel: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  height: '100%',
  marginLeft: '32px'
};

const video: React.CSSProperties = {
  border: '2px solid clear',
  backgroundColor: 'whitesmoke',
  borderRadius: '12px',
  objectFit: 'cover'
};

const roundProperties: NestedCSSProperties = {
  position: 'absolute',
  width: '50px',
  height: '50px',
  backgroundColor: 'transparent',
  borderColor: 'white',
  borderRadius: '25px',
  borderWidth: '2px',
  "-webkit-border-radius": '25px',
  bottom: 16,
  transform: 'translate(-50%, 0)',
  userSelect: 'none',
  textDecoration: 'none',
  $nest: {
    '&:hover': {
      backgroundColor: 'rgb(0, 96, 128)',
    },
    '&:focus': {
      outline: 'none'
    }
  }
};

const muteMicrophoneProperties = {
  left: '42%' 
};

const muteVideoProperties = {
  left: '58%'
};

const muteMicrophoneButton = style(roundProperties, muteMicrophoneProperties);
const muteVideoButton = style(roundProperties, muteVideoProperties);

const button: React.CSSProperties = {
  fontSize: 18,
  marginTop: 32,
  alignSelf: 'center',
  backgroundColor: 'rgb(37, 95, 148)',
  border: 'none',
  borderRadius: '5px',
  color: 'white',
  padding: '10px 20px 10px 20px',
  textAlign: 'center',
  textDecoration: 'none',
  outline: 'none'
};

const input: React.CSSProperties = {
  outline: 0,
  margin: '0px 48px 0px 48px',
  lineHeight: '100%',
  height: '40px',
  fontSize: 20,
  borderWidth: '0 0 2px',
  borderColor: 'rgb(192, 192, 192)',
  marginTop: 50
};