// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import ResetPassword from './components/auth/ResetPassword';
import ProtectedRoute from './components/auth/ProtectedRoute';
import UserProfile from './components/auth/UserProfile';
import CombinedDashboard from './components/CombinedDashboard';
import AdminDashboard from './components/auth/AdminDashboard';
import './App.css';

function App() {
  // Navigation component with logout functionality
  const Navigation = () => {
    const { logout, currentUser } = useAuth();
    const navigate = useNavigate();
    
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
        justifyContent: 'flex-end', 
        padding: '10px', 
        backgroundColor: '#333',
        color: 'white'
      }}>
        <div>
          <span style={{ marginRight: '15px' }}>Logged in as: {currentUser?.email}</span>
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
          {currentUser?.email === 'akerekes81@gmail.com' && (
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

  // Dashboard component with header and footer
  const DashboardLayout = () => {
    return (
      <div className="App">
        <header className="App-header">
          <h1>Campaign Analytics Dashboard</h1>
        </header>
        <Navigation />
        <main className="App-main">
          <CombinedDashboard />
        </main>
        <footer className="App-footer">
          <p>© 2025 Your Company Name</p>
        </footer>
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
        <footer className="App-footer">
          <p>© 2025 Your Company Name</p>
        </footer>
      </div>
    );
  };

  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
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
            path="/profile" 
            element={
              <ProtectedRoute>
                <UserProfile />
              </ProtectedRoute>
            } 
          />
          
          {/* Admin routes */}
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
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
