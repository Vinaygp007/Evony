export interface EvonyServer {
  id: string;
  name: string;
  region: string;
  language: string;
  isActive: boolean;
  playerCount?: number;
  description?: string;
}

// Comprehensive list of Evony servers based on different regions
export const EVONY_SERVERS: EvonyServer[] = [
  // US Servers
  { id: 'us1', name: 'Server 1', region: 'US', language: 'EN', isActive: true, playerCount: 15000, description: 'Original US Server' },
  { id: 'us2', name: 'Server 2', region: 'US', language: 'EN', isActive: true, playerCount: 12000 },
  { id: 'us3', name: 'Server 3', region: 'US', language: 'EN', isActive: true, playerCount: 14000 },
  { id: 'us4', name: 'Server 4', region: 'US', language: 'EN', isActive: true, playerCount: 11000 },
  { id: 'us5', name: 'Server 5', region: 'US', language: 'EN', isActive: true, playerCount: 13000 },
  { id: 'us6', name: 'Server 6', region: 'US', language: 'EN', isActive: true, playerCount: 9000 },
  { id: 'us7', name: 'Server 7', region: 'US', language: 'EN', isActive: true, playerCount: 8500 },
  { id: 'us8', name: 'Server 8', region: 'US', language: 'EN', isActive: true, playerCount: 7200 },
  { id: 'us9', name: 'Server 9', region: 'US', language: 'EN', isActive: true, playerCount: 6800 },
  { id: 'us10', name: 'Server 10', region: 'US', language: 'EN', isActive: true, playerCount: 5500 },

  // European Servers
  { id: 'eu1', name: 'Server 1', region: 'EU', language: 'EN', isActive: true, playerCount: 16000, description: 'Main European Server' },
  { id: 'eu2', name: 'Server 2', region: 'EU', language: 'EN', isActive: true, playerCount: 13500 },
  { id: 'eu3', name: 'Server 3', region: 'EU', language: 'EN', isActive: true, playerCount: 12800 },
  { id: 'eu4', name: 'Server 4', region: 'EU', language: 'EN', isActive: true, playerCount: 11200 },
  { id: 'eu5', name: 'Server 5', region: 'EU', language: 'EN', isActive: true, playerCount: 10500 },
  { id: 'eu6', name: 'Server 6', region: 'EU', language: 'DE', isActive: true, playerCount: 9800, description: 'German Language Server' },
  { id: 'eu7', name: 'Server 7', region: 'EU', language: 'FR', isActive: true, playerCount: 8900, description: 'French Language Server' },
  { id: 'eu8', name: 'Server 8', region: 'EU', language: 'ES', isActive: true, playerCount: 7600, description: 'Spanish Language Server' },

  // Asian Servers
  { id: 'asia1', name: 'Server 1', region: 'ASIA', language: 'EN', isActive: true, playerCount: 18000, description: 'Main Asian Server' },
  { id: 'asia2', name: 'Server 2', region: 'ASIA', language: 'EN', isActive: true, playerCount: 15500 },
  { id: 'asia3', name: 'Server 3', region: 'ASIA', language: 'JP', isActive: true, playerCount: 14200, description: 'Japanese Language Server' },
  { id: 'asia4', name: 'Server 4', region: 'ASIA', language: 'KR', isActive: true, playerCount: 13800, description: 'Korean Language Server' },
  { id: 'asia5', name: 'Server 5', region: 'ASIA', language: 'CN', isActive: true, playerCount: 20000, description: 'Chinese Language Server' },

  // Australian Servers
  { id: 'aus1', name: 'Server 1', region: 'AUS', language: 'EN', isActive: true, playerCount: 8500, description: 'Australian Server' },
  { id: 'aus2', name: 'Server 2', region: 'AUS', language: 'EN', isActive: true, playerCount: 6200 },

  // South American Servers
  { id: 'sa1', name: 'Server 1', region: 'SA', language: 'PT', isActive: true, playerCount: 9500, description: 'Portuguese Language Server' },
  { id: 'sa2', name: 'Server 2', region: 'SA', language: 'ES', isActive: true, playerCount: 8200, description: 'Spanish Language Server' },

  // Middle East Servers
  { id: 'me1', name: 'Server 1', region: 'ME', language: 'EN', isActive: true, playerCount: 7800, description: 'Middle East Server' },
  { id: 'me2', name: 'Server 2', region: 'ME', language: 'AR', isActive: true, playerCount: 6500, description: 'Arabic Language Server' },

  // Russian Servers
  { id: 'ru1', name: 'Server 1', region: 'RU', language: 'RU', isActive: true, playerCount: 12000, description: 'Russian Language Server' },
  { id: 'ru2', name: 'Server 2', region: 'RU', language: 'RU', isActive: true, playerCount: 9800 },

  // Test Servers
  { id: 'test1', name: 'Test Server 1', region: 'TEST', language: 'EN', isActive: false, playerCount: 500, description: 'Beta Testing Server' },
  { id: 'test2', name: 'Test Server 2', region: 'TEST', language: 'EN', isActive: false, playerCount: 300, description: 'Development Server' },
];

export const REGIONS = [
  { code: 'ALL', name: 'All Regions' },
  { code: 'US', name: 'United States' },
  { code: 'EU', name: 'Europe' },
  { code: 'ASIA', name: 'Asia' },
  { code: 'AUS', name: 'Australia' },
  { code: 'SA', name: 'South America' },
  { code: 'ME', name: 'Middle East' },
  { code: 'RU', name: 'Russia' },
  { code: 'TEST', name: 'Test Servers' },
];

export const LANGUAGES = [
  { code: 'ALL', name: 'All Languages' },
  { code: 'EN', name: 'English' },
  { code: 'DE', name: 'German' },
  { code: 'FR', name: 'French' },
  { code: 'ES', name: 'Spanish' },
  { code: 'JP', name: 'Japanese' },
  { code: 'KR', name: 'Korean' },
  { code: 'CN', name: 'Chinese' },
  { code: 'PT', name: 'Portuguese' },
  { code: 'AR', name: 'Arabic' },
  { code: 'RU', name: 'Russian' },
];

export const getServersByRegion = (region: string): EvonyServer[] => {
  if (region === 'ALL') return EVONY_SERVERS;
  return EVONY_SERVERS.filter(server => server.region === region);
};

export const getServersByLanguage = (language: string): EvonyServer[] => {
  if (language === 'ALL') return EVONY_SERVERS;
  return EVONY_SERVERS.filter(server => server.language === language);
};

export const getActiveServers = (): EvonyServer[] => {
  return EVONY_SERVERS.filter(server => server.isActive);
};

export const getServerById = (id: string): EvonyServer | undefined => {
  return EVONY_SERVERS.find(server => server.id === id);
};

export const filterServers = (
  region: string = 'ALL',
  language: string = 'ALL',
  activeOnly: boolean = true
): EvonyServer[] => {
  let servers = EVONY_SERVERS;

  if (activeOnly) {
    servers = servers.filter(server => server.isActive);
  }

  if (region !== 'ALL') {
    servers = servers.filter(server => server.region === region);
  }

  if (language !== 'ALL') {
    servers = servers.filter(server => server.language === language);
  }

  return servers;
};
