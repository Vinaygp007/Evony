'use client';

import { useEffect, useState } from 'react';

// Simple test component to see if the issue is with our map or something else
export const TestMap = () => {
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    
    // Test if we can import Leaflet
    import('leaflet').then((L) => {
      console.log('Leaflet loaded successfully:', L.version);
    }).catch((err) => {
      console.error('Failed to load Leaflet:', err);
      setError(`Failed to load Leaflet: ${err.message}`);
    });

    // Test if we can import react-leaflet
    import('react-leaflet').then(() => {
      console.log('React-Leaflet loaded successfully');
    }).catch((err) => {
      console.error('Failed to load React-Leaflet:', err);
      setError(`Failed to load React-Leaflet: ${err.message}`);
    });
  }, []);

  if (!mounted) {
    return <div>Loading...</div>;
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 border border-red-300 rounded">
        <h3 className="text-red-800 font-bold">Test Error:</h3>
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-green-100 border border-green-300 rounded">
      <h3 className="text-green-800 font-bold">Test Success:</h3>
      <p className="text-green-700">Client-side loading test passed. Check console for details.</p>
    </div>
  );
};

export default TestMap;
