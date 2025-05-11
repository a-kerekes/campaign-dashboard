// src/components/meta/EnhancedCreativePerformanceTable.js
import React, { useState, useEffect, useCallback } from 'react';
import { Download, Eye, Copy } from 'lucide-react';
import metaAPI from './metaAPI';

// Metrics configuration
const metricsConfig = [
  { id: 'ctr', name: 'CTR', format: 'percentage', higherIsBetter: true, defaultLow: 1.0, defaultMedium: 1.5 },
  { id: 'cpc', name: 'CPC', format: 'currency', higherIsBetter: false, defaultLow: 2, defaultMedium: 1 },
  { id: 'cpm', name: 'CPM', format: 'currency', higherIsBetter: false, defaultLow: 30, defaultMedium: 20 },
  { id: 'roas', name: 'ROAS', format: 'decimal', higherIsBetter: true, defaultLow: 1, defaultMedium: 2 },
  { id: 'costPerPurchase', name: 'Cost/Purchase', format: 'currency', higherIsBetter: false, defaultLow: 50, defaultMedium: 30 }
];

const EnhancedCreativePerformanceTable = ({ analyticsData, selectedAccountId, benchmarks: propBenchmarks, onCreativeSelect }) => {
  const [creatives, setCreatives] = useState([]);
  const [sortColumn, setSortColumn] = useState('impressions');
  const [sortDirection, setSortDirection] = useState('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCreatives, setFilteredCreatives] = useState([]);
  const [selectedCreativeId, setSelectedCreativeId] = useState(null);
  const [expandedCreativeId, setExpandedCreativeId] = useState(null);
  const [benchmarks, setBenchmarks] = useState(propBenchmarks || {});
  const [isEditingBenchmarks, setIsEditingBenchmarks] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [tempBenchmarks, setTempBenchmarks] = useState({});

  // Initialize creatives from props
  useEffect(() => {
    if (analyticsData && analyticsData.creativePerformance) {
      setCreatives(analyticsData.creativePerformance);
      setFilteredCreatives(analyticsData.creativePerformance);
    }
  }, [analyticsData]);
  
  // Initialize benchmarks
  useEffect(() => {
    if (propBenchmarks) {
      setBenchmarks(propBenchmarks);
      setTempBenchmarks(propBenchmarks);
    } else {
      // Initialize default benchmarks if none provided
      const defaultBenchmarks = {};
      metricsConfig.forEach(metric => {
        defaultBenchmarks[metric.id] = {
          low: metric.defaultLow,
          medium: metric.defaultMedium
        };
      });
      setBenchmarks(defaultBenchmarks);
      setTempBenchmarks(defaultBenchmarks);
    }
  }, [propBenchmarks]);

  // Fetch benchmarks with useCallback
  const fetchBenchmarks = useCallback(async () => {
    if (!selectedAccountId || propBenchmarks) return;
    
    try {
      const response = await metaAPI.fetchBenchmarks(selectedAccountId);
      if (response.data) {
        setBenchmarks(response.data);
        setTempBenchmarks(response.data);
      }
    } catch (error) {
      console.error('Error fetching benchmarks:', error);
    }
  }, [selectedAccountId, propBenchmarks]);

  // Fetch benchmarks when account changes
  useEffect(() => {
    fetchBenchmarks();
  }, [fetchBenchmarks]);

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

  // Handle creative expansion
  const handleCreativeExpand = (creativeId) => {
    setExpandedCreativeId(expandedCreativeId === creativeId ? null : creativeId);
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
          low: tempBenchmarks[metricId].low === '' ? null : tempBenchmarks[metricId].low,
          medium: tempBenchmarks[metricId].medium === '' ? null : tempBenchmarks[metricId].medium
        };
      });
      
      // Save to API if available
      if (selectedAccountId) {
        await metaAPI.saveBenchmarks(selectedAccountId, formattedBenchmarks);
      }
      
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
        creative.ctr.toFixed(2),
        creative.spend.toFixed(2),
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
      link.setAttribute('download', `creative_performance_${new Date().toISOString().split('T')[0]}.csv`);
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

  // Copy creative ID to clipboard
  const copyCreativeId = (id) => {
    navigator.clipboard.writeText(id).then(() => {
      setStatusMessage('Creative ID copied to clipboard');
      setTimeout(() => setStatusMessage(''), 3000);
    }).catch(err => {
      console.error('Error copying to clipboard:', err);
      setStatusMessage('Error copying to clipboard');
      setTimeout(() => setStatusMessage(''), 3000);
    });
  };

  // Format value according to format
  const formatValue = (value, format) => {
    if (value === null || value === undefined) return 'N/A';
    
    switch (format) {
      case 'percentage':
        return `${value.toFixed(2)}%`;
      case 'currency':
        return `$${value.toFixed(2)}`;
      default:
        return value.toFixed(2).toString();
    }
  };

  // Get benchmark status class
  const getBenchmarkStatusClass = (metric, value) => {
    if (!benchmarks || !benchmarks[metric]) return '';
    
    const { low, medium } = benchmarks[metric];
    if (low === null && medium === null) return '';
    
    // Adjust for percentage values
    let adjustedValue = value;
    if (metric === 'ctr') {
      adjustedValue = value / 100; // Convert from percentage to decimal
    }
    
    // Determine color based on metric type
    const metricConfig = metricsConfig.find(m => m.id === metric);
    const isHigherBetter = metricConfig ? metricConfig.higherIsBetter : ['ctr', 'roas'].includes(metric);
    
    if (isHigherBetter) {
      // For metrics where higher is better (CTR, ROAS)
      if (low !== null && adjustedValue < low) {
        return 'bg-red-100 text-red-800';
      } else if (medium !== null && adjustedValue < medium) {
        return 'bg-yellow-100 text-yellow-800';
      } else {
        return 'bg-green-100 text-green-800';
      }
    } else {
      // For metrics where lower is better (CPC, CPM, Cost per Purchase)
      if (low !== null && adjustedValue > low) {
        return 'bg-red-100 text-red-800';
      } else if (medium !== null && adjustedValue > medium) {
        return 'bg-yellow-100 text-yellow-800';
      } else {
        return 'bg-green-100 text-green-800';
      }
    }
  };

  return (
    <div>
      {/* Set Performance Benchmarks Section - Above the table header */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Creative Performance</h3>
        
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center">
            <span className="text-sm text-gray-500 mr-2">{filteredCreatives.length} creatives</span>
            <button
              onClick={() => setIsEditingBenchmarks(!isEditingBenchmarks)}
              className="text-sm text-blue-600 hover:text-blue-800 underline mr-4"
            >
              {isEditingBenchmarks ? 'Close' : 'Set Performance Benchmarks'}
            </button>
          </div>
          
          <div className="flex items-center">
            <input
              type="text"
              placeholder="Search creatives..."
              className="px-3 py-1 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 mr-2"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            
            <button
              onClick={exportToCSV}
              className="p-1 bg-gray-100 rounded hover:bg-gray-200 text-gray-700"
              title="Export to CSV"
            >
              <Download size={16} />
            </button>
          </div>
        </div>
        
        {statusMessage && (
          <div className="p-2 bg-blue-50 text-blue-600 text-sm text-center mb-2">
            {statusMessage}
          </div>
        )}
      </div>
      
      {/* Benchmark Settings */}
      {isEditingBenchmarks && (
        <div className="mb-4 p-3 bg-gray-50 border rounded-md">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-medium text-gray-800">Set Performance Benchmarks</h4>
            <button 
              onClick={saveBenchmarks} 
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
            >
              Save Benchmarks
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {/* CTR */}
            <div>
              <div className="font-medium text-sm mb-1">CTR</div>
              <div className="mb-2">
                <label className="block text-xs text-gray-500">Low (Below)</label>
                <div className="flex items-center">
                  <input
                    type="number"
                    step="0.1"
                    className="w-full p-1 text-sm border rounded"
                    value={tempBenchmarks.ctr?.low ?? ''}
                    onChange={(e) => handleBenchmarkChange('ctr', 'low', e.target.value)}
                  />
                  <span className="ml-1">%</span>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500">Good (Above)</label>
                <div className="flex items-center">
                  <input
                    type="number"
                    step="0.1"
                    className="w-full p-1 text-sm border rounded"
                    value={tempBenchmarks.ctr?.medium ?? ''}
                    onChange={(e) => handleBenchmarkChange('ctr', 'medium', e.target.value)}
                  />
                  <span className="ml-1">%</span>
                </div>
              </div>
            </div>
            
            {/* CPC */}
            <div>
              <div className="font-medium text-sm mb-1">CPC</div>
              <div className="mb-2">
                <label className="block text-xs text-gray-500">Poor (Above)</label>
                <div className="flex items-center">
                  <input
                    type="number"
                    step="0.1"
                    className="w-full p-1 text-sm border rounded"
                    value={tempBenchmarks.cpc?.low ?? ''}
                    onChange={(e) => handleBenchmarkChange('cpc', 'low', e.target.value)}
                  />
                  <span className="ml-1">$</span>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500">Good (Below)</label>
                <div className="flex items-center">
                  <input
                    type="number"
                    step="0.1"
                    className="w-full p-1 text-sm border rounded"
                    value={tempBenchmarks.cpc?.medium ?? ''}
                    onChange={(e) => handleBenchmarkChange('cpc', 'medium', e.target.value)}
                  />
                  <span className="ml-1">$</span>
                </div>
              </div>
            </div>
            
            {/* CPM */}
            <div>
              <div className="font-medium text-sm mb-1">CPM</div>
              <div className="mb-2">
                <label className="block text-xs text-gray-500">Poor (Above)</label>
                <div className="flex items-center">
                  <input
                    type="number"
                    step="0.5"
                    className="w-full p-1 text-sm border rounded"
                    value={tempBenchmarks.cpm?.low ?? ''}
                    onChange={(e) => handleBenchmarkChange('cpm', 'low', e.target.value)}
                  />
                  <span className="ml-1">$</span>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500">Good (Below)</label>
                <div className="flex items-center">
                  <input
                    type="number"
                    step="0.5"
                    className="w-full p-1 text-sm border rounded"
                    value={tempBenchmarks.cpm?.medium ?? ''}
                    onChange={(e) => handleBenchmarkChange('cpm', 'medium', e.target.value)}
                  />
                  <span className="ml-1">$</span>
                </div>
              </div>
            </div>
            
            {/* ROAS */}
            <div>
              <div className="font-medium text-sm mb-1">ROAS</div>
              <div className="mb-2">
                <label className="block text-xs text-gray-500">Low (Below)</label>
                <div className="flex items-center">
                  <input
                    type="number"
                    step="0.1"
                    className="w-full p-1 text-sm border rounded"
                    value={tempBenchmarks.roas?.low ?? ''}
                    onChange={(e) => handleBenchmarkChange('roas', 'low', e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500">Good (Above)</label>
                <div className="flex items-center">
                  <input
                    type="number"
                    step="0.1"
                    className="w-full p-1 text-sm border rounded"
                    value={tempBenchmarks.roas?.medium ?? ''}
                    onChange={(e) => handleBenchmarkChange('roas', 'medium', e.target.value)}
                  />
                </div>
              </div>
            </div>
            
            {/* Cost/Purchase */}
            <div>
              <div className="font-medium text-sm mb-1">Cost/Purchase</div>
              <div className="mb-2">
                <label className="block text-xs text-gray-500">Poor (Above)</label>
                <div className="flex items-center">
                  <input
                    type="number"
                    step="0.5"
                    className="w-full p-1 text-sm border rounded"
                    value={tempBenchmarks.costPerPurchase?.low ?? ''}
                    onChange={(e) => handleBenchmarkChange('costPerPurchase', 'low', e.target.value)}
                  />
                  <span className="ml-1">$</span>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500">Good (Below)</label>
                <div className="flex items-center">
                  <input
                    type="number"
                    step="0.5"
                    className="w-full p-1 text-sm border rounded"
                    value={tempBenchmarks.costPerPurchase?.medium ?? ''}
                    onChange={(e) => handleBenchmarkChange('costPerPurchase', 'medium', e.target.value)}
                  />
                  <span className="ml-1">$</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Creative Performance Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-200">
                <th 
                  className={`px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${sortColumn === 'adName' ? 'bg-blue-50' : ''}`}
                  onClick={() => handleSort('adName')}
                  style={{cursor: 'pointer'}}
                >
                  Creative
                  {sortColumn === 'adName' && (
                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th 
                  className={`px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${sortColumn === 'adsetName' ? 'bg-blue-50' : ''}`}
                  onClick={() => handleSort('adsetName')}
                  style={{cursor: 'pointer'}}
                >
                  Ad Sets
                </th>
                <th 
                  className={`px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${sortColumn === 'impressions' ? 'bg-blue-50' : ''}`}
                  onClick={() => handleSort('impressions')}
                  style={{cursor: 'pointer'}}
                >
                  Impressions
                  {sortColumn === 'impressions' && (
                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th 
                  className={`px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${sortColumn === 'clicks' ? 'bg-blue-50' : ''}`}
                  onClick={() => handleSort('clicks')}
                  style={{cursor: 'pointer'}}
                >
                  Clicks
                </th>
                <th 
                  className={`px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${sortColumn === 'ctr' ? 'bg-blue-50' : ''}`}
                  onClick={() => handleSort('ctr')}
                  style={{cursor: 'pointer'}}
                >
                  CTR
                </th>
                <th 
                  className={`px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${sortColumn === 'cpc' ? 'bg-blue-50' : ''}`}
                  onClick={() => handleSort('cpc')}
                  style={{cursor: 'pointer'}}
                >
                  CPC
                </th>
                <th 
                  className={`px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${sortColumn === 'cpm' ? 'bg-blue-50' : ''}`}
                  onClick={() => handleSort('cpm')}
                  style={{cursor: 'pointer'}}
                >
                  CPM
                </th>
                <th 
                  className={`px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${sortColumn === 'purchases' ? 'bg-blue-50' : ''}`}
                  onClick={() => handleSort('purchases')}
                  style={{cursor: 'pointer'}}
                >
                  Purchases
                </th>
                <th 
                  className={`px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${sortColumn === 'costPerPurchase' ? 'bg-blue-50' : ''}`}
                  onClick={() => handleSort('costPerPurchase')}
                  style={{cursor: 'pointer'}}
                >
                  Cost/Purchase
                </th>
                <th 
                  className={`px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${sortColumn === 'spend' ? 'bg-blue-50' : ''}`}
                  onClick={() => handleSort('spend')}
                  style={{cursor: 'pointer'}}
                >
                  Spend
                </th>
                <th 
                  className={`px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${sortColumn === 'roas' ? 'bg-blue-50' : ''}`}
                  onClick={() => handleSort('roas')}
                  style={{cursor: 'pointer'}}
                >
                  ROAS
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredCreatives.map((creative) => (
                <tr 
                  key={creative.creativeId || creative.adId}
                  className={`hover:bg-gray-50 ${selectedCreativeId === creative.creativeId ? 'bg-blue-50' : ''}`}
                  onClick={() => handleCreativeSelect(creative.creativeId)}
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      {creative.thumbnailUrl && (
                        <img 
                          src={creative.thumbnailUrl} 
                          alt={creative.adName}
                          className="w-8 h-8 object-cover rounded mr-2"
                        />
                      )}
                      <div className="text-sm font-medium text-gray-900 truncate max-w-xs" title={creative.adName}>
                        {creative.adName}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    1
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {creative.impressions ? creative.impressions.toLocaleString() : 0}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {creative.clicks ? creative.clicks.toLocaleString() : 0}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs ${getBenchmarkStatusClass('ctr', creative.ctr)}`}>
                      {creative.ctr ? `${creative.ctr.toFixed(2)}%` : '0.00%'}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs ${getBenchmarkStatusClass('cpc', creative.cpc || 0)}`}>
                      ${creative.cpc ? creative.cpc.toFixed(2) : '0.00'}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs ${getBenchmarkStatusClass('cpm', creative.cpm || 0)}`}>
                      ${creative.cpm ? creative.cpm.toFixed(2) : '0.00'}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {creative.purchases || 0}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs ${getBenchmarkStatusClass('costPerPurchase', creative.costPerPurchase || 0)}`}>
                      ${creative.costPerPurchase ? creative.costPerPurchase.toFixed(2) : '0.00'}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    ${creative.spend ? creative.spend.toFixed(2) : '0.00'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs ${getBenchmarkStatusClass('roas', creative.roas || 0)}`}>
                      {creative.roas ? `${creative.roas.toFixed(2)}x` : '0.00x'}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCreativeExpand(creative.creativeId);
                        }}
                        className="p-1 text-blue-600 hover:text-blue-800"
                        title="View details"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyCreativeId(creative.creativeId);
                        }}
                        className="p-1 text-gray-600 hover:text-gray-800"
                        title="Copy creative ID"
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              
              {filteredCreatives.length === 0 && (
                <tr>
                  <td colSpan="12" className="px-4 py-6 text-center text-gray-500">
                    No creatives found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="p-3 bg-gray-50 border-t text-xs text-gray-500 flex items-center space-x-4">
          <div className="flex items-center">
            <span className="inline-block w-3 h-3 rounded-full bg-red-100 border border-red-300 mr-1"></span>
            <span>Low Performance</span>
          </div>
          <div className="flex items-center">
            <span className="inline-block w-3 h-3 rounded-full bg-yellow-100 border border-yellow-300 mr-1"></span>
            <span>Medium Performance</span>
          </div>
          <div className="flex items-center">
            <span className="inline-block w-3 h-3 rounded-full bg-green-100 border border-green-300 mr-1"></span>
            <span>High Performance</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedCreativePerformanceTable;