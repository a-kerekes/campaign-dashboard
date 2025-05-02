// src/context/AuthContext.js
import React, { useContext, useState, useEffect, createContext, useCallback } from 'react';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/firebase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentTenant, setCurrentTenant] = useState(null);
  const [availableTenants, setAvailableTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Helper function to clean string values from quotes - using useCallback to avoid dependency issues
  const cleanStringValue = useCallback((value) => {
    if (!value) return '';
    if (typeof value !== 'string') return value;
    return value.replace(/^"(.*)"$/, '$1').trim();
  }, []);

  // Helper function to check if user is admin - using useCallback to avoid dependency issues
  const isUserAdmin = useCallback((user) => {
    if (!user) return false;
    
    // Check for email match with quotation handling
    const cleanEmail = cleanStringValue(user.email);
    if (cleanEmail.toLowerCase() === 'akerekes81@gmail.com') {
      console.log("Admin detected by email match:", cleanEmail);
      return true;
    }
    
    // Check for role=admin with quotation handling
    const cleanRole = cleanStringValue(user.role);
    const isRoleAdmin = cleanRole.toLowerCase() === 'admin';
    if (isRoleAdmin) {
      console.log("Admin detected by role:", cleanRole);
      return true;
    }
    
    return false;
  }, [cleanStringValue]);

  async function signup(email, password) {
    try {
      setError('');
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Initialize the user document in Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email: email,
        role: 'user',
        tenants: [],
        createdAt: new Date().toISOString()
      });
      
      return userCredential;
    } catch (err) {
      setError('Failed to create an account: ' + err.message);
      throw err;
    }
  }

  async function login(email, password) {
    try {
      setError('');
      return await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError('Failed to log in: ' + err.message);
      throw err;
    }
  }

  async function logout() {
    try {
      setError('');
      setCurrentTenant(null);
      return await signOut(auth);
    } catch (err) {
      setError('Failed to log out: ' + err.message);
      throw err;
    }
  }

  async function resetPassword(email) {
    try {
      setError('');
      return await sendPasswordResetEmail(auth, email);
    } catch (err) {
      setError('Failed to reset password: ' + err.message);
      throw err;
    }
  }

  const fetchUserData = useCallback(async (user) => {
    if (!user) return null;
    
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (userDoc.exists()) {
        const userData = { id: user.uid, ...userDoc.data() };
        console.log('Fetched user data:', userData);
        return userData;
      } else {
        console.log('No user document found, creating one...');
        const newUserData = {
          email: user.email,
          role: 'user',
          tenants: [],
          createdAt: new Date().toISOString()
        };
        
        await setDoc(doc(db, 'users', user.uid), newUserData);
        return { id: user.uid, ...newUserData };
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
      return { id: user.uid, email: user.email };
    }
  }, []);

  const fetchTenants = useCallback(async (userTenantIds) => {
    if (!userTenantIds || userTenantIds.length === 0) return [];
    
    try {
      const tenantPromises = userTenantIds.map(async (tenantId) => {
        const tenantDoc = await getDoc(doc(db, 'tenants', tenantId));
        if (tenantDoc.exists()) {
          return { id: tenantId, ...tenantDoc.data() };
        }
        return null;
      });
      
      const tenants = (await Promise.all(tenantPromises)).filter(tenant => tenant !== null);
      console.log('Fetched tenants:', tenants);
      return tenants;
    } catch (err) {
      console.error('Error fetching tenants:', err);
      return [];
    }
  }, []);

  async function selectTenant(tenantId) {
    if (!tenantId || !availableTenants.length) return;
    
    const tenant = availableTenants.find(t => t.id === tenantId);
    
    if (tenant) {
      setCurrentTenant(tenant);
      
      // Optionally save the current tenant selection to localStorage
      localStorage.setItem('lastSelectedTenant', tenantId);
      
      return tenant;
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user?.email);
      
      try {
        let userData = null;
        let tenants = [];
        
        if (user) {
          // Fetch the full user data from Firestore
          userData = await fetchUserData(user);
          
          if (userData?.tenants && userData.tenants.length > 0) {
            // Fetch the tenant data
            tenants = await fetchTenants(userData.tenants);
            setAvailableTenants(tenants);
            
            // Set the current tenant
            const lastSelectedTenantId = localStorage.getItem('lastSelectedTenant');
            
            if (lastSelectedTenantId && tenants.some(t => t.id === lastSelectedTenantId)) {
              // Use the last selected tenant if it's still available
              setCurrentTenant(tenants.find(t => t.id === lastSelectedTenantId));
            } else if (tenants.length > 0) {
              // Otherwise use the first tenant
              setCurrentTenant(tenants[0]);
            }
          }
        }
        
        // Set the current user with the full data
        setCurrentUser(userData);
        
        // Determine if the user is an admin
        const admin = isUserAdmin(userData);
        console.log('Is user admin:', admin, userData?.email);
        
      } catch (err) {
        console.error('Error in auth state change:', err);
      } finally {
        setLoading(false);
      }
    });
    
    return unsubscribe;
  }, [fetchUserData, fetchTenants, isUserAdmin]); // Added all dependencies here

  // Create a value with admin status computed just before rendering
  const currentUserIsAdmin = currentUser ? isUserAdmin(currentUser) : false;
  console.log("Current user admin status:", currentUserIsAdmin, currentUser?.email);

  const value = {
    currentUser,
    currentTenant,
    availableTenants,
    isAdmin: currentUserIsAdmin,
    login,
    signup,
    logout,
    resetPassword,
    selectTenant,
    error,
    cleanStringValue
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}