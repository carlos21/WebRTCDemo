import React, { Component } from 'react';
import './App.css';
import EnterRoomScreen from './VideoConference/EnterRoomScreen';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import ConferenceScreen from './VideoConference/ConferenceScreen';
import SocketContext from './SocketContext';
import PeerClient from './connection/PeerClient';
import HomeScreen from './HomeScreen';

interface Props { }

interface State {
  peer?: PeerClient;
  setPeer: (peer: PeerClient) => void;
}

class App extends Component<Props, State> {

  constructor(props: Props) {
    super(props);

    this.state = {
      setPeer: this.setPeer
    }
  }

  componentDidMount = () => {
    console.log('App - componentDidMount');
  }

  setPeer = (peer: PeerClient) => {
    this.setState({ peer: peer });
  }

  render = () => {
    return (
      // <MemoryRouter initialEntries={["/:room"]}>
      //   <div className="App">
      //     <SocketContext.Provider value={this.state}>
      //       <Route path="/" exact component={HomeScreen} />
      //       <Route path="/:room" exact component={EnterRoomScreen} />
      //       <Route path="/room/:room" exact component={ConferenceScreen} />
      //     </SocketContext.Provider>
      //   </div>
      // </MemoryRouter>

      <Router>
        <div className="App">
          <SocketContext.Provider value={this.state}>
            <Route path="/" exact component={HomeScreen} />
            <Route path="/:room" exact component={EnterRoomScreen} />
            <Route path="/conference/:room" exact component={ConferenceScreen} />
          </SocketContext.Provider>
        </div>
      </Router>
    );
  }
}

export default App;
