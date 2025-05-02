// src/components/TenantSelector.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebase';

function TenantSelector() {
  // Using the exact function names from your AuthContext
  const { currentUser, currentTenant, selectTenant, isAdmin, availableTenants } = useAuth();
  const [allTenants, setAllTenants] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch all tenants if the user is an admin
  useEffect(() => {
    const fetchAllTenants = async () => {
      if (!isAdmin) return;
      
      setLoading(true);
      try {
        const tenantsSnapshot = await getDocs(collection(db, 'tenants'));
        const tenantsList = [];
        
        tenantsSnapshot.forEach(doc => {
          tenantsList.push({ id: doc.id, ...doc.data() });
        });
        
        setAllTenants(tenantsList);
      } catch (error) {
        console.error('Error fetching all tenants:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (isAdmin) {
      fetchAllTenants();
    }
  }, [isAdmin]);

  // Determine which tenants to display
  const displayTenants = isAdmin ? allTenants : availableTenants;
  
  if (loading) {
    return <div className="text-sm text-gray-500">Loading tenants...</div>;
  }
  
  if (!displayTenants || displayTenants.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
        <p className="text-sm">
          {isAdmin 
            ? "No tenants found in the system." 
            : "You don't have any tenants assigned. Please contact an administrator."}
        </p>
      </div>
    );
  }
  
  const handleTenantChange = (e) => {
    const selectedTenantId = e.target.value;
    if (selectedTenantId) {
      selectTenant(selectedTenantId);
    }
  };

  return (
    <div className="tenant-selector">
      <label htmlFor="tenant-select" className="block text-sm font-medium text-gray-700 mb-1">
        {isAdmin ? 'Viewing Tenant:' : 'Your Tenant:'}
      </label>
      
      <select
        id="tenant-select"
        value={currentTenant?.id || ''}
        onChange={handleTenantChange}
        className="border p-2 rounded w-full"
      >
        <option value="" disabled>
          {loading ? 'Loading tenants...' : 'Select a tenant'}
        </option>
        
        {displayTenants.map(tenant => (
          <option key={tenant.id} value={tenant.id}>
            {tenant.name}
            {tenant.metaAdAccountId 
              ? ` (${tenant.metaAdAccountId})` 
              : ' (No Meta Account)'}
          </option>
        ))}
      </select>
      
      {isAdmin && (
        <div className="mt-1 text-xs text-gray-500">
          Admin mode: You can view all tenants
        </div>
      )}
    </div>
  );
}

export default TenantSelector;