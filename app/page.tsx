'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to homepage
    router.push('/homepage');
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl animate-pulse">
          <span className="text-3xl">⚔️</span>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Evony Monster Tracker</h1>
        <p className="text-gray-400">Redirecting to homepage...</p>
      </div>
    </div>
  );
}
