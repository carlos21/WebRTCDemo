import React, { Component, createRef } from 'react';
// import PeerClient from '../connection/PeerClient';
// import * as constants from '../constants';
// import { config } from '../connection/Constants';
// import { RouteComponentProps } from 'react-router';
// import SocketContext from '../SocketContext';
// import SocketEvent from '../connection/SocketEvent';
// import LoadingStatus from './LoadingStatus';
// import LoginService from '../services/LoginService';
// import ConfirmModal from '../components/ConfirmModal';
// import { style } from 'typestyle';
// import { NestedCSSProperties } from 'typestyle/lib/types';

interface Props {
  onPermissionAdquired: (stream: MediaStream) => void;
}

interface State {
  isAudio: boolean;
  isVideo: boolean;
}

export default class Video extends Component<Props, State> {

//   // Properties
  
//   localStream?: MediaStream;

//   // Initialize

//   constructor(props: Props) {
//     super(props)

//     this.state = {
//       isVideo: true,
//       isAudio: true
//     }
//   }

//   // Methods

//   requestPermission = () => {
//     navigator.mediaDevices.getUserMedia(constants.streamConstraints)
//       .then(stream => {
//         this.localStream = stream;
//         // this.localVideo.current!.srcObject = stream;
//         this.props.onPermissionAdquired(stream);
//       })
//       .catch(error => {
//         console.log('An error occurred');
//         console.log(error);
//       });
//   }

//   onToggleAudio = () => {
//     this.setState({ isAudio: !this.state.isAudio })
//   }

//   onToggleVideo = () => {
//     this.setState({ isVideo: !this.state.isVideo })
//   }

//   // Render

//   render = () => {
//     return (
//       <div style={videoContainer}>

//         <video
//           ref={this.localVideo}
//           style={video}
//           width="100%"
//           height="100%"
//           autoPlay muted>
//         </video>

//         <button
//           ref={this.muteAudioButton}
//           className={muteMicrophoneButton}
//           onClick={this.onToggleAudio}>
//           <i className={`fa fa-${this.state.isAudioEnabled ? "microphone" : "microphone-slash"}`} style={{ color: "white" }}></i>
//         </button>

//         <button
//           ref={this.muteVideoButton}
//           className={muteVideoButton}
//           onClick={this.onToggleVideo}>
//           <i className={`fa fa-${this.state.isVideoEnabled ? "video" : "video-slash"}`} style={{ color: "white" }}></i>
//         </button>

//       </div>
//     )
//   }
}

// EnterRoomScreen.contextType = SocketContext;

// const mainContainer: React.CSSProperties = {
//   flex: 1,
//   display: 'flex',
//   justifyContent: 'center',
//   alignItems: 'center',
//   width: '100%',
//   height: '100%'
// };

// const container: React.CSSProperties = {
//   flexDirection: 'row',
//   display: 'flex',
//   width: '1000px',
//   height: '400px'
// };

// const videoContainer: React.CSSProperties = {
//   flex: 2,
//   position: 'relative',
//   height: '100%',
// };

// const rightPanel: React.CSSProperties = {
//   flex: 1,
//   display: 'flex',
//   justifyContent: 'center',
//   alignItems: 'center',
//   height: '100%',
//   marginLeft: '32px'
// };

// const video: React.CSSProperties = {
//   border: '2px solid clear',
//   backgroundColor: 'whitesmoke',
//   borderRadius: '12px',
//   objectFit: 'cover'
// };

// const roundProperties: NestedCSSProperties = {
//   position: 'absolute',
//   width: '50px',
//   height: '50px',
//   backgroundColor: 'transparent',
//   borderColor: 'white',
//   borderRadius: '25px',
//   borderWidth: '2px',
//   bottom: 16,
//   transform: 'translate(-50%, 0)',
//   $nest: {
//     '&:hover': {
//       backgroundColor: 'rgb(0, 96, 128)',
//     }
//   }
// };

// const muteMicrophoneProperties = {
//   left: '42%'
// };

// const muteVideoProperties = {
//   left: '58%'
// };

// const muteMicrophoneButton = style(roundProperties, muteMicrophoneProperties);
// const muteVideoButton = style(roundProperties, muteVideoProperties);

// const button: React.CSSProperties = {
//   fontSize: 18,
//   marginTop: 32,
//   alignSelf: 'center',
//   backgroundColor: 'rgb(37, 95, 148)',
//   border: 'none',
//   borderRadius: '5px',
//   color: 'white',
//   padding: '10px 20px 10px 20px',
//   textAlign: 'center',
//   textDecoration: 'none',
//   outline: 'none'
// };

// const input: React.CSSProperties = {
//   outline: 0,
//   margin: '0px 48px 0px 48px',
//   lineHeight: '100%',
//   height: '40px',
//   fontSize: 20,
//   borderWidth: '0 0 2px',
//   borderColor: 'rgb(192, 192, 192)',
//   marginTop: 50
// };