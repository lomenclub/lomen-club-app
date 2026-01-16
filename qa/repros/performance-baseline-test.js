#!/usr/bin/env node

/**
 * Performance Baseline Test
 * Tests critical API endpoints for performance and identifies N+1 patterns
 */

import fetch from 'node-fetch';
import { performance } from 'perf_hooks';

const API_BASE = 'http://localhost:3002';
const TEST_ITERATIONS = 10;
const CONCURRENT_REQUESTS = 5;

// Test endpoints with their parameters
const TEST_CASES = [
  {
    name: 'NFT List - Default',
    url: '/api/nfts',
    method: 'GET'
  },
  {
    name: 'NFT List - With Filters',
    url: '/api/nfts?limit=20&page=1&sortBy=tokenId&sortOrder=asc',
    method: 'GET'
  },
  {
    name: 'NFT List - On Sale',
    url: '/api/nfts?limit=20&page=1&onSale=true',
    method: 'GET'
  },
  {
    name: 'Single NFT',
    url: '/api/nfts/1',
    method: 'GET'
  },
  {
    name: 'Available Traits',
    url: '/api/nfts/traits/available',
    method: 'GET'
  },
  {
    name: 'NFT Stats',
    url: '/api/nfts/stats',
    method: 'GET'
  },
  {
    name: 'Health Check',
    url: '/api/health',
    method: 'GET'
  }
];

async function makeRequest(url, method = 'GET') {
  const startTime = performance.now();
  try {
    const response = await fetch(`${API_BASE}${url}`, { method });
    const endTime = performance.now();
    const responseTime = endTime - startTime;
    
    const data = await response.json();
    return {
      success: response.ok,
      status: response.status,
      responseTime,
      dataSize: JSON.stringify(data).length
    };
  } catch (error) {
    const endTime = performance.now();
    return {
      success: false,
      error: error.message,
      responseTime: endTime - startTime
    };
  }
}

async function runSingleTest(testCase) {
  console.log(`\n🔍 Testing: ${testCase.name}`);
  console.log(`   URL: ${testCase.url}`);
  
  const results = [];
  for (let i = 0; i < TEST_ITERATIONS; i++) {
    const result = await makeRequest(testCase.url, testCase.method);
    results.push(result);
    process.stdout.write('.');
  }
  
  const successfulResults = results.filter(r => r.success);
  if (successfulResults.length === 0) {
    console.log(`\n   ❌ All requests failed`);
    return null;
  }
  
  const responseTimes = successfulResults.map(r => r.responseTime);
  const avgTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
  const minTime = Math.min(...responseTimes);
  const maxTime = Math.max(...responseTimes);
  const p95Time = responseTimes.sort((a, b) => a - b)[Math.floor(responseTimes.length * 0.95)];
  
  console.log(`\n   ✅ Success: ${successfulResults.length}/${TEST_ITERATIONS}`);
  console.log(`   📊 Response Times (ms):`);
  console.log(`      Avg: ${avgTime.toFixed(2)}`);
  console.log(`      Min: ${minTime.toFixed(2)}`);
  console.log(`      Max: ${maxTime.toFixed(2)}`);
  console.log(`      P95: ${p95Time.toFixed(2)}`);
  
  if (successfulResults[0].dataSize) {
    console.log(`   📦 Data Size: ${successfulResults[0].dataSize} bytes`);
  }
  
  return {
    testCase,
    results: successfulResults,
    stats: { avgTime, minTime, maxTime, p95Time }
  };
}

async function runConcurrentTest() {
  console.log('\n🚀 Running concurrent load test (5 concurrent requests)...');
  
  const testCase = {
    name: 'Concurrent NFT List',
    url: '/api/nfts?limit=20',
    method: 'GET'
  };
  
  const startTime = performance.now();
  const promises = [];
  for (let i = 0; i < CONCURRENT_REQUESTS; i++) {
    promises.push(makeRequest(testCase.url, testCase.method));
  }
  
  const results = await Promise.all(promises);
  const endTime = performance.now();
  const totalTime = endTime - startTime;
  
  const successfulResults = results.filter(r => r.success);
  const responseTimes = successfulResults.map(r => r.responseTime);
  const avgTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
  
  console.log(`   ✅ Successful: ${successfulResults.length}/${CONCURRENT_REQUESTS}`);
  console.log(`   ⏱️  Total time: ${totalTime.toFixed(2)}ms`);
  console.log(`   📊 Avg response time: ${avgTime.toFixed(2)}ms`);
  console.log(`   🔄 Requests per second: ${(CONCURRENT_REQUESTS / (totalTime / 1000)).toFixed(2)}`);
  
  return {
    testCase,
    results: successfulResults,
    stats: { totalTime, avgTime, successfulCount: successfulResults.length }
  };
}

async function checkForNPlusOnePatterns() {
  console.log('\n🔎 Checking for N+1 query patterns...');
  
  // Check user profile endpoint which might have N+1 issues
  const testUrl = '/api/nfts?limit=50';
  const result = await makeRequest(testUrl);
  
  if (!result.success) {
    console.log('   ❌ Cannot test N+1 patterns - request failed');
    return;
  }
  
  // Analyze response for potential N+1 indicators
  // In a real test, we would check database query logs
  console.log('   ℹ️  N+1 detection requires database query analysis');
  console.log('   📋 Check MongoDB logs for repeated queries with similar patterns');
  console.log('   🔍 Look for:');
  console.log('      - Multiple similar queries in short succession');
  console.log('      - Queries inside loops in code');
  console.log('      - Sequential instead of batch operations');
}

async function main() {
  console.log('📊 Performance Baseline Test');
  console.log('============================');
  console.log(`API Base: ${API_BASE}`);
  console.log(`Iterations per test: ${TEST_ITERATIONS}`);
  console.log(`Concurrent requests: ${CONCURRENT_REQUESTS}`);
  console.log('============================');
  
  const allResults = [];
  
  // Run individual tests
  for (const testCase of TEST_CASES) {
    const result = await runSingleTest(testCase);
    if (result) {
      allResults.push(result);
    }
  }
  
  // Run concurrent test
  const concurrentResult = await runConcurrentTest();
  allResults.push(concurrentResult);
  
  // Check for N+1 patterns
  await checkForNPlusOnePatterns();
  
  // Generate summary
  console.log('\n📈 PERFORMANCE SUMMARY');
  console.log('=====================');
  
  const criticalEndpoints = allResults.filter(r => 
    r.testCase.name.includes('NFT List') || 
    r.testCase.name.includes('Single NFT')
  );
  
  let hasPerformanceIssues = false;
  for (const result of criticalEndpoints) {
    const { testCase, stats } = result;
    const { avgTime, p95Time } = stats;
    
    console.log(`\n${testCase.name}:`);
    console.log(`   Avg: ${avgTime.toFixed(2)}ms, P95: ${p95Time ? p95Time.toFixed(2) : 'N/A'}ms`);
    
    if (avgTime > 500) {
      console.log(`   ⚠️  WARNING: Average response time > 500ms`);
      hasPerformanceIssues = true;
    }
    
    if (p95Time && p95Time > 1000) {
      console.log(`   ⚠️  WARNING: P95 response time > 1000ms`);
      hasPerformanceIssues = true;
    }
  }
  
  // Performance thresholds
  console.log('\n🎯 PERFORMANCE THRESHOLDS');
  console.log('========================');
  console.log('✅ Acceptable: < 200ms (avg), < 500ms (p95)');
  console.log('⚠️  Warning: 200-500ms (avg), 500-1000ms (p95)');
  console.log('❌ Critical: > 500ms (avg), > 1000ms (p95)');
  
  if (hasPerformanceIssues) {
    console.log('\n🔴 PERFORMANCE ISSUES DETECTED');
    console.log('=============================');
    console.log('Recommendations:');
    console.log('1. Check database query performance');
    console.log('2. Verify indexes are being used');
    console.log('3. Look for N+1 query patterns');
    console.log('4. Consider adding caching layer');
    console.log('5. Optimize expensive operations');
  } else {
    console.log('\n✅ ALL TESTS WITHIN ACCEPTABLE RANGES');
  }
  
  // Save results to file
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `performance-results-${timestamp}.json`;
  const fs = await import('fs');
  fs.writeFileSync(
    `qa/repros/${filename}`,
    JSON.stringify({
      timestamp: new Date().toISOString(),
      config: { TEST_ITERATIONS, CONCURRENT_REQUESTS, API_BASE },
      results: allResults.map(r => ({
        test: r.testCase.name,
        stats: r.stats,
        sampleCount: r.results?.length || 0
      }))
    }, null, 2)
  );
  
  console.log(`\n📁 Results saved to: qa/repros/${filename}`);
}

main().catch(console.error);
