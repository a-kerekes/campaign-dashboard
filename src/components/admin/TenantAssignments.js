// src/components/admin/TenantAssignments.js
import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebase';

const TenantAssignments = () => {
  const [users, setUsers] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedTenants, setSelectedTenants] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Group tenants by company (derived from tenant name)
  const tenantsByCompany = tenants.reduce((groups, tenant) => {
    // Use tenant name to determine company
    const companyName = tenant.name.split(' ')[0]; // Simple approach
    
    if (!groups[companyName]) {
      groups[companyName] = [];
    }
    
    groups[companyName].push(tenant);
    return groups;
  }, {});

  // Fetch users and tenants
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch users
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const usersData = [];
        usersSnapshot.forEach(doc => {
          usersData.push({ id: doc.id, ...doc.data() });
        });
        
        // Fetch tenants
        const tenantsSnapshot = await getDocs(collection(db, 'tenants'));
        const tenantsData = [];
        tenantsSnapshot.forEach(doc => {
          tenantsData.push({ id: doc.id, ...doc.data() });
        });
        
        setUsers(usersData);
        setTenants(tenantsData);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load users and tenants');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Handle user selection
  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setSelectedTenants(user.tenants || []);
    setSuccess(false);
  };

  // Handle tenant checkbox toggle
  const handleTenantToggle = (tenantId) => {
    if (selectedTenants.includes(tenantId)) {
      setSelectedTenants(selectedTenants.filter(id => id !== tenantId));
    } else {
      setSelectedTenants([...selectedTenants, tenantId]);
    }
  };

  // Save tenant assignments
  const handleSaveAssignments = async () => {
    if (!selectedUser) return;
    
    try {
      // Update user document in Firestore
      await updateDoc(doc(db, 'users', selectedUser.id), {
        tenants: selectedTenants
      });
      
      // Update local state
      setUsers(users.map(user => 
        user.id === selectedUser.id 
          ? { ...user, tenants: selectedTenants } 
          : user
      ));
      
      setSuccess(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error updating tenant assignments:', err);
      setError('Failed to update tenant assignments');
    }
  };

  if (loading) {
    return <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Tenant Assignments</h2>
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded mb-4"></div>
        <div className="h-64 bg-gray-100 rounded"></div>
      </div>
    </div>;
  }

  if (error) {
    return <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Tenant Assignments</h2>
      <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
        <p>{error}</p>
      </div>
    </div>;
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Tenant Assignments</h2>
      <p className="mb-4">Manage which users have access to which tenants</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Left column - User List */}
        <div className="border-r pr-4">
          <h3 className="text-lg font-medium mb-2">Users</h3>
          <ul className="divide-y divide-gray-200">
            {users.map(user => (
              <li 
                key={user.id} 
                className={`py-2 cursor-pointer hover:bg-gray-50 ${
                  selectedUser?.id === user.id ? 'bg-blue-50' : ''
                }`}
                onClick={() => handleUserSelect(user)}
              >
                <div className="font-medium">{user.email}</div>
                <div className="text-sm text-gray-500">
                  Role: {user.role} | Tenants: {user.tenants?.length || 0}
                </div>
              </li>
            ))}
          </ul>
        </div>
        
        {/* Right columns - Tenant Assignments */}
        <div className="col-span-2 pl-4">
          {selectedUser ? (
            <div>
              <h3 className="text-lg font-medium mb-4">
                Tenant Access for {selectedUser.email}
              </h3>
              
              {Object.entries(tenantsByCompany).map(([company, companyTenants]) => (
                <div key={company} className="mb-6">
                  <h4 className="font-medium text-gray-700 mb-2">{company}</h4>
                  <div className="space-y-2 ml-4">
                    {companyTenants.map(tenant => (
                      <div key={tenant.id} className="flex items-start">
                        <input
                          type="checkbox"
                          id={`tenant-${tenant.id}`}
                          checked={selectedTenants.includes(tenant.id)}
                          onChange={() => handleTenantToggle(tenant.id)}
                          className="mt-1 mr-2"
                        />
                        <label htmlFor={`tenant-${tenant.id}`} className="block">
                          <div className="font-medium">{tenant.name}</div>
                          {tenant.metaAdAccountId && (
                            <div className="text-sm text-gray-500">
                              Meta Ad Account: {tenant.metaAdAccountId}
                            </div>
                          )}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              
              {success && (
                <div className="mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded">
                  <p>Tenant assignments updated successfully!</p>
                </div>
              )}
              
              <div className="mt-6">
                <button
                  onClick={handleSaveAssignments}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Save Assignments
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64">
              <p className="text-gray-500">Select a user to manage tenant assignments</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TenantAssignments;