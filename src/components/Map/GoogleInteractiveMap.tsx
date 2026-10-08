import React from 'react';
import { UnifiedMap } from './UnifiedMap';

interface GoogleInteractiveMapProps {
  showSurgeHeatmap?: boolean;
  selectableMode?: 'pickup' | 'dropoff' | null;
  height?: string;
  mode?: 'driver' | 'rider' | 'admin';
}

export const GoogleInteractiveMap: React.FC<GoogleInteractiveMapProps> = ({
  showSurgeHeatmap = false,
  selectableMode = null,
  height = '100%',
  mode,
}) => {
  return (
    <UnifiedMap
      showSurgeHeatmap={showSurgeHeatmap}
      selectableMode={selectableMode}
      height={height}
      mode={mode}
    />
  );
};
