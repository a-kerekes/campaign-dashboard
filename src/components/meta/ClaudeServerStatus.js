import React, { useState, useEffect } from 'react';
import { 
  startClaudeServer, 
  subscribeToServerStatus 
} from '../../utils/claudeServerLauncher';

/**
 * Component to display and manage Claude API server status
 * This can be embedded in your AI Advisor component or added to the navigation/header
 */
const ClaudeServerStatus = ({ className, showControls = true }) => {
  const [status, setStatus] = useState('unknown');
  const [isStarting, setIsStarting] = useState(false);

  // Subscribe to server status changes
  useEffect(() => {
    const unsubscribe = subscribeToServerStatus(setStatus);
    return unsubscribe;
  }, []);

  // Handle manual server start
  const handleStartServer = async () => {
    setIsStarting(true);
    try {
      await startClaudeServer();
      // Server status will be updated by the subscription
    } catch (error) {
      console.error('Failed to start server:', error);
    } finally {
      setIsStarting(false);
    }
  };

  // Styles based on status
  const getStatusColor = () => {
    switch (status) {
      case 'running':
        return '#4CAF50'; // Green
      case 'offline':
        return '#f44336'; // Red
      case 'starting':
        return '#FF9800'; // Orange
      case 'unknown':
      default:
        return '#9E9E9E'; // Gray
    }
  };

  // Status display text
  const getStatusText = () => {
    switch (status) {
      case 'running':
        return 'AI Service Online';
      case 'offline':
        return 'AI Service Offline';
      case 'starting':
        return 'Starting AI Service...';
      case 'unknown':
      default:
        return 'Checking AI Service...';
    }
  };

  return (
    <div className={className} style={{ 
      display: 'flex', 
      alignItems: 'center',
      padding: '4px 8px',
      borderRadius: '4px',
      backgroundColor: status === 'running' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)',
      marginLeft: '10px'
    }}>
      {/* Status indicator */}
      <div style={{ 
        width: '10px', 
        height: '10px', 
        borderRadius: '50%', 
        backgroundColor: getStatusColor(),
        marginRight: '8px'
      }} />
      
      {/* Status text */}
      <span style={{ 
        fontSize: '14px', 
        color: getStatusColor(),
        fontWeight: '500',
        marginRight: showControls ? '8px' : '0'
      }}>
        {getStatusText()}
      </span>
      
      {/* Start button - only show if offline and controls enabled */}
      {showControls && status === 'offline' && (
        <button 
          onClick={handleStartServer}
          disabled={isStarting}
          style={{
            fontSize: '12px',
            padding: '2px 8px',
            backgroundColor: isStarting ? '#ccc' : '#0066cc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isStarting ? 'default' : 'pointer',
            marginLeft: '8px'
          }}
        >
          {isStarting ? 'Starting...' : 'Start'}
        </button>
      )}
    </div>
  );
};

export default ClaudeServerStatus;