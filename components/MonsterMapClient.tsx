'use client';

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Monster, MapBounds } from '../types/monster';

// Fix for default markers in react-leaflet
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as L.Icon.Default & { _getIconUrl?: () => string })._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
}

interface MonsterMapProps {
  monsters: Monster[];
  onBoundsChange: (bounds: MapBounds) => void;
  className?: string;
}

// Custom component to handle map events
const MapEventHandler = ({ onBoundsChange }: { onBoundsChange: (bounds: MapBounds) => void }) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const handleMoveEnd = () => {
      const bounds = map.getBounds();
      onBoundsChange({
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest(),
      });
    };

    map.on('moveend', handleMoveEnd);
    map.on('zoomend', handleMoveEnd);

    // Initial bounds
    handleMoveEnd();

    return () => {
      if (map) {
        map.off('moveend', handleMoveEnd);
        map.off('zoomend', handleMoveEnd);
      }
    };
  }, [map, onBoundsChange]);

  return null;
};

// Create custom icons for different monster types
const createMonsterIcon = (monster: Monster) => {
  const color = getMonsterColor(monster.monster);
  const size = Math.max(20, Math.min(40, monster.level * 4));
  
  return L.divIcon({
    html: `
      <div style="
        background-color: ${color};
        border: 2px solid #fff;
        border-radius: 50%;
        width: ${size}px;
        height: ${size}px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: ${Math.max(10, size / 3)}px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      ">
        ${monster.level}
      </div>
    `,
    className: 'monster-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

const getMonsterColor = (monsterType: string): string => {
  const colors: { [key: string]: string } = {
    'Griffin': '#8B4513',
    'Dragon': '#DC143C',
    'Orc': '#228B22',
    'Goblin': '#32CD32',
    'Troll': '#4B0082',
    'Skeleton': '#696969',
    'Zombie': '#8FBC8F',
    'Vampire': '#8B0000',
    'Werewolf': '#A0522D',
    'Phoenix': '#FF4500',
  };
  return colors[monsterType] || '#666666';
};

export const MonsterMap: React.FC<MonsterMapProps> = ({ 
  monsters, 
  onBoundsChange, 
  className = '' 
}) => {
  const mapKey = useRef(Date.now()); // Unique key to force remount on errors
  const containerRef = useRef<HTMLDivElement>(null);

  // Force a new key on each mount to prevent initialization conflicts
  useEffect(() => {
    console.log('MonsterMapClient mounting with monsters:', monsters.length);
    mapKey.current = Date.now();
  }, [monsters.length]);

  try {
    console.log('MonsterMapClient rendering with mapKey:', mapKey.current);
    return (
      <div className={`relative ${className}`} ref={containerRef}>
        <MapContainer
          key={mapKey.current} // Force remount to prevent initialization errors
          center={[0, 0]}
          zoom={6}
          style={{ height: '100%', width: '100%' }}
          className="rounded-lg"
          preferCanvas={true}
          attributionControl={false}
          zoomControl={true}
          doubleClickZoom={true}
          scrollWheelZoom={true}
          dragging={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={18}
            tileSize={256}
          />
          
          <MapEventHandler onBoundsChange={onBoundsChange} />
          
          {monsters.map((monster) => (
            <Marker
              key={monster.id}
              position={[monster.y, monster.x]}
              icon={createMonsterIcon(monster)}
            >
              <Popup>
                <div className="p-2">
                  <h3 className="font-bold text-lg text-gray-800">{monster.monster}</h3>
                  <p className="text-sm text-gray-600">Level: {monster.level}</p>
                  <p className="text-sm text-gray-600">
                    Position: ({monster.x.toFixed(2)}, {monster.y.toFixed(2)})
                  </p>
                  {monster.timestamp && (
                    <p className="text-xs text-gray-500 mt-1">
                      Spawned: {new Date(monster.timestamp).toLocaleTimeString()}
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
        
        {monsters.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75 rounded-lg">
            <div className="text-center">
              <p className="text-gray-500 text-lg">No monsters in view</p>
              <p className="text-gray-400 text-sm">Move the map to explore different areas</p>
            </div>
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error('Error rendering map:', error);
    throw error; // Let the error boundary handle it
  }
};

export default MonsterMap;
