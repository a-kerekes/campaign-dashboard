// src/components/meta/AiAdvisor.js (Enhanced with Creative Analysis)
import React, { useState, useRef, useEffect } from 'react';
import { 
  checkServerRunning, 
  startClaudeServer, 
  subscribeToServerStatus 
} from '../../utils/claudeServerLauncher';

// API endpoint is now relative
const API_URL = '/api/ai-advisor';

const AiAdvisor = ({ 
  analyticsData, 
  audienceInsightsData, // New prop for audience insights
  creativePerformanceData // New prop for creative performance data
}) => {
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

  // Helper function to extract Post ID from ad names
  const extractPostId = (adName) => {
    if (!adName) return null;
    
    const patterns = [
      /\|\s*(\d{10,})\s*$/,
      /\|\s*[\w\-_]+\s*\|\s*(\d{10,})\s*$/,
      /(\d{13,})/
    ];
    
    for (const pattern of patterns) {
      const match = adName.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    return null;
  };

  // Helper function to extract creative metadata from ad names
  const extractCreativeMetadata = (adName) => {
    if (!adName) return {};
    
    return {
      adType: adName.includes('VID') ? 'VID' : adName.includes('IMG') ? 'IMG' : 'GIF',
      style: adName.includes('slideshow') ? 'slideshow' : 
             adName.includes('features') ? 'features' :
             adName.includes('compare') ? 'comparison' :
             adName.includes('motion') ? 'motion' :
             adName.includes('static') ? 'static' : 'unknown',
      theme: adName.toLowerCase().includes('review') ? 'testimonial' :
             adName.toLowerCase().includes('customer') ? 'testimonial' :
             adName.toLowerCase().includes('money') ? 'product-focused' :
             adName.toLowerCase().includes('calorie') ? 'benefit-focused' :
             adName.toLowerCase().includes('booty') ? 'benefit-focused' :
             adName.toLowerCase().includes('mother') ? 'emotional' :
             adName.toLowerCase().includes('galentines') ? 'emotional' : 'unknown',
      duration: adName.includes('15s') ? '15s' : 
                adName.includes('30s') ? '30s' : 
                adName.includes('60s') ? '60s' : 'unknown',
      format: adName.includes('9x16') ? '9:16' :
              adName.includes('4x5') ? '4:5' :
              adName.includes('1x1') ? '1:1' : 'unknown'
    };
  };

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
  
  // Helper function to detect which data the user is asking about
  const detectDataInterest = (messageContent) => {
    const lowerCaseContent = messageContent.toLowerCase();
    
    // Check for audience insights related terms
    const isAskingAboutAudience = 
      lowerCaseContent.includes('audience') || 
      lowerCaseContent.includes('demographic') || 
      lowerCaseContent.includes('age') || 
      lowerCaseContent.includes('gender') || 
      lowerCaseContent.includes('platform') || 
      lowerCaseContent.includes('placement');
    
    // Check for creative performance related terms
    const isAskingAboutCreatives = 
      lowerCaseContent.includes('creative') || 
      lowerCaseContent.includes('image') || 
      lowerCaseContent.includes('video') || 
      lowerCaseContent.includes('ad copy') || 
      lowerCaseContent.includes('best performing ad') || 
      lowerCaseContent.includes('worst performing ad') ||
      lowerCaseContent.includes('visual') ||
      lowerCaseContent.includes('design') ||
      lowerCaseContent.includes('analyze') ||
      lowerCaseContent.includes('thumbnail') ||
      lowerCaseContent.includes('top performing') ||
      lowerCaseContent.includes('successful') ||
      lowerCaseContent.includes('element');
    
    // Check for general analytics terms
    const isAskingAboutAnalytics = 
      lowerCaseContent.includes('performance') || 
      lowerCaseContent.includes('metric') || 
      lowerCaseContent.includes('ctr') || 
      lowerCaseContent.includes('conversion') || 
      lowerCaseContent.includes('roas');
    
    return {
      audience: isAskingAboutAudience,
      creatives: isAskingAboutCreatives,
      analytics: isAskingAboutAnalytics
    };
  };
  
  // Process a user message and get a response from Claude
  const processUserMessage = async (userMessage) => {
    setIsLoading(true);
    
    try {
      // Get the account name or ID for context
      const accountInfo = analyticsData?.account?.name || 'this Meta ad account';
      
      // Detect what kind of data the user is asking about
      const dataInterest = detectDataInterest(userMessage.content);
      
      // 🚨 DEBUG: Log detection results
      console.log('🔍 DATA INTEREST DETECTION:', {
        userMessage: userMessage.content,
        dataInterest,
        hasCreativePerformanceData: !!creativePerformanceData,
        creativePerformanceDataLength: creativePerformanceData?.length || 0
      });
      
      // Prepare context data for the system prompt
      let contextData = {};
      
      // Add general analytics data
      contextData.analytics = {
        totalImpressions: analyticsData?.summary?.totalImpressions?.toLocaleString() || 'N/A',
        totalClicks: analyticsData?.summary?.totalClicks?.toLocaleString() || 'N/A',
        totalSpend: analyticsData?.summary?.totalSpend?.toLocaleString() || 'N/A',
        ctr: analyticsData?.summary?.avgCtr?.toFixed(2) || 'N/A',
        conversions: analyticsData?.funnel?.purchases?.toLocaleString() || 'N/A',
        conversionRate: analyticsData?.advancedMetrics?.linkClickToConversion?.toFixed(2) || 'N/A',
        costPerPurchase: analyticsData?.advancedMetrics?.costPerPurchase?.toFixed(2) || 'N/A',
        roas: analyticsData?.advancedMetrics?.roas?.toFixed(2) || 'N/A'
      };
      
      // Add audience insights data if available
      if (audienceInsightsData) {
        contextData.audience = audienceInsightsData;
      }
      
      // 🔧 SIMPLIFIED: Always prepare creative analysis data if we have creative performance data
      let creativeAnalysisData = null;
      if (creativePerformanceData && creativePerformanceData.length > 0) {
        
        // 🚨 DEBUG: Log what we're receiving
        console.log('🔍 AI ADVISOR CREATIVE DEBUG:', {
          totalCreatives: creativePerformanceData.length,
          creativesWithThumbnails: creativePerformanceData.filter(c => c.thumbnailUrl).length,
          sampleCreativeWithThumbnail: creativePerformanceData.find(c => c.thumbnailUrl),
          adNamePatterns: creativePerformanceData.slice(0, 5).map(c => c.adName),
          sampleROAS: creativePerformanceData.slice(0, 3).map(c => ({ adName: c.adName, roas: c.roas }))
        });
        
        // Filter and enhance creative data - RELAXED FILTERS
        const videoCreatives = creativePerformanceData
          .filter(c => 
            (c.adName?.includes('VID') || c.adName?.includes('video') || c.adName?.includes('Video')) && 
            (c.spend || 0) > 10  // Lowered spend threshold
          )
          .map(c => ({
            postId: extractPostId(c.adName),
            roas: c.roas || 0,
            ctr: c.ctr || 0,
            spend: c.spend || 0,
            adName: c.adName,
            metadata: extractCreativeMetadata(c.adName)
          }));

        const imageCreatives = creativePerformanceData
          .filter(c => 
            c.thumbnailUrl && // Must have thumbnail
            (c.spend || 0) > 10  // Lowered spend threshold to $10
            // Removed the 'IMG' requirement since your ads might not follow this naming pattern
          )
          .sort((a, b) => (b.spend || 0) - (a.spend || 0)) // Sort by spend descending
          .slice(0, 20) // Take top 20 by spend to avoid overwhelming the AI
          .map(c => ({
            postId: extractPostId(c.adName),
            thumbnailUrl: c.thumbnailUrl,
            roas: c.roas || 0,
            ctr: c.ctr || 0,
            spend: c.spend || 0,
            adName: c.adName,
            metadata: extractCreativeMetadata(c.adName),
            impressions: c.impressions || 0,
            clicks: c.clicks || 0
          }));

        // 🚨 DEBUG: Log what we're sending to AI
        console.log('🔍 SENDING TO AI:', {
          videoCreatives: videoCreatives.length,
          imageCreatives: imageCreatives.length,
          sampleImageCreative: imageCreatives[0],
          allThumbnailUrls: imageCreatives.map(c => c.thumbnailUrl).slice(0, 3)
        });

        // 🔧 ALWAYS create creativeAnalysisData if we have any creatives
        creativeAnalysisData = {
          videoCreatives,
          imageCreatives
        };
      }
      
      // Create a system prompt that includes relevant data based on user's question
      let systemPrompt = `You are an expert Meta Ads advisor helping with ${accountInfo}.`;
      
      // If asking about audience insights and we have that data
      if (dataInterest.audience && audienceInsightsData) {
        systemPrompt += `\n\nRegarding audience insights, here's the data I have access to:
        ${JSON.stringify(contextData.audience, null, 2)}`;
      }
      
      // Always include general analytics
      systemPrompt += `\n\nHere's the general account data I have access to:
      - Total Impressions: ${contextData.analytics.totalImpressions}
      - Total Clicks: ${contextData.analytics.totalClicks}
      - Total Spend: $${contextData.analytics.totalSpend}
      - CTR: ${contextData.analytics.ctr}%
      - Conversions: ${contextData.analytics.conversions}
      - Conversion Rate: ${contextData.analytics.conversionRate}%
      - Cost per Purchase: $${contextData.analytics.costPerPurchase}
      - ROAS: ${contextData.analytics.roas}x`;
      
      // Add guidelines for response
      systemPrompt += `\n\nFollow these important guidelines:
      1. Be conversational and friendly but professional
      2. NEVER provide a full analysis unless specifically asked - respond directly to what was asked
      3. For simple greetings like "hi" or "hello", just greet back and ask what they'd like to know about their Meta ads
      4. If the user asks a vague question, ask a follow-up question to clarify what specific aspect they're interested in
      5. Keep responses concise and focused on the user's specific question
      6. When appropriate, suggest a follow-up question to help them dig deeper
      7. When giving recommendations, be specific and actionable
      8. Use bullet points for lists and recommendations, rather than long paragraphs
      9. IMPORTANT: Keep your responses BRIEF. Aim for 3-5 sentences maximum for most responses.
      10. When analyzing creatives, focus on performance patterns and actionable insights
      
      Remember that you're having a conversation with the user about their specific Meta ad account performance. You have access to data from multiple sections of their dashboard: general analytics, audience insights (demographics, platforms, etc.), and creative performance (individual ads and their metrics).`;
      
      // Create conversation history
      const conversationHistory = [
        { role: 'system', content: systemPrompt },
        ...messages.filter(m => m.role !== 'system'),
        userMessage
      ];
      
      console.log('Sending request to:', API_URL);
      
      // Prepare the API request payload
      const requestPayload = {
        messages: conversationHistory
      };

      // 🔧 ALWAYS add creative analysis data if available (simplified logic)
      if (creativeAnalysisData) {
        requestPayload.creativeAnalysisData = creativeAnalysisData;
      }
      
      // 🚨 DEBUG: Log what we're actually sending to the API
      console.log('🚨 API PAYLOAD DEBUG:', {
        hasCreativeAnalysisData: !!creativeAnalysisData,
        creativeAnalysisDataValue: creativeAnalysisData,
        dataInterestCreatives: dataInterest.creatives,
        hasCreativePerformanceData: !!creativePerformanceData,
        creativePerformanceDataLength: creativePerformanceData?.length || 0,
        payloadKeys: Object.keys(requestPayload),
        imageCreativesCount: creativeAnalysisData?.imageCreatives?.length || 0,
        videoCreativesCount: creativeAnalysisData?.videoCreatives?.length || 0
      });
      
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload),
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
      
      {/* Improved chat container with proper scrolling */}
      <div 
        className="mb-4 border rounded bg-gray-50" 
        style={{
          position: "relative",
          height: "450px", /* Fixed height */
          width: "100%",  /* Full width of parent */
          overflow: "hidden", /* Hide overflow */
        }}
      >
        {/* Inner scrollable container with visible scrollbar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            overflowY: "scroll", /* Vertical scrollbar */
            padding: "12px",
            scrollbarWidth: "thin", /* Firefox */
            scrollbarColor: "#CBD5E0 #F7FAFC", /* Firefox scrollbar colors */
          }}
        >
          {messages.map((message, index) => (
            <div 
              key={`msg-${index}`}
              style={{
                marginBottom: "12px",
                padding: "12px",
                borderRadius: "6px",
                maxWidth: "85%", /* Adjusted to leave room for scrollbar */
                marginLeft: message.role === 'user' ? 'auto' : '0',
                backgroundColor: message.role === 'user' ? '#e9f5ff' : '#f3f4f6',
                color: message.role === 'user' ? '#0066cc' : '#333',
                wordBreak: "break-word",  /* Ensure text wraps properly */
                overflowWrap: "break-word",
                whiteSpace: "pre-wrap"  /* Preserve line breaks */
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
        Try asking: "Which creative is performing best?" or "Analyze my video vs image performance" or "What visual elements work best?"
      </div>
    </div>
  );
};

export default AiAdvisor;