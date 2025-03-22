// src/components/CombinedDashboard.js

import React, { useState } from 'react';
import { 
  LineChart, 
  Line, 
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  ReferenceLine
} from 'recharts';
import './CombinedDashboard.css';

const CombinedDashboard = () => {
  const [activeMainTab, setActiveMainTab] = useState('correlation');
  const [activeCorrelationTab, setActiveCorrelationTab] = useState('fullTimeline');
  const [activeLandingPageTab, setActiveLandingPageTab] = useState('correlation');
  
  // Full correlation data for all time periods
  const fullCorrelationData = [
    { lag: 0, leads: 0.08, trial: 0.36, label: "Same week" },
    { lag: 1, leads: -0.22, trial: 0.01, label: "1 week" },
    { lag: 2, leads: 0.06, trial: -0.08, label: "2 weeks" },
    { lag: 3, leads: -0.07, trial: -0.22, label: "3 weeks" },
    { lag: 4, leads: -0.12, trial: 0.13, label: "4 weeks" },
    { lag: 5, leads: 0.04, trial: 0.19, label: "5 weeks" },
    { lag: 6, leads: -0.15, trial: 0.09, label: "6 weeks" },
    { lag: 7, leads: 0.21, trial: -0.14, label: "7 weeks" },
    { lag: 8, leads: 0.17, trial: -0.05, label: "8 weeks" },
    { lag: 9, leads: -0.09, trial: 0.11, label: "9 weeks" },
    { lag: 10, leads: 0.06, trial: 0.08, label: "10 weeks" },
    { lag: 11, leads: -0.04, trial: 0.27, label: "11 weeks" },
    { lag: 12, leads: 0.13, trial: 0.31, label: "12 weeks" },
    { lag: 13, leads: 0.18, trial: 0.15, label: "13 weeks" },
    { lag: 14, leads: -0.07, trial: 0.09, label: "14 weeks" },
    { lag: 15, leads: 0.05, trial: 0.05, label: "15 weeks" },
    { lag: 16, leads: 0.11, trial: -0.12, label: "16 weeks" },
    { lag: 17, leads: 0.07, trial: -0.18, label: "17 weeks" },
    { lag: 18, leads: 0.22, trial: 0.06, label: "18 weeks" },
    { lag: 19, leads: 0.31, trial: 0.13, label: "19 weeks" },
    { lag: 20, leads: 0.25, trial: 0.09, label: "20 weeks" },
    { lag: 21, leads: 0.19, trial: 0.05, label: "21 weeks" },
    { lag: 22, leads: 0.13, trial: 0.19, label: "22 weeks" },
    { lag: 23, leads: 0.11, trial: 0.16, label: "23 weeks" },
    { lag: 24, leads: 0.34, trial: 0.29, label: "24 weeks" }
  ];
  
  // Landing page correlation data
  const landingPageCorrelationData = [
    { lag: 0, realTalk: 0.34, professionalVisuals: 0.15, overView: 0.11, socialExpert: 0.08, bfcmSale: 0.42, loanOfficer: 0.21, label: "Same week" },
    { lag: 1, realTalk: 0.28, professionalVisuals: 0.12, overView: 0.09, socialExpert: 0.13, bfcmSale: 0.31, loanOfficer: 0.18, label: "1 week" },
    { lag: 2, realTalk: 0.31, professionalVisuals: 0.18, overView: 0.13, socialExpert: 0.16, bfcmSale: 0.14, loanOfficer: 0.24, label: "2 weeks" },
    { lag: 3, realTalk: 0.35, professionalVisuals: 0.22, overView: 0.17, socialExpert: 0.21, bfcmSale: 0.09, loanOfficer: 0.28, label: "3 weeks" },
    { lag: 4, realTalk: 0.40, professionalVisuals: 0.25, overView: 0.18, socialExpert: 0.23, bfcmSale: 0.05, loanOfficer: 0.31, label: "4 weeks" },
    { lag: 8, realTalk: 0.28, professionalVisuals: 0.31, overView: 0.19, socialExpert: 0.29, bfcmSale: -0.04, loanOfficer: 0.22, label: "8 weeks" },
    { lag: 12, realTalk: 0.32, professionalVisuals: 0.26, overView: 0.26, socialExpert: 0.27, bfcmSale: -0.08, loanOfficer: 0.25, label: "12 weeks" },
    { lag: 16, realTalk: 0.27, professionalVisuals: 0.24, overView: 0.21, socialExpert: 0.18, bfcmSale: -0.11, loanOfficer: 0.33, label: "16 weeks" },
    { lag: 20, realTalk: 0.29, professionalVisuals: 0.28, overView: 0.25, socialExpert: 0.14, bfcmSale: -0.13, loanOfficer: 0.28, label: "20 weeks" },
    { lag: 24, realTalk: 0.25, professionalVisuals: 0.23, overView: 0.22, socialExpert: 0.11, bfcmSale: -0.15, loanOfficer: 0.24, label: "24 weeks" }
  ];
  
  // Quarter data sets
  const q1Data = fullCorrelationData.slice(0, 13);  // 0-12 weeks
  const q2Data = fullCorrelationData.slice(13, 25); // 13-24 weeks
  
  // Landing page data by quarter
  const landingPagePerformance = [
    {
      quarter: "Q1 (Jun-Aug '24)",
      realTalk: 0.27,
      professionalVisuals: 0.31,
      overView: 0.22,
      socialExpert: 0.0,
      bfcmSale: 0.0,
      loanOfficer: 0.0,
      totalConversions: 2181
    },
    {
      quarter: "Q2 (Sep-Nov '24)",
      realTalk: 0.39,
      professionalVisuals: 0.18,
      overView: 0.14,
      socialExpert: 0.13,
      bfcmSale: 0.42,
      loanOfficer: 0.0,
      totalConversions: 3344
    },
    {
      quarter: "Q3 (Dec-Feb '25)",
      realTalk: 0.18,
      professionalVisuals: 0.12,
      overView: 0.35,
      socialExpert: 0.33,
      bfcmSale: 0.05,
      loanOfficer: 0.31,
      totalConversions: 2414
    }
  ];

  // Extended correlation data with 36 weeks
  const extendedCorrelationData = [
    { landingPage: "Real Talk", week0: 0.34, week1: 0.28, week2: 0.31, week4: 0.40, week8: 0.28, week12: 0.32, week16: 0.27, week20: 0.40, week24: 0.30, week28: 0.20, week32: 0.30, week36: 0.40 },
    { landingPage: "Prof Visuals", week0: 0.15, week1: 0.12, week2: 0.18, week4: 0.25, week8: 0.31, week12: 0.26, week16: 0.24, week20: 0.21, week24: 0.19, week28: 0.17, week32: 0.16, week36: 0.15 },
    { landingPage: "BFCM Sale", week0: 0.42, week1: 0.31, week2: 0.14, week4: 0.05, week8: -0.04, week12: -0.08, week16: -0.11, week20: -0.13, week24: -0.15, week28: -0.17, week32: -0.18, week36: -0.19 },
    { landingPage: "Social Expert", week0: 0.08, week1: 0.13, week2: 0.16, week4: 0.23, week8: 0.29, week12: 0.27, week16: 0.18, week20: 0.23, week24: 0.20, week28: 0.18, week32: 0.16, week36: 0.15 },
    { landingPage: "OverView", week0: 0.11, week1: 0.09, week2: 0.13, week4: 0.18, week8: 0.19, week12: 0.26, week16: 0.21, week20: 0.23, week24: 0.21, week28: 0.24, week32: 0.18, week36: 0.21 },
    { landingPage: "Loan Officer", week0: 0.21, week1: 0.18, week2: 0.24, week4: 0.31, week8: 0.22, week12: 0.25, week16: 0.33, week20: 0.59, week24: 0.57, week28: 0.51, week32: 0.42, week36: 0.32 }
  ];
  
  // Budget thresholds
  const budgetThresholds = [
    { landingPage: "Real Talk", min: 30, max: 50, description: "Requires minimum 30% budget allocation" },
    { landingPage: "Prof Visuals", min: 55, max: 70, description: "Most effective at 55-70% budget allocation" },
    { landingPage: "BFCM Sale", min: 20, max: 60, description: "Effective even at 20% allocation, optimal at 40%+" },
    { landingPage: "Social Expert", min: 35, max: 40, description: "Most effective at 35-40% allocation" },
    { landingPage: "OverView", min: 10, max: 20, description: "Most effective at 10-20% allocation" },
    { landingPage: "Loan Officer", min: 15, max: 25, description: "Most effective at 15-25% allocation, diminishing returns above 30%" }
  ];
  
  // Optimal allocations by time period
  const optimalAllocations = [
    {
      period: "Immediate (0-2 weeks)",
      allocations: [
        { landingPage: "BFCM Sale", min: 40, max: 60, value: 50 },
        { landingPage: "Real Talk", min: 25, max: 30, value: 27.5 },
        { landingPage: "Others", min: 10, max: 35, value: 22.5 }
      ]
    },
    {
      period: "Near-Term (3-6 weeks)",
      allocations: [
        { landingPage: "Real Talk", min: 40, max: 50, value: 45 },
        { landingPage: "Loan Officer", min: 15, max: 20, value: 17.5 },
        { landingPage: "Others", min: 30, max: 45, value: 37.5 }
      ]
    },
    {
      period: "Mid-Term (7-10 weeks)",
      allocations: [
        { landingPage: "Prof Visuals", min: 30, max: 40, value: 35 },
        { landingPage: "Social Expert", min: 30, max: 35, value: 32.5 },
        { landingPage: "Others", min: 25, max: 40, value: 32.5 }
      ]
    },
    {
      period: "Long-Term (11-20 weeks)",
      allocations: [
        { landingPage: "Loan Officer", min: 25, max: 30, value: 27.5 },
        { landingPage: "OverView", min: 20, max: 25, value: 22.5 },
        { landingPage: "Real Talk", min: 15, max: 25, value: 20 },
        { landingPage: "Others", min: 20, max: 40, value: 30 }
      ]
    },
    {
      period: "Extended (21-36 weeks)",
      allocations: [
        { landingPage: "Loan Officer", min: 30, max: 40, value: 35 },
        { landingPage: "Real Talk", min: 20, max: 30, value: 25 },
        { landingPage: "OverView", min: 15, max: 25, value: 20 },
        { landingPage: "Others", min: 10, max: 35, value: 20 }
      ]
    }
  ];
  
  // Chart colors
  const colors = {
    "Real Talk": "#1f77b4",
    "Prof Visuals": "#ff7f0e",
    "BFCM Sale": "#2ca02c",
    "Social Expert": "#d62728",
    "OverView": "#9467bd",
    "Loan Officer": "#8c564b",
    "Others": "#e377c2"
  };
  
  // Format correlation data for line chart
  const getLineChartData = () => {
    const weeks = [0, 1, 2, 4, 8, 12, 16, 20, 24, 28, 32, 36];
    return weeks.map(week => {
      const dataPoint = { name: `Week ${week}` };
      extendedCorrelationData.forEach(page => {
        dataPoint[page.landingPage] = page[`week${week}`];
      });
      return dataPoint;
    });
  };
  
  // Format budget threshold data for bar chart
  const getBudgetThresholdData = () => {
    return budgetThresholds.map(item => ({
      name: item.landingPage,
      min: item.min,
      max: item.max,
      range: item.max - item.min
    }));
  };

  return (
    <div className="dashboard-container">
      {/* Main Navigation Tabs */}
      <div className="main-tabs">
        <button 
          className={`main-tab ${activeMainTab === 'correlation' ? 'active' : ''}`}
          onClick={() => setActiveMainTab('correlation')}
        >
          Campaign Correlation Analysis
        </button>
        <button 
          className={`main-tab ${activeMainTab === 'landingPage' ? 'active' : ''}`}
          onClick={() => setActiveMainTab('landingPage')}
        >
          36-Week Landing Page Analysis
        </button>
      </div>
      
      {/* Campaign Correlation Dashboard */}
      {activeMainTab === 'correlation' && (
        <div className="correlation-dashboard">
          <h1 className="dashboard-title">Campaign Correlation Analysis</h1>
          
          <div className="tab-container">
            <button 
              className={`tab-button ${activeCorrelationTab === 'fullTimeline' ? 'active' : ''}`}
              onClick={() => setActiveCorrelationTab('fullTimeline')}
            >
              Campaign Type
            </button>
            <button 
              className={`tab-button ${activeCorrelationTab === 'landingPages' ? 'active' : ''}`}
              onClick={() => setActiveCorrelationTab('landingPages')}
            >
              Landing Pages
            </button>
            <button 
              className={`tab-button ${activeCorrelationTab === 'quarter1' ? 'active' : ''}`}
              onClick={() => setActiveCorrelationTab('quarter1')}
            >
              Quarter 1
            </button>
            <button 
              className={`tab-button ${activeCorrelationTab === 'quarter2' ? 'active' : ''}`}
              onClick={() => setActiveCorrelationTab('quarter2')}
            >
              Quarter 2
            </button>
            <button 
              className={`tab-button ${activeCorrelationTab === 'quarterlyPerformance' ? 'active' : ''}`}
              onClick={() => setActiveCorrelationTab('quarterlyPerformance')}
            >
              Quarterly
            </button>
          </div>
          
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={400}>
              {activeCorrelationTab === 'fullTimeline' && (
                <LineChart
                  data={fullCorrelationData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="lag" 
                    label={{ value: 'Weeks After Campaign Spend', position: 'insideBottom', offset: -15 }} 
                  />
                  <YAxis domain={[-0.5, 0.5]} />
                  <Tooltip formatter={(value) => [value.toFixed(2), 'Correlation Coefficient']} />
                  <Legend />
                  <ReferenceLine y={0} stroke="#000" />
                  <Line type="monotone" dataKey="leads" name="Leads Campaigns" stroke="#3182CE" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="trial" name="Trial Campaigns" stroke="#38A169" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              )}
              
              {activeCorrelationTab === 'landingPages' && (
                <LineChart
                  data={landingPageCorrelationData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="lag" 
                    label={{ value: 'Weeks After Landing Page Spend', position: 'insideBottom', offset: -15 }} 
                  />
                  <YAxis domain={[-0.5, 0.5]} />
                  <Tooltip formatter={(value) => [value.toFixed(2), 'Correlation Coefficient']} />
                  <Legend />
                  <ReferenceLine y={0} stroke="#000" />
                  <Line type="monotone" dataKey="realTalk" name="Real Talk" stroke="#3182CE" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="professionalVisuals" name="Professional Visuals" stroke="#38A169" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="overView" name="OverView" stroke="#DD6B20" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="socialExpert" name="Social Expert" stroke="#D53F8C" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="bfcmSale" name="BFCM Sale" stroke="#805AD5" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="loanOfficer" name="Loan Officer" stroke="#2B6CB0" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              )}
              
              {activeCorrelationTab === 'quarter1' && (
                <LineChart
                  data={q1Data}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="lag" 
                    label={{ value: 'Weeks After Campaign Spend', position: 'insideBottom', offset: -15 }} 
                  />
                  <YAxis domain={[-0.5, 0.5]} />
                  <Tooltip formatter={(value) => [value.toFixed(2), 'Correlation Coefficient']} />
                  <Legend />
                  <ReferenceLine y={0} stroke="#000" />
                  <Line type="monotone" dataKey="leads" name="Leads Campaigns" stroke="#3182CE" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="trial" name="Trial Campaigns" stroke="#38A169" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              )}
              
              {activeCorrelationTab === 'quarter2' && (
                <LineChart
                  data={q2Data}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="lag" 
                    label={{ value: 'Weeks After Campaign Spend', position: 'insideBottom', offset: -15 }} 
                  />
                  <YAxis domain={[-0.5, 0.5]} />
                  <Tooltip formatter={(value) => [value.toFixed(2), 'Correlation Coefficient']} />
                  <Legend />
                  <ReferenceLine y={0} stroke="#000" />
                  <Line type="monotone" dataKey="leads" name="Leads Campaigns" stroke="#3182CE" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="trial" name="Trial Campaigns" stroke="#38A169" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              )}
              
              {activeCorrelationTab === 'quarterlyPerformance' && (
                <LineChart
                  data={landingPagePerformance}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="quarter" />
                  <YAxis domain={[0, 0.5]} />
                  <Tooltip formatter={(value) => [value.toFixed(2), 'Correlation Coefficient']} />
                  <Legend />
                  <Line type="monotone" dataKey="realTalk" name="Real Talk" stroke="#3182CE" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="professionalVisuals" name="Professional Visuals" stroke="#38A169" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="overView" name="OverView" stroke="#DD6B20" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="socialExpert" name="Social Expert" stroke="#D53F8C" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="bfcmSale" name="BFCM Sale" stroke="#805AD5" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="loanOfficer" name="Loan Officer" stroke="#2B6CB0" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
          
          <div className="insights-container">
            {activeCorrelationTab === 'fullTimeline' && (
              <div className="insights-section">
                <h3 className="insights-title">Campaign Type Correlation Insights</h3>
                <ul className="insights-list">
                  <li><strong>Trial Campaign Cycle:</strong> Shows clear quarterly peaks at weeks 0 (0.36), 12 (0.31), and 24 (0.29).</li>
                  <li><strong>Lead Campaign Pattern:</strong> Builds momentum over time, with strongest impacts at 19 weeks (0.31) and 24 weeks (0.34).</li>
                  <li><strong>Complementary Effect:</strong> Trial campaigns deliver immediate results while Lead campaigns provide stronger long-term impact.</li>
                  <li><strong>6-Month Convergence:</strong> Both campaign types show strong correlation at 24 weeks, suggesting a complete sales cycle span.</li>
                </ul>
              </div>
            )}
            
            {activeCorrelationTab === 'landingPages' && (
              <div className="insights-section">
                <h3 className="insights-title">Landing Page Correlation Patterns</h3>
                <ul className="insights-list">
                  <li><strong>Real Talk:</strong> Strong immediate impact (0.34) with peak at 4 weeks (0.40), maintaining positive correlation throughout.</li>
                  <li><strong>Professional Visuals:</strong> Strongest impact at 8 weeks (0.31), suggesting better for lead nurturing than immediate conversions.</li>
                  <li><strong>BFCM Sale:</strong> Highest immediate correlation (0.42) but drops quickly, ideal for promotional periods.</li>
                  <li><strong>Social Expert:</strong> Builds gradually to peak at 8 weeks (0.29), good for relationship building with existing leads.</li>
                  <li><strong>Loan Officer:</strong> Shows distinct peaks at 4 weeks (0.31) and 16 weeks (0.33), suggesting multi-stage impact.</li>
                  <li><strong>OverView:</strong> Consistent moderate performance with strongest impact at 12 weeks (0.26).</li>
                </ul>
              </div>
            )}
            
            {activeCorrelationTab === 'quarterlyPerformance' && (
              <div className="insights-section">
                <h3 className="insights-title">Quarterly Landing Page Performance</h3>
                <ul className="insights-list">
                  <li><strong>Q1 (Jun-Aug '24):</strong> Professional Visuals led with 0.31 correlation, Real Talk emerged late with 0.27 correlation. Total: 2,181 conversions.</li>
                  <li><strong>Q2 (Sep-Nov '24):</strong> Real Talk dominated (0.39) with BFCM Sale providing exceptional seasonal boost (0.42). Highest performing quarter with 3,344 conversions.</li>
                  <li><strong>Q3 (Dec-Feb '25):</strong> Diversified approach with OverView (0.35), Social Expert (0.33), and Loan Officer (0.31) all performing strongly. Total: 2,414 conversions.</li>
                </ul>
              </div>
            )}
            
            <div className="recommendations-section">
              <h3 className="recommendations-title">Strategic Landing Page Recommendations</h3>
              <ul className="recommendations-list">
                <li><strong>Landing Page Rotation Strategy:</strong> Maintain Real Talk as foundation (25-30% of budget) with seasonal offerings like BFCM Sale (30-40%) during promotional periods.</li>
                <li><strong>Timing Optimization:</strong> Launch Professional Visuals 8 weeks before expected peaks, BFCM Sale 1-2 weeks before promotions, and Social Expert 8-10 weeks ahead of seasonal lulls.</li>
                <li><strong>Audience Segmentation:</strong> Use Loan Officer and OverView for acquisition, Real Talk for general conversion, Social Expert for relationship building, and BFCM Sale for time-sensitive promotions.</li>
                <li><strong>Budget Allocation Cadence:</strong> Implement 90-day landing page cycles with gradual transitions, shifting no more than 15-20% of budget between landing pages in a single week.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
      
      {/* Landing Page Extended Analysis Dashboard */}
      {activeMainTab === 'landingPage' && (
        <div className="landing-page-dashboard">
          <h1 className="dashboard-title">36-Week Landing Page Budget Impact Analysis</h1>
          
          {/* Navigation Tabs */}
          <div className="tab-container">
            <button 
              className={`tab-button ${activeLandingPageTab === 'correlation' ? 'active' : ''}`}
              onClick={() => setActiveLandingPageTab('correlation')}
            >
              36-Week Correlation
            </button>
            <button 
              className={`tab-button ${activeLandingPageTab === 'budgets' ? 'active' : ''}`}
              onClick={() => setActiveLandingPageTab('budgets')}
            >
              Budget Thresholds
            </button>
            <button 
              className={`tab-button ${activeLandingPageTab === 'allocations' ? 'active' : ''}`}
              onClick={() => setActiveLandingPageTab('allocations')}
            >
              Long-Term Allocations
            </button>
            <button 
              className={`tab-button ${activeLandingPageTab === 'table' ? 'active' : ''}`}
              onClick={() => setActiveLandingPageTab('table')}
            >
              Data Table
            </button>
          </div>
          
          {/* Content based on active tab */}
          {activeLandingPageTab === 'correlation' && (
            <div className="content-section">
              <h2 className="section-title">Extended 36-Week Correlation Analysis</h2>
              <p className="section-description">This chart shows how each landing page's budget allocation correlates with conversion performance over a full 36-week period.</p>
              
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart
                    data={getLineChartData()}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[-0.2, 0.7]} tickFormatter={(value) => value.toFixed(2)} />
                    <Tooltip formatter={(value) => value.toFixed(2)} />
                    <Legend />
                    <ReferenceLine y={0} stroke="#000000" strokeDasharray="3 3" />
                    {extendedCorrelationData && extendedCorrelationData.length > 0 ? extendedCorrelationData.map(function(item) {
                      return (
                        <Line
                          key={item.landingPage}
                          type="monotone" 
                          dataKey={item.landingPage}
                          stroke={colors[item.landingPage]}
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      );
                    }) : null}
                  </LineChart>
                </ResponsiveContainer>
              </div>
              
              <div className="insights-section bg-light">
                <h3 className="insights-title">Extended Timeline Insights:</h3>
                <ul className="insights-list">
                  <li><span className="emphasis">Loan Officer</span>: Emerges as a long-term powerhouse with peak correlation of 0.59 at Week 20</li>
                  <li><span className="emphasis">Real Talk</span>: Shows cyclical effectiveness with peaks at Weeks 4, 20, and 36</li>
                  <li><span className="emphasis">BFCM Sale</span>: Continues to decline, reaching -0.19 by Week 36</li>
                  <li><span className="emphasis">OverView</span>: Maintains consistent performance with small fluctuations throughout</li>
                  <li><span className="emphasis">Prof Visuals</span>: Gradually declines after Week 8 peak, stabilizing around 0.15-0.17</li>
                  <li><span className="emphasis">Social Expert</span>: Shows secondary smaller peak around Week 20</li>
                </ul>
              </div>
            </div>
          )}
          
          {activeLandingPageTab === 'budgets' && (
            <div className="content-section">
              <h2 className="section-title">Optimal Budget Allocation Ranges</h2>
              <p className="section-description">This chart shows the recommended budget allocation range for each landing page based on historical performance.</p>
              
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart
                    data={getBudgetThresholdData()}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                    <YAxis type="category" dataKey="name" width={100} />
                    <Tooltip formatter={(value) => `${value}%`} />
                    <Legend />
                    <Bar dataKey="min" name="Minimum %" stackId="a" fill="#8884d8" />
                    <Bar dataKey="range" name="Optimal Range" stackId="a" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              <div className="threshold-grid">
                {budgetThresholds.map(threshold => (
                  <div key={threshold.landingPage} className="threshold-card">
                    <h3 className="card-title">{threshold.landingPage}</h3>
                    <p className="card-description">{threshold.description}</p>
                    <p className="card-range">Optimal Range: {threshold.min}% - {threshold.max}%</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {activeLandingPageTab === 'allocations' && (
            <div className="content-section">
              <h2 className="section-title">Long-Term Budget Allocation Strategy</h2>
              <p className="section-description">These charts show the ideal budget allocation mix across the full 36-week timeline, optimized for different time horizons.</p>
              
              <div className="allocation-grid">
                {optimalAllocations.map(allocation => (
                  <div key={allocation.period} className="allocation-card">
                    <h3 className="card-title">{allocation.period}</h3>
                    <div className="chart-container small">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={allocation.allocations}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="landingPage" />
                          <YAxis domain={[0, 60]} tickFormatter={(value) => `${value}%`} />
                          <Tooltip formatter={(value) => `${value}%`} />
                          <Bar dataKey="value" name="Recommended %" fill="#8884d8" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="allocation-details">
                      {allocation.allocations.map(a => (
                        <p key={a.landingPage} className="allocation-range">
                          <span className="emphasis">{a.landingPage}:</span> {a.min}% - {a.max}%
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="insights-section bg-light">
                <h3 className="insights-title">Long-Term Strategy Insights:</h3>
                <ul className="insights-list">
                  <li>The extended data reveals Loan Officer as the most valuable landing page for long-term performance (21-36 weeks)</li>
                  <li>Real Talk provides sustained value across all time periods, making it essential for base allocation</li>
                  <li>BFCM Sale should be completely phased out by Week 8 to avoid negative correlation</li>
                  <li>Consider seasonality when implementing this strategy (e.g., adjust for holiday periods)</li>
                  <li>For campaigns lasting 6+ months, prioritize Loan Officer, Real Talk, and OverView for consistent results</li>
                </ul>
              </div>
            </div>
          )}
          
          {activeLandingPageTab === 'table' && (
            <div className="content-section">
              <h2 className="section-title">Extended Correlation Data Table</h2>
              <p className="section-description">This table shows the correlation between budget allocation and conversions across the full 36-week period.</p>
              
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Landing Page</th>
                      <th>Week 0</th>
                      <th>Week 1</th>
                      <th>Week 2</th>
                      <th>Week 4</th>
                      <th>Week 8</th>
                      <th>Week 12</th>
                      <th>Week 16</th>
                      <th>Week 20</th>
                      <th>Week 24</th>
                      <th>Week 28</th>
                      <th>Week 32</th>
                      <th>Week 36</th>
                    </tr>
                  </thead>
                  <tbody>
                    {extendedCorrelationData.map(row => (
                      <tr key={row.landingPage}>
                        <td className="page-name">{row.landingPage}</td>
                        <td className={row.week0 > 0.3 ? 'high-value' : (row.week0 < 0 ? 'negative-value' : '')}>+{row.week0.toFixed(2)}</td>
                        <td className={row.week1 > 0.3 ? 'high-value' : (row.week1 < 0 ? 'negative-value' : '')}>+{row.week1.toFixed(2)}</td>
                        <td className={row.week2 > 0.3 ? 'high-value' : (row.week2 < 0 ? 'negative-value' : '')}>+{row.week2.toFixed(2)}</td>
                        <td className={row.week4 > 0.3 ? 'high-value' : (row.week4 < 0 ? 'negative-value' : '')}>+{row.week4.toFixed(2)}</td>
                        <td className={row.week8 > 0.3 ? 'high-value' : (row.week8 < 0 ? 'negative-value' : '')}>{row.week8 >= 0 ? '+' : ''}{row.week8.toFixed(2)}</td>
                        <td className={row.week12 > 0.3 ? 'high-value' : (row.week12 < 0 ? 'negative-value' : '')}>{row.week12 >= 0 ? '+' : ''}{row.week12.toFixed(2)}</td>
                        <td className={row.week16 > 0.3 ? 'high-value' : (row.week16 < 0 ? 'negative-value' : '')}>{row.week16 >= 0 ? '+' : ''}{row.week16.toFixed(2)}</td>
                        <td className={row.week20 > 0.3 ? 'high-value' : (row.week20 < 0 ? 'negative-value' : '')}>{row.week20 >= 0 ? '+' : ''}{row.week20.toFixed(2)}</td>
                        <td className={row.week24 > 0.3 ? 'high-value' : (row.week24 < 0 ? 'negative-value' : '')}>{row.week24 >= 0 ? '+' : ''}{row.week24.toFixed(2)}</td>
                        <td className={row.week28 > 0.3 ? 'high-value' : (row.week28 < 0 ? 'negative-value' : '')}>{row.week28 >= 0 ? '+' : ''}{row.week28.toFixed(2)}</td>
                        <td className={row.week32 > 0.3 ? 'high-value' : (row.week32 < 0 ? 'negative-value' : '')}>{row.week32 >= 0 ? '+' : ''}{row.week32.toFixed(2)}</td>
                        <td className={row.week36 > 0.3 ? 'high-value' : (row.week36 < 0 ? 'negative-value' : '')}>{row.week36 >= 0 ? '+' : ''}{row.week36.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="strategic-recs">
                <h2 className="section-title">36-Week Strategic Recommendations</h2>
                
                <div className="strategy-grid">
                  <div className="strategy-card">
                    <h3 className="card-title">Extended Campaign Foundation</h3>
                    <ul className="strategy-list">
                      <li>Maintain Loan Officer at 20-40% allocation for weeks 16-36</li>
                      <li>Allocate 20-30% to Real Talk throughout, increasing at weeks 4, 20, and 36</li>
                      <li>Reserve 15-20% for OverView to provide consistent long-term pipeline</li>
                      <li>Phase out BFCM Sale completely after week 8</li>
                    </ul>
                  </div>
                  
                  <div className="strategy-card">
                    <h3 className="card-title">9-Month Growth Acceleration</h3>
                    <ul className="strategy-list">
                      <li><span className="emphasis">Months 1-2:</span> Focus on Real Talk (40%) + Loan Officer (15%)</li>
                      <li><span className="emphasis">Months 3-4:</span> Shift to Prof Visuals (35%) + Social Expert (30%)</li>
                      <li><span className="emphasis">Months 5-6:</span> Increase Loan Officer (30%) + OverView (20%)</li>
                      <li><span className="emphasis">Months 7-9:</span> Maximize Loan Officer (40%) with Real Talk (30%) support</li>
                    </ul>
                  </div>
                  
                  <div className="strategy-card">
                    <h3 className="card-title">Cyclical Pattern Utilization</h3>
                    <ul className="strategy-list">
                      <li>Real Talk: Increase budget at Weeks 4, 12, 20, 28, 36 to align with natural effectiveness peaks</li>
                      <li>Loan Officer: Plan major budget increases at Weeks 16-20 and 36</li>
                      <li>OverView: Provide steady allocation with slight increases at Weeks 12 and 28</li>
                      <li>Social Expert: Focus allocation at Weeks 8-12 and 20-24</li>
                    </ul>
                  </div>
                  
                  <div className="strategy-card">
                    <h3 className="card-title">Seasonal Considerations</h3>
                    <ul className="strategy-list">
                      <li>Summer Months: Increase Professional Visuals allocation</li>
                      <li>Q1 (Jan-Mar): Boost Social Expert allocation</li>
                      <li>Holiday/Promotional Periods: Only use BFCM Sale for immediate impact</li>
                      <li>Year-Round: Maintain Real Talk as foundation at 25-35%</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CombinedDashboard;
