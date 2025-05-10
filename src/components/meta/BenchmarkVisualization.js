// src/components/meta/BenchmarkVisualization.js
import React, { useState, useEffect, useCallback } from 'react';

const BenchmarkVisualization = ({ creativeData, benchmarks, metric = 'ctr', onMetricChange }) => {
  const [processedData, setProcessedData] = useState([]);
  const [metricConfig, setMetricConfig] = useState({
    name: 'CTR',
    format: 'percentage',
    colorLow: '#FCA5A5',  // Light red
    colorMedium: '#FCD34D', // Light yellow
    colorHigh: '#6EE7B7'  // Light green
  });

  // Available metrics for dropdown
  const metrics = [
    { id: 'ctr', name: 'CTR', format: 'percentage', higherIsBetter: true },
    { id: 'cpc', name: 'CPC', format: 'currency', higherIsBetter: false },
    { id: 'cpm', name: 'CPM', format: 'currency', higherIsBetter: false },
    { id: 'costPerPurchase', name: 'Cost/Purchase', format: 'currency', higherIsBetter: false },
    { id: 'roas', name: 'ROAS', format: 'decimal', higherIsBetter: true }
  ];

  // Format value according to metric type
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

  // Update processed data when inputs change
  useEffect(() => {
    if (!creativeData || !benchmarks) return;
    
    // Find the selected metric configuration
    const selectedMetric = metrics.find(m => m.id === metric) || metrics[0];
    const newMetricConfig = {
      name: selectedMetric.name,
      format: selectedMetric.format,
      colorLow: selectedMetric.higherIsBetter ? '#FCA5A5' : '#6EE7B7',     // Red if higher is better, green if lower is better
      colorMedium: '#FCD34D',                                             // Yellow for medium
      colorHigh: selectedMetric.higherIsBetter ? '#6EE7B7' : '#FCA5A5'    // Green if higher is better, red if lower is better
    };
    
    setMetricConfig(newMetricConfig);
    
    // Get benchmark thresholds
    const thresholds = benchmarks[metric] || { low: null, medium: null };
    
    // Process data for display
    const processed = creativeData.map(creative => {
      // Get raw metric value
      let value = creative[metric] || 0;
      
      // For percentages like CTR, convert from percentage to decimal for comparison
      let comparisonValue = value;
      if (selectedMetric.format === 'percentage' && metric === 'ctr') {
        comparisonValue = value / 100;
      }
      
      // Determine performance level
      let performanceLevel = 'high';
      let color = newMetricConfig.colorHigh;
      
      if (thresholds.low !== null && selectedMetric.higherIsBetter && comparisonValue < thresholds.low) {
        performanceLevel = 'low';
        color = newMetricConfig.colorLow;
      } else if (thresholds.medium !== null && selectedMetric.higherIsBetter && comparisonValue < thresholds.medium) {
        performanceLevel = 'medium';
        color = newMetricConfig.colorMedium;
      } else if (thresholds.low !== null && !selectedMetric.higherIsBetter && comparisonValue > thresholds.low) {
        performanceLevel = 'low'; // For metrics where lower is better (like CPC)
        color = newMetricConfig.colorLow;
      } else if (thresholds.medium !== null && !selectedMetric.higherIsBetter && comparisonValue > thresholds.medium) {
        performanceLevel = 'medium';
        color = newMetricConfig.colorMedium;
      }
      
      // Truncate creative name if needed
      let shortName = creative.adName || "";
      if (shortName.length > 35) {
        shortName = shortName.substring(0, 32) + '...';
      }
      
      // Clean up creative name for better display
      shortName = shortName.replace(/\|/g, ' | ');
      
      return {
        id: creative.creativeId || creative.adId,
        name: shortName,
        fullName: creative.adName,
        value: value,
        performanceLevel,
        color
      };
    });
    
    // Sort by value (descending for metrics where higher is better, ascending otherwise)
    const sortedData = [...processed].sort((a, b) => 
      selectedMetric.higherIsBetter ? b.value - a.value : a.value - b.value
    );
    
    // Take top N items for display (limit to 8 for better visualization)
    setProcessedData(sortedData.slice(0, 8));
    
  }, [creativeData, benchmarks, metric, metrics]);

  // Handle metric change
  const handleMetricChange = useCallback((e) => {
    const newMetric = e.target.value;
    if (onMetricChange) {
      onMetricChange(newMetric);
    }
  }, [onMetricChange]);

  // Calculate chart dimensions
  const barHeight = 40;
  const chartMargin = { top: 20, right: 100, bottom: 30, left: 250 };
  const chartHeight = processedData.length * (barHeight + 10) + chartMargin.top + chartMargin.bottom;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-800">Performance Benchmarks Visualization</h3>
        
        <select 
          value={metric} 
          onChange={handleMetricChange}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {metrics.map(m => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      </div>
      
      {processedData.length > 0 ? (
        <>
          <div style={{ position: 'relative', height: `${chartHeight}px` }} className="mb-4">
            {/* Axis labels (Creative names) */}
            {processedData.map((item, index) => (
              <div
                key={`name-${item.id || index}`}
                style={{
                  position: 'absolute',
                  top: `${chartMargin.top + index * (barHeight + 10) + barHeight / 2}px`,
                  left: '0',
                  width: `${chartMargin.left - 10}px`,
                  transform: 'translateY(-50%)',
                  textAlign: 'right',
                  paddingRight: '10px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
                className="text-sm text-gray-700"
                title={item.fullName}
              >
                {item.name}
              </div>
            ))}
            
            {/* Bars */}
            {processedData.map((item, index) => {
              // Calculate max value for proper scaling
              const maxValue = Math.max(...processedData.map(d => d.value)) * 1.1; // Add 10% margin
              const percentage = (item.value / maxValue) * 100;
              
              return (
                <div key={`bar-${item.id || index}`} style={{ position: 'relative' }}>
                  {/* Background bar for better visual */}
                  <div
                    style={{
                      position: 'absolute',
                      top: `${chartMargin.top + index * (barHeight + 10)}px`,
                      left: `${chartMargin.left}px`,
                      width: '100%',
                      height: `${barHeight}px`,
                      backgroundColor: '#f3f4f6',
                      borderRadius: '4px'
                    }}
                  ></div>
                  
                  {/* Actual value bar */}
                  <div
                    style={{
                      position: 'absolute',
                      top: `${chartMargin.top + index * (barHeight + 10)}px`,
                      left: `${chartMargin.left}px`,
                      width: `${percentage}%`,
                      height: `${barHeight}px`,
                      backgroundColor: item.color,
                      borderRadius: '4px',
                      transition: 'width 0.5s ease'
                    }}
                    title={`${item.fullName}: ${formatValue(item.value, metricConfig.format)}`}
                  ></div>
                  
                  {/* Value label */}
                  <div
                    style={{
                      position: 'absolute',
                      top: `${chartMargin.top + index * (barHeight + 10) + barHeight / 2}px`,
                      left: `${chartMargin.left + percentage}%`,
                      transform: 'translate(8px, -50%)',
                      whiteSpace: 'nowrap'
                    }}
                    className="text-sm font-medium text-gray-800"
                  >
                    {formatValue(item.value, metricConfig.format)}
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Legend */}
          <div className="flex justify-center mt-4">
            <div className="flex items-center mx-2">
              <div 
                className="w-4 h-4 mr-2 rounded" 
                style={{ backgroundColor: metricConfig.colorLow }}
              ></div>
              <span className="text-sm text-gray-600">Low Performance</span>
            </div>
            <div className="flex items-center mx-2">
              <div 
                className="w-4 h-4 mr-2 rounded" 
                style={{ backgroundColor: metricConfig.colorMedium }}
              ></div>
              <span className="text-sm text-gray-600">Medium Performance</span>
            </div>
            <div className="flex items-center mx-2">
              <div 
                className="w-4 h-4 mr-2 rounded" 
                style={{ backgroundColor: metricConfig.colorHigh }}
              ></div>
              <span className="text-sm text-gray-600">High Performance</span>
            </div>
          </div>
          
          {/* Benchmark indicator */}
          {(benchmarks[metric]?.low || benchmarks[metric]?.medium) && (
            <div className="mt-4 p-3 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Current Benchmarks:</span> {' '}
                {benchmarks[metric]?.low && (
                  <span>
                    Low: {metricConfig.format === 'percentage' 
                      ? `${(benchmarks[metric].low * 100).toFixed(2)}%` 
                      : metricConfig.format === 'currency' 
                        ? `$${benchmarks[metric].low.toFixed(2)}` 
                        : benchmarks[metric].low.toFixed(2)
                    }
                  </span>
                )}
                {benchmarks[metric]?.medium && (
                  <span className="ml-2">
                    Medium: {metricConfig.format === 'percentage' 
                      ? `${(benchmarks[metric].medium * 100).toFixed(2)}%` 
                      : metricConfig.format === 'currency' 
                        ? `$${benchmarks[metric].medium.toFixed(2)}` 
                        : benchmarks[metric].medium.toFixed(2)
                    }
                  </span>
                )}
              </p>
            </div>
          )}
        </>
      ) : (
        <div className="h-40 flex items-center justify-center text-gray-500">
          No data available for visualization
        </div>
      )}
    </div>
  );
};

export default BenchmarkVisualization;