// src/components/meta/AiAdvisor.js (Fixed Overflow Issue)
import React, { useState, useRef, useEffect } from 'react';
import { 
  checkServerRunning, 
  startClaudeServer, 
  subscribeToServerStatus 
} from '../../utils/claudeServerLauncher';

// API endpoint is now relative
const API_URL = '/api/ai-advisor';

const AiAdvisor = ({ analyticsData }) => {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Welcome to AI Advisor. Ask me anything about your ad performance data!' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [serverStatus, setServerStatus] = useState('unknown');
  const messagesEndRef = useRef(null);
  
  // Subscribe to server status changes
  useEffect(() => {
    // Check server status immediately
    checkServerRunning();
    
    // Subscribe to status updates
    const unsubscribe = subscribeToServerStatus(setServerStatus);
    return unsubscribe;
  }, []);
  
  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle checking/starting the serverless function
  const handleStartServer = async () => {
    setMessages(prev => [...prev, { 
      role: 'assistant', 
      content: 'Checking AI service availability...' 
    }]);
    
    const available = await startClaudeServer();
    
    if (!available) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Unable to connect to the AI service. The API key may not be configured correctly. Please contact support.' 
      }]);
    } else {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Connected to AI service! You can now ask your questions.' 
      }]);
    }
  };

  // Handle sending messages to AI API
  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    // Check server status first
    if (serverStatus !== 'running') {
      // Try to start/check the service
      const available = await startClaudeServer();
      if (!available) {
        // Add user message to chat
        const userMessage = { role: 'user', content: input };
        setMessages(prev => [...prev, 
          userMessage,
          { 
            role: 'assistant', 
            content: 'Sorry, the AI service is currently unavailable. Please try again later or contact support.' 
          }
        ]);
        setInput('');
        return;
      }
    }
    
    // Add user message to chat
    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    
    // Process the message
    await processUserMessage(userMessage);
  };
  
  // Process a user message and get a response from Claude
  const processUserMessage = async (userMessage) => {
    setIsLoading(true);
    
    try {
      // Get the account name or ID for context
      const accountInfo = analyticsData?.account?.name || 'this Meta ad account';
      
      // Create a system prompt that encourages conversational, targeted responses
      const systemPrompt = `You are an expert Meta Ads advisor helping with ${accountInfo}. 
      
      Here's the account data you have access to (only reference this when specifically asked about these metrics):
      - Total Impressions: ${analyticsData?.summary?.totalImpressions?.toLocaleString() || 'N/A'}
      - Total Clicks: ${analyticsData?.summary?.totalClicks?.toLocaleString() || 'N/A'}
      - Total Spend: $${analyticsData?.summary?.totalSpend?.toLocaleString() || 'N/A'}
      - CTR: ${analyticsData?.summary?.avgCtr?.toFixed(2) || 'N/A'}%
      - Conversions: ${analyticsData?.funnel?.purchases?.toLocaleString() || 'N/A'}
      - Conversion Rate: ${analyticsData?.advancedMetrics?.linkClickToConversion?.toFixed(2) || 'N/A'}%
      - Cost per Purchase: $${analyticsData?.advancedMetrics?.costPerPurchase?.toFixed(2) || 'N/A'}
      - ROAS: ${analyticsData?.advancedMetrics?.roas?.toFixed(2) || 'N/A'}x
      
      Creative performance data is also available if the user asks about it.
      
      Follow these important guidelines:
      1. Be conversational and friendly but professional
      2. NEVER provide a full analysis unless specifically asked - respond directly to what was asked
      3. For simple greetings like "hi" or "hello", just greet back and ask what they'd like to know about their Meta ads
      4. If the user asks a vague question, ask a follow-up question to clarify what specific aspect they're interested in
      5. Keep responses concise and focused on the user's specific question
      6. When appropriate, suggest a follow-up question to help them dig deeper
      7. When giving recommendations, be specific and actionable
      8. IMPORTANT: Keep your responses BRIEF. Aim for 3-5 sentences maximum for most responses.
      
      Remember that you're having a conversation with the user about their specific Meta ad account performance.`;
      
      // Create conversation history
      const conversationHistory = [
        { role: 'system', content: systemPrompt },
        ...messages.filter(m => m.role !== 'system'),
        userMessage
      ];
      
      console.log('Sending request to:', API_URL);
      
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: conversationHistory }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Received response:', data);
      
      // Add AI response to chat
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
      
      // Update server status to running since we got a successful response
      if (serverStatus !== 'running') {
        setServerStatus('running');
      }
    } catch (error) {
      console.error('Error getting AI response:', error);
      
      let errorMessage = 'Sorry, I encountered an error. Please try again later.';
      
      if (error.message && (
        error.message.includes('Failed to fetch') || 
        error.message.includes('Network Error')
      )) {
        // Update server status to offline
        setServerStatus('offline');
        errorMessage = 'Unable to connect to the AI service. Please try again later or contact support.';
      } else if (error.response) {
        errorMessage = `Server error (${error.response.status}): ${error.response.data?.error || 'Unknown error'}`;
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }
      
      setMessages(prev => [...prev, { role: 'assistant', content: errorMessage }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <span>AI Performance Advisor</span>
        
        {/* Server status indicator */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center',
          marginLeft: '10px',
          padding: '2px 8px',
          borderRadius: '12px',
          backgroundColor: serverStatus === 'running' 
            ? 'rgba(76, 175, 80, 0.1)' 
            : serverStatus === 'starting'
              ? 'rgba(255, 152, 0, 0.1)'
              : 'rgba(244, 67, 54, 0.1)',
          fontSize: '12px',
          color: serverStatus === 'running' 
            ? '#4CAF50' 
            : serverStatus === 'starting' 
              ? '#FF9800' 
              : '#f44336'
        }}>
          <div style={{ 
            width: '6px', 
            height: '6px', 
            borderRadius: '50%', 
            backgroundColor: serverStatus === 'running' 
              ? '#4CAF50' 
              : serverStatus === 'starting' 
                ? '#FF9800' 
                : '#f44336',
            marginRight: '4px' 
          }} />
          {serverStatus === 'running' ? 'Online' : serverStatus === 'starting' ? 'Connecting...' : 'Offline'}
        </div>
      </h3>
      
      {/* Increased height and added word-wrap for chat container */}
      <div 
        className="overflow-y-auto mb-4 p-3 border rounded bg-gray-50" 
        style={{
          height: "450px",
          wordBreak: "break-word",
          wordWrap: "break-word",
          overflowWrap: "break-word"
        }}
      >
        {messages.map((message, index) => (
          <div 
            key={`msg-${index}`}
            style={{
              marginBottom: "12px",
              padding: "12px",
              borderRadius: "6px",
              maxWidth: "90%", // Increased from 75% to allow more space
              marginLeft: message.role === 'user' ? 'auto' : '0',
              backgroundColor: message.role === 'user' ? '#e9f5ff' : '#f3f4f6',
              color: message.role === 'user' ? '#0066cc' : '#333',
              wordBreak: "break-word",  // Ensure text wraps properly
              overflowWrap: "break-word"
            }}
          >
            {message.content}
          </div>
        ))}
        {isLoading && (
          <div style={{
            padding: "12px",
            borderRadius: "6px",
            backgroundColor: "#f3f4f6",
            color: "#333"
          }}>
            <div style={{display: "flex", gap: "4px"}}>
              <div style={{width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#888", animation: "bounce 1s infinite"}}></div>
              <div style={{width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#888", animation: "bounce 1s infinite 0.2s"}}></div>
              <div style={{width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#888", animation: "bounce 1s infinite 0.4s"}}></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {serverStatus === 'offline' && (
        <div className="mb-4 p-3 border rounded bg-red-50" style={{ borderColor: '#ffcdd2' }}>
          <p className="text-red-700 mb-2">AI service is currently offline.</p>
          <button
            onClick={handleStartServer}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            style={{
              backgroundColor: "#0066cc",
              color: "white",
              padding: "6px 12px",
              borderRadius: "4px",
              border: "none",
              cursor: "pointer"
            }}
          >
            Start AI Service
          </button>
        </div>
      )}
      
      <div style={{display: "flex"}}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Ask about your ad performance..."
          disabled={isLoading || (serverStatus !== 'running' && serverStatus !== 'unknown')}
          style={{
            flexGrow: 1,
            padding: "8px",
            border: "1px solid #ccc",
            borderTopLeftRadius: "4px",
            borderBottomLeftRadius: "4px",
            outline: "none",
            opacity: serverStatus !== 'running' && serverStatus !== 'unknown' ? 0.7 : 1
          }}
        />
        <button
          onClick={handleSendMessage}
          disabled={isLoading || (serverStatus !== 'running' && serverStatus !== 'unknown')}
          style={{
            backgroundColor: isLoading || (serverStatus !== 'running' && serverStatus !== 'unknown') ? "#ccc" : "#0066cc",
            color: "white",
            padding: "8px 16px",
            borderTopRightRadius: "4px",
            borderBottomRightRadius: "4px",
            border: "none",
            cursor: isLoading || (serverStatus !== 'running' && serverStatus !== 'unknown') ? "default" : "pointer"
          }}
        >
          {isLoading ? 'Thinking...' : 'Send'}
        </button>
      </div>
      
      <div style={{marginTop: "12px", fontSize: "14px", color: "#666"}}>
        Try asking: "Which creative is performing best?" or "How can I improve my conversion rate?"
      </div>
    </div>
  );
};

export default AiAdvisor;