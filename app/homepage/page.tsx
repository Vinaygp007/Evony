'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Homepage() {
  const [isLoaded, setIsLoaded] = useState(false);

  // Trigger animation after component mounts
  useEffect(() => {
    setTimeout(() => setIsLoaded(true), 100);
  }, []);

  const features = [
    {
      icon: '🗺️',
      title: 'Real-time Map Tracking',
      description: 'Track monster locations on an interactive map with live updates and position markers.'
    },
    {
      icon: '👾',
      title: 'Monster Database',
      description: 'Comprehensive database of all Evony monsters with levels, types, and spawn information.'
    },
    {
      icon: '🌍',
      title: 'Multi-Server Support',
      description: 'Filter and track monsters across different Evony servers and regions worldwide.'
    },
    {
      icon: '⚡',
      title: 'Live Updates',
      description: 'Receive instant notifications when new monsters spawn or existing ones are defeated.'
    },
    {
      icon: '🎯',
      title: 'Advanced Filtering',
      description: 'Filter monsters by type, level range, server, and custom search criteria.'
    },
    {
      icon: '📊',
      title: 'Analytics & Stats',
      description: 'View detailed statistics and analytics about monster spawns and hunting patterns.'
    }
  ];

  const stats = [
    { label: 'Active Servers', value: '150+', icon: '🌐' },
    { label: 'Monster Types', value: '25+', icon: '👹' },
    { label: 'Daily Tracks', value: '10K+', icon: '📈' },
    { label: 'Active Users', value: '5K+', icon: '👥' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600/5 rounded-full blur-3xl animate-ping delay-2000"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 bg-gray-900/95 backdrop-blur-sm border-b border-purple-500/20 shadow-2xl">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-xl">⚔️</span>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Evony Monster Tracker
              </h1>
            </div>
            <nav className="hidden md:flex items-center space-x-6">
              <a href="#features" className="text-gray-300 hover:text-purple-400 transition-colors">Features</a>
              <a href="#stats" className="text-gray-300 hover:text-purple-400 transition-colors">Stats</a>
              <a href="#about" className="text-gray-300 hover:text-purple-400 transition-colors">About</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-32 px-6">
        <div className="container mx-auto text-center">
          <div className={`transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="mb-8">
              <div className="w-24 h-24 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl transform hover:scale-105 transition-transform duration-300">
                <span className="text-4xl">🏰</span>
              </div>
              <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-blue-400 to-purple-400 bg-clip-text text-transparent leading-tight">
                Master the Hunt
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
                The ultimate companion for Evony monster hunters. Track, locate, and conquer monsters across all servers with real-time updates and advanced filtering.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 mb-16">
              <Link href="/tracker" className="group">
                <button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-lg font-bold py-4 px-8 rounded-xl shadow-2xl transform group-hover:scale-105 transition-all duration-300 flex items-center space-x-3">
                  <span>🚀</span>
                  <span>Start Tracking</span>
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </Link>
              <button className="bg-gray-800/50 hover:bg-gray-700/50 backdrop-blur-sm border border-gray-600 text-white text-lg font-medium py-4 px-8 rounded-xl transition-all duration-300 flex items-center space-x-3">
                <span>📖</span>
                <span>Learn More</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="relative z-10 py-20 px-6">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className={`text-center transition-all duration-1000 delay-${index * 200} ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 hover:border-purple-500/50 transition-all duration-300 group">
                  <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">{stat.icon}</div>
                  <div className="text-3xl font-bold text-purple-400 mb-2">{stat.value}</div>
                  <div className="text-gray-400 text-sm">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 py-20 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Powerful Features
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Everything you need to become the ultimate monster hunter in Evony
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className={`transition-all duration-1000 delay-${index * 100} ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 h-full hover:border-purple-500/50 hover:bg-gray-700/50 transition-all duration-300 group">
                  <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">{feature.icon}</div>
                  <h3 className="text-xl font-bold text-white mb-3 group-hover:text-purple-300 transition-colors">{feature.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-20 px-6">
        <div className="container mx-auto text-center">
          <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 backdrop-blur-sm border border-purple-500/30 rounded-3xl p-12">
            <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Ready to Dominate?
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Join thousands of players who are already using Evony Monster Tracker to gain the competitive edge.
            </p>
            <Link href="/tracker">
              <button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-xl font-bold py-4 px-10 rounded-xl shadow-2xl transform hover:scale-105 transition-all duration-300 flex items-center space-x-3 mx-auto">
                <span>⚔️</span>
                <span>Begin Your Hunt</span>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 bg-gray-900/95 border-t border-purple-500/20 py-12 px-6">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-lg">⚔️</span>
            </div>
            <span className="text-xl font-bold text-white">Evony Monster Tracker</span>
          </div>
          <p className="text-gray-400 mb-6">
            The premier tool for serious Evony monster hunters worldwide.
          </p>
          <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
            <span>© 2025 Evony Monster Tracker</span>
            <span>•</span>
            <a href="#" className="hover:text-purple-400 transition-colors">Privacy</a>
            <span>•</span>
            <a href="#" className="hover:text-purple-400 transition-colors">Terms</a>
            <span>•</span>
            <a href="#" className="hover:text-purple-400 transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
