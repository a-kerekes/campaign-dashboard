// src/components/meta/AdMetricsChart.js (fixed version)
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

const AdMetricsChart = ({ accessToken = null }) => {
  const [viewType, setViewType] = useState('funnel'); // 'funnel' or 'timeSeries'
  const [metricsData, setMetricsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState('Last 30 Days');
  const [isRealData, setIsRealData] = useState(false);
  const { currentTenant, isAdmin } = useAuth();
  const [metrics, setMetrics] = useState({
    impressions: true,
    clicks: true,
    landingPageViews: true,
    addToCarts: true,
    purchases: true
  });

  // Handle date range change
  const handleDateRangeChange = (e) => {
    const newDateRange = e.target.value;
    console.log('Date range changed from', dateRange, 'to', newDateRange);
    setDateRange(newDateRange);
  };

  // Fetch data when tenant, date range, or accessToken changes
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

      console.log(`Fetching metrics data for tenant: ${currentTenant.id}, date range: ${dateRange}, hasToken: ${!!accessToken}`);
      
      try {
        // Pass the dateRange and accessToken to the API function
        const result = await getMetaMetricsByTenant(currentTenant.id, dateRange, accessToken);
        
        if (result.error) {
          console.error('API returned error:', result.error);
          setError(result.error);
          setMetricsData([]);
          setIsRealData(false);
        } else if (result.data) {
          console.log('API returned data:', result.data.length, 'records', 'isRealData:', result.isRealData);
          // Format dates for display
          const formattedData = result.data.map(item => ({
            ...item,
            formattedDate: new Date(item.date).toLocaleDateString()
          }));
          
          setMetricsData(formattedData);
          setIsRealData(result.isRealData || false);
        }
      } catch (err) {
        console.error('Error fetching metrics data:', err);
        setError('Failed to load metrics data');
        setMetricsData([]);
        setIsRealData(false);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentTenant, dateRange, accessToken]); // Include accessToken in dependencies

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

  return (
    <div style={{padding: '20px', backgroundColor: 'white', borderRadius: '8px', marginBottom: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px'}}>
        <div>
          <h3 style={{fontSize: '18px', fontWeight: 'bold', margin: 0}}>
            Conversion Funnel 
            {currentTenant && <span style={{fontSize: '14px', color: '#6b7280', marginLeft: '8px'}}>({currentTenant.name})</span>}
          </h3>
          
          {/* Data source indicator */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            marginTop: '4px',
            fontSize: '12px',
            color: isRealData ? '#059669' : '#9ca3af',
            backgroundColor: isRealData ? 'rgba(5, 150, 105, 0.1)' : 'rgba(156, 163, 175, 0.1)',
            padding: '2px 8px',
            borderRadius: '12px'
          }}>
            <div style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: isRealData ? '#059669' : '#9ca3af',
              marginRight: '4px'
            }}></div>
            {isRealData ? 'Real API Data' : 'Mock Data'}
          </div>
        </div>
        
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
          
          {/* Time series chart */}
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
                  orientation="left"
                  hide={!metrics.impressions}
                />
                
                {/* Secondary Y-axis for lower funnel metrics */}
                <YAxis 
                  yAxisId="lowerFunnel"
                  domain={[0, 'auto']}
                  orientation="right"
                  hide={!(metrics.clicks || metrics.landingPageViews || metrics.addToCarts || metrics.purchases)}
                />
                
                <Tooltip />
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
        </div>
      )}
    </div>
  );
};

export default AdMetricsChart;