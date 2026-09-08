// LVIGS Mart k6 Load Test
// Usage: k6 run --vus 10 --duration 30s loadtest/k6-test.js

import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend, Counter } from "k6/metrics";

const errorRate = new Rate("errors");
const requestDuration = new Trend("request_duration");
const successfulRequests = new Counter("successful_requests");

const BASE_URL = __ENV.BASE_URL || "http://localhost:4000";

export const options = {
  stages: [
    { duration: "30s", target: 10 },  // Ramp up to 10 VUs
    { duration: "1m", target: 20 },   // Ramp up to 20 VUs
    { duration: "2m", target: 50 },   // Ramp up to 50 VUs
    { duration: "1m", target: 20 },   // Ramp down
    { duration: "30s", target: 0 },   // Ramp down to 0
  ],
  thresholds: {
    http_req_duration: ["p(95)<500"],  // 95% of requests under 500ms
    errors: ["rate<0.1"],              // Error rate under 10%
  },
};

export default function () {
  const scenarios = [
    { name: "Health Check", weight: 0.05 },
    { name: "Banners Active", weight: 0.15 },
    { name: "Products List", weight: 0.25 },
    { name: "Product Categories", weight: 0.1 },
    { name: "Product Brands", weight: 0.1 },
    { name: "Search", weight: 0.2 },
    { name: "Offers Active", weight: 0.1 },
    { name: "Flash Sales", weight: 0.05 },
  ];

  const rand = Math.random();
  let cumulative = 0;
  let selectedScenario;

  for (const scenario of scenarios) {
    cumulative += scenario.weight;
    if (rand <= cumulative) {
      selectedScenario = scenario.name;
      break;
    }
  }

  let response;

  switch (selectedScenario) {
    case "Health Check":
      response = http.get(`${BASE_URL}/api/health`);
      break;

    case "Banners Active":
      response = http.get(`${BASE_URL}/api/banners/active`);
      break;

    case "Products List":
      response = http.get(`${BASE_URL}/api/products?limit=20`);
      break;

    case "Product Categories":
      response = http.get(`${BASE_URL}/api/products/categories`);
      break;

    case "Product Brands":
      response = http.get(`${BASE_URL}/api/products/brands`);
      break;

    case "Search":
      const queries = ["phone", "wireless", "laptop", "camera", "headphones"];
      const q = queries[Math.floor(Math.random() * queries.length)];
      response = http.get(`${BASE_URL}/api/search?q=${q}`);
      break;

    case "Offers Active":
      response = http.get(`${BASE_URL}/api/banners/offers/active`);
      break;

    case "Flash Sales":
      response = http.get(`${BASE_URL}/api/banners/flash-sales/active`);
      break;

    default:
      response = http.get(`${BASE_URL}/api/health`);
  }

  const success = check(response, {
    "status is 200": (r) => r.status === 200,
    "response time < 500ms": (r) => r.timings.duration < 500,
    "response time < 1000ms": (r) => r.timings.duration < 1000,
  });

  if (!success) {
    errorRate.add(1);
  } else {
    successfulRequests.add(1);
  }

  requestDuration.add(response.timings.duration);

  sleep(0.5 + Math.random() * 1.5); // 0.5-2s think time
}

export function handleSummary(data) {
  return {
    "loadtest/results/summary.json": JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: " ", enableColors: true }),
  };
}

function textSummary(data, options) {
  const lines = [];
  lines.push("");
  lines.push("╔══════════════════════════════════════╗");
  lines.push("║      LVIGS Mart Load Test Report     ║");
  lines.push("╚══════════════════════════════════════╝");
  lines.push("");

  if (data.metrics.http_reqs) {
    lines.push(`Total Requests:    ${data.metrics.http_reqs.values.count}`);
    lines.push(`Requests/sec:      ${data.metrics.http_reqs.values.rate.toFixed(2)}`);
  }

  if (data.metrics.http_req_duration) {
    lines.push("");
    lines.push("Response Times (ms):");
    lines.push(`  Min:    ${data.metrics.http_req_duration.values.min.toFixed(2)}`);
    lines.push(`  Max:    ${data.metrics.http_req_duration.values.max.toFixed(2)}`);
    lines.push(`  Avg:    ${data.metrics.http_req_duration.values.avg.toFixed(2)}`);
    lines.push(`  P50:    ${data.metrics.http_req_duration.values.med.toFixed(2)}`);
    lines.push(`  P90:    ${data.metrics.http_req_duration.values["p(90)"].toFixed(2)}`);
    lines.push(`  P95:    ${data.metrics.http_req_duration.values["p(95)"].toFixed(2)}`);
    lines.push(`  P99:    ${data.metrics.http_req_duration.values["p(99)"].toFixed(2)}`);
  }

  if (data.metrics.errors) {
    lines.push("");
    lines.push(`Error Rate:        ${(data.metrics.errors.values.rate * 100).toFixed(2)}%`);
  }

  if (data.metrics.http_req_failed) {
    lines.push(`Failed Requests:   ${data.metrics.http_req_failed.values.count}`);
  }

  return lines.join("\n");
}
