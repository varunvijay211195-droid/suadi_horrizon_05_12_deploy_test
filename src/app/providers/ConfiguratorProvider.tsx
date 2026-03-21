import React, { createContext, useContext, useState, ReactNode } from 'react';

interface Equipment {
  id: string;
  name: string;
  compatibilityId: string;
}

interface ConfiguratorState {
  selectedEquipment: Equipment | null;
  compatibleProducts: any[];
  isConfiguratorOpen: boolean;
}

interface ConfiguratorContextType extends ConfiguratorState {
  selectEquipment: (equipment: Equipment) => void;
  clearEquipment: () => void;
  toggleConfigurator: () => void;
  closeConfigurator: () => void;
}

const ConfiguratorContext = createContext<ConfiguratorContextType | undefined>(undefined);

interface ConfiguratorProviderProps {
  children: ReactNode;
  equipmentTypes: any[];
  products: any[];
}

export const ConfiguratorProvider: React.FC<ConfiguratorProviderProps> = ({ 
  children, 
  equipmentTypes, 
  products 
}) => {
  const [state, setState] = useState<ConfiguratorState>({
    selectedEquipment: null,
    compatibleProducts: [],
    isConfiguratorOpen: false,
  });

  const selectEquipment = (equipment: Equipment) => {
    const compatibleProducts = products.filter((product) => 
      product.compatibility.includes(equipment.compatibilityId)
    );
    
    setState({
      ...state,
      selectedEquipment: equipment,
      compatibleProducts,
      isConfiguratorOpen: true,
    });
  };

  const clearEquipment = () => {
    setState({
      ...state,
      selectedEquipment: null,
      compatibleProducts: [],
      isConfiguratorOpen: false,
    });
  };

  const toggleConfigurator = () => {
    setState({
      ...state,
      isConfiguratorOpen: !state.isConfiguratorOpen,
    });
  };

  const closeConfigurator = () => {
    setState({
      ...state,
      isConfiguratorOpen: false,
    });
  };

  const value: ConfiguratorContextType = {
    ...state,
    selectEquipment,
    clearEquipment,
    toggleConfigurator,
    closeConfigurator,
  };

  return (
    <ConfiguratorContext.Provider value={value}>
      {children}
    </ConfiguratorContext.Provider>
  );
};

export const useConfigurator = () => {
  const context = useContext(ConfiguratorContext);
  if (context === undefined) {
    throw new Error('useConfigurator must be used within a ConfiguratorProvider');
  }
  return context;
};
