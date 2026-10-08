import React from 'react';
import { UnifiedMap } from './UnifiedMap';

interface InteractiveMapProps {
  showSurgeHeatmap?: boolean;
  selectableMode?: 'pickup' | 'dropoff' | null;
  height?: string;
  mode?: 'driver' | 'rider' | 'admin';
  onModeChange?: (mode: 'pickup' | 'dropoff') => void;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = (props) => {
  return <UnifiedMap {...props} />;
};
