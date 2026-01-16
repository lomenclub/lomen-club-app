#!/usr/bin/env node

/**
 * Test script to demonstrate missing timeout wrapper for blockchain RPC calls.
 * This script shows how contract calls could hang indefinitely without timeout.
 */

import { ethers } from 'ethers';
import { withTimeout, DEFAULT_RPC_TIMEOUT_MS } from '../packages/blockchain/src/timeoutUtils.js';

// Simulate a slow RPC endpoint (commented out because we can't actually modify the node)
// Instead, we'll demonstrate the pattern for adding timeouts to contract calls.

async function testContractCallWithTimeout() {
  const RPC_URL = process.env.KCC_RPC_URL || 'http://localhost:8545';
  const CONTRACT_ADDRESS = process.env.LOMEN_NFT_CONTRACT || '0x4ca64bf392ee736f6007ce93e022deb471a9dfd1';
  
  const ERC721_ABI = [
    "function ownerOf(uint256 tokenId) public view returns (address)",
  ];
  
  console.log('Testing contract call timeout pattern...');
  console.log(`RPC URL: ${RPC_URL}`);
  console.log(`Contract: ${CONTRACT_ADDRESS}`);
  
  // Create provider WITHOUT timeout (default behavior)
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, ERC721_ABI, provider);
  
  const tokenId = 1;
  
  try {
    // Method 1: Direct call (no timeout) - could hang
    console.log('\n1. Direct contract call (no timeout):');
    const directPromise = contract.ownerOf(tokenId);
    // We'll race it with a timeout manually
    const directResult = await withTimeout(
      directPromise,
      DEFAULT_RPC_TIMEOUT_MS,
      `Contract call ownerOf(${tokenId}) timed out after ${DEFAULT_RPC_TIMEOUT_MS}ms`
    );
    console.log(`   Success: ${directResult}`);
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }
  
  // Show the pattern that should be used in the actual service
  console.log('\n2. Recommended pattern for blockchain service:');
  console.log(`
    // In your route handler:
    async function getOwner(tokenId) {
      try {
        const ownerPromise = nftContract.ownerOf(tokenId);
        const ownerAddress = await withTimeout(
          ownerPromise,
          DEFAULT_RPC_TIMEOUT_MS,
          \`RPC timeout: ownerOf(\${tokenId}) took too long\`
        );
        return ownerAddress;
      } catch (error) {
        // Handle timeout or other errors
        throw error;
      }
    }
  `);
  
  console.log('\n3. Current implementation analysis:');
  console.log('   - Blockchain service index.ts uses provider without explicit timeout');
  console.log('   - Contract calls may hang indefinitely if KCC node stalls');
  console.log('   - Solution: Wrap all contract calls with withTimeout()');
  
  console.log('\n4. Risk assessment:');
  console.log('   - Severity: Medium');
  console.log('   - Likelihood: Low (KCC node is stable)');
  console.log('   - Impact: High (service becomes unresponsive)');
  console.log('   - Mitigation: Add timeout wrapper to all blockchain interactions');
}

testContractCallWithTimeout().catch(console.error);
