// src/components/meta/metaAPI.js
import { doc, getDoc, collection, getDocs, setDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import axios from 'axios';

// Meta API configuration 
// Note: In production, you should use environment variables for sensitive values
const META_ACCESS_TOKEN = process.env.REACT_APP_META_ACCESS_TOKEN || ''; 
const META_API_VERSION = 'v22.0';
const META_API_BASE_URL = 'https://graph.facebook.com';

// Facebook SDK initialization
export const initFacebookSDK = () => {
  console.log('Initializing Facebook SDK');
  
  return new Promise((resolve) => {
    window.fbAsyncInit = function() {
      window.FB.init({
        appId: '997685078957756', // Hardcoded for testing
        cookie: true,
        xfbml: true,
        version: 'v22.0'
      });
      console.log('Facebook SDK initialized successfully');
      resolve(window.FB);
    };

    // Load the SDK asynchronously
    (function(d, s, id) {
      var js, fjs = d.getElementsByTagName(s)[0];
      if (d.getElementById(id)) return;
      js = d.createElement(s); js.id = id;
      js.src = "https://connect.facebook.net/en_US/sdk.js";
      fjs.parentNode.insertBefore(js, fjs);
      console.log('Facebook SDK script tag added to document');
    }(document, 'script', 'facebook-jssdk'));
  });
};

// Authentication function with domain-specific redirect URI
export const login = () => {
  return new Promise((resolve, reject) => {
    // Determine which domain we're on to use the correct redirect URI
    const currentDomain = window.location.hostname;
    let redirectUri;
    
    if (currentDomain.includes('myaiadsmanager.com')) {
      redirectUri = 'https://myaiadsmanager.com/api/auth/callback/facebook';
    } else if (currentDomain.includes('campaign-dashboard-attilas-projects')) {
      redirectUri = 'https://campaign-dashboard-attilas-projects-ea2ebf76.vercel.app/api/auth/callback/facebook';
    } else if (currentDomain === 'localhost') {
      redirectUri = 'http://localhost:3000/api/auth/callback/facebook';
    } else {
      // Default to the topaz domain
      redirectUri = 'https://campaign-dashboard-topaz.vercel.app/api/auth/callback/facebook';
    }
    
    console.log('Using redirect URI:', redirectUri);
    
    window.FB.login(function(response) {
      if (response.authResponse) {
        console.log('Login successful, auth response:', response.authResponse);
        resolve(response.authResponse.accessToken);
      } else {
        console.error('Login failed or cancelled by user');
        reject(new Error('User cancelled login or did not fully authorize.'));
      }
    }, { 
      scope: 'ads_management,ads_read,business_management,pages_show_list',
      return_scopes: true,
      auth_type: 'rerequest',
      redirect_uri: redirectUri
    });
  });
};

// Logout function
export const logout = () => {
  return new Promise((resolve) => {
    window.FB.logout(function(response) {
      resolve(response);
    });
  });
};

// Facebook SDK logout
export const fbLogout = () => {
  return new Promise((resolve, reject) => {
    try {
      window.FB.logout(function(response) {
        resolve(response);
      });
    } catch (error) {
      reject(error);
    }
  });
};

// ======== Meta API Helper Functions ========

// Fetch from Meta Graph API with error handling
async function fetchFromMetaAPI(endpoint, params = {}, token = META_ACCESS_TOKEN) {
  try {
    const url = `${META_API_BASE_URL}/${META_API_VERSION}/${endpoint}`;
    console.log('Fetching from Meta API:', url, params);
    
    const response = await axios.get(url, {
      params: {
        access_token: token,
        ...params
      }
    });
    
    return { data: response.data };
  } catch (error) {
    console.error('Error fetching from Meta API:', error);
    
    // Handle Meta API specific errors
    if (error.response) {
      const metaError = error.response.data.error || {};
      return { 
        error: `Meta API Error: ${metaError.message || error.message}`,
        code: metaError.code
      };
    }
    
    return { error: error.message };
  }
}

// Map our date ranges to Meta API date presets
function getMetaDatePreset(dateRange) {
  const presetMap = {
    'Last 7 Days': 'last_7d',
    'Last 30 Days': 'last_30d',
    'Last 60 Days': 'last_60d',
    'Last 90 Days': 'last_90d',
    'This Month': 'this_month',
    'Last Month': 'last_month'
  };
  
  return presetMap[dateRange] || 'last_30d';
}

// Helper function to extract action values from Meta API response
function getActionValue(actions, actionType) {
  if (!actions) return 0;
  const action = actions.find(a => a.action_type === actionType);
  return action ? parseInt(action.value) : 0;
}

// Map our dimensions to Meta API breakdown parameters
function getMetaBreakdownDimension(dimension) {
  const dimensionMap = {
    age: 'age',
    gender: 'gender',
    platform: 'publisher_platform', 
    device: 'device_platform',
    placement: 'placement'
  };
  
  return dimensionMap[dimension] || dimension;
}

// Helper function to get category name from breakdown
function getCategoryFromBreakdown(item, dimension) {
  switch(dimension) {
    case 'age':
      return item.age;
    case 'gender':
      return item.gender;
    case 'device_platform':
      return item.device_platform;
    case 'publisher_platform':
      return item.publisher_platform;
    default:
      return item[dimension] || 'Unknown';
  }
}

// Get account status label
function getAccountStatusLabel(statusCode) {
  const statusMap = {
    1: 'ACTIVE',
    2: 'DISABLED',
    3: 'UNSETTLED',
    7: 'PENDING_CLOSURE',
    8: 'CLOSED',
    9: 'PENDING_REVIEW',
    100: 'PENDING_RISK_REVIEW',
    101: 'PENDING_SETTLEMENT'
  };
  
  return statusMap[statusCode] || 'UNKNOWN';
}

// Helper function to get number of days from date range
function getDateRangeNumber(dateRange) {
  switch(dateRange) {
    case 'Last 7 Days': return 7;
    case 'Last 30 Days': return 30;
    case 'Last 60 Days': return 60;
    case 'Last 90 Days': return 90;
    default: return 30;
  }
}

function generateMockTimeData(days) {
  const data = [];
  const today = new Date();
  
  // Start from yesterday
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  
  // Base values with realistic funnel drop-off
  const baseImpressions = 15000;
  const clickRate = 0.08;
  const pageViewRate = 0.75;
  const addToCartRate = 0.25;
  const purchaseRate = 0.35;
  
  // Small daily fluctuation
  const fluctuation = () => {
    return Math.random() * 0.4 - 0.2; // Random between -20% and +20%
  };
  
  // Generate data starting from yesterday and going back 'days' days
  for (let i = 0; i < days; i++) {
    const date = new Date(yesterday);
    date.setDate(yesterday.getDate() - i);
    
    // Create daily trend - higher on weekends, lower midweek
    const dayOfWeek = date.getDay();
    const weekendBoost = (dayOfWeek === 0 || dayOfWeek === 6) ? 1.4 : 1;
    const midweekDip = (dayOfWeek === 3) ? 0.8 : 1;
    const dayFactor = weekendBoost * midweekDip;
    
    // Add slight upward trend over time
    const trendFactor = 1 + ((days - i) / days * 0.1);
    
    // Generate metrics with realistic funnel drop-off
    const impressions = Math.round(baseImpressions * dayFactor * trendFactor * (1 + fluctuation()));
    const clicks = Math.round(impressions * clickRate * (1 + fluctuation()));
    const landingPageViews = Math.round(clicks * pageViewRate * (1 + fluctuation()));
    const addToCarts = Math.round(landingPageViews * addToCartRate * (1 + fluctuation()));
    const purchases = Math.round(addToCarts * purchaseRate * (1 + fluctuation()));
    
    data.push({
      date: date.toISOString(),
      impressions,
      clicks,
      landingPageViews,
      addToCarts,
      purchases
    });
  }
  
  // Sort the data by date (earliest first)
  data.sort((a, b) => new Date(a.date) - new Date(b.date));
  
  return data;
}

function generateMockBreakdownData(dimension, dateRange) {
  // Mock breakdown data by dimension (e.g., age, gender, placement)
  const categories = {
    age: ['18-24', '25-34', '35-44', '45-54', '55-64', '65+'],
    gender: ['Male', 'Female', 'Unknown'],
    placement: ['Facebook Feed', 'Instagram Feed', 'Instagram Stories', 'Audience Network', 'Facebook Right Column']
  };
  
  const selectedCategories = categories[dimension] || ['Category 1', 'Category 2', 'Category 3', 'Category 4'];
  
  return selectedCategories.map(category => {
    // Generate random but reasonable values for each metric
    const impressions = Math.round(5000 + Math.random() * 15000);
    const clicks = Math.round(impressions * (0.05 + Math.random() * 0.07));
    const ctr = (clicks / impressions * 100).toFixed(2);
    const landingPageViews = Math.round(clicks * (0.7 + Math.random() * 0.2));
    const addToCarts = Math.round(landingPageViews * (0.15 + Math.random() * 0.2));
    const purchases = Math.round(addToCarts * (0.2 + Math.random() * 0.3));
    const spend = (impressions * (0.00005 + Math.random() * 0.00003)).toFixed(2);
    const cpc = (spend / clicks).toFixed(2);
    const roas = (purchases * 40 / parseFloat(spend)).toFixed(2);
    
    return {
      category,
      impressions,
      clicks,
      ctr: parseFloat(ctr),
      spend: parseFloat(spend),
      cpc: parseFloat(cpc),
      landingPageViews,
      addToCarts,
      purchases,
      roas: parseFloat(roas)
    };
  });
}

function generateMockAdData(adAccountId, dateRange = 'Last 30 Days') {
  // Generate mock ad data for this ad account
  const adCount = 5 + Math.floor(Math.random() * 10); // Between 5 and 15 ads
  const ads = [];
  
  // Get days count from dateRange to scale mock data appropriately
  const days = getDateRangeNumber(dateRange);
  const scaleFactor = days / 30; // Scale relative to 30 days
  
  for (let i = 0; i < adCount; i++) {
    const impressions = Math.round((2000 + Math.random() * 8000) * scaleFactor);
    const clicks = Math.round(impressions * (0.02 + Math.random() * 0.1));
    const ctr = (clicks / impressions * 100).toFixed(2);
    const spend = (impressions * (0.00005 + Math.random() * 0.00005)).toFixed(2);
    const cpc = (spend / clicks).toFixed(2);
    
    ads.push({
      id: `ad_${i}_${adAccountId.replace('act_', '')}`,
      adAccountId,
      name: `Ad ${i+1}`,
      status: Math.random() > 0.3 ? 'ACTIVE' : 'PAUSED',
      impressions,
      clicks,
      ctr: parseFloat(ctr),
      spend: parseFloat(spend),
      cpc: parseFloat(cpc),
      createdAt: new Date(Date.now() - Math.floor(Math.random() * 60) * 24 * 60 * 60 * 1000).toISOString()
    });
  }
  
  return ads;
}

// ======== Tenant-Specific Meta API Functions ========

// Get Meta ad accounts for a tenant
export async function getMetaAdAccountsByTenant(tenantId) {
  if (!tenantId) {
    console.error('No tenant ID provided');
    return { error: 'No tenant ID provided' };
  }
  
  try {
    // Get the tenant document to access the Meta ad account ID
    const tenantDoc = await getDoc(doc(db, 'tenants', tenantId));
    
    if (!tenantDoc.exists()) {
      return { error: 'Tenant not found' };
    }
    
    const tenant = tenantDoc.data();
    const metaAdAccountId = tenant.metaAdAccountId;
    
    if (!metaAdAccountId) {
      return { error: 'No Meta ad account ID associated with this tenant' };
    }
    
    try {
      // Try to get account details from Meta API
      const adAccountId = metaAdAccountId.startsWith('act_') 
        ? metaAdAccountId.substring(4) 
        : metaAdAccountId;
        
      const endpoint = `act_${adAccountId}`;
      const params = {
        fields: 'id,name,account_id,account_status,currency,timezone_name'
      };
      
      const result = await fetchFromMetaAPI(endpoint, params);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      // Format the account data
      const account = {
        id: result.data.id,
        name: result.data.name,
        accountId: result.data.account_id,
        status: getAccountStatusLabel(result.data.account_status),
        currency: result.data.currency,
        timezone: result.data.timezone_name,
        tenantId: tenantId,
        tenantName: tenant.name
      };
      
      return { data: [account] };
    } catch (error) {
      console.error('Error fetching Meta ad account, using mock data:', error);
      // Return mock account data for this tenant
      return {
        data: [{
          id: metaAdAccountId,
          name: `${tenant.name} Ad Account`,
          accountId: metaAdAccountId.replace('act_', ''),
          status: 'ACTIVE',
          currency: 'USD',
          timezone: 'America/New_York',
          tenantId: tenantId,
          tenantName: tenant.name
        }]
      };
    }
  } catch (error) {
    console.error('Error in getMetaAdAccountsByTenant:', error);
    return { error: error.message };
  }
}

// Get Meta metrics for a specific tenant
export async function getMetaMetricsByTenant(tenantId, dateRange = 'Last 30 Days', accessToken = null) {
  console.log('getMetaMetricsByTenant called with:', { tenantId, dateRange, hasToken: !!accessToken });
  
  if (!tenantId) {
    console.error('No tenant ID provided');
    return { error: 'No tenant ID provided' };
  }
  
  try {
    // Get the tenant document to access the Meta ad account ID
    const tenantDoc = await getDoc(doc(db, 'tenants', tenantId));
    
    if (!tenantDoc.exists()) {
      return { error: 'Tenant not found' };
    }
    
    const tenant = tenantDoc.data();
    const metaAdAccountId = tenant.metaAdAccountId;
    
    if (!metaAdAccountId) {
      return { error: 'No Meta ad account ID associated with this tenant' };
    }
    
    // Remove "act_" prefix if it exists
    const adAccountId = metaAdAccountId.startsWith('act_') 
      ? metaAdAccountId.substring(4) 
      : metaAdAccountId;
    
    // Use the date range provided
    const datePreset = getMetaDatePreset(dateRange);
    console.log('Using date preset:', datePreset, 'for date range:', dateRange);
    
    // Determine if we should try to fetch real data
    const shouldAttemptRealApi = !!accessToken;
    
    if (shouldAttemptRealApi) {
      try {
        console.log('Attempting to fetch real data from Meta API');
        
        // Attempt to fetch real data from Meta API
        const endpoint = `act_${adAccountId}/insights`;
        const params = {
          access_token: accessToken,
          fields: 'impressions,clicks,inline_link_clicks,actions',
          time_increment: 1,
          date_preset: datePreset,
          level: 'account'
        };
        
        // Create URL with query parameters
        const url = new URL(`${META_API_BASE_URL}/${META_API_VERSION}/${endpoint}`);
        Object.keys(params).forEach(key => 
          url.searchParams.append(key, params[key])
        );
        
        // Make the API request
        const response = await fetch(url.toString());
        const data = await response.json();
        
        // Check for errors in the response
        if (data.error) {
          console.error('Meta API error:', data.error);
          return { 
            error: `Meta API Error: ${data.error.message || 'Unknown error'}`,
            isRealData: true 
          };
        }
        
        // Transform Meta API data to our format
        const formattedData = data.data.map(item => {
          // Extract various conversion metrics from actions array if available
          const actions = item.actions || [];
          const landingPageViews = getActionValue(actions, 'landing_page_view');
          const addToCarts = getActionValue(actions, 'add_to_cart');
          const purchases = getActionValue(actions, 'purchase');
          
          return {
            date: item.date_start,
            adAccountId: metaAdAccountId,
            impressions: parseInt(item.impressions || 0),
            clicks: parseInt(item.clicks || 0),
            landingPageViews,
            addToCarts,
            purchases
          };
        });
        
        console.log('Fetched real metrics data:', formattedData.length, 'records');
        
        // Return real data regardless of whether it's empty
        return { 
          data: formattedData, 
          isRealData: true,
          isEmpty: formattedData.length === 0
        };
      } catch (error) {
        console.error('Error fetching real metrics:', error);
        return { 
          error: `Error fetching data from Meta API: ${error.message}`, 
          isRealData: true
        };
      }
    } else if (accessToken === null) {
      // User explicitly requested mock data (null token)
      const days = getDateRangeNumber(dateRange);
      console.log('Generating mock data for', days, 'days');
      const timeData = generateMockTimeData(days);
      
      // Add the tenant's Meta ad account ID to each record
      timeData.forEach(item => {
        item.adAccountId = metaAdAccountId;
      });
      
      return { data: timeData, isRealData: false };
    } else {
      // No token provided
      return { 
        error: 'No access token provided for Meta API.', 
        isRealData: false
      };
    }
  } catch (error) {
    console.error('Error in getMetaMetricsByTenant:', error);
    return { error: error.message };
  }
}

// Get Meta ad data specific to a tenant
export async function getMetaAdDataByTenant(tenantId, dateRange = 'Last 30 Days') {
  if (!tenantId) {
    console.error('No tenant ID provided');
    return { error: 'No tenant ID provided' };
  }
  
  try {
    // Get the tenant document to access the Meta ad account ID
    const tenantDoc = await getDoc(doc(db, 'tenants', tenantId));
    
    if (!tenantDoc.exists()) {
      return { error: 'Tenant not found' };
    }
    
    const tenant = tenantDoc.data();
    const metaAdAccountId = tenant.metaAdAccountId;
    
    if (!metaAdAccountId) {
      return { error: 'No Meta ad account ID associated with this tenant' };
    }
    
    // Remove "act_" prefix if it exists
    const adAccountId = metaAdAccountId.startsWith('act_') 
      ? metaAdAccountId.substring(4) 
      : metaAdAccountId;
    
    // Get the date preset based on the provided date range
    const datePreset = getMetaDatePreset(dateRange);
    
    try {
      // Attempt to fetch real ad data from Meta API
      const endpoint = `act_${adAccountId}/ads`;
      const params = {
        fields: `id,name,status,created_time,effective_status,insights.date_preset(${datePreset}){impressions,clicks,spend,ctr,cpc}`,
        limit: 25 // Adjust based on your needs
      };
      
      const result = await fetchFromMetaAPI(endpoint, params);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      // Transform Meta API data to our format
      const ads = result.data.data.map(ad => {
        const insights = ad.insights?.data?.[0] || {};
        
        return {
          id: ad.id,
          adAccountId: metaAdAccountId,
          name: ad.name,
          status: ad.effective_status || ad.status,
          impressions: parseInt(insights.impressions || 0),
          clicks: parseInt(insights.clicks || 0),
          ctr: parseFloat(insights.ctr || 0),
          spend: parseFloat(insights.spend || 0),
          cpc: parseFloat(insights.cpc || 0),
          createdAt: ad.created_time
        };
      });
      
      return { data: ads };
    } catch (error) {
      console.error('Error fetching real ad data, falling back to mock data:', error);
      
      // Fallback to mock data if Meta API fails
      return { data: generateMockAdData(metaAdAccountId, dateRange) };
    }
  } catch (error) {
    console.error('Error in getMetaAdDataByTenant:', error);
    return { error: error.message };
  }
}

// Get all Meta ad accounts for admin users
export async function getAllMetaAdAccounts() {
  try {
    // Get all tenants and their associated Meta ad accounts
    const tenantsSnapshot = await getDocs(collection(db, 'tenants'));
    const tenants = [];
    
    tenantsSnapshot.forEach(doc => {
      const tenantData = doc.data();
      if (tenantData.metaAdAccountId) {
        tenants.push({
          id: doc.id,
          name: tenantData.name,
          metaAdAccountId: tenantData.metaAdAccountId
        });
      }
    });
    
    try {
      // Try to fetch all accounts from Meta API
      if (META_ACCESS_TOKEN) {
        const endpoint = 'me/adaccounts';
        const params = {
          fields: 'id,name,account_id,account_status,currency,timezone_name',
          limit: 100
        };
        
        const result = await fetchFromMetaAPI(endpoint, params);
        
        if (result.error) {
          throw new Error(result.error);
        }
        
        // Match the accounts with tenants
        const accounts = result.data.data.map(account => {
          const matchingTenant = tenants.find(t => t.metaAdAccountId === account.id);
          return {
            id: account.id,
            name: account.name,
            accountId: account.account_id,
            status: getAccountStatusLabel(account.account_status),
            currency: account.currency,
            timezone: account.timezone_name,
            tenantId: matchingTenant?.id || null,
            tenantName: matchingTenant?.name || 'Unassigned'
          };
        });
        
        return accounts;
      } else {
        throw new Error('No META_ACCESS_TOKEN available');
      }
    } catch (error) {
      console.error('Error fetching Meta ad accounts, using mock data:', error);
      
      // Fallback to mock accounts based on tenant data
      return tenants.map((tenant, index) => ({
        id: tenant.metaAdAccountId,
        name: `${tenant.name} Ad Account`,
        accountId: tenant.metaAdAccountId.replace('act_', ''),
        status: 'ACTIVE',
        currency: 'USD',
        timezone: 'America/New_York',
        tenantId: tenant.id,
        tenantName: tenant.name
      }));
    }
  } catch (error) {
    console.error('Error in getAllMetaAdAccounts:', error);
    return [];
  }
}

// ======== Creative Analytics Functions ========

// Fetch creative performance
export async function fetchCreativePerformance(adAccountId, dateRange = 'last_30d') {
  if (!adAccountId) {
    return { error: 'No ad account ID provided' };
  }
  
  // Remove "act_" prefix if it exists
  const formattedAdAccountId = adAccountId.startsWith('act_') 
    ? adAccountId.substring(4) 
    : adAccountId;
  
  try {
    // First, get all ads for the account
    const endpoint = `act_${formattedAdAccountId}/ads`;
    const params = {
      fields: 'id,name,creative{id,thumbnail_url,effective_object_story_id}',
      limit: 100
    };
    
    const result = await fetchFromMetaAPI(endpoint, params);
    
    if (result.error) {
      throw new Error(result.error);
    }
    
    // Extract creative IDs
    const ads = result.data.data;
    const creativeIds = ads
      .filter(ad => ad.creative)
      .map(ad => ad.creative.id);
    
    if (creativeIds.length === 0) {
      return { data: [] };
    }
    
    // Now get insights for these creatives
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    const since = thirtyDaysAgo.toISOString().split('T')[0];
    const until = today.toISOString().split('T')[0];
    
    // Split into batches of 50 to avoid excessive query size
    const batchResults = [];
    
    for (let i = 0; i < creativeIds.length; i += 50) {
      const batch = creativeIds.slice(i, i + 50);
      
      const insightsEndpoint = `act_${formattedAdAccountId}/insights`;
      const insightsParams = {
        level: 'ad',
        fields: 'ad_id,spend,impressions,clicks,actions,cost_per_action_type',
        filtering: JSON.stringify([{
          field: 'ad.creative.id',
          operator: 'IN',
          value: batch
        }]),
        time_range: JSON.stringify({
          since,
          until
        }),
        limit: 500
      };
      
      const batchResult = await fetchFromMetaAPI(insightsEndpoint, insightsParams);
      
      if (batchResult.error) {
        console.error('Error fetching batch insights:', batchResult.error);
        continue;
      }
      
      batchResults.push(...batchResult.data.data);
    }
    
    // Map insights back to creative information
    const creativePerformance = batchResults.map(insight => {
      const ad = ads.find(ad => ad.id === insight.ad_id);
      return {
        adId: insight.ad_id,
        adName: ad ? ad.name : 'Unknown',
        creativeId: ad && ad.creative ? ad.creative.id : 'Unknown',
        thumbnailUrl: ad && ad.creative ? ad.creative.thumbnail_url : null,
        spend: parseFloat(insight.spend || 0),
        impressions: parseInt(insight.impressions || 0, 10),
        clicks: parseInt(insight.clicks || 0, 10),
        ctr: insight.clicks && insight.impressions ? 
          (parseInt(insight.clicks, 10) / parseInt(insight.impressions, 10) * 100).toFixed(2) : 0,
        conversions: insight.actions ? 
          insight.actions.filter(action => action.action_type === 'purchase').reduce((sum, action) => sum + parseInt(action.value, 10), 0) : 0,
        cpa: insight.cost_per_action_type ? 
          insight.cost_per_action_type.find(item => item.action_type === 'purchase')?.value || 0 : 0,
        roas: (insight.actions && parseFloat(insight.spend)) ? 
          (insight.actions.filter(action => action.action_type === 'purchase')
            .reduce((sum, action) => sum + (parseFloat(action.value) || 0), 0) / parseFloat(insight.spend)).toFixed(2) : 0
      };
    });
    
    return { data: creativePerformance };
  } catch (error) {
    console.error('Error fetching creative performance:', error);
    return { error: error.message };
  }
}

// Get creative details
export async function fetchCreativeDetails(creativeId) {
  if (!creativeId) {
    return { error: 'No creative ID provided' };
  }
  
  try {
    const endpoint = creativeId;
    const params = {
      fields: 'id,thumbnail_url,object_story_spec,effective_object_story_id,image_url,video_id'
    };
    
    const result = await fetchFromMetaAPI(endpoint, params);
    
    if (result.error) {
      throw new Error(result.error);
    }
    
    return { data: result.data };
 } catch (error) {
   console.error('Error fetching creative details:', error);
   return { error: error.message };
 }
}

// ======== Benchmark Management Functions ========

/**
* Fetch benchmark settings for a specific ad account
* @param {string} adAccountId - Meta ad account ID
* @returns {Promise<Object>} - Response containing benchmark data or error
*/
export async function fetchBenchmarks(adAccountId) {
 if (!adAccountId) {
   return { error: 'No ad account ID provided' };
 }
 
 try {
   // Remove "act_" prefix if it exists for consistency
   const formattedAccountId = adAccountId.startsWith('act_') 
     ? adAccountId.substring(4) 
     : adAccountId;
   
   // First check if we already have benchmarks stored in our database
   const benchmarkDocRef = doc(db, 'metaBenchmarks', `act_${formattedAccountId}`);
   const benchmarkDoc = await getDoc(benchmarkDocRef);
   
   if (benchmarkDoc.exists()) {
     return { data: benchmarkDoc.data().benchmarks };
   } else {
     // Initialize with default benchmarks
     return {
       data: {
         ctr: { low: 0.01, medium: 0.02, high: null },
         cpc: { low: 1.5, medium: 2.5, high: null },
         cpm: { low: 20, medium: 30, high: null },
         costPerPurchase: { low: 50, medium: 80, high: null },
         conversionRate: { low: 0.02, medium: 0.04, high: null },
         roas: { low: 1, medium: 2, high: null }
       }
     };
   }
 } catch (error) {
   console.error('Error fetching benchmarks:', error);
   return { error: error.message };
 }
}

/**
* Save benchmark settings for a specific ad account
* @param {string} adAccountId - Meta ad account ID
* @param {Object} benchmarkData - Benchmark configuration data
* @returns {Promise<Object>} - Success or error response
*/
export async function saveBenchmarks(adAccountId, benchmarkData) {
 if (!adAccountId) {
   return { error: 'No ad account ID provided' };
 }
 
 try {
   // Remove "act_" prefix if it exists for consistency
   const formattedAccountId = adAccountId.startsWith('act_') 
     ? adAccountId.substring(4) 
     : adAccountId;
   
   // Store benchmarks in Firestore
   const benchmarkDocRef = doc(db, 'metaBenchmarks', `act_${formattedAccountId}`);
   
   await setDoc(benchmarkDocRef, {
     adAccountId: `act_${formattedAccountId}`,
     benchmarks: benchmarkData,
     updatedAt: new Date().toISOString()
   });
   
   return { success: true };
 } catch (error) {
   console.error('Error saving benchmarks:', error);
   return { error: error.message };
 }
}

/**
* Apply benchmarks to creative performance data
* @param {Array} creativeData - Array of creative performance objects
* @param {Object} benchmarks - Benchmark settings
* @returns {Array} - Enhanced creative data with benchmark status
*/
export function applyBenchmarksToCreatives(creativeData, benchmarks) {
 if (!creativeData || !benchmarks) return creativeData;
 
 return creativeData.map(creative => {
   const benchmarkedCreative = { ...creative };
   
   // Add benchmark status for key metrics
   if (benchmarks.ctr) {
     const { low, medium } = benchmarks.ctr;
     const value = creative.ctr / 100; // Convert from percentage to decimal
     
     if (low !== null && value < low) {
       benchmarkedCreative.ctrStatus = 'low';
     } else if (medium !== null && value < medium) {
       benchmarkedCreative.ctrStatus = 'medium';
     } else {
       benchmarkedCreative.ctrStatus = 'high';
     }
   }
   
   if (benchmarks.cpc) {
     const { low, medium } = benchmarks.cpc;
     const value = creative.cpc;
     
     if (low !== null && value < low) {
       benchmarkedCreative.cpcStatus = 'high'; // Lower CPC is better
     } else if (medium !== null && value < medium) {
       benchmarkedCreative.cpcStatus = 'medium';
     } else {
       benchmarkedCreative.cpcStatus = 'low';
     }
   }
   
   if (benchmarks.roas) {
     const { low, medium } = benchmarks.roas;
     const value = creative.roas;
     
     if (low !== null && value < low) {
       benchmarkedCreative.roasStatus = 'low';
     } else if (medium !== null && value < medium) {
       benchmarkedCreative.roasStatus = 'medium';
     } else {
       benchmarkedCreative.roasStatus = 'high';
     }
   }
   
   return benchmarkedCreative;
 });
}

/**
* Generate a performance report with benchmark comparisons
* @param {string} adAccountId - Meta ad account ID
* @param {Object} creativeData - Creative performance data
* @param {Object} benchmarks - Benchmark settings
* @param {string} format - Report format (pdf, csv)
* @returns {Promise<Blob>} - Report file as blob
*/
export async function generatePerformanceReport(adAccountId, creativeData, benchmarks, format = 'csv') {
 if (!adAccountId || !creativeData) {
   throw new Error('Missing required parameters');
 }
 
 try {
   // Apply benchmarks to creative data
   const benchmarkedData = applyBenchmarksToCreatives(creativeData, benchmarks);
   
   if (format === 'csv') {
     // Generate CSV
     const csvRows = [];
     
     // Add headers
     csvRows.push([
       'Creative',
       'Ad Sets',
       'Impressions',
       'Clicks',
       'CTR',
       'CTR Benchmark',
       'CPC',
       'CPC Benchmark',
       'CPM',
       'CPM Benchmark',
       'Purchases',
       'Cost/Purchase',
       'Spend',
       'ROAS',
       'ROAS Benchmark'
     ].join(','));
     
     // Add data rows
     benchmarkedData.forEach(creative => {
       const row = [
         `"${creative.adName || ''}"`,
         creative.adsetCount || 0,
         creative.impressions || 0,
         creative.clicks || 0,
         `${(creative.ctr || 0).toFixed(2)}%`,
         creative.ctrStatus || 'N/A',
         `${(creative.cpc || 0).toFixed(2)}`,
         creative.cpcStatus || 'N/A',
         `${(creative.cpm || 0).toFixed(2)}`,
         creative.cpmStatus || 'N/A',
         creative.purchases || 0,
         `${(creative.costPerPurchase || 0).toFixed(2)}`,
         `${(creative.spend || 0).toFixed(2)}`,
         `${(creative.roas || 0).toFixed(2)}x`,
         creative.roasStatus || 'N/A'
       ];
       
       csvRows.push(row.join(','));
     });
     
     // Create CSV blob
     const csvContent = csvRows.join('\n');
     const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
     
     return blob;
   } else {
     // For now, we only support CSV format
     throw new Error('Unsupported report format');
   }
 } catch (error) {
   console.error('Error generating performance report:', error);
   throw error;
 }
}

// ======== Legacy Functions for Backward Compatibility ========

// Original daily metrics function (now tenant-aware)
export function fetchDailyMetrics(dateRange, adAccountId = null) {
 if (adAccountId) {
   // If ad account ID is provided, use it directly
   try {
     const endpoint = `act_${adAccountId.replace('act_', '')}/insights`;
     const params = {
       fields: 'impressions,clicks,inline_link_clicks,actions',
       time_increment: 1,
       date_preset: getMetaDatePreset(dateRange),
       level: 'account'
     };
     
     return fetchFromMetaAPI(endpoint, params)
       .then(result => {
         if (result.error) {
           throw new Error(result.error);
         }
         
         // Transform API data to our format
         const formattedData = result.data.data.map(item => {
           const actions = item.actions || [];
           const landingPageViews = getActionValue(actions, 'landing_page_view');
           const addToCarts = getActionValue(actions, 'add_to_cart');
           const purchases = getActionValue(actions, 'purchase');
           
           return {
             date: item.date_start,
             adAccountId: `act_${adAccountId.replace('act_', '')}`,
             impressions: parseInt(item.impressions || 0),
             clicks: parseInt(item.clicks || 0),
             landingPageViews,
             addToCarts,
             purchases
           };
         });
         
         return formattedData;
       })
       .catch(error => {
         console.error('Error fetching daily metrics, using mock data:', error);
         // Fall back to mock data
         const days = getDateRangeNumber(dateRange);
         return generateMockTimeData(days);
       });
   } catch (error) {
     console.error('Error in fetchDailyMetrics:', error);
     // Fall back to mock data
     const days = getDateRangeNumber(dateRange);
     return generateMockTimeData(days);
   }
 } else {
   // No ad account ID, use mock data
   const days = getDateRangeNumber(dateRange);
   return generateMockTimeData(days);
 }
}

// Original breakdown metrics function (now tenant-aware) - explicitly exported for use in other files
export function fetchBreakdownMetrics(dimension, dateRange, adAccountId = null) {
 if (adAccountId) {
   // If ad account ID is provided, use it directly
   try {
     const endpoint = `act_${adAccountId.replace('act_', '')}/insights`;
     const metaDimension = getMetaBreakdownDimension(dimension);
     
     const params = {
       fields: 'impressions,clicks,inline_link_clicks,spend,actions',
       date_preset: getMetaDatePreset(dateRange),
       breakdowns: metaDimension,
       level: 'account'
     };
     
     return fetchFromMetaAPI(endpoint, params)
       .then(result => {
         if (result.error) {
           throw new Error(result.error);
         }
         
         // Transform API data to our format
         const formattedData = result.data.data.map(item => {
           const actions = item.actions || [];
           const landingPageViews = getActionValue(actions, 'landing_page_view');
           const addToCarts = getActionValue(actions, 'add_to_cart');
           const purchases = getActionValue(actions, 'purchase');
           
           // Get the category name based on the dimension
           const category = getCategoryFromBreakdown(item, metaDimension);
           
           // Calculate derived metrics
           const impressions = parseInt(item.impressions || 0);
           const clicks = parseInt(item.clicks || 0);
           const spend = parseFloat(item.spend || 0);
           
           const ctr = impressions > 0 ? (clicks / impressions * 100) : 0;
           const cpc = clicks > 0 ? (spend / clicks) : 0;
           const roas = spend > 0 ? (purchases * 50 / spend) : 0; // Assuming $50 average order value
           
           return {
             category,
             impressions,
             clicks,
             ctr: parseFloat(ctr.toFixed(2)),
             spend: parseFloat(spend.toFixed(2)),
             cpc: parseFloat(cpc.toFixed(2)),
             landingPageViews,
             addToCarts,
             purchases,
             roas: parseFloat(roas.toFixed(2))
           };
         });
         
         return formattedData;
       })
       .catch(error => {
         console.error('Error fetching breakdown metrics, using mock data:', error);
         // Fall back to mock data
         return generateMockBreakdownData(dimension, dateRange);
       });
   } catch (error) {
     console.error('Error in fetchBreakdownMetrics:', error);
     // Fall back to mock data
     return generateMockBreakdownData(dimension, dateRange);
   }
 } else {
   // No ad account ID, use mock data
   return generateMockBreakdownData(dimension, dateRange);
 }
}

// Export all functions
const metaAPI = {
 // Existing functions
 getMetaMetricsByTenant,
 getMetaAdDataByTenant,
 getMetaAdAccountsByTenant,
 getAllMetaAdAccounts,
 fetchDailyMetrics,
 fetchBreakdownMetrics,
 fetchCreativePerformance,
 fetchCreativeDetails,
 initFacebookSDK,
 login,
 logout,
 fbLogout,
 
 // New benchmark functions
 fetchBenchmarks,
 saveBenchmarks,
 applyBenchmarksToCreatives,
 generatePerformanceReport
};

// Export both named functions and default export
export default metaAPI;