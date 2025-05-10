// src/components/meta/EnhancedCreativePerformanceTable.js
import React, { useState, useEffect, useCallback } from 'react';
import { Download, Copy, Eye } from 'lucide-react'; // Removed unused Mail icon
import metaAPI from './metaAPI';

const EnhancedCreativePerformanceTable = ({ analyticsData, selectedAccountId, benchmarks: propBenchmarks, onCreativeSelect }) => {
  const [creatives, setCreatives] = useState([]);
  const [sortColumn, setSortColumn] = useState('impressions');
  const [sortDirection, setSortDirection] = useState('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCreatives, setFilteredCreatives] = useState([]);
  const [selectedCreativeId, setSelectedCreativeId] = useState(null);
  const [expandedCreativeId, setExpandedCreativeId] = useState(null);
  const [benchmarks, setBenchmarks] = useState(propBenchmarks || {});
  const [statusMessage, setStatusMessage] = useState('');

  // Initialize creatives from props
  useEffect(() => {
    if (analyticsData && analyticsData.creativePerformance) {
      setCreatives(analyticsData.creativePerformance);
      setFilteredCreatives(analyticsData.creativePerformance);
    }
  }, [analyticsData]);
  
  // Fetch benchmarks with useCallback to avoid dependency issues
  const fetchBenchmarks = useCallback(async () => {
    if (!selectedAccountId) return;
    
    try {
      // Only fetch benchmarks if they weren't provided via props
      if (!propBenchmarks) {
        const response = await metaAPI.fetchBenchmarks(selectedAccountId);
        if (response.data) {
          setBenchmarks(response.data);
        }
      }
    } catch (error) {
      console.error('Error fetching benchmarks:', error);
    }
  }, [selectedAccountId, propBenchmarks]);

  // Update benchmarks when account changes or prop benchmarks change
  useEffect(() => {
    if (propBenchmarks) {
      setBenchmarks(propBenchmarks);
    } else {
      fetchBenchmarks();
    }
  }, [propBenchmarks, fetchBenchmarks]);

  // Handle sort
  const handleSort = (column) => {
    if (sortColumn === column) {
      // Toggle sort direction if clicking the same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new sort column with default direction (desc for most metrics)
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

  // Get benchmark status class
  const getBenchmarkStatusClass = (metric, value) => {
    if (!benchmarks || !benchmarks[metric]) return '';
    
    const { low, medium } = benchmarks[metric];
    
    // Adjust for percentage values
    let adjustedValue = value;
    if (metric === 'ctr') {
      adjustedValue = value / 100; // Convert from percentage to decimal
    }
    
    // Determine color based on metric type
    const isHigherBetter = ['ctr', 'roas'].includes(metric);
    
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
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="flex justify-between items-center p-4 border-b">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold text-gray-800">
            Creative Performance
          </h3>
          <span className="text-sm text-gray-500">
            {filteredCreatives.length} creatives
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <input
            type="text"
            placeholder="Search creatives..."
            className="px-3 py-2 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          
          <button
            onClick={exportToCSV}
            className="p-2 bg-gray-100 rounded hover:bg-gray-200 text-gray-700"
            title="Export to CSV"
          >
            <Download size={16} />
          </button>
        </div>
      </div>
      
      {statusMessage && (
        <div className="p-2 bg-blue-50 text-blue-600 text-sm text-center">
          {statusMessage}
        </div>
      )}
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              <th 
                className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 ${sortColumn === 'adName' ? 'bg-blue-50' : ''}`}
                onClick={() => handleSort('adName')}
              >
                Creative
                {sortColumn === 'adName' && (
                  <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th 
                className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 ${sortColumn === 'impressions' ? 'bg-blue-50' : ''}`}
                onClick={() => handleSort('impressions')}
              >
                Impressions
                {sortColumn === 'impressions' && (
                  <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th 
                className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 ${sortColumn === 'clicks' ? 'bg-blue-50' : ''}`}
                onClick={() => handleSort('clicks')}
              >
                Clicks
                {sortColumn === 'clicks' && (
                  <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th 
                className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 ${sortColumn === 'ctr' ? 'bg-blue-50' : ''}`}
                onClick={() => handleSort('ctr')}
              >
                CTR
                {sortColumn === 'ctr' && (
                  <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th 
                className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 ${sortColumn === 'spend' ? 'bg-blue-50' : ''}`}
                onClick={() => handleSort('spend')}
              >
                Spend
                {sortColumn === 'spend' && (
                  <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th 
                className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 ${sortColumn === 'cpc' ? 'bg-blue-50' : ''}`}
                onClick={() => handleSort('cpc')}
              >
                CPC
                {sortColumn === 'cpc' && (
                  <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th 
                className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 ${sortColumn === 'purchases' ? 'bg-blue-50' : ''}`}
                onClick={() => handleSort('purchases')}
              >
                Purchases
                {sortColumn === 'purchases' && (
                  <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th 
                className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 ${sortColumn === 'roas' ? 'bg-blue-50' : ''}`}
                onClick={() => handleSort('roas')}
              >
                ROAS
                {sortColumn === 'roas' && (
                  <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredCreatives.map((creative) => (
              <React.Fragment key={creative.creativeId || creative.adId}>
                <tr 
                  className={`hover:bg-gray-50 ${selectedCreativeId === creative.creativeId ? 'bg-blue-50' : ''}`}
                  onClick={() => handleCreativeSelect(creative.creativeId)}
                >
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    <div className="flex items-center space-x-2">
                      {creative.thumbnailUrl && (
                        <img 
                          src={creative.thumbnailUrl} 
                          alt={creative.adName}
                          className="w-10 h-10 object-cover rounded"
                        />
                      )}
                      <div className="flex-1 truncate max-w-xs" title={creative.adName}>
                        {creative.adName}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    {creative.impressions ? creative.impressions.toLocaleString() : 0}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    {creative.clicks ? creative.clicks.toLocaleString() : 0}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs ${getBenchmarkStatusClass('ctr', creative.ctr)}`}>
                      {creative.ctr ? `${creative.ctr.toFixed(2)}%` : '0.00%'}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${creative.spend ? creative.spend.toFixed(2) : '0.00'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs ${getBenchmarkStatusClass('cpc', creative.cpc || 0)}`}>
                      ${creative.cpc ? creative.cpc.toFixed(2) : '0.00'}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    {creative.purchases || 0}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs ${getBenchmarkStatusClass('roas', creative.roas || 0)}`}>
                      {creative.roas ? `${creative.roas.toFixed(2)}x` : '0.00x'}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center space-x-2">
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
                
                {expandedCreativeId === creative.creativeId && (
                  <tr className="bg-gray-50">
                    <td colSpan="9" className="px-4 py-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Creative Details</h4>
                          <p><span className="font-medium">ID:</span> {creative.creativeId}</p>
                          <p><span className="font-medium">Ad ID:</span> {creative.adId}</p>
                          <p><span className="font-medium">Ad Set:</span> {creative.adsetName || 'Unknown'}</p>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Performance Metrics</h4>
                          <p><span className="font-medium">CPM:</span> ${creative.cpm ? creative.cpm.toFixed(2) : '0.00'}</p>
                          <p><span className="font-medium">Cost per Purchase:</span> ${creative.costPerPurchase ? creative.costPerPurchase.toFixed(2) : '0.00'}</p>
                          <p><span className="font-medium">Conversion Rate:</span> {creative.conversionRate ? `${creative.conversionRate.toFixed(2)}%` : '0.00%'}</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
            
            {filteredCreatives.length === 0 && (
              <tr>
                <td colSpan="9" className="px-4 py-8 text-center text-gray-500">
                  No creatives found matching your criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EnhancedCreativePerformanceTable;