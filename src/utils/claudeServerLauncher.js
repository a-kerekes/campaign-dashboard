// src/utils/claudeServerLauncher.js
import axios from 'axios';

/**
 * Utility to check and launch the Claude API server
 */

// Server configuration
const SERVER_URL = 'http://localhost:5000';
const TEST_ENDPOINT = '/test';
const HEALTH_CHECK_INTERVAL = 60000; // 1 minute

// Store server status globally
let serverStatus = 'unknown'; // 'unknown', 'running', 'offline', 'starting'
let statusListeners = [];

// Subscribe to status changes
export const subscribeToServerStatus = (callback) => {
  statusListeners.push(callback);
  callback(serverStatus);
  return () => {
    statusListeners = statusListeners.filter(cb => cb !== callback);
  };
};

// Notify all listeners of status change
const updateStatus = (newStatus) => {
  serverStatus = newStatus;
  statusListeners.forEach(listener => listener(newStatus));
};

// Check if the server is running
export const checkServerRunning = async () => {
  try {
    const response = await axios.get(`${SERVER_URL}${TEST_ENDPOINT}`, { timeout: 3000 });
    if (response.data && response.data.message === 'Server is running correctly') {
      updateStatus('running');
      return true;
    } else {
      updateStatus('offline');
      return false;
    }
  } catch (error) {
    console.log('Server check failed:', error.message);
    updateStatus('offline');
    return false;
  }
};

// Start server based on environment
export const startClaudeServer = async () => {
  updateStatus('starting');
  
  // Try different methods based on environment
  const isElectron = window.electron !== undefined;
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  try {
    if (isElectron && window.electron.startClaudeServer) {
      // For Electron apps
      console.log('Starting Claude server via Electron IPC');
      await window.electron.startClaudeServer();
    } else if (window.require) {
      // For desktop apps with Node.js access
      try {
        // Dynamic import to avoid errors in browser environments
        const childProcess = window.require('child_process');
        const path = window.require('path');
        const serverScriptPath = path.resolve('./server/server.js');
        
        console.log('Starting Claude server via Node child_process:', serverScriptPath);
        childProcess.spawn('node', [serverScriptPath], {
          detached: true,
          stdio: 'ignore'
        });
      } catch (err) {
        console.error('Failed to start server via Node:', err);
        throw err;
      }
    } else if (isDevelopment) {
      // For development, show instructions to start manually
      console.warn('Please start the Claude API server manually:');
      console.warn('1. Open a new terminal');
      console.warn('2. Navigate to your project root');
      console.warn('3. Run: node server/server.js');
      
      // For demonstration purposes, we'll set a timeout to simulate startup
      // In real usage, you'd rely on the periodic health check to detect when it's started
      await new Promise(resolve => setTimeout(resolve, 2000));
    } else {
      console.error('Unable to start Claude server in this environment');
      updateStatus('offline');
      return false;
    }
    
    // Wait a moment for the server to start up
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check if server is now running
    const isRunning = await checkServerRunning();
    return isRunning;
  } catch (error) {
    console.error('Error starting Claude server:', error);
    updateStatus('offline');
    return false;
  }
};

// Initialize periodic health check
export const initServerMonitoring = () => {
  // Check immediately on init
  checkServerRunning();
  
  // Set up periodic checking
  const intervalId = setInterval(async () => {
    if (serverStatus !== 'starting') {
      await checkServerRunning();
    }
  }, HEALTH_CHECK_INTERVAL);
  
  // Return cleanup function
  return () => clearInterval(intervalId);
};

// Get current status
export const getServerStatus = () => serverStatus;