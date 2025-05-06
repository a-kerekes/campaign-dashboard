// src/components/meta/MetaAuthButton.js
import React, { useState, useEffect } from 'react';
import { Button, CircularProgress, Box, Typography } from '@mui/material';
import { initFacebookSDK, login } from './metaAPI';

const MetaAuthButton = ({ onAuthSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sdkLoaded, setSdkLoaded] = useState(false);

  // Initialize Facebook SDK when component mounts
  useEffect(() => {
    const loadSdk = async () => {
      try {
        console.log("MetaAuthButton: Starting Facebook SDK initialization");
        console.log("App ID:", process.env.REACT_APP_FACEBOOK_APP_ID || 'Not found in env');
        await initFacebookSDK();
        setSdkLoaded(true);
        console.log("MetaAuthButton: Facebook SDK initialized successfully");
      } catch (err) {
        console.error('Failed to load Facebook SDK:', err);
        setError('Could not initialize Facebook SDK. ' + err.message);
      }
    };

    loadSdk();
  }, []);

  // Handle login
  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log("Starting authentication process, SDK loaded:", sdkLoaded);
      console.log("Window.FB available:", !!window.FB);
      
      if (!window.FB) {
        throw new Error("Facebook SDK not properly initialized. Try refreshing the page.");
      }
      
      const accessToken = await login();
      console.log("Authentication successful, token received");
      
      if (typeof onAuthSuccess === 'function') {
        onAuthSuccess(accessToken);
      } else {
        setError('Authentication callback not properly configured');
      }
    } catch (err) {
      console.error("Authentication error:", err);
      setError('Authentication failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box textAlign="center">
      <Button
        variant="contained"
        color="primary"
        onClick={handleLogin}
        disabled={loading || !sdkLoaded}
        sx={{ 
          backgroundColor: '#0866FF',
          padding: '10px 20px',
          fontSize: '16px',
          fontWeight: 'bold',
          textTransform: 'none',
          '&:hover': {
            backgroundColor: '#0756d6'
          }
        }}
      >
        {loading ? (
          <CircularProgress size={24} color="inherit" />
        ) : (
          <>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="#FFFFFF"
              style={{ marginRight: '10px' }}
            >
              <path d="M9.5 3H12.5V8H17.5V11H12.5V21H9.5V11H4.5V8H9.5V3Z" />
            </svg>
            Connect with Meta
          </>
        )}
      </Button>
      
      {error && (
        <Typography color="error" variant="body2" sx={{ mt: 2 }}>
          Error: {error}
        </Typography>
      )}
      
      {!sdkLoaded && !error && (
        <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
          Loading Facebook SDK...
        </Typography>
      )}
      
      <Box mt={3}>
        <Typography variant="caption" color="text.secondary">
          Note: Currently using mock data for development.
        </Typography>
      </Box>
    </Box>
  );
};

export default MetaAuthButton;