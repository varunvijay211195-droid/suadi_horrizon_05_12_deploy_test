import React from 'react';

interface ConfiguratorSummaryProps {
  selectedEquipment: any;
  compatibleProducts: any[];
}

export const ConfiguratorSummary: React.FC<ConfiguratorSummaryProps> = ({ 
  selectedEquipment, 
  compatibleProducts 
}) => {
  return (
    <div className="configurator-summary">
      <h5>Configuration Summary</h5>
      {selectedEquipment && (
        <div className="selected-equipment">
          <h6>Selected Equipment:</h6>
          <p>{selectedEquipment.name}</p>
        </div>
      )}
      {compatibleProducts.length > 0 && (
        <div className="compatible-products">
          <h6>Compatible Products ({compatibleProducts.length}):</h6>
          <ul>
            {compatibleProducts.map((product) => (
              <li key={product._id}>
                <strong>{product.name}</strong> - {product.sku}
                <span className="compatibility-badge">Compatible</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
