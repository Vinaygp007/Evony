'use client';

import { useState } from 'react';
import { EvonyServer, REGIONS, LANGUAGES, filterServers } from '../types/evonyServers';

interface ServerSelectorProps {
  selectedServer: EvonyServer | null;
  onServerSelect: (server: EvonyServer | null) => void;
  className?: string;
}

const ServerSelector: React.FC<ServerSelectorProps> = ({
  selectedServer,
  onServerSelect,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState('ALL');
  const [selectedLanguage, setSelectedLanguage] = useState('ALL');
  const [activeOnly, setActiveOnly] = useState(true);
  const [regionDropdownOpen, setRegionDropdownOpen] = useState(false);
  const [languageDropdownOpen, setLanguageDropdownOpen] = useState(false);

  const filteredServers = filterServers(selectedRegion, selectedLanguage, activeOnly);

  const handleServerSelect = (server: EvonyServer | null) => {
    onServerSelect(server);
    setIsOpen(false);
  };

  const getPlayerCountColor = (count?: number): string => {
    if (!count) return 'text-gray-400';
    if (count > 15000) return 'text-green-600';
    if (count > 10000) return 'text-yellow-600';
    if (count > 5000) return 'text-orange-600';
    return 'text-red-600';
  };

  const getServerStatusBadge = (server: EvonyServer) => {
    const playerCount = server.playerCount || 0;
    if (!server.isActive) return 'Offline';
    if (playerCount > 15000) return 'High';
    if (playerCount > 10000) return 'Medium';
    if (playerCount > 5000) return 'Low';
    return 'Very Low';
  };

  const getStatusColor = (server: EvonyServer): string => {
    if (!server.isActive) return 'bg-gray-500';
    const playerCount = server.playerCount || 0;
    if (playerCount > 15000) return 'bg-green-500';
    if (playerCount > 10000) return 'bg-yellow-500';
    if (playerCount > 5000) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className={`relative z-[10003] ${className}`}>
      {/* Server Selection Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-gray-800/50 backdrop-blur-sm border border-gray-600/50 rounded-xl px-4 py-3 text-left hover:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 shadow-lg hover:shadow-xl relative z-[10004]"
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            {selectedServer ? (
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${getStatusColor(selectedServer)} shadow-lg`}></div>
                <div>
                  <div className="font-medium text-white">
                    {selectedServer.region} {selectedServer.name}
                  </div>
                  <div className="text-sm text-gray-400">
                    {selectedServer.language} • {selectedServer.playerCount?.toLocaleString() || 'Unknown'} players
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-gray-400 flex items-center space-x-2">
                <span className="text-xl">🌍</span>
                <span>Select a server...</span>
              </div>
            )}
          </div>
          <div className="ml-2">
            <svg
              className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-gray-900 border-2 border-purple-500 rounded-xl shadow-2xl z-[20000] min-w-[500px]">
          {/* Filters Section */}
          <div className="p-4 border-b border-gray-700 bg-gray-800">
            <div className="text-lg text-white mb-4 font-bold">🔧 Filter Options</div>
            
            {/* Simple Filter Row */}
            <div className="flex flex-wrap gap-4 items-center">
              {/* Region Filter */}
              <div className="flex-1 min-w-[140px]">
                <label className="block text-xs font-bold text-yellow-400 mb-2">🌍 Region</label>
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setRegionDropdownOpen(!regionDropdownOpen);
                      setLanguageDropdownOpen(false);
                    }}
                    className="w-full text-sm bg-blue-600 hover:bg-blue-500 border border-blue-400 rounded-lg px-3 py-2 text-left text-white focus:outline-none focus:ring-1 focus:ring-blue-300 flex items-center justify-between transition-all"
                  >
                    <span className="text-white font-medium truncate">{REGIONS.find(r => r.code === selectedRegion)?.name || 'All Regions'}</span>
                    <svg className={`w-4 h-4 text-white transition-transform flex-shrink-0 ml-2 ${regionDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {regionDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-blue-500 rounded-lg shadow-lg z-[20005] max-h-48 overflow-y-auto">
                      {REGIONS.map(region => (
                        <button
                          key={region.code}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRegion(region.code);
                            setRegionDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-gray-800 hover:bg-blue-50 transition-colors text-sm border-b border-gray-100 last:border-b-0 ${selectedRegion === region.code ? 'bg-blue-100 text-blue-800 font-medium' : ''}`}
                        >
                          {region.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Language Filter */}
              <div className="flex-1 min-w-[140px]">
                <label className="block text-xs font-bold text-yellow-400 mb-2">🗣️ Language</label>
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setLanguageDropdownOpen(!languageDropdownOpen);
                      setRegionDropdownOpen(false);
                    }}
                    className="w-full text-sm bg-green-600 hover:bg-green-500 border border-green-400 rounded-lg px-3 py-2 text-left text-white focus:outline-none focus:ring-1 focus:ring-green-300 flex items-center justify-between transition-all"
                  >
                    <span className="text-white font-medium truncate">{LANGUAGES.find(l => l.code === selectedLanguage)?.name || 'All Languages'}</span>
                    <svg className={`w-4 h-4 text-white transition-transform flex-shrink-0 ml-2 ${languageDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {languageDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-green-500 rounded-lg shadow-lg z-[20005] max-h-48 overflow-y-auto">
                      {LANGUAGES.map(language => (
                        <button
                          key={language.code}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLanguage(language.code);
                            setLanguageDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-gray-800 hover:bg-green-50 transition-colors text-sm border-b border-gray-100 last:border-b-0 ${selectedLanguage === language.code ? 'bg-green-100 text-green-800 font-medium' : ''}`}
                        >
                          {language.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Active Only Toggle */}
              <div className="flex-shrink-0">
                <label className="block text-xs font-bold text-yellow-400 mb-2">Status</label>
                <label className="flex items-center text-sm text-white cursor-pointer bg-purple-600 hover:bg-purple-500 px-3 py-2 rounded-lg transition-colors border border-purple-400">
                  <input
                    type="checkbox"
                    checked={activeOnly}
                    onChange={(e) => setActiveOnly(e.target.checked)}
                    className="mr-2 h-4 w-4 text-purple-600 bg-white border-gray-300 rounded focus:ring-purple-500 focus:ring-1"
                  />
                  <span className="text-white font-medium text-xs">✅ Active Only</span>
                </label>
              </div>
            </div>
          </div>

          {/* Clear Selection */}
          <div className="px-4 py-2 border-b border-gray-700 bg-gray-800">
            <button
              onClick={() => handleServerSelect(null)}
              className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded-lg transition-colors flex items-center space-x-2"
            >
              <div className="w-2 h-2 rounded-full bg-gray-500"></div>
              <span className="text-white font-medium">All Servers (No Filter)</span>
            </button>
          </div>

          {/* Server List */}
          <div className="max-h-60 overflow-y-auto bg-gray-900">
            {filteredServers.length === 0 ? (
              <div className="p-6 text-center text-gray-400">
                <div className="text-4xl mb-2">🔍</div>
                <div className="font-medium">No servers match the selected filters</div>
                <div className="text-sm mt-1">Try adjusting your filter criteria</div>
              </div>
            ) : (
              filteredServers.map(server => (
                <button
                  key={server.id}
                  onClick={() => handleServerSelect(server)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-700 border-b border-gray-700 last:border-b-0 transition-all duration-200 group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(server)} group-hover:scale-125 transition-transform`}></div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-white group-hover:text-purple-300 transition-colors truncate">
                          {server.region} {server.name}
                        </div>
                        <div className="text-xs text-gray-400 truncate">
                          {server.language}
                          {server.description && ` • ${server.description}`}
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-3">
                      <div className={`text-sm font-medium ${getPlayerCountColor(server.playerCount)}`}>
                        {server.playerCount?.toLocaleString() || 'Unknown'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {getServerStatusBadge(server)}
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 bg-gray-800 border-t border-gray-700 rounded-b-xl">
            <div className="text-xs text-gray-400 text-center">
              Showing <span className="text-purple-400 font-medium">{filteredServers.length}</span> of <span className="text-blue-400 font-medium">{filterServers().length}</span> active servers
            </div>
          </div>
        </div>
      )}

      {/* Click Outside Overlay - Close all dropdowns when clicking outside */}
      {(isOpen || regionDropdownOpen || languageDropdownOpen) && (
        <div
          className="fixed inset-0 z-[19999]"
          onClick={() => {
            setIsOpen(false);
            setRegionDropdownOpen(false);
            setLanguageDropdownOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default ServerSelector;
