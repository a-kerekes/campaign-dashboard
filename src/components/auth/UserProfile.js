// src/components/auth/UserProfile.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { updateProfile, updateEmail, updatePassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { Link, useNavigate } from 'react-router-dom';

function UserProfile() {
  const { currentUser, logout } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [userDetails, setUserDetails] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      setDisplayName(currentUser.displayName || '');
      setEmail(currentUser.email || '');
      
      // Fetch additional user details from Firestore
      const fetchUserDetails = async () => {
        try {
          const userRef = doc(db, 'users', currentUser.uid);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            setUserDetails(userSnap.data());
          }
        } catch (error) {
          console.error('Error fetching user details:', error);
          setError('Failed to load user profile details.');
        }
      };
      
      fetchUserDetails();
    }
  }, [currentUser]);

  async function handleUpdateProfile(e) {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      return setError('Passwords do not match');
    }
    
    try {
      setError('');
      setMessage('');
      setLoading(true);
      
      const updates = [];
      
      // Update display name if changed
      if (displayName !== currentUser.displayName) {
        updates.push(updateProfile(currentUser, { displayName }));
      }
      
      // Update email if changed
      if (email !== currentUser.email) {
        updates.push(updateEmail(currentUser, email));
      }
      
      // Update password if provided
      if (newPassword) {
        updates.push(updatePassword(currentUser, newPassword));
      }
      
      // Save additional user details to Firestore
      updates.push(setDoc(doc(db, 'users', currentUser.uid), {
        displayName,
        email,
        updatedAt: new Date().toISOString(),
        // Preserve existing role or set default
        role: userDetails.role || 'user'
      }, { merge: true }));
      
      await Promise.all(updates);
      setMessage('Profile updated successfully');
      // Clear password fields after update
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      setError('Failed to update profile: ' + error.message);
    }
    
    setLoading(false);
  }

  async function handleLogout() {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      setError('Failed to log out: ' + error.message);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-indigo-600 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link to="/dashboard" className="text-white font-bold text-xl">Dashboard</Link>
          <div>
            <button 
              onClick={handleLogout}
              className="text-white hover:text-gray-200"
            >
              Log Out
            </button>
          </div>
        </div>
      </nav>
      
      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0 bg-white shadow rounded-lg">
          <h1 className="text-2xl font-semibold text-gray-900 mb-6">User Profile</h1>
          
          {error && <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>}
          
          {message && <div className="mt-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{message}</span>
          </div>}
          
          <form onSubmit={handleUpdateProfile} className="mt-6 space-y-6">
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                name="displayName"
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                name="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">New Password</label>
              <input
                type="password"
                name="newPassword"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Leave blank to keep the same"
              />
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Confirm New Password</label>
              <input
                type="password"
                name="confirmPassword"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Leave blank to keep the same"
              />
            </div>
            
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {loading ? 'Updating...' : 'Update Profile'}
              </button>
            </div>
          </form>
          
          <div className="mt-6 pt-6 border-t border-gray-200">
            <Link 
              to="/dashboard" 
              className="text-indigo-600 hover:text-indigo-900"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserProfile;
