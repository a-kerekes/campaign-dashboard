// src/components/meta/BenchmarkVisualization.js
import React, { useState, useEffect } from 'react';

const BenchmarkVisualization = ({ creativeData, benchmarks, metric = 'ctr' }) => {
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
      if (selectedMetric.format === 'percentage' && metric === 'ctr') {
        value = value / 100;
      }
      
      // Determine performance level
      let performanceLevel = 'high';
      let color = newMetricConfig.colorHigh;
      
      if (thresholds.low !== null && selectedMetric.higherIsBetter && value < thresholds.low) {
        performanceLevel = 'low';
        color = newMetricConfig.colorLow;
      } else if (thresholds.medium !== null && selectedMetric.higherIsBetter && value < thresholds.medium) {
        performanceLevel = 'medium';
        color = newMetricConfig.colorMedium;
      } else if (thresholds.low !== null && !selectedMetric.higherIsBetter && value > thresholds.low) {
        performanceLevel = 'low'; // For metrics where lower is better (like CPC)
        color = newMetricConfig.colorLow;
      } else if (thresholds.medium !== null && !selectedMetric.higherIsBetter && value > thresholds.medium) {
        performanceLevel = 'medium';
        color = newMetricConfig.colorMedium;
      }
      
      // For CTR, convert back to percentage for display
      const displayValue = selectedMetric.format === 'percentage' && metric === 'ctr' 
        ? creative[metric] 
        : value;
      
      // Truncate creative name if needed
      const shortName = creative.adName.length > 35 
        ? creative.adName.substring(0, 32) + '...'
        : creative.adName;
      
      return {
        id: creative.creativeId,
        name: shortName,
        fullName: creative.adName,
        value: displayValue,
        performanceLevel,
        color
      };
    });
    
    // Sort by value (descending for metrics where higher is better, ascending otherwise)
    const sortedData = [...processed].sort((a, b) => 
      selectedMetric.higherIsBetter ? b.value - a.value : a.value - b.value
    );
    
    // Take top N items for display
    setProcessedData(sortedData.slice(0, 10));
    
  }, [creativeData, benchmarks, metric, metrics]);

  // Get axis tick values
  const getAxisValues = () => {
    if (!processedData.length) return [];
    
    // Find min and max values
    const values = processedData.map(item => item.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    // For small ranges, generate 5 evenly spaced ticks
    // For larger ranges, round to nice numbers
    const range = max - min;
    
    if (range === 0) return [min];
    
    // Use 5 steps
    const step = range / 4;
    
    return [
      min,
      min + step,
      min + 2 * step,
      min + 3 * step,
      max
    ];
  };

  // Find good width for axis labels
  const getYAxisWidth = () => {
    if (!processedData.length) return 50;
    
    const values = processedData.map(item => item.value);
    const max = Math.max(...values);
    
    // Estimate width based on max value and format
    if (metricConfig.format === 'currency') {
      return max > 1000 ? 70 : 50;
    } else if (metricConfig.format === 'percentage') {
      return 50;
    } else {
      return max > 100 ? 60 : 40;
    }
  };

  // Calculate chart dimensions
  const chartWidth = 100; // Percentage width
  const barHeight = 30;
  const chartMargin = { top: 20, right: 20, bottom: 30, left: getYAxisWidth() };
  const chartHeight = processedData.length * (barHeight + 10) + chartMargin.top + chartMargin.bottom;
  
  // Get benchmark lines positions
  const getBenchmarkLines = () => {
    if (!benchmarks || !benchmarks[metric]) return [];
    
    const thresholds = benchmarks[metric];
    const lines = [];
    
    // Only calculate if we have data to get the scale
    if (processedData.length > 0) {
      const values = processedData.map(item => item.value);
      const min = Math.min(...values);
      const max = Math.max(...values);
      const chartWidth = 100 - chartMargin.left - chartMargin.right;
      
      // Calculate percentage positions
      if (thresholds.low !== null) {
        const lowValue = metricConfig.format === 'percentage' && metric === 'ctr' 
          ? thresholds.low * 100 
          : thresholds.low;
        
        // Check if within visible range
        if (lowValue >= min && lowValue <= max) {
          const position = ((lowValue - min) / (max - min)) * chartWidth + chartMargin.left;
          lines.push({
            position,
            label: 'Low Threshold',
            color: '#F87171' // Red
          });
        }
      }
      
      if (thresholds.medium !== null) {
        const mediumValue = metricConfig.format === 'percentage' && metric === 'ctr' 
          ? thresholds.medium * 100 
          : thresholds.medium;
        
        // Check if within visible range
        if (mediumValue >= min && mediumValue <= max) {
          const position = ((mediumValue - min) / (max - min)) * chartWidth + chartMargin.left;
          lines.push({
            position,
            label: 'Medium Threshold',
            color: '#FBBF24' // Yellow
          });
        }
      }
    }
    
    return lines;
  };

  // Styles for horizontal bar chart
  const styles = {
    container: {
      backgroundColor: 'white',
      borderRadius: '0.375rem',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      padding: '1.5rem',
      marginBottom: '1.5rem'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '1.5rem'
    },
    title: {
      fontSize: '1.125rem',
      fontWeight: '600',
      color: '#1A202C'
    },
    select: {
      padding: '0.5rem',
      borderRadius: '0.25rem',
      border: '1px solid #E2E8F0',
      backgroundColor: 'white'
    },
    chart: {
      width: `${chartWidth}%`,
      height: `${chartHeight}px`,
      position: 'relative'
    },
    bar: {
      height: `${barHeight}px`,
      borderRadius: '3px',
      position: 'absolute',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      paddingRight: '0.75rem',
      transition: 'width 0.3s ease'
    },
    barLabel: {
      color: '#4A5568',
      fontSize: '0.75rem',
      whiteSpace: 'nowrap'
    },
    axisLabel: {
      position: 'absolute',
      fontSize: '0.75rem',
      color: '#718096'
    },
    benchmarkLine: {
      position: 'absolute',
      width: '1px',
      height: `${chartHeight - chartMargin.top - chartMargin.bottom}px`,
      top: `${chartMargin.top}px`
    },
    benchmarkLabel: {
      position: 'absolute',
      fontSize: '0.75rem',
      transform: 'translate(-50%, 0)',
      top: '0'
    },
    legend: {
      display: 'flex',
      justifyContent: 'center',
      marginTop: '1rem'
    },
    legendItem: {
      display: 'flex',
      alignItems: 'center',
      marginRight: '1rem',
      fontSize: '0.75rem'
    },
    legendBox: {
      width: '1rem',
      height: '1rem',
      marginRight: '0.375rem',
      borderRadius: '2px'
    }
  };

  // Get benchmark lines
  const benchmarkLines = getBenchmarkLines();
  
  // Get axis values
  const axisValues = getAxisValues();

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>Performance Benchmarks Visualization</h3>
        
        <select 
          value={metric} 
          onChange={(e) => {
            // This would need to be controlled by the parent component
            // Just adding for illustration
            console.log('Metric changed to:', e.target.value);
          }}
          style={styles.select}
        >
          {metrics.map(m => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      </div>
      
      {processedData.length > 0 ? (
        <>
          <div style={styles.chart}>
            {/* Y-axis (creative names) */}
            {processedData.map((item, index) => (
              <div
                key={`axis-${item.id}`}
                style={{
                  ...styles.axisLabel,
                  top: `${chartMargin.top + index * (barHeight + 10) + barHeight / 2}px`,
                  left: '0',
                  textAlign: 'right',
                  width: `${chartMargin.left - 5}px`
                }}
              >
                {item.name}
              </div>
            ))}
            
            {/* X-axis values */}
            {axisValues.map((value, index) => {
              // Calculate position based on min/max
              const min = Math.min(...processedData.map(item => item.value));
              const max = Math.max(...processedData.map(item => item.value));
              const range = max - min;
              const position = range === 0 ? 50 : ((value - min) / range) * (100 - chartMargin.left - chartMargin.right) + chartMargin.left;
              
              return (
                <div
                  key={`x-${index}`}
                  style={{
                    ...styles.axisLabel,
                    top: `${chartHeight - chartMargin.bottom / 2}px`,
                    left: `${position}%`,
                    transform: 'translate(-50%, 0)'
                  }}
                >
                  {formatValue(value, metricConfig.format)}
                </div>
              );
            })}
            
            {/* Benchmark lines */}
            {benchmarkLines.map((line, index) => (
              <div key={`line-${index}`}>
                <div 
                  style={{
                    ...styles.benchmarkLine,
                    left: `${line.position}%`,
                    backgroundColor: line.color,
                    borderRight: `1px dashed ${line.color}`
                  }}
                />
                <div
                  style={{
                    ...styles.benchmarkLabel,
                    left: `${line.position}%`,
                    color: line.color,
                    top: '5px',
                    fontSize: '0.7rem'
                  }}
                >
                  {line.label}
                </div>
              </div>
            ))}
            
            {/* Bars */}
            {processedData.map((item, index) => {
              // Calculate width based on min/max
              const min = Math.min(...processedData.map(d => d.value));
              const max = Math.max(...processedData.map(d => d.value));
              const range = max - min;
              const width = range === 0 ? 50 : ((item.value - min) / range) * (100 - chartMargin.left - chartMargin.right);
              
              return (
                <div
                  key={item.id}
                  style={{
                    ...styles.bar,
                    width: `${width}%`,
                    left: `${chartMargin.left}%`,
                    top: `${chartMargin.top + index * (barHeight + 10)}px`,
                    backgroundColor: item.color
                  }}
                  title={`${item.fullName}: ${formatValue(item.value, metricConfig.format)}`}
                >
                  <span style={styles.barLabel}>
                    {formatValue(item.value, metricConfig.format)}
                  </span>
                </div>
              );
            })}
          </div>
          
          {/* Legend */}
          <div style={styles.legend}>
            <div style={styles.legendItem}>
              <div style={{...styles.legendBox, backgroundColor: metricConfig.colorLow}}></div>
              <span>Low Performance</span>
            </div>
            <div style={styles.legendItem}>
              <div style={{...styles.legendBox, backgroundColor: metricConfig.colorMedium}}></div>
              <span>Medium Performance</span>
            </div>
            <div style={styles.legendItem}>
              <div style={{...styles.legendBox, backgroundColor: metricConfig.colorHigh}}></div>
              <span>High Performance</span>
            </div>
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#718096' }}>
          No data available for visualization
        </div>
      )}
    </div>
  );
};

export default BenchmarkVisualization;