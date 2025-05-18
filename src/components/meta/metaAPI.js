// src/components/meta/metaAPI.js
import { doc, getDoc, collection, getDocs, setDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import axios from 'axios';

// Meta API configuration with improved environment variable handling
const META_API_VERSION = 'v22.0'; // Matches Facebook Developer Console
const META_API_BASE_URL = 'https://graph.facebook.com';

// Facebook SDK initialization with environment variable for app ID
export const initFacebookSDK = () => {
  console.log('Initializing Facebook SDK with version:', META_API_VERSION);
  
  // Create a backup of ethereum property before anything else happens
  try {
    if (window.ethereum) {
      console.log('Ethereum property exists, backing up before SDK initialization');
      // Save the original ethereum object
      window._originalEthereum = window.ethereum;
      
      // Delete the property and replace it with a getter/setter
      delete window.ethereum;
      
      // Define a completely new property descriptor
      Object.defineProperty(window, 'ethereum', {
        configurable: true,
        get: function() {
          console.log('Getting ethereum property');
          return window._originalEthereum;
        },
        set: function(val) {
          console.log('Attempt to set ethereum property blocked');
          // Silently ignore attempts to set this property
        }
      });
    }
  } catch (error) {
    console.error('Error protecting ethereum property:', error);
  }
  
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
          appId: process.env.REACT_APP_FACEBOOK_APP_ID,
          cookie: true,
          xfbml: true,
          version: META_API_VERSION
        });
        console.log('Facebook SDK initialized with version:', META_API_VERSION);
        resolve(window.FB);
      } catch (error) {
        console.error('Error initializing Facebook SDK:', error);
        reject(error);
      }
    };

    // Load the SDK asynchronously with correct version
    (function(d, s, id) {
      var js, fjs = d.getElementsByTagName(s)[0];
      if (d.getElementById(id)) return;
      js = d.createElement(s); js.id = id;
      // Include the version number directly in the SDK URL
      const sdkUrl = `https://connect.facebook.net/en_US/sdk/v${META_API_VERSION.substring(1)}.js`;
      js.src = sdkUrl;
      console.log('Loading FB SDK with URL:', sdkUrl);
      js.onerror = function() {
        reject(new Error('Failed to load Facebook SDK script'));
      };
      fjs.parentNode.insertBefore(js, fjs);
    }(document, 'script', 'facebook-jssdk'));
  });
};

// Get token with priority: provided token > session storage > environment variable
export const getStoredToken = (providedToken) => {
  if (providedToken) return providedToken;
  
  const sessionToken = sessionStorage.getItem('metaAccessToken');
  if (sessionToken) return sessionToken;
  
  return process.env.REACT_APP_META_ACCESS_TOKEN || null;
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
    
    if (currentDomain === 'localhost') {
      redirectUri = `http://${currentDomain}:${window.location.port}/dashboard`;
    } else if (currentDomain.includes('myaiadsmanager.com')) {
      redirectUri = 'https://myaiadsmanager.com/api/auth/callback/facebook';
    } else if (currentDomain.includes('campaign-dashboard-attilas-projects')) {
      redirectUri = 'https://campaign-dashboard-attilas-projects-ea2ebf76.vercel.app/api/auth/callback/facebook';
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

// Improved fetch from Meta API with better error handling
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
        app_id: process.env.REACT_APP_FACEBOOK_APP_ID, // Include app ID explicitly
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
          error: `Invalid Facebook App ID: ${process.env.REACT_APP_FACEBOOK_APP_ID || 'Not set'}. Please check your application configuration.`,
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
      if (!process.env.REACT_APP_FACEBOOK_APP_ID) {
        console.error('App ID environment variable not found');
        return {
          error: 'Facebook App ID not configured. Please set REACT_APP_FACEBOOK_APP_ID in your environment variables.',
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
        app_id: process.env.REACT_APP_FACEBOOK_APP_ID // Explicitly include app ID
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
        limit: 25, // Adjust based on your needs
        app_id: process.env.REACT_APP_FACEBOOK_APP_ID // Explicitly include app ID
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

// Export all functions
const metaAPI = {
  // Authentication
  initFacebookSDK,
  login,
  logout,
  fbLogout,
  getStoredToken,
  
  // Main API functions
  getMetaAdAccountsByTenant,
  getMetaMetricsByTenant,
  getMetaAdDataByTenant,
  
  // Helper functions
  fetchFromMetaAPI,
  getMetaDatePreset,
  getActionValue,
  getMetaBreakdownDimension,
  getCategoryFromBreakdown,
  getAccountStatusLabel,
  getDateRangeNumber,
  
  // Mock data generation
  generateMockTimeData,
  generateMockBreakdownData,
  generateMockAdData
};

export default metaAPI;