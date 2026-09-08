/**
 * LVIGS Mart Load Testing Script
 * 
 * Tests API endpoints under concurrent load.
 * 
 * Usage:
 *   node load-test.js [concurrency] [duration]
 *   node load-test.js 100 30    # 100 concurrent users for 30 seconds
 *   node load-test.js 500 60    # 500 concurrent users for 60 seconds
 *   node load-test.js 1000 30   # 1000 concurrent users for 30 seconds
 * 
 * Environment:
 *   API_URL=http://localhost:4000
 * 
 * WARNING: Only run against local/staging environments. NEVER run against production.
 */

const http = require("http");

const API_URL = process.env.API_URL || "http://localhost:4000";
const CONCURRENCY = parseInt(process.argv[2] || "50", 10);
const DURATION_SEC = parseInt(process.argv[3] || "30", 10);

const ENDPOINTS = [
  { name: "Health Check", method: "GET", path: "/api/health" },
  { name: "Products List", method: "GET", path: "/api/products" },
  { name: "Categories", method: "GET", path: "/api/products/categories" },
  { name: "Brands", method: "GET", path: "/api/products/brands" },
  { name: "Search", method: "GET", path: "/api/search?q=phone" },
  { name: "Banners", method: "GET", path: "/api/banners" },
  { name: "Trending", method: "GET", path: "/api/search/trending" },
];

let totalRequests = 0;
let successfulRequests = 0;
let failedRequests = 0;
let latencies = [];
let running = true;

function makeRequest(endpoint) {
  return new Promise((resolve) => {
    const start = Date.now();
    const url = new URL(endpoint.path, API_URL);

    const req = http.request(
      url,
      {
        method: endpoint.method,
        timeout: 10000,
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          const latency = Date.now() - start;
          totalRequests++;
          if (res.statusCode >= 200 && res.statusCode < 400) {
            successfulRequests++;
          } else {
            failedRequests++;
          }
          latencies.push(latency);
          resolve({ status: res.statusCode, latency });
        });
      }
    );

    req.on("error", () => {
      totalRequests++;
      failedRequests++;
      latencies.push(Date.now() - start);
      resolve({ status: 0, latency: Date.now() - start });
    });

    req.on("timeout", () => {
      req.destroy();
      totalRequests++;
      failedRequests++;
      latencies.push(Date.now() - start);
      resolve({ status: 0, latency: Date.now() - start });
    });

    req.end();
  });
}

async function worker() {
  while (running) {
    const endpoint = ENDPOINTS[Math.floor(Math.random() * ENDPOINTS.length)];
    await makeRequest(endpoint);
  }
}

function percentile(arr, p) {
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

async function main() {
  console.log(`\n=== LVIGS Mart Load Test ===`);
  console.log(`Target: ${API_URL}`);
  console.log(`Concurrency: ${CONCURRENCY}`);
  console.log(`Duration: ${DURATION_SEC}s`);
  console.log(`Endpoints: ${ENDPOINTS.length}`);
  console.log(`\nStarting...\n`);

  const workers = [];
  for (let i = 0; i < CONCURRENCY; i++) {
    workers.push(worker());
  }

  setTimeout(() => {
    running = false;
  }, DURATION_SEC * 1000);

  await Promise.all(workers);

  latencies.sort((a, b) => a - b);

  console.log(`\n=== Results ===`);
  console.log(`Total Requests:    ${totalRequests}`);
  console.log(`Successful:        ${successfulRequests}`);
  console.log(`Failed:            ${failedRequests}`);
  console.log(`Error Rate:        ${((failedRequests / totalRequests) * 100).toFixed(2)}%`);
  console.log(`Requests/sec:      ${(totalRequests / DURATION_SEC).toFixed(1)}`);
  console.log(`\nLatency (ms):`);
  console.log(`  p50:             ${percentile(latencies, 50)}`);
  console.log(`  p95:             ${percentile(latencies, 95)}`);
  console.log(`  p99:             ${percentile(latencies, 99)}`);
  console.log(`  min:             ${Math.min(...latencies)}`);
  console.log(`  max:             ${Math.max(...latencies)}`);
  console.log(`  avg:             ${(latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(1)}`);
  console.log(`\n=== Done ===\n`);
}

main().catch(console.error);
