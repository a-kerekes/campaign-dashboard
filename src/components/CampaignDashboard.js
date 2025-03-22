import React, { useState } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  ReferenceLine
} from 'recharts';
import { 
  fullCorrelationData, 
  landingPageCorrelationData,
  landingPagePerformance 
} from '../data/campaignData';
import './CampaignDashboard.css';

const CampaignDashboard = () => {
  const [activeTab, setActiveTab] = useState('fullTimeline');
  
  // Quarter data sets
  const q1Data = fullCorrelationData.slice(0, 13);  // 0-12 weeks
  const q2Data = fullCorrelationData.slice(13, 25); // 13-24 weeks
  
  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">Campaign Correlation Analysis</h1>
      
      <div className="tab-container">
        <button 
          className={`tab-button ${activeTab === 'fullTimeline' ? 'active' : ''}`}
          onClick={() => setActiveTab('fullTimeline')}
        >
          Campaign Type
        </button>
        <button 
          className={`tab-button ${activeTab === 'landingPages' ? 'active' : ''}`}
          onClick={() => setActiveTab('landingPages')}
        >
          Landing Pages
        </button>
        <button 
          className={`tab-button ${activeTab === 'quarter1' ? 'active' : ''}`}
          onClick={() => setActiveTab('quarter1')}
        >
          Quarter 1
        </button>
        <button 
          className={`tab-button ${activeTab === 'quarter2' ? 'active' : ''}`}
          onClick={() => setActiveTab('quarter2')}
        >
          Quarter 2
        </button>
        <button 
          className={`tab-button ${activeTab === 'quarterlyPerformance' ? 'active' : ''}`}
          onClick={() => setActiveTab('quarterlyPerformance')}
        >
          Quarterly
        </button>
      </div>
      
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={400}>
          {activeTab === 'fullTimeline' && (
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
          
          {activeTab === 'landingPages' && (
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
          
          {activeTab === 'quarter1' && (
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
          
          {activeTab === 'quarter2' && (
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
          
          {activeTab === 'quarterlyPerformance' && (
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
        {activeTab === 'fullTimeline' && (
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
        
        {activeTab === 'landingPages' && (
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
        
        {activeTab === 'quarterlyPerformance' && (
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
  );
};

export default CampaignDashboard;
