/**
 * Utility for Claude API status checking in serverless environments
 */

// Store server status globally
let serverStatus = 'unknown'; // 'unknown', 'running', 'offline', 'starting'
let statusListeners = [];

// API URL that's appropriate for the deployment environment
const API_URL = '/api';

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

// Check if the API is available
export const checkServerRunning = async () => {
  updateStatus('starting');
  
  try {
    const response = await fetch(`${API_URL}/health`);
    if (response.ok) {
      const data = await response.json();
      if (data.status === 'ok' && data.apiKeyConfigured) {
        updateStatus('running');
        return true;
      } else {
        console.error('API key not configured:', data);
        updateStatus('offline');
        return false;
      }
    } else {
      console.error('Health check failed:', response.status);
      updateStatus('offline');
      return false;
    }
  } catch (error) {
    console.error('Failed to check API health:', error);
    updateStatus('offline');
    return false;
  }
};

// In serverless environments, "starting" the server just means checking if 
// the API routes are responding
export const startClaudeServer = async () => {
  // This just re-checks the API health
  return await checkServerRunning();
};

// Initialize status monitoring
export const initServerMonitoring = () => {
  // Check immediately on init
  checkServerRunning();
  
  // Set up periodic checking
  const intervalId = setInterval(async () => {
    await checkServerRunning();
  }, 60000); // Check every minute
  
  // Return cleanup function
  return () => clearInterval(intervalId);
};

// Get current status
export const getServerStatus = () => serverStatus;