/**
 * k6 load test — target 1000 concurrent users
 *
 * Usage:
 *   k6 run tests/load-test.js --env API_URL=https://api.example.com
 */
import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend } from "k6/metrics";

const BASE = __ENV.API_URL || "http://localhost:8080";

const errorRate = new Rate("errors");
const latency = new Trend("api_latency", true);

export const options = {
  stages: [
    { duration: "30s", target: 100 },
    { duration: "1m", target: 500 },
    { duration: "2m", target: 1000 },
    { duration: "1m", target: 1000 },
    { duration: "30s", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(95)<500"],
    errors: ["rate<0.05"],
  },
};

export default function () {
  const endpoints = [
    { method: "GET", path: "/api/site-content/hero" },
    { method: "GET", path: "/api/site-content/features" },
    { method: "GET", path: "/api/site-content/pricing" },
    { method: "GET", path: "/api/food-database?q=chicken" },
    { method: "GET", path: "/api/exercise-library" },
  ];

  const ep = endpoints[Math.floor(Math.random() * endpoints.length)];
  const res = http.request(ep.method, `${BASE}${ep.path}`, null, {
    headers: { "Content-Type": "application/json" },
    tags: { endpoint: ep.path },
  });

  latency.add(res.timings.duration);

  const ok = check(res, {
    "status is 2xx": (r) => r.status >= 200 && r.status < 300,
    "response time < 500ms": (r) => r.timings.duration < 500,
  });

  errorRate.add(!ok);
  sleep(0.5 + Math.random());
}
