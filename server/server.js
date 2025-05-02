// server/server.js
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

// Debug API key status (without revealing the key)
const apiKey = process.env.ANTHROPIC_API_KEY;
console.log('API Key status:', apiKey ? 'API key is set' : 'API key is missing');
if (!apiKey) {
  console.error('WARNING: ANTHROPIC_API_KEY is not set in environment variables!');
}

const app = express();

// More specific CORS configuration
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000'], // Add your frontend URL
  methods: ['GET', 'POST'],
  credentials: true
}));

app.use(express.json());

// Add a test endpoint to verify the server is working
app.get('/test', (req, res) => {
  res.json({ message: 'Server is running correctly' });
});

// Log all incoming requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});

app.post('/api/ai-advisor', async (req, res) => {
  console.log('Received request to /api/ai-advisor');
  
  // Check if API key is set
  if (!apiKey) {
    return res.status(500).json({ error: 'API key is not configured on the server' });
  }
  
  try {
    const { messages } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid messages format. Expected an array.' });
    }
    
    // Extract system message if present
    const systemMessage = messages.find(msg => msg.role === 'system')?.content || '';
    // Filter out system message and keep user/assistant messages
    const chatMessages = messages.filter(msg => msg.role !== 'system');
    
    console.log('Sending request to Claude API...');
    console.log('Request payload:', JSON.stringify({
      model: 'claude-3-haiku-20240307',
      system: systemMessage ? 'System message is set' : 'No system message',
      messages: 'Chat messages array with ' + chatMessages.length + ' messages'
    }, null, 2));
    
    // For Claude API - with correct format
    const response = await axios.post('https://api.anthropic.com/v1/messages', {
      model: 'claude-3-haiku-20240307', // More cost-effective model
      system: systemMessage, // Pass system message as top-level parameter
      messages: chatMessages, // Pass only user/assistant messages in the array
      max_tokens: 1000
    }, {
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Received response from Claude API');
    res.json({ response: response.data.content[0].text });
  } catch (error) {
    console.error('Error calling AI API:');
    if (error.response) {
      console.error('Response error data:', error.response.data);
      console.error('Response error status:', error.response.status);
    } else if (error.request) {
      console.error('No response received');
    } else {
      console.error('Error message:', error.message);
    }
    
    res.status(500).json({ 
      error: 'Failed to get AI response',
      details: error.response?.data || error.message
    });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API endpoint available at http://localhost:${PORT}/api/ai-advisor`);
});