import React from 'react';

interface ConfiguratorSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

export const ConfiguratorSidebar: React.FC<ConfiguratorSidebarProps> = ({ isOpen, onToggle, children }) => {
  return (
    <div className={`configurator-sidebar ${isOpen ? 'open' : 'closed'}`}>
      <div className="configurator-sidebar-header">
        <h3>Product Configurator</h3>
        <button onClick={onToggle} className="configurator-toggle">
          <span className="visually-hidden">Toggle Configurator</span>
        </button>
      </div>
      <div className="configurator-sidebar-content">
        {children}
      </div>
    </div>
  );
};
