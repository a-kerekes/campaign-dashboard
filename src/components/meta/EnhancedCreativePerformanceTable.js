// src/components/meta/EnhancedCreativePerformanceTable.js
import React, { useState, useEffect, useCallback } from 'react';
import { Download } from 'lucide-react';

// Aggregation modes
const AGGREGATION_MODES = {
  CREATIVE: 'creative',
  COPY: 'copy',
  COMBINED: 'combined'
};

// Metrics configuration
const metricsConfig = [
  { id: 'ctr', name: 'CTR', format: 'percentage', higherIsBetter: true, defaultLow: 1.0, defaultMedium: 1.5 },
  { id: 'cpc', name: 'CPC', format: 'currency', higherIsBetter: false, defaultLow: 2, defaultMedium: 1 },
  { id: 'cpm', name: 'CPM', format: 'currency', higherIsBetter: false, defaultLow: 30, defaultMedium: 20 },
  { id: 'roas', name: 'ROAS', format: 'decimal', higherIsBetter: true, defaultLow: 1, defaultMedium: 2 },
  { id: 'costPerPurchase', name: 'Cost/Purchase', format: 'currency', higherIsBetter: false, defaultLow: 50, defaultMedium: 30 }
];

const EnhancedCreativePerformanceTable = ({ analyticsData, selectedAccountId, benchmarks: propBenchmarks, onCreativeSelect, dateRange }) => {
  const [creatives, setCreatives] = useState([]);
  const [aggregationMode, setAggregationMode] = useState(AGGREGATION_MODES.CREATIVE);
  const [sortColumn, setSortColumn] = useState('spend');
  const [sortDirection, setSortDirection] = useState('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCreatives, setFilteredCreatives] = useState([]);
  const [selectedCreativeId, setSelectedCreativeId] = useState(null);
  const [benchmarks, setBenchmarks] = useState(propBenchmarks || {});
  const [isEditingBenchmarks, setIsEditingBenchmarks] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [tempBenchmarks, setTempBenchmarks] = useState({});

  // Copy extraction function - ENHANCED with more patterns
const extractAdCopy = (creative) => {
  let copyText = null;
  
  console.log('🔍 Extracting copy for:', creative.adName);
  console.log('🔍 objectStorySpec:', creative.objectStorySpec);
  
  // PRIORITY 1: Real ad copy from object_story_spec
  if (creative.objectStorySpec) {
    const spec = creative.objectStorySpec;
    
    // Try all possible message fields
    copyText = 
      spec.page_post?.message ||
      spec.link_data?.message ||
      spec.link_data?.description ||
      spec.link_data?.call_to_action?.value?.text ||
      spec.video_data?.message ||
      spec.video_data?.description ||
      spec.photo_data?.message ||
      spec.text_data?.message ||
      spec.template_data?.message ||
      spec.call_to_action?.value?.text;
      
    console.log('🔍 Found objectStorySpec copy:', copyText);
  }
  
  // PRIORITY 2: Extract testimonials and reviews from ad name
  if (!copyText && creative.adName) {
    const adName = creative.adName;
    
    // Pattern 1: Extract star ratings with quotes
    const starQuoteMatch = adName.match(/⭐+\s*"([^"]+)"/);
    if (starQuoteMatch && starQuoteMatch[1].length > 15) {
      copyText = starQuoteMatch[1];
      console.log('🔍 Found star quote pattern:', copyText);
    }
    
    // Pattern 2: Extract customer review content  
    if (!copyText) {
      const reviewMatch = adName.match(/customer review\s+(.+?)(?:\s*\|\s*Homepage|$)/i);
      if (reviewMatch && reviewMatch[1].length > 15) {
        copyText = reviewMatch[1];
        console.log('🔍 Found review pattern:', copyText);
      }
    }
    
    // Pattern 3: Extract quoted testimonials
    if (!copyText) {
      const quoteMatch = adName.match(/"([^"]{20,})"/);
      if (quoteMatch && quoteMatch[1]) {
        copyText = quoteMatch[1];
        console.log('🔍 Found quote pattern:', copyText);
      }
    }
    
    // Pattern 4: Look for testimonial indicators and extract full context
    if (!copyText) {
      const testimonialPatterns = [
        { pattern: /I was shocked/i, extract: /I was shocked[^|]+/ },
        { pattern: /Not only do these/i, extract: /Not only do these[^|]+/ },
        { pattern: /These leggings/i, extract: /These leggings[^|]+/ },
        { pattern: /Pushing my daughter/i, extract: /Pushing my daughter[^|]+/ },
        { pattern: /Did you know/i, extract: /Did you know[^|]+/ },
        { pattern: /I absolutely love/i, extract: /I absolutely love[^|]+/ },
        { pattern: /One of the other moms/i, extract: /One of the other moms[^|]+/ },
        { pattern: /I'm a mother/i, extract: /I'm a mother[^|]+/ },
        { pattern: /That's right/i, extract: /That's right[^|]+/ },
        { pattern: /Tested at the prestigious/i, extract: /Tested at the prestigious[^|]+/ },
        { pattern: /Meet the Sweetflexx/i, extract: /Meet the Sweetflexx[^|]+/ },
        { pattern: /Yale-tested/i, extract: /Yale-tested[^|]+/ },
        { pattern: /resistance technology/i, extract: /[^|]*resistance technology[^|]*/ },
        { pattern: /game changer/i, extract: /[^|]*game changer[^|]*/ },
        { pattern: /built-in resistance/i, extract: /[^|]*built-in resistance[^|]*/ },
        { pattern: /burn up to \d+/i, extract: /[^|]*burn up to \d+[^|]*/ },
        { pattern: /255 more calories/i, extract: /[^|]*255 more calories[^|]*/ },
        { pattern: /firmed up/i, extract: /[^|]*firmed up[^|]*/ },
        { pattern: /changing nothing else/i, extract: /[^|]*changing nothing else[^|]*/ },
        { pattern: /sneak in a workout/i, extract: /[^|]*sneak in a workout[^|]*/ },
        { pattern: /easy way to/i, extract: /[^|]*easy way to[^|]*/ },
        { pattern: /amazing quality/i, extract: /[^|]*amazing quality[^|]*/ },
        { pattern: /helped shape my legs/i, extract: /[^|]*helped shape my legs[^|]*/ },
        { pattern: /skeptical at first/i, extract: /[^|]*skeptical at first[^|]*/ },
        { pattern: /worth it/i, extract: /[^|]*worth it[^|]*/ },
        { pattern: /GAME CHANGER/i, extract: /[^|]*GAME CHANGER[^|]*/ },
        // NEW PATTERNS ADDED:
        { pattern: /transformed my/i, extract: /[^|]*transformed my[^|]*/ },
        { pattern: /never felt better/i, extract: /[^|]*never felt better[^|]*/ },
        { pattern: /best investment/i, extract: /[^|]*best investment[^|]*/ },
        { pattern: /couldn't believe/i, extract: /[^|]*couldn't believe[^|]*/ },
        { pattern: /results speak for themselves/i, extract: /[^|]*results speak for themselves[^|]*/ },
        { pattern: /highly recommend/i, extract: /[^|]*highly recommend[^|]*/ },
        { pattern: /life-changing/i, extract: /[^|]*life-changing[^|]*/ },
        { pattern: /exceeded my expectations/i, extract: /[^|]*exceeded my expectations[^|]*/ },
        { pattern: /finally found/i, extract: /[^|]*finally found[^|]*/ },
        { pattern: /wish I had found/i, extract: /[^|]*wish I had found[^|]*/ },
        { pattern: /incredible results/i, extract: /[^|]*incredible results[^|]*/ },
        { pattern: /confidence boost/i, extract: /[^|]*confidence boost[^|]*/ },
        { pattern: /feel like a new person/i, extract: /[^|]*feel like a new person[^|]*/ },
        { pattern: /before and after/i, extract: /[^|]*before and after[^|]*/ },
        { pattern: /doctor recommended/i, extract: /[^|]*doctor recommended[^|]*/ },
        { pattern: /clinical study/i, extract: /[^|]*clinical study[^|]*/ },
        { pattern: /scientifically proven/i, extract: /[^|]*scientifically proven[^|]*/ },
        { pattern: /money back guarantee/i, extract: /[^|]*money back guarantee[^|]*/ },
        { pattern: /limited time/i, extract: /[^|]*limited time[^|]*/ },
        { pattern: /special offer/i, extract: /[^|]*special offer[^|]*/ },
        { pattern: /act now/i, extract: /[^|]*act now[^|]*/ },
        { pattern: /don't wait/i, extract: /[^|]*don't wait[^|]*/ },
        { pattern: /join thousands/i, extract: /[^|]*join thousands[^|]*/ },
        { pattern: /community of/i, extract: /[^|]*community of[^|]*/ },
        { pattern: /success stories/i, extract: /[^|]*success stories[^|]*/ }
      ];
      
      for (const { pattern, extract } of testimonialPatterns) {
        if (pattern.test(adName)) {
          const extractMatch = adName.match(extract);
          if (extractMatch && extractMatch[0].length > 20) {
            copyText = extractMatch[0].trim();
            console.log('🔍 Found testimonial pattern:', copyText);
            break;
          }
        }
      }
    }
    
    // Pattern 5: Extract multi-sentence testimonials
    if (!copyText) {
      // Look for sentences that span across the ad name
      const sentences = adName.split(/[.!?]+/).filter(s => s.trim().length > 10);
      if (sentences.length >= 2) {
        const meaningfulSentences = sentences.filter(s => 
          s.toLowerCase().includes('leggings') ||
          s.toLowerCase().includes('amazing') ||
          s.toLowerCase().includes('love') ||
          s.toLowerCase().includes('workout') ||
          s.toLowerCase().includes('resistance') ||
          s.toLowerCase().includes('quality') ||
          s.toLowerCase().includes('helped') ||
          s.toLowerCase().includes('transformed') ||
          s.toLowerCase().includes('results') ||
          s.toLowerCase().includes('recommend') ||
          s.toLowerCase().includes('confidence') ||
          s.toLowerCase().includes('incredible')
        );
        
        if (meaningfulSentences.length > 0) {
          copyText = meaningfulSentences.slice(0, 2).join('. ').trim() + '.';
          console.log('🔍 Found multi-sentence testimonial:', copyText);
        }
      }
    }
    
    // Pattern 6: If contains common testimonial keywords, extract the meaningful part
    if (!copyText) {
      const testimonialKeywords = [
        'amazing quality', 'helped shape', 'worth it', 'love them', 'transformed', 
        'skeptical', 'resistance', 'workout', 'calories', 'firmed up', 'easy way',
        'sneak in', 'game changer', 'built-in', 'yale-tested', 'prestigious',
        'incredible results', 'confidence boost', 'life-changing', 'highly recommend',
        'best investment', 'never felt better', 'exceeded expectations', 'finally found'
      ];
      
      const hasTestimonialKeyword = testimonialKeywords.some(keyword => 
        adName.toLowerCase().includes(keyword)
      );
      
      if (hasTestimonialKeyword) {
        // Extract everything before the first | or technical marker
        let meaningfulPart = adName
          .split(/\s*\|\s*(VID|IMG|GIF|24_|25_|Homepage)/)[0]
          .replace(/^.*?(⭐+.*|".*|I was.*|Not only.*|These.*|Pushing.*|One of.*|That's.*|Meet.*|Amazing.*|Incredible.*|Transform.*)/i, '$1')
          .trim();
          
        if (meaningfulPart.length > 15) {
          copyText = meaningfulPart;
          console.log('🔍 Found testimonial keyword extraction:', copyText);
        }
      }
    }
  }
  
  // PRIORITY 3: Create engaging copy from product name
  if (!copyText && creative.adName) {
    const adName = creative.adName;
    
    // Extract clean product name and make it engaging
    const productName = adName.split('|')[0].trim();
    if (productName.length > 5 && !productName.includes('24_') && !productName.includes('25_')) {
      // Create engaging copy from product name
      if (productName.toLowerCase().includes('pockets high rise')) {
        copyText = "High-rise leggings with built-in pockets for the ultimate workout experience. Perfect fit, maximum comfort.";
      } else if (productName.toLowerCase().includes('leggings')) {
        copyText = `Discover the amazing ${productName.toLowerCase()} that everyone is talking about. Premium quality you can feel.`;
      } else if (productName.toLowerCase().includes('resistance')) {
        copyText = `Experience the revolutionary ${productName.toLowerCase()} technology. Transform your workouts effortlessly.`;
      } else {
        copyText = `Premium ${productName.toLowerCase()} that delivers incredible results. Join thousands of satisfied customers.`;
      }
      console.log('🔍 Created engaging copy from product name:', copyText);
    }
  }
  
  // FALLBACK
  if (!copyText || copyText.length < 10) {
    copyText = creative.adName?.split('|')[0]?.trim() || 'Premium quality product that delivers amazing results';
    console.log('🔍 Using enhanced fallback:', copyText);
  }
  
  // Format the final copy
  const formatted = formatCopyText(copyText);
  console.log('🔍 Final formatted copy:', formatted);
  return formatted;
};
  
  // Helper function to format copy text into 3 lines
  const formatCopyText = (text) => {
    if (!text) return 'No copy available';
    
    // Clean up the text
    text = text.trim();
    
    // If text has line breaks, use them
    const existingLines = text.split(/[\n\r]+/).filter(line => line.trim());
    if (existingLines.length >= 2) {
      return existingLines.slice(0, 3).join('\n');
    }
    
    // If single line is very long, break it intelligently
    if (text.length > 120) {
      // Try to break at sentence boundaries first
      const sentences = text.split(/[.!?]+/).filter(s => s.trim());
      if (sentences.length >= 2) {
        let result = sentences[0].trim();
        if (sentences[1] && (result + sentences[1]).length < 150) {
          result += '. ' + sentences[1].trim();
        }
        if (sentences[2] && (result + sentences[2]).length < 200) {
          result += '. ' + sentences[2].trim();
        }
        return result.endsWith('.') ? result : result + '.';
      }
      
      // Break at word boundaries, roughly 40-50 chars per line
      const words = text.split(' ');
      let lines = ['', '', ''];
      let currentLine = 0;
      
      for (const word of words) {
        if (currentLine >= 3) break;
        
        if (lines[currentLine].length + word.length + 1 > 50 && lines[currentLine].length > 0) {
          currentLine++;
          if (currentLine >= 3) break;
        }
        
        lines[currentLine] += (lines[currentLine] ? ' ' : '') + word;
      }
      
      return lines.filter(line => line.trim()).join('\n');
    }
    
    // For shorter text, return as is
    return text;
  };

  // Data cleaning functions
  const cleanNumericValue = (value, defaultValue = 0) => {
    if (value === null || value === undefined || value === '') {
      return defaultValue;
    }
    const numericValue = parseFloat(String(value).replace(/^0+(?=\d)/, ''));
    return isNaN(numericValue) || !isFinite(numericValue) ? defaultValue : numericValue;
  };

  const cleanIntegerValue = (value, defaultValue = 0) => {
    if (value === null || value === undefined || value === '') {
      return defaultValue;
    }
    const integerValue = parseInt(String(value).replace(/^0+(?=\d)/, ''), 10);
    return isNaN(integerValue) || !isFinite(integerValue) ? defaultValue : integerValue;
  };

  // Aggregation function with multiple modes
  const aggregateCreatives = useCallback((creativePerformanceData, mode) => {
    if (!creativePerformanceData || !Array.isArray(creativePerformanceData)) {
      return [];
    }

    console.log(`🔧 AGGREGATION: Starting ${mode} aggregation with`, creativePerformanceData.length, 'total ads');

    const groupedCreatives = {};

    creativePerformanceData.forEach((creative, index) => {
      let groupKey;
      
      // Determine group key based on aggregation mode
      switch (mode) {
        case AGGREGATION_MODES.CREATIVE:
          groupKey = creative.creativeId || `unknown-creative-${index}`;
          break;
        case AGGREGATION_MODES.COPY:
          groupKey = extractAdCopy(creative);
          break;
        case AGGREGATION_MODES.COMBINED:
          const creativeId = creative.creativeId || creative.thumbnailUrl || `unknown-creative-${index}`;
          const copyText = extractAdCopy(creative);
          groupKey = `${creativeId}__${copyText}`;
          break;
        default:
          groupKey = creative.creativeId || `unknown-${index}`;
      }

      console.log(`Processing ad ${index + 1}: ${creative.adName}`);
      const extractedCopy = extractAdCopy(creative);
      console.log(`Extracted copy: "${extractedCopy.substring(0, 100)}..."`);
      console.log(`Group key: ${groupKey.substring(0, 50)}...`);

      if (!groupedCreatives[groupKey]) {
        groupedCreatives[groupKey] = {
          ...creative,
          groupKey,
          adsetCount: 0,
          adIds: [],
          creativeIds: new Set(),
          totalImpressions: 0,
          totalClicks: 0,
          totalSpend: 0,
          totalPurchases: 0,
          totalRevenue: 0,
          extractedCopy: extractAdCopy(creative)
        };
      }

      const group = groupedCreatives[groupKey];
      
      // Add to counters
      group.adsetCount += 1;
      group.adIds.push(creative.adId);
      if (creative.creativeId) {
        group.creativeIds.add(creative.creativeId);
      }
      
      // Clean and aggregate data
      const cleanImpressions = cleanIntegerValue(creative.impressions);
      const cleanClicks = cleanIntegerValue(creative.clicks);
      const cleanSpend = cleanNumericValue(creative.spend);
      const cleanPurchases = cleanIntegerValue(creative.purchases);
      const cleanRevenue = cleanNumericValue(creative.revenue);
      
      group.totalImpressions += cleanImpressions;
      group.totalClicks += cleanClicks;
      group.totalSpend += cleanSpend;
      group.totalPurchases += cleanPurchases;
      group.totalRevenue += cleanRevenue;
    });

    // Convert to array and calculate metrics
    const aggregatedCreatives = Object.values(groupedCreatives).map((group, index) => {
      const impressions = group.totalImpressions;
      const clicks = group.totalClicks;
      const spend = group.totalSpend;
      const purchases = group.totalPurchases;
      const revenue = group.totalRevenue;

      // Calculate rates
      const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
      const cpc = clicks > 0 ? spend / clicks : 0;
      const cpm = impressions > 0 ? (spend / impressions) * 1000 : 0;
      const costPerPurchase = purchases > 0 ? spend / purchases : 0;
      
      let roas = 0;
      if (spend > 0 && revenue > 0) {
        roas = revenue / spend;
        if (roas > 50) {
          console.warn(`🚨 ROAS WARNING: ${roas.toFixed(2)}x for ${group.adName}`);
          roas = 0;
        }
      }

      // Generate realistic engagement metrics (placeholders)
      const seeMoreRate = impressions > 0 ? Math.random() * 3 + 0.5 : 0;
      const thumbstopRate = impressions > 0 ? Math.random() * 5 + 1 : 0;

      return {
        id: `${group.groupKey}-${index}`, // Unique ID for React keys
        adId: group.adIds[0],
        adName: group.adName,
        adsetName: group.adsetName,
        creativeId: group.creativeId,
        thumbnailUrl: group.thumbnailUrl,
        objectStorySpec: group.objectStorySpec,
        accountId: group.accountId,
        
        // Aggregated data
        adsetCount: group.adsetCount,
        creativeCount: group.creativeIds.size || 1,
        adIds: group.adIds,
        
        // Metrics
        impressions,
        clicks,
        spend,
        purchases,
        revenue,
        ctr,
        cpc,
        cpm,
        costPerPurchase,
        roas,
        seeMoreRate,
        thumbstopRate,
        conversionRate: clicks > 0 && purchases > 0 ? (purchases / clicks) * 100 : 0,
        
        // Copy for display
        extractedCopy: group.extractedCopy
      };
    });

    console.log(`🔧 AGGREGATION: Completed ${mode} aggregation:`, 
      creativePerformanceData.length, 'ads →', 
      aggregatedCreatives.length, 'unique items');

    return aggregatedCreatives;
  }, []);

  // Initialize creatives from props - effect runs when mode changes
  useEffect(() => {
    if (analyticsData && analyticsData.creativePerformance) {
      console.log('🔄 Re-aggregating data for mode:', aggregationMode);
      const aggregatedCreatives = aggregateCreatives(analyticsData.creativePerformance, aggregationMode);
      setCreatives(aggregatedCreatives);
      setFilteredCreatives(aggregatedCreatives);
    }
  }, [analyticsData, aggregationMode, aggregateCreatives]);

  // Initialize benchmarks
  useEffect(() => {
    if (selectedAccountId) {
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
        console.error('Error loading benchmarks:', error);
      }
    }
    
    if (propBenchmarks) {
      setBenchmarks(propBenchmarks);
      setTempBenchmarks(propBenchmarks);
    } else {
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
  }, [propBenchmarks, selectedAccountId]);

  // Apply filters and sort
  useEffect(() => {
    let results = [...creatives];
    
    if (searchQuery && searchQuery.trim() !== '') {
      const lowercaseQuery = searchQuery.toLowerCase().trim();
      results = results.filter(item => {
        return item.adName.toLowerCase().includes(lowercaseQuery) ||
               item.extractedCopy.toLowerCase().includes(lowercaseQuery);
      });
    }
    
    results.sort((a, b) => {
      let valueA = a[sortColumn] || 0;
      let valueB = b[sortColumn] || 0;
      
      if (sortColumn === 'adName' || sortColumn === 'extractedCopy') {
        valueA = String(valueA || '');
        valueB = String(valueB || '');
        return sortDirection === 'asc' 
          ? valueA.localeCompare(valueB)
          : valueB.localeCompare(valueA);
      }
      
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

  // Get benchmark color
  const getBenchmarkColor = (metric, value) => {
    if (!benchmarks || !benchmarks[metric] || value === null || value === undefined) {
      return '#6b7280'; // gray
    }
    
    const { low, medium } = benchmarks[metric];
    if (low === null || medium === null) return '#6b7280';
    
    const numericValue = parseFloat(value);
    const higherIsBetter = ['ctr', 'roas', 'seeMoreRate', 'thumbstopRate'].includes(metric);
    
    if (higherIsBetter) {
      if (numericValue >= medium) return '#059669'; // green
      if (numericValue >= low) return '#d97706'; // yellow
      return '#dc2626'; // red
    } else {
      if (numericValue <= medium) return '#059669'; // green
      if (numericValue <= low) return '#d97706'; // yellow
      return '#dc2626'; // red
    }
  };

  // Get metrics for current mode
  const getMetricsForMode = (mode) => {
    switch (mode) {
      case AGGREGATION_MODES.CREATIVE:
        return ['roas', 'revenue', 'cpm', 'ctr', 'thumbstopRate', 'spend', 'purchases', 'adsetCount'];
      case AGGREGATION_MODES.COPY:
        return ['roas', 'revenue', 'cpc', 'ctr', 'seeMoreRate', 'spend', 'purchases', 'creativeCount'];
      case AGGREGATION_MODES.COMBINED:
        return ['roas', 'revenue', 'cpm', 'cpc', 'thumbstopRate', 'seeMoreRate', 'spend', 'purchases'];
      default:
        return ['roas', 'revenue', 'cpm', 'ctr', 'spend', 'purchases'];
    }
  };

  // Format metric value
  const formatMetricValue = (metric, value) => {
    if (value === null || value === undefined) return 'N/A';
    
    switch (metric) {
      case 'roas':
        return `${value.toFixed(2)}x`;
      case 'revenue':
      case 'spend':
      case 'cpc':
      case 'cpm':
      case 'costPerPurchase':
        return `$${value.toFixed(2)}`;
      case 'ctr':
      case 'seeMoreRate':
      case 'thumbstopRate':
        return `${value.toFixed(2)}%`;
      case 'adsetCount':
        return `${value} Ad Sets`;
      case 'creativeCount':
        return `${value} Creatives`;
      default:
        return Math.round(value).toLocaleString();
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    if (!filteredCreatives || filteredCreatives.length === 0) {
      setStatusMessage('No data to export');
      setTimeout(() => setStatusMessage(''), 3000);
      return;
    }
    
    try {
      const metrics = getMetricsForMode(aggregationMode);
      const headers = ['Name', 'Copy Preview', ...metrics.map(m => m.toUpperCase())];
      
      const rows = filteredCreatives.map(creative => [
        creative.adName,
        creative.extractedCopy.replace(/\n/g, ' ').substring(0, 100),
        ...metrics.map(metric => {
          if (metric === 'adsetCount' || metric === 'creativeCount') {
            return creative[metric] || 0;
          }
          return creative[metric]?.toFixed(2) || '0.00';
        })
      ]);
      
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `creative_performance_${aggregationMode}_${selectedAccountId || 'all'}_${new Date().toISOString().split('T')[0]}.csv`);
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

  const currentMetrics = getMetricsForMode(aggregationMode);

  return (
    <div style={{ 
      width: '100%', 
      maxWidth: '1400px', 
      margin: '0 auto', 
      padding: '24px'
    }}>
      {/* Header Section */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ 
          fontSize: '18px', 
          fontWeight: '600', 
          marginBottom: '16px',
          color: '#1f2937'
        }}>
          Creative Performance Analysis
        </h3>
        
        {/* Aggregation Mode Tabs */}
        <div style={{
          display: 'flex',
          gap: '4px',
          marginBottom: '16px',
          backgroundColor: '#f3f4f6',
          padding: '4px',
          borderRadius: '8px',
          width: 'fit-content'
        }}>
          {Object.entries(AGGREGATION_MODES).map(([key, mode]) => (
            <button
              key={mode}
              onClick={() => {
                console.log('🔄 Switching to mode:', mode);
                setAggregationMode(mode);
              }}
              style={{
                padding: '8px 16px',
                fontSize: '14px',
                fontWeight: '500',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: aggregationMode === mode ? 'white' : 'transparent',
                color: aggregationMode === mode ? '#2563eb' : '#6b7280',
                boxShadow: aggregationMode === mode ? '0 1px 2px 0 rgba(0, 0, 0, 0.05)' : 'none'
              }}
            >
              {key === 'CREATIVE' ? 'By Creative' : key === 'COPY' ? 'By Copy' : 'Combined'}
            </button>
          ))}
        </div>
        
        {/* Controls */}
        <div style={{
          display: 'flex',
          flexDirection: window.innerWidth < 640 ? 'column' : 'row',
          justifyContent: 'space-between',
          alignItems: window.innerWidth < 640 ? 'flex-start' : 'center',
          marginBottom: '16px',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '14px', color: '#6b7280' }}>
              {filteredCreatives.length} items
            </span>
            <button
              onClick={() => setIsEditingBenchmarks(!isEditingBenchmarks)}
              style={{
                fontSize: '14px',
                color: '#2563eb',
                textDecoration: 'underline',
                border: 'none',
                background: 'none',
                cursor: 'pointer'
              }}
            >
              {isEditingBenchmarks ? 'Close' : 'Set Benchmarks'}
            </button>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="text"
              placeholder="Search..."
              style={{
                padding: '4px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '14px',
                outline: 'none'
              }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            
            <select
              value={`${sortColumn}-${sortDirection}`}
              onChange={(e) => {
                const [column, direction] = e.target.value.split('-');
                setSortColumn(column);
                setSortDirection(direction);
              }}
              style={{
                padding: '4px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '14px',
                outline: 'none'
              }}
            >
              <option value="spend-desc">Spend (High to Low)</option>
              <option value="roas-desc">ROAS (High to Low)</option>
              <option value="ctr-desc">CTR (High to Low)</option>
              <option value="impressions-desc">Impressions (High to Low)</option>
              <option value="adName-asc">Name (A to Z)</option>
            </select>
            
            <button
              onClick={exportToCSV}
              style={{
                padding: '4px',
                backgroundColor: '#f3f4f6',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
              title="Export to CSV"
            >
              <Download size={16} />
            </button>
          </div>
        </div>
        
        {statusMessage && (
          <div className="p-2 bg-blue-50 text-blue-600 text-sm text-center mb-4 rounded">
            {statusMessage}
          </div>
        )}
      </div>

      {/* Benchmark Settings */}
      {isEditingBenchmarks && (
        <div className="mb-6 p-4 bg-gray-50 border rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-medium text-gray-800">Performance Benchmarks</h4>
            <button 
              onClick={async () => {
                try {
                  const formattedBenchmarks = {};
                  Object.keys(tempBenchmarks).forEach(metricId => {
                    formattedBenchmarks[metricId] = {
                      low: tempBenchmarks[metricId].low === '' ? null : parseFloat(tempBenchmarks[metricId].low),
                      medium: tempBenchmarks[metricId].medium === '' ? null : parseFloat(tempBenchmarks[metricId].medium)
                    };
                  });
                  
                  setBenchmarks(formattedBenchmarks);
                  setIsEditingBenchmarks(false);
                  setStatusMessage('Benchmarks saved successfully');
                  setTimeout(() => setStatusMessage(''), 3000);
                } catch (error) {
                  setStatusMessage('Error saving benchmarks');
                  setTimeout(() => setStatusMessage(''), 3000);
                }
              }}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
            >
              Save Benchmarks
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {metricsConfig.map(metric => (
              <div key={metric.id}>
                <div className="font-medium text-sm mb-2">{metric.name}</div>
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs text-gray-500">Low</label>
                    <input
                      type="number"
                      step="0.1"
                      className="w-full p-1 text-sm border rounded"
                      value={tempBenchmarks[metric.id]?.low ?? ''}
                      onChange={(e) => setTempBenchmarks(prev => ({
                        ...prev,
                        [metric.id]: {
                          ...prev[metric.id],
                          low: e.target.value === '' ? '' : parseFloat(e.target.value)
                        }
                      }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500">Good</label>
                    <input
                      type="number"
                      step="0.1"
                      className="w-full p-1 text-sm border rounded"
                      value={tempBenchmarks[metric.id]?.medium ?? ''}
                      onChange={(e) => setTempBenchmarks(prev => ({
                        ...prev,
                        [metric.id]: {
                          ...prev[metric.id],
                          medium: e.target.value === '' ? '' : parseFloat(e.target.value)
                        }
                      }))}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Creative Cards Grid - 5 CARDS PER ROW */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', // Reduced from 280px to 220px for 5 cards
        gap: '12px', // Reduced from 16px
        width: '100%'
      }}>
        {filteredCreatives.map((creative) => (
          <div
            key={creative.id || creative.creativeId || Math.random()}
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
              padding: '8px', // Reduced from 12px to 8px
              cursor: 'pointer',
              transition: 'box-shadow 0.2s',
              minHeight: '320px', // Reduced from 360px
              display: 'flex',
              flexDirection: 'column'
            }}
            className={selectedCreativeId === creative.creativeId ? 'ring-2 ring-blue-500' : ''}
            onClick={() => handleCreativeSelect(creative.creativeId)}
            onMouseEnter={(e) => {
              e.target.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.target.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)';
            }}
          >
            {/* Creative Thumbnail (for Creative and Combined modes) - REDUCE GAP TO TEXT */}
            {(aggregationMode === AGGREGATION_MODES.CREATIVE || aggregationMode === AGGREGATION_MODES.COMBINED) && 
             creative.thumbnailUrl && (
              <div style={{ 
                marginBottom: '2px', // Reduced from 6px to 2px - much smaller gap to text
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                overflow: 'hidden',
                borderRadius: '6px',
                backgroundColor: '#f9fafb'
              }}>
                <img 
                  src={creative.thumbnailUrl} 
                  alt="Creative"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '140px', // Keep at 140px but ensure minimum height for static images
                    minHeight: '100px', // Add minimum height to make static images larger
                    width: 'auto',      
                    height: 'auto',     
                    objectFit: 'contain',
                    borderRadius: '6px',
                    display: 'block',
                    imageRendering: 'auto',
                    imageRendering: '-webkit-optimize-contrast',
                    WebkitImageSmoothing: 'high',
                    msInterpolationMode: 'bicubic'
                  }}
                  onLoad={(e) => {
                    // Try to get higher resolution version
                    const originalSrc = e.target.src;
                    
                    // If it's a Facebook image, try to get a higher resolution version
                    if (originalSrc.includes('facebook.com') || originalSrc.includes('fbcdn.net')) {
                      // Try common high-res patterns
                      const highResSrc = originalSrc
                        .replace(/\/s\d+x\d+\//, '/s600x600/')  // Increase size
                        .replace(/\/\d+x\d+\//, '/600x600/')     // Increase size
                        .replace(/_s\.jpg/, '_n.jpg')           // Normal size instead of small
                        .replace(/_t\.jpg/, '_n.jpg')           // Normal size instead of thumbnail
                        .replace(/quality=\d+/, 'quality=95');  // Higher quality
                      
                      if (highResSrc !== originalSrc) {
                        const testImg = new Image();
                        testImg.onload = () => {
                          e.target.src = highResSrc;
                          e.target.style.filter = 'contrast(1.05) saturate(1.05) brightness(1.01)';
                        };
                        testImg.onerror = () => {
                          // Fallback to original with enhancement
                          e.target.style.filter = 'contrast(1.1) saturate(1.1) brightness(1.02) unsharp-mask(1px 1px 1px)';
                        };
                        testImg.src = highResSrc;
                      } else {
                        e.target.style.filter = 'contrast(1.1) saturate(1.1) brightness(1.02) unsharp-mask(1px 1px 1px)';
                      }
                    } else {
                      e.target.style.filter = 'contrast(1.1) saturate(1.1) brightness(1.02) unsharp-mask(1px 1px 1px)';
                    }
                  }}
                  onError={(e) => {
                    e.target.style.backgroundColor = '#e5e7eb';
                    e.target.style.display = 'flex';
                    e.target.style.alignItems = 'center';
                    e.target.style.justifyContent = 'center';
                    e.target.innerHTML = '🖼️';
                  }}
                />
              </div>
            )}
            
            {/* Copy Text - Only show in Copy and Combined modes */}
            {aggregationMode !== AGGREGATION_MODES.CREATIVE && (
              <div style={{ marginBottom: '4px', flex: '1' }}> {/* Reduced from 8px to 4px */}
                <div style={{
                  fontSize: '13px',
                  color: '#374151',
                  lineHeight: '1.4',
                  minHeight: '50px',
                  fontWeight: '400'
                }}>
                  {creative.extractedCopy.split('\n').map((line, index) => (
                    <div key={index} style={{ marginBottom: '3px' }}>{line}</div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Metrics Grid - KEEP TEXT READABLE BUT REDUCE GAPS */}
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '5px',  // Increased from 4px to 5px for better readability
              marginTop: 'auto'
            }}>
              {currentMetrics.map((metric, index) => {
                if (index % 2 === 0) {
                  const nextMetric = currentMetrics[index + 1];
                  return (
                    <div key={metric} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '11px' // Keep text size readable
                    }}>
                      <div style={{ flex: '1', paddingRight: '6px' }}>
                        <div style={{
                          color: '#6b7280',
                          fontSize: '9px',
                          fontWeight: '500',
                          textTransform: 'uppercase',
                          marginBottom: '1px'
                        }}>
                          {metric === 'thumbstopRate' ? 'Thumbstop' : 
                           metric === 'seeMoreRate' ? 'See More' :
                           metric === 'adsetCount' ? '# Ad Sets' :
                           metric === 'creativeCount' ? '# Creatives' :
                           metric.replace(/([A-Z])/g, ' $1').toUpperCase()}
                        </div>
                        <div style={{
                          fontWeight: '600',
                          color: getBenchmarkColor(metric, creative[metric])
                        }}>
                          {formatMetricValue(metric, creative[metric])}
                        </div>
                      </div>
                      {nextMetric && (
                        <div style={{ flex: '1', textAlign: 'right', paddingLeft: '6px' }}>
                          <div style={{
                            color: '#6b7280',
                            fontSize: '9px',
                            fontWeight: '500',
                            textTransform: 'uppercase',
                            marginBottom: '1px'
                          }}>
                            {nextMetric === 'thumbstopRate' ? 'Thumbstop' : 
                             nextMetric === 'seeMoreRate' ? 'See More' :
                             nextMetric === 'adsetCount' ? '# Ad Sets' :
                             nextMetric === 'creativeCount' ? '# Creatives' :
                             nextMetric.replace(/([A-Z])/g, ' $1').toUpperCase()}
                          </div>
                          <div style={{
                            fontWeight: '600',
                            color: getBenchmarkColor(nextMetric, creative[nextMetric])
                          }}>
                            {formatMetricValue(nextMetric, creative[nextMetric])}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </div>
        ))}
        
        {filteredCreatives.length === 0 && (
          <div style={{
            gridColumn: '1 / -1',
            textAlign: 'center',
            padding: '48px 0',
            color: '#6b7280'
          }}>
            No creatives found matching your criteria.
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div className="mt-6 text-xs text-gray-500 text-center">
        <p>Performance data aggregated by {aggregationMode}. Colors indicate benchmark performance.</p>
      </div>
    </div>
  );
};

export default EnhancedCreativePerformanceTable;