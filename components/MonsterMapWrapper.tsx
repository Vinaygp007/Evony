'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { Monster, MapBounds } from '../types/monster';
import { MapErrorBoundary } from './MapErrorBoundary';

interface MonsterMapProps {
  monsters: Monster[];
  onBoundsChange: (bounds: MapBounds) => void;
  className?: string;
}

// Dynamic import for MonsterMap to avoid SSR issues with Leaflet
const DynamicMonsterMap = dynamic(() => import('./MonsterMapClient'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-gray-100 rounded-lg">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-500">Loading map...</p>
      </div>
    </div>
  )
});

export const MonsterMap: React.FC<MonsterMapProps> = (props) => {
  const [mapKey, setMapKey] = useState(0);
  const [mounted, setMounted] = useState(false);

  // Ensure we're on client side before rendering map
  useEffect(() => {
    console.log('MonsterMapWrapper mounting...');
    setMounted(true);
    setMapKey(Date.now());
  }, []);

  const handleMapError = (error: Error) => {
    console.log('Map error caught by wrapper, remounting with new key:', error.message);
    console.error('Full error details:', error);
    // Force remount with new key after a brief delay
    setTimeout(() => {
      setMapKey(Date.now());
    }, 100);
  };

  // Don't render anything until we're mounted on client side
  if (!mounted) {
    console.log('MonsterMapWrapper not yet mounted, showing loading...');
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-100 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading map...</p>
        </div>
      </div>
    );
  }

  console.log('MonsterMapWrapper rendering with mapKey:', mapKey);

  return (
    <MapErrorBoundary onError={handleMapError}>
      <div key={mapKey}>
        <DynamicMonsterMap {...props} />
      </div>
    </MapErrorBoundary>
  );
};
