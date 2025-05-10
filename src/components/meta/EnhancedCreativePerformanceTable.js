// src/components/meta/EnhancedCreativePerformanceTable.js
import React, { useState, useEffect } from 'react';
import { Settings, Download, Mail } from 'lucide-react';
import metaAPI from './metaAPI';
import BenchmarkManager from './BenchmarkManager';

// Helper function to format currency
const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(value);
};

// Helper function to format numbers
const formatNumber = (value) => {
  return new Intl.NumberFormat('en-US').format(value);
};

const EnhancedCreativePerformanceTable = ({ 
  analyticsData, 
  selectedAccountId,
  onCreativeSelect
}) => {
  const [showBenchmarks, setShowBenchmarks] = useState(true);
  const [benchmarks, setBenchmarks] = useState({});
  const [showBenchmarkModal, setShowBenchmarkModal] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    if (selectedAccountId) {
      fetchBenchmarks();
    }
  }, [selectedAccountId]);

  const fetchBenchmarks = async () => {
    try {
      const response = await metaAPI.fetchBenchmarks(selectedAccountId);
      if (response.data) {
        setBenchmarks(response.data);
      }
    } catch (error) {
      console.error('Error fetching benchmarks:', error);
    }
  };

  const handleBenchmarkToggle = () => {
    setShowBenchmarks(!showBenchmarks);
  };

  const handleOpenBenchmarkSettings = () => {
    setShowBenchmarkModal(true);
  };

  const handleCloseBenchmarkSettings = () => {
    setShowBenchmarkModal(false);
  };

  const handleExportCSV = async () => {
    if (!analyticsData || !analyticsData.creativePerformance) return;
    
    setExportLoading(true);
    
    try {
      // Filter creatives to show only those from the currently selected account
      const filteredCreatives = analyticsData.creativePerformance.filter(creative => 
        creative.accountId === selectedAccountId
      );
      
      const csvRows = [];
      
      // Create CSV header row
      const headers = [
        'Creative',
        'Ad Set',
        'Impressions',
        'Clicks',
        'CTR',
        'CTR Benchmark',
        'CPC',
        'CPC Benchmark',
        'CPM',
        'CPM Benchmark',
        'Purchases',
        'Cost/Purchase',
        'Cost/Purchase Benchmark',
        'Spend',
        'ROAS',
        'ROAS Benchmark'
      ];
      
      csvRows.push(headers.join(','));
      
      // Function to get benchmark performance status
      const getBenchmarkStatus = (metric, value) => {
        if (!benchmarks[metric]) return 'N/A';
        
        const { low, medium } = benchmarks[metric];
        
        if (low !== null && value < low) return 'Low';
        if (medium !== null && value < medium) return 'Medium';
        return 'High';
      };
      
      // Add data rows
      filteredCreatives.forEach(creative => {
        const row = [
          `"${creative.adName}"`,
          `"${creative.adsetName || 'Unknown'}"`,
          formatNumber(creative.impressions),
          formatNumber(creative.clicks),
          `${creative.ctr.toFixed(2)}%`,
          getBenchmarkStatus('ctr', creative.ctr / 100), // Convert % to decimal
          formatCurrency(creative.cpc),
          getBenchmarkStatus('cpc', creative.cpc),
          formatCurrency(creative.cpm),
          getBenchmarkStatus('cpm', creative.cpm),
          formatNumber(creative.purchases),
          formatCurrency(creative.costPerPurchase),
          getBenchmarkStatus('costPerPurchase', creative.costPerPurchase),
          formatCurrency(creative.spend),
          `${creative.roas.toFixed(2)}x`,
          getBenchmarkStatus('roas', creative.roas)
        ];
        
        csvRows.push(row.join(','));
      });
      
      // Create CSV content
      const csvContent = csvRows.join('\n');
      
      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Creative_Performance_Report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error('Error exporting CSV:', error);
    } finally {
      setExportLoading(false);
    }
  };

  // Function to get cell style based on benchmark performance
  const getBenchmarkCellStyle = (metric, value) => {
    if (!showBenchmarks || !benchmarks[metric]) return {};
    
    const { low, medium } = benchmarks[metric];
    
    // Convert CTR from percentage to decimal for comparison
    const comparisonValue = metric === 'ctr' ? value / 100 : value;
    
    if (low !== null && comparisonValue < low) {
      return { backgroundColor: '#FEE2E2', color: '#B91C1C' }; // Light red
    }
    
    if (medium !== null && comparisonValue < medium) {
      return { backgroundColor: '#FEF3C7', color: '#92400E' }; // Light yellow
    }
    
    return { backgroundColor: '#DCFCE7', color: '#166534' }; // Light green
  };

  if (!analyticsData || !analyticsData.creativePerformance || analyticsData.creativePerformance.length === 0) {
    return (
      <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.375rem', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
        <p style={{ textAlign: 'center', color: '#718096' }}>No creative performance data available for the selected account and date range.</p>
      </div>
    );
  }
  
  // Filter creatives to show only those from the currently selected account
  let filteredCreatives = analyticsData.creativePerformance.filter(creative => 
    creative.accountId === selectedAccountId
  );
  
  if (filteredCreatives.length === 0) {
    return (
      <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.375rem', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
        <p style={{ textAlign: 'center', color: '#718096' }}>No creative performance data available for the selected account.</p>
      </div>
    );
  }
  
  // Group creatives by their creative asset (based on thumbnailUrl or creativeId)
  const groupedCreatives = {};
  
  filteredCreatives.forEach(creative => {
    // Use the thumbnail URL or creative ID as the grouping key
    const groupKey = creative.thumbnailUrl || creative.creativeId;
    
    if (!groupedCreatives[groupKey]) {
      // Store the full ad name
      const fullName = creative.adName;
      
      // Initialize a new group with the first creative's data
      groupedCreatives[groupKey] = {
        creativeId: creative.creativeId,
        thumbnailUrl: creative.thumbnailUrl,
        adName: fullName, // Keep full name
        objectStorySpec: creative.objectStorySpec,
        impressions: 0,
        clicks: 0,
        spend: 0,
        purchases: 0,
        revenue: 0,
        instances: 0,
        adsets: new Set()
      };
    }
    
    // For all metrics, ensure we're working with proper numbers
    groupedCreatives[groupKey].impressions += parseInt(creative.impressions || 0, 10);
    groupedCreatives[groupKey].clicks += parseInt(creative.clicks || 0, 10);
    groupedCreatives[groupKey].spend += parseFloat(creative.spend || 0);
    
    // Special handling for purchases - ignore the field if it's unreasonably large
    let purchaseCount = 0;
    if (creative.purchases !== undefined && creative.purchases !== null) {
      if (typeof creative.purchases === 'string') {
        // If it's a comma-separated string, remove commas before parsing
        const cleanedValue = creative.purchases.replace(/,/g, '');
        purchaseCount = parseInt(cleanedValue, 10) || 0;
      } else {
        purchaseCount = parseInt(creative.purchases, 10) || 0;
      }
      
      // If the number is unrealistically large (Meta API data issue)
      if (purchaseCount > 1000000) {
        console.warn(`Ignoring unrealistic purchase value: ${purchaseCount} for ${creative.adName}`);
        // Try to extract a more realistic number from the actual data in the API
        // Often, the real purchase count is at the start of the string
        if (typeof creative.purchases === 'string' && creative.purchases.includes(',')) {
          const firstPart = creative.purchases.split(',')[0];
          purchaseCount = parseInt(firstPart, 10) || 0;
          
          // Still sanity check it
          if (purchaseCount > 1000) {
            purchaseCount = 0;
          }
        } else {
          purchaseCount = 0;
        }
      }
    }
    groupedCreatives[groupKey].purchases += purchaseCount;
    
    // Revenue handling
    groupedCreatives[groupKey].revenue += parseFloat(creative.revenue || 0);
    groupedCreatives[groupKey].instances += 1;
    
    // Track distinct ad sets
    if (creative.adsetName) {
      groupedCreatives[groupKey].adsets.add(creative.adsetName);
    }
  });
  
  // Convert the grouped data to an array and calculate derived metrics
  const summarizedCreatives = Object.values(groupedCreatives).map(group => {
    // Calculate derived metrics
    const ctr = group.impressions > 0 ? (group.clicks / group.impressions) * 100 : 0;
    const cpc = group.clicks > 0 ? group.spend / group.clicks : 0;
    const cpm = group.impressions > 0 ? (group.spend / group.impressions) * 1000 : 0;
    const costPerPurchase = group.purchases > 0 ? group.spend / group.purchases : 0;
    const roas = group.spend > 0 && group.revenue > 0 ? group.revenue / group.spend : 0;
    
    return {
      ...group,
      ctr,
      cpc,
      cpm,
      costPerPurchase,
      roas,
      adsetCount: group.adsets.size
    };
  });
  
  // Sort by spend (highest to lowest)
  const sortedCreatives = summarizedCreatives.sort((a, b) => b.spend - a.spend);

  // Custom inline styles for more reliable alternating rows
  const tableStyles = {
    container: {
      backgroundColor: 'white',
      borderRadius: '0.375rem',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '1rem 1.5rem',
      borderBottom: '1px solid #E2E8F0'
    },
    headerTitle: {
      fontSize: '1.25rem',
      fontWeight: '600',
      color: '#1A202C'
    },
    actionButton: {
      display: 'inline-flex',
      alignItems: 'center',
      padding: '0.5rem 0.75rem',
      borderRadius: '0.375rem',
      backgroundColor: '#EDF2F7',
      color: '#4A5568',
      fontSize: '0.875rem',
      fontWeight: '500',
      border: 'none',
      cursor: 'pointer',
      marginLeft: '0.5rem'
    },
    activeButton: {
      backgroundColor: '#EBF8FF',
      color: '#3182CE'
    },
    tableWrapper: {
      overflowX: 'auto'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      fontSize: '0.75rem',
    },
    headerCell: {
      backgroundColor: '#EBF5FF', // Light blue for header
      color: '#4A5568',
      fontWeight: '600',
      textAlign: 'right',
      padding: '0.75rem 1rem',
      borderBottom: '1px solid #E2E8F0',
      position: 'sticky',
      top: 0,
      textTransform: 'uppercase',
    },
    headerCellLeft: {
      backgroundColor: '#EBF5FF', // Light blue for header
      color: '#4A5568',
      fontWeight: '600',
      textAlign: 'left',
      padding: '0.75rem 1rem',
      borderBottom: '1px solid #E2E8F0',
      position: 'sticky',
      top: 0,
      textTransform: 'uppercase',
    },
    evenRow: {
      backgroundColor: '#FFFFFF', // White for even rows
    },
    oddRow: {
      backgroundColor: '#F0F7FF', // Very light blue for odd rows
    },
    cell: {
      padding: '0.75rem 1rem',
      borderBottom: '1px solid #E2E8F0',
      textAlign: 'right',
      color: '#4A5568',
    },
    cellLeft: {
      padding: '0.75rem 1rem',
      borderBottom: '1px solid #E2E8F0',
      textAlign: 'left',
      color: '#4A5568',
    },
    positiveRoas: {
      color: '#38A169', // Green
      fontWeight: '600',
    },
    negativeRoas: {
      color: '#E53E3E', // Red
      fontWeight: '600',
    },
    modal: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    },
    modalContent: {
      backgroundColor: 'white',
      borderRadius: '0.375rem',
      width: '90%',
      maxWidth: '800px',
      maxHeight: '90vh',
      overflow: 'auto'
    },
    modalHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '1rem',
      borderBottom: '1px solid #E2E8F0'
    },
    modalTitle: {
      fontSize: '1.25rem',
      fontWeight: '600'
    },
    modalCloseButton: {
      backgroundColor: 'transparent',
      border: 'none',
      color: '#718096',
      fontSize: '1.5rem',
      cursor: 'pointer'
    }
  };
  
  return (
    <div style={tableStyles.container}>
      <div style={tableStyles.header}>
        <h3 style={tableStyles.headerTitle}>Creative Performance</h3>
        
        <div>
          <button 
            onClick={handleBenchmarkToggle}
            style={{ 
              ...tableStyles.actionButton, 
              ...(showBenchmarks ? tableStyles.activeButton : {})
            }}
          >
            <Settings size={16} style={{ marginRight: '0.5rem' }} />
            {showBenchmarks ? 'Hide Benchmarks' : 'Show Benchmarks'}
          </button>
          
          <button
            onClick={handleOpenBenchmarkSettings}
            style={tableStyles.actionButton}
          >
            <Settings size={16} style={{ marginRight: '0.5rem' }} />
            Benchmark Settings
          </button>
          
          <button
            onClick={handleExportCSV}
            disabled={exportLoading}
            style={tableStyles.actionButton}
          >
            <Download size={16} style={{ marginRight: '0.5rem' }} />
            {exportLoading ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>
      </div>
      
      <div style={tableStyles.tableWrapper}>
        <table style={tableStyles.table}>
          <thead>
            <tr>
              <th style={tableStyles.headerCellLeft}>Creative</th>
              <th style={tableStyles.headerCell}>Ad Sets</th>
              <th style={tableStyles.headerCell}>Impressions</th>
              <th style={tableStyles.headerCell}>Clicks</th>
              <th style={tableStyles.headerCell}>CTR</th>
              <th style={tableStyles.headerCell}>CPC</th>
              <th style={tableStyles.headerCell}>CPM</th>
              <th style={tableStyles.headerCell}>Purchases</th>
              <th style={tableStyles.headerCell}>Cost/Purchase</th>
              <th style={tableStyles.headerCell}>Spend</th>
              <th style={tableStyles.headerCell}>ROAS</th>
            </tr>
          </thead>
          <tbody>
            {sortedCreatives.map((creative, index) => (
              <tr 
                key={creative.creativeId} 
                style={index % 2 === 0 ? tableStyles.evenRow : tableStyles.oddRow}
                onClick={() => onCreativeSelect && onCreativeSelect(creative)}
              >
                <td style={{...tableStyles.cellLeft, cursor: onCreativeSelect ? 'pointer' : 'default'}}>
                  <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                    {creative.thumbnailUrl && (
                      <div style={{ marginRight: '0.75rem' }}>
                        <img 
                          style={{ width: '2.25rem', height: '2.25rem', borderRadius: '0.125rem', objectFit: 'cover', border: '1px solid #E2E8F0' }} 
                          src={creative.thumbnailUrl} 
                          alt="" 
                        />
                      </div>
                    )}
                    <div style={{ maxWidth: '20rem' }}>
                      <div style={{ fontWeight: '500', marginBottom: '0.25rem', wordBreak: 'break-word' }}>
                        {creative.adName}
                      </div>
                      <div style={{ color: '#718096', fontSize: '0.75rem' }}>
                        Instances: {creative.instances}
                      </div>
                    </div>
                  </div>
                </td>
                <td style={tableStyles.cell}>
                  {creative.adsetCount}
                </td>
                <td style={tableStyles.cell}>
                  {formatNumber(creative.impressions)}
                </td>
                <td style={tableStyles.cell}>
                  {formatNumber(creative.clicks)}
                </td>
                <td style={{
                  ...tableStyles.cell,
                  ...(showBenchmarks ? getBenchmarkCellStyle('ctr', creative.ctr) : {})
                }}>
                  {creative.ctr >= 0 ? creative.ctr.toFixed(2) : "0.00"}%
                </td>
                <td style={{
                  ...tableStyles.cell,
                  ...(showBenchmarks ? getBenchmarkCellStyle('cpc', creative.cpc) : {})
                }}>
                  {formatCurrency(creative.cpc)}
                </td>
                <td style={{
                  ...tableStyles.cell,
                  ...(showBenchmarks ? getBenchmarkCellStyle('cpm', creative.cpm) : {})
                }}>
                  {formatCurrency(creative.cpm)}
                </td>
                <td style={tableStyles.cell}>
                  {formatNumber(creative.purchases)}
                </td>
                <td style={{
                  ...tableStyles.cell,
                  ...(showBenchmarks ? getBenchmarkCellStyle('costPerPurchase', creative.costPerPurchase) : {})
                }}>
                  {creative.purchases > 0 ? formatCurrency(creative.costPerPurchase) : "$0.00"}
                </td>
                <td style={{...tableStyles.cell, fontWeight: '600'}}>
                  {formatCurrency(creative.spend)}
                </td>
                <td style={{
                  ...tableStyles.cell,
                  ...(showBenchmarks ? getBenchmarkCellStyle('roas', creative.roas) : {}),
                  ...(creative.roas >= 1 ? tableStyles.positiveRoas : tableStyles.negativeRoas)
                }}>
                  {creative.roas > 0 ? creative.roas.toFixed(2) + 'x' : '0.00x'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Benchmark Settings Modal */}
      {showBenchmarkModal && (
        <div style={tableStyles.modal}>
          <div style={tableStyles.modalContent}>
            <div style={tableStyles.modalHeader}>
              <h3 style={tableStyles.modalTitle}>Benchmark Settings</h3>
              <button 
                style={tableStyles.modalCloseButton}
                onClick={handleCloseBenchmarkSettings}
              >
                ×
              </button>
            </div>
            <div>
              <BenchmarkManager 
                selectedAccountId={selectedAccountId}
                onClose={handleCloseBenchmarkSettings}
                onSave={(updatedBenchmarks) => {
                  setBenchmarks(updatedBenchmarks);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedCreativePerformanceTable;