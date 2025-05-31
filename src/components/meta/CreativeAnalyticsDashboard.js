export default CreativeAnalyticsDashboard;// src/components/meta/CreativeAnalyticsDashboard.js
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import AdMetricsChart from './AdMetricsChart';
import AiAdvisor from './AiAdvisor';
import BreakdownChart from './BreakdownChart';
import metaAPI from './metaAPI';
import MetaAuthButton from './MetaAuthButton';
import EnhancedCreativePerformanceTable from './EnhancedCreativePerformanceTable';

// Meta API version constant
const META_API_VERSION = 'v22.0';

const CreativeAnalyticsDashboard = () => {
  // Dashboard state
  const [accessToken, setAccessToken] = useState('');
  const [accounts, setAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [dateRange, setDateRange] = useState('Last 30 Days');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [timeSeriesData, setTimeSeriesData] = useState(null);
  const [error, setError] = useState(null);
  const [isRealData, setIsRealData] = useState(true); // Assume true by default
  
  // Breakdown data state
  const [ageBreakdown, setAgeBreakdown] = useState(null);
  const [genderBreakdown, setGenderBreakdown] = useState(null);
  const [platformBreakdown, setPlatformBreakdown] = useState(null);
  const [placementBreakdown, setPlacementBreakdown] = useState(null);
  
  // Diagnostic tool state
  const [showDiagnostic, setShowDiagnostic] = useState(false);
  const [testResults, setTestResults] = useState({});
  const [diagnosticSelectedAccount, setDiagnosticSelectedAccount] = useState('');
  
  // Benchmark state
  const [benchmarks, setBenchmarks] = useState({});

  // Initialize Facebook SDK on component mount
  useEffect(() => {
    // We don't need to initialize the SDK here since MetaAuthButton handles it
    console.log("Using MetaAuthButton for SDK initialization");
  }, []);

  // Fetch benchmarks when account changes
  const fetchBenchmarks = useCallback(async () => {
    if (!selectedAccountId) return;
    
    try {
      const response = await metaAPI.fetchBenchmarks(selectedAccountId, accessToken);
      if (response.data) {
        setBenchmarks(response.data);
      }
    } catch (error) {
      console.error('Error fetching benchmarks:', error);
    }
  }, [selectedAccountId, accessToken]);

  // Load benchmarks when account changes
  useEffect(() => {
    if (isConnected && selectedAccountId) {
      fetchBenchmarks();
    }
  }, [isConnected, selectedAccountId, fetchBenchmarks]);

  // Enhanced smart grouping with improved pattern recognition
  const enhancedSmartGrouping = useCallback((adName) => {
    if (!adName) return { groupKey: 'unknown', method: 'fallback' };
    
    console.log(`🔍 ENHANCED SMART GROUPING: Analyzing "${adName}"`);
    
    // STRATEGY 1: Try to extract Post ID (original logic)
    const tryExtractPostId = (adName) => {
      const patterns = [
        /\|\s*(\d{10,})\s*\|?\s*$/,
        /\|\s*[\w-_]+\s*\|\s*(\d{10,})\s*\|?\s*$/,
        /(\d{13,})/,
        /post[_-]?id[_-]?:?\s*(\d{10,})/i,
        /creative[_-]?id[_-]?:?\s*(\d{10,})/i
      ];
      
      for (const pattern of patterns) {
        const match = adName.match(pattern);
        if (match && match[1]) {
          return match[1];
        }
      }
      return null;
    };

    // Helper Functions for pattern recognition
    const isPartTechnical = (part) => {
      const technicalPatterns = [
        /^\d+_/, // Starts with number_
        /^(24_|25_)/, // Date prefixes
        /LP\s*\|?\s*$/, // Landing page suffix
        /Homepage/, // Technical indicators
        /Copy\s*\|?\s*$/, // Copy suffix
        /^(Do|Try)\//, // Action prefixes
        /^\d{10,}$/, // Long numbers
        /^act_\d+$/, // Account IDs
        /^\d+x\d+$/, // Dimensions
      ];
      
      return technicalPatterns.some(pattern => pattern.test(part));
    };

    const isPartProductName = (part) => {
      return part.length > 2 && 
             part.length < 50 && 
             !isPartTechnical(part) &&
             !/^\d+$/.test(part) && 
             !/^[A-Z]{2,}$/.test(part);
    };

    const isPartVisualTheme = (part) => {
      const visualThemes = [
        'white', 'black', 'blue', 'red', 'green', 'orange', 'purple', 'yellow',
        'award', 'total', 'premium', 'classic', 'modern', 'clean', 'bold',
        'bright', 'dark', 'light', 'minimal', 'vibrant'
      ];
      
      return visualThemes.some(theme => 
        part.toLowerCase().includes(theme.toLowerCase())
      );
    };

    const isPartVariation = (part) => {
      const variationPatterns = [
        /v\d+/i, // v1, v2, etc.
        /version/i,
        /test/i,
        /variant/i,
        /copy/i,
        /creative/i
      ];
      
      return variationPatterns.some(pattern => pattern.test(part)) ||
             isPartVisualTheme(part);
    };

    const findCreativeType = (parts) => {
      const typeIndicators = ['IMG', 'VID', 'GIF', 'VIDEO', 'IMAGE', 'CAROUSEL', 'COLLECTION'];
      return parts.find(part => 
        typeIndicators.some(type => part.toUpperCase().includes(type))
      );
    };

    const findProductName = (parts) => {
      return parts.find(part => 
        isPartProductName(part) && !isPartTechnical(part)
      );
    };

    const findVariation = (parts) => {
      const variationIndicators = [
        'white', 'black', 'blue', 'red', 'green', 'orange', 'award', 'total', 'premium',
        'v1', 'v2', 'v3', 'version', 'test', 'variant', 'copy', 'creative',
        'bloat', 'testimonial', 'support', 'clinic'
      ];
      
      return parts.find(part =>
        variationIndicators.some(indicator => 
          part.toLowerCase().includes(indicator.toLowerCase())
        )
      );
    };

    // Auto-detect separator
    const detectSeparator = (name) => {
      const separators = ['|', ' | ', '_', '-', '  ', ' '];
      for (const sep of separators) {
        if (name.includes(sep)) {
          return sep;
        }
      }
      return null;
    };

    // Main grouping logic
    const postId = tryExtractPostId(adName);
    if (postId) {
      console.log(`✅ Strategy 1 SUCCESS: Found Post ID "${postId}"`);
      return { groupKey: `post_${postId}`, method: 'post_id', postId };
    }
    
    // Progressive pattern discovery
    const separator = detectSeparator(adName);
    let parts = [];
    
    if (separator) {
      parts = adName.split(separator).map(s => s.trim()).filter(s => s.length > 0);
    } else {
      if (/[a-z][A-Z]/.test(adName)) {
        parts = adName.split(/(?=[A-Z])/).filter(s => s.length > 0);
      } else {
        parts = [adName];
      }
    }

    console.log(`🔧 Detected separator: "${separator}", Parts:`, parts);

    // STRATEGY 2: Creative Type + Product grouping
    const creativeType = findCreativeType(parts);
    const productName = findProductName(parts);
    const variation = findVariation(parts);
    
    if (creativeType && productName) {
      let groupKey = `${creativeType}_${productName}`;
      if (variation) {
        groupKey += `_${variation}`;
      }
      const cleanKey = groupKey.toLowerCase().replace(/[^a-z0-9_]/g, '_');
      console.log(`✅ Strategy 2 SUCCESS: Creative grouping "${cleanKey}"`);
      return { groupKey: cleanKey, method: 'creative_type' };
    }
    
    // STRATEGY 3: Product/Campaign name grouping
    for (let i = 0; i < Math.min(3, parts.length); i++) {
      const part = parts[i];
      
      if (isPartTechnical(part)) continue;
      
      if (isPartProductName(part)) {
        const variationPart = parts.slice(i + 1).find(p => isPartVariation(p));
        let groupKey = `product_${part}`;
        if (variationPart) {
          groupKey += `_${variationPart}`;
        }
        const cleanKey = groupKey.toLowerCase().replace(/[^a-z0-9_]/g, '_');
        console.log(`✅ Strategy 3 SUCCESS: Product grouping "${cleanKey}"`);
        return { groupKey: cleanKey, method: 'product_name' };
      }
    }
    
    // STRATEGY 4: Brand/Campaign fallback
    const firstPart = parts[0];
    if (firstPart && !isPartTechnical(firstPart)) {
      const cleanKey = `brand_${firstPart.toLowerCase().replace(/[^a-z0-9_]/g, '_')}`;
      console.log(`✅ Strategy 4 SUCCESS: Brand grouping "${cleanKey}"`);
      return { groupKey: cleanKey, method: 'brand_group' };
    }
    
    // FINAL FALLBACK
    const fallbackGroup = `name_${adName.split(/[|_-]/)[0]?.trim() || 'unknown'}`;
    console.log(`⚠️ Using final fallback: "${fallbackGroup}"`);
    return { groupKey: fallbackGroup, method: 'fallback' };
  }, []);

  // Function to load performance data wrapped in useCallback
  const loadPerformanceData = useCallback(async () => {
    if (!accessToken || !selectedAccountId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Format account ID to ensure proper format
      const formattedAccountId = selectedAccountId.toString().replace('act_', '');
      
      // Calculate date range
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      
      let daysAgo = 30;
      
      if (dateRange === 'Last 7 Days') {
        daysAgo = 7;
      } else if (dateRange === 'Last 60 Days') {
        daysAgo = 60;
      } else if (dateRange === 'Last 90 Days') {
        daysAgo = 90;
      }
      
      const startDate = new Date(yesterday);
      startDate.setDate(yesterday.getDate() - (daysAgo - 1));
      
      const since = startDate.toISOString().split('T')[0];
      const until = yesterday.toISOString().split('T')[0];
      
      console.log(`Date range: ${dateRange}, from ${since} to ${until}`);
      
      // FETCH DAILY TIME SERIES DATA
      try {
        console.log(`Fetching daily metrics for account ID: ${selectedAccountId}, date range: ${dateRange}`);
        const dailyData = await metaAPI.fetchDailyMetrics(dateRange, selectedAccountId, accessToken);
        
        const isMockData = dailyData && dailyData.some(item => item._isMock === true || item.source === 'mock');
        setIsRealData(!isMockData);
        
        console.log(`Received ${dailyData.length} days of time series data (${isMockData ? 'MOCK' : 'REAL'} data)`);
        setTimeSeriesData(dailyData);
      } catch (timeSeriesError) {
        console.error('Error loading time series data:', timeSeriesError);
      }
      
      // FETCH BREAKDOWN DATA
      try {
        // Fetch and enhance breakdown data
        let ageData = await metaAPI.fetchBreakdownMetrics('age', dateRange, selectedAccountId, accessToken);
        ageData = ageData.map(item => {
          const impressions = parseInt(item.impressions || 0);
          const clicks = parseInt(item.clicks || 0);
          let ctr = item.ctr || 0;
          if (clicks > 0 && impressions > 0 && (!ctr || ctr === 0)) {
            ctr = (clicks / impressions) * 100;
          } else if (ctr > 0 && ctr < 1) {
            ctr = ctr * 100;
          }
          return {
            ...item,
            ctr: ctr,
            cpc: parseFloat(item.cpc || 0),
            cpm: parseFloat(item.cpm || 0),
            purchases: parseInt(item.purchases || Math.round(clicks * 0.05)),
            landingPageViews: parseInt(item.landing_page_views || Math.round(clicks * 0.8)),
            addToCarts: parseInt(item.add_to_cart || Math.round(clicks * 0.2))
          };
        });
        setAgeBreakdown(ageData);
        
        let genderData = await metaAPI.fetchBreakdownMetrics('gender', dateRange, selectedAccountId, accessToken);
        genderData = genderData.map(item => {
          const impressions = parseInt(item.impressions || 0);
          const clicks = parseInt(item.clicks || 0);
          let ctr = item.ctr || 0;
          if (clicks > 0 && impressions > 0 && (!ctr || ctr === 0)) {
            ctr = (clicks / impressions) * 100;
          } else if (ctr > 0 && ctr < 1) {
            ctr = ctr * 100;
          }
          return {
            ...item,
            ctr: ctr,
            cpc: parseFloat(item.cpc || 0),
            cpm: parseFloat(item.cpm || 0),
            purchases: parseInt(item.purchases || Math.round(clicks * 0.05)),
            landingPageViews: parseInt(item.landing_page_views || Math.round(clicks * 0.8)),
            addToCarts: parseInt(item.add_to_cart || Math.round(clicks * 0.2))
          };
        });
        setGenderBreakdown(genderData);
        
        let platformData = await metaAPI.fetchBreakdownMetrics('publisher_platform', dateRange, selectedAccountId, accessToken);
        platformData = platformData.map(item => {
          const impressions = parseInt(item.impressions || 0);
          const clicks = parseInt(item.clicks || 0);
          let ctr = item.ctr || 0;
          if (clicks > 0 && impressions > 0 && (!ctr || ctr === 0)) {
            ctr = (clicks / impressions) * 100;
          } else if (ctr > 0 && ctr < 1) {
            ctr = ctr * 100;
          }
          return {
            ...item,
            ctr: ctr,
            cpc: parseFloat(item.cpc || 0),
            cpm: parseFloat(item.cpm || 0),
            purchases: parseInt(item.purchases || Math.round(clicks * 0.05)),
            landingPageViews: parseInt(item.landing_page_views || Math.round(clicks * 0.8)),
            addToCarts: parseInt(item.add_to_cart || Math.round(clicks * 0.2))
          };
        });
        setPlatformBreakdown(platformData);
        
        let placementData = await metaAPI.fetchBreakdownMetrics('platform_position', dateRange, selectedAccountId, accessToken);
        placementData = placementData.map(item => {
          const impressions = parseInt(item.impressions || 0);
          const clicks = parseInt(item.clicks || 0);
          let ctr = item.ctr || 0;
          if (clicks > 0 && impressions > 0 && (!ctr || ctr === 0)) {
            ctr = (clicks / impressions) * 100;
          } else if (ctr > 0 && ctr < 1) {
            ctr = ctr * 100;
          }
          return {
            ...item,
            ctr: ctr,
            cpc: parseFloat(item.cpc || 0),
            cpm: parseFloat(item.cpm || 0),
            purchases: parseInt(item.purchases || Math.round(clicks * 0.05)),
            landingPageViews: parseInt(item.landing_page_views || Math.round(clicks * 0.8)),
            addToCarts: parseInt(item.add_to_cart || Math.round(clicks * 0.2))
          };
        });
        setPlacementBreakdown(placementData);
        
        console.log('Successfully loaded and enhanced all breakdown data');
      } catch (breakdownError) {
        console.error('Error loading breakdown data:', breakdownError);
      }
      
      // 1. Fetch account insights
      const insightsResponse = await axios.get(
        `https://graph.facebook.com/${META_API_VERSION}/act_${formattedAccountId}/insights`,
        {
          params: {
            access_token: accessToken,
            time_range: JSON.stringify({
              since,
              until
            }),
            fields: 'impressions,clicks,spend,actions,action_values,cpc,ctr,cpm',
            level: 'account',
            limit: 500
          }
        }
      );
      
      // 2. Fetch campaigns
      const campaignsResponse = await axios.get(
        `https://graph.facebook.com/${META_API_VERSION}/act_${formattedAccountId}/campaigns`,
        {
          params: {
            access_token: accessToken,
            fields: 'name,status,objective',
            limit: 500
          }
        }
      );
      
      // 3. Fetch ads with their creative info
      const adsResponse = await axios.get(
        `https://graph.facebook.com/${META_API_VERSION}/act_${formattedAccountId}/ads`,
        {
          params: {
            access_token: accessToken,
            fields: 'name,creative{id},adset{name}',
            limit: 500
          }
        }
      );

      console.log('🔍 RAW ADS RESPONSE:', adsResponse.data.data);
      console.log('🔍 FIRST AD WITH CREATIVE:', adsResponse.data.data.find(ad => ad.creative));

      // 3b. Fetch creative library for better video quality
      const creativesResponse = await axios.get(
        `https://graph.facebook.com/${META_API_VERSION}/act_${formattedAccountId}/adcreatives`,
        {
          params: {
            access_token: accessToken,
            fields: 'image_url,thumbnail_url,video_id,object_story_spec',
            limit: 250
          }
        }
      );

      console.log('🔍 CREATIVE LIBRARY RESPONSE:', creativesResponse.data.data);
      console.log('🔍 CREATIVE WITH IMAGE_URL:', creativesResponse.data.data.find(c => c.image_url));
      console.log('🔍 CREATIVE WITH THUMBNAIL:', creativesResponse.data.data.find(c => c.thumbnail_url));

      // Create a lookup map for creative library data
      const creativesMap = {};
      if (creativesResponse.data.data) {
        creativesResponse.data.data.forEach(creative => {
          creativesMap[creative.id] = creative;
          
          console.log(`🔍 CREATIVE ${creative.id}:`, {
            image_url: creative.image_url,
            thumbnail_url: creative.thumbnail_url,
            video_id: creative.video_id,
            has_object_story_spec: !!creative.object_story_spec,
            object_story_spec_keys: creative.object_story_spec ? Object.keys(creative.object_story_spec) : []
          });
        });
      }

      // Extract ads from response
      const ads = adsResponse.data.data;

      // 4. Fetch ad insights for performance data - WITH BATCHING
      console.log('🔍 Fetching ad insights with batching...');
      let adInsightsResponse = { data: { data: [] } };

      try {
        const allAdIds = ads.map(ad => ad.id);
        console.log(`📊 Need insights for ${allAdIds.length} ads`);
        
        const batchSize = 50;
        const batches = [];
        
        for (let i = 0; i < allAdIds.length; i += batchSize) {
          const batchAdIds = allAdIds.slice(i, i + batchSize);
          batches.push(batchAdIds);
        }
        
        console.log(`📦 Split into ${batches.length} batches of ~${batchSize} ads each`);
        
        const allInsightsData = [];
        
        for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
          const batchAdIds = batches[batchIndex];
          
          try {
            console.log(`🔄 Processing batch ${batchIndex + 1}/${batches.length} (${batchAdIds.length} ads)`);
            
            const batchResponse = await axios.get(
              `https://graph.facebook.com/${META_API_VERSION}/act_${formattedAccountId}/insights`,
              {
                params: {
                  access_token: accessToken,
                  time_range: JSON.stringify({
                    since,
                    until
                  }),
                  fields: 'impressions,clicks,spend,actions,action_values,cpc,ctr,cpm,ad_id',
                  level: 'ad',
                  filtering: JSON.stringify([
                    {
                      field: 'ad.id',
                      operator: 'IN',
                      value: batchAdIds
                    }
                  ]),
                  limit: batchSize
                }
              }
            );
            
            if (batchResponse.data && batchResponse.data.data) {
              allInsightsData.push(...batchResponse.data.data);
              console.log(`✅ Batch ${batchIndex + 1} completed: ${batchResponse.data.data.length} insights received`);
            }
            
            if (batchIndex < batches.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 100));
            }
            
          } catch (batchError) {
            console.error(`❌ Error in batch ${batchIndex + 1}:`, batchError.message);
          }
        }
        
        adInsightsResponse = {
          data: {
            data: allInsightsData
          }
        };
        
        console.log(`🎉 Successfully fetched insights for ${allInsightsData.length} ads total`);
        
      } catch (insightsError) {
        console.error('❌ Error fetching ad insights:', insightsError);
        console.log('⚠️  Continuing without individual ad insights - will use aggregated data');
        adInsightsResponse = { data: { data: [] } };
      }

      // 5. Map insights to ads with creatives - ENHANCED WITH SMART GROUPING
      const creativePerformance = ads
        .filter(ad => ad.creative)
        .map(ad => {
          const insight = adInsightsResponse.data.data && adInsightsResponse.data.data.find(i => i.ad_id === ad.id);
          
          // Enhanced thumbnail logic with detailed logging
          const creativeLibData = creativesMap[ad.creative.id];
          
          console.log(`🔍 PROCESSING AD ${ad.id}:`, {
            adName: ad.name,
            creativeId: ad.creative.id,
            adsAPI_image_url: ad.creative.image_url,
            adsAPI_thumbnail_url: ad.creative.thumbnail_url,
            adsAPI_has_object_story_spec: !!ad.creative.object_story_spec,
            creativeLib_image_url: creativeLibData?.image_url,
            creativeLib_thumbnail_url: creativeLibData?.thumbnail_url,
            creativeLib_video_id: creativeLibData?.video_id
          });
          
          // Enhanced thumbnail logic
          const thumbnailUrl = (() => {
            const candidates = [
              creativeLibData?.image_url,
              ad.creative.image_url,
              creativeLibData?.thumbnail_url,
              ad.creative.thumbnail_url,
              creativeLibData?.object_story_spec?.video_data?.image_url,
              ad.creative.object_story_spec?.video_data?.image_url,
              ad.creative.object_story_spec?.link_data?.picture,
              creativeLibData?.object_story_spec?.link_data?.picture
            ];
            
            const finalUrl = candidates.find(url => url && url.length > 0);
            
            console.log(`🔍 THUMBNAIL SELECTION for ${ad.creative.id}:`, {
              candidates: candidates.map((url, i) => ({ index: i, url: url || 'null' })),
              selected: finalUrl || 'NONE FOUND'
            });
            
            return finalUrl || null;
          })();
          
          // Calculate ROAS for this specific creative
          const spend = insight ? parseFloat(insight.spend || 0) : 0;
          const purchases = insight && insight.actions ? 
            parseInt(insight.actions.find(a => a.action_type === 'purchase')?.value || 0) : 0;
          
          const purchaseValue = insight && insight.action_values ? 
            parseFloat(insight.action_values.find(a => a.action_type === 'purchase')?.value || 0) : 0;
          
          const roas = spend > 0 && purchaseValue > 0 ? purchaseValue / spend : 0;
          
          console.log(`💰 ROAS CALCULATION for ${ad.id}:`, {
            spend,
            purchases,
            purchaseValue,
            roas: roas.toFixed(2)
          });
          
          // Apply enhanced smart grouping for this creative
          const groupingResult = enhancedSmartGrouping(ad.name);
          console.log(`🏷️ Enhanced smart grouping for "${ad.name}": ${groupingResult.groupKey} (method: ${groupingResult.method})`);
          
          return {
            adId: ad.id,
            adName: ad.name,
            adsetName: ad.adset ? ad.adset.name : 'Unknown',
            creativeId: ad.creative.id,
            thumbnailUrl: thumbnailUrl,
            objectStorySpec: ad.creative.object_story_spec || creativeLibData?.object_story_spec || null,
            accountId: selectedAccountId,
            // Performance metrics
            impressions: insight ? parseInt(insight.impressions || 0) : 0,
            clicks: insight ? parseInt(insight.clicks || 0) : 0,
            spend: spend,
            ctr: insight ? parseFloat(insight.ctr || 0) * 100 : 0,
            cpm: insight ? parseFloat(insight.cpm || 0) : 0,
            cpc: insight ? parseFloat(insight.cpc || 0) : 0,
            // Add conversion metrics
            purchases: purchases,
            landingPageViews: insight && insight.actions ? 
              parseInt(insight.actions.find(a => a.action_type === 'landing_page_view')?.value || 0) : 0,
            addToCarts: insight && insight.actions ? 
              parseInt(insight.actions.find(a => a.action_type === 'add_to_cart')?.value || 0) : 0,
            // ROAS calculation
            roas: roas,
            revenue: purchaseValue,
            // Enhanced smart grouping info
            smartGroupKey: groupingResult.groupKey,
            groupingMethod: groupingResult.method,
            postId: groupingResult.postId || null
          };
        });

      // Final summary
      const creativesWithThumbnails = creativePerformance.filter(c => c.thumbnailUrl);
      console.log('🔍 FINAL THUMBNAIL SUMMARY:', {
        totalCreatives: creativePerformance.length,
        creativesWithThumbnails: creativesWithThumbnails.length,
        sampleThumbnails: creativesWithThumbnails.slice(0, 3).map(c => ({
          creativeId: c.creativeId,
          adName: c.adName,
          thumbnailUrl: c.thumbnailUrl
        }))
      });

      // Log enhanced smart grouping statistics
      const groupingStats = {};
      creativePerformance.forEach(creative => {
        const method = creative.groupingMethod;
        groupingStats[method] = (groupingStats[method] || 0) + 1;
      });
      console.log('📊 ENHANCED SMART GROUPING STATISTICS:', groupingStats);
      
      // Prepare summary metrics from account insights
      const accountInsights = insightsResponse.data.data && insightsResponse.data.data.length > 0 
        ? insightsResponse.data.data[0] 
        : {};
      
      const summary = {
        totalImpressions: parseInt(accountInsights.impressions || 0),
        totalClicks: parseInt(accountInsights.clicks || 0),
        totalSpend: parseFloat(accountInsights.spend || 0),
        avgCtr: accountInsights.ctr ? parseFloat(accountInsights.ctr) * 100 : 0,
        avgCpc: parseFloat(accountInsights.cpc || 0),
        avgCpm: parseFloat(accountInsights.cpm || 0),
        campaigns: campaignsResponse.data.data.length,
        activeCreatives: ads.filter(ad => ad.creative).length
      };
      
      // Calculate estimated funnel data if conversions aren't directly available
      const purchaseAction = accountInsights.actions?.find(a => a.action_type === 'purchase');
      const estimatedPurchases = purchaseAction ? parseInt(purchaseAction.value) : Math.round(summary.totalClicks * 0.1);
      
      const landingPageViewAction = accountInsights.actions?.find(a => a.action_type === 'landing_page_view');
      const estimatedLandingPageViews = landingPageViewAction ? parseInt(landingPageViewAction.value) : Math.round(summary.totalClicks * 0.8);
      
      const addToCartAction = accountInsights.actions?.find(a => a.action_type === 'add_to_cart');
      const estimatedAddToCarts = addToCartAction ? parseInt(addToCartAction.value) : Math.round(summary.totalClicks * 0.3);

      // Add funnel data to analytics
      const funnel = {
        impressions: summary.totalImpressions,
        clicks: summary.totalClicks,
        landingPageViews: estimatedLandingPageViews,
        addToCarts: estimatedAddToCarts,
        purchases: estimatedPurchases
      };

      // Add revenue data if available
      const purchaseValueAction = accountInsights.action_values?.find(a => a.action_type === 'purchase');
      const revenue = purchaseValueAction ? parseFloat(purchaseValueAction.value) : 0;

      // Add more advanced metrics
      const advancedMetrics = {
        cpm: summary.avgCpm,
        cpc: summary.avgCpc,
        costPerPurchase: funnel.purchases > 0 ? summary.totalSpend / funnel.purchases : 0,
        roas: revenue > 0 ? revenue / summary.totalSpend : 0,
        linkClickToConversion: funnel.purchases > 0 ? (funnel.purchases / summary.totalClicks) * 100 : 0
      };
      
      // Find top performing creatives by spend
      const topCreatives = [...creativePerformance]
        .sort((a, b) => b.spend - a.spend)
        .slice(0, 5);
      
      setAnalyticsData({
        summary,
        funnel,
        advancedMetrics,
        creativePerformance,
        topCreatives,
        campaigns: campaignsResponse.data.data,
        accountInsights: insightsResponse.data.data
      });
      
      console.log('Performance data and time series data loaded successfully');
      
    } catch (error) {
      console.error('Error loading performance data:', error);
      setError('Error loading data from Meta API. Please check console for details.');
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, selectedAccountId, dateRange, enhancedSmartGrouping]);

  // Load performance data when account or date range changes
  useEffect(() => {
    if (isConnected && selectedAccountId && accessToken) {
      loadPerformanceData();
    }
  }, [isConnected, selectedAccountId, dateRange, accessToken, loadPerformanceData]);

  const handleAccountChange = (e) => {
    const accountId = e.target.value;
    setSelectedAccountId(accountId);
  };

  const toggleDiagnostic = () => {
    setShowDiagnostic(!showDiagnostic);
  };

  // Handle toggling between real and mock data
  const handleToggleDataSource = () => {
    setIsRealData(!isRealData);
    
    const event = new CustomEvent('dataSourceChanged', { 
      detail: { isRealData: !isRealData }
    });
    window.dispatchEvent(event);
    
    setTimeout(() => {
      if (isConnected && selectedAccountId && accessToken) {
        loadPerformanceData();
      }
    }, 100);
  };

  const runDiagnostics = async (token = accessToken) => {
    if (!token) {
      setError('Please connect with Facebook first to generate an access token');
      return;
    }

    setIsLoading(true);
    setTestResults({});
    
    try {
      const results = {
        tokenTest: { status: 'pending', message: 'Testing token validity...' }
      };
      setTestResults(results);
      
      const meResponse = await axios.get(`https://graph.facebook.com/${META_API_VERSION}/me`, {
        params: { access_token: token }
      });

      if (meResponse.data.error) {
        results.tokenTest = { 
          status: 'failed', 
          message: `Invalid token: ${meResponse.data.error.message}`,
          data: meResponse.data.error
        };
        setTestResults({...results});
        setIsLoading(false);
        return;
      }
      
      results.tokenTest = { 
        status: 'success', 
        message: `Valid token for user: ${meResponse.data.name} (ID: ${meResponse.data.id})`,
        data: meResponse.data
      };
      setTestResults({...results});

      // Test 2: Check permissions
      results.permissionsTest = { status: 'pending', message: 'Checking token permissions...' };
      setTestResults({...results});
      
      const permissionsResponse = await axios.get(`https://graph.facebook.com/${META_API_VERSION}/me/permissions`, {
        params: { access_token: token }
      });
      
      if (permissionsResponse.data.error) {
        results.permissionsTest = { 
          status: 'failed', 
          message: `Failed to fetch permissions: ${permissionsResponse.data.error.message}`,
          data: permissionsResponse.data.error
        };
        setTestResults({...results});
      } else {
        const adPermissions = permissionsResponse.data.data.filter(p => 
          ['ads_management', 'ads_read', 'read_insights', 'business_management', 'pages_show_list'].includes(p.permission)
        );
        
        const missingPermissions = ['ads_management', 'ads_read', 'read_insights', 'business_management', 'pages_show_list'].filter(
          p => !adPermissions.some(granted => granted.permission === p && granted.status === 'granted')
        );
        
        if (missingPermissions.length > 0) {
          results.permissionsTest = { 
            status: 'warning', 
            message: `Missing permissions: ${missingPermissions.join(', ')}`,
            data: permissionsResponse.data.data
          };
        } else {
          results.permissionsTest = { 
            status: 'success', 
            message: 'All required permissions granted',
            data: adPermissions
          };
        }
        setTestResults({...results});
      }

      // Test 3: Fetch Ad Accounts
      results.accountsTest = { status: 'pending', message: 'Fetching ad accounts...' };
      setTestResults({...results});
      
      const accountsResponse = await axios.get(`https://graph.facebook.com/${META_API_VERSION}/me/adaccounts`, {
        params: {
          access_token: token,
          fields: 'name,account_id,account_status',
          limit: 100
        }
      });
      
      if (accountsResponse.data.error) {
        results.accountsTest = { 
          status: 'failed', 
          message: `Failed to fetch ad accounts: ${accountsResponse.data.error.message}`,
          data: accountsResponse.data.error
        };
        setTestResults({...results});
      } else if (!accountsResponse.data.data || accountsResponse.data.data.length === 0) {
        results.accountsTest = { 
          status: 'warning', 
          message: 'No ad accounts found for this user',
          data: accountsResponse.data
        };
        setTestResults({...results});
      } else {
        const accountsList = accountsResponse.data.data.map(account => ({
          id: account.id,
          name: account.name,
          accountId: account.account_id,
          status: account.account_status === 1 ? 'Active' : 'Inactive'
        }));
        
        setDiagnosticSelectedAccount(accountsList[0].id);
        
        results.accountsTest = { 
          status: 'success', 
          message: `Found ${accountsList.length} ad accounts`,
          data: accountsList
        };
        setTestResults({...results});
      }

    } catch (error) {
      console.error('Error during diagnostics:', error);
      setTestResults({
        error: {
          status: 'failed',
          message: `Error running diagnostics: ${error.message}`,
          data: error.response?.data || error
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testAccountInsights = async () => {
    if (!diagnosticSelectedAccount) return;
    
    setIsLoading(true);
    const updatedResults = {...testResults};
    updatedResults.insightsTest = { status: 'pending', message: 'Fetching account insights...' };
    setTestResults(updatedResults);
    
    try {
      const accountId = diagnosticSelectedAccount.replace('act_', '');
      
      const today = new Date();
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(today.getDate() - 30);
      
      const since = thirtyDaysAgo.toISOString().split('T')[0];
      const until = today.toISOString().split('T')[0];
      
      const insightsResponse = await axios.get(
        `https://graph.facebook.com/${META_API_VERSION}/act_${accountId}/insights`,
        {
          params: {
            access_token: accessToken,
            time_range: JSON.stringify({
              since,
              until
            }),
            fields: 'impressions,clicks,spend',
            limit: 100
          }
        }
      );
      
      if (insightsResponse.data.error) {
        updatedResults.insightsTest = { 
          status: 'failed', 
          message: `Failed to fetch insights: ${insightsResponse.data.error.message}`,
          data: insightsResponse.data.error
        };
      } else if (!insightsResponse.data.data || insightsResponse.data.data.length === 0) {
        updatedResults.insightsTest = { 
          status: 'warning', 
          message: 'No insights data found for the specified time period',
          data: insightsResponse.data
        };
      } else {
        updatedResults.insightsTest = { 
          status: 'success', 
          message: 'Successfully retrieved insights data',
          data: insightsResponse.data.data
        };
      }
    } catch (error) {
      console.error('Error fetching insights:', error);
      updatedResults.insightsTest = { 
        status: 'failed', 
        message: `Error fetching insights: ${error.message}`,
        data: error.response?.data || error
      };
    } finally {
      setTestResults(updatedResults);
      setIsLoading(false);
    }
  };

  const testCampaigns = async () => {
    if (!diagnosticSelectedAccount) return;
    
    setIsLoading(true);
    const updatedResults = {...testResults};
    updatedResults.campaignsTest = { status: 'pending', message: 'Fetching campaigns...' };
    setTestResults(updatedResults);
    
    try {
      const accountId = diagnosticSelectedAccount.replace('act_', '');
      
      const campaignsResponse = await axios.get(
        `https://graph.facebook.com/${META_API_VERSION}/act_${accountId}/campaigns`,
        {
          params: {
            access_token: accessToken,
            fields: 'name,status,objective',
            limit: 100
          }
        }
      );
      
      if (campaignsResponse.data.error) {
        updatedResults.campaignsTest = { 
          status: 'failed', 
          message: `Failed to fetch campaigns: ${campaignsResponse.data.error.message}`,
          data: campaignsResponse.data.error
        };
      } else if (!campaignsResponse.data.data || campaignsResponse.data.data.length === 0) {
        updatedResults.campaignsTest = { 
          status: 'warning', 
          message: 'No campaigns found for this account',
          data: campaignsResponse.data
        };
      } else {
        updatedResults.campaignsTest = { 
          status: 'success', 
          message: `Found ${campaignsResponse.data.data.length} campaigns`,
          data: campaignsResponse.data.data
        };
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      updatedResults.campaignsTest = { 
        status: 'failed', 
        message: `Error fetching campaigns: ${error.message}`,
        data: error.response?.data || error
      };
    } finally {
      setTestResults(updatedResults);
      setIsLoading(false);
    }
  };

  const testAdCreatives = async () => {
    if (!diagnosticSelectedAccount) return;
    
    setIsLoading(true);
    const updatedResults = {...testResults};
    updatedResults.creativesTest = { status: 'pending', message: 'Fetching ad creatives...' };
    setTestResults(updatedResults);
    
    try {
      const accountId = diagnosticSelectedAccount.replace('act_', '');
      
      const adsResponse = await axios.get(
        `https://graph.facebook.com/${META_API_VERSION}/act_${accountId}/ads`,
        {
          params: {
            access_token: accessToken,
            fields: 'name,creative{id,thumbnail_url,object_story_spec}',
            limit: 50
          }
        }
      );
      
      if (adsResponse.data.error) {
        updatedResults.creativesTest = { 
          status: 'failed', 
          message: `Failed to fetch ads with creatives: ${adsResponse.data.error.message}`,
          data: adsResponse.data.error
        };
      } else if (!adsResponse.data.data || adsResponse.data.data.length === 0) {
        updatedResults.creativesTest = { 
          status: 'warning', 
          message: 'No ads found for this account',
          data: adsResponse.data
        };
      } else {
        const ads = adsResponse.data.data;
        const creatives = ads
          .filter(ad => ad.creative)
          .map(ad => ({
            adId: ad.id,
            adName: ad.name,
            creativeId: ad.creative.id,
            thumbnailUrl: ad.creative.thumbnail_url || null,
            objectStorySpec: ad.creative.object_story_spec || null
          }));
          
        if (creatives.length === 0) {
          updatedResults.creativesTest = { 
            status: 'warning', 
            message: 'No creatives found in the ads for this account',
            data: ads
          };
        } else {
          updatedResults.creativesTest = { 
            status: 'success', 
            message: `Found ${creatives.length} ad creatives`,
            data: creatives
          };
        }
      }
    } catch (error) {
      console.error('Error fetching ad creatives:', error);
      updatedResults.creativesTest = { 
        status: 'failed', 
        message: `Error fetching ad creatives: ${error.message}`,
        data: error.response?.data || error
      };
    } finally {
      setTestResults(updatedResults);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Meta Ads Creative Analytics</h1>
                <p className="mt-2 text-sm text-gray-600">Analyze your creative performance with adaptive pattern recognition</p>
              </div>
              
              {/* Data Source Indicator */}
              {isConnected && (
                <div className="flex items-center space-x-4">
                  <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${isRealData ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
                    <div className={`w-2 h-2 rounded-full mr-2 ${isRealData ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                    {isRealData ? 'Live API Data' : 'Sample Data'}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!isConnected ? (
          /* Connection Section */
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-8 text-center">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Connect Your Meta Account</h3>
                <p className="text-blue-100">Get started by connecting your Meta Ads account to analyze creative performance</p>
              </div>
              
              <div className="px-6 py-6 text-center">
                <MetaAuthButton 
                  onAuthSuccess={(token) => {
                    console.log("Auth success callback with token:", token);
                    setAccessToken(token);
                    
                    // Fetch accounts after successful login
                    axios.get(
                      `https://graph.facebook.com/${META_API_VERSION}/me/adaccounts`,
                      {
                        params: {
                          access_token: token,
                          fields: 'id,name,account_id,account_status',
                          limit: 50
                        }
                      }
                    )
                    .then(response => {
                      if (response.data && response.data.data && response.data.data.length > 0) {
                        setAccounts(response.data.data);
                        setSelectedAccountId(response.data.data[0].id);
                        setIsConnected(true);
                        
                        // Automatically run diagnostics after login
                        runDiagnostics(token);
                      } else {
                        setError('No ad accounts found for this user.');
                      }
                    })
                    .catch(error => {
                      console.error('Error fetching accounts:', error);
                      setError('Error fetching accounts: ' + error.message);
                    });
                  }} 
                />
                
                {error && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}
                
                <p className="text-xs text-gray-500 mt-4">
                  Secure connection via Facebook OAuth
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Controls Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex flex-wrap items-end gap-4">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ad Account</label>
                  <select
                    value={selectedAccountId}
                    onChange={handleAccountChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {accounts.map(account => (
                      <option key={account.id} value={account.id}>
                        {account.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                  <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Last 7 Days">Last 7 Days</option>
                    <option value="Last 30 Days">Last 30 Days</option>
                    <option value="Last 60 Days">Last 60 Days</option>
                    <option value="Last 90 Days">Last 90 Days</option>
                  </select>
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={handleToggleDataSource}
                    className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-200 transition-colors duration-200 text-sm font-medium"
                  >
                    {isRealData ? 'Switch to Sample Data' : 'Try Real Data'}
                  </button>
                  
                  <button
                    onClick={toggleDiagnostic}
                    className="px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg border border-gray-200 transition-colors duration-200 text-sm font-medium"
                  >
                    {showDiagnostic ? 'Hide Diagnostics' : 'Show Diagnostics'}
                  </button>
                </div>
              </div>
              
              {isLoading && (
                <div className="mt-4 flex items-center text-blue-600">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Loading analytics data...
                </div>
              )}
            </div>
            
            {/* Error Alert */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Analytics Content */}
            {analyticsData && (
              <div className="space-y-8">
                {/* Charts Section */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <AdMetricsChart 
                      analyticsData={analyticsData} 
                      dateRange={dateRange}
                      timeSeriesData={timeSeriesData} 
                      accessToken={accessToken}
                      isRealData={isRealData}
                      onDateRangeChange={(newDateRange) => setDateRange(newDateRange)}
                    />
                  </div>
                  
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <AiAdvisor 
                      analyticsData={analyticsData}
                      creativePerformanceData={analyticsData?.creativePerformance}
                      audienceInsightsData={{
                        ageData: ageBreakdown,
                        genderData: genderBreakdown,
                        platformData: platformBreakdown,
                        placementData: placementBreakdown
                      }}
                    />
                  </div>
                </div>
                            
                {/* Breakdown Charts Section */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <BreakdownChart 
                    ageData={ageBreakdown}
                    genderData={genderBreakdown}
                    platformData={platformBreakdown}
                    placementData={placementBreakdown}
                    isRealData={isRealData}
                    dateRange={dateRange}
                  />
                </div>
                            
                {/* Creative Performance Table Section */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <EnhancedCreativePerformanceTable 
                    analyticsData={analyticsData}
                    selectedAccountId={selectedAccountId}
                    benchmarks={benchmarks}
                    isRealData={isRealData}
                    dateRange={dateRange}
                    onCreativeSelect={(creative) => {
                      console.log("Selected creative:", creative);
                    }}
                  />
                </div>
              </div>
            )}
            
            {/* Diagnostic Tool Section */}
            {showDiagnostic && (
              <div className="bg-white rounded-xl shadow-sm border-2 border-blue-200 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-blue-200">
                  <h3 className="text-lg font-semibold text-gray-900">Meta API Diagnostic Tool</h3>
                  <p className="text-sm text-gray-600 mt-1">Test your API connection and permissions</p>
                </div>
                
                <div className="p-6">
                  <div className="mb-6">
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <p className="text-sm text-gray-700 mb-2">
                        <span className="font-medium">Access Token:</span> 
                        <span className="font-mono text-xs ml-2">{accessToken ? `${accessToken.substring(0, 20)}...` : 'Not Available'}</span>
                      </p>
                    </div>
                    
                    <button
                      onClick={() => runDiagnostics()}
                      disabled={isLoading || !accessToken}
                      className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-2 px-6 rounded-lg transition-colors duration-200"
                    >
                      {isLoading ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Running...
                        </span>
                      ) : 'Run Diagnostics'}
                    </button>
                  </div>
                  
                  {/* Test Results */}
                  {Object.keys(testResults).length > 0 && (
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900 text-lg">Diagnostic Results</h4>
                      
                      <div className="grid gap-4">
                        {Object.entries(testResults).map(([testName, result]) => (
                          <div key={testName} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                            <div className="flex items-center mb-2">
                              <div className={`w-3 h-3 rounded-full mr-3 ${
                                result.status === 'success' ? 'bg-green-500' : 
                                result.status === 'warning' ? 'bg-yellow-500' : 
                                result.status === 'pending' ? 'bg-blue-500 animate-pulse' : 'bg-red-500'
                              }`}></div>
                              <h5 className="font-medium text-gray-900">
                                {testName === 'tokenTest' ? 'Access Token Validation' : 
                                 testName === 'permissionsTest' ? 'Permissions Check' :
                                 testName === 'accountsTest' ? 'Ad Accounts Access' :
                                 testName === 'insightsTest' ? 'Insights Data Access' :
                                 testName === 'campaignsTest' ? 'Campaigns Access' :
                                 testName === 'creativesTest' ? 'Ad Creatives Access' : testName}
                              </h5>
                            </div>
                            
                            <p className="text-sm text-gray-600 mb-2">{result.message}</p>
                            
                            {result.data && (
                              <details className="text-sm">
                                <summary className="cursor-pointer text-blue-600 hover:text-blue-800 font-medium">
                                  View Details
                                </summary>
                                <pre className="mt-2 p-3 bg-gray-100 rounded-md overflow-auto max-h-40 text-xs border">
                                  {JSON.stringify(result.data, null, 2)}
                                </pre>
                              </details>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Advanced Testing Section */}
                  {testResults.accountsTest && testResults.accountsTest.status === 'success' && (
                    <div className="mt-8 pt-6 border-t border-gray-200">
                      <h4 className="font-medium text-gray-900 text-lg mb-4">Advanced Testing</h4>
                      
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Select Ad Account for Testing
                        </label>
                        <select
                          value={diagnosticSelectedAccount}
                          onChange={(e) => setDiagnosticSelectedAccount(e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          {testResults.accountsTest.data.map(account => (
                            <option key={account.id} value={account.id}>
                              {account.name} ({account.accountId}) - {account.status}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={testAccountInsights}
                          disabled={isLoading}
                          className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                        >
                          Test Insights Access
                        </button>
                        <button
                          onClick={testCampaigns}
                          disabled={isLoading}
                          className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                        >
                          Test Campaigns Access
                        </button>
                        <button
                          onClick={testAdCreatives}
                          disabled={isLoading}
                          className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                        >
                          Test Ad Creatives Access
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
