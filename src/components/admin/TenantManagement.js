// src/components/admin/TenantManagement.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase/firebase';
import { 
  collection, getDocs, doc, updateDoc
} from 'firebase/firestore';

const TenantManagement = () => {
  const { isAdmin } = useAuth();
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [metaAdAccountId, setMetaAdAccountId] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [updateError, setUpdateError] = useState(null);

  // Fetch all tenants
  useEffect(() => {
    const fetchTenants = async () => {
      if (!isAdmin) return;
      
      setLoading(true);
      try {
        const tenantsSnapshot = await getDocs(collection(db, 'tenants'));
        const tenantsList = [];
        
        tenantsSnapshot.forEach(doc => {
          tenantsList.push({ id: doc.id, ...doc.data() });
        });
        
        setTenants(tenantsList);
      } catch (err) {
        console.error('Error fetching tenants:', err);
        setError('Failed to load tenants');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTenants();
  }, [isAdmin]);

  // Handle tenant selection
  const handleTenantSelect = (tenant) => {
    setSelectedTenant(tenant);
    setMetaAdAccountId(tenant.metaAdAccountId || '');
    setUpdateSuccess(false);
    setUpdateError(null);
  };

  // Handle Meta ad account ID update
  const handleMetaAdAccountIdUpdate = async (e) => {
    e.preventDefault();
    
    if (!selectedTenant) return;
    
    try {
      setUpdateSuccess(false);
      setUpdateError(null);
      
      // Update the tenant document in Firestore
      await updateDoc(doc(db, 'tenants', selectedTenant.id), {
        metaAdAccountId: metaAdAccountId,
        updatedAt: new Date().toISOString()
      });
      
      // Update the local tenants list
      setTenants(tenants.map(tenant => 
        tenant.id === selectedTenant.id 
          ? { ...tenant, metaAdAccountId } 
          : tenant
      ));
      
      // Update the selected tenant
      setSelectedTenant({ ...selectedTenant, metaAdAccountId });
      
      setUpdateSuccess(true);
    } catch (err) {
      console.error('Error updating tenant:', err);
      setUpdateError('Failed to update tenant: ' + err.message);
    }
  };

  // If not admin, don't show this component
  if (!isAdmin) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
        <p>You need administrator privileges to access this page.</p>
      </div>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <div className="animate-pulse p-4 bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Tenant Management</h2>
        <div className="h-8 bg-gray-200 rounded mb-4"></div>
        <div className="h-64 bg-gray-100 rounded"></div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Tenant Management</h2>
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Tenant Management</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Left column - Tenant List */}
        <div className="border-r pr-4">
          <h3 className="text-lg font-medium mb-2">Tenants</h3>
          
          {tenants.length === 0 ? (
            <p className="text-gray-500">No tenants found.</p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {tenants.map(tenant => (
                <li 
                  key={tenant.id} 
                  className={`py-2 cursor-pointer hover:bg-gray-50 ${
                    selectedTenant?.id === tenant.id ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => handleTenantSelect(tenant)}
                >
                  <div className="font-medium">{tenant.name}</div>
                  <div className="text-sm text-gray-500 truncate">
                    {tenant.metaAdAccountId || 'No Meta Account ID'}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        
        {/* Right column - Tenant Details & Edit */}
        <div className="col-span-2 pl-4">
          {selectedTenant ? (
            <div>
              <h3 className="text-lg font-medium mb-4">
                {selectedTenant.name}
              </h3>
              
              <div className="bg-gray-50 p-4 rounded mb-4">
                <dl className="grid grid-cols-1 gap-x-4 gap-y-2">
                  <div className="grid grid-cols-3">
                    <dt className="text-sm font-medium text-gray-500">Tenant ID:</dt>
                    <dd className="text-sm text-gray-900 col-span-2 font-mono">{selectedTenant.id}</dd>
                  </div>
                  <div className="grid grid-cols-3">
                    <dt className="text-sm font-medium text-gray-500">Created:</dt>
                    <dd className="text-sm text-gray-900 col-span-2">
                      {new Date(selectedTenant.createdAt).toLocaleString()}
                    </dd>
                  </div>
                  {selectedTenant.updatedAt && (
                    <div className="grid grid-cols-3">
                      <dt className="text-sm font-medium text-gray-500">Updated:</dt>
                      <dd className="text-sm text-gray-900 col-span-2">
                        {new Date(selectedTenant.updatedAt).toLocaleString()}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
              
              <form onSubmit={handleMetaAdAccountIdUpdate}>
                <div className="mb-4">
                  <label htmlFor="metaAdAccountId" className="block text-sm font-medium text-gray-700 mb-1">
                    Meta Ad Account ID
                  </label>
                  <input
                    type="text"
                    id="metaAdAccountId"
                    value={metaAdAccountId}
                    onChange={(e) => setMetaAdAccountId(e.target.value)}
                    placeholder="e.g., act_123456789"
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    The Meta ad account ID usually starts with 'act_' followed by numbers
                  </p>
                </div>
                
                {updateSuccess && (
                  <div className="mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded">
                    <p>Tenant updated successfully!</p>
                  </div>
                )}
                
                {updateError && (
                  <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
                    <p>{updateError}</p>
                  </div>
                )}
                
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Update Meta Ad Account ID
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">Select a tenant to view and edit details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TenantManagement;