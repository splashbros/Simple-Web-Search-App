import React from 'react';
import './App.css';
import SearchBar from './components/SearchBar';
import govtechLogo from './components/govtechlogo.png'; // Make sure to add this image to your assets folder

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <div className="logo-container">
          <img src={govtechLogo} alt="GovTech Logo" className="govtech-logo" />
          <h1>GovTech Search</h1>
        </div>
        <SearchBar />
      </header>
    </div>
  );
}

export default App;