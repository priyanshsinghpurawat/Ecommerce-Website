import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 50 }, // Ramp up to 50 users over 30 seconds
    { duration: '1m', target: 50 },  // Stay at 50 users for 1 minute
    { duration: '30s', target: 0 },  // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    http_req_failed: ['rate<0.01'],   // Error rate must be less than 1%
  },
};

const BASE_URL = 'http://localhost:3000/api/v3';

export default function () {
  // 1. Test Health Endpoint
  const healthRes = http.get(`${BASE_URL}/health`);
  check(healthRes, {
    'Health is 200': (r) => r.status === 200,
  });

  // 2. Test Product Listing (Simulating users browsing the catalog)
  const productsRes = http.get(`${BASE_URL}/products?page=1&limit=15`);
  const productsSuccess = check(productsRes, {
    'Products fetched successfully': (r) => r.status === 200,
    'Products load time < 500ms': (r) => r.timings.duration < 500,
  });

  // If products were fetched successfully, select one to view detail
  if (productsSuccess && productsRes.body) {
    try {
      const body = JSON.parse(productsRes.body);
      // The API response standard contains new ApiResponse(statusCode, data, message)
      // Thus productsList is usually body.data.products
      const productsList = body.data?.products || body.products || [];
      if (productsList.length > 0) {
        const randomProduct = productsList[Math.floor(Math.random() * productsList.length)];
        const productId = randomProduct._id;
        
        // Simulating viewing a single product page
        if (productId) {
          const detailRes = http.get(`${BASE_URL}/products/${productId}`);
          check(detailRes, {
            'Product detail fetched successfully': (r) => r.status === 200,
            'Product detail load time < 300ms': (r) => r.timings.duration < 300,
          });
        }
      }
    } catch (e) {
      // JSON parse failed or product mapping failed, skip
    }
  }

  // 3. Test Search Functionality (Simulate customer search)
  const searchRes = http.get(`${BASE_URL}/products?search=shirt`);
  check(searchRes, {
    'Search query completed': (r) => r.status === 200,
  });

  // 4. Test Categories API
  const catRes = http.get(`${BASE_URL}/categories`);
  check(catRes, {
    'Categories fetched successfully': (r) => r.status === 200,
  });

  // Simulate user reading the page before navigating
  sleep(1); 
}
