// src/App.js
import React from 'react';
import './App.css';
import CombinedDashboard from './components/CombinedDashboard';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Campaign Analytics Dashboard</h1>
      </header>
      <main className="App-main">
        <CombinedDashboard />
      </main>
      <footer className="App-footer">
        <p>© 2025 Your Company Name</p>
      </footer>
    </div>
  );
}

export default App;
