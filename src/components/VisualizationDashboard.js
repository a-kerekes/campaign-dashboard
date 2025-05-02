// src/components/VisualizationDashboard.js

import React, { useState } from 'react';
import DynamicComponentImporter from './DynamicComponentImporter';
import './VisualizationDashboard.css';

const VisualizationDashboard = () => {
  const [activeTab, setActiveTab] = useState('importer');
  
  return (
    <div className="visualization-dashboard">
      <div className="visualization-tabs">
        <button 
          className={`visualization-tab ${activeTab === 'importer' ? 'active' : ''}`}
          onClick={() => setActiveTab('importer')}
        >
          Import Visualizations
        </button>
        <button 
          className={`visualization-tab ${activeTab === 'help' ? 'active' : ''}`}
          onClick={() => setActiveTab('help')}
        >
          Help & Documentation
        </button>
      </div>
      
      <div className="visualization-content">
        {activeTab === 'importer' && (
          <DynamicComponentImporter />
        )}
        
        {activeTab === 'help' && (
          <div className="help-section">
            <h2>How to Import Visualizations</h2>
            
            <div className="help-card">
              <h3>Step 1: Get Visualization Code from Claude</h3>
              <p>Ask Claude to create a visualization for your data. Request React component code that uses the recharts library.</p>
              <div className="example">
                <h4>Example Request:</h4>
                <p><em>"Can you create a React visualization for my landing page data showing conversion rates and traffic?"</em></p>
              </div>
            </div>
            
            <div className="help-card">
              <h3>Step 2: Copy the Full Component Code</h3>
              <p>Copy the entire React component code that Claude provides, including the import statements and the export statement.</p>
              <div className="help-tip">
                <strong>Tip:</strong> Make sure to get the complete code including all functions and data structures.
              </div>
            </div>
            
            <div className="help-card">
              <h3>Step 3: Paste and Preview</h3>
              <p>Switch to the "Import Visualizations" tab, give your visualization a name, paste the code, and click "Preview" to see it rendered.</p>
            </div>
            
            <div className="help-card">
              <h3>Step 4: Save Your Visualization</h3>
              <p>If the preview looks good, click "Save" to store the visualization. It will be available in the saved visualizations section.</p>
            </div>
            
            <div className="help-card">
              <h3>Supported Features:</h3>
              <ul>
                <li>Line charts, bar charts, pie charts, and other recharts components</li>
                <li>Custom tooltips and legends</li>
                <li>Interactive chart elements</li>
                <li>Data tables and insights sections</li>
                <li>React components with state management</li>
              </ul>
            </div>
            
            <div className="help-card help-limitations">
              <h3>Limitations:</h3>
              <ul>
                <li>Only supports React and recharts library components</li>
                <li>Cannot connect to external APIs or databases</li>
                <li>Limited to visualizations that can be rendered client-side</li>
                <li>Does not support file uploads (data must be included in the component)</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VisualizationDashboard;
