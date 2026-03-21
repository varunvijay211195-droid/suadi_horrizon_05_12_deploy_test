import React from 'react';

interface ConfiguratorOptionsProps {
  equipmentTypes: any[];
  selectedEquipment: any;
  onEquipmentChange: (equipment: any) => void;
}

export const ConfiguratorOptions: React.FC<ConfiguratorOptionsProps> = ({ 
  equipmentTypes, 
  selectedEquipment, 
  onEquipmentChange 
}) => {
  return (
    <div className="configurator-options">
      <h5>Select Equipment</h5>
      <div className="equipment-selector">
        {equipmentTypes.map((type) => (
          <div key={type.id} className="equipment-type">
            <h6>{type.name}</h6>
            <div className="equipment-brands">
              {type.brands.map((brand: any) => (
                <div key={brand.id} className="equipment-brand">
                  <h6>{brand.name}</h6>
                  <div className="equipment-models">
                    {brand.models.map((model: any) => (

                      <div key={model.id} className="equipment-model">
                        <label>
                          <input
                            type="radio"
                            name="equipment"
                            value={model.id}
                            checked={selectedEquipment?.id === model.id}
                            onChange={() => onEquipmentChange(model)}
                          />
                          {model.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
