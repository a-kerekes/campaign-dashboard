// pages/api/ai-advisor.js - Enhanced Version with Creative Analysis
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
                         msg.content.toLowerCase().includes('creative') ||
                         msg.content.toLowerCase().includes('picture') ||
                         msg.content.toLowerCase().includes('thumbnail') ||
                         msg.content.toLowerCase().includes('analyze') ||
                         msg.content.toLowerCase().includes('compare')
                       );
    
    // Add enhanced debug logging
    console.log('🔍 VISION DEBUG:', {
      needsVision,
      imageAnalysisDataLength: imageAnalysisData.length,
      chatMessagesWithKeywords: chatMessages.filter(msg => 
        msg.content.toLowerCase().includes('image') || 
        msg.content.toLowerCase().includes('visual') ||
        msg.content.toLowerCase().includes('analyze')
      ),
      sampleImageUrl: imageAnalysisData[0]?.thumbnailUrl
    });
    
    let response;
    
    if (needsVision && imageAnalysisData.length > 0) {
      console.log(`🎨 Using vision analysis for ${imageAnalysisData.length} images`);
      console.log('🔍 Sample thumbnail URLs:', imageAnalysisData.slice(0, 3).map(c => c.thumbnailUrl));
      
      // Use Claude with vision for image analysis
      response = await analyzeCreativesWithVision(anthropic, systemMessage, chatMessages, imageAnalysisData);
    } else {
      console.log('📝 Using text-only analysis');
      console.log('🔍 Vision not triggered because:', {
        needsVision,
        imageCount: imageAnalysisData.length,
        keywordMatch: chatMessages.some(msg => 
          msg.content.toLowerCase().includes('image') || 
          msg.content.toLowerCase().includes('visual') ||
          msg.content.toLowerCase().includes('analyze')
        )
      });
      
      // Standard text-only analysis
      response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
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
  
  // Add creative insights guidelines
  enhancedMessage += `\n\n=== CREATIVE ANALYSIS GUIDELINES ===
When analyzing creatives, focus on:
1. **Performance Patterns**: Which creative types/themes perform best
2. **Visual Elements**: Colors, composition, text overlay effectiveness
3. **Message Clarity**: How well the value proposition comes across
4. **Call-to-Action**: Effectiveness of CTAs and their placement
5. **Brand Consistency**: How well creatives align with brand guidelines
6. **Audience Resonance**: Which visuals resonate with different demographics
7. **Actionable Insights**: Specific recommendations for improvement

Always provide concrete, actionable recommendations based on the data.`;
  
  return enhancedMessage;
}

// Analyze video creative patterns (metadata-based)
function analyzeVideoPatterns(videoCreatives) {
  const patterns = {
    byStyle: {},
    byTheme: {},
    byFormat: {},
    byDuration: {}
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
    
    // Analyze by format
    const format = metadata.format || 'unknown';
    if (!patterns.byFormat[format]) {
      patterns.byFormat[format] = { count: 0, totalRoas: 0, totalCtr: 0, totalSpend: 0 };
    }
    patterns.byFormat[format].count++;
    patterns.byFormat[format].totalRoas += roas;
    patterns.byFormat[format].totalCtr += ctr;
    patterns.byFormat[format].totalSpend += spend;
    
    // Analyze by duration
    const duration = metadata.duration || 'unknown';
    if (!patterns.byDuration[duration]) {
      patterns.byDuration[duration] = { count: 0, totalRoas: 0, totalCtr: 0, totalSpend: 0 };
    }
    patterns.byDuration[duration].count++;
    patterns.byDuration[duration].totalRoas += roas;
    patterns.byDuration[duration].totalCtr += ctr;
    patterns.byDuration[duration].totalSpend += spend;
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

  const bestFormats = Object.entries(patterns.byFormat)
    .map(([format, data]) => ({
      format,
      avgRoas: (data.totalRoas / data.count).toFixed(2),
      avgCtr: (data.totalCtr / data.count).toFixed(2),
      totalSpend: data.totalSpend.toFixed(2),
      count: data.count
    }))
    .sort((a, b) => b.avgRoas - a.avgRoas)
    .slice(0, 3);

  const bestDurations = Object.entries(patterns.byDuration)
    .map(([duration, data]) => ({
      duration,
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

TOP PERFORMING VIDEO FORMATS:
${bestFormats.map(f => `• ${f.format}: ${f.avgRoas}x ROAS, ${f.avgCtr}% CTR (${f.count} videos, $${f.totalSpend} spend)`).join('\n')}

TOP PERFORMING VIDEO DURATIONS:
${bestDurations.map(d => `• ${d.duration}: ${d.avgRoas}x ROAS, ${d.avgCtr}% CTR (${d.count} videos, $${d.totalSpend} spend)`).join('\n')}

TOTAL VIDEO CREATIVES: ${videoCreatives.length}
KEY INSIGHTS: Look for patterns in style, theme, format, and duration that correlate with higher ROAS and CTR.
  `.trim();
}

// Summarize image creatives for vision analysis
function summarizeImageCreatives(imageCreatives) {
  const topPerformers = imageCreatives
    .filter(c => c.thumbnailUrl)
    .sort((a, b) => (b.roas || 0) - (a.roas || 0))
    .slice(0, 8); // Increased from 5 to 8 for better analysis
  
  const poorPerformers = imageCreatives
    .filter(c => c.thumbnailUrl && (c.roas || 0) < 1)
    .sort((a, b) => (a.roas || 0) - (b.roas || 0))
    .slice(0, 5);
  
  // Analyze creative types and themes
  const creativeTypeAnalysis = analyzeCreativeTypes(imageCreatives);
  const colorAnalysis = analyzeImageColors(imageCreatives);
  
  return `
TOP PERFORMING IMAGES (Available for Visual Analysis):
${topPerformers.map(c => `• Post ID ${c.postId || c.creativeId}: ${(c.roas || 0).toFixed(2)}x ROAS, ${(c.ctr || 0).toFixed(2)}% CTR, ${(c.spend || 0).toFixed(2)} spend`).join('\n')}

UNDERPERFORMING IMAGES (Available for Visual Analysis):
${poorPerformers.map(c => `• Post ID ${c.postId || c.creativeId}: ${(c.roas || 0).toFixed(2)}x ROAS, ${(c.ctr || 0).toFixed(2)}% CTR, ${(c.spend || 0).toFixed(2)} spend`).join('\n')}

CREATIVE TYPE PERFORMANCE:
${creativeTypeAnalysis}

COLOR/THEME ANALYSIS:
${colorAnalysis}

TOTAL IMAGE CREATIVES: ${imageCreatives.length}
IMAGES WITH THUMBNAILS: ${imageCreatives.filter(c => c.thumbnailUrl).length}
IMAGES WITH AD COPY: ${imageCreatives.filter(c => c.adCopyText).length}

VISUAL ANALYSIS CAPABILITIES: I can analyze the actual images to identify:
- Color schemes and their effectiveness
- Text overlay placement and readability
- Product positioning and composition
- Brand consistency across creatives
- Visual elements that drive engagement
- Comparison between high and low performers
  `.trim();
}

// Analyze creative types and performance
function analyzeCreativeTypes(imageCreatives) {
  const typePerformance = {};
  
  imageCreatives.forEach(creative => {
    const type = creative.creativeType || 'unknown';
    if (!typePerformance[type]) {
      typePerformance[type] = { count: 0, totalRoas: 0, totalCtr: 0, totalSpend: 0 };
    }
    typePerformance[type].count++;
    typePerformance[type].totalRoas += creative.roas || 0;
    typePerformance[type].totalCtr += creative.ctr || 0;
    typePerformance[type].totalSpend += creative.spend || 0;
  });
  
  const sortedTypes = Object.entries(typePerformance)
    .map(([type, data]) => ({
      type,
      avgRoas: (data.totalRoas / data.count).toFixed(2),
      avgCtr: (data.totalCtr / data.count).toFixed(2),
      count: data.count,
      totalSpend: data.totalSpend.toFixed(2)
    }))
    .sort((a, b) => b.avgRoas - a.avgRoas);
  
  return sortedTypes.map(t => `• ${t.type}: ${t.avgRoas}x ROAS, ${t.avgCtr}% CTR (${t.count} creatives)`).join('\n');
}

// Analyze color themes based on metadata
function analyzeImageColors(imageCreatives) {
  // This is a simplified analysis based on available metadata
  // In a real implementation, you'd analyze actual image colors
  const themes = {};
  
  imageCreatives.forEach(creative => {
    const adName = creative.adName || '';
    let theme = 'neutral';
    
    if (adName.toLowerCase().includes('bright') || adName.toLowerCase().includes('vibrant')) {
      theme = 'vibrant';
    } else if (adName.toLowerCase().includes('dark') || adName.toLowerCase().includes('black')) {
      theme = 'dark';
    } else if (adName.toLowerCase().includes('white') || adName.toLowerCase().includes('clean')) {
      theme = 'minimal';
    } else if (adName.toLowerCase().includes('color') || adName.toLowerCase().includes('pink') || adName.toLowerCase().includes('blue')) {
      theme = 'colorful';
    }
    
    if (!themes[theme]) {
      themes[theme] = { count: 0, totalRoas: 0, avgRoas: 0 };
    }
    themes[theme].count++;
    themes[theme].totalRoas += creative.roas || 0;
  });
  
  // Calculate averages
  Object.keys(themes).forEach(theme => {
    themes[theme].avgRoas = (themes[theme].totalRoas / themes[theme].count).toFixed(2);
  });
  
  const sortedThemes = Object.entries(themes)
    .sort(([,a], [,b]) => b.avgRoas - a.avgRoas);
  
  return sortedThemes.map(([theme, data]) => `• ${theme}: ${data.avgRoas}x ROAS (${data.count} creatives)`).join('\n');
}

// Analyze creatives with Claude Vision (for images)
async function analyzeCreativesWithVision(anthropic, systemMessage, chatMessages, imageCreatives) {
  try {
    // Select the most relevant images for analysis
    const topPerformers = imageCreatives
      .filter(c => c.thumbnailUrl && (c.roas || 0) > 0)
      .sort((a, b) => (b.roas || 0) - (a.roas || 0))
      .slice(0, 4); // Top 4 performers
    
    const poorPerformers = imageCreatives
      .filter(c => c.thumbnailUrl && (c.roas || 0) < 1)
      .sort((a, b) => (a.roas || 0) - (b.roas || 0))
      .slice(0, 2); // Bottom 2 performers
    
    // Combine for comprehensive analysis
    const imagesToAnalyze = [...topPerformers, ...poorPerformers];
    
    console.log(`🔍 Analyzing ${imagesToAnalyze.length} images: ${topPerformers.length} top performers, ${poorPerformers.length} poor performers`);
    
    // Create vision messages
    const visionMessages = [...chatMessages];
    
    // Add image analysis requests
    for (const [index, creative] of imagesToAnalyze.entries()) {
      try {
        console.log(`📸 Processing image ${index + 1}: Post ID ${creative.postId || creative.creativeId}`);
        console.log(`🌐 Image URL: ${creative.thumbnailUrl}`);
        
        // Fetch and encode image
        const imageBase64 = await fetchAndEncodeImage(creative.thumbnailUrl);
        
        const performanceLabel = (creative.roas || 0) > 1 ? 'HIGH PERFORMER' : 'LOW PERFORMER';
        const analysisPrompt = `Analyze this ${performanceLabel} image creative:
        
Performance Data:
- Post ID: ${creative.postId || creative.creativeId}
- ROAS: ${(creative.roas || 0).toFixed(2)}x
- CTR: ${(creative.ctr || 0).toFixed(2)}%
- Spend: $${(creative.spend || 0).toFixed(2)}
- Impressions: ${(creative.impressions || 0).toLocaleString()}
- Clicks: ${(creative.clicks || 0).toLocaleString()}

Please analyze the visual elements that might contribute to this performance level. Look at:
1. Color scheme and visual appeal
2. Text overlay placement and readability
3. Product presentation and composition
4. Brand consistency and professional appearance
5. Visual hierarchy and call-to-action prominence
6. Overall design quality and clarity`;
        
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
              text: analysisPrompt
            }
          ]
        });
        
        console.log(`✅ Successfully added image ${index + 1} to analysis`);
        
      } catch (imageError) {
        console.error(`❌ Error processing image for Post ID ${creative.postId || creative.creativeId}:`, imageError.message);
        
        // Add text-only analysis for failed images
        visionMessages.push({
          role: "user",
          content: `Unable to load image for Post ID ${creative.postId || creative.creativeId} (${imageError.message}), but here's the performance data:
          ROAS: ${(creative.roas || 0).toFixed(2)}x, CTR: ${(creative.ctr || 0).toFixed(2)}%, Spend: $${(creative.spend || 0).toFixed(2)}
          Please provide insights based on the available performance data and suggest what visual elements might improve performance.`
        });
      }
    }
    
    // Add final synthesis request
    visionMessages.push({
      role: "user",
      content: "Based on your analysis of these creatives, please provide:\n1. Key visual patterns that correlate with high performance\n2. Specific issues with underperforming creatives\n3. Actionable recommendations for improving creative performance\n4. Overall insights about what makes creatives successful for this brand"
    });
    
    console.log(`🤖 Sending ${visionMessages.length} messages to Claude Vision API`);
    
    // Use Claude 3 Sonnet for vision capabilities
    const response = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      system: systemMessage,
      messages: visionMessages,
      max_tokens: 2000
    });
    
    console.log('✅ Successfully received vision analysis response');
    return response;
    
  } catch (error) {
    console.error('❌ Error in vision analysis:', error);
    
    // Fallback to text-only analysis
    console.log('🔄 Falling back to text-only analysis');
    const fallbackResponse = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      system: systemMessage + '\n\nNOTE: Image analysis was unavailable, providing text-based insights only.',
      messages: chatMessages,
      max_tokens: 1000
    });
    
    return fallbackResponse;
  }
}

// Helper function to fetch and encode images with better error handling
async function fetchAndEncodeImage(imageUrl) {
  try {
    console.log(`🌐 Fetching image from: ${imageUrl}`);
    
    // Add timeout and better headers
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    const response = await fetch(imageUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'image/*',
        'Accept-Encoding': 'gzip, deflate, br',
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} for URL: ${imageUrl}`);
    }
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.startsWith('image/')) {
      throw new Error(`Invalid content type: ${contentType} for URL: ${imageUrl}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    
    if (arrayBuffer.byteLength === 0) {
      throw new Error(`Empty image data for URL: ${imageUrl}`);
    }
    
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    
    console.log(`✅ Successfully encoded image (${(arrayBuffer.byteLength / 1024).toFixed(1)}KB)`);
    return base64;
    
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error(`⏰ Image fetch timeout for URL: ${imageUrl}`);
      throw new Error(`Image fetch timeout: ${imageUrl}`);
    }
    
    console.error(`❌ Error fetching/encoding image from ${imageUrl}:`, error.message);
    throw error;
  }
}

// Helper function to validate image URLs
function validateImageUrl(url) {
  if (!url || typeof url !== 'string') {
    return false;
  }
  
  // Check if it's a valid URL
  try {
    new URL(url);
  } catch {
    return false;
  }
  
  // Check if it looks like an image URL
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
  const lowerUrl = url.toLowerCase();
  
  return imageExtensions.some(ext => lowerUrl.includes(ext)) || 
         lowerUrl.includes('image') || 
         lowerUrl.includes('photo') ||
         lowerUrl.includes('scontent') || // Facebook images
         lowerUrl.includes('fbcdn'); // Facebook CDN
}

// Enhanced error handling for API responses
function handleApiError(error) {
  console.error('API Error Details:', {
    message: error.message,
    status: error.status,
    code: error.code,
    type: error.type
  });
  
  if (error.status === 429) {
    return 'I\'m receiving too many requests right now. Please wait a moment and try again.';
  }
  
  if (error.status === 400) {
    return 'There was an issue with your request. Please try rephrasing your question.';
  }
  
  if (error.status === 401) {
    return 'Authentication failed. Please check the API configuration.';
  }
  
  if (error.status >= 500) {
    return 'The AI service is experiencing issues. Please try again in a few moments.';
  }
  
  return 'I encountered an unexpected error. Please try again or contact support if the issue persists.';
}