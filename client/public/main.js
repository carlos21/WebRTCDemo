const socketUrl = 'http://localhost:9000';

let videoContainerDiv = document.getElementById("videoContainer");
let statusLabel = document.getElementById("status");
let nameTextInput = document.getElementById("nameInput");
let goButton = document.getElementById("go");
let localVideo = document.getElementById("localVideo");
let remoteVideo = document.getElementById("remoteVideo");

let localStream, remoteStream, rtcPeerConnection, isCaller;
let roomNumber = '123456';

const iceServers = {
  iceServer: [
    {'urls': 'stun:stun.services.mozilla.com'},
    {'urls': 'stun:stun.l.google.com:19302'}
  ]
};

const streamConstraints = {
  audio: true,
  video: true
};

const onAddStream = (event) => {
  console.log("onAddStream", event);
  remoteVideo.srcObject = event.streams[0];
  remoteStream = event.streams[0];
};

const onIceCandidate = (event) => {
  if (event.candidate) {
    console.log('sending ice candidate', event.candidate);
    socket.emit('candidate', {
      type: 'candidate',
      label: event.candidate.sdpMLineIndex,
      id: event.candidate.sdpMid,
      candidate: event.candidate.candidate,
      room: roomNumber
    });
  }
};

const connect = () => {
  let error = null;

  socket = io(socketUrl, {
    authConnect: false
  });

  socket.on('connect', () => {
    console.log('Connected');
    statusLabel.innerHTML = 'Connected';

    socket.emit('authentication', {
      name: nameTextInput.value
    });
  });

  socket.on('unauthorized', (reason) => {
    console.log('Unauthorized: ', reason);
    error = reason.message;
    socket.disconnect();
  });

  socket.on('disconnect', (reason) => {
    console.log(`Disconnected: ${reason}`);
    statusLabel.innerHTML = `Disconnected: ${reason}`;
    error = null;
  });

  socket.on('joined', room => {
    console.log(`Joined to room ${room}`);

    navigator.mediaDevices.getUserMedia(streamConstraints)
      .then(stream => {
        localStream = stream;
        localVideo.srcObject = stream;
        isCaller = true;
        socket.emit('ready', room)
      })
      .catch(error => {
        console.log('An error occurred');
        console.log(error);
      });
    videoContainerDiv.style = "display:block";
  });

  socket.on('full', room => {
    console.log(`Room ${room} is full`);
  });

  socket.on('ready', () => {
    console.log(`Ready`);

    if (isCaller) {
      rtcPeerConnection = new RTCPeerConnection(iceServers);
      rtcPeerConnection.onicecandidate = onIceCandidate;
      rtcPeerConnection.ontrack = onAddStream;
      rtcPeerConnection.addTrack(localStream.getTracks()[0], localStream);
      rtcPeerConnection.addTrack(localStream.getTracks()[1], localStream);
      rtcPeerConnection.createOffer()
        .then(sessionDescription => {
          console.log('sending offer', sessionDescription);
          rtcPeerConnection.setLocalDescription(sessionDescription);
          socket.emit('offer', {
            type: 'offer',
            sdp: sessionDescription,
            room: roomNumber
          });
        })
        .catch(error => {
          console.log('An error ocurred - createPeerConnection', error);
        });
    }
  });

  socket.on('offer', sdp => {
    // if (!isCaller) {
      rtcPeerConnection = new RTCPeerConnection(iceServers);
      rtcPeerConnection.onicecandidate = onIceCandidate;
      rtcPeerConnection.ontrack = onAddStream;
      rtcPeerConnection.addTrack(localStream.getTracks()[0], localStream);
      rtcPeerConnection.addTrack(localStream.getTracks()[1], localStream);
      console.log('received offer', sdp);
      rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(sdp));
      rtcPeerConnection.createAnswer()
      .then(sessionDescription => {
        console.log('sending the answer', sessionDescription);
        rtcPeerConnection.setLocalDescription(sessionDescription);
        socket.emit('answer', {
          type: 'answer',
          sdp: sessionDescription,
          room: roomNumber
        });
      }).catch(error => {
        console.log("An error ocurred creating answer", error);
      });
    // }
  });

  socket.on('answer', sdp => {
    console.log('received answer', sdp);
    rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(sdp));
  });

  socket.on('candidate', event => {
    const candidate = new RTCIceCandidate({
      sdpMLineIndex: event.label,
      candidate: event.candidate
    });
    console.log('received candidate', candidate);
    rtcPeerConnection.addIceCandidate(candidate);
  });

  socket.open();
}

goButton.onclick = () => {
  connect();
};