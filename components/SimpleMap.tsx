'use client';

import { useEffect, useRef, useState } from 'react';
import { Monster, MapBounds } from '../types/monster';

interface SimpleMapProps {
  monsters: Monster[];
  onBoundsChange: (bounds: MapBounds) => void;
  className?: string;
}

const SimpleMap: React.FC<SimpleMapProps> = ({ 
  monsters, 
  onBoundsChange, 
  className = '' 
}) => {
  const [mapInitialized, setMapInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let leaflet: any = null;
    let map: any = null;

    const initializeMap = async () => {
      try {
        console.log('Initializing SimpleMap...');
        
        // Dynamic import of Leaflet
        const L = await import('leaflet');
        leaflet = L.default || L;

        // Fix default marker icons
        delete (leaflet.Icon.Default.prototype as any)._getIconUrl;
        leaflet.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });

        if (!mapContainerRef.current) {
          throw new Error('Map container not found');
        }

        // Clear any existing map
        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
        }

        // Create new map with Evony coordinate system
        map = leaflet.map(mapContainerRef.current, {
          center: [500, 500], // Center of Evony map (500, 500)
          zoom: 3,
          preferCanvas: true,
          attributionControl: false,
          zoomControl: true,
          crs: leaflet.CRS.Simple, // Use simple CRS for game coordinates
        });

        mapRef.current = map;

        // Set map bounds to Evony game world (0-1000 x 0-1000)
        const bounds = [[0, 0], [1000, 1000]];
        
        // Add a dark background instead of tile layer for game map
        const gameBackground = leaflet.rectangle(bounds, {
          color: '#1a1a2e',
          fillColor: '#16213e',
          fillOpacity: 1,
          weight: 2
        }).addTo(map);

        // Add grid lines for Evony coordinates
        for (let i = 0; i <= 1000; i += 100) {
          // Vertical lines
          leaflet.polyline([[0, i], [1000, i]], {
            color: '#333',
            weight: 1,
            opacity: 0.3
          }).addTo(map);
          
          // Horizontal lines  
          leaflet.polyline([[i, 0], [i, 1000]], {
            color: '#333',
            weight: 1,
            opacity: 0.3
          }).addTo(map);
        }

        // Fit map to Evony world bounds
        map.fitBounds(bounds);

        // Handle map events
        const handleMoveEnd = () => {
          if (map) {
            const bounds = map.getBounds();
            onBoundsChange({
              north: bounds.getNorth(),
              south: bounds.getSouth(),
              east: bounds.getEast(),
              west: bounds.getWest(),
            });
          }
        };

        map.on('moveend', handleMoveEnd);
        map.on('zoomend', handleMoveEnd);

        // Initial bounds
        handleMoveEnd();

        setMapInitialized(true);
        setError(null);
        console.log('SimpleMap initialized successfully');

      } catch (err) {
        console.error('Failed to initialize map:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize map');
      }
    };

    initializeMap();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [onBoundsChange]);

  // Update markers when monsters change
  useEffect(() => {
    console.log('🗺️ SimpleMap: Monsters changed, count:', monsters.length);
    console.log('🗺️ SimpleMap: Map initialized:', mapInitialized);
    console.log('🗺️ SimpleMap: Map ref exists:', !!mapRef.current);
    
    if (!mapInitialized || !mapRef.current) return;

    const updateMarkers = async () => {
      try {
        console.log('🗺️ SimpleMap: Starting marker update with', monsters.length, 'monsters');
        const L = await import('leaflet');
        const leaflet = L.default || L;
        const map = mapRef.current;

        // Clear existing markers
        map.eachLayer((layer: any) => {
          if (layer instanceof leaflet.Marker) {
            map.removeLayer(layer);
          }
        });

        console.log('🗺️ SimpleMap: Cleared existing markers, adding new ones...');

        // Add new markers for Evony coordinates
        monsters.forEach((monster, index) => {
          console.log(`🗺️ SimpleMap: Processing monster ${index + 1}:`, {
            name: monster.monster,
            level: monster.level,
            x: monster.x,
            y: monster.y,
            hasValidCoords: !isNaN(monster.x) && !isNaN(monster.y)
          });
          
          const color = getMonsterColor(monster.monster);
          const size = Math.max(20, Math.min(40, monster.level * 4));
          
          // Convert Evony coordinates (x,y) to map coordinates
          // In Evony: (0,0) is bottom-left, (1000,1000) is top-right
          // In Leaflet: we need to flip Y coordinate
          const mapY = 1000 - monster.y; // Flip Y axis for proper display
          const mapX = monster.x;
          
          console.log(`🗺️ SimpleMap: Converted coordinates for ${monster.monster}: (${mapX}, ${mapY})`);
          
          const icon = leaflet.divIcon({
            html: `
              <div style="
                background: linear-gradient(135deg, ${color}, ${darkenColor(color)});
                border: 2px solid rgba(255, 255, 255, 0.9);
                border-radius: 50%;
                width: ${size}px;
                height: ${size}px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
                font-size: ${Math.max(10, size / 3)}px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6), 0 0 20px rgba(147, 51, 234, 0.3);
                backdrop-filter: blur(4px);
                text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
              ">
                ${monster.level}
              </div>
            `,
            className: 'monster-marker',
            iconSize: [size, size],
            iconAnchor: [size / 2, size / 2],
          });

          const marker = leaflet.marker([mapY, mapX], { icon }).addTo(map);
          console.log(`🗺️ SimpleMap: Added marker for ${monster.monster} at [${mapY}, ${mapX}]`);
          
          marker.bindPopup(`
            <div style="
              padding: 12px;
              background: linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.95));
              border-radius: 12px;
              border: 1px solid rgba(147, 51, 234, 0.3);
              backdrop-filter: blur(8px);
              min-width: 200px;
            ">
              <h3 style="
                font-weight: bold; 
                font-size: 16px; 
                color: #ffffff; 
                margin: 0 0 8px 0;
                text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
              ">${getMonsterIcon(monster.monster)} ${monster.monster}</h3>
              <p style="margin: 4px 0; color: #e2e8f0; font-size: 14px;">
                <span style="color: #a78bfa;">Level:</span> ${monster.level}
              </p>
              <p style="margin: 4px 0; color: #e2e8f0; font-size: 14px;">
                <span style="color: #a78bfa;">Position:</span> (${monster.x.toFixed(2)}, ${monster.y.toFixed(2)})
              </p>
              ${monster.timestamp ? `<p style="margin: 8px 0 0 0; color: #94a3b8; font-size: 12px;">Spawned: ${new Date(monster.timestamp).toLocaleTimeString()}</p>` : ''}
            </div>
          `);
        });

        console.log(`🗺️ SimpleMap: Successfully processed ${monsters.length} monsters and added markers to map`);

      } catch (err) {
        console.error('❌ SimpleMap: Failed to update markers:', err);
      }
    };

    updateMarkers();
  }, [monsters, mapInitialized]);

  const getMonsterIcon = (monsterType: string) => {
    const icons: { [key: string]: string } = {
      'Griffin': '🦅',
      'Dragon': '🐉',
      'Orc': '👹',
      'Goblin': '👺',
      'Troll': '🧌',
      'Skeleton': '💀',
      'Zombie': '🧟',
      'Vampire': '🧛',
      'Werewolf': '🐺',
      'Phoenix': '🔥',
    };
    return icons[monsterType] || '👾';
  };

  const getMonsterColor = (monsterType: string): string => {
    const colors: { [key: string]: string } = {
      'Griffin': '#F59E0B',
      'Dragon': '#EF4444',
      'Orc': '#10B981',
      'Goblin': '#84CC16',
      'Troll': '#8B5CF6',
      'Skeleton': '#6B7280',
      'Zombie': '#059669',
      'Vampire': '#DC2626',
      'Werewolf': '#F59E0B',
      'Phoenix': '#F97316',
    };
    return colors[monsterType] || '#6B7280';
  };

  const darkenColor = (color: string): string => {
    // Simple function to darken a hex color
    const hex = color.replace('#', '');
    const r = Math.max(0, parseInt(hex.substring(0, 2), 16) - 40);
    const g = Math.max(0, parseInt(hex.substring(2, 4), 16) - 40);
    const b = Math.max(0, parseInt(hex.substring(4, 6), 16) - 40);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };

  if (error) {
    return (
      <div className={`relative ${className} bg-gray-900/50 border border-gray-700/50 rounded-xl flex items-center justify-center backdrop-blur-sm`}>
        <div className="text-center p-8">
          <div className="text-4xl mb-4">❌</div>
          <div className="text-red-400 text-lg font-semibold mb-2">Map Error</div>
          <div className="text-gray-400 text-sm mb-4">{error}</div>
          <button 
            onClick={() => window.location.reload()} 
            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-200 font-medium"
          >
            🔄 Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div 
        ref={mapContainerRef} 
        style={{ height: '100%', width: '100%' }}
        className="rounded-xl border border-gray-700/50 overflow-hidden shadow-2xl"
      />
      
      {!mapInitialized && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/90 backdrop-blur-sm rounded-xl border border-gray-700/50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-gray-300 font-medium">Loading map...</p>
            <p className="text-gray-500 text-sm mt-1">Preparing dark theme</p>
          </div>
        </div>
      )}
      
      {mapInitialized && monsters.length === 0 && (
        <div className="absolute top-4 left-4 bg-gray-900/90 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4 shadow-xl">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-lg">🔍</span>
            <p className="text-gray-300 text-sm font-medium">No monsters in view</p>
          </div>
          <p className="text-gray-500 text-xs">Move the map to explore different areas</p>
        </div>
      )}
      
      {mapInitialized && monsters.length > 0 && (
        <div className="absolute top-4 right-4 bg-gray-900/90 backdrop-blur-sm border border-gray-700/50 rounded-xl p-3 shadow-xl">
          <div className="flex items-center space-x-2">
            <span className="text-sm">👾</span>
            <span className="text-gray-300 text-sm font-medium">{monsters.length} monsters</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleMap;
