'use client';

import { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
  sidebar: ReactNode;
  title?: string;
}

export const Layout: React.FC<LayoutProps> = ({ children, sidebar, title = 'Monster Tracker' }) => {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600">Live Updates</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar - Mobile: Top, Desktop: Left */}
          <div className="w-full lg:w-80 order-2 lg:order-1">
            {sidebar}
          </div>
          
          {/* Map Container - Mobile: Bottom, Desktop: Right */}
          <div className="flex-1 order-1 lg:order-2">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="h-64 sm:h-80 lg:h-[600px] xl:h-[700px]">
                {children}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
