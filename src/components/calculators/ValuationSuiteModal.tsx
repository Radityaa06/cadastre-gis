import React from 'react';
import { CadastralParcel } from '../../types';
import { LandRevenueTaxModal } from './LandRevenueTaxModal';
import { BoundaryPriceCalculatorModal } from './BoundaryPriceCalculatorModal';

export type ValuationSuiteTab = 'revenue_tax' | 'boundary_price';

interface ValuationSuiteModalProps {
  isOpen: boolean;
  activeSuiteTab: ValuationSuiteTab;
  onClose: () => void;
  parcels: CadastralParcel[];
  selectedParcel: CadastralParcel | null;
  onSelectParcel?: (parcel: CadastralParcel) => void;
}

export const ValuationSuiteModal: React.FC<ValuationSuiteModalProps> = ({
  isOpen,
  activeSuiteTab,
  onClose,
  parcels,
  selectedParcel,
  onSelectParcel,
}) => {
  if (!isOpen) return null;

  if (activeSuiteTab === 'revenue_tax') {
    return (
      <LandRevenueTaxModal
        isOpen={isOpen}
        onClose={onClose}
        parcels={parcels}
        selectedParcel={selectedParcel}
        onSelectParcel={onSelectParcel}
      />
    );
  }

  return (
    <BoundaryPriceCalculatorModal
      isOpen={isOpen}
      onClose={onClose}
      parcels={parcels}
      selectedParcel={selectedParcel}
      onSelectParcel={onSelectParcel}
    />
  );
};
