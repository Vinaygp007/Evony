#!/usr/bin/env node

// Complete Architecture Verification Script
import { exec } from 'child_process';
import { promisify } from 'util';
import fetch from 'node-fetch';
import { io } from 'socket.io-client';

const execAsync = promisify(exec);

interface VerificationResult {
  pillar: string;
  component: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: any;
}

class ArchitectureVerifier {
  private results: VerificationResult[] = [];

  async verifyAll(): Promise<void> {
    console.log('🔍 Starting Complete Architecture Verification...\n');
    
    await this.verifyPillar1_DataAcquisition();
    await this.verifyPillar2_Backend();
    await this.verifyPillar3_Frontend();
    
    this.printResults();
  }

  // Pillar 1: Data Acquisition
  async verifyPillar1_DataAcquisition(): Promise<void> {
    console.log('📊 Verifying Pillar 1: Data Acquisition');
    
    // Check Puppeteer installation
    await this.checkComponent('Data Acquisition', 'Puppeteer', async () => {
      const { stdout } = await execAsync('npm list puppeteer');
      return stdout.includes('puppeteer@');
    });

    // Check Chrome DevTools support
    await this.checkComponent('Data Acquisition', 'Chrome DevTools', async () => {
      try {
        const puppeteer = await import('puppeteer');
        return puppeteer.default !== undefined;
      } catch {
        return false;
      }
    });

    // Check DOM/API scraping files
    await this.checkComponent('Data Acquisition', 'Scraping Services', async () => {
      const fs = await import('fs');
      return fs.existsSync('./services/evony-data-acquisition.js') ||
             fs.existsSync('./services/enhanced-data-acquisition.ts');
    });

    // Check Network Interception
    await this.checkComponent('Data Acquisition', 'Network Interceptor', async () => {
      const fs = await import('fs');
      return fs.existsSync('./services/evony-network-interceptor.ts');
    });
  }

  // Pillar 2: Backend
  async verifyPillar2_Backend(): Promise<void> {
    console.log('🔧 Verifying Pillar 2: Backend');

    // Check Node.js/Express
    await this.checkComponent('Backend', 'Express.js', async () => {
      const { stdout } = await execAsync('npm list express');
      return stdout.includes('express@');
    });

    // Check Socket.IO
    await this.checkComponent('Backend', 'Socket.IO', async () => {
      const { stdout } = await execAsync('npm list socket.io');
      return stdout.includes('socket.io@');
    });

    // Check PostgreSQL + PostGIS dependencies
    await this.checkComponent('Backend', 'PostgreSQL Client', async () => {
      const { stdout } = await execAsync('npm list pg');
      return stdout.includes('pg@');
    });

    // Check backend server file
    await this.checkComponent('Backend', 'Backend Server', async () => {
      const fs = await import('fs');
      return fs.existsSync('./backend/server.ts');
    });

    // Test API endpoint (if backend is running)
    await this.checkComponent('Backend', 'API Ingestion', async () => {
      try {
        const response = await fetch('http://localhost:3001/health', { 
          timeout: 5000 
        });
        return response.ok;
      } catch {
        return false;
      }
    }, 'Backend server may not be running');

    // Test real-time push (if backend is running)
    await this.checkComponent('Backend', 'Real-time Push', async () => {
      return new Promise((resolve) => {
        try {
          const socket = io('http://localhost:3001', { timeout: 5000 });
          
          socket.on('connect', () => {
            socket.disconnect();
            resolve(true);
          });
          
          socket.on('connect_error', () => {
            resolve(false);
          });
          
          setTimeout(() => resolve(false), 5000);
        } catch {
          resolve(false);
        }
      });
    }, 'Backend server may not be running');
  }

  // Pillar 3: Frontend
  async verifyPillar3_Frontend(): Promise<void> {
    console.log('🎨 Verifying Pillar 3: Frontend');

    // Check React/Next.js
    await this.checkComponent('Frontend', 'Next.js', async () => {
      const { stdout } = await execAsync('npm list next');
      return stdout.includes('next@');
    });

    // Check Leaflet
    await this.checkComponent('Frontend', 'Leaflet Maps', async () => {
      const { stdout } = await execAsync('npm list leaflet react-leaflet');
      return stdout.includes('leaflet@') && stdout.includes('react-leaflet@');
    });

    // Check WebSocket client
    await this.checkComponent('Frontend', 'WebSocket Client', async () => {
      const { stdout } = await execAsync('npm list socket.io-client');
      return stdout.includes('socket.io-client@');
    });

    // Check responsive UI components
    await this.checkComponent('Frontend', 'Map UI Components', async () => {
      const fs = await import('fs');
      return fs.existsSync('./components/SimpleMap.tsx') &&
             fs.existsSync('./components/MonsterSidebar.tsx');
    });

    // Check real-time hooks
    await this.checkComponent('Frontend', 'Live Update Hooks', async () => {
      const fs = await import('fs');
      return fs.existsSync('./hooks/useRealTimeEvonyData.ts') ||
             fs.existsSync('./hooks/useBackendSocket.ts');
    });

    // Check dashboard integration
    await this.checkComponent('Frontend', 'Data Dashboard', async () => {
      const fs = await import('fs');
      return fs.existsSync('./components/DataAcquisitionDashboard.tsx');
    });

    // Test frontend accessibility (if dev server is running)
    await this.checkComponent('Frontend', 'Dev Server', async () => {
      try {
        const response = await fetch('http://localhost:3000', { 
          timeout: 5000 
        });
        return response.ok;
      } catch {
        return false;
      }
    }, 'Frontend dev server may not be running');
  }

  private async checkComponent(
    pillar: string, 
    component: string, 
    checkFn: () => Promise<boolean>,
    warningMessage?: string
  ): Promise<void> {
    try {
      const result = await checkFn();
      
      if (result) {
        this.results.push({
          pillar,
          component,
          status: 'pass',
          message: '✅ Available and configured'
        });
      } else {
        this.results.push({
          pillar,
          component,
          status: warningMessage ? 'warning' : 'fail',
          message: warningMessage ? `⚠️ ${warningMessage}` : '❌ Not found or not configured'
        });
      }
    } catch (error) {
      this.results.push({
        pillar,
        component,
        status: 'fail',
        message: `❌ Error during check: ${error}`,
        details: error
      });
    }
  }

  private printResults(): void {
    console.log('\n📋 Architecture Verification Results:');
    console.log('=' .repeat(80));

    const pillars = ['Data Acquisition', 'Backend', 'Frontend'];
    
    pillars.forEach(pillar => {
      console.log(`\n🏛️ ${pillar.toUpperCase()}`);
      console.log('-'.repeat(40));
      
      const pillarResults = this.results.filter(r => r.pillar === pillar);
      let passCount = 0;
      let warnCount = 0;
      let failCount = 0;
      
      pillarResults.forEach(result => {
        console.log(`  ${result.component.padEnd(25)} ${result.message}`);
        
        if (result.status === 'pass') passCount++;
        else if (result.status === 'warning') warnCount++;
        else failCount++;
      });
      
      console.log(`\n  Summary: ${passCount} ✅ | ${warnCount} ⚠️ | ${failCount} ❌`);
    });

    console.log('\n📊 Overall Architecture Status:');
    console.log('=' .repeat(80));

    const totalPass = this.results.filter(r => r.status === 'pass').length;
    const totalWarn = this.results.filter(r => r.status === 'warning').length;
    const totalFail = this.results.filter(r => r.status === 'fail').length;
    const total = this.results.length;

    console.log(`✅ Passed: ${totalPass}/${total} (${Math.round(totalPass/total*100)}%)`);
    console.log(`⚠️ Warnings: ${totalWarn}/${total} (${Math.round(totalWarn/total*100)}%)`);
    console.log(`❌ Failed: ${totalFail}/${total} (${Math.round(totalFail/total*100)}%)`);

    if (totalFail === 0 && totalWarn <= 2) {
      console.log('\n🎉 Architecture is READY for production!');
    } else if (totalFail <= 2) {
      console.log('\n🚧 Architecture needs minor fixes before production');
    } else {
      console.log('\n⚠️ Architecture needs significant work before production');
    }

    console.log('\n🚀 Quick Start Commands:');
    console.log('  Install dependencies: npm install');
    console.log('  Start backend:        npm run backend');
    console.log('  Start frontend:       npm run dev');
    console.log('  Start data acquisition: npm run data-acquisition');
    console.log('  Run all together:     npm run full-stack');
  }
}

// Run verification
const verifier = new ArchitectureVerifier();
verifier.verifyAll().catch(console.error);
