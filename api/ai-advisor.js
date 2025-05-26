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
    const { messages, creativeAnalysisData } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid messages format. Expected an array.' });
    }
    
    // Extract system message if present
    let systemMessage = messages.find(msg => msg.role === 'system')?.content || '';
    // Filter out system message and keep user/assistant messages
    const chatMessages = messages.filter(msg => msg.role !== 'system');
    
    // Enhance system message with creative analysis if data is provided
    if (creativeAnalysisData) {
      const enhancedSystemMessage = await enhanceSystemMessageWithCreativeAnalysis(
        systemMessage, 
        creativeAnalysisData
      );
      systemMessage = enhancedSystemMessage;
    }
    
    console.log('Sending request to Claude API...');
    
    // Initialize Anthropic client
    const anthropic = new Anthropic({ apiKey });
    
    // Determine if we need vision capabilities
    const imageAnalysisData = creativeAnalysisData?.imageCreatives?.filter(c => c.thumbnailUrl) || [];
    const needsVision = imageAnalysisData.length > 0 && 
                       chatMessages.some(msg => 
                         msg.content.toLowerCase().includes('image') || 
                         msg.content.toLowerCase().includes('visual') ||
                         msg.content.toLowerCase().includes('design') ||
                         msg.content.toLowerCase().includes('creative')
                       );
    
    let response;
    
    if (needsVision && imageAnalysisData.length > 0) {
      // Use Claude with vision for image analysis
      response = await analyzeCreativesWithVision(anthropic, systemMessage, chatMessages, imageAnalysisData);
    } else {
      // Standard text-only analysis
      response = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        system: systemMessage,
        messages: chatMessages,
        max_tokens: 1000
      });
    }
    
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

// Enhanced system message with creative analysis
async function enhanceSystemMessageWithCreativeAnalysis(systemMessage, creativeData) {
  const { videoCreatives = [], imageCreatives = [] } = creativeData;
  
  let enhancedMessage = systemMessage;
  
  // Add video pattern analysis
  if (videoCreatives.length > 0) {
    const videoAnalysis = analyzeVideoPatterns(videoCreatives);
    enhancedMessage += `\n\n=== VIDEO CREATIVE ANALYSIS ===\n${videoAnalysis}`;
  }
  
  // Add image creative summary (for vision analysis)
  if (imageCreatives.length > 0) {
    const imageAnalysis = summarizeImageCreatives(imageCreatives);
    enhancedMessage += `\n\n=== IMAGE CREATIVE SUMMARY ===\n${imageAnalysis}`;
  }
  
  return enhancedMessage;
}

// Analyze video creative patterns (metadata-based)
function analyzeVideoPatterns(videoCreatives) {
  const patterns = {
    byStyle: {},
    byTheme: {},
    byFormat: {}
  };
  
  // Group videos by characteristics and calculate average performance
  videoCreatives.forEach(creative => {
    const { metadata = {}, roas = 0, ctr = 0, spend = 0 } = creative;
    
    // Analyze by style
    const style = metadata.style || 'unknown';
    if (!patterns.byStyle[style]) {
      patterns.byStyle[style] = { count: 0, totalRoas: 0, totalCtr: 0, totalSpend: 0 };
    }
    patterns.byStyle[style].count++;
    patterns.byStyle[style].totalRoas += roas;
    patterns.byStyle[style].totalCtr += ctr;
    patterns.byStyle[style].totalSpend += spend;
    
    // Analyze by theme
    const theme = metadata.theme || 'unknown';
    if (!patterns.byTheme[theme]) {
      patterns.byTheme[theme] = { count: 0, totalRoas: 0, totalCtr: 0, totalSpend: 0 };
    }
    patterns.byTheme[theme].count++;
    patterns.byTheme[theme].totalRoas += roas;
    patterns.byTheme[theme].totalCtr += ctr;
    patterns.byTheme[theme].totalSpend += spend;
  });
  
  // Calculate averages and find best performers
  const bestStyles = Object.entries(patterns.byStyle)
    .map(([style, data]) => ({
      style,
      avgRoas: (data.totalRoas / data.count).toFixed(2),
      avgCtr: (data.totalCtr / data.count).toFixed(2),
      totalSpend: data.totalSpend.toFixed(2),
      count: data.count
    }))
    .sort((a, b) => b.avgRoas - a.avgRoas)
    .slice(0, 3);
  
  const bestThemes = Object.entries(patterns.byTheme)
    .map(([theme, data]) => ({
      theme,
      avgRoas: (data.totalRoas / data.count).toFixed(2),
      avgCtr: (data.totalCtr / data.count).toFixed(2),
      totalSpend: data.totalSpend.toFixed(2),
      count: data.count
    }))
    .sort((a, b) => b.avgRoas - a.avgRoas)
    .slice(0, 3);
  
  return `
TOP PERFORMING VIDEO STYLES:
${bestStyles.map(s => `• ${s.style}: ${s.avgRoas}x ROAS, ${s.avgCtr}% CTR (${s.count} videos, $${s.totalSpend} spend)`).join('\n')}

TOP PERFORMING VIDEO THEMES:
${bestThemes.map(t => `• ${t.theme}: ${t.avgRoas}x ROAS, ${t.avgCtr}% CTR (${t.count} videos, $${t.totalSpend} spend)`).join('\n')}

TOTAL VIDEO CREATIVES: ${videoCreatives.length}
  `.trim();
}

// Summarize image creatives for vision analysis
function summarizeImageCreatives(imageCreatives) {
  const topPerformers = imageCreatives
    .filter(c => c.thumbnailUrl)
    .sort((a, b) => (b.roas || 0) - (a.roas || 0))
    .slice(0, 5);
  
  const poorPerformers = imageCreatives
    .filter(c => c.thumbnailUrl && (c.roas || 0) < 1)
    .sort((a, b) => (a.roas || 0) - (b.roas || 0))
    .slice(0, 3);
  
  return `
TOP PERFORMING IMAGES (Available for Visual Analysis):
${topPerformers.map(c => `• Post ID ${c.postId}: ${(c.roas || 0).toFixed(2)}x ROAS, ${(c.ctr || 0).toFixed(2)}% CTR, $${(c.spend || 0).toFixed(2)} spend`).join('\n')}

UNDERPERFORMING IMAGES (Available for Visual Analysis):
${poorPerformers.map(c => `• Post ID ${c.postId}: ${(c.roas || 0).toFixed(2)}x ROAS, ${(c.ctr || 0).toFixed(2)}% CTR, $${(c.spend || 0).toFixed(2)} spend`).join('\n')}

TOTAL IMAGE CREATIVES: ${imageCreatives.length}
IMAGES WITH THUMBNAILS: ${imageCreatives.filter(c => c.thumbnailUrl).length}
  `.trim();
}

// Analyze creatives with Claude Vision (for images)
async function analyzeCreativesWithVision(anthropic, systemMessage, chatMessages, imageCreatives) {
  // For now, we'll analyze the top 2 performing images to avoid token limits
  const topImages = imageCreatives
    .filter(c => c.thumbnailUrl)
    .sort((a, b) => (b.roas || 0) - (a.roas || 0))
    .slice(0, 2);
  
  // Create vision messages
  const visionMessages = [];
  
  // Add the original chat context
  visionMessages.push(...chatMessages);
  
  // Add image analysis requests
  for (const creative of topImages) {
    try {
      // Fetch and encode image
      const imageBase64 = await fetchAndEncodeImage(creative.thumbnailUrl);
      
      visionMessages.push({
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: "image/jpeg",
              data: imageBase64
            }
          },
          {
            type: "text",
            text: `Analyze this image creative (Post ID: ${creative.postId}). Performance: ${(creative.roas || 0).toFixed(2)}x ROAS, ${(creative.ctr || 0).toFixed(2)}% CTR, $${(creative.spend || 0).toFixed(2)} spend. What visual elements might be contributing to this performance?`
          }
        ]
      });
    } catch (error) {
      console.error(`Error processing image for Post ID ${creative.postId}:`, error);
      // Continue with other images if one fails
    }
  }
  
  // Use Claude 3 Sonnet for vision capabilities
  return await anthropic.messages.create({
    model: 'claude-3-sonnet-20240229',
    system: systemMessage,
    messages: visionMessages,
    max_tokens: 1500
  });
}

// Helper function to fetch and encode images
async function fetchAndEncodeImage(imageUrl) {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    return base64;
  } catch (error) {
    console.error('Error fetching/encoding image:', error);
    throw error;
  }
}