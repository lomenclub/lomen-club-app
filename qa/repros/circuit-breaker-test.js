#!/usr/bin/env node

/**
 * Test script to verify circuit breaker pattern for RPC calls
 * Simulates RPC failures and tests circuit breaker state transitions
 */

import fetch from 'node-fetch';

const BLOCKCHAIN_URL = 'http://localhost:3003';

async function testCircuitBreaker() {
  console.log('🚀 Testing Circuit Breaker Pattern\n');
  
  // Step 1: Get initial health status
  console.log('1. Getting initial health status...');
  const healthResponse = await fetch(`${BLOCKCHAIN_URL}/api/health`);
  const healthData = await healthResponse.json();
  
  console.log(`   Initial circuit breaker state: ${healthData.resilience.circuitBreaker.state}`);
  console.log(`   Is healthy: ${healthData.resilience.circuitBreaker.isHealthy}`);
  console.log(`   Failure count: ${healthData.resilience.circuitBreaker.failureCount}`);
  
  // Step 2: Test normal operation
  console.log('\n2. Testing normal operation...');
  const startTime = Date.now();
  const nftResponse = await fetch(`${BLOCKCHAIN_URL}/api/nfts/1/owner`);
  const nftData = await nftResponse.json();
  const normalTime = Date.now() - startTime;
  
  console.log(`   NFT 1 owner: ${nftData.ownerShort}`);
  console.log(`   Response time: ${normalTime}ms`);
  console.log(`   Status: ${nftResponse.status}`);
  
  // Step 3: Get health status after successful call
  console.log('\n3. Checking health after successful call...');
  const healthAfterSuccess = await fetch(`${BLOCKCHAIN_URL}/api/health`);
  const healthAfterSuccessData = await healthAfterSuccess.json();
  
  console.log(`   Circuit breaker state: ${healthAfterSuccessData.resilience.circuitBreaker.state}`);
  console.log(`   Failure count: ${healthAfterSuccessData.resilience.circuitBreaker.failureCount}`);
  
  // Step 4: Test batch endpoint (should also work)
  console.log('\n4. Testing batch endpoint...');
  const batchStart = Date.now();
  const batchResponse = await fetch(`${BLOCKCHAIN_URL}/api/nfts/owners/batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tokenIds: [1, 2, 3, 4, 5] })
  });
  const batchData = await batchResponse.json();
  const batchTime = Date.now() - batchStart;
  
  console.log(`   Batch processed: ${batchData.totalProcessed} NFTs`);
  console.log(`   Batch failed: ${batchData.totalFailed} NFTs`);
  console.log(`   Batch time: ${batchTime}ms`);
  
  // Step 5: Test with invalid token ID (should fail but not open circuit breaker)
  console.log('\n5. Testing with invalid NFT (should fail gracefully)...');
  try {
    const invalidResponse = await fetch(`${BLOCKCHAIN_URL}/api/nfts/999999/owner`);
    const invalidData = await invalidResponse.json();
    console.log(`   Response status: ${invalidResponse.status}`);
    console.log(`   Error message: ${invalidData.error || 'No error'}`);
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }
  
  // Step 6: Check health after mixed operations
  console.log('\n6. Checking final health status...');
  const finalHealth = await fetch(`${BLOCKCHAIN_URL}/api/health`);
  const finalHealthData = await finalHealth.json();
  
  console.log(`   Final circuit breaker state: ${finalHealthData.resilience.circuitBreaker.state}`);
  console.log(`   Final failure count: ${finalHealthData.resilience.circuitBreaker.failureCount}`);
  console.log(`   Time since last failure: ${finalHealthData.resilience.circuitBreaker.timeSinceLastFailure}`);
  console.log(`   Time since last state change: ${finalHealthData.resilience.circuitBreaker.timeSinceLastStateChange}ms`);
  
  // Step 7: Test resilience configuration
  console.log('\n7. Testing resilience configuration...');
  console.log(`   Default timeout: ${finalHealthData.resilience.config.timeoutMs}ms`);
  console.log(`   Max retries: ${finalHealthData.resilience.config.maxRetries}`);
  console.log(`   Retry delay: ${finalHealthData.resilience.config.retryDelayMs}ms`);
  
  // Summary
  console.log('\n🎯 SUMMARY');
  console.log('='.repeat(50));
  
  const circuitState = finalHealthData.resilience.circuitBreaker.state;
  const isHealthy = finalHealthData.resilience.circuitBreaker.isHealthy;
  const failureCount = finalHealthData.resilience.circuitBreaker.failureCount;
  
  if (circuitState === 'CLOSED' && isHealthy && failureCount === 0) {
    console.log('✅ SUCCESS: Circuit breaker working correctly!');
    console.log('   • Circuit remains CLOSED during normal operation');
    console.log('   • No failures recorded');
    console.log('   • All endpoints responding correctly');
  } else if (circuitState === 'CLOSED' && failureCount > 0) {
    console.log('⚠️  WARNING: Failures recorded but circuit remains CLOSED');
    console.log(`   • ${failureCount} failures recorded`);
    console.log('   • Circuit breaker threshold not reached');
  } else if (circuitState === 'OPEN') {
    console.log('❌ CRITICAL: Circuit breaker is OPEN');
    console.log('   • Too many failures, circuit opened');
    console.log('   • Service is in degraded mode');
  } else if (circuitState === 'HALF_OPEN') {
    console.log('🔄 RECOVERY: Circuit breaker is HALF_OPEN');
    console.log('   • Service is testing recovery');
    console.log('   • Monitoring success rate');
  }
  
  console.log('\n📋 Recommendations:');
  console.log('   • Monitor circuit breaker state in production');
  console.log('   • Set up alerts for OPEN state');
  console.log('   • Consider adjusting thresholds based on usage patterns');
  console.log('   • Test with simulated RPC failures (requires stopping KCC node)');
}

// Run the test
testCircuitBreaker().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});
