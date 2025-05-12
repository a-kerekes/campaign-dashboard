// src/components/meta/EnhancedCreativePerformanceTable.js
import React, { useState, useEffect, useCallback } from 'react';
import { Download } from 'lucide-react';
import metaAPI from './metaAPI';

// Metrics configuration
const metricsConfig = [
  { id: 'ctr', name: 'CTR', format: 'percentage', higherIsBetter: true, defaultLow: 1.0, defaultMedium: 1.5 },
  { id: 'cpc', name: 'CPC', format: 'currency', higherIsBetter: false, defaultLow: 2, defaultMedium: 1 },
  { id: 'cpm', name: 'CPM', format: 'currency', higherIsBetter: false, defaultLow: 30, defaultMedium: 20 },
  { id: 'roas', name: 'ROAS', format: 'decimal', higherIsBetter: true, defaultLow: 1, defaultMedium: 2 },
  { id: 'costPerPurchase', name: 'Cost/Purchase', format: 'currency', higherIsBetter: false, defaultLow: 50, defaultMedium: 30 }
];

const EnhancedCreativePerformanceTable = ({ analyticsData, selectedAccountId, benchmarks: propBenchmarks, onCreativeSelect, onAccountChange }) => {
  const [creatives, setCreatives] = useState([]);
  const [sortColumn, setSortColumn] = useState('impressions');
  const [sortDirection, setSortDirection] = useState('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCreatives, setFilteredCreatives] = useState([]);
  const [selectedCreativeId, setSelectedCreativeId] = useState(null);
  const [benchmarks, setBenchmarks] = useState(propBenchmarks || {});
  const [isEditingBenchmarks, setIsEditingBenchmarks] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [tempBenchmarks, setTempBenchmarks] = useState({});
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch available accounts
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const response = await metaAPI.fetchAccounts();
        if (response && response.data) {
          setAccounts(response.data);
        }
      } catch (error) {
        console.error('Error fetching accounts:', error);
      }
    };
    
    fetchAccounts();
  }, []);

  // Initialize creatives from props or fetch based on selected account
  useEffect(() => {
    const fetchCreatives = async () => {
      if (!selectedAccountId) return;
      
      setLoading(true);
      try {
        const response = await metaAPI.fetchCreativePerformance(selectedAccountId);
        if (response && response.data) {
          setCreatives(response.data);
          setFilteredCreatives(response.data);
        }
      } catch (error) {
        console.error('Error fetching creative performance:', error);
        setStatusMessage('Error loading creatives');
        setTimeout(() => setStatusMessage(''), 3000);
      } finally {
        setLoading(false);
      }
    };

    if (analyticsData && analyticsData.creativePerformance) {
      setCreatives(analyticsData.creativePerformance);
      setFilteredCreatives(analyticsData.creativePerformance);
    } else if (selectedAccountId) {
      fetchCreatives();
    }
  }, [analyticsData, selectedAccountId]);
  
  // Load benchmarks from localStorage on component mount
  useEffect(() => {
    if (!selectedAccountId) return;
    
    const savedBenchmarks = localStorage.getItem(`benchmarks_${selectedAccountId}`);
    if (savedBenchmarks) {
      const parsedBenchmarks = JSON.parse(savedBenchmarks);
      setBenchmarks(parsedBenchmarks);
      setTempBenchmarks(parsedBenchmarks);
    } else if (propBenchmarks) {
      setBenchmarks(propBenchmarks);
      setTempBenchmarks(propBenchmarks);
      // Save provided benchmarks to localStorage
      localStorage.setItem(`benchmarks_${selectedAccountId}`, JSON.stringify(propBenchmarks));
    } else {
      // Initialize default benchmarks if none provided or saved
      const defaultBenchmarks = {};
      metricsConfig.forEach(metric => {
        defaultBenchmarks[metric.id] = {
          low: metric.defaultLow,
          medium: metric.defaultMedium
        };
      });
      setBenchmarks(defaultBenchmarks);
      setTempBenchmarks(defaultBenchmarks);
      // Save default benchmarks to localStorage
      localStorage.setItem(`benchmarks_${selectedAccountId}`, JSON.stringify(defaultBenchmarks));
    }
  }, [selectedAccountId, propBenchmarks]);

  // Fetch benchmarks from API (only if not already in localStorage)
  const fetchBenchmarks = useCallback(async () => {
    if (!selectedAccountId) return;
    
    // Check localStorage first
    const savedBenchmarks = localStorage.getItem(`benchmarks_${selectedAccountId}`);
    if (savedBenchmarks) {
      const parsedBenchmarks = JSON.parse(savedBenchmarks);
      setBenchmarks(parsedBenchmarks);
      setTempBenchmarks(parsedBenchmarks);
      return;
    }
    
    // If not in localStorage, fetch from API
    try {
      const response = await metaAPI.fetchBenchmarks(selectedAccountId);
      if (response && response.data) {
        setBenchmarks(response.data);
        setTempBenchmarks(response.data);
        // Save to localStorage
        localStorage.setItem(`benchmarks_${selectedAccountId}`, JSON.stringify(response.data));
      }
    } catch (error) {
      console.error('Error fetching benchmarks:', error);
    }
  }, [selectedAccountId]);

  // Fetch benchmarks when account changes
  useEffect(() => {
    fetchBenchmarks();
  }, [fetchBenchmarks]);

  // Handle account change
  const handleAccountChange = (e) => {
    const newAccountId = e.target.value;
    if (onAccountChange) {
      onAccountChange(newAccountId);
    }
    // Reset creative selection when account changes
    setSelectedCreativeId(null);
  };

  // Handle sort
  const handleSort = (column) => {
    if (sortColumn === column) {
      // Toggle sort direction if clicking the same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new sort column with default direction
      setSortColumn(column);
      setSortDirection(column === 'adName' ? 'asc' : 'desc');
    }
  };

  // Apply filters and sort
  useEffect(() => {
    let results = [...creatives];
    
    // Apply search filter if query exists
    if (searchQuery && searchQuery.trim() !== '') {
      const lowercaseQuery = searchQuery.toLowerCase().trim();
      results = results.filter(item => {
        return item.adName.toLowerCase().includes(lowercaseQuery);
      });
    }
    
    // Apply sort
    results.sort((a, b) => {
      let valueA = a[sortColumn] || 0;
      let valueB = b[sortColumn] || 0;
      
      // Special handling for string fields
      if (sortColumn === 'adName') {
        valueA = a.adName || '';
        valueB = b.adName || '';
        return sortDirection === 'asc' 
          ? valueA.localeCompare(valueB)
          : valueB.localeCompare(valueA);
      }
      
      // For numeric values
      return sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
    });
    
    setFilteredCreatives(results);
  }, [creatives, searchQuery, sortColumn, sortDirection]);

  // Handle creative selection
  const handleCreativeSelect = (creativeId) => {
    const creative = creatives.find(c => c.creativeId === creativeId);
    setSelectedCreativeId(creativeId);
    if (onCreativeSelect && creative) {
      onCreativeSelect(creative);
    }
  };

  // Handle benchmark change
  const handleBenchmarkChange = (metricId, level, value) => {
    setTempBenchmarks(prev => ({
      ...prev,
      [metricId]: {
        ...prev[metricId],
        [level]: value === '' ? '' : parseFloat(value)
      }
    }));
  };

  // Save benchmark changes
  const saveBenchmarks = async () => {
    try {
      // Format any empty strings to null
      const formattedBenchmarks = {};
      Object.keys(tempBenchmarks).forEach(metricId => {
        formattedBenchmarks[metricId] = {
          low: tempBenchmarks[metricId].low === '' ? null : parseFloat(tempBenchmarks[metricId].low),
          medium: tempBenchmarks[metricId].medium === '' ? null : parseFloat(tempBenchmarks[metricId].medium)
        };
      });
      
      // Save to API if available
      if (selectedAccountId) {
        try {
          await metaAPI.saveBenchmarks(selectedAccountId, formattedBenchmarks);
        } catch (apiError) {
          console.warn('API save failed, but we will still save locally:', apiError);
        }
      }
      
      // Always save to localStorage for persistence
      localStorage.setItem(`benchmarks_${selectedAccountId}`, JSON.stringify(formattedBenchmarks));
      
      // Update local state
      setBenchmarks(formattedBenchmarks);
      setIsEditingBenchmarks(false);
      setStatusMessage('Benchmarks saved successfully');
      setTimeout(() => setStatusMessage(''), 3000);
    } catch (error) {
      console.error('Error saving benchmarks:', error);
      setStatusMessage('Error saving benchmarks');
      setTimeout(() => setStatusMessage(''), 3000);
    }
  };

  // Export data to CSV
  const exportToCSV = () => {
    if (!filteredCreatives || filteredCreatives.length === 0) {
      setStatusMessage('No data to export');
      setTimeout(() => setStatusMessage(''), 3000);
      return;
    }
    
    try {
      // Generate CSV content
      const headers = [
        'Creative Name',
        'Impressions',
        'Clicks',
        'CTR (%)',
        'Spend ($)',
        'CPC ($)',
        'CPM ($)',
        'Purchases',
        'Cost/Purchase ($)',
        'ROAS'
      ];
      
      const rows = filteredCreatives.map(creative => [
        creative.adName,
        creative.impressions,
        creative.clicks,
        creative.ctr?.toFixed(2) || '0.00',
        creative.spend?.toFixed(2) || '0.00',
        creative.cpc?.toFixed(2) || '0.00',
        creative.cpm?.toFixed(2) || '0.00',
        creative.purchases || 0,
        creative.costPerPurchase?.toFixed(2) || '0.00',
        creative.roas?.toFixed(2) || '0.00'
      ]);
      
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');
      
      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `creative_performance_${selectedAccountId}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setStatusMessage('CSV exported successfully');
      setTimeout(() => setStatusMessage(''), 3000);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      setStatusMessage('Error exporting CSV');
      setTimeout(() => setStatusMessage(''), 3000);
    }
  };

  // Get benchmark status class
  const getColorStyle = (metric, value) => {
    // Short-circuit if no benchmarks or no value
    if (!benchmarks || !benchmarks[metric] || value === null || value === undefined) {
      return {};
    }
    
    // Get benchmark values
    const lowValue = benchmarks[metric].low;
    const mediumValue = benchmarks[metric].medium;
    
    // Skip if benchmark values aren't properly set
    if (lowValue === null || lowValue === undefined || 
        mediumValue === null || mediumValue === undefined) {
      return {};
    }
    
    // Get numeric values
    const numericValue = parseFloat(value);
    const numericLow = parseFloat(lowValue);
    const numericMedium = parseFloat(mediumValue);
    
    // Determine if higher is better for this metric
    const higherIsBetter = metricsConfig.find(m => m.id === metric)?.higherIsBetter || false;
    
    // Apply the appropriate color
    if (higherIsBetter) {
      // For metrics where higher is better (CTR, ROAS)
      if (numericValue < numericLow) {
        return { color: '#dc2626' }; // red
      } else if (numericValue < numericMedium) {
        return { color: '#d97706' }; // yellow/orange
      } else {
        return { color: '#059669' }; // green
      }
    } else {
      // For metrics where lower is better (CPC, CPM, Cost/Purchase)
      if (numericValue > numericLow) {
        return { color: '#dc2626' }; // red
      } else if (numericValue > numericMedium) {
        return { color: '#d97706' }; // yellow/orange
      } else {
        return { color: '#059669' }; // green
      }
    }
  };

  return (
    <div className="rounded-lg shadow-sm">
      {/* Header Section with Account Selector */}
      <div className="p-4 bg-white border-b border-gray-200 rounded-t-lg">
        <div className="flex flex-col md:flex-row justify-between mb-4">
          <h3 className="text-lg font-semibold mb-2 md:mb-0">Creative Performance</h3>
          
          <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-3">
            {/* Account Selector */}
            <div className="relative min-w-[250px]">
              <select
                className="w-full p-2 bg-blue-50 border border-blue-200 rounded text-blue-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer appearance-none pr-8"
                value={selectedAccountId || ''}
                onChange={handleAccountChange}
              >
                <option value="" disabled>Select Ad Account</option>
                {accounts.map(account => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <svg className="w-4 h-4 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div className="flex items-center mb-2 md:mb-0">
            <span className="text-sm text-gray-500 mr-2">{filteredCreatives.length} creatives</span>
            <button
              onClick={() => setIsEditingBenchmarks(!isEditingBenchmarks)}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium mr-4"
            >
              {isEditingBenchmarks ? 'Close Benchmarks' : 'Set Performance Benchmarks'}
            </button>
          </div>
          
          <div className="flex items-center w-full md:w-auto">
            <div className="relative flex-grow md:flex-grow-0 mr-2">
              <input
                type="text"
                placeholder="Search creatives..."
                className="pl-9 py-2 pr-3 w-full md:w-64 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </div>
            </div>
            
            <button
              onClick={exportToCSV}
              className="p-2 bg-gray-100 rounded hover:bg-gray-200 text-gray-700 flex items-center"
              title="Export to CSV"
            >
              <Download size={16} className="mr-1" />
              <span className="text-sm hidden md:inline">Export</span>
            </button>
          </div>
        </div>
        
        {statusMessage && (
          <div className="p-2 mt-2 bg-blue-50 text-blue-600 text-sm text-center rounded">
            {statusMessage}
          </div>
        )}
      </div>
      
      {/* Benchmark Settings - Modern UI */}
      {isEditingBenchmarks && (
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-medium text-gray-800">Performance Benchmarks</h4>
            <button 
              onClick={saveBenchmarks} 
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            >
              Save Benchmarks
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {metricsConfig.map(metric => (
              <div key={metric.id} className="bg-white p-3 rounded-lg shadow-sm">
                <div className="font-medium text-sm mb-2">{metric.name}</div>
                <div className="mb-3">
                  <label className="block text-xs text-gray-500 mb-1">
                    {metric.higherIsBetter ? 'Low (Below)' : 'Poor (Above)'}
                  </label>
                  <div className="flex items-center">
                    {metric.format === 'currency' && <span className="text-gray-400 ml-1 mr-1">$</span>}
                    <input
                      type="number"
                      step="0.1"
                      className="w-full p-2 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      value={tempBenchmarks[metric.id]?.low ?? ''}
                      onChange={(e) => handleBenchmarkChange(metric.id, 'low', e.target.value)}
                    />
                    {metric.format === 'percentage' && <span className="text-gray-400 ml-1">%</span>}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    {metric.higherIsBetter ? 'Good (Above)' : 'Good (Below)'}
                  </label>
                  <div className="flex items-center">
                    {metric.format === 'currency' && <span className="text-gray-400 ml-1 mr-1">$</span>}
                    <input
                      type="number"
                      step="0.1"
                      className="w-full p-2 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      value={tempBenchmarks[metric.id]?.medium ?? ''}
                      onChange={(e) => handleBenchmarkChange(metric.id, 'medium', e.target.value)}
                    />
                    {metric.format === 'percentage' && <span className="text-gray-400 ml-1">%</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Loading State */}
      {loading && (
        <div className="bg-white p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-blue-600 mb-2"></div>
          <p className="text-gray-600">Loading creatives...</p>
        </div>
      )}
      
      {/* Creative Performance Table - Modern UI */}
      {!loading && (
        <div className="bg-white rounded-b-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    style={{width: '30%'}}
                    onClick={() => handleSort('adName')}
                  >
                    Creative
                    {sortColumn === 'adName' && (
                      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th 
                    className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('adsetCount')}
                  >
                    Ad Sets
                    {sortColumn === 'adsetCount' && (
                      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th 
                    className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('impressions')}
                  >
                    Impressions
                    {sortColumn === 'impressions' && (
                      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th 
                    className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('clicks')}
                  >
                    Clicks
                    {sortColumn === 'clicks' && (
                      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th 
                    className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('ctr')}
                  >
                    CTR
                    {sortColumn === 'ctr' && (
                      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th 
                    className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('cpc')}
                  >
                    CPC
                    {sortColumn === 'cpc' && (
                      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th 
                    className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('cpm')}
                  >
                    CPM
                    {sortColumn === 'cpm' && (
                      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th 
                    className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('purchases')}
                  >
                    Purchases
                    {sortColumn === 'purchases' && (
                      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th 
                    className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('costPerPurchase')}
                  >
                    Cost/Purchase
                    {sortColumn === 'costPerPurchase' && (
                      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th 
                    className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('spend')}
                  >
                    Spend
                    {sortColumn === 'spend' && (
                      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th 
                    className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('roas')}
                  >
                    ROAS
                    {sortColumn === 'roas' && (
                      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredCreatives.map((creative) => (
                  <tr 
                    key={creative.creativeId || creative.adId || Math.random().toString(36)}
                    className={`border-b hover:bg-gray-50 transition ${selectedCreativeId === creative.creativeId ? 'bg-blue-50' : ''}`}
                    onClick={() => handleCreativeSelect(creative.creativeId)}
                    style={{cursor: 'pointer'}}
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center">
                        {creative.thumbnailUrl && (
                          <img 
                            src={creative.thumbnailUrl} 
                            alt={creative.adName}
                            className="w-12 h-12 object-cover rounded mr-3"
                          />
                        )}
                        <div className="text-sm font-medium text-gray-900" title={creative.adName}>
                          {creative.adName}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center text-sm text-gray-500">
                      {creative.adsetCount || 1}
                    </td>
                    <td className="px-4 py-4 text-center text-sm text-gray-500">
                      {creative.impressions ? creative.impressions.toLocaleString() : 0}
                    </td>
                    <td className="px-4 py-4 text-center text-sm text-gray-500">
                      {creative.clicks ? creative.clicks.toLocaleString() : 0}
                    </td>
                    <td className="px-4 py-4 text-center text-sm font-medium" style={getColorStyle('ctr', creative.ctr)}>
                      {creative.ctr ? `${creative.ctr.toFixed(2)}%` : '0.00%'}
                    </td>
                    <td className="px-4 py-4 text-center text-sm" style={getColorStyle('cpc', creative.cpc)}>
                      ${creative.cpc ? creative.cpc.toFixed(2) : '0.00'}
                    </td>
                    <td className="px-4 py-4 text-center text-sm" style={getColorStyle('cpm', creative.cpm)}>
                      ${creative.cpm ? creative.cpm.toFixed(2) : '0.00'}
                    </td>
                    <td className="px-4 py-4 text-center text-sm text-gray-500">
                      {creative.purchases || 0}
                    </td>
                    <td className="px-4 py-4 text-center text-sm" style={getColorStyle('costPerPurchase', creative.costPerPurchase)}>
                      ${creative.costPerPurchase ? creative.costPerPurchase.toFixed(2) : '0.00'}
                    </td>
                    <td className="px-4 py-4 text-center text-sm text-gray-500">
                      ${creative.spend ? creative.spend.toFixed(2) : '0.00'}
                    </td>
                    <td className="px-4 py-4 text-center text-sm font-medium" style={getColorStyle('roas', creative.roas)}>
                      {creative.roas ? `${creative.roas.toFixed(2)}x` : '0.00x'}
                    </td>
                  </tr>
                ))}
                
                {filteredCreatives.length === 0 && (
                  <tr>
                    <td colSpan="11" className="px-4 py-6 text-center text-gray-500">
                      {selectedAccountId ? 'No creatives found matching your criteria.' : 'Please select an account to view creatives.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};