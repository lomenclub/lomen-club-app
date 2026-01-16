#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function checkDocker() {
  console.log('🔍 Checking Docker status...');
  
  try {
    // Check if Docker is installed
    const { stdout: versionStdout } = await execAsync('docker --version');
    console.log(`✅ Docker installed: ${versionStdout.trim()}`);
    
    // Check if Docker daemon is running
    try {
      const { stdout: infoStdout } = await execAsync('docker info');
      const lines = infoStdout.split('\n');
      const serverVersion = lines.find(line => line.includes('Server Version'));
      const containers = lines.find(line => line.includes('Containers'));
      
      console.log(`✅ Docker daemon is running`);
      if (serverVersion) console.log(`   ${serverVersion.trim()}`);
      if (containers) console.log(`   ${containers.trim()}`);
      
      // Check if Docker Compose is available
      try {
        const { stdout: composeStdout } = await execAsync('docker-compose --version');
        console.log(`✅ Docker Compose: ${composeStdout.trim()}`);
      } catch {
        console.log('⚠️  Docker Compose not found, trying Docker Compose plugin...');
        try {
          const { stdout: composePluginStdout } = await execAsync('docker compose version');
          console.log(`✅ Docker Compose plugin: ${composePluginStdout.trim()}`);
        } catch {
          console.log('❌ Docker Compose not available');
          console.log('   Install with: brew install docker-compose');
        }
      }
      
      return true;
      
    } catch (error) {
      console.log('❌ Docker daemon is not running');
      console.log('');
      console.log('🔧 Start Docker Desktop:');
      console.log('   1. Open Docker Desktop app');
      console.log('   2. Wait for Docker icon to show "Docker Desktop is running"');
      console.log('   3. Try again: npm run check:docker');
      console.log('');
      console.log('📋 Alternative startup commands:');
      console.log('   # On macOS:');
      console.log('   open -a Docker');
      console.log('');
      console.log('   # Wait for Docker to start, then check:');
      console.log('   docker ps');
      return false;
    }
    
  } catch (error) {
    console.log('❌ Docker is not installed');
    console.log('');
    console.log('🔧 Installation instructions:');
    console.log('   1. Download Docker Desktop: https://www.docker.com/products/docker-desktop/');
    console.log('   2. Install and launch Docker Desktop');
    console.log('   3. Complete the setup wizard');
    console.log('   4. Restart your terminal');
    console.log('');
    console.log('📋 Verify installation:');
    console.log('   docker --version');
    return false;
  }
}

async function checkDockerComposeFile() {
  console.log('\n📋 Checking docker-compose configuration...');
  
  const fs = await import('fs');
  const path = await import('path');
  const { fileURLToPath } = await import('url');
  
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const composeFile = path.join(__dirname, '../docker-compose.kcc-node.yml');
  
  if (fs.existsSync(composeFile)) {
    console.log(`✅ docker-compose.kcc-node.yml found`);
    
    const content = fs.readFileSync(composeFile, 'utf8');
    const services = content.match(/^  [a-zA-Z-]+:/gm) || [];
    
    console.log(`   Services configured: ${services.length}`);
    services.forEach(service => {
      console.log(`   - ${service.trim().replace(':', '')}`);
    });
    
    return true;
  } else {
    console.log('❌ docker-compose.kcc-node.yml not found');
    return false;
  }
}

async function checkPorts() {
  console.log('\n🔌 Checking required ports...');
  
  const ports = [
    { port: 8545, service: 'KCC Node RPC' },
    { port: 8546, service: 'KCC Node WebSocket' },
    { port: 6379, service: 'Redis Cache' },
    { port: 30303, service: 'KCC P2P' }
  ];
  
  const netstat = await import('net');
  
  for (const { port, service } of ports) {
    return new Promise((resolve) => {
      const server = netstat.createServer();
      
      server.once('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          console.log(`   ⚠️  Port ${port} (${service}) is in use`);
        } else {
          console.log(`   ✅ Port ${port} (${service}) is available`);
        }
        server.close();
        resolve();
      });
      
      server.once('listening', () => {
        console.log(`   ✅ Port ${port} (${service}) is available`);
        server.close();
        resolve();
      });
      
      server.listen(port);
    });
  }
}

async function main() {
  console.log('🚀 Docker Environment Check');
  console.log('─'.repeat(50));
  
  const dockerOk = await checkDocker();
  
  if (!dockerOk) {
    console.log('\n❌ Docker issues detected. Please fix before proceeding.');
    process.exit(1);
  }
  
  await checkDockerComposeFile();
  await checkPorts();
  
  console.log('\n🎉 Docker environment is ready!');
  console.log('');
  console.log('🚀 Next steps:');
  console.log('   1. Start infrastructure: npm run dev:infra');
  console.log('   2. Check sync status: npm run check:sync');
  console.log('   3. Monitor progress: npm run monitor:sync');
  console.log('');
  console.log('💡 Tip: Run this check anytime: npm run check:docker');
}

main().catch(console.error);
