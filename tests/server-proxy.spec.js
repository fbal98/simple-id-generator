import { test, expect } from '@playwright/test';

test.describe('Server Proxy API', () => {
  test.describe('/api/face Endpoint', () => {
    test('should respond to GET requests', async ({ request }) => {
      const response = await request.get('/api/face');
      expect(response.ok()).toBeTruthy();
      expect(response.status()).toBe(200);
    });

    test('should return image content type', async ({ request }) => {
      const response = await request.get('/api/face');
      const contentType = response.headers()['content-type'];
      expect(contentType).toMatch(/^image\/(jpeg|jpg|png)/);
    });

    test('should include CORS headers', async ({ request }) => {
      const response = await request.get('/api/face');
      expect(response.headers()['access-control-allow-origin']).toBe('*');
    });

    test('should handle OPTIONS requests (CORS preflight)', async ({ request }) => {
      const response = await request.fetch('/api/face', { method: 'OPTIONS' });
      expect(response.status()).toBe(200);
      expect(response.headers()['access-control-allow-origin']).toBe('*');
      expect(response.headers()['access-control-allow-methods']).toContain('GET');
      expect(response.headers()['access-control-allow-methods']).toContain('OPTIONS');
    });

    test('should return different images on subsequent requests', async ({ request }) => {
      const response1 = await request.get('/api/face');
      const response2 = await request.get('/api/face');
      
      expect(response1.ok()).toBeTruthy();
      expect(response2.ok()).toBeTruthy();
      
      const body1 = await response1.body();
      const body2 = await response2.body();
      
      // Images should be different (unless extremely unlucky)
      expect(body1.equals(body2)).toBeFalsy();
    });

    test('should include no-cache headers', async ({ request }) => {
      const response = await request.get('/api/face');
      const cacheControl = response.headers()['cache-control'];
      expect(cacheControl).toContain('no-cache');
      expect(cacheControl).toContain('no-store');
      expect(cacheControl).toContain('must-revalidate');
    });

    test('should reject non-GET/OPTIONS methods', async ({ request }) => {
      const postResponse = await request.fetch('/api/face', { method: 'POST' });
      expect(postResponse.status()).toBe(405);
      expect(postResponse.headers()['access-control-allow-origin']).toBe('*');
      expect(postResponse.headers()['allow']).toContain('GET');
      expect(postResponse.headers()['allow']).toContain('OPTIONS');
      
      const putResponse = await request.fetch('/api/face', { method: 'PUT' });
      expect(putResponse.status()).toBe(405);
      
      const deleteResponse = await request.fetch('/api/face', { method: 'DELETE' });
      expect(deleteResponse.status()).toBe(405);
    });

    test('should return valid image data', async ({ request }) => {
      const response = await request.get('/api/face');
      const body = await response.body();
      
      // Check that it's a valid image by checking common image signatures
      const isJPEG = body[0] === 0xFF && body[1] === 0xD8;
      const isPNG = body[0] === 0x89 && body[1] === 0x50 && body[2] === 0x4E && body[3] === 0x47;
      const isWebP = body[8] === 0x57 && body[9] === 0x45 && body[10] === 0x42 && body[11] === 0x50;
      
      expect(isJPEG || isPNG || isWebP).toBeTruthy();
      
      // Should have reasonable file size
      expect(body.length).toBeGreaterThan(1000); // At least 1KB
      expect(body.length).toBeLessThan(5000000); // Less than 5MB
    });

    test('should handle high concurrent requests', async ({ request }) => {
      const requestPromises = Array(10).fill(null).map(() => request.get('/api/face'));
      const responses = await Promise.all(requestPromises);
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.ok()).toBeTruthy();
        expect(response.status()).toBe(200);
      });
      
      // All should have image content type
      responses.forEach(response => {
        const contentType = response.headers()['content-type'];
        expect(contentType).toMatch(/^image\/(jpeg|jpg|png)/);
      });
    });
  });

  test.describe('Error Handling', () => {
    test('should handle external API failures gracefully', async ({ page }) => {
      // Mock the external service to fail
      await page.route('https://thispersondoesnotexist.com/', route => {
        route.fulfill({
          status: 500,
          body: 'External Service Error'
        });
      });
      
      const response = await page.request.get('/api/face');
      expect(response.status()).toBe(500);
      expect(response.headers()['access-control-allow-origin']).toBe('*');
      
      const text = await response.text();
      expect(text).toContain('Failed to fetch AI face');
    });

    test('should handle external API timeout', async ({ page }) => {
      // Mock the external service to hang
      await page.route('https://thispersondoesnotexist.com/', route => {
        // Don't fulfill the route, causing a timeout
      });
      
      const response = await page.request.get('/api/face');
      // Should return error status
      expect(response.status()).toBeGreaterThanOrEqual(400);
      expect(response.headers()['access-control-allow-origin']).toBe('*');
    });

    test('should handle malformed external responses', async ({ page }) => {
      // Mock external service with invalid response
      await page.route('https://thispersondoesnotexist.com/', route => {
        route.fulfill({
          status: 200,
          contentType: 'text/plain',
          body: 'Not an image'
        });
      });
      
      const response = await page.request.get('/api/face');
      expect(response.status()).toBe(200);
      
      // Should proxy the response as-is
      const body = await response.text();
      expect(body).toBe('Not an image');
    });
  });

  test.describe('Integration with Frontend', () => {
    test('should work with photo field generation', async ({ page }) => {
      await page.goto('/');
      
      // Upload template and add photo field
      const fileInput = page.locator('#templateUpload');
      const testImagePath = require('path').join(__dirname, 'fixtures', 'realistic-id-template.svg');
      await fileInput.setInputFiles(testImagePath);
      await page.waitForTimeout(1000);
      
      await page.click('#addPhotoField');
      await page.click('#generateButton');
      
      // Wait for generation to complete
      await page.waitForSelector('#generateButton:not([disabled])', { timeout: 30000 });
      
      // Should have successfully generated with photo
      await expect(page.locator('#downloadPreviewButton')).toBeEnabled();
      
      // Check that photo data was fetched and stored
      const generatedIds = await page.evaluate(() => {
        return window.appState.getGeneratedIds();
      });
      
      expect(generatedIds).toHaveLength(1);
      expect(generatedIds[0].instanceData.photos).toBeTruthy();
    });

    test('should handle multiple photo fields', async ({ page }) => {
      await page.goto('/');
      
      const fileInput = page.locator('#templateUpload');
      const testImagePath = require('path').join(__dirname, 'fixtures', 'realistic-id-template.svg');
      await fileInput.setInputFiles(testImagePath);
      await page.waitForTimeout(1000);
      
      // Add multiple photo fields
      await page.click('#addPhotoField');
      await page.click('#addPhotoField');
      
      await page.click('#generateButton');
      await page.waitForSelector('#generateButton:not([disabled])', { timeout: 30000 });
      
      const generatedIds = await page.evaluate(() => {
        return window.appState.getGeneratedIds();
      });
      
      expect(generatedIds).toHaveLength(1);
      
      // Should have fetched multiple photos
      const photoKeys = Object.keys(generatedIds[0].instanceData.photos);
      expect(photoKeys.length).toBe(2);
    });

    test('should handle network failures during ID generation', async ({ page }) => {
      await page.goto('/');
      
      const fileInput = page.locator('#templateUpload');
      const testImagePath = require('path').join(__dirname, 'fixtures', 'realistic-id-template.svg');
      await fileInput.setInputFiles(testImagePath);
      await page.waitForTimeout(1000);
      
      await page.click('#addPhotoField');
      
      // Mock API failure
      await page.route('**/api/face', route => {
        route.fulfill({
          status: 500,
          body: 'Network Error'
        });
      });
      
      await page.click('#generateButton');
      await page.waitForSelector('#generateButton:not([disabled])', { timeout: 20000 });
      
      // Should still complete generation (graceful degradation)
      await expect(page.locator('#downloadPreviewButton')).toBeEnabled();
    });

    test('should work in batch generation with photos', async ({ page }) => {
      await page.goto('/');
      
      const fileInput = page.locator('#templateUpload');
      const testImagePath = require('path').join(__dirname, 'fixtures', 'realistic-id-template.svg');
      await fileInput.setInputFiles(testImagePath);
      await page.waitForTimeout(1000);
      
      await page.click('#addNameField');
      await page.click('#addPhotoField');
      
      await page.fill('#numIDsToGenerate', '3');
      await page.click('#generateButton');
      
      await page.waitForSelector('#generateButton:not([disabled])', { timeout: 45000 });
      
      const generatedIds = await page.evaluate(() => {
        return window.appState.getGeneratedIds();
      });
      
      expect(generatedIds).toHaveLength(3);
      
      // Each ID should have attempted to fetch a photo
      generatedIds.forEach(id => {
        expect(id.instanceData.photos).toBeTruthy();
      });
    });
  });

  test.describe('Static File Serving', () => {
    test('should serve index.html at root', async ({ request }) => {
      const response = await request.get('/');
      expect(response.ok()).toBeTruthy();
      expect(response.headers()['content-type']).toBe('text/html');
      
      const html = await response.text();
      expect(html).toContain('Simple ID Generator');
      expect(html).toContain('<!DOCTYPE html>');
    });

    test('should serve JavaScript files', async ({ request }) => {
      const response = await request.get('/js/app.js');
      expect(response.ok()).toBeTruthy();
      expect(response.headers()['content-type']).toContain('application/javascript');
    });

    test('should serve CSS files', async ({ request }) => {
      const response = await request.get('/styles/main.css');
      expect(response.ok()).toBeTruthy();
      expect(response.headers()['content-type']).toContain('text/css');
    });

    test('should return 404 for non-existent files', async ({ request }) => {
      const response = await request.get('/non-existent-file.js');
      expect(response.status()).toBe(404);
    });

    test('should prevent directory traversal', async ({ request }) => {
      const response = await request.get('/js/../package.json');
      expect(response.status()).toBe(403);
      
      const text = await response.text();
      expect(text).toContain('Directory Traversal');
    });

    test('should serve files with correct MIME types', async ({ request }) => {
      const tests = [
        { path: '/js/app.js', contentType: 'application/javascript' },
        { path: '/styles/main.css', contentType: 'text/css' },
        { path: '/', contentType: 'text/html' }
      ];
      
      for (const test of tests) {
        const response = await request.get(test.path);
        expect(response.ok()).toBeTruthy();
        expect(response.headers()['content-type']).toContain(test.contentType);
      }
    });
  });

  test.describe('Server Security', () => {
    test('should handle malicious requests safely', async ({ request }) => {
      // Test various potentially malicious paths
      const maliciousPaths = [
        '/js/../../etc/passwd',
        '/styles/../../../secrets.txt',
        '/api/face/../../../config'
      ];
      
      for (const path of maliciousPaths) {
        const response = await request.get(path);
        expect(response.status()).toBeGreaterThanOrEqual(400);
      }
    });

    test('should not expose sensitive server information', async ({ request }) => {
      const response = await request.get('/');
      
      // Check that server doesn't expose internal details
      const serverHeader = response.headers()['server'];
      const xPoweredBy = response.headers()['x-powered-by'];
      
      // These headers should not reveal internal technology details
      expect(serverHeader).toBeFalsy();
      expect(xPoweredBy).toBeFalsy();
    });

    test('should handle large requests appropriately', async ({ request }) => {
      // Test with large POST body to /api/face
      const largeBody = 'x'.repeat(10 * 1024 * 1024); // 10MB
      
      const response = await request.fetch('/api/face', {
        method: 'POST',
        data: largeBody
      });
      
      // Should reject POST method regardless of body size
      expect(response.status()).toBe(405);
    });
  });
});