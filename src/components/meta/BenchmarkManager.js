// src/components/meta/BenchmarkManager.js
import React, { useState, useEffect, useCallback } from 'react';
import { Edit } from 'lucide-react'; // Only import the icon that is actually used
import metaAPI from './metaAPI';

// Metrics configuration with formats and default values
const metricsConfig = [
  { id: 'ctr', name: 'CTR', format: 'percentage', defaultLow: 0.01, defaultMedium: 0.02 },
  { id: 'cpc', name: 'CPC', format: 'currency', defaultLow: 1.5, defaultMedium: 2.5 },
  { id: 'cpm', name: 'CPM', format: 'currency', defaultLow: 20, defaultMedium: 30 },
  { id: 'conversionRate', name: 'Conversion Rate', format: 'percentage', defaultLow: 0.02, defaultMedium: 0.04 },
  { id: 'costPerPurchase', name: 'Cost/Purchase', format: 'currency', defaultLow: 50, defaultMedium: 80 },
  { id: 'roas', name: 'ROAS', format: 'decimal', defaultLow: 1, defaultMedium: 2 }
];

const BenchmarkManager = ({ selectedAccountId, onClose, onSave }) => {
  const [benchmarks, setBenchmarks] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Initialize default benchmarks
  const initializeDefaultBenchmarks = useCallback(() => {
    const defaultBenchmarks = {};
    
    metricsConfig.forEach(metric => {
      defaultBenchmarks[metric.id] = {
        low: metric.defaultLow,
        medium: metric.defaultMedium,
        high: null
      };
    });
    
    setBenchmarks(defaultBenchmarks);
  }, []);

  // Fetch benchmarks with useCallback to avoid dependency issues
  const fetchBenchmarks = useCallback(async () => {
    try {
      // Use the updated metaAPI function to fetch benchmarks
      const response = await metaAPI.fetchBenchmarks(selectedAccountId);
      
      if (response.error) {
        setError(response.error);
        return;
      }
      
      if (response.data) {
        setBenchmarks(response.data);
      } else {
        // Initialize with default values if no benchmarks exist yet
        initializeDefaultBenchmarks();
      }
    } catch (error) {
      console.error('Error fetching benchmarks:', error);
      setError('Failed to load benchmark settings');
      initializeDefaultBenchmarks();
    }
  }, [selectedAccountId, initializeDefaultBenchmarks]);

  // Fetch existing benchmarks when account changes
  useEffect(() => {
    if (selectedAccountId) {
      fetchBenchmarks();
    }
  }, [selectedAccountId, fetchBenchmarks]);

  const handleBenchmarkChange = (metricId, level, value) => {
    const numericValue = value === '' ? null : parseFloat(value);
    
    setBenchmarks(prev => ({
      ...prev,
      [metricId]: {
        ...prev[metricId],
        [level]: numericValue
      }
    }));
  };
  
  const handleSaveBenchmarks = async () => {
    setIsSaving(true);
    setError('');
    setSuccess('');
    
    try {
      // Use the updated metaAPI function to save benchmarks
      const response = await metaAPI.saveBenchmarks(selectedAccountId, benchmarks);
      
      if (response.error) {
        setError(response.error);
      } else {
        setSuccess('Benchmark settings saved successfully');
        setIsEditing(false);
        
        // Call parent component callback
        if (onSave) {
          onSave(benchmarks);
        }
        
        // Close modal after a delay if onClose is provided
        if (onClose) {
          setTimeout(() => {
            onClose();
          }, 1500);
        }
      }
    } catch (error) {
      console.error('Error saving benchmarks:', error);
      setError('Failed to save benchmark settings');
    } finally {
      setIsSaving(false);
    }
  };

  const formatValue = (value, format) => {
    if (value === null || value === undefined) return 'None';
    
    switch (format) {
      case 'percentage':
        return `${(value * 100).toFixed(2)}%`;
      case 'currency':
        return `$${value.toFixed(2)}`;
      default:
        return value.toString();
    }
  };
  
  // Inline styles consistent with your existing code
  const styles = {
    container: {
      backgroundColor: 'white',
      borderRadius: '0.375rem',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      padding: '1.5rem'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '1.5rem'
    },
    title: {
      fontSize: '1.5rem',
      fontWeight: '600',
      color: '#1a202c'
    },
    button: {
      display: 'inline-flex',
      alignItems: 'center',
      borderRadius: '0.375rem',
      padding: '0.5rem 1rem',
      fontWeight: '500',
      backgroundColor: '#4299e1',
      color: 'white',
      transition: 'background-color 0.2s',
      cursor: 'pointer',
      border: 'none'
    },
    buttonSecondary: {
      backgroundColor: '#edf2f7',
      color: '#4a5568',
      marginRight: '0.75rem'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      marginTop: '1rem'
    },
    th: {
      textAlign: 'left',
      padding: '0.75rem 1rem',
      backgroundColor: '#EBF5FF',
      color: '#4A5568',
      fontWeight: '600',
      borderBottom: '1px solid #E2E8F0',
      fontSize: '0.875rem'
    },
    td: {
      padding: '0.75rem 1rem',
      borderBottom: '1px solid #E2E8F0',
      color: '#4A5568'
    },
    input: {
      padding: '0.5rem',
      border: '1px solid #E2E8F0',
      borderRadius: '0.25rem',
      width: '7rem'
    },
    alert: {
      padding: '0.75rem',
      borderRadius: '0.25rem',
      marginBottom: '1rem'
    },
    alertError: {
      backgroundColor: '#FEF2F2',
      borderColor: '#F87171',
      color: '#B91C1C'
    },
    alertSuccess: {
      backgroundColor: '#F0FDF4',
      borderColor: '#86EFAC',
      color: '#166534'
    },
    description: {
      marginBottom: '1rem',
      fontSize: '0.875rem',
      color: '#4A5568'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Performance Benchmark Settings</h2>
        
        <div>
          {isEditing ? (
            <button
              style={styles.button}
              onClick={handleSaveBenchmarks}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Benchmarks'}
            </button>
          ) : (
            <button
              style={{...styles.button, ...styles.buttonSecondary}}
              onClick={() => setIsEditing(true)}
            >
              <Edit size={16} style={{ marginRight: '0.5rem' }} />
              Edit Benchmarks
            </button>
          )}
        </div>
      </div>
      
      {error && (
        <div style={{...styles.alert, ...styles.alertError}}>
          {error}
        </div>
      )}
      
      {success && (
        <div style={{...styles.alert, ...styles.alertSuccess}}>
          {success}
        </div>
      )}
      
      <p style={styles.description}>
        Set benchmark thresholds for each metric below. Performance will be color-coded in the dashboard based on these ranges.
      </p>
      
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Metric</th>
            <th style={styles.th}>Low (Below)</th>
            <th style={styles.th}>Medium (Between)</th>
            <th style={styles.th}>High (Above)</th>
          </tr>
        </thead>
        <tbody>
          {metricsConfig.map(metric => (
            <tr key={metric.id}>
              <td style={styles.td}>{metric.name}</td>
              
              <td style={styles.td}>
                {isEditing ? (
                  <input
                    type="number"
                    step={metric.format === 'percentage' ? '0.01' : '0.5'}
                    style={styles.input}
                    value={benchmarks[metric.id]?.low ?? ''}
                    onChange={(e) => handleBenchmarkChange(metric.id, 'low', e.target.value)}
                  />
                ) : (
                  formatValue(benchmarks[metric.id]?.low, metric.format)
                )}
              </td>
              
              <td style={styles.td}>
                {isEditing ? (
                  <input
                    type="number"
                    step={metric.format === 'percentage' ? '0.01' : '0.5'}
                    style={styles.input}
                    value={benchmarks[metric.id]?.medium ?? ''}
                    onChange={(e) => handleBenchmarkChange(metric.id, 'medium', e.target.value)}
                  />
                ) : (
                  formatValue(benchmarks[metric.id]?.medium, metric.format)
                )}
              </td>
              
              <td style={styles.td}>
                {isEditing ? (
                  <input
                    type="number"
                    step={metric.format === 'percentage' ? '0.01' : '0.5'}
                    style={styles.input}
                    value={benchmarks[metric.id]?.high ?? ''}
                    onChange={(e) => handleBenchmarkChange(metric.id, 'high', e.target.value)}
                    placeholder="No upper limit"
                  />
                ) : (
                  formatValue(benchmarks[metric.id]?.high, metric.format)
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default BenchmarkManager;