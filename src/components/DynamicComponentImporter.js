// src/components/DynamicComponentImporter.js

import React, { useState, useEffect } from 'react';
import { transform } from '@babel/standalone';
import * as recharts from 'recharts';
import './DynamicComponentImporter.css';  // Make sure this file exists

const DynamicComponentImporter = () => {
  const [componentCode, setComponentCode] = useState('');
  const [componentName, setComponentName] = useState('');
  const [renderedComponent, setRenderedComponent] = useState(null);
  const [error, setError] = useState(null);
  const [savedComponents, setSavedComponents] = useState([]);
  const [selectedSaved, setSelectedSaved] = useState(null);
  const [viewMode, setViewMode] = useState('import'); // 'import' or 'view'

  useEffect(() => {
    // Load saved components from localStorage when component mounts
    const saved = localStorage.getItem('savedDynamicComponents');
    if (saved) {
      try {
        setSavedComponents(JSON.parse(saved));
      } catch (e) {
        console.error("Error loading saved components:", e);
      }
    }
  }, []);

  const compileAndRender = () => {
    try {
      setError(null);
      
      // Process the code to handle imports
      let processedCode = componentCode;
      
      // Extract imports and remove them from the code
      const importRegex = /import\s+(?:.+\s+from\s+)?['"]([^'"]+)['"]/g;
      const imports = [];
      let match;
      
      while ((match = importRegex.exec(componentCode)) !== null) {
        imports.push(match[0]);
      }
      
      // Remove import statements
      processedCode = processedCode.replace(/import\s+(?:.+\s+from\s+)?['"][^'"]+['"]/g, '');
      
      // Transform JSX to JavaScript
      const transformedCode = transform(processedCode, {
        presets: ['react'],
      }).code;
      
      // Create a dynamic module
      // eslint-disable-next-line no-new-func
      const moduleFn = new Function(
        'module', 
        'require', 
        'React', 
        'recharts',
        transformedCode
      );
      
      // Mock require function to provide libraries
      const requireFn = (lib) => {
        if (lib === 'react') return React;
        if (lib === 'recharts') return recharts;
        throw new Error(`Library ${lib} is not supported in dynamic imports`);
      };
      
      // Create a module object
      const dynamicModule = { exports: {} };
      
      // Execute the module function
      moduleFn(dynamicModule, requireFn, React, recharts);
      
      // Get the component from the exports
      let DynamicComponent = dynamicModule.exports.default || dynamicModule.exports;
      
      if (!DynamicComponent) {
        // Try to find any exported component
        const exportKeys = Object.keys(dynamicModule.exports);
        if (exportKeys.length > 0) {
          DynamicComponent = dynamicModule.exports[exportKeys[0]];
        }
      }
      
      if (!DynamicComponent) {
        throw new Error("No component found in the exported code. Make sure it has a default export or named export.");
      }
      
      // Set the rendered component
      setRenderedComponent(<DynamicComponent />);
    } catch (err) {
      console.error("Error compiling component:", err);
      setError(err.message);
    }
  };

  const saveComponent = () => {
    if (!componentName || !componentCode) {
      setError("Component name and code are required to save");
      return;
    }

    const newComponent = {
      name: componentName,
      code: componentCode,
      timestamp: new Date().toISOString()
    };

    const updatedComponents = [...savedComponents, newComponent];
    setSavedComponents(updatedComponents);
    
    // Save to localStorage
    localStorage.setItem('savedDynamicComponents', JSON.stringify(updatedComponents));
    
    setError(null);
    alert(`Visualization "${componentName}" has been saved successfully!`);
  };

  const loadSavedComponent = (component) => {
    setComponentCode(component.code);
    setComponentName(component.name);
    setSelectedSaved(component.name);
    
    // Compile and render the loaded component
    try {
      // Process the code to handle imports
      let processedCode = component.code;
      
      // Remove import statements
      processedCode = processedCode.replace(/import\s+(?:.+\s+from\s+)?['"][^'"]+['"]/g, '');
      
      // Transform JSX to JavaScript
      const transformedCode = transform(processedCode, {
        presets: ['react'],
      }).code;
      
      // Create a dynamic module
      // eslint-disable-next-line no-new-func
      const moduleFn = new Function(
        'module', 
        'require', 
        'React', 
        'recharts',
        transformedCode
      );
      
      const requireFn = (lib) => {
        if (lib === 'react') return React;
        if (lib === 'recharts') return recharts;
        throw new Error(`Library ${lib} is not supported in dynamic imports`);
      };
      
      const dynamicModule = { exports: {} };
      moduleFn(dynamicModule, requireFn, React, recharts);
      
      let DynamicComponent = dynamicModule.exports.default || dynamicModule.exports;
      
      if (!DynamicComponent) {
        // Try to find any exported component
        const exportKeys = Object.keys(dynamicModule.exports);
        if (exportKeys.length > 0) {
          DynamicComponent = dynamicModule.exports[exportKeys[0]];
        }
      }
      
      if (DynamicComponent) {
        setRenderedComponent(<DynamicComponent />);
      }
    } catch (err) {
      console.error("Error loading component:", err);
      setError(err.message);
    }
  };

  const deleteSavedComponent = (componentToDelete, event) => {
    if (event) {
      event.stopPropagation();
    }
    const updatedComponents = savedComponents.filter(comp => comp.name !== componentToDelete.name);
    setSavedComponents(updatedComponents);
    localStorage.setItem('savedDynamicComponents', JSON.stringify(updatedComponents));
    
    if (selectedSaved === componentToDelete.name) {
      setSelectedSaved(null);
      setRenderedComponent(null);
    }
  };

  return (
    <div className="dynamic-component-importer">
      {/* Tab Buttons */}
      <div>
        <button onClick={() => setViewMode('import')}>Import Visualization</button>
        <button onClick={() => setViewMode('view')}>View Saved Visualizations</button>
      </div>
      
      {/* Import Section */}
      {viewMode === 'import' && (
        <div className="import-section">
          <div className="form-group">
            <label>Visualization Name:</label>
            <input
              type="text"
              value={componentName}
              onChange={(e) => setComponentName(e.target.value)}
              placeholder="Enter a name for this visualization"
            />
          </div>
          
          <div className="form-group">
            <label>Paste Component Code from Claude:</label>
            <textarea
              value={componentCode}
              onChange={(e) => setComponentCode(e.target.value)}
              rows="15"
              placeholder="Paste the React component code here..."
            />
          </div>
          
          <div className="button-group">
            <button onClick={compileAndRender}>Preview</button>
            <button 
              onClick={saveComponent}
              disabled={!componentName || !componentCode}
            >
              Save Visualization
            </button>
          </div>
          
          {error && (
            <div className="error-message">
              <p>Error: {error}</p>
            </div>
          )}
          
          {renderedComponent && (
            <div className="preview-container">
              <h3>Preview:</h3>
              <div className="preview-content">
                {renderedComponent}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* View Saved Visualizations Section */}
      {viewMode === 'view' && (
        <div className="view-section">
          <h3>Saved Visualizations</h3>
          
          {savedComponents.length === 0 ? (
            <p>No visualizations have been saved yet. Import one to get started.</p>
          ) : (
            <>
              <div className="saved-components-list">
                {savedComponents.map((comp) => (
                  <div 
                    key={comp.name}
                    className={`saved-component-item ${selectedSaved === comp.name ? 'selected' : ''}`}
                    onClick={() => loadSavedComponent(comp)}
                  >
                    <span className="component-name">{comp.name}</span>
                    <span className="component-timestamp">
                      {new Date(comp.timestamp).toLocaleDateString()}
                    </span>
                    <button
                      onClick={(e) => deleteSavedComponent(comp, e)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              
              {renderedComponent && (
                <div className="visualization-container">
                  <h3>{selectedSaved}</h3>
                  <div className="visualization-content">
                    {renderedComponent}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default DynamicComponentImporter;
