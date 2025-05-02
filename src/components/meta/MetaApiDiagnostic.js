// src/components/meta/MetaApiDiagnostic.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Implement the essential functions directly to avoid import issues
const initFacebookSDK = () => {
  return new Promise((resolve) => {
    window.fbAsyncInit = function() {
      window.FB.init({
        appId: process.env.REACT_APP_FACEBOOK_APP_ID || '997685078957756',
        cookie: true,
        xfbml: true,
        version: 'v18.0'
      });
      resolve(window.FB);
    };

    // Load the SDK asynchronously if not already loaded
    if (!document.getElementById('facebook-jssdk')) {
      const js = document.createElement('script');
      js.id = 'facebook-jssdk';
      js.src = "https://connect.facebook.net/en_US/sdk.js";
      document.getElementsByTagName('head')[0].appendChild(js);
    } else if (window.FB) {
      resolve(window.FB);
    }
  });
};

// Login function
const login = () => {
  return new Promise((resolve, reject) => {
    window.FB.login(function(response) {
      if (response.authResponse) {
        resolve(response.authResponse.accessToken);
      } else {
        reject(new Error('User cancelled login or did not fully authorize.'));
      }
    }, { scope: 'ads_management,ads_read,read_insights' });
  });
};

// Logout function
const logout = () => {
  return new Promise((resolve) => {
    if (window.FB) {
      window.FB.logout(function(response) {
        resolve(response);
      });
    } else {
      resolve(null);
    }
  });
};

const MetaApiDiagnostic = () => {
  const [accessToken, setAccessToken] = useState('');
  const [testResults, setTestResults] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [accounts, setAccounts] = useState([]);
  const [isFbInitialized, setIsFbInitialized] = useState(false);

  // Initialize Facebook SDK on component mount
  useEffect(() => {
    const initFb = async () => {
      try {
        await initFacebookSDK();
        setIsFbInitialized(true);
        console.log('Facebook SDK initialized successfully');
      } catch (error) {
        console.error('Failed to initialize Facebook SDK:', error);
      }
    };

    initFb();
  }, []);

  const handleFacebookLogin = async () => {
    if (!window.FB) {
      alert('Facebook SDK not initialized. Please refresh the page and try again.');
      return;
    }

    setIsLoading(true);
    try {
      const token = await login();
      setAccessToken(token);
      console.log('Access Token:', token);
    } catch (error) {
      console.error('Error during Facebook login:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFacebookLogout = async () => {
    try {
      await logout();
      setAccessToken('');
      setTestResults({});
      setAccounts([]);
      setSelectedAccount('');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const runDiagnostics = async () => {
    if (!accessToken) {
      alert('Please enter your access token or login with Facebook');
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
      
      const meResponse = await axios.get(`https://graph.facebook.com/v18.0/me`, {
        params: { access_token: accessToken }
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
      
      const permissionsResponse = await axios.get(`https://graph.facebook.com/v18.0/me/permissions`, {
        params: { access_token: accessToken }
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
          ['ads_management', 'ads_read', 'read_insights'].includes(p.permission)
        );
        
        const missingPermissions = ['ads_management', 'ads_read', 'read_insights'].filter(
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
      
      const accountsResponse = await axios.get(`https://graph.facebook.com/v18.0/me/adaccounts`, {
        params: {
          access_token: accessToken,
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
        
        setAccounts(accountsList);
        setSelectedAccount(accountsList[0].id);
        
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
    if (!selectedAccount) return;
    
    setIsLoading(true);
    const updatedResults = {...testResults};
    updatedResults.insightsTest = { status: 'pending', message: 'Fetching account insights...' };
    setTestResults(updatedResults);
    
    try {
      // Format account ID to ensure it starts with "act_"
      const accountId = selectedAccount.replace('act_', '');
      
      // Attempt to fetch basic account insights
      const today = new Date();
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(today.getDate() - 30);
      
      const since = thirtyDaysAgo.toISOString().split('T')[0];
      const until = today.toISOString().split('T')[0];
      
      const insightsResponse = await axios.get(
        `https://graph.facebook.com/v18.0/act_${accountId}/insights`,
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
    if (!selectedAccount) return;
    
    setIsLoading(true);
    const updatedResults = {...testResults};
    updatedResults.campaignsTest = { status: 'pending', message: 'Fetching campaigns...' };
    setTestResults(updatedResults);
    
    try {
      // Format account ID to ensure it starts with "act_"
      const accountId = selectedAccount.replace('act_', '');
      
      // Attempt to fetch campaigns
      const campaignsResponse = await axios.get(
        `https://graph.facebook.com/v18.0/act_${accountId}/campaigns`,
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
    if (!selectedAccount) return;
    
    setIsLoading(true);
    const updatedResults = {...testResults};
    updatedResults.creativesTest = { status: 'pending', message: 'Fetching ad creatives...' };
    setTestResults(updatedResults);
    
    try {
      // Format account ID to ensure it starts with "act_"
      const accountId = selectedAccount.replace('act_', '');
      
      // Attempt to fetch ad creatives
      const adsResponse = await axios.get(
        `https://graph.facebook.com/v18.0/act_${accountId}/ads`,
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

  return (
    <div className="p-6 max-w-6xl mx-auto bg-gray-100 min-h-screen">
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4">Authentication</h2>
        
        <div className="mb-4">
          <p className="mb-2">You can either login with Facebook or manually enter an access token:</p>
          
          <div className="flex gap-4 mb-4">
            <button
              onClick={handleFacebookLogin}
              disabled={isLoading || !isFbInitialized}
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded disabled:opacity-50"
            >
              {isLoading ? 'Loading...' : 'Login with Facebook'}
            </button>
            
            {accessToken && (
              <button
                onClick={handleFacebookLogout}
                className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded"
              >
                Logout
              </button>
            )}
            
            <p className="text-sm text-gray-600 my-auto">
              {isFbInitialized ? 'SDK initialized' : 'Initializing Facebook SDK...'}
            </p>
          </div>
          
          <p className="mb-2 font-medium">Or enter an access token manually:</p>
          <input
            type="text"
            value={accessToken}
            onChange={(e) => setAccessToken(e.target.value)}
            placeholder="Paste your Meta access token here"
            className="w-full p-2 border rounded font-mono text-sm"
          />
        </div>
        
        <button
          onClick={runDiagnostics}
          disabled={isLoading || !accessToken}
          className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded disabled:opacity-50"
        >
          {isLoading ? 'Running...' : 'Run Basic Diagnostics'}
        </button>
      </div>

      {/* Test Results */}
      {Object.keys(testResults).length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-4">Diagnostic Results</h2>
          
          {Object.entries(testResults).map(([testName, result]) => (
            <div key={testName} className="mb-4 p-4 border rounded">
              <div className="flex items-center mb-2">
                <div className={`w-3 h-3 rounded-full mr-2 ${
                  result.status === 'success' ? 'bg-green-500' : 
                  result.status === 'warning' ? 'bg-yellow-500' : 
                  result.status === 'pending' ? 'bg-blue-500' : 'bg-red-500'
                }`}></div>
                <h3 className="font-medium">
                  {testName === 'tokenTest' ? 'Access Token Validation' : 
                   testName === 'permissionsTest' ? 'Permissions Check' :
                   testName === 'accountsTest' ? 'Ad Accounts Access' :
                   testName === 'insightsTest' ? 'Insights Data Access' :
                   testName === 'campaignsTest' ? 'Campaigns Access' :
                   testName === 'creativesTest' ? 'Ad Creatives Access' : testName}
                </h3>
              </div>
              
              <p className="text-sm mb-2">{result.message}</p>
              
              {result.data && (
                <div className="mt-2">
                  <details className="text-xs">
                    <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                      View Details
                    </summary>
                    <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto max-h-60 text-xs">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </details>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Account Testing Section - Only show if accounts test passed */}
      {testResults.accountsTest && testResults.accountsTest.status === 'success' && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-4">Advanced Testing</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Ad Account
            </label>
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="w-full p-2 border rounded"
            >
              {accounts.map(account => (
                <option key={account.id} value={account.id}>
                  {account.name} ({account.accountId}) - {account.status}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={testAccountInsights}
              disabled={isLoading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded disabled:opacity-50"
            >
              Test Insights Access
            </button>
            <button
              onClick={testCampaigns}
              disabled={isLoading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded disabled:opacity-50"
            >
              Test Campaigns Access
            </button>
            <button
              onClick={testAdCreatives}
              disabled={isLoading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded disabled:opacity-50"
            >
              Test Ad Creatives Access
            </button>
          </div>
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">How to Use This Tool</h2>
        <ol className="list-decimal ml-5 space-y-2">
          <li>First, authenticate either by clicking "Login with Facebook" or by pasting a previously generated access token</li>
          <li>Click "Run Basic Diagnostics" to test token validity, permissions, and account access</li>
          <li>If successful, select an ad account from the dropdown in the Advanced Testing section</li>
          <li>Test specific data endpoints to identify any permission or access issues</li>
          <li>Check the detailed results to troubleshoot any problems</li>
        </ol>
        
        <div className="mt-4 pt-4 border-t">
          <h3 className="font-medium mb-2">Tips for Resolving Common Issues:</h3>
          <ul className="list-disc ml-5 space-y-1 text-sm">
            <li>If permissions are missing, generate a new token with all required permissions (ads_management, ads_read, read_insights)</li>
            <li>If in "Development" mode, you can only access data owned by app developers/admins</li>
            <li>For full access, request "Ads Management Standard Access" in the Facebook Developer console</li>
            <li>If you receive a "104" error code, it may indicate rate limiting - wait a few minutes and try again</li>
            <li>For detailed API error information, check the Facebook Marketing API documentation</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default MetaApiDiagnostic;
