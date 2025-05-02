// src/components/TestAdmin.js
import React from 'react';
import { useNavigate } from 'react-router-dom';

function TestAdmin() {
  const navigate = useNavigate();
  
  return (
    <div style={{ padding: '50px', textAlign: 'center', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <h1 style={{ color: '#333', marginBottom: '20px' }}>Admin Dashboard Test</h1>
      <p>If you can see this, the admin routing is working correctly.</p>
      
      <div style={{ padding: '30px', backgroundColor: 'white', borderRadius: '8px', maxWidth: '600px', margin: '30px auto', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h2>Navigation</h2>
        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '15px' }}>
          <button 
            onClick={() => navigate('/dashboard')}
            style={{ 
              padding: '10px 20px', 
              backgroundColor: '#4285f4', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px', 
              cursor: 'pointer'
            }}
          >
            Back to Dashboard
          </button>
          <button 
            onClick={() => navigate('/creative-analytics')}
            style={{ 
              padding: '10px 20px', 
              backgroundColor: '#4CAF50', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px', 
              cursor: 'pointer'
            }}
          >
            Creative Analytics
          </button>
        </div>
      </div>
      
      <div style={{ padding: '30px', backgroundColor: 'white', borderRadius: '8px', maxWidth: '600px', margin: '30px auto', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h2>Admin Controls</h2>
        <p style={{ marginBottom: '20px' }}>This is a simple test component to verify the admin route is working. You would normally see the full AdminDashboard here.</p>
        <button 
          onClick={() => alert('Admin function working!')}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#f44336', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px', 
            cursor: 'pointer'
          }}
        >
          Test Admin Function
        </button>
      </div>
      
      <div style={{ marginTop: '40px', color: '#666' }}>
        <p>Admin routes are correctly configured if you can see this page.</p>
        <p>Check your browser console for any errors.</p>
      </div>
    </div>
  );
}

export default TestAdmin;