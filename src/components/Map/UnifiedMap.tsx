import React from 'react';
import { useRide } from '../../context/RideContext';
import { DriverMap } from './DriverMap';
import { RiderMap } from './RiderMap';
import { AdminMap } from './AdminMap';

interface UnifiedMapProps {
  showSurgeHeatmap?: boolean;
  selectableMode?: 'pickup' | 'dropoff' | null;
  height?: string;
  mode?: 'driver' | 'rider' | 'admin';
}

export const UnifiedMap: React.FC<UnifiedMapProps> = ({
  showSurgeHeatmap = false,
  selectableMode = null,
  height = '100%',
  mode,
}) => {
  const { role } = useRide();

  // Determine active component mode
  const activeMode =
    mode || (role === 'driver' ? 'driver' : role === 'admin' ? 'admin' : 'rider');

  if (activeMode === 'driver') {
    return <DriverMap height={height} showSurgeHeatmap={showSurgeHeatmap} />;
  }

  if (activeMode === 'admin') {
    return <AdminMap height={height} showSurgeHeatmap={showSurgeHeatmap} />;
  }

  return <RiderMap height={height} selectableMode={selectableMode} />;
};
