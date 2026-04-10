import React, { createContext, useState, useContext } from 'react';

export type OutfitItemId = 'kurta' | 'pajama' | 'coat' | 'sadri';

export interface OutfitItem {
  id: OutfitItemId;
  name: string;
  price: number;
  iconName: string; 
}

export const AVAILABLE_ITEMS: Record<OutfitItemId, OutfitItem> = {
  kurta: { id: 'kurta', name: 'Kurta', price: 4500, iconName: 'scissors' },
  pajama: { id: 'pajama', name: 'Pajama', price: 1500, iconName: 'map' },
  coat: { id: 'coat', name: 'Coat', price: 8500, iconName: 'briefcase' },
  sadri: { id: 'sadri', name: 'Sadri', price: 3500, iconName: 'award' },
};

interface OutfitContextType {
  selectedItems: OutfitItemId[];
  toggleItem: (id: OutfitItemId) => void;
}

const OutfitContext = createContext<OutfitContextType | undefined>(undefined);

export function OutfitProvider({ children }: { children: React.ReactNode }) {
  const [selectedItems, setSelectedItems] = useState<OutfitItemId[]>(['kurta', 'pajama']);

  const toggleItem = (id: OutfitItemId) => {
    setSelectedItems((prev) => {
      const isSelected = prev.includes(id);

      if (id === 'kurta' || id === 'pajama') {
        return prev;
      }

      if (isSelected) {
        return prev.filter((item) => item !== id);
      }

      let nextSelected = prev.filter((item) => item !== id);

      if (id === 'coat') {
        nextSelected = nextSelected.filter((item) => item !== 'sadri');
      }
      if (id === 'sadri') {
        nextSelected = nextSelected.filter((item) => item !== 'coat');
      }

      return [...nextSelected, id];
    });
  };

  return (
    <OutfitContext.Provider value={{ selectedItems, toggleItem }}>
      {children}
    </OutfitContext.Provider>
  );
}

export function useOutfit() {
  const context = useContext(OutfitContext);
  if (context === undefined) {
    throw new Error('useOutfit must be used within an OutfitProvider');
  }
  return context;
}