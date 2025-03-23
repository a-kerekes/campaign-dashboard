// src/components/auth/Login.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setError('');
      setLoading(true);
      await login(email, password);
      navigate('/dashboard');
    } catch (error) {
      setError('Failed to log in: ' + error.message);
    }

    setLoading(false);
  }

  const styles = {
    container: {
      display: 'flex',
      minHeight: '100vh',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f5f5f5',
      padding: '20px'
    },
    formCard: {
      width: '100%',
      maxWidth: '400px',
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      padding: '30px',
      margin: '0 auto'
    },
    title: {
      fontSize: '28px',
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: '10px',
      color: '#333'
    },
    subtitle: {
      fontSize: '16px',
      textAlign: 'center',
      marginBottom: '24px',
      color: '#666'
    },
    errorAlert: {
      backgroundColor: '#FEE2E2',
      color: '#B91C1C',
      padding: '12px',
      borderRadius: '4px',
      marginBottom: '20px',
      border: '1px solid #FECACA'
    },
    formGroup: {
      marginBottom: '20px'
    },
    label: {
      display: 'block',
      marginBottom: '8px',
      fontSize: '14px',
      fontWeight: '500',
      color: '#374151'
    },
    input: {
      width: '100%',
      padding: '10px 12px',
      fontSize: '16px',
      borderRadius: '4px',
      border: '1px solid #D1D5DB',
      outline: 'none',
      boxSizing: 'border-box'
    },
    forgotPassword: {
      fontSize: '14px',
      color: '#3B82F6',
      textDecoration: 'none',
      display: 'inline-block',
      marginBottom: '20px'
    },
    button: {
      width: '100%',
      padding: '12px',
      backgroundColor: '#4F46E5',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      fontSize: '16px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'background-color 0.3s ease',
      marginBottom: '20px'
    },
    buttonHover: {
      backgroundColor: '#4338CA'
    },
    buttonDisabled: {
      backgroundColor: '#9CA3AF',
      cursor: 'not-allowed'
    },
    signupText: {
      textAlign: 'center',
      fontSize: '14px',
      color: '#6B7280'
    },
    signupLink: {
      color: '#3B82F6',
      textDecoration: 'none',
      fontWeight: '500'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.formCard}>
        <h2 style={styles.title}>Sign In</h2>
        <p style={styles.subtitle}>Access your campaign analytics dashboard</p>
        
        {error && (
          <div style={styles.errorAlert}>
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label htmlFor="email-address" style={styles.label}>Email address</label>
            <input
              id="email-address"
              name="email"
              type="email"
              autoComplete="email"
              required
              style={styles.input}
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <div style={styles.formGroup}>
            <label htmlFor="password" style={styles.label}>Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              style={styles.input}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          
          <Link to="/reset-password" style={styles.forgotPassword}>
            Forgot your password?
          </Link>
          
          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.button,
              ...(loading ? styles.buttonDisabled : {})
            }}
            onMouseOver={(e) => {
              if (!loading) e.currentTarget.style.backgroundColor = styles.buttonHover.backgroundColor;
            }}
            onMouseOut={(e) => {
              if (!loading) e.currentTarget.style.backgroundColor = styles.button.backgroundColor;
            }}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
          
          <p style={styles.signupText}>
            Don't have an account? <Link to="/signup" style={styles.signupLink}>Sign up</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Login;
