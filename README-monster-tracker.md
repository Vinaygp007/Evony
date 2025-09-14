# Monster Tracker Web App

A real-time monster tracking application built with Next.js, TypeScript, Tailwind CSS, React-Leaflet, and Socket.IO.

## Features

- 🗺️ Interactive map using Leaflet.js and React-Leaflet
- 🔄 Real-time updates via Socket.IO
- 📱 Responsive design for desktop and mobile
- 🔍 Advanced filtering by monster type and level
- 📊 Sidebar listing with monster details
- 🎯 Map bounds-based monster filtering
- 🎨 Custom styled monster markers with level indicators

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS
- **Map**: Leaflet.js with React-Leaflet
- **Real-time**: Socket.IO Client
- **State Management**: React Hooks (useState, useEffect, custom hooks)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. (Optional) Start the Socket.IO test server:
```bash
# Install socket.io for the test server
npm install socket.io

# Run the test server in a separate terminal
node socket-server.js
```

### Project Structure

```
├── app/
│   ├── api/monsters/route.ts      # REST API for monster data
│   ├── globals.css                # Global styles including Leaflet CSS
│   ├── layout.tsx                 # Root layout
│   └── page.tsx                   # Main page component
├── components/
│   ├── Layout.tsx                 # App layout with responsive design
│   ├── MonsterMap.tsx             # Interactive map component
│   └── MonsterSidebar.tsx         # Sidebar with filtering
├── hooks/
│   ├── useMonsters.ts             # Monster data management hook
│   └── useSocket.ts               # Socket.IO connection hook
├── types/
│   └── monster.ts                 # TypeScript interfaces
├── socket-server.js               # Test Socket.IO server
└── .env.local                     # Environment variables
```

## API Endpoints

### GET /api/monsters
Returns an array of monster objects.

**Query Parameters:**
- `type`: Filter by monster type
- `minLevel`: Minimum monster level
- `maxLevel`: Maximum monster level

**Response:**
```json
[
  {
    "id": "1",
    "monster": "Griffin",
    "level": 4,
    "x": 123.45,
    "y": 456.78,
    "timestamp": 1640995200000
  }
]
```

### POST /api/monsters
Creates a new monster.

**Request Body:**
```json
{
  "monster": "Dragon",
  "level": 8,
  "x": -45.67,
  "y": 123.89
}
```

## Socket.IO Events

### Client Events
- `join:room` - Join a map region room
- `leave:room` - Leave a map region room

### Server Events
- `monster:spawn` - New monster spawned
- `monster:update` - Monster updated
- `monster:remove` - Monster removed

## Components

### MonsterMap
Interactive Leaflet map displaying monsters as custom markers.

**Props:**
- `monsters`: Array of monsters to display
- `onBoundsChange`: Callback when map bounds change
- `className`: Additional CSS classes

### MonsterSidebar
Filterable list of monsters currently visible on the map.

**Props:**
- `monsters`: Array of monsters to display
- `loading`: Loading state
- `className`: Additional CSS classes

### Layout
Responsive layout component handling mobile and desktop views.

**Props:**
- `children`: Map component
- `sidebar`: Sidebar component
- `title`: Page title

## Custom Hooks

### useMonsters
Manages monster data fetching and state.

**Returns:**
- `monsters`: Current monsters array
- `loading`: Loading state
- `error`: Error message if any
- `addMonster`: Function to add a monster
- `updateMonster`: Function to update a monster
- `removeMonster`: Function to remove a monster
- `refetch`: Function to refetch data

### useSocket
Manages Socket.IO connection and real-time events.

**Parameters:**
- `onMonsterSpawn`: Callback for new monsters
- `onMonsterUpdate`: Callback for monster updates
- `onMonsterRemove`: Callback for monster removal

**Returns:**
- `socket`: Socket.IO instance
- `emitJoinRoom`: Function to join a room
- `emitLeaveRoom`: Function to leave a room

## Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Deployment

### Build for Production

```bash
npm run build
npm start
```

### Deploy to Vercel

The app is ready to deploy to Vercel. Make sure to set your environment variables in the Vercel dashboard.

## Development

### Adding New Monster Types

1. Update the monster type colors in both `MonsterMap.tsx` and `MonsterSidebar.tsx`
2. Add new types to the mock data in `app/api/monsters/route.ts`
3. Update the Socket.IO server monster types array

### Customizing the Map

- Modify the tile layer in `MonsterMap.tsx` to use different map styles
- Adjust the default center and zoom level
- Add additional map controls or layers

### Extending Filtering

- Add new filter criteria in the `MonsterFilter` interface
- Update the filtering logic in `MonsterSidebar.tsx`
- Add corresponding API query parameters

## Troubleshooting

### Map Not Loading
- Ensure Leaflet CSS is properly imported in `globals.css`
- Check browser console for tile loading errors
- Verify the component is properly wrapped with 'use client'

### Socket.IO Connection Issues
- Verify the Socket.IO server is running on port 3001
- Check CORS settings match your development URL
- Ensure environment variables are properly set

### TypeScript Errors
- Run `npm run build` to check for type errors
- Ensure all imports are properly typed
- Check that @types packages are installed

## License

MIT
