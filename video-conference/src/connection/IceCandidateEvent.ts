export default interface IceCandidateEvent {
  type: string;
  sdpMLineIndex: number | null;
  sdpMid: string | null;
  candidate: string;
  room: string;
  socketId: string;
}