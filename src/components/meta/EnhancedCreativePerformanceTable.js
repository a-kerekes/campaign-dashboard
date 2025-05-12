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

const EnhancedCreativePerformanceTable = ({ analyticsData, selectedAccountId, benchmarks: propBenchmarks, onCreativeSelect }) => {
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

  // Log benchmarks when they change - for debugging
  useEffect(() => {
    console.log("Current Benchmarks:", benchmarks);
  }, [benchmarks]);

  // Fetch benchmarks with useCallback
  const fetchBenchmarks = useCallback(async () => {
    if (!selectedAccountId || propBenchmarks) return;
    
    try {
      const response = await metaAPI.fetchBenchmarks(selectedAccountId);
      if (response && response.data) {
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
        await metaAPI.saveBenchmarks(selectedAccountId, formattedBenchmarks);
      }
      
      // Update local state
      setBenchmarks(formattedBenchmarks);
      setIsEditingBenchmarks(false);
      setStatusMessage('Benchmarks saved successfully');
      setTimeout(() => setStatusMessage(''), 3000);
      
      // Log saved benchmarks for debugging
      console.log("Saved benchmarks:", formattedBenchmarks);
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

  // Get benchmark status class with better handling
  const getBenchmarkStatusClass = (metric, value) => {
    // Short-circuit if no benchmarks or no value
    if (!benchmarks || !benchmarks[metric]) {
      return '';
    }
    
    // Get benchmark values
    const lowValue = benchmarks[metric].low;
    const mediumValue = benchmarks[metric].medium;
    
    // Skip if benchmark values aren't properly set
    if (lowValue === null || lowValue === undefined || 
        mediumValue === null || mediumValue === undefined) {
      return '';
    }
    
    // Skip if value is invalid
    if (value === null || value === undefined) {
      return '';
    }
    
    // Get numeric values
    const numericValue = parseFloat(value);
    const numericLow = parseFloat(lowValue);
    const numericMedium = parseFloat(mediumValue);
    
    // Determine if higher is better for this metric
    const higherIsBetter = ['ctr', 'roas'].includes(metric);
    
    // Apply the appropriate color class
    if (higherIsBetter) {
      // For metrics where higher is better (CTR, ROAS)
      if (numericValue < numericLow) {
        return 'text-red-600';
      } else if (numericValue < numericMedium) {
        return 'text-yellow-600';
      } else {
        return 'text-green-600';
      }
    } else {
      // For metrics where lower is better (CPC, CPM, Cost/Purchase)
      if (numericValue > numericLow) {
        return 'text-red-600';
      } else if (numericValue > numericMedium) {
        return 'text-yellow-600';
      } else {
        return 'text-green-600';
      }
    }
  };
  
  // Use inline styles for more reliable coloring
  const getColorStyle = (metric, value) => {
    const colorClass = getBenchmarkStatusClass(metric, value);
    
    if (!colorClass) return {};
    
    // Map color classes to inline styles
    if (colorClass.includes('text-red-600')) {
      return { color: '#dc2626' };
    } else if (colorClass.includes('text-yellow-600')) {
      return { color: '#d97706' };
    } else if (colorClass.includes('text-green-600')) {
      return { color: '#059669' };
    }
    
    return {};
  };

  // Column widths for proper alignment
  const columnWidths = {
    creative: '30%',
    adSets: '70px',
    impressions: '100px',
    clicks: '70px',
    ctr: '90px',
    cpc: '70px',
    cpm: '80px',
    purchases: '90px',
    costPerPurchase: '110px',
    spend: '90px',
    roas: '90px'
  };

  return (
    <div>
      {/* Header Section */}
      <div className="mb-3">
        <h3 className="text-base font-semibold mb-2">Creative Performance</h3>
        
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center">
            <span className="text-xs text-gray-500 mr-2">{filteredCreatives.length} creatives</span>
            <button
              onClick={() => setIsEditingBenchmarks(!isEditingBenchmarks)}
              className="text-xs text-blue-600 hover:text-blue-800 underline mr-4"
            >
              {isEditingBenchmarks ? 'Close' : 'Set Performance Benchmarks'}
            </button>
          </div>
          
          <div className="flex items-center">
            <input
              type="text"
              placeholder="Search creatives..."
              className="px-2 py-1 border rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 mr-2"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            
            <button
              onClick={exportToCSV}
              className="p-1 bg-gray-100 rounded hover:bg-gray-200 text-gray-700"
              title="Export to CSV"
            >
              <Download size={14} />
            </button>
          </div>
        </div>
        
        {statusMessage && (
          <div className="p-1 bg-blue-50 text-blue-600 text-xs text-center mb-2">
            {statusMessage}
          </div>
        )}
      </div>
      
      {/* Benchmark Settings */}
      {isEditingBenchmarks && (
        <div className="mb-3 p-2 bg-gray-50 border rounded-md">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-medium text-xs text-gray-800">Set Performance Benchmarks</h4>
            <button 
              onClick={saveBenchmarks} 
              className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
            >
              Save Benchmarks
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
            {/* CTR */}
            <div>
              <div className="font-medium text-xs mb-1">CTR</div>
              <div className="mb-1">
                <label className="block text-xs text-gray-500">Low (Below)</label>
                <div className="flex items-center">
                  <input
                    type="number"
                    step="0.1"
                    className="w-full p-1 text-xs border rounded"
                    value={tempBenchmarks.ctr?.low ?? ''}
                    onChange={(e) => handleBenchmarkChange('ctr', 'low', e.target.value)}
                  />
                  <span className="ml-1 text-xs">%</span>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500">Good (Above)</label>
                <div className="flex items-center">
                  <input
                    type="number"
                    step="0.1"
                    className="w-full p-1 text-xs border rounded"
                    value={tempBenchmarks.ctr?.medium ?? ''}
                    onChange={(e) => handleBenchmarkChange('ctr', 'medium', e.target.value)}
                  />
                  <span className="ml-1 text-xs">%</span>
                </div>
              </div>
            </div>
            
            {/* CPC */}
            <div>
              <div className="font-medium text-xs mb-1">CPC</div>
              <div className="mb-1">
                <label className="block text-xs text-gray-500">Poor (Above)</label>
                <div className="flex items-center">
                  <input
                    type="number"
                    step="0.1"
                    className="w-full p-1 text-xs border rounded"
                    value={tempBenchmarks.cpc?.low ?? ''}
                    onChange={(e) => handleBenchmarkChange('cpc', 'low', e.target.value)}
                  />
                  <span className="ml-1 text-xs">$</span>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500">Good (Below)</label>
                <div className="flex items-center">
                  <input
                    type="number"
                    step="0.1"
                    className="w-full p-1 text-xs border rounded"
                    value={tempBenchmarks.cpc?.medium ?? ''}
                    onChange={(e) => handleBenchmarkChange('cpc', 'medium', e.target.value)}
                  />
                  <span className="ml-1 text-xs">$</span>
                </div>
              </div>
            </div>
            
            {/* CPM */}
            <div>
              <div className="font-medium text-xs mb-1">CPM</div>
              <div className="mb-1">
                <label className="block text-xs text-gray-500">Poor (Above)</label>
                <div className="flex items-center">
                  <input
                    type="number"
                    step="0.5"
                    className="w-full p-1 text-xs border rounded"
                    value={tempBenchmarks.cpm?.low ?? ''}
                    onChange={(e) => handleBenchmarkChange('cpm', 'low', e.target.value)}
                  />
                  <span className="ml-1 text-xs">$</span>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500">Good (Below)</label>
                <div className="flex items-center">
                  <input
                    type="number"
                    step="0.5"
                    className="w-full p-1 text-xs border rounded"
                    value={tempBenchmarks.cpm?.medium ?? ''}
                    onChange={(e) => handleBenchmarkChange('cpm', 'medium', e.target.value)}
                  />
                  <span className="ml-1 text-xs">$</span>
                </div>
              </div>
            </div>
            
            {/* ROAS */}
            <div>
              <div className="font-medium text-xs mb-1">ROAS</div>
              <div className="mb-1">
                <label className="block text-xs text-gray-500">Low (Below)</label>
                <div className="flex items-center">
                  <input
                    type="number"
                    step="0.1"
                    className="w-full p-1 text-xs border rounded"
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
                    className="w-full p-1 text-xs border rounded"
                    value={tempBenchmarks.roas?.medium ?? ''}
                    onChange={(e) => handleBenchmarkChange('roas', 'medium', e.target.value)}
                  />
                </div>
              </div>
            </div>
            
            {/* Cost/Purchase */}
            <div>
              <div className="font-medium text-xs mb-1">Cost/Purchase</div>
              <div className="mb-1">
                <label className="block text-xs text-gray-500">Poor (Above)</label>
                <div className="flex items-center">
                  <input
                    type="number"
                    step="0.5"
                    className="w-full p-1 text-xs border rounded"
                    value={tempBenchmarks.costPerPurchase?.low ?? ''}
                    onChange={(e) => handleBenchmarkChange('costPerPurchase', 'low', e.target.value)}
                  />
                  <span className="ml-1 text-xs">$</span>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500">Good (Below)</label>
                <div className="flex items-center">
                  <input
                    type="number"
                    step="0.5"
                    className="w-full p-1 text-xs border rounded"
                    value={tempBenchmarks.costPerPurchase?.medium ?? ''}
                    onChange={(e) => handleBenchmarkChange('costPerPurchase', 'medium', e.target.value)}
                  />
                  <span className="ml-1 text-xs">$</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Creative Performance Table - Fixed column widths and better alignment */}
      <div className="bg-white overflow-hidden border">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse table-fixed">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th 
                  className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r px-2 py-2"
                  style={{width: columnWidths.creative}}
                >
                  <span style={{fontSize: '11px'}}>Creative</span>
                </th>
                <th 
                  className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r px-2 py-2"
                  style={{width: columnWidths.adSets}}
                >
                  <span style={{fontSize: '11px'}}>Ad Sets</span>
                </th>
                <th 
                  className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r px-2 py-2"
                  onClick={() => handleSort('impressions')}
                  style={{width: columnWidths.impressions, cursor: 'pointer'}}
                >
                  <span style={{fontSize: '11px'}}>
                    Impressions {sortColumn === 'impressions' && (
                      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </span>
                </th>
                <th 
                  className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r px-2 py-2"
                  style={{width: columnWidths.clicks}}
                >
                  <span style={{fontSize: '11px'}}>Clicks</span>
                </th>
                <th 
                  className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r px-2 py-2"
                  style={{width: columnWidths.ctr}}
                >
                  <span style={{fontSize: '11px'}}>CTR</span>
                </th>
                <th 
                  className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r px-2 py-2"
                  style={{width: columnWidths.cpc}}
                >
                  <span style={{fontSize: '11px'}}>CPC</span>
                </th>
                <th 
                  className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r px-2 py-2"
                  style={{width: columnWidths.cpm}}
                >
                  <span style={{fontSize: '11px'}}>CPM</span>
                </th>
                <th 
                  className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r px-2 py-2"
                  style={{width: columnWidths.purchases}}
                >
                  <span style={{fontSize: '11px'}}>Purchases</span>
                </th>
                <th 
                  className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r px-2 py-2"
                  style={{width: columnWidths.costPerPurchase}}
                >
                  <span style={{fontSize: '11px'}}>Cost/Purchase</span>
                </th>
                <th 
                  className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r px-2 py-2"
                  style={{width: columnWidths.spend}}
                >
                  <span style={{fontSize: '11px'}}>Spend</span>
                </th>
                <th 
                  className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider px-2 py-2"
                  style={{width: columnWidths.roas}}
                >
                  <span style={{fontSize: '11px'}}>ROAS</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredCreatives.map((creative, index) => (
                <tr 
                  key={creative.creativeId || creative.adId || Math.random().toString(36)}
                  className={`hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} ${selectedCreativeId === creative.creativeId ? 'bg-blue-50 hover:bg-blue-50' : ''}`}
                  onClick={() => handleCreativeSelect(creative.creativeId)}
                  style={{cursor: 'pointer'}}
                >
                  <td className="border-r px-2 py-2">
                    <div className="flex items-center">
                      {creative.thumbnailUrl && (
                        <img 
                          src={creative.thumbnailUrl} 
                          alt={creative.adName}
                          className="h-8 w-8 object-cover rounded mr-2"
                        />
                      )}
                      <span className="text-xs text-gray-900 truncate" title={creative.adName} style={{fontSize: '11px'}}>
                        {creative.adName}
                      </span>
                    </div>
                  </td>
                  <td className="text-center border-r px-2 py-2">
                    <span className="text-xs text-gray-500" style={{fontSize: '11px'}}>
                      {creative.adsetCount || 1}
                    </span>
                  </td>
                  <td className="text-center border-r px-2 py-2">
                    <span className="text-xs text-gray-500" style={{fontSize: '11px'}}>
                      {creative.impressions ? creative.impressions.toLocaleString() : 0}
                    </span>
                  </td>
                  <td className="text-center border-r px-2 py-2">
                    <span className="text-xs text-gray-500" style={{fontSize: '11px'}}>
                      {creative.clicks ? creative.clicks.toLocaleString() : 0}
                    </span>
                  </td>
                  <td className="text-center border-r px-2 py-2">
                    <span className="text-xs font-medium" style={{...getColorStyle('ctr', creative.ctr), fontSize: '11px'}}>
                      {creative.ctr ? `${creative.ctr.toFixed(2)}%` : '0.00%'}
                    </span>
                  </td>
                  <td className="text-center border-r px-2 py-2">
                    <span className="text-xs" style={{...getColorStyle('cpc', creative.cpc), fontSize: '11px'}}>
                      ${creative.cpc ? creative.cpc.toFixed(2) : '0.00'}
                    </span>
                  </td>
                  <td className="text-center border-r px-2 py-2">
                    <span className="text-xs" style={{...getColorStyle('cpm', creative.cpm), fontSize: '11px'}}>
                      ${creative.cpm ? creative.cpm.toFixed(2) : '0.00'}
                    </span>
                  </td>
                  <td className="text-center border-r px-2 py-2">
                    <span className="text-xs text-gray-500" style={{fontSize: '11px'}}>
                      {creative.purchases || 0}
                    </span>
                  </td>
                  <td className="text-center border-r px-2 py-2">
                    <span className="text-xs" style={{...getColorStyle('costPerPurchase', creative.costPerPurchase), fontSize: '11px'}}>
                      ${creative.costPerPurchase ? creative.costPerPurchase.toFixed(2) : '0.00'}
                    </span>
                  </td>
                  <td className="text-center border-r px-2 py-2">
                    <span className="text-xs text-gray-500" style={{fontSize: '11px'}}>
                      ${creative.spend ? creative.spend.toFixed(2) : '0.00'}
                    </span>
                  </td>
                  <td className="text-center px-2 py-2">
                    <span className="text-xs font-medium" style={{...getColorStyle('roas', creative.roas), fontSize: '11px'}}>
                      {creative.roas ? `${creative.roas.toFixed(2)}x` : '0.00x'}
                    </span>
                  </td>
                </tr>
              ))}
              
              {filteredCreatives.length === 0 && (
                <tr>
                  <td colSpan="11" className="px-2 py-3 text-center text-xs text-gray-500">
                    No creatives found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EnhancedCreativePerformanceTable;