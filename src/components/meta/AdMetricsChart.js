// src/components/meta/AdMetricsChart.js
import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { getMetaMetricsByTenant } from './metaAPI';
import { useAuth } from '../../context/AuthContext';

const AdMetricsChart = () => {
  const [viewType, setViewType] = useState('funnel'); // 'funnel' or 'timeSeries'
  const [metricsData, setMetricsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState('Last 30 Days');
  const { currentTenant, isAdmin } = useAuth();
  const [metrics, setMetrics] = useState({
    impressions: true,
    clicks: true,
    landingPageViews: true,
    addToCarts: true,
    purchases: true
  });

  // Fetch data when tenant or date range changes
  useEffect(() => {
    const fetchData = async () => {
      if (!currentTenant?.id) {
        // No tenant selected yet
        setLoading(false);
        setError('No tenant selected');
        setMetricsData([]);
        return;
      }

      setLoading(true);
      setError(null);

      console.log(`Fetching metrics data for tenant: ${currentTenant.id}, date range: ${dateRange}`);
      
      try {
        // Pass the dateRange to the API function
        const result = await getMetaMetricsByTenant(currentTenant.id, dateRange);
        
        if (result.error) {
          console.error('API returned error:', result.error);
          setError(result.error);
          setMetricsData([]);
        } else if (result.data) {
          console.log('API returned data:', result.data.length, 'records');
          // Format dates for display
          const formattedData = result.data.map(item => ({
            ...item,
            formattedDate: new Date(item.date).toLocaleDateString()
          }));
          
          setMetricsData(formattedData);
        }
      } catch (err) {
        console.error('Error fetching metrics data:', err);
        setError('Failed to load metrics data');
        setMetricsData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentTenant, dateRange]); // Include dateRange in dependencies to trigger refresh

  // Handle date range change
  const handleDateRangeChange = (e) => {
    const newDateRange = e.target.value;
    console.log('Date range changed from', dateRange, 'to', newDateRange);
    setDateRange(newDateRange);
  };

  // Toggle metrics
  const toggleMetric = (metric) => {
    setMetrics(prev => ({
      ...prev,
      [metric]: !prev[metric]
    }));
  };
  
  // Get date range display
  const getDateRangeDisplay = () => {
    if (!metricsData || metricsData.length === 0) return '';
    
    const startDate = new Date(metricsData[0].date);
    const endDate = new Date(metricsData[metricsData.length - 1].date);
    
    return `${formatDateDisplay(startDate)} - ${formatDateDisplay(endDate)}`;
  };
  
  // Format date for display
  const formatDateDisplay = (date) => {
    return date.toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  // Format date for x-axis
  const formatXAxisDate = (dateStr) => {
    const date = new Date(dateStr);
    const days = getDateRangeNumber(dateRange);
    
    if (days <= 7) {
      // For 7 days, show day name
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else if (days <= 30) {
      // For 30 days, show month/day
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else {
      // For 60/90 days, show fewer labels to avoid crowding
      if (date.getDate() % 5 !== 0) return '';
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Ad Metrics</h2>
        <div className="animate-pulse h-64 bg-gray-100 rounded"></div>
        <p className="text-center mt-4 text-gray-500">Loading metrics data...</p>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Ad Metrics</h2>
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
          <p>{error}</p>
          {error === 'No Meta ad account ID associated with this tenant' && (
            <p className="mt-2 text-sm">
              {isAdmin 
                ? 'As an admin, you can update the tenant to include a Meta ad account ID.' 
                : 'Please contact your administrator to set up a Meta ad account for this tenant.'}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Show empty state
  if (!metricsData || metricsData.length === 0) {
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Ad Metrics</h2>
        <div className="bg-gray-50 border border-gray-200 text-gray-800 px-4 py-12 rounded text-center">
          <p>No metrics data available for this time period.</p>
        </div>
      </div>
    );
  }

  // Define colors for each stage
  const colors = {
    impressions: '#8884d8',
    clicks: '#83a6ed',
    landingPageViews: '#8dd1e1',
    addToCarts: '#82ca9d',
    purchases: '#a4de6c'
  };

  // Format funnel data
  const funnelData = [
    { name: 'Impressions', value: metricsData.reduce((sum, item) => sum + item.impressions, 0), key: 'impressions' },
    { name: 'Clicks', value: metricsData.reduce((sum, item) => sum + item.clicks, 0), key: 'clicks' },
    { name: 'Landing Page Views', value: metricsData.reduce((sum, item) => sum + item.landingPageViews, 0), key: 'landingPageViews' },
    { name: 'Add to Carts', value: metricsData.reduce((sum, item) => sum + (item.addToCarts || 0), 0), key: 'addToCarts' },
    { name: 'Purchases', value: metricsData.reduce((sum, item) => sum + (item.purchases || 0), 0), key: 'purchases' }
  ];

  // Helper function to get date range number
  const getDateRangeNumber = (dateRange) => {
    switch(dateRange) {
      case 'Last 7 Days': return 7;
      case 'Last 30 Days': return 30;
      case 'Last 60 Days': return 60;
      case 'Last 90 Days': return 90;
      default: return 30;
    }
  };
  
  // Statistics helper functions
  const calculateAverage = (metric) => {
    if (!metricsData || !metricsData.length) return 0;
    return metricsData.reduce((sum, day) => sum + (day[metric] || 0), 0) / metricsData.length;
  };

  const calculateTotal = (metric) => {
    if (!metricsData || !metricsData.length) return 0;
    return metricsData.reduce((sum, day) => sum + (day[metric] || 0), 0);
  };

  const findPeak = (metric) => {
    if (!metricsData || !metricsData.length) return {value: 0, date: null};
    const maxItem = metricsData.reduce((max, current) => 
      (current[metric] > max[metric]) ? current : max, metricsData[0]);
    return {value: maxItem[metric], date: maxItem.date};
  };

  const formatShortDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {month: 'short', day: 'numeric'});
  };
  
  // Format single metric summary
  const renderMetricSummary = (metric) => {
    if (!metrics[metric]) return null;
    
    const activeMetricsCount = Object.values(metrics).filter(Boolean).length;
    if (activeMetricsCount !== 1) return null;
    
    const average = calculateAverage(metric);
    const total = calculateTotal(metric);
    const peak = findPeak(metric);
    
    return (
      <div style={{
        marginBottom: '10px', 
        padding: '12px', 
        backgroundColor: '#f9fafb', 
        borderRadius: '6px',
        border: '1px solid #e5e7eb'
      }}>
        <div style={{fontWeight: 'bold', marginBottom: '8px', fontSize: '14px'}}>
          {getMetricName(metric)} Summary:
        </div>
        <div style={{display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '14px'}}>
          <div>
            <span style={{color: '#6b7280'}}>Average:</span> 
            <span style={{fontWeight: 'bold', marginLeft: '4px'}}>{formatValue(average)}/day</span>
          </div>
          <div>
            <span style={{color: '#6b7280'}}>Total:</span> 
            <span style={{fontWeight: 'bold', marginLeft: '4px'}}>{formatValue(total)}</span>
          </div>
          <div>
            <span style={{color: '#6b7280'}}>Peak:</span> 
            <span style={{fontWeight: 'bold', marginLeft: '4px'}}>{formatValue(peak.value)}</span>
            <span style={{marginLeft: '4px', color: '#6b7280'}}>({formatShortDate(peak.date)})</span>
          </div>
        </div>
      </div>
    );
  };
  
  // Format value for display
  const formatValue = (value) => {
    if (value === undefined || value === null) return '0';
    if (value >= 1000000) {
      return (value / 1000000).toFixed(1) + 'M';
    } else if (value >= 1000) {
      return (value / 1000).toFixed(1) + 'K';
    }
    return Math.round(value).toLocaleString();
  };

  // Get metric name
  const getMetricName = (key) => {
    switch (key) {
      case 'impressions': return 'Impressions';
      case 'clicks': return 'Clicks';
      case 'landingPageViews': return 'Landing Page Views';
      case 'addToCarts': return 'Add to Carts';
      case 'purchases': return 'Purchases';
      default: return key;
    }
  };

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const date = new Date(label);
      const formattedDate = date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      
      // Group metrics
      const filteredPayload = payload.filter(p => metrics[p.dataKey]);
      
      // Calculate rates if we have necessary metrics
      const impressions = getValueByKey(payload, 'impressions');
      const clicks = getValueByKey(payload, 'clicks');
      const landingPageViews = getValueByKey(payload, 'landingPageViews');
      const addToCarts = getValueByKey(payload, 'addToCarts');
      const purchases = getValueByKey(payload, 'purchases');
      
      const ctr = impressions && clicks ? (clicks / impressions * 100).toFixed(2) : null;
      const viewRate = clicks && landingPageViews ? (landingPageViews / clicks * 100).toFixed(2) : null;
      const addToCartRate = landingPageViews && addToCarts ? (addToCarts / landingPageViews * 100).toFixed(2) : null;
      const purchaseRate = addToCarts && purchases ? (purchases / addToCarts * 100).toFixed(2) : null;
      
      return (
        <div style={{
          backgroundColor: 'white', 
          padding: '12px', 
          border: '1px solid #e5e7eb',
          borderRadius: '6px',
          boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
          minWidth: '200px'
        }}>
          <div style={{fontWeight: 'bold', marginBottom: '8px', borderBottom: '1px solid #e5e7eb', paddingBottom: '4px'}}>
            {formattedDate}
          </div>
          
          {filteredPayload.map((entry, index) => (
            <div key={index} style={{
              color: entry.color, 
              display: 'flex', 
              justifyContent: 'space-between',
              padding: '4px 0'
            }}>
              <span style={{marginRight: '12px'}}>{entry.name}:</span>
              <span style={{fontWeight: 'bold'}}>{entry.value.toLocaleString()}</span>
            </div>
          ))}
          
          {/* Show conversion rates if applicable */}
          {(ctr || viewRate || addToCartRate || purchaseRate) && (
            <div style={{marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #e5e7eb', fontSize: '13px'}}>
              <div style={{fontWeight: 'medium', marginBottom: '4px'}}>Conversion Rates:</div>
              {ctr && <div style={{display: 'flex', justifyContent: 'space-between'}}><span>CTR:</span> <span>{ctr}%</span></div>}
              {viewRate && <div style={{display: 'flex', justifyContent: 'space-between'}}><span>View Rate:</span> <span>{viewRate}%</span></div>}
              {addToCartRate && <div style={{display: 'flex', justifyContent: 'space-between'}}><span>Add to Cart Rate:</span> <span>{addToCartRate}%</span></div>}
              {purchaseRate && <div style={{display: 'flex', justifyContent: 'space-between'}}><span>Purchase Rate:</span> <span>{purchaseRate}%</span></div>}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  // Helper function to get value by key from payload
  const getValueByKey = (payload, key) => {
    if (!payload) return 0;
    const item = payload.find(p => p.dataKey === key);
    return item ? item.value : 0;
  };

  return (
    <div style={{padding: '20px', backgroundColor: 'white', borderRadius: '8px', marginBottom: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px'}}>
        <h3 style={{fontSize: '18px', fontWeight: 'bold', margin: 0}}>
          Conversion Funnel 
          {currentTenant && <span style={{fontSize: '14px', color: '#6b7280', marginLeft: '8px'}}>({currentTenant.name})</span>}
        </h3>
        
        <div style={{display: 'flex', alignItems: 'center'}}>
          {/* Date range selector */}
          <select
            value={dateRange}
            onChange={handleDateRangeChange}
            style={{
              marginRight: '12px',
              padding: '6px 12px',
              border: '1px solid #e5e7eb',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          >
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
            <option>Last 60 Days</option>
            <option>Last 90 Days</option>
          </select>
          
          {/* View type toggle */}
          <div>
            <button 
              onClick={() => setViewType('funnel')}
              style={{
                padding: '8px 12px',
                marginRight: '8px',
                backgroundColor: viewType === 'funnel' ? '#4f46e5' : '#f3f4f6',
                color: viewType === 'funnel' ? 'white' : '#6b7280',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: viewType === 'funnel' ? 'bold' : 'normal'
              }}
            >
              Bar View
            </button>
            <button 
              onClick={() => setViewType('timeSeries')}
              style={{
                padding: '8px 12px',
                backgroundColor: viewType === 'timeSeries' ? '#4f46e5' : '#f3f4f6',
                color: viewType === 'timeSeries' ? 'white' : '#6b7280',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: viewType === 'timeSeries' ? 'bold' : 'normal'
              }}
            >
              Time View
            </button>
          </div>
        </div>
      </div>
      
      {viewType === 'funnel' ? (
        // Funnel bar visualization
        <table style={{width: '100%', borderCollapse: 'collapse'}}>
          <tbody>
            {funnelData.map((item, index) => {
              // Calculate percentage from previous stage
              const fromPrevious = index === 0 
                ? 100 
                : (item.value / funnelData[index-1].value) * 100;
              
              // Calculate percentage of total (first stage)
              const ofTotal = (item.value / funnelData[0].value) * 100;
              
              // Determine color based on conversion rate
              const textColor = index === 0 ? '#333' : 
                              fromPrevious > 40 ? '#10b981' : 
                              fromPrevious > 25 ? '#f59e0b' : '#ef4444';
              
              return (
                <tr key={index} style={{borderBottom: '1px solid #eee'}}>
                  <td style={{padding: '10px 0', width: '180px'}}>
                    <div style={{fontWeight: 'bold'}}>{item.name}</div>
                    <div style={{fontSize: '14px'}}>{item.value.toLocaleString()}</div>
                  </td>
                  <td style={{padding: '10px 0'}}>
                    <div style={{width: '100%', height: '24px', backgroundColor: '#f3f4f6', borderRadius: '4px', position: 'relative'}}>
                      <div style={{
                        height: '24px', 
                        borderRadius: '4px', 
                        width: `${Math.max(ofTotal, 0.5)}%`, 
                        backgroundColor: colors[item.key],
                        transition: 'width 0.5s ease'
                      }}></div>
                    </div>
                  </td>
                  <td style={{padding: '10px 0', width: '150px', textAlign: 'right'}}>
                    {index > 0 && (
                      <div style={{color: textColor, fontSize: '14px', fontWeight: 'medium'}}>
                        {fromPrevious.toFixed(1)}% from previous
                      </div>
                    )}
                    <div style={{color: '#6b7280', fontSize: '14px'}}>
                      {ofTotal.toFixed(2)}% of total
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        // Time series visualization
        <div>
          {/* Time period indicator */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '12px',
            color: '#6b7280',
            marginBottom: '12px'
          }}>
            <div>Period: {dateRange}</div>
            <div>{getDateRangeDisplay()}</div>
          </div>
          
          <div style={{marginBottom: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap'}}>
            {funnelData.map((item) => (
              <button
                key={item.key}
                onClick={() => toggleMetric(item.key)}
                style={{
                  padding: '6px 12px',
                  backgroundColor: metrics[item.key] ? '#e0e7ff' : '#f3f4f6',
                  color: metrics[item.key] ? '#4f46e5' : '#6b7280',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                {item.name}
              </button>
            ))}
          </div>
          
          {/* Metric summary for single metric view */}
          {renderMetricSummary('impressions')}
          {renderMetricSummary('clicks')}
          {renderMetricSummary('landingPageViews')}
          {renderMetricSummary('addToCarts')}
          {renderMetricSummary('purchases')}
          
          <div style={{height: '320px'}}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={metricsData}
                margin={{ top: 5, right: 30, left: 20, bottom: getDateRangeNumber(dateRange) >= 60 ? 50 : 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatXAxisDate}
                  // Adjust angle for longer date ranges to prevent overlap
                  tick={{ 
                    angle: getDateRangeNumber(dateRange) >= 60 ? -45 : 0, 
                    textAnchor: 'end',
                    fontSize: 12
                  }}
                  height={getDateRangeNumber(dateRange) >= 60 ? 60 : 30}
                />
                
                {/* Primary Y-axis for Impressions */}
                <YAxis 
                  yAxisId="impressions"
                  domain={['dataMin', 'dataMax']}
                  tickFormatter={value => formatValue(value)}
                  orientation="left"
                  hide={!metrics.impressions}
                />
                
                {/* Secondary Y-axis for lower funnel metrics */}
                <YAxis 
                  yAxisId="lowerFunnel"
                  domain={[0, 'auto']}
                  tickFormatter={value => formatValue(value)}
                  orientation="right"
                  hide={!(metrics.clicks || metrics.landingPageViews || metrics.addToCarts || metrics.purchases)}
                />
                
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="top" height={36} />
                
                {metrics.impressions && (
                  <Line
                    yAxisId="impressions"
                    type="monotone"
                    dataKey="impressions"
                    stroke={colors.impressions}
                    strokeWidth={2}
                    dot={{ r: 2 }}
                    activeDot={{ r: 6 }}
                    name="Impressions"
                  />
                )}
                
                {metrics.clicks && (
                  <Line
                    yAxisId="lowerFunnel"
                    type="monotone"
                    dataKey="clicks"
                    stroke={colors.clicks}
                    strokeWidth={2}
                    dot={{ r: 2 }}
                    activeDot={{ r: 6 }}
                    name="Clicks"
                  />
                )}
                
                {metrics.landingPageViews && (
                  <Line
                    yAxisId="lowerFunnel"
                    type="monotone"
                    dataKey="landingPageViews"
                    stroke={colors.landingPageViews}
                    strokeWidth={2}
                    dot={{ r: 2 }}
                    activeDot={{ r: 6 }}
                    name="Landing Page Views"
                  />
                )}
                
                {metrics.addToCarts && (
                  <Line
                    yAxisId="lowerFunnel"
                    type="monotone"
                    dataKey="addToCarts"
                    stroke={colors.addToCarts}
                    strokeWidth={2}
                    dot={{ r: 2 }}
                    activeDot={{ r: 6 }}
                    name="Add to Carts"
                  />
                )}
                
                {metrics.purchases && (
                  <Line
                    yAxisId="lowerFunnel"
                    type="monotone"
                    dataKey="purchases"
                    stroke={colors.purchases}
                    strokeWidth={2}
                    dot={{ r: 2 }}
                    activeDot={{ r: 6 }}
                    name="Purchases"
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          {/* Metrics summary cards */}
          <div className="mt-4 grid grid-cols-3 gap-4 text-center" style={{marginTop: '20px'}}>
            <div style={{backgroundColor: '#ebf5ff', padding: '12px', borderRadius: '8px'}}>
              <h3 style={{fontSize: '18px', fontWeight: 'bold', color: '#3b82f6', margin: '0 0 4px 0'}}>
                {metricsData.reduce((sum, item) => sum + item.impressions, 0).toLocaleString()}
              </h3>
              <p style={{fontSize: '14px', color: '#6b7280', margin: 0}}>Total Impressions</p>
            </div>
            <div style={{backgroundColor: '#ecfdf5', padding: '12px', borderRadius: '8px'}}>
              <h3 style={{fontSize: '18px', fontWeight: 'bold', color: '#10b981', margin: '0 0 4px 0'}}>
                {metricsData.reduce((sum, item) => sum + item.clicks, 0).toLocaleString()}
              </h3>
              <p style={{fontSize: '14px', color: '#6b7280', margin: 0}}>Total Clicks</p>
            </div>
            <div style={{backgroundColor: '#fffbeb', padding: '12px', borderRadius: '8px'}}>
              <h3 style={{fontSize: '18px', fontWeight: 'bold', color: '#f59e0b', margin: '0 0 4px 0'}}>
                {((metricsData.reduce((sum, item) => sum + item.clicks, 0) / 
                  metricsData.reduce((sum, item) => sum + item.impressions, 0)) * 100).toFixed(2)}%
              </h3>
              <p style={{fontSize: '14px', color: '#6b7280', margin: 0}}>Average CTR</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdMetricsChart;