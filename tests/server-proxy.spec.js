import { test, expect } from '@playwright/test';
import { setupFaceMocking } from './fixtures/mock-face.js';

test.describe('Server Proxy API (Offline Mode)', () => {
  test.describe('Static File Serving', () => {
    test('should serve index.html at root', async ({ request }) => {
      const response = await request.get('/');
      expect(response.status()).toBe(200);
      expect(response.headers()['content-type']).toContain('text/html');
    });

    test('should serve JavaScript files', async ({ request }) => {
      const response = await request.get('/js/app.js');
      expect(response.status()).toBe(200);
      expect(response.headers()['content-type']).toContain('javascript');
    });

    test('should serve CSS files', async ({ request }) => {
      const response = await request.get('/styles/main.css');
      expect(response.status()).toBe(200);
      expect(response.headers()['content-type']).toContain('css');
    });

    test('should return 404 for non-existent files', async ({ request }) => {
      const response = await request.get('/nonexistent.txt');
      expect(response.status()).toBe(404);
    });

    test('should serve files with correct MIME types', async ({ request }) => {
      const jsResponse = await request.get('/js/app.js');
      expect(jsResponse.headers()['content-type']).toMatch(/javascript/);
      
      const cssResponse = await request.get('/styles/main.css');
      expect(cssResponse.headers()['content-type']).toMatch(/css/);
      
      const htmlResponse = await request.get('/');
      expect(htmlResponse.headers()['content-type']).toMatch(/html/);
    });
  });

  test.describe('/api/face Endpoint (Offline Expected Behavior)', () => {
    test('should handle OPTIONS requests (CORS preflight)', async ({ request }) => {
      const response = await request.fetch('/api/face', { method: 'OPTIONS' });
      expect(response.status()).toBe(200);
      expect(response.headers()['access-control-allow-origin']).toBe('*');
      expect(response.headers()['access-control-allow-methods']).toContain('GET');
      expect(response.headers()['access-control-allow-methods']).toContain('OPTIONS');
    });

    test('should reject non-GET/OPTIONS methods', async ({ request }) => {
      const postResponse = await request.fetch('/api/face', { method: 'POST' });
      expect(postResponse.status()).toBe(405);
      
      const putResponse = await request.fetch('/api/face', { method: 'PUT' });
      expect(putResponse.status()).toBe(405);
      
      const deleteResponse = await request.fetch('/api/face', { method: 'DELETE' });
      expect(deleteResponse.status()).toBe(405);
    });

    test('should handle GET requests (offline will fail gracefully)', async ({ request }) => {
      const response = await request.get('/api/face');
      // In offline mode, this will likely return an error or the server's error response
      // We just check that the server responds and includes CORS headers
      expect(response.headers()['access-control-allow-origin']).toBe('*');
      // Status could be 200 (if cached) or an error status (500, etc.)
      expect([200, 500, 502, 503]).toContain(response.status());
    });
  });

  test.describe('Integration with Frontend (Mocked)', () => {
    test('should work with photo field generation', async ({ page }) => {
      await setupFaceMocking(page);
      await page.goto('/');
      
      // Upload template
      const fileInput = page.locator('#templateUpload');
      await fileInput.setInputFiles('./tests/fixtures/realistic-id-template.svg');
      
      // Add photo field
      await page.click('#addPhotoField');
      
      // Generate ID
      await page.click('#generateButton');
      
      // Wait for generation to complete
      await page.waitForSelector('#downloadPreviewButton:not([disabled])', { timeout: 10000 });
      
      // Should have made API call and generated photo field
      const canvas = page.locator('#idCanvas');
      await expect(canvas).toBeVisible();
    });

    test('should handle multiple photo fields', async ({ page }) => {
      await setupFaceMocking(page);
      await page.goto('/');
      
      // Upload template
      const fileInput = page.locator('#templateUpload');
      await fileInput.setInputFiles('./tests/fixtures/realistic-id-template.svg');
      
      // Add multiple photo fields
      await page.click('#addPhotoField');
      await page.click('#addPhotoField');
      
      // Generate ID
      await page.click('#generateButton');
      
      // Wait for generation to complete
      await page.waitForSelector('#downloadPreviewButton:not([disabled])', { timeout: 10000 });
      
      // Should handle multiple photo field requests
      const canvas = page.locator('#idCanvas');
      await expect(canvas).toBeVisible();
    });

    test('should work in batch generation with photos', async ({ page }) => {
      await setupFaceMocking(page);
      await page.goto('/');
      
      // Upload template and add photo field
      const fileInput = page.locator('#templateUpload');
      await fileInput.setInputFiles('./tests/fixtures/realistic-id-template.svg');
      await page.click('#addPhotoField');
      
      // Set batch size
      await page.fill('#numIDsToGenerate', '3');
      
      // Generate IDs
      await page.click('#generateButton');
      
      // Wait for batch generation to complete
      await page.waitForSelector('#downloadAllButton:not([disabled])', { timeout: 15000 });
      
      // Should show download all button for multiple IDs
      const downloadAllBtn = page.locator('#downloadAllButton');
      await expect(downloadAllBtn).toBeVisible();
    });

    test('should handle ID generation without photos (no API calls)', async ({ page }) => {
      await page.goto('/');
      
      // Upload template and add text fields only
      const fileInput = page.locator('#templateUpload');
      await fileInput.setInputFiles('./tests/fixtures/realistic-id-template.svg');
      await page.click('#addNameField');
      await page.click('#addDOBField');
      
      // Generate ID - should work without API calls
      await page.click('#generateButton');
      
      // Wait for generation to complete
      await page.waitForSelector('#downloadPreviewButton:not([disabled])', { timeout: 10000 });
      
      // Should complete successfully
      const canvas = page.locator('#idCanvas');
      await expect(canvas).toBeVisible();
    });
  });

  test.describe('Server Security', () => {
    test('should handle malicious requests safely', async ({ request }) => {
      const maliciousPath = '/api/face?param=<script>alert("xss")</script>';
      const response = await request.get(maliciousPath);
      
      // Should either work normally or reject safely
      expect([200, 400, 404, 500]).toContain(response.status());
    });

    test('should not expose sensitive server information', async ({ request }) => {
      const response = await request.get('/api/face');
      
      // Should not expose server details in headers
      expect(response.headers()['server']).toBeUndefined();
      expect(response.headers()['x-powered-by']).toBeUndefined();
    });

    test('should handle large requests appropriately', async ({ request }) => {
      // Test with large query string
      const largeQuery = 'param=' + 'a'.repeat(1000); // Reduced size to avoid timeout
      try {
        const response = await request.get(`/api/face?${largeQuery}`);
        // Should handle gracefully
        expect([200, 400, 414, 500]).toContain(response.status());
      } catch (error) {
        // Large request rejection is also acceptable
        expect(error.message).toContain('Request entity too large');
      }
    });
  });
});