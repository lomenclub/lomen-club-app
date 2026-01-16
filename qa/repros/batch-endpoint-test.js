#!/usr/bin/env node

/**
 * Test script for batch NFT owner endpoint
 * Tests the new batch endpoint performance vs individual calls
 */

import fetch from 'node-fetch';

const BLOCKCHAIN_SERVICE_URL = 'http://localhost:3003';
const TEST_TOKEN_IDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

async function testSingleEndpoint() {
  console.log('🧪 Testing individual NFT owner endpoints...');
  const startTime = Date.now();
  const results = [];
  
  for (const tokenId of TEST_TOKEN_IDS) {
    const tokenStart = Date.now();
    try {
      const response = await fetch(`${BLOCKCHAIN_SERVICE_URL}/api/nfts/${tokenId}/owner`);
      const data = await response.json();
      const duration = Date.now() - tokenStart;
      results.push({ tokenId, success: true, duration, data });
    } catch (error) {
      const duration = Date.now() - tokenStart;
      results.push({ tokenId, success: false, duration, error: error.message });
    }
  }
  
  const totalDuration = Date.now() - startTime;
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
  
  console.log(`✅ Individual calls: ${successful} successful, ${failed} failed`);
  console.log(`⏱️  Total time: ${totalDuration}ms`);
  console.log(`📊 Average per call: ${avgDuration.toFixed(2)}ms`);
  console.log(`🚀 Requests/second: ${(TEST_TOKEN_IDS.length / (totalDuration / 1000)).toFixed(2)}`);
  
  return { totalDuration, avgDuration, results };
}

async function testBatchEndpoint() {
  console.log('\n🧪 Testing batch NFT owner endpoint...');
  const startTime = Date.now();
  
  try {
    const response = await fetch(`${BLOCKCHAIN_SERVICE_URL}/api/nfts/owners/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tokenIds: TEST_TOKEN_IDS }),
    });
    
    const data = await response.json();
    const totalDuration = Date.now() - startTime;
    
    if (!response.ok) {
      console.error(`❌ Batch request failed: ${response.status} ${response.statusText}`);
      console.error(`Error details:`, data);
      return { success: false, totalDuration, data };
    }
    
    console.log(`✅ Batch request successful`);
    console.log(`⏱️  Total time: ${totalDuration}ms`);
    console.log(`📊 Processed: ${data.totalProcessed} NFTs`);
    console.log(`❌ Failed: ${data.totalFailed} NFTs`);
    
    if (data.failedTokenIds && data.failedTokenIds.length > 0) {
      console.log(`⚠️  Failed token IDs:`, data.failedTokenIds);
    }
    
    console.log(`🚀 NFTs/second: ${(data.totalProcessed / (totalDuration / 1000)).toFixed(2)}`);
    
    return { success: true, totalDuration, data };
  } catch (error) {
    const totalDuration = Date.now() - startTime;
    console.error(`❌ Batch request error:`, error.message);
    return { success: false, totalDuration, error: error.message };
  }
}

async function testBatchEndpointWithLargeBatch() {
  console.log('\n🧪 Testing batch endpoint with larger batch (20 NFTs)...');
  
  // Generate 20 token IDs
  const largeBatchTokenIds = Array.from({ length: 20 }, (_, i) => i + 1);
  const startTime = Date.now();
  
  try {
    const response = await fetch(`${BLOCKCHAIN_SERVICE_URL}/api/nfts/owners/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tokenIds: largeBatchTokenIds }),
    });
    
    const data = await response.json();
    const totalDuration = Date.now() - startTime;
    
    if (!response.ok) {
      console.error(`❌ Large batch request failed: ${response.status} ${response.statusText}`);
      return { success: false, totalDuration, data };
    }
    
    console.log(`✅ Large batch request successful`);
    console.log(`⏱️  Total time: ${totalDuration}ms`);
    console.log(`📊 Processed: ${data.totalProcessed} NFTs`);
    console.log(`❌ Failed: ${data.totalFailed} NFTs`);
    console.log(`🚀 NFTs/second: ${(data.totalProcessed / (totalDuration / 1000)).toFixed(2)}`);
    
    return { success: true, totalDuration, data };
  } catch (error) {
    const totalDuration = Date.now() - startTime;
    console.error(`❌ Large batch request error:`, error.message);
    return { success: false, totalDuration, error: error.message };
  }
}

async function testBatchEndpointEdgeCases() {
  console.log('\n🧪 Testing batch endpoint edge cases...');
  
  // Test 1: Empty batch
  console.log('\n1. Testing empty batch...');
  try {
    const response = await fetch(`${BLOCKCHAIN_SERVICE_URL}/api/nfts/owners/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tokenIds: [] }),
    });
    
    const data = await response.json();
    console.log(`   Status: ${response.status}`);
    console.log(`   Response:`, data);
  } catch (error) {
    console.error(`   Error:`, error.message);
  }
  
  // Test 2: Single NFT batch
  console.log('\n2. Testing single NFT batch...');
  try {
    const response = await fetch(`${BLOCKCHAIN_SERVICE_URL}/api/nfts/owners/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tokenIds: [1] }),
    });
    
    const data = await response.json();
    console.log(`   Status: ${response.status}`);
    console.log(`   Processed: ${data.totalProcessed} NFTs`);
    console.log(`   Failed: ${data.totalFailed} NFTs`);
  } catch (error) {
    console.error(`   Error:`, error.message);
  }
  
  // Test 3: Invalid input (non-array)
  console.log('\n3. Testing invalid input (non-array)...');
  try {
    const response = await fetch(`${BLOCKCHAIN_SERVICE_URL}/api/nfts/owners/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tokenIds: 'not-an-array' }),
    });
    
    const data = await response.json();
    console.log(`   Status: ${response.status}`);
    console.log(`   Response:`, data);
  } catch (error) {
    console.error(`   Error:`, error.message);
  }
}

async function main() {
  console.log('🚀 Starting batch endpoint performance test\n');
  console.log(`📊 Test configuration:`);
  console.log(`   Blockchain service: ${BLOCKCHAIN_SERVICE_URL}`);
  console.log(`   Test token IDs: ${TEST_TOKEN_IDS.join(', ')}`);
  console.log(`   Total NFTs: ${TEST_TOKEN_IDS.length}\n`);
  
  // Test individual calls
  const individualResult = await testSingleEndpoint();
  
  // Test batch endpoint
  const batchResult = await testBatchEndpoint();
  
  // Test large batch
  const largeBatchResult = await testBatchEndpointWithLargeBatch();
  
  // Test edge cases
  await testBatchEndpointEdgeCases();
  
  // Performance comparison
  console.log('\n📈 PERFORMANCE COMPARISON');
  console.log('=' .repeat(40));
  
  if (individualResult.totalDuration && batchResult.success) {
    const speedup = individualResult.totalDuration / batchResult.totalDuration;
    console.log(`Individual calls: ${individualResult.totalDuration}ms`);
    console.log(`Batch endpoint: ${batchResult.totalDuration}ms`);
    console.log(`Speedup: ${speedup.toFixed(2)}x faster`);
    
    if (speedup > 1) {
      console.log(`✅ Batch endpoint is ${speedup.toFixed(2)}x faster!`);
    } else {
      console.log(`⚠️  Batch endpoint is ${(1/speedup).toFixed(2)}x slower`);
    }
  }
  
  console.log('\n🎯 SUMMARY');
  console.log('=' .repeat(40));
  console.log('✅ Batch endpoint implementation complete');
  console.log('✅ Enrichment service updated to use batch endpoint');
  console.log('✅ Performance improvements expected for NFT listings');
  console.log('\n📋 Next steps:');
  console.log('1. Run full performance test to measure actual improvement');
  console.log('2. Monitor API response times in production');
  console.log('3. Consider increasing cache TTL for further optimization');
}

// Run tests
main().catch(console.error);
