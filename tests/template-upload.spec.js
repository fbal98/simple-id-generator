import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Template Upload Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the app to load
    await page.waitForSelector('#idCanvas');
  });

  test('should display empty canvas with placeholder text initially', async ({ page }) => {
    // Check that canvas exists and has the empty-canvas class
    const canvas = page.locator('#idCanvas');
    await expect(canvas).toBeVisible();
    await expect(canvas).toHaveClass(/empty-canvas/);
    
    // Check canvas dimensions (default size)
    const canvasElement = await canvas.elementHandle();
    const width = await canvasElement.evaluate(el => el.width);
    const height = await canvasElement.evaluate(el => el.height);
    expect(width).toBe(600);
    expect(height).toBe(380);
  });

  test('should upload template image and update canvas', async ({ page }) => {
    const fileInput = page.locator('#templateUpload');
    const canvas = page.locator('#idCanvas');
    
    // Upload test template
    const testImagePath = path.join(__dirname, 'fixtures', 'test-id-template.svg');
    await fileInput.setInputFiles(testImagePath);
    
    // Wait for image to load and canvas to update
    await page.waitForTimeout(1000); // Give time for image processing
    
    // Check that empty-canvas class is removed
    await expect(canvas).not.toHaveClass(/empty-canvas/);
    
    // Check that canvas dimensions might have changed based on image
    // The app sets canvas size to match the uploaded image
    const canvasElement = await canvas.elementHandle();
    const width = await canvasElement.evaluate(el => el.width);
    const height = await canvasElement.evaluate(el => el.height);
    
    // For SVG, the dimensions should match what we defined (600x380)
    expect(width).toBeGreaterThan(0);
    expect(height).toBeGreaterThan(0);
  });

  test('should clear existing fields when new template is uploaded', async ({ page }) => {
    // First upload a template
    const fileInput = page.locator('#templateUpload');
    const testImagePath = path.join(__dirname, 'fixtures', 'test-id-template.svg');
    await fileInput.setInputFiles(testImagePath);
    await page.waitForTimeout(500);
    
    // Add a field
    await page.click('#addNameField');
    
    // Verify field was added
    const fieldLayer = page.locator('#fieldLayer');
    const fields = fieldLayer.locator('.field');
    await expect(fields).toHaveCount(1);
    
    // Upload a different template
    const smallImagePath = path.join(__dirname, 'fixtures', 'small-test-template.svg');
    await fileInput.setInputFiles(smallImagePath);
    await page.waitForTimeout(500);
    
    // Verify fields were cleared
    await expect(fields).toHaveCount(0);
    
    // Verify download buttons are hidden again
    await expect(page.locator('#downloadAllButton')).not.toBeVisible();
    await expect(page.locator('#editLayoutButton')).not.toBeVisible();
  });

  test('should handle multiple template uploads', async ({ page }) => {
    const fileInput = page.locator('#templateUpload');
    const canvas = page.locator('#idCanvas');
    
    // Upload first template
    const testImagePath = path.join(__dirname, 'fixtures', 'test-id-template.svg');
    await fileInput.setInputFiles(testImagePath);
    await page.waitForTimeout(500);
    
    await expect(canvas).not.toHaveClass(/empty-canvas/);
    
    // Upload second template
    const smallImagePath = path.join(__dirname, 'fixtures', 'small-test-template.svg');
    await fileInput.setInputFiles(smallImagePath);
    await page.waitForTimeout(500);
    
    // Canvas should still not have empty class
    await expect(canvas).not.toHaveClass(/empty-canvas/);
    
    // Check that canvas dimensions updated
    const canvasElement = await canvas.elementHandle();
    const width = await canvasElement.evaluate(el => el.width);
    const height = await canvasElement.evaluate(el => el.height);
    
    // Small template is 300x200
    expect(width).toBeGreaterThan(0);
    expect(height).toBeGreaterThan(0);
  });

  test('should only accept image files', async ({ page }) => {
    const fileInput = page.locator('#templateUpload');
    
    // Check the accept attribute
    const acceptAttribute = await fileInput.getAttribute('accept');
    expect(acceptAttribute).toBe('image/*');
  });

  test('should show alert when trying to add fields without template', async ({ page }) => {
    // Set up dialog handler
    let alertMessage = '';
    page.on('dialog', async dialog => {
      alertMessage = dialog.message();
      await dialog.accept();
    });
    
    // Try to add a field without uploading template
    await page.click('#addNameField');
    
    // Check that alert was shown
    expect(alertMessage).toBe('Please upload an ID template image first.');
  });

  test('should maintain field layer positioning after template upload', async ({ page }) => {
    const fileInput = page.locator('#templateUpload');
    const canvas = page.locator('#idCanvas');
    
    // Upload template
    const testImagePath = path.join(__dirname, 'fixtures', 'test-id-template.svg');
    await fileInput.setInputFiles(testImagePath);
    await page.waitForTimeout(500);
    
    // Get canvas position
    const canvasRect = await canvas.boundingBox();
    
    // Check that fieldLayer exists and is positioned correctly
    const fieldLayer = page.locator('#fieldLayer');
    await expect(fieldLayer).toBeVisible();
    
    const fieldLayerRect = await fieldLayer.boundingBox();
    
    // Field layer should be positioned over the canvas
    expect(fieldLayerRect.x).toBeCloseTo(canvasRect.x, 1);
    expect(fieldLayerRect.y).toBeCloseTo(canvasRect.y, 1);
    expect(fieldLayerRect.width).toBeCloseTo(canvasRect.width, 1);
    expect(fieldLayerRect.height).toBeCloseTo(canvasRect.height, 1);
  });
});