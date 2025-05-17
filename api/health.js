export default function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  
    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
  
    // Check if API key is configured
    const apiKeyConfigured = !!process.env.ANTHROPIC_API_KEY;
  
    // Return status
    res.status(200).json({
      status: 'ok',
      apiKeyConfigured,
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString()
    });
  }