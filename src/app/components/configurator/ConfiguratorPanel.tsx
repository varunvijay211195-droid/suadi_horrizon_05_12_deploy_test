import React from 'react';

interface ConfiguratorPanelProps {
  children: React.ReactNode;
}

export const ConfiguratorPanel: React.FC<ConfiguratorPanelProps> = ({ children }) => {
  return (
    <div className="configurator-panel">
      <div className="configurator-panel-header">
        <h4>Equipment Configuration</h4>
      </div>
      <div className="configurator-panel-content">
        {children}
      </div>
    </div>
  );
};
