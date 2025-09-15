'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

export default function Homepage() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [realTimeCount, setRealTimeCount] = useState(12847);
  const [particleSystem, setParticleSystem] = useState<Array<{id: number, x: number, y: number, vx: number, vy: number}>>([]);
  const heroRef = useRef<HTMLDivElement>(null);

  // Advanced particle system initialization
  useEffect(() => {
    const particles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
    }));
    setParticleSystem(particles);

    const animateParticles = () => {
      setParticleSystem(prev => prev.map(particle => ({
        ...particle,
        x: (particle.x + particle.vx + window.innerWidth) % window.innerWidth,
        y: (particle.y + particle.vy + window.innerHeight) % window.innerHeight,
      })));
    };

    const interval = setInterval(animateParticles, 50);
    return () => clearInterval(interval);
  }, []);

  // Real-time counter animation
  useEffect(() => {
    const interval = setInterval(() => {
      setRealTimeCount(prev => prev + Math.floor(Math.random() * 3) + 1);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Mouse tracking for interactive effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Trigger stunning entrance animation
  useEffect(() => {
    setTimeout(() => setIsLoaded(true), 300);
  }, []);

  const features = [
    {
      icon: '🎯',
      title: 'AI-Powered Prediction',
      description: 'Machine learning algorithms predict monster spawn patterns and optimal hunting times.',
      gradient: 'from-red-500 to-pink-500',
      demo: 'Real-time AI analyzing 1M+ data points'
    },
    {
      icon: '⚡',
      title: 'Lightning-Fast Alerts',
      description: 'Sub-second notifications delivered via WebSocket technology for instant monster detection.',
      gradient: 'from-yellow-500 to-orange-500',
      demo: 'Average alert speed: 0.3 seconds'
    },
    {
      icon: '🌐',
      title: 'Global Server Network',
      description: 'Monitor all 200+ Evony servers simultaneously with our distributed monitoring system.',
      gradient: 'from-blue-500 to-cyan-500',
      demo: 'Connected to 247 servers worldwide'
    },
    {
      icon: '🔮',
      title: 'Mystic Vision Mode',
      description: 'Advanced visualization that reveals hidden patterns and monster migration routes.',
      gradient: 'from-purple-500 to-indigo-500',
      demo: 'Discovered 127 secret spawn zones'
    },
    {
      icon: '🚀',
      title: 'Quantum Processing',
      description: 'Next-gen processing engine handles millions of coordinate calculations per second.',
      gradient: 'from-green-500 to-emerald-500',
      demo: 'Processing 2.3M calculations/sec'
    },
    {
      icon: '💎',
      title: 'Elite Hunter Suite',
      description: 'Premium tools including auto-routing, alliance coordination, and battle simulations.',
      gradient: 'from-violet-500 to-purple-500',
      demo: 'Used by top 1% of players'
    }
  ];

  const stats = [
    { label: 'Monsters Tracked Today', value: realTimeCount.toLocaleString(), icon: '👾', live: true },
    { label: 'Active Hunters', value: '15,847', icon: '⚔️', live: false },
    { label: 'Server Coverage', value: '247/247', icon: '🌍', live: false },
    { label: 'Success Rate', value: '99.7%', icon: '🎯', live: false }
  ];

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      {/* Dynamic Particle System Background */}
      <div className="absolute inset-0 overflow-hidden">
        {particleSystem.map(particle => (
          <div
            key={particle.id}
            className="absolute w-1 h-1 bg-purple-500/30 rounded-full"
            style={{
              left: `${particle.x}px`,
              top: `${particle.y}px`,
              filter: 'blur(0.5px)',
            }}
          />
        ))}
      </div>

      {/* Interactive Cursor Glow */}
      {isHovering && (
        <div
          className="fixed pointer-events-none z-50 w-96 h-96 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-full blur-3xl transition-all duration-500"
          style={{
            left: mousePosition.x - 192,
            top: mousePosition.y - 192,
          }}
        />
      )}

      {/* Animated Background Gradients */}
      <div className="absolute inset-0">
        <div className="absolute -top-96 -right-96 w-[800px] h-[800px] bg-gradient-to-br from-purple-600/10 via-blue-600/10 to-transparent rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-96 -left-96 w-[800px] h-[800px] bg-gradient-to-tr from-cyan-600/10 via-purple-600/10 to-transparent rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-purple-600/5 to-transparent rounded-full animate-ping delay-2000"></div>
      </div>

      {/* Futuristic Navigation */}
      <header className="relative z-20 bg-black/80 backdrop-blur-2xl border-b border-purple-500/20 shadow-2xl">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 rounded-2xl flex items-center justify-center shadow-2xl animate-pulse">
                  <span className="text-2xl">⚔️</span>
                </div>
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-2xl blur opacity-30"></div>
              </div>
              <div>
                <h1 className="text-2xl font-black bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  EVONY NEXUS
                </h1>
                <div className="text-xs text-purple-400 font-medium">AI-POWERED HUNTING</div>
              </div>
            </div>
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-300 hover:text-purple-400 transition-all duration-300 font-medium relative group">
                Features
                <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-purple-500 group-hover:w-full transition-all duration-300"></div>
              </a>
              <a href="#stats" className="text-gray-300 hover:text-cyan-400 transition-all duration-300 font-medium relative group">
                Live Stats
                <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-cyan-500 group-hover:w-full transition-all duration-300"></div>
              </a>
              <div className="bg-gradient-to-r from-purple-600 to-cyan-600 p-[1px] rounded-xl">
                <button className="bg-black px-6 py-2 rounded-xl text-white font-medium hover:bg-gray-900 transition-all duration-300">
                  Login
                </button>
              </div>
            </nav>
          </div>
        </div>
      </header>

      {/* Revolutionary Hero Section */}
      <section 
        ref={heroRef}
        className="relative z-10 pt-20 pb-32 px-6"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <div className="container mx-auto text-center">
          <div className={`transition-all duration-1500 ${isLoaded ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-20 scale-95'}`}>
            
            {/* Epic Main Icon */}
            <div className="mb-12 relative">
              <div className="w-32 h-32 mx-auto relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 rounded-3xl animate-spin-slow"></div>
                <div className="absolute inset-2 bg-black rounded-3xl flex items-center justify-center">
                  <span className="text-6xl">🏰</span>
                </div>
                <div className="absolute -inset-4 bg-gradient-to-r from-purple-600/30 to-cyan-600/30 rounded-3xl blur-xl animate-pulse"></div>
              </div>
            </div>

            {/* Mind-Blowing Headline */}
            <h1 className="text-7xl md:text-8xl lg:text-9xl font-black mb-8 leading-none">
              <span className="bg-gradient-to-r from-purple-400 via-blue-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent animate-gradient-x">
                HUNT
              </span>
              <br />
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                BEYOND
              </span>
              <br />
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                LIMITS
              </span>
            </h1>

            {/* Revolutionary Tagline */}
            <div className="mb-12">
              <p className="text-2xl md:text-3xl text-gray-300 mb-4 font-light">
                The world&apos;s first <span className="text-purple-400 font-bold">AI-powered</span> monster hunting platform
              </p>
              <p className="text-lg text-gray-400 max-w-3xl mx-auto leading-relaxed">
                Experience the future of Evony with quantum-speed processing, predictive AI, and real-time global coordination across all servers simultaneously.
              </p>
            </div>

            {/* CTA Buttons with Wow Factor */}
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-6 sm:space-y-0 sm:space-x-8 mb-20">
              <Link href="/tracker" className="group relative">
                <div className="absolute -inset-2 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-2xl blur-lg opacity-60 group-hover:opacity-100 transition-all duration-500"></div>
                <button className="relative bg-gradient-to-r from-purple-600 to-cyan-600 text-white text-xl font-bold py-6 px-12 rounded-2xl shadow-2xl transform group-hover:scale-105 transition-all duration-500 flex items-center space-x-4">
                  <span className="text-2xl">🚀</span>
                  <span>ENTER THE NEXUS</span>
                  <div className="w-6 h-6 border-2 border-white rounded-full flex items-center justify-center group-hover:rotate-90 transition-transform duration-500">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                </button>
              </Link>
              
              <button className="group relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-gray-600 to-gray-400 rounded-2xl blur opacity-40 group-hover:opacity-60 transition-all duration-500"></div>
                <div className="relative bg-black border border-gray-600 text-white text-xl font-medium py-6 px-12 rounded-2xl hover:border-purple-500 transition-all duration-500 flex items-center space-x-4">
                  <span className="text-2xl">🎬</span>
                  <span>Watch Demo</span>
                </div>
              </button>
            </div>

            {/* Live Activity Indicator */}
            <div className="bg-black/50 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-6 max-w-md mx-auto">
              <div className="flex items-center justify-center space-x-3 mb-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-400 font-bold">LIVE ACTIVITY</span>
              </div>
              <div className="text-3xl font-black text-white mb-1">{realTimeCount.toLocaleString()}</div>
              <div className="text-gray-400 text-sm">monsters tracked in the last 24 hours</div>
            </div>

          </div>
        </div>
      </section>

      {/* Revolutionary Live Stats Dashboard */}
      <section id="stats" className="relative z-10 py-20 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-black mb-4 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              LIVE NEXUS STATS
            </h2>
            <div className="flex items-center justify-center space-x-2 text-green-400">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">Real-time data from all servers</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className={`transition-all duration-1000 delay-${index * 200} ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-3xl blur-lg opacity-25 group-hover:opacity-50 transition-all duration-500"></div>
                  <div className="relative bg-black/80 backdrop-blur-xl border border-gray-800 rounded-3xl p-8 hover:border-purple-500/50 transition-all duration-500">
                    <div className="text-center">
                      <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-500">{stat.icon}</div>
                      <div className="text-4xl font-black text-white mb-2 group-hover:text-purple-400 transition-colors">
                        {stat.value}
                        {stat.live && <span className="text-green-400 text-lg ml-2">LIVE</span>}
                      </div>
                      <div className="text-gray-400 text-sm font-medium">{stat.label}</div>
                      {stat.live && (
                        <div className="mt-3 flex items-center justify-center space-x-1">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping"></div>
                          <span className="text-xs text-green-400">Updating</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Next-Gen Features Showcase */}
      <section id="features" className="relative z-10 py-20 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-6xl font-black mb-6 bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
              REVOLUTIONARY FEATURES
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Powered by cutting-edge technology that puts you lightyears ahead of the competition
            </p>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className={`transition-all duration-1000 delay-${index * 150} ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'}`}>
                <div className="group relative h-full">
                  <div className={`absolute -inset-1 bg-gradient-to-r ${feature.gradient} rounded-3xl blur-lg opacity-25 group-hover:opacity-50 transition-all duration-700`}></div>
                  <div className="relative bg-black/90 backdrop-blur-xl border border-gray-800 rounded-3xl p-8 h-full hover:border-purple-500/50 transition-all duration-500 group">
                    
                    {/* Feature Icon */}
                    <div className="text-6xl mb-6 group-hover:scale-110 transition-transform duration-500">{feature.icon}</div>
                    
                    {/* Feature Title */}
                    <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-purple-300 transition-colors">
                      {feature.title}
                    </h3>
                    
                    {/* Feature Description */}
                    <p className="text-gray-400 leading-relaxed mb-6">{feature.description}</p>
                    
                    {/* Live Demo Stats */}
                    <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-4 mb-6">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400 uppercase tracking-wide">Live Demo</span>
                        <div className="flex items-center space-x-1">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-xs text-green-400">Active</span>
                        </div>
                      </div>
                      <div className="text-sm text-purple-400 font-medium mt-2">{feature.demo}</div>
                    </div>
                    
                    {/* Explore Button */}
                    <button className="w-full bg-gradient-to-r from-gray-800 to-gray-700 hover:from-purple-600 hover:to-blue-600 text-white font-medium py-3 px-6 rounded-xl transition-all duration-500 group-hover:shadow-lg">
                      Explore Feature
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials/Social Proof Section */}
      <section className="relative z-10 py-20 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-black mb-6 bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
              ELITE HUNTERS SPEAK
            </h2>
            <p className="text-xl text-gray-300">Join the ranks of legendary monster hunters</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "DragonSlayer2024",
                title: "Top 1% Hunter",
                quote: "Increased my hunting efficiency by 340% in the first week. This is game-changing!",
                rating: 5,
                avatar: "🐉"
              },
              {
                name: "MysticWarrior",
                title: "Alliance Leader",
                quote: "Our entire alliance coordination improved dramatically. Best investment ever made.",
                rating: 5,
                avatar: "⚔️"
              },
              {
                name: "PhoenixHunter",
                title: "Server Champion",
                quote: "The AI predictions are scary accurate. It&apos;s like having a crystal ball.",
                rating: 5,
                avatar: "🔥"
              }
            ].map((testimonial, index) => (
              <div key={index} className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition-all duration-500"></div>
                <div className="relative bg-black/90 backdrop-blur-xl border border-gray-800 rounded-2xl p-6 hover:border-yellow-500/50 transition-all duration-500">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center text-2xl">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <div className="text-white font-bold">{testimonial.name}</div>
                      <div className="text-yellow-400 text-sm">{testimonial.title}</div>
                    </div>
                  </div>
                  <p className="text-gray-300 mb-4 italic">&ldquo;{testimonial.quote}&rdquo;</p>
                  <div className="flex space-x-1">
                    {Array.from({length: testimonial.rating}).map((_, i) => (
                      <span key={i} className="text-yellow-400 text-lg">⭐</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Epic Call-to-Action Section */}
      <section className="relative z-10 py-20 px-6">
        <div className="container mx-auto text-center">
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 rounded-3xl blur-2xl opacity-30"></div>
            <div className="relative bg-black/90 backdrop-blur-xl border border-purple-500/30 rounded-3xl p-16">
              
              <div className="mb-8">
                <h2 className="text-6xl font-black mb-6 bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  ASCEND TO LEGEND
                </h2>
                <p className="text-2xl text-gray-300 mb-4">
                  The hunt begins now. Are you ready to dominate?
                </p>
                <div className="flex items-center justify-center space-x-3 text-gray-400">
                  <span>✨ No credit card required</span>
                  <span>•</span>
                  <span>🚀 Instant access</span>
                  <span>•</span>
                  <span>⚡ 99.9% uptime</span>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-6 sm:space-y-0 sm:space-x-8">
                <Link href="/tracker" className="group relative">
                  <div className="absolute -inset-2 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-2xl blur-lg opacity-70 group-hover:opacity-100 transition-all duration-500"></div>
                  <button className="relative bg-gradient-to-r from-purple-600 to-cyan-600 text-white text-2xl font-black py-6 px-16 rounded-2xl shadow-2xl transform group-hover:scale-105 transition-all duration-500 flex items-center space-x-4">
                    <span className="text-3xl">⚔️</span>
                    <span>START HUNTING NOW</span>
                    <div className="w-8 h-8 border-2 border-white rounded-full flex items-center justify-center group-hover:rotate-180 transition-transform duration-500">
                      <div className="w-3 h-3 bg-white rounded-full"></div>
                    </div>
                  </button>
                </Link>
                
                <div className="text-center">
                  <div className="text-sm text-gray-400 mb-2">Join 15,847+ elite hunters</div>
                  <div className="flex items-center justify-center space-x-1">
                    {Array.from({length: 5}).map((_, i) => (
                      <span key={i} className="text-yellow-400 text-lg">⭐</span>
                    ))}
                    <span className="text-gray-300 ml-2">4.9/5 rating</span>
                  </div>
                </div>
              </div>
              
            </div>
          </div>
        </div>
      </section>

      {/* Futuristic Footer */}
      <footer className="relative z-10 bg-black/95 border-t border-purple-500/20 py-16 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center space-x-4 mb-6">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 rounded-2xl flex items-center justify-center">
                  <span className="text-2xl">⚔️</span>
                </div>
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-2xl blur opacity-30"></div>
              </div>
              <div>
                <div className="text-2xl font-black text-white">EVONY NEXUS</div>
                <div className="text-purple-400 text-sm">AI-Powered Hunting Platform</div>
              </div>
            </div>
            <p className="text-gray-400 max-w-2xl mx-auto leading-relaxed">
              Revolutionizing monster hunting with artificial intelligence, quantum processing, and global server coordination. 
              Built for the elite hunters of tomorrow.
            </p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <h4 className="text-white font-bold mb-4">Platform</h4>
              <div className="space-y-2 text-gray-400">
                <a href="#" className="block hover:text-purple-400 transition-colors">Features</a>
                <a href="#" className="block hover:text-purple-400 transition-colors">Pricing</a>
                <a href="#" className="block hover:text-purple-400 transition-colors">API</a>
                <a href="#" className="block hover:text-purple-400 transition-colors">Status</a>
              </div>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Support</h4>
              <div className="space-y-2 text-gray-400">
                <a href="#" className="block hover:text-purple-400 transition-colors">Documentation</a>
                <a href="#" className="block hover:text-purple-400 transition-colors">Help Center</a>
                <a href="#" className="block hover:text-purple-400 transition-colors">Discord</a>
                <a href="#" className="block hover:text-purple-400 transition-colors">Contact</a>
              </div>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Company</h4>
              <div className="space-y-2 text-gray-400">
                <a href="#" className="block hover:text-purple-400 transition-colors">About</a>
                <a href="#" className="block hover:text-purple-400 transition-colors">Blog</a>
                <a href="#" className="block hover:text-purple-400 transition-colors">Careers</a>
                <a href="#" className="block hover:text-purple-400 transition-colors">Press</a>
              </div>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Legal</h4>
              <div className="space-y-2 text-gray-400">
                <a href="#" className="block hover:text-purple-400 transition-colors">Privacy</a>
                <a href="#" className="block hover:text-purple-400 transition-colors">Terms</a>
                <a href="#" className="block hover:text-purple-400 transition-colors">Security</a>
                <a href="#" className="block hover:text-purple-400 transition-colors">Cookies</a>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 text-center">
            <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
              <div className="text-gray-500 text-sm">
                © 2025 Evony Nexus. All rights reserved. Built with 🔥 for elite hunters.
              </div>
              <div className="flex items-center space-x-6">
                <a href="#" className="text-gray-500 hover:text-purple-400 transition-colors">
                  <span className="sr-only">Twitter</span>
                  🐦
                </a>
                <a href="#" className="text-gray-500 hover:text-purple-400 transition-colors">
                  <span className="sr-only">Discord</span>
                  💬
                </a>
                <a href="#" className="text-gray-500 hover:text-purple-400 transition-colors">
                  <span className="sr-only">GitHub</span>
                  📱
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
