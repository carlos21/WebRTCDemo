import React from 'react';
import PeerClient from './connection/PeerClient';

export interface PeerDataContext {
  peer?: PeerClient;
}
let context: PeerDataContext = {
  peer: undefined
}
const SocketContext = React.createContext(context);
export default SocketContext;