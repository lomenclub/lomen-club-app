#!/usr/bin/env node

/**
 * Test script to demonstrate authentication challenge rate limiting issue.
 * This script sends multiple challenge requests to see if rate limiting is effective.
 */

import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3002/api/auth';
const WALLET_ADDRESS = '0x742d35Cc6634C0532925a3b844Bc9eC0c6Dd6d3C';

async function sendChallengeRequest(index) {
  try {
    const response = await fetch(`${API_BASE}/challenge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wallet_address: `${WALLET_ADDRESS}${index}` })
    });
    
    const data = await response.json();
    return {
      success: response.ok,
      status: response.status,
      data
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function main() {
  console.log('Testing authentication challenge rate limiting...');
  console.log(`Sending 10 challenge requests with different wallet addresses...`);
  
  const results = [];
  for (let i = 0; i < 10; i++) {
    const result = await sendChallengeRequest(i);
    results.push(result);
    console.log(`Request ${i + 1}: ${result.success ? 'SUCCESS' : 'FAILED'} (status: ${result.status})`);
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  const successCount = results.filter(r => r.success).length;
  const failureCount = results.filter(r => !r.success).length;
  
  console.log('\n=== Summary ===');
  console.log(`Total requests: ${results.length}`);
  console.log(`Successful: ${successCount}`);
  console.log(`Failed: ${failureCount}`);
  
  // Check if any failures were due to rate limiting (status 429)
  const rateLimitFailures = results.filter(r => r.status === 429);
  console.log(`Rate limited (429): ${rateLimitFailures.length}`);
  
  if (rateLimitFailures.length === 0) {
    console.log('\n⚠️  WARNING: No rate limiting detected on challenge endpoint.');
    console.log('   An attacker could generate unlimited challenges, potentially exhausting memory.');
  } else {
    console.log('\n✅ Rate limiting is working on challenge endpoint.');
  }
  
  // Check challenge storage (we can't directly inspect, but we can infer)
  console.log('\n=== Security Note ===');
  console.log('Challenges are stored in memory with 5-minute expiration.');
  console.log('Without per-IP or per-wallet rate limiting, an attacker could:');
  console.log('1. Generate many challenges to fill memory');
  console.log('2. Cause denial of service for legitimate users');
  console.log('3. Potentially exhaust server resources');
}

main().catch(console.error);
