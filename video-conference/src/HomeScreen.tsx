import React, { Component } from 'react';

interface Props {

}

interface State {
}

export default class HomeScreen extends Component<Props, State> {

  // Properties

  // Initialize

  constructor(props: Props) {
    super(props)

    this.state = {
      
    }
  }

  componentDidMount = () => {
    
  }

  // Methods

  // Render

  render = () => {
    return (
      <div style={mainContainer}>
        Hola :)
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