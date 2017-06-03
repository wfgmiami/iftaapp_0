import React, { Component } from 'react';
//import InputComponent from './InputComponent';
import MapElement from './MapElement';

class App extends Component {
  constructor(){
    super();
    this.state = {}
  }

  componentDidMount(){
	
  }

  render(){
    const map_key = process.env.MAP_KEY;
    return (
      <div className="container-fluid">
        <div className="well">
         <h3>INTERNATIONAL FUEL TAX AGREEMENT APP</h3>
		 <div><i>Helping motor carriers prepare their IFTA tax reporting</i></div>
        </div>
		<MapElement />
	 </div>
    )
  }
}

export default App;
