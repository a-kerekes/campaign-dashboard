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

  // Data cleaning and validation functions
  const cleanNumericValue = (value, defaultValue = 0) => {
    if (value === null || value === undefined || value === '') {
      return defaultValue;
    }
    
    // Convert to string and handle potential formatting issues
    const stringValue = String(value);
    
    // Remove leading zeros that might cause parsing issues
    const cleanedString = stringValue.replace(/^0+(?=\d)/, '');
    
    // Parse the number
    const numericValue = parseFloat(cleanedString);
    
    // Return default if parsing failed or result is invalid
    return isNaN(numericValue) || !isFinite(numericValue) ? defaultValue : numericValue;
  };

  const cleanIntegerValue = (value, defaultValue = 0) => {
    if (value === null || value === undefined || value === '') {
      return defaultValue;
    }
    
    // Convert to string and handle potential formatting issues
    const stringValue = String(value);
    
    // Remove leading zeros that might cause parsing issues
    const cleanedString = stringValue.replace(/^0+(?=\d)/, '');
    
    // Parse the integer
    const integerValue = parseInt(cleanedString, 10);
    
    // Return default if parsing failed or result is invalid
    return isNaN(integerValue) || !isFinite(integerValue) ? defaultValue : integerValue;
  };

  // Function to normalize ad names for better grouping
  const normalizeAdName = (adName) => {
    if (!adName) return 'unknown';
    
    return adName
      .toLowerCase()                    // Convert to lowercase
      .trim()                          // Remove leading/trailing whitespace
      .replace(/\s+/g, ' ')           // Replace multiple spaces with single space
      .replace(/[^\w\s-|]/g, '')      // Remove special characters except word chars, spaces, hyphens, pipes
      .trim();                        // Trim again after cleanup
  };

  // Function to aggregate creatives by name only with data validation
  const aggregateCreativesByPostId = useCallback((creativePerformanceData) => {
    if (!creativePerformanceData || !Array.isArray(creativePerformanceData)) {
      return [];
    }

    console.log('🔧 AGGREGATION: Starting creative aggregation', creativePerformanceData.length, 'total ads');

    // Group creatives by normalized name
    const groupedCreatives = {};

    creativePerformanceData.forEach((creative, index) => {
      // Create a unique identifier for grouping by normalized name
      const originalName = creative.adName || 'unknown';
      const normalizedName = normalizeAdName(originalName);
      const groupKey = normalizedName;

      console.log(`🔍 PROCESSING AD ${index + 1}:`, {
        originalName,
        normalizedName,
        groupKey,
        creativeId: creative.creativeId,
        adId: creative.adId
      });

      if (!groupedCreatives[groupKey]) {
        // Initialize the group with the first creative's data
        groupedCreatives[groupKey] = {
          // Keep original creative data for reference (use first occurrence)
          ...creative,
          // Use original name for display (not normalized)
          adName: originalName,
          // Initialize counters
          adsetCount: 0,
          adIds: [],
          originalNames: [], // Track all original names for debugging
          // Initialize metrics for aggregation
          totalImpressions: 0,
          totalClicks: 0,
          totalSpend: 0,
          totalPurchases: 0,
          totalRevenue: 0,
          // We'll calculate rates after aggregation
        };
      }

      const group = groupedCreatives[groupKey];
      
      // Add to counters
      group.adsetCount += 1;
      group.adIds.push(creative.adId);
      group.originalNames.push(originalName); // Track all variations
      
      // Clean and validate data before aggregating
      const cleanImpressions = cleanIntegerValue(creative.impressions);
      const cleanClicks = cleanIntegerValue(creative.clicks);
      const cleanSpend = cleanNumericValue(creative.spend);
      const cleanPurchases = cleanIntegerValue(creative.purchases);
      const cleanRevenue = cleanNumericValue(creative.revenue);

      console.log(`🔍 CLEANING DATA for ${originalName}:`, {
        originalPurchases: creative.purchases,
        cleanedPurchases: cleanPurchases,
        originalRevenue: creative.revenue,
        cleanedRevenue: cleanRevenue,
        originalSpend: creative.spend,
        cleanedSpend: cleanSpend
      });
      
      // Aggregate additive metrics with cleaned data
      group.totalImpressions += cleanImpressions;
      group.totalClicks += cleanClicks;
      group.totalSpend += cleanSpend;
      group.totalPurchases += cleanPurchases;
      group.totalRevenue += cleanRevenue;
    });

    // Convert grouped data back to array and calculate derived metrics
    const aggregatedCreatives = Object.values(groupedCreatives).map((group) => {
      // Calculate weighted averages and derived metrics
      const impressions = group.totalImpressions;
      const clicks = group.totalClicks;
      const spend = group.totalSpend;
      const purchases = group.totalPurchases;
      const revenue = group.totalRevenue;

      // Calculate rates based on totals with safeguards
      const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
      const cpc = clicks > 0 ? spend / clicks : 0;
      const cpm = impressions > 0 ? (spend / impressions) * 1000 : 0;
      const costPerPurchase = purchases > 0 ? spend / purchases : 0;
      
      // ROAS calculation with extra validation to prevent astronomical values
      let roas = 0;
      if (spend > 0 && revenue > 0) {
        roas = revenue / spend;
        
        // Cap ROAS at reasonable maximum (e.g., 50x) to prevent display issues
        if (roas > 50) {
          console.warn(`🚨 ROAS WARNING: Calculated ROAS of ${roas.toFixed(2)}x seems too high for ${group.adName}. Revenue: ${revenue}, Spend: ${spend}`);
          // You can choose to either cap it or set to 0 for investigation
          // roas = 50; // Cap at 50x
          // OR
          roas = 0; // Set to 0 for manual investigation
        }
      }

      console.log(`📊 AGGREGATED METRICS for ${group.adName}:`, {
        adsetCount: group.adsetCount,
        impressions,
        clicks,
        spend: spend.toFixed(2),
        purchases,
        revenue: revenue.toFixed(2),
        ctr: ctr.toFixed(2),
        cpc: cpc.toFixed(2),
        cpm: cpm.toFixed(2),
        roas: roas.toFixed(2),
        originalNamesCount: group.originalNames.length,
        uniqueOriginalNames: [...new Set(group.originalNames)]
      });

      return {
        // Keep original properties
        adId: group.adIds[0], // Use first ad ID as representative
        adName: group.adName, // Use first original name for display
        adsetName: group.adsetName,
        creativeId: group.creativeId,
        thumbnailUrl: group.thumbnailUrl,
        objectStorySpec: group.objectStorySpec,
        accountId: group.accountId,
        
        // Aggregated data
        adsetCount: group.adsetCount,
        adIds: group.adIds,
        originalNames: group.originalNames, // For debugging
        
        // Aggregated metrics
        impressions: impressions,
        clicks: clicks,
        spend: spend,
        purchases: purchases,
        revenue: revenue,
        
        // Calculated rates
        ctr: ctr,
        cpc: cpc,
        cpm: cpm,
        costPerPurchase: costPerPurchase,
        roas: roas,
        conversionRate: clicks > 0 && purchases > 0 ? (purchases / clicks) * 100 : 0,
      };
    });

    console.log('🔧 AGGREGATION: Completed aggregation', 
      creativePerformanceData.length, 'ads →', 
      aggregatedCreatives.length, 'unique creatives');

    return aggregatedCreatives;
  }, []); // Empty dependency array since this function doesn't depend on any external values

  // Initialize creatives from props with aggregation and detailed data inspection
  useEffect(() => {
    if (analyticsData && analyticsData.creativePerformance) {
      console.log('📊 PROCESSING: Raw creative performance data', analyticsData.creativePerformance.length, 'items');
      
      // DETAILED DATA INSPECTION - Let's see exactly what we're getting
      console.log('🔍 RAW DATA INSPECTION:');
      console.log('Total ads received:', analyticsData.creativePerformance.length);
      
      // Look for "Pockets High Rise" specifically
      const pocketsAds = analyticsData.creativePerformance.filter(ad => 
        ad.adName && ad.adName.includes('Pockets High Rise')
      );
      console.log(`🔍 "Pockets High Rise" ads found: ${pocketsAds.length}`);
      
      if (pocketsAds.length > 0) {
        console.log('🔍 POCKETS HIGH RISE ADS DETAILS:');
        pocketsAds.forEach((ad, index) => {
          console.log(`Ad ${index + 1}:`, {
            adName: ad.adName,
            adId: ad.adId,
            creativeId: ad.creativeId,
            spend: ad.spend,
            impressions: ad.impressions,
            clicks: ad.clicks,
            purchases: ad.purchases,
            accountId: ad.accountId
          });
        });
        
        // Check if names are actually identical
        const uniqueNames = [...new Set(pocketsAds.map(ad => ad.adName))];
        console.log(`🔍 Unique "Pockets High Rise" names: ${uniqueNames.length}`);
        uniqueNames.forEach((name, index) => {
          console.log(`Unique name ${index + 1}: "${name}"`);
          console.log(`Character codes:`, name.split('').map(char => char.charCodeAt(0)));
        });
      } else {
        console.log('❌ NO "Pockets High Rise" ads found in dashboard data!');
        console.log('🔍 All ad names received:');
        analyticsData.creativePerformance.forEach((ad, index) => {
          if (index < 10) { // Show first 10 for debugging
            console.log(`Ad ${index + 1}: "${ad.adName}"`);
          }
        });
      }
      
      // Check date range and account info
      console.log('🔍 ACCOUNT & DATE INFO:');
      console.log('Selected Account ID:', selectedAccountId);
      console.log('Date Range:', dateRange);
      
      // Aggregate the creatives by name
      const aggregatedCreatives = aggregateCreativesByPostId(analyticsData.creativePerformance);
      
      console.log('📊 PROCESSING: Setting aggregated creatives', aggregatedCreatives.length, 'unique creatives');
      
      setCreatives(aggregatedCreatives);
      setFilteredCreatives(aggregatedCreatives);
    }
  }, [analyticsData, aggregateCreativesByPostId, selectedAccountId, dateRange]);
  
  // Initialize benchmarks with localStorage support
  useEffect(() => {
    if (selectedAccountId) {
      // Try to load benchmarks from localStorage first
      const storageKey = `benchmarks_${selectedAccountId}`;
      try {
        const savedBenchmarks = localStorage.getItem(storageKey);
        if (savedBenchmarks) {
          const parsedBenchmarks = JSON.parse(savedBenchmarks);
          setBenchmarks(parsedBenchmarks);
          setTempBenchmarks(parsedBenchmarks);
          console.log(`Loaded benchmarks from localStorage for account ${selectedAccountId}`);
          return;
        }
      } catch (error) {
        console.error('Error loading benchmarks from localStorage:', error);
      }
    }
    
    // If no localStorage data or no account ID, use prop benchmarks
    if (propBenchmarks) {
      setBenchmarks(propBenchmarks);
      setTempBenchmarks(propBenchmarks);
      
      // Save to localStorage for future use if account ID exists
      if (selectedAccountId) {
        try {
          localStorage.setItem(`benchmarks_${selectedAccountId}`, JSON.stringify(propBenchmarks));
        } catch (error) {
          console.error('Error saving benchmarks to localStorage:', error);
        }
      }
    } else {
      // Initialize default benchmarks if neither localStorage nor props have data
      const defaultBenchmarks = {};
      metricsConfig.forEach(metric => {
        defaultBenchmarks[metric.id] = {
          low: metric.defaultLow,
          medium: metric.defaultMedium
        };
      });
      setBenchmarks(defaultBenchmarks);
      setTempBenchmarks(defaultBenchmarks);
      
      // Save defaults to localStorage if account ID exists
      if (selectedAccountId) {
        try {
          localStorage.setItem(`benchmarks_${selectedAccountId}`, JSON.stringify(defaultBenchmarks));
        } catch (error) {
          console.error('Error saving default benchmarks to localStorage:', error);
        }
      }
    }
  }, [propBenchmarks, selectedAccountId]);

  // Log benchmarks when they change - for debugging
  useEffect(() => {
    console.log("Current Benchmarks:", benchmarks);
  }, [benchmarks]);

  // Reset selected creative when account changes
  useEffect(() => {
    setSelectedCreativeId(null);
  }, [selectedAccountId]);

  // Fetch benchmarks with useCallback
  const fetchBenchmarks = useCallback(async () => {
    if (!selectedAccountId) return;
    
    // Check localStorage first
    const storageKey = `benchmarks_${selectedAccountId}`;
    try {
      const savedBenchmarks = localStorage.getItem(storageKey);
      if (savedBenchmarks) {
        const parsedBenchmarks = JSON.parse(savedBenchmarks);
        setBenchmarks(parsedBenchmarks);
        setTempBenchmarks(parsedBenchmarks);
        return;
      }
    } catch (error) {
      console.error('Error checking localStorage:', error);
    }
    
    // If not in localStorage and not provided as props, fetch from API
    if (!propBenchmarks) {
      try {
        const response = await metaAPI.fetchBenchmarks(selectedAccountId);
        if (response && response.data) {
          setBenchmarks(response.data);
          setTempBenchmarks(response.data);
          
          // Save to localStorage
          try {
            localStorage.setItem(storageKey, JSON.stringify(response.data));
          } catch (storageError) {
            console.error('Error saving API benchmarks to localStorage:', storageError);
          }
        }
      } catch (error) {
        console.error('Error fetching benchmarks:', error);
      }
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
        try {
          await metaAPI.saveBenchmarks(selectedAccountId, formattedBenchmarks);
        } catch (apiError) {
          console.warn('API save failed, but will still save locally:', apiError);
        }
        
        // Always save to localStorage
        try {
          localStorage.setItem(`benchmarks_${selectedAccountId}`, JSON.stringify(formattedBenchmarks));
        } catch (storageError) {
          console.error('Error saving benchmarks to localStorage:', storageError);
        }
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
        'Ad Sets',
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
        creative.adsetCount || 1,
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
      link.setAttribute('download', `creative_performance_aggregated_${selectedAccountId || 'all'}_${new Date().toISOString().split('T')[0]}.csv`);
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

  // Format ROAS display with warning for suspicious values
  const formatROAS = (roas) => {
    if (!roas || roas === 0) return '0.00x';
    if (roas > 10) {
      return `${roas.toFixed(2)}x ⚠️`; // Add warning icon for high ROAS
    }
    return `${roas.toFixed(2)}x`;
  };

  return (
    <div>
      {/* Header Section */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Creative Performance (Aggregated by Name)</h3>
        
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center">
            <span className="text-sm text-gray-500 mr-2">{filteredCreatives.length} unique creatives</span>
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
      
      {/* Creative Performance Table - Aggregated by Name with Data Validation */}
      <div className="bg-white rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  style={{width: '30%'}}
                >
                  Creative
                </th>
                <th 
                  className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                  onClick={() => handleSort('adsetCount')}
                  style={{cursor: 'pointer'}}
                >
                  Ad Sets {sortColumn === 'adsetCount' && (
                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th 
                  className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                  onClick={() => handleSort('impressions')}
                  style={{cursor: 'pointer'}}
                >
                  Impressions {sortColumn === 'impressions' && (
                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th 
                  className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                  onClick={() => handleSort('clicks')}
                  style={{cursor: 'pointer'}}
                >
                  Clicks {sortColumn === 'clicks' && (
                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th 
                  className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                  onClick={() => handleSort('ctr')}
                  style={{cursor: 'pointer'}}
                >
                  CTR {sortColumn === 'ctr' && (
                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th 
                  className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                  onClick={() => handleSort('cpc')}
                  style={{cursor: 'pointer'}}
                >
                  CPC {sortColumn === 'cpc' && (
                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th 
                  className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                  onClick={() => handleSort('cpm')}
                  style={{cursor: 'pointer'}}
                >
                  CPM {sortColumn === 'cpm' && (
                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th 
                  className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                  onClick={() => handleSort('purchases')}
                  style={{cursor: 'pointer'}}
                >
                  Purchases {sortColumn === 'purchases' && (
                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th 
                  className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                  onClick={() => handleSort('costPerPurchase')}
                  style={{cursor: 'pointer'}}
                >
                  Cost/Purchase {sortColumn === 'costPerPurchase' && (
                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th 
                  className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                  onClick={() => handleSort('spend')}
                  style={{cursor: 'pointer'}}
                >
                  Spend {sortColumn === 'spend' && (
                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th 
                  className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                  onClick={() => handleSort('roas')}
                  style={{cursor: 'pointer'}}
                >
                  ROAS {sortColumn === 'roas' && (
                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredCreatives.map((creative) => (
                <tr 
                  key={creative.creativeId || creative.adId || Math.random().toString(36)}
                  className={`border-b hover:bg-gray-50 ${selectedCreativeId === creative.creativeId ? 'bg-blue-50' : ''}`}
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
                      <div className="text-sm text-gray-900" title={creative.adName}>
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
                    {formatROAS(creative.roas)}
                  </td>
                </tr>
              ))}
              
              {filteredCreatives.length === 0 && (
                <tr>
                  <td colSpan="11" className="px-4 py-6 text-center text-gray-500">
                    No creatives found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Data Quality Notice */}
      <div className="mt-4 text-xs text-gray-500">
        <p>⚠️ ROAS values above 10x are flagged for review. Industry benchmarks: 1.8x - 3.0x typical.</p>
      </div>
    </div>
  );
};

export default EnhancedCreativePerformanceTable;