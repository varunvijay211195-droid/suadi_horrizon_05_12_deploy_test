import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Slider } from './ui/slider';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { ChevronDown } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from './ui/collapsible';
import { getProducts, Product } from '@/api/products';
import { CompatibilityFilter, AvailabilityFilter, AvailabilityStatus } from './filters';
import type { Equipment } from '@/lib/equipment';

interface FilterSidebarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  selectedEquipment?: Equipment | null;
  onEquipmentChange?: () => void;
  onEquipmentClear?: () => void;
  onAvailabilityChange?: (status: AvailabilityStatus) => void;
  availabilityStatus?: AvailabilityStatus;
}

export interface FilterState {
  brands: string[];
  categories: string[];
  priceRange: [number, number];
  search: string;
}

export const FilterSidebar: React.FC<FilterSidebarProps> = ({
  filters,
  onFilterChange,
  selectedEquipment,
  onEquipmentChange,
  onEquipmentClear,
  onAvailabilityChange,
  availabilityStatus = 'all',
}) => {
  const [availableBrands, setAvailableBrands] = useState<string[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [productCounts, setProductCounts] = useState<{ brands: Record<string, number>, categories: Record<string, number> }>({ brands: {}, categories: {} });



  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const res = await getProducts({ limit: 5000 });
        const products = res.products;

        // Get unique brands with counts
        const brandCounts: Record<string, number> = {};
        const categoryCounts: Record<string, number> = {};
        const brands = new Set<string>();
        const categories = new Set<string>();

        products.forEach(p => {
          if (p.brand) {
            brands.add(p.brand);
            brandCounts[p.brand] = (brandCounts[p.brand] || 0) + 1;
          }
          if (p.category) {
            categories.add(p.category);
            categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
          }
        });

        setAvailableBrands([...brands].sort());
        setAvailableCategories([...categories].sort());
        setProductCounts({ brands: brandCounts, categories: categoryCounts });
      } catch (error) {
        console.error('Error loading filter options:', error);
      }
    };

    loadFilterOptions();
  }, []);

  const handleBrandChange = (brand: string, checked: boolean) => {
    const newBrands = checked
      ? [...filters.brands, brand]
      : filters.brands.filter((b) => b !== brand);

    onFilterChange({ ...filters, brands: newBrands });
  };

  const handleCategoryChange = (category: string, checked: boolean) => {
    const newCategories = checked
      ? [...filters.categories, category]
      : filters.categories.filter((c) => c !== category);

    onFilterChange({ ...filters, categories: newCategories });
  };

  const handlePriceChange = (value: number[]) => {
    onFilterChange({ ...filters, priceRange: [value[0], value[1]] as [number, number] });
  };

  const handleSearchChange = (value: string) => {
    onFilterChange({ ...filters, search: value });
  };

  const handleClearFilters = () => {
    onFilterChange({ brands: [], categories: [], priceRange: [0, 5000], search: '' });
  };

  return (
    <div className="space-y-6">
      {/* Price Range */}
      <div className="space-y-5 px-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] font-mono">
            Scale (USD)
          </span>
          <span className="text-[10px] font-black text-gold font-mono shadow-gold/20 drop-shadow-[0_0_8px_rgba(197,160,89,0.3)]">
            ${filters.priceRange[0]} - ${filters.priceRange[1]}
          </span>
        </div>
        <Slider
          value={[filters.priceRange[0], filters.priceRange[1]]}
          onValueChange={handlePriceChange}
          min={0}
          max={5000}
          step={50}
          className="[&_[role=slider]]:h-3 [&_[role=slider]]:w-3 [&_[role=slider]]:bg-gold [&_[role=slider]]:border-none [&_[role=slider]]:rounded-none [&_[role=slider]]:rotate-45"
        />
      </div>

      <div className="w-full h-px bg-gradient-to-r from-gold/0 via-gold/20 to-gold/0 my-2" />

      {/* Categories */}
      <Collapsible defaultOpen className="space-y-4">
        <CollapsibleTrigger className="flex items-center justify-between w-full font-black text-[10px] text-white/40 uppercase tracking-[0.2em] hover:text-gold transition-colors font-mono group">
          Categories
          <div className="flex items-center gap-2">
            <span className="bg-white/5 px-1.5 py-0.5 rounded text-[8px]">{availableCategories.length}</span>
            <ChevronDown className="w-3 h-3 group-data-[state=open]:rotate-180 transition-transform" />
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-5 max-h-[400px] overflow-y-auto custom-scrollbar pr-2 pt-2">
          {availableCategories.length > 0 ? (
            availableCategories.map((category) => (
              <div key={category} className="flex items-center gap-4 group cursor-pointer hover:translate-x-1 transition-transform duration-300">
                <Checkbox
                  id={`category-${category}`}
                  checked={filters.categories.includes(category)}
                  onCheckedChange={(checked) =>
                    handleCategoryChange(category, checked as boolean)
                  }
                  className="border-white/20 data-[state=checked]:bg-gold data-[state=checked]:border-gold h-5 w-5 transition-all"
                />
                <Label
                  htmlFor={`category-${category}`}
                  className="text-xs font-bold text-white/70 group-hover:text-gold cursor-pointer transition-colors leading-none tracking-wide whitespace-nowrap"
                  title={category}
                >
                  {category}
                </Label>
                <div className="flex-1" />
                <span className="text-[10px] font-black font-mono text-white/20 group-hover:text-gold/60 transition-colors">
                  ({productCounts.categories[category] || 0})
                </span>
              </div>
            ))
          ) : (
            <p className="text-[10px] text-white/20 uppercase tracking-widest animate-pulse">Initializing...</p>
          )}
        </CollapsibleContent>
      </Collapsible>

      <div className="w-full h-px bg-gradient-to-r from-gold/0 via-gold/20 to-gold/0 my-2" />

      {/* Brands */}
      <Collapsible defaultOpen className="space-y-4">
        <CollapsibleTrigger className="flex items-center justify-between w-full font-black text-[10px] text-white/40 uppercase tracking-[0.2em] hover:text-gold transition-colors font-mono group">
          Brands
          <div className="flex items-center gap-2">
            <span className="bg-white/5 px-1.5 py-0.5 rounded text-[8px]">{availableBrands.length}</span>
            <ChevronDown className="w-3 h-3 group-data-[state=open]:rotate-180 transition-transform" />
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-5 max-h-[400px] overflow-y-auto custom-scrollbar pr-2 pt-2">
          {availableBrands.length > 0 ? (
            availableBrands.map((brand) => (
              <div key={brand} className="flex items-center gap-4 group cursor-pointer hover:translate-x-1 transition-transform duration-300">
                <Checkbox
                  id={`brand-${brand}`}
                  checked={filters.brands.includes(brand) || false}
                  onCheckedChange={(checked) =>
                    handleBrandChange(brand, checked as boolean)
                  }
                  className="border-white/20 data-[state=checked]:bg-gold data-[state=checked]:border-gold h-5 w-5 transition-all"
                />
                <Label
                  htmlFor={`brand-${brand}`}
                  className="text-xs font-bold text-white/70 group-hover:text-gold cursor-pointer transition-colors leading-none tracking-wide whitespace-nowrap"
                  title={brand}
                >
                  {brand}
                </Label>
                <div className="flex-1" />
                <span className="text-[10px] font-black font-mono text-white/20 group-hover:text-gold/60 transition-colors">
                  ({productCounts.brands[brand] || 0})
                </span>
              </div>
            ))
          ) : (
            <p className="text-[10px] text-white/20 uppercase tracking-widest animate-pulse">Initializing...</p>
          )}
        </CollapsibleContent>
      </Collapsible>

      <div className="w-full h-px bg-gradient-to-r from-gold/0 via-gold/20 to-gold/0 my-2" />

      {/* Clear Filters */}
      <Button
        variant="ghost"
        className="w-full h-11 text-[9px] font-black text-white/40 hover:text-gold hover:bg-gold/5 transition-all duration-500 text-center border border-white/5 hover:border-gold/30 rounded-xl uppercase tracking-[0.2em] group"
        onClick={handleClearFilters}
      >
        <span className="group-hover:translate-x-1 transition-transform inline-block">Reset Filter System</span>
      </Button>
    </div>
  );
};

