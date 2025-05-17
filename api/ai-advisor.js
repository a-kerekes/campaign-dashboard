import { Anthropic } from '@anthropic-ai/sdk';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const apiKey = process.env.ANTHROPIC_API_KEY;
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
    
    // Initialize Anthropic client
    const anthropic = new Anthropic({ apiKey });
    
    // Call Claude API
    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      system: systemMessage,
      messages: chatMessages,
      max_tokens: 1000
    });
    
    console.log('Received response from Claude API');
    return res.json({ response: response.content[0].text });
  } catch (error) {
    console.error('Error calling Claude API:', error);
    
    let errorDetails = 'Unknown error';
    if (error.response) {
      errorDetails = error.response.data || error.response.statusText;
    } else if (error.message) {
      errorDetails = error.message;
    }
    
    return res.status(500).json({ 
      error: 'Failed to get AI response',
      details: errorDetails
    });
  }
}