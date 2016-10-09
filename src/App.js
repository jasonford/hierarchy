import React from 'react';
import ImportanceChart from './ImportanceChart'
import './FirebaseInstance';
import './App.css';

let App = React.createClass({
  render() {
    return (
      <div className="App">
        <ImportanceChart elementKey="/" />
      </div>
    );
  }
});

export default App;