export interface Equipment {
  id: string;
  name: string;
  compatibilityId: string;
}

export interface EquipmentType {
  id: string;
  name: string;
  systems: string[];
  brands: EquipmentBrand[];
}

export interface EquipmentBrand {
  id: string;
  name: string;
  models: EquipmentModel[];
}

export interface EquipmentModel {
  id: string;
  name: string;
  yearRanges: string[];
  compatibilityId: string;
}

export interface ConfiguratorState {
  selectedEquipment: Equipment | null;
  compatibleProducts: any[];
  isConfiguratorOpen: boolean;
}

export interface ConfiguratorContextType extends ConfiguratorState {
  selectEquipment: (equipment: Equipment) => void;
  clearEquipment: () => void;
  toggleConfigurator: () => void;
  closeConfigurator: () => void;
}

export interface ConfiguratorProviderProps {
  children: React.ReactNode;
  equipmentTypes: EquipmentType[];
  products: any[];
}

export interface ConfiguratorSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

export interface ConfiguratorPanelProps {
  children: React.ReactNode;
}

export interface ConfiguratorOptionsProps {
  equipmentTypes: EquipmentType[];
  selectedEquipment: Equipment | null;
  onEquipmentChange: (equipment: Equipment) => void;
}

export interface ConfiguratorSummaryProps {
  selectedEquipment: Equipment | null;
  compatibleProducts: any[];
}
