// src/components/meta/BenchmarkManager.js
import React, { useState, useEffect, useCallback } from 'react';
import { Edit } from 'lucide-react';
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
    } else {
      initializeDefaultBenchmarks();
    }
  }, [selectedAccountId, fetchBenchmarks, initializeDefaultBenchmarks]);

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

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Performance Benchmark Settings</h2>
        
        <div>
          {isEditing ? (
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md flex items-center"
              onClick={handleSaveBenchmarks}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Benchmarks'}
            </button>
          ) : (
            <button
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-4 rounded-md flex items-center"
              onClick={() => setIsEditing(true)}
            >
              <Edit size={16} className="mr-2" />
              Edit Benchmarks
            </button>
          )}
        </div>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-md">
          {success}
        </div>
      )}
      
      <p className="mb-4 text-sm text-gray-600">
        Set benchmark thresholds for each metric below. Performance will be color-coded in the dashboard based on these ranges.
      </p>
      
      <div className="overflow-x-auto">
        <table className="w-full table-auto">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Metric</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Low (Below)</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Medium (Between)</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">High (Above)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {metricsConfig.map(metric => (
              <tr key={metric.id} className="hover:bg-gray-50">
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {metric.name}
                </td>
                
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                  {isEditing ? (
                    <div className="relative">
                      <input
                        type="number"
                        step={metric.format === 'percentage' ? '0.01' : '0.5'}
                        className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={benchmarks[metric.id]?.low ?? ''}
                        onChange={(e) => handleBenchmarkChange(metric.id, 'low', e.target.value)}
                      />
                      <span className="absolute right-3 top-2 text-gray-400">
                        {metric.format === 'percentage' ? '%' : metric.format === 'currency' ? '$' : ''}
                      </span>
                    </div>
                  ) : (
                    formatValue(benchmarks[metric.id]?.low, metric.format)
                  )}
                </td>
                
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                  {isEditing ? (
                    <div className="relative">
                      <input
                        type="number"
                        step={metric.format === 'percentage' ? '0.01' : '0.5'}
                        className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={benchmarks[metric.id]?.medium ?? ''}
                        onChange={(e) => handleBenchmarkChange(metric.id, 'medium', e.target.value)}
                      />
                      <span className="absolute right-3 top-2 text-gray-400">
                        {metric.format === 'percentage' ? '%' : metric.format === 'currency' ? '$' : ''}
                      </span>
                    </div>
                  ) : (
                    formatValue(benchmarks[metric.id]?.medium, metric.format)
                  )}
                </td>
                
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                  {isEditing ? (
                    <div className="relative">
                      <input
                        type="number"
                        step={metric.format === 'percentage' ? '0.01' : '0.5'}
                        className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={benchmarks[metric.id]?.high ?? ''}
                        onChange={(e) => handleBenchmarkChange(metric.id, 'high', e.target.value)}
                        placeholder="No upper limit"
                      />
                      <span className="absolute right-3 top-2 text-gray-400">
                        {metric.format === 'percentage' ? '%' : metric.format === 'currency' ? '$' : ''}
                      </span>
                    </div>
                  ) : (
                    formatValue(benchmarks[metric.id]?.high, metric.format)
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Help text */}
      <div className="mt-6 p-4 bg-blue-50 text-blue-800 rounded-md text-sm">
        <p><strong>Setting Tips:</strong></p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>For <strong>CTR</strong> and <strong>ROAS</strong>, higher values are better. Set thresholds where low values indicate poor performance.</li>
          <li>For <strong>CPC</strong>, <strong>CPM</strong> and <strong>Cost/Purchase</strong>, lower values are better. Set thresholds where high values indicate poor performance.</li>
          <li>Benchmarks are automatically color-coded in the dashboard for easy visualization.</li>
        </ul>
      </div>
    </div>
  );
};

export default BenchmarkManager;