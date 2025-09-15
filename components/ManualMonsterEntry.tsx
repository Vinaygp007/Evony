'use client';

import { useState } from 'react';
import { RealMonsterData } from '../services/real-monster-data';

interface ManualMonsterEntryProps {
  onAddMonster: (monster: Omit<RealMonsterData, 'id' | 'timestamp' | 'lastSeen'>) => void;
  onClose: () => void;
}

export default function ManualMonsterEntry({ onAddMonster, onClose }: ManualMonsterEntryProps) {
  const [formData, setFormData] = useState({
    monster: '',
    level: '',
    x: '',
    y: '',
    serverId: '',
    server: '',
    region: '',
    reportedBy: '',
    alliance: '',
    health: '',
    notes: '',
    verified: false
  });

  const monsterTypes = [
    'Dragon', 'Behemoth', 'Hydra', 'Phoenix', 'Manticore', 
    'Cyclops', 'Centaur', 'Gryphon', 'Cerberus', 'Sphinx',
    'Minotaur', 'Vampire', 'Werewolf', 'Lich', 'Demon'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.monster || !formData.level || !formData.x || !formData.y || !formData.serverId || !formData.reportedBy) {
      alert('Please fill in all required fields');
      return;
    }

    onAddMonster({
      monster: formData.monster,
      level: parseInt(formData.level),
      x: parseInt(formData.x),
      y: parseInt(formData.y),
      serverId: formData.serverId,
      server: formData.server || formData.serverId,
      region: formData.region || `${formData.x},${formData.y}`,
      reportedBy: formData.reportedBy,
      alliance: formData.alliance || undefined,
      health: formData.health ? parseInt(formData.health) : undefined,
      notes: formData.notes || undefined,
      verified: formData.verified
    });

    onClose();
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Add Real Monster Data</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Monster Type */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Monster Type *
              </label>
              <select
                value={formData.monster}
                onChange={(e) => handleChange('monster', e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select monster type</option>
                {monsterTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Level */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Level *
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={formData.level}
                onChange={(e) => handleChange('level', e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                placeholder="Monster level"
                required
              />
            </div>

            {/* X Coordinate */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                X Coordinate *
              </label>
              <input
                type="number"
                value={formData.x}
                onChange={(e) => handleChange('x', e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                placeholder="X position"
                required
              />
            </div>

            {/* Y Coordinate */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Y Coordinate *
              </label>
              <input
                type="number"
                value={formData.y}
                onChange={(e) => handleChange('y', e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                placeholder="Y position"
                required
              />
            </div>

            {/* Server ID */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Server ID *
              </label>
              <input
                type="text"
                value={formData.serverId}
                onChange={(e) => handleChange('serverId', e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Server_353"
                required
              />
            </div>

            {/* Server Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Server Name
              </label>
              <input
                type="text"
                value={formData.server}
                onChange={(e) => handleChange('server', e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., EU Server 1"
              />
            </div>

            {/* Region */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Region/Location
              </label>
              <input
                type="text"
                value={formData.region}
                onChange={(e) => handleChange('region', e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Thessaly, Abedam"
              />
            </div>

            {/* Reported By */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Reported By *
              </label>
              <input
                type="text"
                value={formData.reportedBy}
                onChange={(e) => handleChange('reportedBy', e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                placeholder="Your game username"
                required
              />
            </div>

            {/* Alliance */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Alliance
              </label>
              <input
                type="text"
                value={formData.alliance}
                onChange={(e) => handleChange('alliance', e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                placeholder="Your alliance tag"
              />
            </div>

            {/* Health */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Health %
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={formData.health}
                onChange={(e) => handleChange('health', e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                placeholder="Monster health percentage"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Additional notes about this monster..."
            />
          </div>

          {/* Verified */}
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={formData.verified}
              onChange={(e) => handleChange('verified', e.target.checked)}
              className="mr-2 w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
            />
            <label className="text-sm text-gray-300">
              Mark as verified (I've personally seen this monster)
            </label>
          </div>

          {/* Buttons */}
          <div className="flex space-x-4 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors"
            >
              Add Monster
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-md transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>

        <div className="mt-6 p-4 bg-blue-900/30 rounded-md border border-blue-500/30">
          <p className="text-sm text-blue-300">
            💡 <strong>Tip:</strong> Get coordinates from your Evony game by tapping on the monster and noting the X,Y coordinates displayed. 
            Make sure to include your server information for accurate tracking.
          </p>
        </div>
      </div>
    </div>
  );
}