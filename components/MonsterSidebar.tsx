'use client';

import { useState, useMemo } from 'react';
import { Monster, MonsterFilter } from '../types/monster';

interface MonsterSidebarProps {
  monsters: Monster[];
  loading: boolean;
  className?: string;
}

export const MonsterSidebar: React.FC<MonsterSidebarProps> = ({ 
  monsters, 
  loading, 
  className = '' 
}) => {
  const [filter, setFilter] = useState<MonsterFilter>({
    type: '',
    minLevel: 1,
    maxLevel: 100,
  });
  const [searchTerm, setSearchTerm] = useState('');

  // Get unique monster types for filter dropdown
  const monsterTypes = useMemo(() => {
    const types = new Set(monsters.map(monster => monster.monster));
    return Array.from(types).sort();
  }, [monsters]);

  // Filter monsters based on current filters
  const filteredMonsters = useMemo(() => {
    return monsters.filter(monster => {
      const matchesType = !filter.type || monster.monster === filter.type;
      const matchesLevel = monster.level >= filter.minLevel && monster.level <= filter.maxLevel;
      const matchesSearch = !searchTerm || 
        monster.monster.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesType && matchesLevel && matchesSearch;
    });
  }, [monsters, filter, searchTerm]);

  // Group monsters by type for better organization
  const groupedMonsters = useMemo(() => {
    const groups: { [key: string]: Monster[] } = {};
    filteredMonsters.forEach(monster => {
      if (!groups[monster.monster]) {
        groups[monster.monster] = [];
      }
      groups[monster.monster].push(monster);
    });
    
    // Sort each group by level (highest first)
    Object.keys(groups).forEach(type => {
      groups[type].sort((a, b) => b.level - a.level);
    });
    
    return groups;
  }, [filteredMonsters]);

  const resetFilters = () => {
    setFilter({
      type: '',
      minLevel: 1,
      maxLevel: 100,
    });
    setSearchTerm('');
  };

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
      'Griffin': 'from-amber-500 to-yellow-600',
      'Dragon': 'from-red-500 to-red-700',
      'Orc': 'from-green-500 to-green-700',
      'Goblin': 'from-lime-500 to-green-600',
      'Troll': 'from-indigo-500 to-purple-600',
      'Skeleton': 'from-gray-500 to-gray-700',
      'Zombie': 'from-green-600 to-gray-600',
      'Vampire': 'from-red-600 to-gray-800',
      'Werewolf': 'from-amber-600 to-gray-700',
      'Phoenix': 'from-orange-500 to-red-600',
    };
    return colors[monsterType] || 'from-gray-500 to-gray-700';
  };

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-700/50 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-lg">👾</span>
            </div>
            <h2 className="text-xl font-bold text-white">Monsters</h2>
          </div>
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-medium px-3 py-1 rounded-full shadow-lg">
            {filteredMonsters.length} found
          </div>
        </div>

        {/* Search */}
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search monsters..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-800/50 border border-gray-600/50 rounded-xl px-4 py-3 pl-10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              🔍
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Monster Type
            </label>
            <select
              value={filter.type}
              onChange={(e) => setFilter({ ...filter, type: e.target.value })}
              className="w-full bg-gray-800/50 border border-gray-600/50 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="">All Types</option>
              {monsterTypes.map(type => (
                <option key={type} value={type} className="bg-gray-800">
                  {getMonsterIcon(type)} {type}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Min Level
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={filter.minLevel}
                onChange={(e) => setFilter({ ...filter, minLevel: parseInt(e.target.value) || 1 })}
                className="w-full bg-gray-800/50 border border-gray-600/50 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Max Level
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={filter.maxLevel}
                onChange={(e) => setFilter({ ...filter, maxLevel: parseInt(e.target.value) || 100 })}
                className="w-full bg-gray-800/50 border border-gray-600/50 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
          </div>

          <button
            onClick={resetFilters}
            className="w-full bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 hover:text-white font-medium py-2 px-4 rounded-xl transition-all duration-200"
          >
            🔄 Reset Filters
          </button>
        </div>
      </div>

      {/* Monster List */}
      <div className="flex-1 min-h-0 overflow-y-auto monster-list-scroll p-4">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-2"></div>
              <p className="text-gray-400 text-sm">Loading monsters...</p>
            </div>
          </div>
        ) : Object.keys(groupedMonsters).length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">🔍</div>
            <p className="text-gray-400">No monsters found</p>
            <p className="text-gray-500 text-sm">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedMonsters).map(([type, monsters]) => (
              <div key={type} className="bg-gray-800/30 backdrop-blur-sm rounded-xl border border-gray-700/50 overflow-hidden">
                <div className={`bg-gradient-to-r ${getMonsterColor(type)} p-3`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-xl">{getMonsterIcon(type)}</span>
                      <h3 className="font-bold text-white">{type}</h3>
                    </div>
                    <span className="bg-white/20 text-white text-sm px-2 py-1 rounded-full">
                      {monsters.length}
                    </span>
                  </div>
                </div>
                <div className="p-3 space-y-2">
                  {monsters.map((monster) => (
                    <div
                      key={monster.id}
                      className="bg-gray-900/50 rounded-lg p-3 border border-gray-700/30 hover:border-purple-500/50 transition-all duration-200 group cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 bg-gradient-to-r ${getMonsterColor(type)} rounded-full flex items-center justify-center text-white font-bold text-sm group-hover:scale-110 transition-transform`}>
                            {monster.level}
                          </div>
                          <div>
                            <div className="text-white font-medium group-hover:text-purple-300 transition-colors">
                              Level {monster.level} {monster.monster}
                            </div>
                            <div className="text-gray-400 text-sm">
                              📍 ({monster.x.toFixed(1)}, {monster.y.toFixed(1)})
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          {monster.serverId && (
                            <div className="text-xs text-purple-400 bg-purple-900/30 px-2 py-1 rounded">
                              {monster.serverId.toUpperCase()}
                            </div>
                          )}
                          {monster.timestamp && (
                            <div className="text-xs text-gray-500 mt-1">
                              {new Date(monster.timestamp).toLocaleTimeString()}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
