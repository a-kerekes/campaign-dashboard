// src/components/TestAuth.js
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

function TestAuth() {
  const { currentUser, signup } = useAuth();
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('password123');
  
  function handleSimpleClick() {
    console.log("Simple button clicked!");
    alert("Button works!");
  }
  
  async function handleTestSignup() {
    try {
      console.log("Attempting signup with:", email, password);
      const result = await signup(email, password);
      console.log("Signup result:", result);
    } catch (error) {
      console.error("Signup error:", error);
    }
  }
  
  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>Firebase Authentication Test</h2>
      <p>Current user: {currentUser ? currentUser.email : "None"}</p>
      
      <div style={{ marginBottom: '20px' }}>
        <label>Email: </label>
        <input 
          type="email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)}
          style={{ padding: '8px', marginLeft: '10px', width: '250px' }}
        />
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <label>Password: </label>
        <input 
          type="password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)}
          style={{ padding: '8px', marginLeft: '10px', width: '250px' }}
        />
      </div>
      
      <button 
        onClick={handleSimpleClick}
        style={{ 
          padding: '10px 15px', 
          backgroundColor: 'blue', 
          color: 'white', 
          border: 'none', 
          borderRadius: '4px',
          cursor: 'pointer',
          marginRight: '10px',
          position: 'relative',
          zIndex: 1000
        }}
      >
        Test Click
      </button>
      
      <button 
        onClick={handleTestSignup}
        style={{ 
          padding: '10px 15px', 
          backgroundColor: '#4CAF50', 
          color: 'white', 
          border: 'none', 
          borderRadius: '4px',
          cursor: 'pointer',
          position: 'relative',
          zIndex: 1000
        }}
      >
        Test Signup
      </button>
    </div>
  );
}

export default TestAuth;
