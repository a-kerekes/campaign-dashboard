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
  const [isRealData, setIsRealData] = useState(true);
  
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

  // Enhanced breakdown data processing helper
  const enhanceBreakdownData = (data) => {
    return data.map(item => {
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
  };

  // Fetch breakdown data for all demographic segments
  const fetchBreakdownData = async () => {
    try {
      // Fetch and enhance age breakdown
      let ageData = await metaAPI.fetchBreakdownMetrics('age', dateRange, selectedAccountId, accessToken);
      setAgeBreakdown(enhanceBreakdownData(ageData));
      
      // Fetch and enhance gender breakdown
      let genderData = await metaAPI.fetchBreakdownMetrics('gender', dateRange, selectedAccountId, accessToken);
      setGenderBreakdown(enhanceBreakdownData(genderData));
      
      // Fetch and enhance platform breakdown
      let platformData = await metaAPI.fetchBreakdownMetrics('publisher_platform', dateRange, selectedAccountId, accessToken);
      setPlatformBreakdown(enhanceBreakdownData(platformData));
      
      // Fetch and enhance placement breakdown
      let placementData = await metaAPI.fetchBreakdownMetrics('platform_position', dateRange, selectedAccountId, accessToken);
      setPlacementBreakdown(enhanceBreakdownData(placementData));
      
      console.log('Successfully loaded and enhanced all breakdown data');
    } catch (breakdownError) {
      console.error('Error loading breakdown data:', breakdownError);
    }
  };

  // Calculate date range for API calls
  const calculateDateRange = () => {
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
    return { since, until };
  };

  // Fetch time series data
  const fetchTimeSeriesData = async () => {
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
  };

  // Fetch ad insights with batching
  const fetchAdInsights = async (ads, since, until) => {
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
            `https://graph.facebook.com/${META_API_VERSION}/act_${selectedAccountId.toString().replace('act_', '')}/insights`,
            {
              params: {
                access_token: accessToken,
                time_range: JSON.stringify({ since, until }),
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

    return adInsightsResponse;
  };

  // Process creative performance data
  const processCreativePerformance = (ads, adInsightsResponse, creativesMap) => {
    return ads
      .filter(ad => ad.creative)
      .map(ad => {
        const insight = adInsightsResponse.data.data && adInsightsResponse.data.data.find(i => i.ad_id === ad.id);
        
        // Enhanced thumbnail logic
        const creativeLibData = creativesMap[ad.creative.id];
        
        const thumbnailUrl = (() => {
          const candidates = [
            creativeLibData?.image_url,
            creativeLibData?.thumbnail_url,
            creativeLibData?.object_story_spec?.video_data?.image_url,
            creativeLibData?.object_story_spec?.link_data?.picture,
            // Fallback: Generate thumbnail URL from creative ID
            ad.creative?.id ? `https://graph.facebook.com/v22.0/${ad.creative.id}?fields=thumbnail_url&access_token=${accessToken}` : null
          ];
          
          const validUrl = candidates.find(url => url && url.length > 0);
          
          // If no URL found, try to fetch directly from creative ID
          if (!validUrl && ad.creative?.id) {
            return `https://scontent.fxxx.fbcdn.net/v/creative_preview/${ad.creative.id}`;
          }
          
          return validUrl || null;
        })();
        
        // Calculate ROAS for this specific creative
        const spend = insight ? parseFloat(insight.spend || 0) : 0;
        const purchases = insight && insight.actions ? 
          parseInt(insight.actions.find(a => a.action_type === 'purchase')?.value || 0) : 0;
        
        const purchaseValue = insight && insight.action_values ? 
          parseFloat(insight.action_values.find(a => a.action_type === 'purchase')?.value || 0) : 0;
        
        const roas = spend > 0 && purchaseValue > 0 ? purchaseValue / spend : 0;
        
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
          revenue: purchaseValue
        };
      });
  };

  // Main data loading function
  const loadPerformanceData = useCallback(async () => {
    if (!accessToken || !selectedAccountId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Format account ID to ensure proper format
      const formattedAccountId = selectedAccountId.toString().replace('act_', '');
      
      // Calculate date range
      const { since, until } = calculateDateRange();
      
      // FETCH DAILY TIME SERIES DATA
      await fetchTimeSeriesData();
      
      // FETCH BREAKDOWN DATA
      await fetchBreakdownData();
      
      // 1. Fetch account insights
      const insightsResponse = await axios.get(
        `https://graph.facebook.com/${META_API_VERSION}/act_${formattedAccountId}/insights`,
        {
          params: {
            access_token: accessToken,
            time_range: JSON.stringify({ since, until }),
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
      let adsResponse;
      try {
        adsResponse = await axios.get(
          `https://graph.facebook.com/${META_API_VERSION}/act_${formattedAccountId}/ads`,
          {
            params: {
              access_token: accessToken,
              fields: 'name,creative{id},adset{name}', // Simplified fields
              limit: 500
            }
          }
        );
        console.log('✅ Ads fetch successful:', adsResponse.data.data?.length || 0, 'ads found');
      } catch (adsError) {
        console.error('❌ Failed to fetch ads:', adsError.message);
        // Fallback to basic insights only
        adsResponse = { data: { data: [] } };
      }

      console.log('🔍 RAW ADS RESPONSE:', adsResponse.data.data);
      console.log('🔍 FIRST AD WITH CREATIVE:', adsResponse.data.data.find(ad => ad.creative));

      // 3b. Fetch creative library with better thumbnail handling
let creativesResponse = { data: { data: [] } };
try {
  // Get all unique creative IDs from ads
  const uniqueCreativeIds = [...new Set(ads.map(ad => ad.creative?.id).filter(Boolean))];
  console.log(`🔍 Found ${uniqueCreativeIds.length} unique creative IDs to fetch`);
  
  if (uniqueCreativeIds.length > 0) {
    // Fetch creatives in batches
    const batchSize = 25;
    const allCreatives = [];
    
    for (let i = 0; i < uniqueCreativeIds.length; i += batchSize) {
      const batch = uniqueCreativeIds.slice(i, i + batchSize);
      
      try {
        const batchResponse = await axios.get(
          `https://graph.facebook.com/${META_API_VERSION}/`,
          {
            params: {
              access_token: accessToken,
              ids: batch.join(','),
              fields: 'image_url,thumbnail_url,object_story_spec'
            }
          }
        );
        
        // Convert object response to array
        Object.values(batchResponse.data).forEach(creative => {
          if (creative.id) allCreatives.push(creative);
        });
        
        console.log(`✅ Fetched batch ${Math.floor(i/batchSize) + 1}: ${Object.keys(batchResponse.data).length} creatives`);
      } catch (batchError) {
        console.warn(`⚠️ Batch ${Math.floor(i/batchSize) + 1} failed:`, batchError.message);
      }
    }
    
    creativesResponse = { data: { data: allCreatives } };
    console.log(`✅ Total creatives fetched: ${allCreatives.length}`);
  }
} catch (creativesError) {
  console.warn('⚠️ Creative library fetch failed:', creativesError.message);
}

      console.log('🔍 CREATIVE LIBRARY RESPONSE:', creativesResponse.data?.data || 'No creative library data');

      // Create a lookup map for creative library data
      const creativesMap = {};
      if (creativesResponse.data?.data) {
        creativesResponse.data.data.forEach(creative => {
          creativesMap[creative.id] = creative;
        });
        console.log(`📚 Built creative library map with ${Object.keys(creativesMap).length} entries`);
      } else {
        console.log('📚 No creative library data available, using basic thumbnails');
      }

      // Extract ads from response
      const ads = adsResponse.data.data;

      // 4. Fetch ad insights for performance data - WITH BATCHING
      const adInsightsResponse = await fetchAdInsights(ads, since, until);

      // Process creative performance data
      const creativePerformance = processCreativePerformance(ads, adInsightsResponse, creativesMap);

      console.log('🧹 CLEANED CREATIVE DATA: Ready for ADAPTIVE pattern recognition in table');
      
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
      
      // Calculate estimated funnel data
      const purchaseAction = accountInsights.actions?.find(a => a.action_type === 'purchase');
      const estimatedPurchases = purchaseAction ? parseInt(purchaseAction.value) : Math.round(summary.totalClicks * 0.1);
      
      const landingPageViewAction = accountInsights.actions?.find(a => a.action_type === 'landing_page_view');
      const estimatedLandingPageViews = landingPageViewAction ? parseInt(landingPageViewAction.value) : Math.round(summary.totalClicks * 0.8);
      
      const addToCartAction = accountInsights.actions?.find(a => a.action_type === 'add_to_cart');
      const estimatedAddToCarts = addToCartAction ? parseInt(addToCartAction.value) : Math.round(summary.totalClicks * 0.3);

      const funnel = {
        impressions: summary.totalImpressions,
        clicks: summary.totalClicks,
        landingPageViews: estimatedLandingPageViews,
        addToCarts: estimatedAddToCarts,
        purchases: estimatedPurchases
      };

      const purchaseValueAction = accountInsights.action_values?.find(a => a.action_type === 'purchase');
      const revenue = purchaseValueAction ? parseFloat(purchaseValueAction.value) : 0;

      const advancedMetrics = {
        cpm: summary.avgCpm,
        cpc: summary.avgCpc,
        costPerPurchase: funnel.purchases > 0 ? summary.totalSpend / funnel.purchases : 0,
        roas: revenue > 0 ? revenue / summary.totalSpend : 0,
        linkClickToConversion: funnel.purchases > 0 ? (funnel.purchases / summary.totalClicks) * 100 : 0
      };
      
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
      
      console.log('✅ Performance data loaded successfully - ready for ADAPTIVE processing');
      
    } catch (error) {
      console.error('Error loading performance data:', error);
      setError('Error loading data from Meta API. Please check console for details.');
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, selectedAccountId, dateRange]);

  // Load performance data when account or date range changes
  useEffect(() => {
    if (isConnected && selectedAccountId && accessToken) {
      loadPerformanceData();
    }
  }, [isConnected, selectedAccountId, dateRange, accessToken, loadPerformanceData]);

  // Event handlers
  const handleAccountChange = (e) => {
    const accountId = e.target.value;
    setSelectedAccountId(accountId);
  };

  const toggleDiagnostic = () => {
    setShowDiagnostic(!showDiagnostic);
  };

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

  // Diagnostic functions
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
            time_range: JSON.stringify({ since, until }),
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
        `https://graph.facebook.com/${META_API_VERSION}/act_${selectedAccountId.toString().replace('act_', '')}/ads`,
        {
          params: {
            access_token: accessToken,
            fields: 'name,creative{id,thumbnail_url},adset{name}', // Add thumbnail_url
            limit: 500
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

  // Handle authentication success
  const handleAuthSuccess = (token) => {
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
                <MetaAuthButton onAuthSuccess={handleAuthSuccess} />
                
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
                            
                {/* Creative Performance Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <EnhancedCreativePerformanceTable 
                    analyticsData={analyticsData}
                    selectedAccountId={selectedAccountId}
                    benchmarks={benchmarks}
                    isRealData={isRealData}  // ← ADD THIS LINE
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

export default CreativeAnalyticsDashboard;