import React, { useState } from 'react';
import CombinedDashboard from './CombinedDashboard';
import RealTalkDashboard from './RealTalkDashboard';
import './DashboardContainer.css'; // We'll create this file next

// Empty dashboard container template for future analytics
const EmptyDashboard = ({ title, description }) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h1 className="text-2xl font-bold mb-4">{title}</h1>
      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-xl font-medium text-gray-700">{description}</p>
          <p className="text-gray-500 mt-2">This dashboard will be implemented in a future update</p>
        </div>
      </div>
    </div>
  );
};

// Dashboard registry - Add new dashboards here as they're created
const DASHBOARDS = [
  {
    id: 'main',
    name: 'Correlation Analysis',
    component: CombinedDashboard,
    customClass: 'correlation-dashboard-wrapper',
  },
  {
    id: 'realtalk',
    name: 'RealTalk Analytics',
    component: RealTalkDashboard,
  },
  {
    id: 'audience',
    name: 'Audience Insights',
    component: () => <EmptyDashboard 
      title="Audience Insights Dashboard" 
      description="Detailed demographic and behavioral analysis" 
    />,
  },
  {
    id: 'creative',
    name: 'Creative Performance',
    component: () => <EmptyDashboard 
      title="Creative Performance Dashboard" 
      description="A/B testing and creative element analysis" 
    />,
  },
  {
    id: 'funnel',
    name: 'Conversion Funnel',
    component: () => <EmptyDashboard 
      title="Conversion Funnel Dashboard" 
      description="User journey and conversion path analysis" 
    />,
  },
];

// Custom wrapper component for the Correlation Analysis dashboard
const CorrelationDashboardWrapper = ({ children }) => {
  return (
    <div className="correlation-dashboard-wrapper">
      {children}
    </div>
  );
};

// Default wrapper for other dashboards
const DefaultDashboardWrapper = ({ children }) => {
  return (
    <div className="default-dashboard-wrapper">
      {children}
    </div>
  );
};

const DashboardContainer = () => {
  const [activeDashboard, setActiveDashboard] = useState('main');

  // Find the active dashboard from our registry
  const currentDashboard = DASHBOARDS.find(dash => dash.id === activeDashboard) || DASHBOARDS[0];
  
  // Dynamically render the selected dashboard component
  const DashboardComponent = currentDashboard.component;

  // Choose the appropriate wrapper based on dashboard type
  const WrapperComponent = currentDashboard.id === 'main' 
    ? CorrelationDashboardWrapper 
    : DefaultDashboardWrapper;

  return (
    <div className="dashboard-app">
      {/* Dashboard Navigation Bar */}
      <div className="dashboard-nav">
        <div className="dashboard-nav-content">
          <h1 className="dashboard-logo">AI Ads Manager</h1>
          
          <div className="dashboard-nav-tabs">
            {DASHBOARDS.map(dashboard => (
              <button
                key={dashboard.id}
                onClick={() => setActiveDashboard(dashboard.id)}
                className={`dashboard-nav-tab ${
                  activeDashboard === dashboard.id ? 'active' : ''
                }`}
              >
                {dashboard.name}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Dashboard Content */}
      <div className="dashboard-content">
        <WrapperComponent>
          <DashboardComponent />
        </WrapperComponent>
      </div>
    </div>
  );
};

export default DashboardContainer;

