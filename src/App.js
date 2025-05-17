// src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import ResetPassword from './components/auth/ResetPassword';
import ProtectedRoute from './components/auth/ProtectedRoute';
import UserProfile from './components/auth/UserProfile';
import CombinedDashboard from './components/CombinedDashboard';
// Import the AdminDashboard component
import AdminDashboard from './components/auth/AdminDashboard';
import CreativeAnalyticsDashboard from './components/meta/CreativeAnalyticsDashboard';
import MetaApiDiagnostic from './components/meta/MetaApiDiagnostic';
import PrivacyPolicy from './components/pages/PrivacyPolicy';
import TermsOfService from './components/pages/TermsOfService';
import TenantSelector from './components/TenantSelector';
import ClaudeServerStatus from './components/meta/ClaudeServerStatus';
import { initServerMonitoring, checkServerRunning } from './utils/claudeServerLauncher';
import './App.css';

// Define a simple direct admin component for testing
const DirectAdminTest = () => {
  const navigate = useNavigate();
  return (
    <div style={{ padding: '50px', textAlign: 'center', backgroundColor: '#f0f0f0', minHeight: '100vh' }}>
      <h1 style={{ color: '#333', marginBottom: '20px' }}>Direct Admin Test</h1>
      <p>This is a direct test of the admin route without using layouts or protected routes.</p>
      
      <div style={{ padding: '20px', backgroundColor: 'white', borderRadius: '8px', maxWidth: '500px', margin: '20px auto' }}>
        <button 
          onClick={() => navigate('/dashboard')}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#4285f4', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px', 
            cursor: 'pointer', 
            margin: '10px' 
          }}
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

// Fix the router base with the correct spelling
const routerBase = process.env.REACT_APP_ROUTER_BASE || '/';

// Debug for troubleshooting
console.log('Router base path:', routerBase);

function App() {
  // eslint-disable-next-line no-unused-vars
  const [appError, setAppError] = useState(null);
  
  // Add a global error handler
  useEffect(() => {
    const handleError = (error) => {
      console.error('Global error:', error);
      // Uncomment if you want to use the error UI
      // setAppError(error);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  // Initialize Claude server monitoring
  useEffect(() => {
    const cleanup = initServerMonitoring();
    return cleanup;
  }, []);

  // Add favicon links in the document
  useEffect(() => {
    // Create link elements for favicons
    const appleTouchIcon = document.createElement('link');
    appleTouchIcon.rel = 'apple-touch-icon';
    appleTouchIcon.sizes = '180x180';
    appleTouchIcon.href = '/apple-touch-icon.png';
    
    const favicon32 = document.createElement('link');
    favicon32.rel = 'icon';
    favicon32.type = 'image/png';
    favicon32.sizes = '32x32';
    favicon32.href = '/favicon-32x32.png';
    
    const favicon16 = document.createElement('link');
    favicon16.rel = 'icon';
    favicon16.type = 'image/png';
    favicon16.sizes = '16x16';
    favicon16.href = '/favicon-16x16.png';
    
    const manifest = document.createElement('link');
    manifest.rel = 'manifest';
    manifest.href = '/site.webmanifest';
    
    // Append to document head
    document.head.appendChild(appleTouchIcon);
    document.head.appendChild(favicon32);
    document.head.appendChild(favicon16);
    document.head.appendChild(manifest);
    
    // Cleanup on component unmount (optional)
    return () => {
      document.head.removeChild(appleTouchIcon);
      document.head.removeChild(favicon32);
      document.head.removeChild(favicon16);
      document.head.removeChild(manifest);
    };
  }, []);

  // Simple error display if something goes wrong
  if (appError) {
    return (
      <div style={{ padding: '20px', color: 'red' }}>
        <h1>Application Error:</h1>
        <p>{appError.message}</p>
        <button 
          onClick={() => window.location.reload()}
          style={{ padding: '10px', margin: '10px 0' }}
        >
          Reload Application
        </button>
      </div>
    );
  }

  // Navigation component with logout functionality
  const Navigation = () => {
    const { logout, currentUser, currentTenant, isAdmin, cleanStringValue } = useAuth();
    const navigate = useNavigate();
    
    // Start Claude server when nav component mounts (user is logged in)
    useEffect(() => {
      checkServerRunning();
    }, []);
    
    // Debug logging
    console.log("Navigation rendering, admin check:", {
      currentUserEmail: currentUser?.email,
      cleanedEmail: cleanStringValue ? cleanStringValue(currentUser?.email) : currentUser?.email,
      isAdmin,
      userObj: currentUser
    });
    
    const handleLogout = async () => {
      try {
        await logout();
        navigate('/login');
      } catch (error) {
        console.error('Logout error:', error);
      }
    };
    
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        padding: '10px', 
        backgroundColor: '#333',
        color: 'white'
      }}>
        <div>
          <button 
            onClick={() => navigate('/dashboard')}
            style={{ 
              marginRight: '10px',
              padding: '5px 10px', 
              backgroundColor: '#4285f4', 
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Dashboard
          </button>
          <button 
            onClick={() => navigate('/creative-analytics')}
            style={{ 
              marginRight: '10px',
              padding: '5px 10px', 
              backgroundColor: '#4285f4', 
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Creative Analytics
          </button>
          <button 
            onClick={() => navigate('/meta-diagnostic')}
            style={{ 
              marginRight: '10px',
              padding: '5px 10px', 
              backgroundColor: '#4CAF50', 
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Meta API Diagnostic
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {/* Add Claude Server Status */}
          <ClaudeServerStatus />
          
          {/* Add Tenant Selector */}
          {currentUser && (
            <div style={{ marginRight: '15px', minWidth: '150px' }}>
              <TenantSelector />
            </div>
          )}
          <span style={{ marginRight: '15px' }}>
            {cleanStringValue ? cleanStringValue(currentUser?.email) : currentUser?.email}
            {currentTenant && ` (${currentTenant.name})`}
          </span>
          <button 
            onClick={() => navigate('/profile')}
            style={{ 
              marginRight: '10px',
              padding: '5px 10px', 
              backgroundColor: '#4285f4', 
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Profile
          </button>
          
          {/* Admin buttons - multiple options for testing */}
          {isAdmin && (
            <>
              <button 
                onClick={() => navigate('/admin')}
                style={{ 
                  marginRight: '10px',
                  padding: '5px 10px', 
                  backgroundColor: '#f44336', 
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Admin
              </button>
              <button 
                onClick={() => navigate('/direct-admin')}
                style={{ 
                  marginRight: '10px',
                  padding: '5px 10px', 
                  backgroundColor: '#FF9800', 
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Direct Admin
              </button>
              <button 
                onClick={() => navigate('/admin-panel')}
                style={{ 
                  marginRight: '10px',
                  padding: '5px 10px', 
                  backgroundColor: '#9C27B0', 
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Admin Panel
              </button>
            </>
          )}
          
          <button 
            onClick={handleLogout}
            style={{ 
              padding: '5px 10px', 
              backgroundColor: '#555', 
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>
      </div>
    );
  };

  // Footer component with links to policy pages
  const Footer = () => {
    return (
      <footer className="App-footer">
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
          <a href={`${routerBase}/privacy-policy`} style={{ color: '#ccc', textDecoration: 'none' }}>Privacy Policy</a>
          <a href={`${routerBase}/terms`} style={{ color: '#ccc', textDecoration: 'none' }}>Terms of Service</a>
        </div>
        <p>© 2025 Your Company Name</p>
      </footer>
    );
  };

  // Dashboard component with header and footer
  const DashboardLayout = () => {
    const { currentTenant } = useAuth();
    
    // Start Claude server when user accesses dashboard
    useEffect(() => {
      checkServerRunning();
    }, []);
    
    return (
      <div className="App">
        <header className="App-header">
          <h1>Campaign Analytics Dashboard</h1>
          {currentTenant && <h2 className="tenant-subtitle">{currentTenant.name}</h2>}
        </header>
        <Navigation />
        <main className="App-main">
          <CombinedDashboard />
        </main>
        <Footer />
      </div>
    );
  };

  // Creative Analytics Dashboard layout
  const CreativeAnalyticsLayout = () => {
    const { currentTenant } = useAuth();
    
    // Start Claude server when user accesses creative analytics
    useEffect(() => {
      checkServerRunning();
    }, []);
    
    return (
      <div className="App">
        <header className="App-header">
          <h1>Creative Analytics Dashboard</h1>
          {currentTenant && <h2 className="tenant-subtitle">{currentTenant.name}</h2>}
        </header>
        <Navigation />
        <main className="App-main">
          <CreativeAnalyticsDashboard />
        </main>
        <Footer />
      </div>
    );
  };

  // Meta API Diagnostic layout
  const MetaDiagnosticLayout = () => {
    return (
      <div className="App">
        <header className="App-header">
          <h1>Meta API Diagnostic Tool</h1>
        </header>
        <Navigation />
        <main className="App-main">
          <MetaApiDiagnostic />
        </main>
        <Footer />
      </div>
    );
  };

  // Admin dashboard with header and footer
  const AdminLayout = () => {
    return (
      <div className="App">
        <header className="App-header">
          <h1>Admin Dashboard</h1>
        </header>
        <Navigation />
        <main className="App-main">
          <AdminDashboard />
        </main>
        <Footer />
      </div>
    );
  };

  // User profile layout
  const ProfileLayout = () => {
    return (
      <div className="App">
        <header className="App-header">
          <h1>User Profile</h1>
        </header>
        <Navigation />
        <main className="App-main">
          <UserProfile />
        </main>
        <Footer />
      </div>
    );
  };

  // Simple test component for troubleshooting
  const TestComponent = () => {
    return (
      <div style={{ padding: '50px', textAlign: 'center' }}>
        <h1>Test Page</h1>
        <p>If you can see this, routing is working correctly.</p>
        <div style={{ margin: '20px 0' }}>
          <a href={`${routerBase}/login`} style={{ marginRight: '10px', padding: '5px 10px', backgroundColor: '#4285f4', color: 'white', textDecoration: 'none', borderRadius: '4px' }}>Go to Login</a>
          <a href={`${routerBase}/admin`} style={{ padding: '5px 10px', backgroundColor: '#4CAF50', color: 'white', textDecoration: 'none', borderRadius: '4px' }}>Go to Admin</a>
        </div>
      </div>
    );
  };

  return (
    <BrowserRouter basename={routerBase}>
      <AuthProvider>
        <Routes>
          {/* Direct admin routes for testing - at the top to ensure they match first */}
          <Route path="/direct-admin" element={<DirectAdminTest />} />
          <Route path="/admin-panel" element={<AdminDashboard />} />
          
          {/* Test route for troubleshooting */}
          <Route path="/test" element={<TestComponent />} />
          
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          
          {/* Protected routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/creative-analytics" 
            element={
              <ProtectedRoute>
                <CreativeAnalyticsLayout />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/meta-diagnostic" 
            element={
              <ProtectedRoute>
                <MetaDiagnosticLayout />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <ProfileLayout />
              </ProtectedRoute>
            } 
          />
          
          {/* Admin route - with layout and protected route */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            } 
          />
          
          {/* Default route */}
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;