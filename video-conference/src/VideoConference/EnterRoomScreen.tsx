import React, { Component, createRef } from 'react';
import PeerClient from '../connection/PeerClient';
import * as constants from '../constants';
import { config, serverURI } from '../connection/Constants';
import { RouteComponentProps } from 'react-router';
import SocketContext from '../SocketContext';
import SocketEvent from '../connection/SocketEvent';
import LoadingStatus from './LoadingStatus';

interface MatchParams {
  room: string;
}

interface Props extends RouteComponentProps<MatchParams> {

}

interface State {
  name: string;
  cameraStatus: LoadingStatus;
  authorizationStatus: LoadingStatus;
}

export default class EnterRoomScreen extends Component<Props, State> {

  // Properties

  peer?: PeerClient;

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
      name: 'Carlos'
    }
  }

  componentDidMount = () => {
    console.log('EnterRoomScreen - componentDidMount');
    console.log(serverURI);
    this.requestPermission();
    console.log('Room:', this.props.match.params.room);
  }

  // Methods

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

  startConnection = (localStream: MediaStream, context: any) => {
    this.peer = new PeerClient(config, this.nameInputText.current!.value, localStream);
    this.peer.on(SocketEvent.Authorized, this.onAuthorized);
    this.peer.on(SocketEvent.Unauthorized, this.onUnauthorized);
    this.peer.authenticate();
    context.setPeer(this.peer);
  }

  onAuthorized = () => {
    console.log('onAuthorized');
    const room = this.props.match.params.room;
    this.props.history.push(`/room/${room}`);
  }

  onUnauthorized = () => {
    console.log('onUnauthorized');
  }

  onJoinPressed = (context: any) => {
    if (this.localStream) {
      this.startConnection(this.localStream, context);
    }
  }

  onNameChanged = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ name: event.target.value });
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
              autoPlay muted>  
            </video>

            <button 
              ref={this.muteAudioButton} 
              style={{ ...roundButton, ...muteMicrophoneButton}}>
                A
            </button>

            <button 
              ref={this.muteVideoButton} 
              style={{ ...roundButton, ...muteVideoButton }}>
                B
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
      </div>
    )
  }
}

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

const roundButton: React.CSSProperties = {
  width: '50px',
  height: '50px',
  backgroundColor: 'rgb(37, 95, 148)',
  borderRadius: '25px'
};

const muteMicrophoneButton: React.CSSProperties = {
  position: 'absolute',
  bottom: 16,
  left: '42%',
  transform: 'translate(-50%, 0)'
};

const muteVideoButton: React.CSSProperties = {
  position: 'absolute',
  bottom: 16,
  left: '58%',
  transform: 'translate(-50%, 0)'
};

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