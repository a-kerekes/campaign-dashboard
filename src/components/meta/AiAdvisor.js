// src/components/meta/AiAdvisor.js
import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

// Define API URL based on environment
const API_URL = process.env.NODE_ENV === 'production'
  ? '/api/ai-advisor'  // Production URL (relative path for serverless function)
  : 'http://localhost:5000/api/ai-advisor';  // Development URL

const AiAdvisor = ({ analyticsData }) => {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Welcome to AI Advisor. Ask me anything about your ad performance data!' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  
  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle sending messages to AI API
  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    // Add user message to chat
    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      // Prepare context data from analytics to add to the prompt
      const contextData = {
        totalImpressions: analyticsData?.summary?.totalImpressions || 0,
        totalClicks: analyticsData?.summary?.totalClicks || 0,
        totalSpend: analyticsData?.summary?.totalSpend || 0,
        ctr: analyticsData?.summary?.avgCtr || 0,
        conversions: analyticsData?.funnel?.purchases || 0,
        conversionRate: analyticsData?.advancedMetrics?.linkClickToConversion || 0,
        costPerPurchase: analyticsData?.advancedMetrics?.costPerPurchase || 0,
        roas: analyticsData?.advancedMetrics?.roas || 0
      };
      
      // Create conversation history including context
      const conversationHistory = [
        { role: 'system', content: `You are an expert Meta Ads advisor analyzing the following data:
          ${JSON.stringify(contextData, null, 2)}
          
          Provide specific, actionable advice based on this data. Focus on identifying issues and suggesting improvements. Be concise and practical in your recommendations.` 
        },
        ...messages.filter(m => m.role !== 'system'),
        userMessage
      ];
      
      console.log('Sending request to:', API_URL);
      
      // Try primary API endpoint
      const response = await axios.post(API_URL, {
        messages: conversationHistory
      });
      
      console.log('Received response:', response.data);
      
      // Add AI response to chat
      setMessages(prev => [...prev, { role: 'assistant', content: response.data.response }]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      
      let errorMessage = 'Sorry, I encountered an error. Please try again later.';
      
      if (error.response) {
        console.error('Error response:', error.response.data);
        console.error('Error status:', error.response.status);
        errorMessage = `Server error (${error.response.status}): ${error.response.data?.error || 'Unknown error'}`;
      } else if (error.request) {
        console.error('No response received:', error.request);
        errorMessage = 'No response from server. Please check if the API server is running.';
      }
      
      setMessages(prev => [...prev, { role: 'assistant', content: errorMessage }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <h3 className="text-lg font-semibold mb-4">AI Performance Advisor</h3>
      
      <div className="h-80 overflow-y-auto mb-4 p-3 border rounded bg-gray-50" style={{height: "320px"}}>
        {messages.map((message, index) => (
          <div 
            key={`msg-${index}`}
            style={{
              marginBottom: "12px",
              padding: "12px",
              borderRadius: "6px",
              maxWidth: "75%",
              marginLeft: message.role === 'user' ? 'auto' : '0',
              backgroundColor: message.role === 'user' ? '#e9f5ff' : '#f3f4f6',
              color: message.role === 'user' ? '#0066cc' : '#333'
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
      
      <div style={{display: "flex"}}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Ask about your ad performance..."
          style={{
            flexGrow: 1,
            padding: "8px",
            border: "1px solid #ccc",
            borderTopLeftRadius: "4px",
            borderBottomLeftRadius: "4px",
            outline: "none"
          }}
        />
        <button
          onClick={handleSendMessage}
          disabled={isLoading}
          style={{
            backgroundColor: isLoading ? "#ccc" : "#0066cc",
            color: "white",
            padding: "8px 16px",
            borderTopRightRadius: "4px",
            borderBottomRightRadius: "4px",
            border: "none",
            cursor: isLoading ? "default" : "pointer"
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
