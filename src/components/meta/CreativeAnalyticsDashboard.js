// src/components/meta/CreativeAnalyticsDashboard.js
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import AdMetricsChart from './AdMetricsChart';
import AiAdvisor from './AiAdvisor';
import BreakdownChart from './BreakdownChart';
import metaAPI from './metaAPI';
import MetaAuthButton from './MetaAuthButton';

// Meta API version constant
const META_API_VERSION = 'v22.0';

// Import the specific functions from the default export
const { fetchDailyMetrics, fetchBreakdownMetrics } = metaAPI;

// Self-contained utility functions (no external imports needed)
const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(value);
};

const formatNumber = (value) => {
  return new Intl.NumberFormat('en-US').format(value);
};

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
  
  // Breakdown data state
  const [ageBreakdown, setAgeBreakdown] = useState(null);
  const [genderBreakdown, setGenderBreakdown] = useState(null);
  const [platformBreakdown, setPlatformBreakdown] = useState(null);
  const [placementBreakdown, setPlacementBreakdown] = useState(null);
  
  // Diagnostic tool state
  const [showDiagnostic, setShowDiagnostic] = useState(false);
  const [testResults, setTestResults] = useState({});
  const [isFbInitialized, setIsFbInitialized] = useState(false);
  const [diagnosticSelectedAccount, setDiagnosticSelectedAccount] = useState('');

  // Initialize Facebook SDK on component mount
useEffect(() => {
  // We don't need to initialize the SDK here since MetaAuthButton handles it
  console.log("Using MetaAuthButton for SDK initialization");
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
      // Create yesterday date
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
      
      // Start from yesterday and go back daysAgo days
      const startDate = new Date(yesterday);
      startDate.setDate(yesterday.getDate() - (daysAgo - 1));
      
      const since = startDate.toISOString().split('T')[0];
      const until = yesterday.toISOString().split('T')[0]; // End at yesterday, not today
      
      console.log(`Date range: ${dateRange}, from ${since} to ${until}`);
      
      // FETCH DAILY TIME SERIES DATA
      try {
        const dailyData = await fetchDailyMetrics(dateRange, selectedAccountId);
        setTimeSeriesData(dailyData);
        console.log(`Successfully loaded ${dailyData.length} days of time series data`);
      } catch (timeSeriesError) {
        console.error('Error loading time series data:', timeSeriesError);
        // Continue with other data loading even if time series fails
      }
      
      // FETCH BREAKDOWN DATA
      try {
        // Fetch age breakdown
        const ageData = await fetchBreakdownMetrics('age', dateRange, selectedAccountId);
        setAgeBreakdown(ageData);
        
        // Fetch gender breakdown
        const genderData = await fetchBreakdownMetrics('gender', dateRange, selectedAccountId);
        setGenderBreakdown(genderData);
        
        // Fetch platform breakdown
        const platformData = await fetchBreakdownMetrics('publisher_platform', dateRange, selectedAccountId);
        setPlatformBreakdown(platformData);
        
        // Fetch placement breakdown
        const placementData = await fetchBreakdownMetrics('platform_position', dateRange, selectedAccountId);
        setPlacementBreakdown(placementData);
        
        console.log('Successfully loaded all breakdown data');
      } catch (breakdownError) {
        console.error('Error loading breakdown data:', breakdownError);
        // Continue with other data loading even if breakdowns fail
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
            limit: 100
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
            limit: 100
          }
        }
      );
      
      // 3. Fetch ads with their creative info
      const adsResponse = await axios.get(
        `https://graph.facebook.com/${META_API_VERSION}/act_${formattedAccountId}/ads`,
        {
          params: {
            access_token: accessToken,
            fields: 'name,creative{id,thumbnail_url,object_story_spec},adset{name}',
            limit: 100 // Increased from 50 to get more ads
          }
        }
      );
      
      // Get all the ad IDs to use for filtering insights
      const ads = adsResponse.data.data;
      const adIds = ads.filter(ad => ad.creative).map(ad => ad.id);
      
      if (adIds.length === 0) {
        throw new Error('No ads with creatives found for this account');
      }
      
      // 4. Now fetch insights directly at the ad level, filtering for these specific ads
      const adInsightsResponse = await axios.get(
        `https://graph.facebook.com/${META_API_VERSION}/act_${formattedAccountId}/insights`,
        {
          params: {
            access_token: accessToken,
            level: 'ad',
            fields: 'ad_id,ad_name,impressions,clicks,spend,ctr,cpc,cpm,actions,action_values',
            filtering: JSON.stringify([{
              field: 'ad.id',
              operator: 'IN',
              value: adIds
            }]),
            time_range: JSON.stringify({
              since,
              until
            }),
            limit: 500
          }
        }
      );
      
      console.log('Ad insights response:', adInsightsResponse.data);
      
      // 5. Map insights to ads with creatives
      const creativePerformance = ads
        .filter(ad => ad.creative)
        .map(ad => {
          const insight = adInsightsResponse.data.data && adInsightsResponse.data.data.find(i => i.ad_id === ad.id);
          
          // Find purchase actions if available
          const purchases = insight && insight.actions 
            ? insight.actions.find(a => a.action_type === 'purchase')?.value || 0 
            : 0;
          
          // Find purchase value if available
          const revenue = insight && insight.action_values 
            ? insight.action_values.find(a => a.action_type === 'purchase')?.value || 0 
            : 0;
          
          // Calculate ROAS if both spend and revenue are available
          const roas = (insight && parseFloat(insight.spend) > 0 && revenue > 0) 
            ? revenue / parseFloat(insight.spend) 
            : 0;
          
          // Calculate cost per purchase if both spend and purchases are available
          const costPerPurchase = (insight && parseFloat(insight.spend) > 0 && purchases > 0) 
            ? parseFloat(insight.spend) / purchases 
            : 0;
          
          return {
            adId: ad.id,
            adName: ad.name,
            adsetName: ad.adset ? ad.adset.name : 'Unknown',
            creativeId: ad.creative.id,
            thumbnailUrl: ad.creative.thumbnail_url || null,
            objectStorySpec: ad.creative.object_story_spec || null,
            accountId: selectedAccountId, // Add this to track which account each creative belongs to
            impressions: insight ? parseInt(insight.impressions || 0) : 0,
            clicks: insight ? parseInt(insight.clicks || 0) : 0,
            spend: insight ? parseFloat(insight.spend || 0) : 0,
            ctr: insight ? parseFloat(insight.ctr || 0) * 100 : 0,
            cpm: insight ? parseFloat(insight.cpm || 0) : 0,
            cpc: insight ? parseFloat(insight.cpc || 0) : 0,
            purchases: purchases,
            revenue: revenue,
            roas: roas,
            costPerPurchase: costPerPurchase,
            conversionRate: insight && parseInt(insight.clicks) > 0 && purchases > 0 
              ? (purchases / parseInt(insight.clicks)) * 100 
              : 0
          };
        });
      
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
      const estimatedPurchases = purchaseAction ? parseInt(purchaseAction.value) : Math.round(summary.totalClicks * 0.1); // Assuming 10% conversion rate
      
      const landingPageViewAction = accountInsights.actions?.find(a => a.action_type === 'landing_page_view');
      const estimatedLandingPageViews = landingPageViewAction ? parseInt(landingPageViewAction.value) : Math.round(summary.totalClicks * 0.8); // Assuming 80% land on the page
      
      const addToCartAction = accountInsights.actions?.find(a => a.action_type === 'add_to_cart');
      const estimatedAddToCarts = addToCartAction ? parseInt(addToCartAction.value) : Math.round(summary.totalClicks * 0.3); // Assuming 30% add to cart

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
  }, [accessToken, selectedAccountId, dateRange]);

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

  const runDiagnostics = async (token = accessToken) => {
    if (!token) {
      setError('Please connect with Facebook first to generate an access token');
      return;
    }

    setIsLoading(true);
    setTestResults({});
    
    try {
      // Test 1: Verify token validity
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
        
        // Store for diagnostic tool
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
      // Format account ID to ensure it starts with "act_"
      const accountId = diagnosticSelectedAccount.replace('act_', '');
      
      // Attempt to fetch basic account insights
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
      // Format account ID to ensure it starts with "act_"
      const accountId = diagnosticSelectedAccount.replace('act_', '');
      
      // Attempt to fetch campaigns
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
      // Format account ID to ensure it starts with "act_"
      const accountId = diagnosticSelectedAccount.replace('act_', '');
      
      // Attempt to fetch ad creatives
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
        // Extract creatives from ads response
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

  // Complete renderCreativeTable function with inline styles
  const renderCreativeTable = () => {
    if (!analyticsData || !analyticsData.creativePerformance || analyticsData.creativePerformance.length === 0) {
      return (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <p className="text-gray-500 text-center">No creative performance data available for the selected account and date range.</p>
        </div>
      );
    }
    
    // Filter creatives to show only those from the currently selected account
    let filteredCreatives = analyticsData.creativePerformance.filter(creative => 
      creative.accountId === selectedAccountId
    );
    
    if (filteredCreatives.length === 0) {
      return (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <p className="text-gray-500 text-center">No creative performance data available for the selected account.</p>
        </div>
      );
    }
    
    // Group creatives by their creative asset (based on thumbnailUrl or creativeId)
    const groupedCreatives = {};
    
    filteredCreatives.forEach(creative => {
      // Use the thumbnail URL or creative ID as the grouping key
      const groupKey = creative.thumbnailUrl || creative.creativeId;
      
      if (!groupedCreatives[groupKey]) {
        // Store the full ad name
        const fullName = creative.adName;
        
        // Initialize a new group with the first creative's data
        groupedCreatives[groupKey] = {
          creativeId: creative.creativeId,
          thumbnailUrl: creative.thumbnailUrl,
          adName: fullName, // Keep full name
          objectStorySpec: creative.objectStorySpec,
          impressions: 0,
          clicks: 0,
          spend: 0,
          purchases: 0,
          revenue: 0,
          instances: 0,
          adsets: new Set()
        };
      }
      
      // For all metrics, ensure we're working with proper numbers
      groupedCreatives[groupKey].impressions += parseInt(creative.impressions || 0, 10);
      groupedCreatives[groupKey].clicks += parseInt(creative.clicks || 0, 10);
      groupedCreatives[groupKey].spend += parseFloat(creative.spend || 0);
      
      // Special handling for purchases - ignore the field if it's unreasonably large
      let purchaseCount = 0;
      if (creative.purchases !== undefined && creative.purchases !== null) {
        if (typeof creative.purchases === 'string') {
          // If it's a comma-separated string, remove commas before parsing
          const cleanedValue = creative.purchases.replace(/,/g, '');
          purchaseCount = parseInt(cleanedValue, 10) || 0;
        } else {
          purchaseCount = parseInt(creative.purchases, 10) || 0;
        }
        
        // If the number is unrealistically large (Meta API data issue)
        if (purchaseCount > 1000000) {
          console.warn(`Ignoring unrealistic purchase value: ${purchaseCount} for ${creative.adName}`);
          // Try to extract a more realistic number from the actual data in the API
          // Often, the real purchase count is at the start of the string
          if (typeof creative.purchases === 'string' && creative.purchases.includes(',')) {
            const firstPart = creative.purchases.split(',')[0];
            purchaseCount = parseInt(firstPart, 10) || 0;
            
            // Still sanity check it
            if (purchaseCount > 1000) {
              purchaseCount = 0;
            }
          } else {
            purchaseCount = 0;
          }
        }
      }
      groupedCreatives[groupKey].purchases += purchaseCount;
      
      // Revenue handling
      groupedCreatives[groupKey].revenue += parseFloat(creative.revenue || 0);
      groupedCreatives[groupKey].instances += 1;
      
      // Track distinct ad sets
      if (creative.adsetName) {
        groupedCreatives[groupKey].adsets.add(creative.adsetName);
      }
    });
    
    // Convert the grouped data to an array and calculate derived metrics
    const summarizedCreatives = Object.values(groupedCreatives).map(group => {
      // Calculate derived metrics
      const ctr = group.impressions > 0 ? (group.clicks / group.impressions) * 100 : 0;
      const cpc = group.clicks > 0 ? group.spend / group.clicks : 0;
      const costPerPurchase = group.purchases > 0 ? group.spend / group.purchases : 0;
      const roas = group.spend > 0 && group.revenue > 0 ? group.revenue / group.spend : 0;
      
      return {
        ...group,
        ctr,
        cpc,
        costPerPurchase,
        roas,
        adsetCount: group.adsets.size
      };
    });
    
    // Sort by spend (highest to lowest)
    const sortedCreatives = summarizedCreatives.sort((a, b) => b.spend - a.spend);
    
    // Custom inline styles for more reliable alternating rows
    const tableStyles = {
      table: {
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '0.75rem',
      },
      headerCell: {
        backgroundColor: '#EBF5FF', // Light blue for header
        color: '#4A5568',
        fontWeight: '600',
        textAlign: 'right',
        padding: '0.75rem 1rem',
        borderBottom: '1px solid #E2E8F0',
        position: 'sticky',
        top: 0,
        textTransform: 'uppercase',
      },
      headerCellLeft: {
        backgroundColor: '#EBF5FF', // Light blue for header
        color: '#4A5568',
        fontWeight: '600',
        textAlign: 'left',
        padding: '0.75rem 1rem',
        borderBottom: '1px solid #E2E8F0',
        position: 'sticky',
        top: 0,
        textTransform: 'uppercase',
      },
      evenRow: {
        backgroundColor: '#FFFFFF', // White for even rows
      },
      oddRow: {
        backgroundColor: '#F0F7FF', // Very light blue for odd rows
      },
      cell: {
        padding: '0.75rem 1rem',
        borderBottom: '1px solid #E2E8F0',
        textAlign: 'right',
        color: '#4A5568',
      },
      cellLeft: {
        padding: '0.75rem 1rem',
        borderBottom: '1px solid #E2E8F0',
        textAlign: 'left',
        color: '#4A5568',
      },
      positiveRoas: {
        color: '#38A169', // Green
        fontWeight: '600',
      },
      negativeRoas: {
        color: '#E53E3E', // Red
        fontWeight: '600',
      }
    };
    
    return (
      <div style={{ overflowX: 'auto', backgroundColor: 'white', borderRadius: '0.375rem', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)' }}>
        <table style={tableStyles.table}>
          <thead>
            <tr>
              <th style={tableStyles.headerCellLeft}>Creative</th>
              <th style={tableStyles.headerCell}>Ad Sets</th>
              <th style={tableStyles.headerCell}>Impressions</th>
              <th style={tableStyles.headerCell}>Clicks</th>
              <th style={tableStyles.headerCell}>CTR</th>
              <th style={tableStyles.headerCell}>CPC</th>
              <th style={tableStyles.headerCell}>CPM</th>
              <th style={tableStyles.headerCell}>Purchases</th>
              <th style={tableStyles.headerCell}>Cost/Purchase</th>
              <th style={tableStyles.headerCell}>Spend</th>
              <th style={tableStyles.headerCell}>ROAS</th>
            </tr>
          </thead>
          <tbody>
            {sortedCreatives.map((creative, index) => (
              <tr 
                key={creative.creativeId} 
                style={index % 2 === 0 ? tableStyles.evenRow : tableStyles.oddRow}
              >
                <td style={tableStyles.cellLeft}>
                  <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                    {creative.thumbnailUrl && (
                      <div style={{ marginRight: '0.75rem' }}>
                        <img 
                          style={{ width: '2.25rem', height: '2.25rem', borderRadius: '0.125rem', objectFit: 'cover', border: '1px solid #E2E8F0' }} 
                          src={creative.thumbnailUrl} 
                          alt="" 
                        />
                      </div>
                    )}
                    <div style={{ maxWidth: '20rem' }}>
                      <div style={{ fontWeight: '500', marginBottom: '0.25rem', wordBreak: 'break-word' }}>
                        {creative.adName}
                      </div>
                      <div style={{ color: '#718096', fontSize: '0.75rem' }}>
                        Instances: {creative.instances}
                      </div>
                    </div>
                  </div>
                </td>
                <td style={tableStyles.cell}>
                  {creative.adsetCount}
                </td>
                <td style={tableStyles.cell}>
                  {formatNumber(creative.impressions)}
                </td>
                <td style={tableStyles.cell}>
                  {formatNumber(creative.clicks)}
                </td>
                <td style={tableStyles.cell}>
                  {creative.ctr >= 0 ? creative.ctr.toFixed(2) : "0.00"}%
                </td>
                <td style={tableStyles.cell}>
                  {formatCurrency(creative.cpc)}
                </td>
                <td style={tableStyles.cell}>
                  {formatCurrency(creative.impressions > 0 ? (creative.spend / creative.impressions) * 1000 : 0)}
                </td>
                <td style={tableStyles.cell}>
                  {formatNumber(creative.purchases)}
                </td>
                <td style={tableStyles.cell}>
                  {creative.purchases > 0 ? formatCurrency(creative.costPerPurchase) : "$0.00"}
                </td>
                <td style={{...tableStyles.cell, fontWeight: '600'}}>
                  {formatCurrency(creative.spend)}
                </td>
                <td style={{
                  ...tableStyles.cell, 
                  ...(creative.roas >= 1 ? tableStyles.positiveRoas : tableStyles.negativeRoas)
                }}>
                  {creative.roas > 0 ? creative.roas.toFixed(2) + 'x' : '0.00x'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Meta Ads Creative Analytics</h2>
        
        {!isConnected ? (
          <div className="text-center py-8 bg-white rounded-lg shadow-md">
            <p className="mb-4">Connect to your Meta Ads account to analyze your creative performance.</p>
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
              <p className="text-red-500 mt-4">{error}</p>
            )}
            
            <p className="text-sm text-gray-500 mt-4">Note: Currently using mock data for development.</p>
          </div>
        ) : (
          <div>
            <div className="flex flex-wrap mb-6 items-end">
              <div className="mr-4 mb-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Ad Account</label>
                <select
                  value={selectedAccountId}
                  onChange={handleAccountChange}
                  className="border p-2 rounded min-w-[200px]"
                >
                  {accounts.map(account => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="mr-4 mb-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="border p-2 rounded min-w-[200px]"
                >
                  <option value="Last 7 Days">Last 7 Days</option>
                  <option value="Last 30 Days">Last 30 Days</option>
                  <option value="Last 60 Days">Last 60 Days</option>
                  <option value="Last 90 Days">Last 90 Days</option>
                </select>
              </div>
              
              <div className="mb-2">
                <button
                  onClick={toggleDiagnostic}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded"
                >
                  {showDiagnostic ? 'Hide Diagnostics' : 'Show Diagnostics'}
                </button>
              </div>
              
              {isLoading && (
                <div className="ml-4 mb-2">
                  <p className="text-blue-600">Loading data...</p>
                </div>
              )}
            </div>
            
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                <p>{error}</p>
              </div>
            )}
            
            {analyticsData && (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  <AdMetricsChart 
                    analyticsData={analyticsData} 
                    dateRange={dateRange}
                    timeSeriesData={timeSeriesData} 
                  />
                  <AiAdvisor analyticsData={analyticsData} />
                </div>
                
                {/* Add the Breakdown Chart */}
                <div className="mb-6">
                  <BreakdownChart 
                    ageData={ageBreakdown}
                    genderData={genderBreakdown}
                    platformData={platformBreakdown}
                    placementData={placementBreakdown}
                  />
                </div>
      
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-4">Creative Performance</h3>
                  {renderCreativeTable()}
                </div>
              </>
            )}
            
            {/* Diagnostic Tool Section */}
            {showDiagnostic && (
              <div className="bg-white p-6 rounded-lg shadow-md mb-6 border-2 border-blue-200">
                <h3 className="text-lg font-semibold mb-4">Meta API Diagnostic Tool</h3>
                
                <div className="mb-4">
                  <p className="text-sm text-gray-700 mb-2">
                    Access Token: <span className="font-mono text-xs">{accessToken ? `${accessToken.substring(0, 20)}...` : 'Not Available'}</span>
                  </p>
                  
                  <button
                    onClick={() => runDiagnostics()}
                    disabled={isLoading || !accessToken}
                    className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded disabled:opacity-50 mr-2"
                  >
                    {isLoading ? 'Running...' : 'Run Diagnostics'}
                  </button>
                </div>
                
                {/* Test Results */}
                {Object.keys(testResults).length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-medium mb-2">Diagnostic Results</h4>
                    
                    {Object.entries(testResults).map(([testName, result]) => (
                      <div key={testName} className="mb-4 p-3 border rounded">
                        <div className="flex items-center mb-1">
                          <div className={`w-3 h-3 rounded-full mr-2 ${
                            result.status === 'success' ? 'bg-green-500' : 
                            result.status === 'warning' ? 'bg-yellow-500' : 
                            result.status === 'pending' ? 'bg-blue-500' : 'bg-red-500'
                          }`}></div>
                          <h5 className="font-medium text-sm">
                            {testName === 'tokenTest' ? 'Access Token Validation' : 
                             testName === 'permissionsTest' ? 'Permissions Check' :
                             testName === 'accountsTest' ? 'Ad Accounts Access' :
                             testName === 'insightsTest' ? 'Insights Data Access' :
                             testName === 'campaignsTest' ? 'Campaigns Access' :
                             testName === 'creativesTest' ? 'Ad Creatives Access' : testName}
                          </h5>
                        </div>
                        
                        <p className="text-xs mb-1">{result.message}</p>
                        
                        {result.data && (
                          <details className="text-xs">
                            <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                              View Details
                            </summary>
                            <pre className="mt-1 p-2 bg-gray-100 rounded overflow-auto max-h-40 text-xs">
                              {JSON.stringify(result.data, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Account Testing Section - Only show if accounts test passed */}
                {testResults.accountsTest && testResults.accountsTest.status === 'success' && (
                  <div className="mb-4">
                    <h4 className="font-medium mb-2">Advanced Testing</h4>
                    
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Select Ad Account for Testing
                      </label>
                      <select
                        value={diagnosticSelectedAccount}
                        onChange={(e) => setDiagnosticSelectedAccount(e.target.value)}
                        className="w-full p-2 border rounded mb-2"
                      >
                        {testResults.accountsTest.data.map(account => (
                          <option key={account.id} value={account.id}>
                            {account.name} ({account.accountId}) - {account.status}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-2">
                      <button
                        onClick={testAccountInsights}
                        disabled={isLoading}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
                      >
                        Test Insights Access
                      </button>
                      <button
                        onClick={testCampaigns}
                        disabled={isLoading}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
                      >
                        Test Campaigns Access
                      </button>
                      <button
                        onClick={testAdCreatives}
                        disabled={isLoading}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
                      >
                        Test Ad Creatives Access
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CreativeAnalyticsDashboard;