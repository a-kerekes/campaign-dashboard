// src/components/meta/BreakdownChart.js
import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

const BreakdownChart = ({ 
  ageData, 
  genderData, 
  platformData, 
  placementData,
  isRealData = true,
  initialBreakdown = 'age',
  dateRange
}) => {
  const [breakdown, setBreakdown] = useState(initialBreakdown);
  const [metric, setMetric] = useState('impressions');
  const [chartType, setChartType] = useState('bar'); // 'bar' or 'pie'
  const [processedData, setProcessedData] = useState([]);
  
  // Debug function to inspect data structure
  const debugData = (data, type) => {
    console.log(`DEBUG ${type} DATA:`, data);
    if (data && data.length > 0) {
      console.log(`First item structure:`, JSON.stringify(data[0], null, 2));
      console.log(`Available keys:`, Object.keys(data[0]));
    }
    return data;
  };
  
  // Process data when breakdown or source data changes
  useEffect(() => {
    let rawData;
    switch(breakdown) {
      case 'age': 
        rawData = ageData || []; 
        debugData(ageData, 'AGE');
        break;
      case 'gender': 
        rawData = genderData || []; 
        debugData(genderData, 'GENDER');
        break;
      case 'platform': 
        rawData = platformData || []; 
        debugData(platformData, 'PLATFORM');
        break;
      case 'placement': 
        rawData = placementData || []; 
        debugData(placementData, 'PLACEMENT');
        break;
      default: 
        rawData = [];
    }
    
    // Generate mock data if no data is available
    if (!rawData || rawData.length === 0) {
      console.log(`Using mock data for ${breakdown} breakdown`);
      rawData = generateMockData(breakdown);
      debugData(rawData, 'MOCK');
    }
    
    // Transform data to ensure it has the expected properties
    const transformedData = rawData.map(item => {
      // Deep clone the item to avoid modifying the original
      const processedItem = { ...item };
      
      // Set a display value based on the data structure
      let displayValue;
      
      // First check for the breakdown_value property (standard from Meta API)
      if (processedItem.breakdown_value) {
        displayValue = processedItem.breakdown_value;
      }
      // Then check for specific breakdown fields based on type
      else if (breakdown === 'age') {
        if (processedItem.age) {
          displayValue = processedItem.age;
        }
      }
      else if (breakdown === 'gender') {
        if (processedItem.gender) {
          displayValue = processedItem.gender;
        }
      }
      else if (breakdown === 'platform') {
        if (processedItem.publisher_platform) {
          displayValue = processedItem.publisher_platform;
        }
      }
      else if (breakdown === 'placement') {
        if (processedItem.platform_position) {
          displayValue = processedItem.platform_position;
        }
      }
      
      // Check other common property names
      if (!displayValue) {
        if (processedItem.category) {
          displayValue = processedItem.category;
        } else if (processedItem.name) {
          displayValue = processedItem.name;
        } else if (processedItem.breakdownValue) {
          displayValue = processedItem.breakdownValue;
        }
      }
      
      // Format values for better display
      if (displayValue) {
        // Format gender values
        if (breakdown === 'gender') {
          if (displayValue.toLowerCase() === 'male') displayValue = 'Male';
          else if (displayValue.toLowerCase() === 'female') displayValue = 'Female';
          else if (displayValue.toLowerCase() === 'unknown') displayValue = 'Unknown';
        }
        // Format platform values
        else if (breakdown === 'platform') {
          if (displayValue.toLowerCase() === 'facebook') displayValue = 'Facebook';
          else if (displayValue.toLowerCase() === 'instagram') displayValue = 'Instagram';
          else if (displayValue.toLowerCase() === 'audience_network') displayValue = 'Audience Network';
          else if (displayValue.toLowerCase() === 'messenger') displayValue = 'Messenger';
        }
        // Format placement values
        else if (breakdown === 'placement') {
          if (displayValue.toLowerCase() === 'feed') displayValue = 'Feed';
          else if (displayValue.toLowerCase() === 'story') displayValue = 'Stories';
          else if (displayValue.toLowerCase() === 'right_hand_column') displayValue = 'Right Column';
          else if (displayValue.toLowerCase() === 'instant_article') displayValue = 'Instant Articles';
          else if (displayValue.toLowerCase() === 'marketplace') displayValue = 'Marketplace';
        }
      }
      
      // For development - create meaningful labels if using mock data
      if (!displayValue && breakdown === 'age' && typeof processedItem.category === 'string' && processedItem.category.includes('Category')) {
        displayValue = processedItem.category.replace('Category', 'Age ');
      }
      else if (!displayValue && breakdown === 'gender' && typeof processedItem.category === 'string' && processedItem.category.includes('Category')) {
        const genderMap = {
          'Category 1': 'Male',
          'Category 2': 'Female',
          'Category 3': 'Unknown'
        };
        displayValue = genderMap[processedItem.category] || processedItem.category;
      }
      else if (!displayValue && breakdown === 'platform' && typeof processedItem.category === 'string' && processedItem.category.includes('Category')) {
        const platformMap = {
          'Category 1': 'Facebook',
          'Category 2': 'Instagram',
          'Category 3': 'Messenger',
          'Category 4': 'Audience Network'
        };
        displayValue = platformMap[processedItem.category] || processedItem.category;
      }
      else if (!displayValue && breakdown === 'placement' && typeof processedItem.category === 'string' && processedItem.category.includes('Category')) {
        const placementMap = {
          'Category 1': 'Feed',
          'Category 2': 'Stories',
          'Category 3': 'Reels',
          'Category 4': 'Right Column'
        };
        displayValue = placementMap[processedItem.category] || processedItem.category;
      }
      
      // Ultimate fallback
      if (!displayValue) {
        displayValue = 'Unknown';
      }
      
      // Determine if purchases need to be calculated from actions
      let purchases = 0;
      if (processedItem.actions && Array.isArray(processedItem.actions)) {
        const purchaseAction = processedItem.actions.find(a => a.action_type === 'purchase');
        if (purchaseAction) {
          purchases = parseFloat(purchaseAction.value) || 0;
        }
      } else {
        purchases = processedItem.purchases || 0;
      }

      // Ensure CTR is a percentage
      let ctr = processedItem.ctr || 0;
      if (ctr > 0 && ctr < 1) {
        // If CTR is decimal (0.0123) convert to percentage (1.23)
        ctr = ctr * 100;
      }
      
      return {
        ...processedItem,
        breakdownValue: displayValue,
        // Ensure all important metrics are present
        impressions: parseInt(processedItem.impressions || 0),
        clicks: parseInt(processedItem.clicks || 0),
        spend: parseFloat(processedItem.spend || 0),
        ctr: ctr,
        cpc: parseFloat(processedItem.cpc || 0),
        cpm: parseFloat(processedItem.cpm || 0),
        purchases: purchases,
        leads: parseInt(processedItem.leads || 0)
      };
    });
    
    console.log(`Final processed ${breakdown} data:`, transformedData);
    setProcessedData(transformedData);
  }, [breakdown, ageData, genderData, platformData, placementData, isRealData, dateRange]);
  
  // Generate mock data for development
  const generateMockData = (type) => {
    const mockData = [];
    const categories = 4;
    
    for (let i = 1; i <= categories; i++) {
      const impressions = Math.floor(Math.random() * 10000) + 5000;
      const clicks = Math.floor(Math.random() * 2000) + 500;
      const purchases = Math.floor(Math.random() * 100) + 10;
      const leads = Math.floor(clicks * (0.08 + Math.random() * 0.12)); // 8-20% lead rate
      
      mockData.push({
        category: `Category ${i}`,
        impressions: impressions,
        clicks: clicks,
        spend: parseFloat((Math.random() * 100 + 20).toFixed(2)),
        ctr: parseFloat((Math.random() * 5 + 1).toFixed(2)),
        cpm: parseFloat((Math.random() * 15 + 5).toFixed(2)),
        purchases: purchases,
        leads: leads
      });
    }
    
    return mockData;
  };
  
  // Format metric for display
  const formatMetric = (value) => {
    if (!value && value !== 0) return '0';
    
    if (metric === 'ctr' || metric === 'cvr') {
      return value.toFixed(2) + '%';
    } else if (metric === 'spend' || metric === 'cpc' || metric === 'cpm') {
      return '$' + value.toFixed(2);
    } else {
      return value >= 1000 ? (value / 1000).toFixed(1) + 'K' : value;
    }
  };
  
  // Colors for chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];
  
  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      return (
        <div style={{ 
          backgroundColor: 'white', 
          padding: '10px', 
          border: '1px solid #ccc',
          borderRadius: '5px',
          boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
        }}>
          <p style={{ margin: 0, fontWeight: 'bold' }}>{dataPoint.breakdownValue}</p>
          <p style={{ margin: 0 }}>{`${metric.charAt(0).toUpperCase() + metric.slice(1)}: ${formatMetric(payload[0].value)}`}</p>
          {metric !== 'spend' && <p style={{ margin: 0 }}>{`Spend: $${(dataPoint.spend || 0).toFixed(2)}`}</p>}
          {metric !== 'impressions' && <p style={{ margin: 0 }}>{`Impressions: ${formatMetric(dataPoint.impressions || 0)}`}</p>}
          {metric !== 'clicks' && <p style={{ margin: 0 }}>{`Clicks: ${dataPoint.clicks || 0}`}</p>}
          {metric !== 'ctr' && <p style={{ margin: 0 }}>{`CTR: ${((dataPoint.ctr || 0)).toFixed(2)}%`}</p>}
          {metric !== 'purchases' && <p style={{ margin: 0 }}>{`Purchases: ${dataPoint.purchases || 0}`}</p>}
          {metric !== 'leads' && <p style={{ margin: 0 }}>{`Leads: ${dataPoint.leads || 0}`}</p>}
        </div>
      );
    }
    return null;
  };
  
  return (
    <div style={{ 
      padding: '20px', 
      backgroundColor: 'white', 
      borderRadius: '8px', 
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      marginBottom: '20px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>
          Audience Insights
          {!isRealData && (
            <span style={{ 
              fontSize: '12px', 
              fontWeight: 'normal', 
              marginLeft: '10px',
              padding: '3px 6px',
              backgroundColor: '#f3f4f6',
              color: '#6b7280',
              borderRadius: '4px'
            }}>
              Sample Data
            </span>
          )}
        </h3>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setChartType('bar')}
            style={{
              padding: '6px 12px',
              backgroundColor: chartType === 'bar' ? '#4f46e5' : '#f3f4f6',
              color: chartType === 'bar' ? 'white' : '#6b7280',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: chartType === 'bar' ? 'bold' : 'normal'
            }}
          >
            Bar
          </button>
          <button
            onClick={() => setChartType('pie')}
            style={{
              padding: '6px 12px',
              backgroundColor: chartType === 'pie' ? '#4f46e5' : '#f3f4f6',
              color: chartType === 'pie' ? 'white' : '#6b7280',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: chartType === 'pie' ? 'bold' : 'normal'
            }}
          >
            Pie
          </button>
        </div>
      </div>
      
      {/* Breakdown selector */}
      <div style={{ marginBottom: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setBreakdown('age')}
          style={{
            padding: '6px 12px',
            backgroundColor: breakdown === 'age' ? '#e0e7ff' : '#f3f4f6',
            color: breakdown === 'age' ? '#4f46e5' : '#6b7280',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Age
        </button>
        <button
          onClick={() => setBreakdown('gender')}
          style={{
            padding: '6px 12px',
            backgroundColor: breakdown === 'gender' ? '#e0e7ff' : '#f3f4f6',
            color: breakdown === 'gender' ? '#4f46e5' : '#6b7280',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Gender
        </button>
        <button
          onClick={() => setBreakdown('platform')}
          style={{
            padding: '6px 12px',
            backgroundColor: breakdown === 'platform' ? '#e0e7ff' : '#f3f4f6',
            color: breakdown === 'platform' ? '#4f46e5' : '#6b7280',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Platform
        </button>
        <button
          onClick={() => setBreakdown('placement')}
          style={{
            padding: '6px 12px',
            backgroundColor: breakdown === 'placement' ? '#e0e7ff' : '#f3f4f6',
            color: breakdown === 'placement' ? '#4f46e5' : '#6b7280',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Placement
        </button>
      </div>
      
      {/* Metric selector */}
      <div style={{ marginBottom: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setMetric('impressions')}
          style={{
            padding: '6px 12px',
            backgroundColor: metric === 'impressions' ? '#e0e7ff' : '#f3f4f6',
            color: metric === 'impressions' ? '#4f46e5' : '#6b7280',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Impressions
        </button>
        <button
          onClick={() => setMetric('clicks')}
          style={{
            padding: '6px 12px',
            backgroundColor: metric === 'clicks' ? '#e0e7ff' : '#f3f4f6',
            color: metric === 'clicks' ? '#4f46e5' : '#6b7280',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Clicks
        </button>
        <button
          onClick={() => setMetric('ctr')}
          style={{
            padding: '6px 12px',
            backgroundColor: metric === 'ctr' ? '#e0e7ff' : '#f3f4f6',
            color: metric === 'ctr' ? '#4f46e5' : '#6b7280',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          CTR
        </button>
        <button
          onClick={() => setMetric('cpm')}
          style={{
            padding: '6px 12px',
            backgroundColor: metric === 'cpm' ? '#e0e7ff' : '#f3f4f6',
            color: metric === 'cpm' ? '#4f46e5' : '#6b7280',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          CPM
        </button>
        <button
          onClick={() => setMetric('spend')}
          style={{
            padding: '6px 12px',
            backgroundColor: metric === 'spend' ? '#e0e7ff' : '#f3f4f6',
            color: metric === 'spend' ? '#4f46e5' : '#6b7280',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Spend
        </button>
        <button
          onClick={() => setMetric('leads')}
          style={{
            padding: '6px 12px',
            backgroundColor: metric === 'leads' ? '#e0e7ff' : '#f3f4f6',
            color: metric === 'leads' ? '#4f46e5' : '#6b7280',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Leads
        </button>
        <button
          onClick={() => setMetric('purchases')}
          style={{
            padding: '6px 12px',
            backgroundColor: metric === 'purchases' ? '#e0e7ff' : '#f3f4f6',
            color: metric === 'purchases' ? '#4f46e5' : '#6b7280',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Purchases
        </button>
      </div>
      
      {/* Show appropriate chart based on selection */}
      {processedData.length > 0 ? (
        <div style={{ height: '320px' }}>
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'bar' ? (
              <BarChart
                data={processedData}
                margin={{ top: 5, right: 30, left: 20, bottom: 70 }} // Increased bottom margin for labels
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="breakdownValue"
                  tick={{ fontSize: 12 }}
                  angle={-45} // Angle the text to prevent overlap
                  textAnchor="end" // Align text properly with angle
                  height={70} // Increase height to make room for angled text
                  interval={0} // Show all labels
                />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey={metric} fill="#8884d8" name={metric.charAt(0).toUpperCase() + metric.slice(1)} />
              </BarChart>
            ) : (
              <PieChart>
                <Pie
                  data={processedData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey={metric}
                  nameKey="breakdownValue"
                  label={({ breakdownValue, percent }) => `${breakdownValue}: ${(percent * 100).toFixed(0)}%`}
                >
                  {processedData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            )}
          </ResponsiveContainer>
        </div>
      ) : (
        <div style={{ height: '320px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p>No {breakdown} breakdown data available</p>
        </div>
      )}
    </div>
  );
};

export default BreakdownChart;