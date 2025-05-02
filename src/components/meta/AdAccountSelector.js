// src/components/meta/AdAccountSelector.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import metaAPI from './metaAPI';

const AdAccountSelector = ({ selectedAccount, onChange }) => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser, currentTenant, isAdmin } = useAuth();

  useEffect(() => {
    async function fetchAccounts() {
      setLoading(true);
      setError(null);

      try {
        if (!currentTenant?.id) {
          setError("No tenant selected");
          setLoading(false);
          return;
        }

        let accountsData = [];

        if (isAdmin) {
          // Admin can see all accounts
          const result = await metaAPI.getAllMetaAdAccounts();
          accountsData = Array.isArray(result) ? result : [];
        } else {
          // Regular user can only see accounts for their tenant
          const result = await metaAPI.getMetaAdAccountsByTenant(currentTenant.id);
          accountsData = result.data || [];
        }

        if (accountsData.length === 0) {
          setError(`No Meta ad accounts available${!isAdmin ? ' for this tenant' : ''}`);
        }

        setAccounts(accountsData);
      } catch (err) {
        console.error("Error fetching accounts:", err);
        setError("Failed to load Meta ad accounts");
      } finally {
        setLoading(false);
      }
    }

    if (currentTenant) {
      fetchAccounts();
    }
  }, [currentTenant, isAdmin]);

  // Handle account selection
  const handleAccountChange = (e) => {
    const accountId = e.target.value;
    const account = accounts.find(a => a.id === accountId) || null;
    if (onChange) {
      onChange(account);
    }
  };

  if (loading) {
    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Ad Account:
        </label>
        <div className="animate-pulse h-10 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Ad Account:
        </label>
        <div className="text-red-600 text-sm border border-red-200 rounded p-2">{error}</div>
      </div>
    );
  }

  if (!accounts || accounts.length === 0) {
    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Ad Account:
        </label>
        <div className="text-gray-500 text-sm border border-gray-200 rounded p-2">
          No Meta ad accounts available
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <label htmlFor="ad-account-select" className="block text-sm font-medium text-gray-700 mb-1">
        Ad Account:
      </label>
      <select
        id="ad-account-select"
        value={selectedAccount?.id || ''}
        onChange={handleAccountChange}
        className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
      >
        <option value="" disabled>Select an ad account</option>
        
        {isAdmin ? (
          // For admins, group accounts by tenant
          Object.entries(
            accounts.reduce((acc, account) => {
              const group = account.tenantName || 'Unassigned';
              acc[group] = acc[group] || [];
              acc[group].push(account);
              return acc;
            }, {})
          ).map(([tenantName, tenantAccounts]) => (
            <optgroup key={tenantName} label={tenantName}>
              {tenantAccounts.map(account => (
                <option key={account.id} value={account.id}>
                  {account.name} ({account.id})
                </option>
              ))}
            </optgroup>
          ))
        ) : (
          // For regular users, simple list of available accounts
          accounts.map(account => (
            <option key={account.id} value={account.id}>
              {account.name} ({account.id})
            </option>
          ))
        )}
      </select>
      
      {isAdmin && (
        <p className="mt-1 text-xs text-gray-500">
          Admin view: Accounts are grouped by tenant
        </p>
      )}
    </div>
  );
};

export default AdAccountSelector;