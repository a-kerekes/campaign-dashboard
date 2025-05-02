// src/components/auth/AdminDashboard.js
import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import TenantManagement from '../admin/TenantManagement';
import TenantAssignments from '../admin/TenantAssignments';
import './AdminDashboard.css'; // Make sure to create this CSS file

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('users');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'users':
        return <UserManagement />;
      case 'tenants':
        return <TenantManagement />;
      case 'assignments':
        return <TenantAssignments />;
      default:
        return <UserManagement />;
    }
  };

  return (
    <div className="admin-container">
      <h1>Admin Dashboard</h1>
      
      <div className="admin-tabs">
        <button 
          className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          User Management
        </button>
        <button 
          className={`tab-button ${activeTab === 'tenants' ? 'active' : ''}`}
          onClick={() => setActiveTab('tenants')}
        >
          Tenant Management
        </button>
        <button 
          className={`tab-button ${activeTab === 'assignments' ? 'active' : ''}`}
          onClick={() => setActiveTab('assignments')}
        >
          Tenant Assignments
        </button>
      </div>
      
      <div className="tab-content">
        {renderTabContent()}
      </div>
    </div>
  );
}

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);

  // Fetch users and tenants on component mount
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      
      // Fetch all users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersData = [];
      usersSnapshot.forEach(doc => {
        usersData.push({ id: doc.id, ...doc.data() });
      });
      
      // Fetch all tenants
      const tenantsSnapshot = await getDocs(collection(db, 'tenants'));
      const tenantsData = [];
      tenantsSnapshot.forEach(doc => {
        tenantsData.push({ id: doc.id, ...doc.data() });
      });
      
      setUsers(usersData);
      setTenants(tenantsData);
      setLoading(false);
    }
    
    fetchData();
  }, []);

  // Function to open tenant assignment modal for a user
  const openAssignmentModal = (user) => {
    setSelectedUser(user);
    setShowAssignmentModal(true);
  };

  // Function to update tenant assignments
  const updateUserTenants = async (userId, newTenantIds) => {
    try {
      // Update in Firestore
      await updateDoc(doc(db, 'users', userId), {
        tenants: newTenantIds
      });
      
      // Update local state
      setUsers(users.map(user => 
        user.id === userId 
          ? {...user, tenants: newTenantIds} 
          : user
      ));
      
      setShowAssignmentModal(false);
    } catch (error) {
      console.error('Error updating tenant assignments:', error);
      alert('Failed to update tenant assignments');
    }
  };

  // Function to handle user deletion
  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteDoc(doc(db, 'users', userId));
        setUsers(users.filter(user => user.id !== userId));
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Failed to delete user');
      }
    }
  };

  // Function to handle role change
  const handleRoleChange = async (userId, newRole) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        role: newRole
      });
      
      setUsers(users.map(user => 
        user.id === userId 
          ? {...user, role: newRole} 
          : user
      ));
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('Failed to update user role');
    }
  };

  // Render user list with manage button
  return (
    <div className="user-management">
      <h2>User Management</h2>
      <p>Manage user accounts and permissions</p>
      
      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="user-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Tenants</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.name || 'N/A'}</td>
                <td>{user.email}</td>
                <td>
                  <select 
                    value={user.role || 'User'}
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                  >
                    <option value="User">User</option>
                    <option value="Admin">Admin</option>
                  </select>
                </td>
                <td>
                  <button 
                    className="tenant-manage-btn"
                    onClick={() => openAssignmentModal(user)}
                  >
                    {user.tenants?.length || 0} tenant(s)
                  </button>
                </td>
                <td>
                  <button 
                    className="delete-btn"
                    onClick={() => handleDeleteUser(user.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      
      {/* Tenant Assignment Modal */}
      {showAssignmentModal && selectedUser && (
        <TenantAssignmentModal 
          user={selectedUser}
          tenants={tenants}
          onClose={() => setShowAssignmentModal(false)}
          onSave={(newTenantIds) => updateUserTenants(selectedUser.id, newTenantIds)}
        />
      )}
    </div>
  );
}

function TenantAssignmentModal({ user, tenants, onClose, onSave }) {
  const [selectedTenants, setSelectedTenants] = useState(user.tenants || []);
  
  const handleTenantToggle = (tenantId) => {
    if (selectedTenants.includes(tenantId)) {
      setSelectedTenants(selectedTenants.filter(id => id !== tenantId));
    } else {
      setSelectedTenants([...selectedTenants, tenantId]);
    }
  };
  
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Manage Tenant Access for {user.email}</h3>
        
        <div className="tenant-list">
          {tenants.map(tenant => (
            <div key={tenant.id} className="tenant-item">
              <input
                type="checkbox"
                id={`tenant-${tenant.id}`}
                checked={selectedTenants.includes(tenant.id)}
                onChange={() => handleTenantToggle(tenant.id)}
              />
              <label htmlFor={`tenant-${tenant.id}`}>
                {tenant.name || tenant.id} {tenant.metaAdAccountId ? `(Meta Account: ${tenant.metaAdAccountId})` : ''}
              </label>
            </div>
          ))}
        </div>
        
        <div className="modal-actions">
          <button className="cancel-btn" onClick={onClose}>Cancel</button>
          <button className="save-btn" onClick={() => onSave(selectedTenants)}>Save Changes</button>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;