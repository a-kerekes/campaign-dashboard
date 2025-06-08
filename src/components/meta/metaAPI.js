// src/components/meta/metaAPI.js
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import axios from 'axios';

// Meta API configuration with environment variables
const FACEBOOK_APP_ID = process.env.REACT_APP_FACEBOOK_APP_ID || '997685078957756';
const META_ACCESS_TOKEN = process.env.REACT_APP_META_ACCESS_TOKEN || '';
const META_API_VERSION = 'v22.0';
const META_API_BASE_URL = 'https://graph.facebook.com';

console.log('Using Facebook App ID:', FACEBOOK_APP_ID);

// ==== UTILITY FUNCTIONS ====

/**
 * Determines whether to use mock data based on localStorage and environment variables
 * @returns {boolean} True if mock data should be used
 */
const shouldUseMockData = () => {
  // Priority 1: Check localStorage setting (user preference)
  const localStorageSetting = localStorage.getItem('USE_MOCK_DATA');
  if (localStorageSetting !== null) {
    return localStorageSetting === 'true';
  }
  
  // Priority 2: Check environment variable
  return process.env.REACT_APP_USE_MOCK_DATA === 'true';
};

/**
 * Marks data as mock data by adding metadata
 * @param {Array} data - The data array to mark
 * @returns {Array} The marked data array
 */
const markAsMockData = (data) => {
  if (!data || !Array.isArray(data)) return data;
  
  return data.map(item => ({
    ...item,
    _isMock: true,
    source: 'mock'
  }));
};

/**
 * Creates a custom event to notify about mock data changes
 * @param {boolean} useMock - Whether to use mock data
 */
const notifyMockDataChange = (useMock) => {
  localStorage.setItem('USE_MOCK_DATA', useMock ? 'true' : 'false');
  
  const event = new CustomEvent('mockDataChanged', { 
    detail: { useMock } 
  });
  window.dispatchEvent(event);
  
  console.log(`Mock data preference changed to: ${useMock}`);
};

// Simplified Facebook SDK initialization that avoids ethereum conflicts
export const initFacebookSDK = () => {
  console.log('Initializing Facebook SDK');
  
  return new Promise((resolve, reject) => {
    // Check if SDK is already loaded
    if (window.FB) {
      console.log('Facebook SDK already initialized');
      resolve(window.FB);
      return;
    }
    
    window.fbAsyncInit = function() {
      try {
        window.FB.init({
          appId: FACEBOOK_APP_ID,
          cookie: true,
          xfbml: true,
          version: META_API_VERSION
        });
        console.log('Facebook SDK initialized successfully');
        resolve(window.FB);
      } catch (error) {
        console.error('Error initializing Facebook SDK:', error);
        reject(error);
      }
    };

    // Load the SDK asynchronously with standard URL
    (function(d, s, id) {
      var js, fjs = d.getElementsByTagName(s)[0];
      if (d.getElementById(id)) return;
      js = d.createElement(s); js.id = id;
      js.src = "https://connect.facebook.net/en_US/sdk.js";
      js.onerror = function() {
        console.error('Failed to load Facebook SDK');
        reject(new Error('Failed to load Facebook SDK script'));
      };
      fjs.parentNode.insertBefore(js, fjs);
      console.log('Facebook SDK script tag added to document');
    }(document, 'script', 'facebook-jssdk'));
  });
};

// Authentication function with domain-specific redirect URI
export const login = () => {
  return new Promise((resolve, reject) => {
    if (!window.FB) {
      reject(new Error('Facebook SDK not initialized. Call initFacebookSDK() first.'));
      return;
    }
    
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
        
        // Store token in session storage for later use
        sessionStorage.setItem('metaAccessToken', response.authResponse.accessToken);
        
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
    if (!window.FB) {
      console.warn('Facebook SDK not initialized, cannot logout');
      resolve(null);
      return;
    }
    
    window.FB.logout(function(response) {
      // Clear the stored token
      sessionStorage.removeItem('metaAccessToken');
      resolve(response);
    });
  });
};

// Facebook SDK logout
export const fbLogout = () => {
  return new Promise((resolve, reject) => {
    try {
      window.FB.logout(function(response) {
        // Clear the stored token
        sessionStorage.removeItem('metaAccessToken');
        resolve(response);
      });
    } catch (error) {
      reject(error);
    }
  });
};

// ======== Meta API Helper Functions ========

// Get token with priority: provided token > session storage > environment variable
function getStoredToken(providedToken) {
  if (providedToken) return providedToken;
  
  const sessionToken = sessionStorage.getItem('metaAccessToken');
  if (sessionToken) return sessionToken;
  
  return META_ACCESS_TOKEN;
}

// Improved fetch from Meta API with better error handling and app ID
async function fetchFromMetaAPI(endpoint, params = {}, providedToken = null) {
  const token = getStoredToken(providedToken);
  
  if (!token) {
    console.error('No access token available for Meta API call');
    return { 
      error: 'Missing access token for Meta API', 
      code: 'NO_TOKEN',
      authRequired: true
    };
  }
  
  try {
    const url = `${META_API_BASE_URL}/${META_API_VERSION}/${endpoint}`;
    console.log('Fetching from Meta API:', url);
    
    const response = await axios.get(url, {
      params: {
        access_token: token,
        app_id: FACEBOOK_APP_ID, // Include app ID explicitly
        ...params
      }
    });
    
    return { data: response.data };
  } catch (error) {
    console.error('Error fetching from Meta API:', error);
    
    // Handle Meta API specific errors
    if (error.response && error.response.data && error.response.data.error) {
      const metaError = error.response.data.error;
      
      // Handle specific error codes
      if (metaError.code === 190) {
        // Token expired or invalid
        sessionStorage.removeItem('metaAccessToken');
        return { 
          error: 'Facebook access token expired or invalid. Please log in again.',
          code: metaError.code,
          authRequired: true
        };
      } else if (metaError.code === 200) {
        // Invalid app ID
        return { 
          error: `Invalid Facebook App ID: ${FACEBOOK_APP_ID}. Please check your application configuration.`,
          code: metaError.code,
          configIssue: true
        };
      }
      
      return { 
        error: `Meta API Error: ${metaError.message || error.message}`,
        code: metaError.code,
        subcode: metaError.subcode,
        fbtrace_id: metaError.fbtrace_id // Useful for debugging with Facebook support
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

// Mock data generation functions
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
  const leadRate = 0.12; // Lead generation rate from landing page views
  
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
    const leads = Math.round(landingPageViews * leadRate * (1 + fluctuation()));
    const spend = parseFloat((impressions * 0.0008 * (1 + fluctuation() * 0.5)).toFixed(2));
    
    data.push({
      date: date.toISOString(),
      impressions,
      clicks,
      landingPageViews,
      addToCarts,
      purchases,
      leads,
      spend
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
    const leads = Math.round(landingPageViews * (0.08 + Math.random() * 0.15));
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
      leads,
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
        // Check if authentication is required
        if (result.authRequired) {
          return { 
            error: result.error,
            authRequired: true
          };
        }
        
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
      
      return { data: [account], isRealData: true };
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
        }],
        isRealData: false,
        mockReason: 'Error fetching ad account data'
      };
    }
  } catch (error) {
    console.error('Error in getMetaAdAccountsByTenant:', error);
    return { error: error.message };
  }
}

// Get Meta metrics for a specific tenant with improved token handling
export async function getMetaMetricsByTenant(tenantId, dateRange = 'Last 30 Days', providedToken = undefined) {
  console.log('getMetaMetricsByTenant called with:', { tenantId, dateRange, hasToken: !!providedToken });
  
  // Input validation
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
    
    // Determine data source strategy based on token
    const useMockData = providedToken === null; // Explicitly requested mock data
    
    // Strategy 1: Use mock data if explicitly requested
    if (useMockData) {
      console.log('Using mock data as requested');
      const days = getDateRangeNumber(dateRange);
      const timeData = generateMockTimeData(days);
      
      // Add the tenant's Meta ad account ID to each record
      timeData.forEach(item => {
        item.adAccountId = metaAdAccountId;
      });
      
      return { 
        data: timeData, 
        isRealData: false,
        mockReason: 'Explicitly requested mock data'
      };
    }
    
    // Strategy 2: Try to fetch real data
    try {
      console.log('Attempting to fetch real data from Meta API');
      
      // Get token with priority: provided token > session storage > environment variable
      const token = getStoredToken(providedToken);
      
      if (!token) {
        console.warn('No Meta API token available');
        return { 
          error: 'No authentication token available for Meta API. Please log in.',
          authRequired: true
        };
      }
      
      // Check if environment variable for app ID exists
      if (!FACEBOOK_APP_ID) {
        console.error('App ID not found');
        return {
          error: 'Facebook App ID not configured. Please check your environment variables.',
          configIssue: true
        };
      }
      
      // Attempt to fetch real data from Meta API
      const endpoint = `act_${adAccountId}/insights`;
      const params = {
        fields: 'impressions,clicks,inline_link_clicks,actions',
        time_increment: 1,
        date_preset: datePreset,
        level: 'account',
        app_id: FACEBOOK_APP_ID // Explicitly include app ID
      };
      
      const result = await fetchFromMetaAPI(endpoint, params, token);
      
      // Check for errors
      if (result.error) {
        // Special handling for authentication errors
        if (result.authRequired) {
          return {
            error: result.error,
            authRequired: true
          };
        }
        
        // Special handling for configuration issues
        if (result.configIssue) {
          return {
            error: result.error,
            configIssue: true
          };
        }
        
        throw new Error(result.error);
      }
      
      // Check if data exists
      if (!result.data.data || result.data.data.length === 0) {
        console.log('No data returned from Meta API');
        return { 
          data: [], 
          isRealData: true,
          isEmpty: true,
          message: 'No metrics data available for the selected time period'
        };
      }
      
      // Transform Meta API data to our format
      const formattedData = result.data.data.map(item => {
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
      
      return { 
        data: formattedData, 
        isRealData: true
      };
    } catch (error) {
      console.error('Error fetching real metrics:', error);
      
      // If use didn't explicitly request mock data but real data failed,
      // let the caller decide whether to fallback to mock data
      return { 
        error: `Error fetching data from Meta API: ${error.message}`, 
        isRealData: true,
        fallbackToMock: true
      };
    }
  } catch (error) {
    console.error('Error in getMetaMetricsByTenant:', error);
    return { error: error.message };
  }
}

// Get Meta ad data specific to a tenant
export async function getMetaAdDataByTenant(tenantId, dateRange = 'Last 30 Days', providedToken = undefined) {
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
    
    // Determine data strategy based on token
    const useMockData = providedToken === null; // Explicitly requested mock data
    
    if (useMockData) {
      return { 
        data: generateMockAdData(metaAdAccountId, dateRange),
        isRealData: false,
        mockReason: 'Explicitly requested mock data'
      };
    }
    
    try {
      // Get token with priority order
      const token = getStoredToken(providedToken);
      
      if (!token) {
        console.warn('No Meta API token available');
        return { 
          error: 'No authentication token available for Meta API. Please log in.',
          authRequired: true
        };
      }
      
      // Attempt to fetch real ad data from Meta API
      const endpoint = `act_${adAccountId}/ads`;
      const params = {
        fields: `id,name,status,created_time,effective_status,insights.date_preset(${datePreset}){impressions,clicks,spend,ctr,cpc}`,
        limit: 500, // Adjust based on your needs
        app_id: FACEBOOK_APP_ID // Explicitly include app ID
      };
      
      const result = await fetchFromMetaAPI(endpoint, params, token);
      
      if (result.error) {
        // Special handling for authentication errors
        if (result.authRequired) {
          return {
            error: result.error,
            authRequired: true
          };
        }
        
        throw new Error(result.error);
      }
      
      // Check if data exists
      if (!result.data.data || result.data.data.length === 0) {
        console.log('No ad data returned from Meta API');
        return { 
          data: [], 
          isRealData: true,
          isEmpty: true,
          message: 'No ad data available for the selected time period'
        };
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
      
      return { data: ads, isRealData: true };
    } catch (error) {
      console.error('Error fetching real ad data, falling back to mock data:', error);
      
      // Fallback to mock data if Meta API fails
      return { 
        data: generateMockAdData(metaAdAccountId, dateRange), 
        isRealData: false,
        mockReason: 'API Error: ' + error.message
      };
    }
  } catch (error) {
    console.error('Error in getMetaAdDataByTenant:', error);
    return { error: error.message };
  }
}

// Fetch daily metrics for time series charts - FIXED VERSION
const fetchDailyMetrics = async (dateRange, accountId, token) => {
  try {
    console.log(`======= FETCH DAILY METRICS: ${dateRange} =======`);
    
    // Format account ID to ensure proper format
    const formattedAccountId = accountId.toString().replace('act_', '');
    
    // Get the number of days from date range selection
    const days = getDateRangeNumber(dateRange);
    
    // Calculate dates exactly like Facebook's UI:
    // End date is always yesterday
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    
    // Start date is (days-1) days before yesterday
    // We use (days-1) because the range includes yesterday
    const startDate = new Date(yesterday);
    startDate.setDate(startDate.getDate() - (days - 1));
    
    // Format dates as strings for API and logging
    const since = startDate.toISOString().split('T')[0];
    const until = yesterday.toISOString().split('T')[0];
    
    console.log(`🐛 DEBUG: Today's date: ${today}`);
    console.log(`🐛 DEBUG: Yesterday: ${yesterday}`);
    console.log(`🐛 DEBUG: Start date: ${startDate}`);
    console.log(`🐛 DEBUG: Since: ${since}, Until: ${until}`);
    console.log(`Date range for ${dateRange}: ${since} to ${until} (${days} days)`);
    
    // Generate mock data or fetch real data using the same date range logic
    if (shouldUseMockData()) {
      console.log(`Using mock data for date range: ${since} to ${until}`);
      
      const mockData = [];
      let currentDate = new Date(startDate);
      
      // Generate one data point for each day in the range
      while (currentDate <= yesterday) {
        const dateStr = currentDate.toISOString().split('T')[0];
        
        // Generate realistic metrics with proper funnel drop-off rates
        const impressions = Math.floor(Math.random() * 10000) + 1000;
        const clicks = Math.floor(Math.random() * 500) + 50;
        const clickRate = clicks / impressions;
        const landingPageViews = Math.floor(clicks * (0.8 + Math.random() * 0.15));
        const addToCarts = Math.floor(landingPageViews * (0.15 + Math.random() * 0.15));
        const purchases = Math.floor(addToCarts * (0.2 + Math.random() * 0.2));
        const leads = Math.floor(landingPageViews * (0.1 + Math.random() * 0.1));
        const spend = parseFloat((Math.random() * 200 + 20).toFixed(2));
        
        mockData.push({
          date: dateStr,
          impressions: impressions,
          clicks: clicks,
          spend: spend,
          ctr: parseFloat((clickRate * 100).toFixed(2)),
          cpc: parseFloat((Math.random() * 2 + 0.1).toFixed(2)),
          landingPageViews: landingPageViews,
          addToCarts: addToCarts,
          purchases: purchases,
          leads: leads
        });
        
        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      // Log the date range in the generated data
      if (mockData.length > 0) {
        console.log(`Generated mock data from ${mockData[0].date} to ${mockData[mockData.length-1].date}`);
      }
      
      return markAsMockData(mockData);
    }
    
    // Get token for real API call
    const accessToken = getStoredToken(token);
    if (!accessToken) {
      throw new Error('No authentication token available. Please log in.');
    }
    
    // FIX: Make the API request with EXPLICIT date range parameters
    // Remove time_increment and use explicit time_range like the working breakdown calls
    const endpoint = `act_${formattedAccountId}/insights`;
    const params = {
      // CRITICAL FIX: Ensure explicit time range format
      time_range: JSON.stringify({
        since: since,
        until: until
      }),
      // Add time_increment for daily data
      time_increment: 1,
      fields: 'impressions,clicks,spend,ctr,cpc,date_start,actions,action_values,cost_per_action_type',
      level: 'account',
      // ADDITIONAL FIX: Add limit to ensure we get all data
      limit: 500
    };
    
    console.log(`🐛 DEBUG: API params being sent:`, params);
    console.log(`Fetching real API data using date range: ${since} to ${until}`);
    
    const result = await fetchFromMetaAPI(endpoint, params, accessToken);
    
    if (result.error) {
      console.error(`🐛 DEBUG: API returned error:`, result.error);
      throw new Error(result.error);
    }
    
    if (!result.data || !result.data.data) {
      console.error(`🐛 DEBUG: No data returned from API`);
      throw new Error('No time series data returned from API');
    }
    
    console.log(`🐛 DEBUG: Raw API response data length:`, result.data.data.length);
    console.log(`🐛 DEBUG: Raw API response first item:`, result.data.data[0]);
    console.log(`🐛 DEBUG: Raw API response last item:`, result.data.data[result.data.data.length - 1]);
    
    // Process the API response
    const formattedData = result.data.data.map(day => {
      // Extract conversion metrics from actions
      const actions = day.actions || [];
      const landingPageViews = actions.find(a => a.action_type === 'landing_page_view')?.value || 0;
      const addToCarts = actions.find(a => a.action_type === 'add_to_cart')?.value || 0;
      const purchases = actions.find(a => a.action_type === 'purchase')?.value || 0;
      const leads = actions.find(a => a.action_type === 'lead')?.value || 0;
      
      return {
        date: day.date_start,
        impressions: parseInt(day.impressions || 0),
        clicks: parseInt(day.clicks || 0),
        spend: parseFloat(day.spend || 0),
        ctr: parseFloat(day.ctr || 0) * 100,
        cpc: parseFloat(day.cpc || 0),
        landingPageViews: parseInt(landingPageViews),
        addToCarts: parseInt(addToCarts),
        purchases: parseInt(purchases),
        leads: parseInt(leads)
      };
    });
    
    // Sort data by date to ensure correct order
    formattedData.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Log the date range in the returned data
    if (formattedData.length > 0) {
      console.log(`🐛 DEBUG: Formatted data length:`, formattedData.length);
      console.log(`🐛 DEBUG: Expected date range: ${since} to ${until}`);
      console.log(`🐛 DEBUG: Actual date range: ${formattedData[0].date} to ${formattedData[formattedData.length-1].date}`);
      console.log(`Received API data from ${formattedData[0].date} to ${formattedData[formattedData.length-1].date}`);
    }
    
    return formattedData;
    
  } catch (error) {
    console.error('Error fetching daily metrics:', error);
    
    // Fall back to mock data with the same date logic
    const days = getDateRangeNumber(dateRange);
    
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    
    const startDate = new Date(yesterday);
    startDate.setDate(startDate.getDate() - (days - 1));
    
    const since = startDate.toISOString().split('T')[0];
    const until = yesterday.toISOString().split('T')[0];
    
    console.log(`Generating fallback mock data for range: ${since} to ${until}`);
    
    const mockData = [];
    let currentDate = new Date(startDate);
    
    while (currentDate <= yesterday) {
      const dateStr = currentDate.toISOString().split('T')[0];
      
      const impressions = Math.floor(Math.random() * 10000) + 1000;
      const clicks = Math.floor(Math.random() * 500) + 50;
      const clickRate = clicks / impressions;
      const landingPageViews = Math.floor(clicks * (0.8 + Math.random() * 0.15));
      const addToCarts = Math.floor(landingPageViews * (0.15 + Math.random() * 0.15));
      const purchases = Math.floor(addToCarts * (0.2 + Math.random() * 0.2));
      const leads = Math.floor(landingPageViews * (0.1 + Math.random() * 0.1));
      const spend = parseFloat((Math.random() * 200 + 20).toFixed(2));
      
      mockData.push({
        date: dateStr,
        impressions: impressions,
        clicks: clicks,
        spend: spend,
        ctr: parseFloat((clickRate * 100).toFixed(2)),
        cpc: parseFloat((Math.random() * 2 + 0.1).toFixed(2)),
        landingPageViews: landingPageViews,
        addToCarts: addToCarts,
        purchases: purchases,
        leads: leads
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    if (mockData.length > 0) {
      console.log(`Generated fallback mock data from ${mockData[0].date} to ${mockData[mockData.length-1].date}`);
    }
    
    return markAsMockData(mockData);
  }
};

// Fetch breakdown metrics by dimension (age, gender, etc.)
const fetchBreakdownMetrics = async (breakdownType, dateRange, accountId, token) => {
  try {
    // Format account ID to ensure proper format
    const formattedAccountId = accountId.toString().replace('act_', '');
    
    // Get date range
    const datePreset = getMetaDatePreset(dateRange);
    console.log(`Fetching ${breakdownType} breakdown with date preset ${datePreset} for account ${formattedAccountId}`);
    
    // IMPORTANT: Handle platform_position specially since it's causing API errors
    if (breakdownType === 'platform_position') {
      console.log('Using mock data for platform_position due to Meta API limitations');
      const mockPlatformData = [
        { breakdown_value: 'feed', impressions: Math.floor(Math.random() * 6000) + 2500, clicks: Math.floor(Math.random() * 300) + 100, spend: (Math.random() * 120 + 30).toFixed(2) },
        { breakdown_value: 'story', impressions: Math.floor(Math.random() * 4000) + 1500, clicks: Math.floor(Math.random() * 200) + 70, spend: (Math.random() * 80 + 20).toFixed(2) },
        { breakdown_value: 'right_hand_column', impressions: Math.floor(Math.random() * 2000) + 500, clicks: Math.floor(Math.random() * 100) + 20, spend: (Math.random() * 40 + 10).toFixed(2) },
        { breakdown_value: 'instant_article', impressions: Math.floor(Math.random() * 1000) + 300, clicks: Math.floor(Math.random() * 50) + 15, spend: (Math.random() * 20 + 5).toFixed(2) },
        { breakdown_value: 'marketplace', impressions: Math.floor(Math.random() * 800) + 200, clicks: Math.floor(Math.random() * 40) + 10, spend: (Math.random() * 16 + 4).toFixed(2) }
      ];
      
      // Add leads to each breakdown item
      const mockPlatformDataWithLeads = mockPlatformData.map(item => ({
        ...item,
        leads: Math.floor(item.clicks * (0.08 + Math.random() * 0.12)) // 8-20% lead rate from clicks
      }));
      
      return markAsMockData(mockPlatformDataWithLeads);
    }
    
    if (shouldUseMockData()) {
      // Generate mock data based on breakdown type
      let mockData = [];
      
      if (breakdownType === 'age') {
        mockData = [
          { breakdown_value: '18-24', impressions: Math.floor(Math.random() * 2000) + 500, clicks: Math.floor(Math.random() * 100) + 10, spend: (Math.random() * 40 + 5).toFixed(2) },
          { breakdown_value: '25-34', impressions: Math.floor(Math.random() * 4000) + 1000, clicks: Math.floor(Math.random() * 200) + 50, spend: (Math.random() * 80 + 20).toFixed(2) },
          { breakdown_value: '35-44', impressions: Math.floor(Math.random() * 3000) + 800, clicks: Math.floor(Math.random() * 150) + 40, spend: (Math.random() * 60 + 15).toFixed(2) },
          { breakdown_value: '45-54', impressions: Math.floor(Math.random() * 2000) + 400, clicks: Math.floor(Math.random() * 100) + 20, spend: (Math.random() * 40 + 10).toFixed(2) },
          { breakdown_value: '55-64', impressions: Math.floor(Math.random() * 1000) + 200, clicks: Math.floor(Math.random() * 50) + 10, spend: (Math.random() * 20 + 5).toFixed(2) },
          { breakdown_value: '65+', impressions: Math.floor(Math.random() * 500) + 100, clicks: Math.floor(Math.random() * 25) + 5, spend: (Math.random() * 10 + 2).toFixed(2) }
        ];
      } else if (breakdownType === 'gender') {
        mockData = [
          { breakdown_value: 'female', impressions: Math.floor(Math.random() * 6000) + 2000, clicks: Math.floor(Math.random() * 300) + 100, spend: (Math.random() * 120 + 30).toFixed(2) },
          { breakdown_value: 'male', impressions: Math.floor(Math.random() * 5000) + 1800, clicks: Math.floor(Math.random() * 250) + 90, spend: (Math.random() * 100 + 25).toFixed(2) },
          { breakdown_value: 'unknown', impressions: Math.floor(Math.random() * 1000) + 200, clicks: Math.floor(Math.random() * 50) + 10, spend: (Math.random() * 20 + 5).toFixed(2) }
        ];
      } else if (breakdownType === 'publisher_platform') {
        mockData = [
          { breakdown_value: 'facebook', impressions: Math.floor(Math.random() * 7000) + 3000, clicks: Math.floor(Math.random() * 350) + 120, spend: (Math.random() * 140 + 35).toFixed(2) },
          { breakdown_value: 'instagram', impressions: Math.floor(Math.random() * 5000) + 2000, clicks: Math.floor(Math.random() * 250) + 80, spend: (Math.random() * 100 + 25).toFixed(2) },
          { breakdown_value: 'audience_network', impressions: Math.floor(Math.random() * 1000) + 200, clicks: Math.floor(Math.random() * 50) + 10, spend: (Math.random() * 20 + 5).toFixed(2) },
          { breakdown_value: 'messenger', impressions: Math.floor(Math.random() * 500) + 100, clicks: Math.floor(Math.random() * 25) + 5, spend: (Math.random() * 10 + 2).toFixed(2) }
        ];
      } else if (breakdownType === 'platform_position') {
        mockData = [
          { breakdown_value: 'feed', impressions: Math.floor(Math.random() * 6000) + 2500, clicks: Math.floor(Math.random() * 300) + 100, spend: (Math.random() * 120 + 30).toFixed(2) },
          { breakdown_value: 'story', impressions: Math.floor(Math.random() * 4000) + 1500, clicks: Math.floor(Math.random() * 200) + 70, spend: (Math.random() * 80 + 20).toFixed(2) },
          { breakdown_value: 'right_hand_column', impressions: Math.floor(Math.random() * 2000) + 500, clicks: Math.floor(Math.random() * 100) + 20, spend: (Math.random() * 40 + 10).toFixed(2) },
          { breakdown_value: 'instant_article', impressions: Math.floor(Math.random() * 1000) + 300, clicks: Math.floor(Math.random() * 50) + 15, spend: (Math.random() * 20 + 5).toFixed(2) },
          { breakdown_value: 'marketplace', impressions: Math.floor(Math.random() * 800) + 200, clicks: Math.floor(Math.random() * 40) + 10, spend: (Math.random() * 16 + 4).toFixed(2) }
        ];
      }
      
      // Add leads to each breakdown item
      mockData = mockData.map(item => ({
        ...item,
        leads: Math.floor(item.clicks * (0.08 + Math.random() * 0.12)) // 8-20% lead rate from clicks
      }));
      
      console.log(`Returning mock ${breakdownType} breakdown data with ${mockData.length} segments`);
      return markAsMockData(mockData);
    }
    
    // Get token with priority order
    const accessToken = getStoredToken(token);
    
    if (!accessToken) {
      console.warn('No Meta API token available for fetchBreakdownMetrics');
      throw new Error('No authentication token available. Please log in.');
    }
    
    // Calculate date range
    const days = getDateRangeNumber(dateRange);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    
    const startDate = new Date(yesterday);
    startDate.setDate(yesterday.getDate() - (days - 1));
    
    const since = startDate.toISOString().split('T')[0];
    const until = yesterday.toISOString().split('T')[0];
    
    // Return actual API data
    const endpoint = `act_${formattedAccountId}/insights`;
    const params = {
      time_range: JSON.stringify({
        since,
        until
      }),
      breakdowns: breakdownType,
      fields: 'impressions,clicks,spend,ctr,cpc,cpm,actions,action_values,cost_per_action_type',
      level: 'account'
    };
    
    const result = await fetchFromMetaAPI(endpoint, params, accessToken);
    
    if (result.error) {
      throw new Error(result.error);
    }
    
    if (!result.data || !result.data.data) {
      throw new Error(`No ${breakdownType} breakdown data returned from API`);
    }
    
    // Format the response for our charts
    const formattedData = result.data.data.map(item => {
      // Extract purchase actions if available
      const actions = item.actions || [];
      const purchases = actions.find(a => a.action_type === 'purchase')?.value || 0;
      const landingPageViews = actions.find(a => a.action_type === 'landing_page_view')?.value || 0;
      const addToCarts = actions.find(a => a.action_type === 'add_to_cart')?.value || 0;
      const leads = actions.find(a => a.action_type === 'lead')?.value || 0;
      
      // Extract purchase values if available
      const actionValues = item.action_values || [];
      const purchaseValue = actionValues.find(a => a.action_type === 'purchase')?.value || 0;
      
      // Extract cost per purchase if available
      const costPerActionType = item.cost_per_action_type || [];
      const costPerPurchase = costPerActionType.find(c => c.action_type === 'purchase')?.value || 0;
      
      // Calculate CTR if not provided
      let ctr = parseFloat(item.ctr || 0);
      if (!ctr && item.impressions > 0) {
        ctr = (item.clicks / item.impressions) * 100;
      }
      
      return {
        breakdown_value: item[breakdownType],
        impressions: parseInt(item.impressions || 0),
        clicks: parseInt(item.clicks || 0),
        spend: parseFloat(item.spend || 0),
        ctr: ctr,
        cpc: parseFloat(item.cpc || 0),
        cpm: parseFloat(item.cpm || 0),
        purchases: parseInt(purchases),
        purchaseValue: parseFloat(purchaseValue),
        costPerPurchase: parseFloat(costPerPurchase),
        landingPageViews: parseInt(landingPageViews),
        addToCarts: parseInt(addToCarts),
        leads: parseInt(leads)
      };
    });
    
    return formattedData;
    
  } catch (error) {
    console.error(`Error fetching ${breakdownType} breakdown:`, error);
    
    // Generate mock data as fallback
    let mockData = [];
    
    if (breakdownType === 'age') {
      mockData = [
        { breakdown_value: '18-24', impressions: Math.floor(Math.random() * 2000) + 500, clicks: Math.floor(Math.random() * 100) + 10, spend: (Math.random() * 40 + 5).toFixed(2) },
        { breakdown_value: '25-34', impressions: Math.floor(Math.random() * 4000) + 1000, clicks: Math.floor(Math.random() * 200) + 50, spend: (Math.random() * 80 + 20).toFixed(2) },
        { breakdown_value: '35-44', impressions: Math.floor(Math.random() * 3000) + 800, clicks: Math.floor(Math.random() * 150) + 40, spend: (Math.random() * 60 + 15).toFixed(2) },
        { breakdown_value: '45-54', impressions: Math.floor(Math.random() * 2000) + 400, clicks: Math.floor(Math.random() * 100) + 20, spend: (Math.random() * 40 + 10).toFixed(2) },
        { breakdown_value: '55-64', impressions: Math.floor(Math.random() * 1000) + 200, clicks: Math.floor(Math.random() * 50) + 10, spend: (Math.random() * 20 + 5).toFixed(2) },
        { breakdown_value: '65+', impressions: Math.floor(Math.random() * 500) + 100, clicks: Math.floor(Math.random() * 25) + 5, spend: (Math.random() * 10 + 2).toFixed(2) }
      ];
    } else if (breakdownType === 'gender') {
      mockData = [
        { breakdown_value: 'female', impressions: Math.floor(Math.random() * 6000) + 2000, clicks: Math.floor(Math.random() * 300) + 100, spend: (Math.random() * 120 + 30).toFixed(2) },
        { breakdown_value: 'male', impressions: Math.floor(Math.random() * 5000) + 1800, clicks: Math.floor(Math.random() * 250) + 90, spend: (Math.random() * 100 + 25).toFixed(2) },
        { breakdown_value: 'unknown', impressions: Math.floor(Math.random() * 1000) + 200, clicks: Math.floor(Math.random() * 50) + 10, spend: (Math.random() * 20 + 5).toFixed(2) }
      ];
    } else if (breakdownType === 'publisher_platform') {
      mockData = [
        { breakdown_value: 'facebook', impressions: Math.floor(Math.random() * 7000) + 3000, clicks: Math.floor(Math.random() * 350) + 120, spend: (Math.random() * 140 + 35).toFixed(2) },
        { breakdown_value: 'instagram', impressions: Math.floor(Math.random() * 5000) + 2000, clicks: Math.floor(Math.random() * 250) + 80, spend: (Math.random() * 100 + 25).toFixed(2) },
        { breakdown_value: 'audience_network', impressions: Math.floor(Math.random() * 1000) + 200, clicks: Math.floor(Math.random() * 50) + 10, spend: (Math.random() * 20 + 5).toFixed(2) },
        { breakdown_value: 'messenger', impressions: Math.floor(Math.random() * 500) + 100, clicks: Math.floor(Math.random() * 25) + 5, spend: (Math.random() * 10 + 2).toFixed(2) }
      ];
    } else if (breakdownType === 'platform_position') {
      mockData = [
        { breakdown_value: 'feed', impressions: Math.floor(Math.random() * 6000) + 2500, clicks: Math.floor(Math.random() * 300) + 100, spend: (Math.random() * 120 + 30).toFixed(2) },
        { breakdown_value: 'story', impressions: Math.floor(Math.random() * 4000) + 1500, clicks: Math.floor(Math.random() * 200) + 70, spend: (Math.random() * 80 + 20).toFixed(2) },
        { breakdown_value: 'right_hand_column', impressions: Math.floor(Math.random() * 2000) + 500, clicks: Math.floor(Math.random() * 100) + 20, spend: (Math.random() * 40 + 10).toFixed(2) },
        { breakdown_value: 'instant_article', impressions: Math.floor(Math.random() * 1000) + 300, clicks: Math.floor(Math.random() * 50) + 15, spend: (Math.random() * 20 + 5).toFixed(2) },
        { breakdown_value: 'marketplace', impressions: Math.floor(Math.random() * 800) + 200, clicks: Math.floor(Math.random() * 40) + 10, spend: (Math.random() * 16 + 4).toFixed(2) }
      ];
    }
    
    // Add leads to each breakdown item
    mockData = mockData.map(item => ({
      ...item,
      leads: Math.floor(item.clicks * (0.08 + Math.random() * 0.12)) // 8-20% lead rate from clicks
    }));
    
    console.log(`Returning fallback mock ${breakdownType} breakdown data due to error`);
    return markAsMockData(mockData);
  }
};

// Fetch benchmarks for performance comparison
const fetchBenchmarks = async (accountId, token) => {
  try {
    // If we're in development mode with mock data
    if (shouldUseMockData()) {
      // Generate mock benchmark data
      const mockBenchmarks = {
        ctr: (Math.random() * 2 + 1).toFixed(2), // Between 1-3%
        cpc: (Math.random() * 0.8 + 0.4).toFixed(2), // Between $0.40-$1.20
        cpm: (Math.random() * 10 + 5).toFixed(2), // Between $5-$15
        conversionRate: (Math.random() * 4 + 1).toFixed(2), // Between 1-5%
        averageOrderValue: (Math.random() * 60 + 40).toFixed(2), // Between $40-$100
        roas: (Math.random() * 3 + 1.5).toFixed(2) // Between 1.5x-4.5x
      };
      
      console.log('Returning mock benchmark data');
      return { data: mockBenchmarks };
    }
    
    // Get token with priority order
    const accessToken = getStoredToken(token);
    
    if (!accessToken) {
      console.warn('No Meta API token available for fetchBenchmarks');
      throw new Error('No authentication token available. Please log in.');
    }
    
    // For real API, we would fetch industry benchmarks or historical performance
    // For now, we'll return mock data even for real API requests until we implement a benchmark API
    const industryBenchmarks = {
      ctr: 1.9, // Average CTR for all industries
      cpc: 0.97, // Average CPC
      cpm: 12.07, // Average CPM
      conversionRate: 2.35, // Average conversion rate
      averageOrderValue: 65.00, // Average order value
      roas: 2.5 // Average ROAS
    };
    
    return { data: industryBenchmarks };
    
  } catch (error) {
    console.error('Error fetching benchmarks:', error);
    
    // Return default benchmarks on error
    return {
      data: {
        ctr: 1.5,
        cpc: 0.85,
        cpm: 10.00,
        conversionRate: 2.0,
        averageOrderValue: 60.00,
        roas: 2.0
      }
    };
  }
};

const saveBenchmarks = async (accountId, benchmarks, token) => {
  try {
    // Format account ID to ensure proper format
    const formattedAccountId = accountId.toString().replace('act_', '');
    console.log('Saving benchmarks for account', formattedAccountId, benchmarks);
    
    // In a real app, we would save these to a database or API
    // For now, we'll just log them and return success
    
    // Attempt to save to Firestore if available
    try {
      await setDoc(doc(db, 'benchmarks', formattedAccountId), {
        ...benchmarks,
        accountId: formattedAccountId,
        updatedAt: new Date().toISOString()
      });
      console.log('Benchmarks saved to Firestore');
    } catch (firestoreError) {
      console.warn('Could not save benchmarks to Firestore:', firestoreError);
      // Continue even if Firestore save fails
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error saving benchmarks:', error);
    return { success: false, error: error.message };
  }
};

// UPDATE THE metaAPI EXPORT TO INCLUDE THE NEW FUNCTIONS
const metaAPI = {
  // Authentication
  initFacebookSDK,
  login,
  logout,
  fbLogout,
  
  // Main API functions
  getMetaAdAccountsByTenant,
  getMetaMetricsByTenant,
  getMetaAdDataByTenant,
  
  // Add the new functions needed for CreativeAnalyticsDashboard
  fetchDailyMetrics,
  fetchBreakdownMetrics,
  fetchBenchmarks,
  saveBenchmarks,
  
  // Helper functions
  fetchFromMetaAPI,
  getMetaDatePreset,
  getActionValue,
  getMetaBreakdownDimension,
  getCategoryFromBreakdown,
  getAccountStatusLabel,
  getDateRangeNumber,
  
  // Mock data utilities
  shouldUseMockData,
  markAsMockData,
  notifyMockDataChange,
  
  // Mock data generation
  generateMockTimeData,
  generateMockBreakdownData,
  generateMockAdData
};

export default metaAPI;