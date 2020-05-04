enum SocketEvent {
  JoinedRoom = "joined",
  Unauthorized = "unauthorized",
  Disconnected = "disconnected",
  ReceivedStream = "receivedStream",
  Message = "message",
  ConfirmNewSession = "confirmnewsession"
}

export default SocketEvent;