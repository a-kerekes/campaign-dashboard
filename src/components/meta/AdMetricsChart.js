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

const AdMetricsChart = ({ 
  analyticsData, 
  dateRange, 
  timeSeriesData, 
  accessToken = null, 
  isRealData = false
}) => {
  const [viewType, setViewType] = useState('funnel'); // 'funnel' or 'timeSeries'
  const [metricsData, setMetricsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [useMockData, setUseMockData] = useState(localStorage.getItem('USE_MOCK_DATA') === 'true');
  const { currentTenant, isAdmin } = useAuth();
  const [metrics, setMetrics] = useState({
    impressions: true,
    clicks: true,
    landingPageViews: true,
    addToCarts: true,
    purchases: true
  });

  // Debug log to help identify what props are being received
  useEffect(() => {
    console.log("AdMetricsChart Props:", {
      hasAnalyticsData: !!analyticsData,
      analyticsDataSummary: analyticsData?.summary,
      hasTimeSeriesData: !!timeSeriesData,
      timeSeriesDataLength: timeSeriesData ? timeSeriesData.length : 0,
      dateRange,
      useMockData
    });
  }, [analyticsData, timeSeriesData, dateRange, useMockData]);

  // Determine if we're using real data
  useEffect(() => {
    // Check for mock data by checking for specific properties or patterns
    // For instance, mock data often has very regular patterns or specific values
    const checkIfMockData = (data) => {
      if (!data || data.length === 0) return true;
      
      // If the environment variable is explicitly set to use mock data
      if (process.env.REACT_APP_USE_MOCK_DATA === 'true') return true;
      
      // If localStorage is set to use mock data
      if (localStorage.getItem('USE_MOCK_DATA') === 'true') return true;
      
      // Check if there's a "Using mock data" log in the console (indicating a fallback)
      const mockDataIndicator = data.some(item => 
        item.hasOwnProperty('_isMock') || 
        (item.source && item.source === 'mock')
      );
      
      return mockDataIndicator;
    };
    
    // Determine data source
    if (timeSeriesData && timeSeriesData.length > 0) {
      const isMock = checkIfMockData(timeSeriesData);
      if (typeof isRealData !== 'undefined') {
        setUseMockData(!isRealData);
      } else {
        setUseMockData(isMock);
      }
      
      // Update localStorage to match current state
      localStorage.setItem('USE_MOCK_DATA', isMock ? 'true' : 'false');
    }
  }, [timeSeriesData, isRealData]);

  // Use timeSeriesData passed as prop when available
  useEffect(() => {
    if (timeSeriesData && timeSeriesData.length > 0) {
      console.log("Using timeSeriesData passed from parent component:", timeSeriesData.length, "records");
      console.log("Data source:", isRealData ? "Real API Data" : "Mock Data");
      
      // Format the data if needed
      const formattedData = timeSeriesData.map(item => ({
        ...item,
        formattedDate: new Date(item.date).toLocaleDateString()
      }));
      
      setMetricsData(formattedData);
      setLoading(false);
      setError(null);
    }
  }, [timeSeriesData, isRealData]);

  // For "Use Sample Data" button - should generate and pass up to parent
  const handleUseSampleData = () => {
    console.log("Using sample data for development");
    setUseMockData(true);
    localStorage.setItem('USE_MOCK_DATA', 'true');
    
    // Instead of reloading the page, we should emit an event or call a callback
    // to inform the parent component to switch to mock data
    // For now, we can use a custom event
    const event = new CustomEvent('useMockDataRequested', { 
      detail: { useMock: true } 
    });
    window.dispatchEvent(event);
  };

  // Handler for "Try Real Data" button
  const handleUseRealData = () => {
    console.log("Attempting to use real data");
    setUseMockData(false);
    localStorage.setItem('USE_MOCK_DATA', 'false');
    
    // Emit event to parent
    const event = new CustomEvent('useMockDataRequested', { 
      detail: { useMock: false } 
    });
    window.dispatchEvent(event);
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

  // Check if we need to show the empty state - this is the most important change!
  // We should use the timeSeriesData passed from parent, not rely on our own API fetch
  const showEmptyState = (!timeSeriesData || timeSeriesData.length === 0) && (!metricsData || metricsData.length === 0);
  
  // Show loading state
  if (loading && !timeSeriesData) {
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Ad Metrics</h2>
        <div className="animate-pulse h-64 bg-gray-100 rounded"></div>
        <p className="text-center mt-4 text-gray-500">Loading metrics data...</p>
      </div>
    );
  }

  // Show error state
  if (error && !timeSeriesData) {
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
          {isRealData && (
            <div className="mt-4">
              <button
                onClick={handleUseSampleData}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Use Sample Data For Development
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show empty state - THIS IS A KEY SECTION THAT SHOWS THE USE SAMPLE DATA BUTTON
  if (showEmptyState) {
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Ad Metrics</h2>
        <div className="bg-gray-50 border border-gray-200 text-gray-800 px-4 py-8 rounded text-center">
          <div>
            <p className="mb-4">No metrics data available from Meta API for this time period.</p>
            <p className="text-sm text-gray-600 mb-4">This may occur if:</p>
            <ul className="text-sm text-gray-600 list-disc list-inside mb-4">
              <li>There is no ad data for the selected date range</li>
              <li>The Meta API token doesn't have sufficient permissions</li>
              <li>The ad account is new or has no campaigns</li>
            </ul>
            <button
              onClick={handleUseSampleData}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Use Sample Data For Development
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Determine if we have data - either from props or from local state
  const dataToUse = timeSeriesData && timeSeriesData.length > 0 ? timeSeriesData : metricsData;

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
    { name: 'Impressions', value: dataToUse.reduce((sum, item) => sum + (item.impressions || 0), 0), key: 'impressions' },
    { name: 'Clicks', value: dataToUse.reduce((sum, item) => sum + (item.clicks || 0), 0), key: 'clicks' },
    { name: 'Landing Page Views', value: dataToUse.reduce((sum, item) => sum + (item.landingPageViews || 0), 0), key: 'landingPageViews' },
    { name: 'Add to Carts', value: dataToUse.reduce((sum, item) => sum + (item.addToCarts || 0), 0), key: 'addToCarts' },
    { name: 'Purchases', value: dataToUse.reduce((sum, item) => sum + (item.purchases || 0), 0), key: 'purchases' }
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
            {isRealData ? 'Real API Data' : 'Sample Data'}
          </div>
          
          {useMockData ? (
            <button
              onClick={handleUseRealData}
              style={{
                marginLeft: '10px',
                padding: '2px 8px',
                fontSize: '12px',
                backgroundColor: 'transparent',
                border: '1px solid #6b7280',
                borderRadius: '4px',
                color: '#6b7280',
                cursor: 'pointer'
              }}
            >
              Try Real Data
            </button>
          ) : (
            <button
              onClick={handleUseSampleData}
              style={{
                marginLeft: '10px',
                padding: '2px 8px',
                fontSize: '12px',
                backgroundColor: 'transparent',
                border: '1px solid #6b7280',
                borderRadius: '4px',
                color: '#6b7280',
                cursor: 'pointer'
              }}
            >
              Use Sample Data
            </button>
          )}
        </div>
        
        <div style={{display: 'flex', alignItems: 'center'}}>
          {/* REMOVED: Date range selector - now handled by parent component only */}
          
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
                data={dataToUse}
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