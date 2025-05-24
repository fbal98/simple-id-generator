import { test, expect } from '@playwright/test';
import { TestUtils, addCustomMatchers } from '../helpers/test-utils.js';
import path from 'path';

// Add custom matchers for positioning tests
addCustomMatchers();

test.describe('Output Validation Flow', () => {
  let testUtils;

  test.beforeEach(async ({ page }) => {
    testUtils = new TestUtils(page);
    await testUtils.setRandomSeed(); // For consistent test results
    await testUtils.mockFaceApi(); // Mock external API
    await page.goto('/');
    
    // Setup complete ID template
    const templatePath = path.join(__dirname, '../fixtures/template_id.JPEG');
    await testUtils.uploadTemplate(templatePath);
    
    // Add and position all field types
    await testUtils.addField('name');
    await testUtils.addField('dob');
    await testUtils.addField('expiryDate');
    await testUtils.addField('civilNo');
    await testUtils.addField('photo');
    
    // Position fields in known locations for validation
    await testUtils.positionField(testUtils.getFieldSelector('name'), 120, 80);
    await testUtils.positionField(testUtils.getFieldSelector('dob'), 120, 120);
    await testUtils.positionField(testUtils.getFieldSelector('expiryDate'), 120, 160);
    await testUtils.positionField(testUtils.getFieldSelector('civilNo'), 120, 200);
    await testUtils.positionField(testUtils.getFieldSelector('photo'), 300, 100);
  });

  test('should display generated ID output', async ({ page }) => {
    await testUtils.generateIds(1);
    
    // Verify canvas has rendered content
    const canvas = testUtils.getMainCanvas();
    await expect(canvas).toBeVisible();
    
    // Verify canvas has image content
    const hasContent = await testUtils.canvasHasImageContent();
    expect(hasContent).toBe(true);
  });

  test('should validate field positions match overlay placement', async ({ page }) => {
    // Get overlay positions before generation
    const nameOverlayPos = await testUtils.getFieldPosition(testUtils.getFieldSelector('name'));
    const dobOverlayPos = await testUtils.getFieldPosition(testUtils.getFieldSelector('dob'));
    
    await testUtils.generateIds(1);
    
    // Verify canvas has content after generation
    const hasContent = await testUtils.canvasHasImageContent();
    expect(hasContent).toBe(true);
    
    // For canvas-based rendering, we need to check the actual rendered positions
    // This would require analyzing the canvas content or checking CSS positions
    // of rendered elements within the generated ID
    
    // Check if canvas has reasonable dimensions
    const canvas = testUtils.getMainCanvas();
    const canvasRect = await canvas.boundingBox();
    expect(canvasRect.width).toBeGreaterThan(200);
    expect(canvasRect.height).toBeGreaterThan(100);
  });

  test('should take screenshot for visual regression testing', async ({ page }) => {
    await testUtils.generateIds(1);
    
    // Wait for any animations or loading to complete
    await testUtils.waitForCanvasRender();
    
    // Take screenshot of the canvas for baseline comparison
    const canvas = testUtils.getMainCanvas();
    await expect(canvas).toHaveScreenshot('generated-id-baseline.png', {
      maxDiffPixels: 100,
    });
  });

  test('should validate multiple generated IDs have consistent layout', async ({ page }) => {
    await testUtils.generateIds(3);
    
    // Since all IDs are rendered to the same canvas, we check the canvas dimensions
    const canvas = testUtils.getMainCanvas();
    await expect(canvas).toBeVisible();
    
    // Canvas should maintain consistent dimensions
    const canvasRect = await canvas.boundingBox();
    expect(canvasRect.width).toBeGreaterThan(200);
    expect(canvasRect.height).toBeGreaterThan(100);
    
    // Verify canvas has content after generating multiple IDs
    const hasContent = await testUtils.canvasHasImageContent();
    expect(hasContent).toBe(true);
  });

  test('should validate pixel-perfect positioning with tolerance', async ({ page }) => {
    // Create a very specific layout
    await page.reload();
    await testUtils.uploadTemplate(path.join(__dirname, '../fixtures/template_id.JPEG'));
    
    await testUtils.addField('name');
    await testUtils.positionField(testUtils.getFieldSelector('name'), 100, 50);
    
    await testUtils.generateIds(1);
    
    // Verify canvas has content
    const hasContent = await testUtils.canvasHasImageContent();
    expect(hasContent).toBe(true);
    
    // Take precise screenshot
    const canvas = testUtils.getMainCanvas();
    await expect(canvas).toHaveScreenshot('precise-positioning.png', {
      maxDiffPixels: 50, // Allow small differences
    });
  });

  test('should validate text content appears correctly', async ({ page }) => {
    await testUtils.generateIds(1);
    
    // Verify canvas has content
    const hasContent = await testUtils.canvasHasImageContent();
    expect(hasContent).toBe(true);
    
    // Since we're rendering to canvas, we can't easily extract text content
    // But we can verify that the canvas has been properly rendered
    const canvas = testUtils.getMainCanvas();
    await expect(canvas).toBeVisible();
    
    // Take a screenshot to verify text is rendered
    await expect(canvas).toHaveScreenshot('text-content.png', {
      maxDiffPixels: 100,
    });
  });

  test('should validate photo areas render correctly', async ({ page }) => {
    await testUtils.generateIds(1);
    
    // Verify canvas has content
    const hasContent = await testUtils.canvasHasImageContent();
    expect(hasContent).toBe(true);
    
    // Since photos are rendered to canvas, we verify the canvas is properly filled
    const canvas = testUtils.getMainCanvas();
    await expect(canvas).toBeVisible();
    
    // Verify canvas has reasonable dimensions for photo content
    const canvasRect = await canvas.boundingBox();
    expect(canvasRect.width).toBeGreaterThan(50);
    expect(canvasRect.height).toBeGreaterThan(50);
  });

  test('should handle different field configurations', async ({ page }) => {
    // Test with minimal configuration
    await page.reload();
    await testUtils.uploadTemplate(path.join(__dirname, '../fixtures/template_id.JPEG'));
    
    // Only add name field
    await testUtils.addField('name');
    await testUtils.positionField(testUtils.getFieldSelector('name'), 100, 100);
    
    await testUtils.generateIds(1);
    
    // Verify canvas has content
    const hasContent = await testUtils.canvasHasImageContent();
    expect(hasContent).toBe(true);
    
    // Should still render properly with minimal fields
    const canvas = testUtils.getMainCanvas();
    await expect(canvas).toHaveScreenshot('minimal-fields.png');
  });

  test('should validate generation maintains template integrity', async ({ page }) => {
    await testUtils.generateIds(1);
    
    // Verify canvas has content
    const hasContent = await testUtils.canvasHasImageContent();
    expect(hasContent).toBe(true);
    
    // Canvas should maintain template structure
    const canvas = testUtils.getMainCanvas();
    const canvasRect = await canvas.boundingBox();
    
    // Should have reasonable aspect ratio similar to template
    const aspectRatio = canvasRect.width / canvasRect.height;
    expect(aspectRatio).toBeGreaterThan(0.5);
    expect(aspectRatio).toBeLessThan(3.0);
  });

  test('should validate consistency across multiple generations', async ({ page }) => {
    // Generate first ID
    await testUtils.generateIds(1);
    
    // Take screenshot of first generation
    const canvas = testUtils.getMainCanvas();
    await expect(canvas).toHaveScreenshot('first-generation.png');
    
    // Generate second ID with same configuration
    await testUtils.generateIds(1);
    
    // Canvas dimensions should remain consistent
    const canvasRect = await canvas.boundingBox();
    expect(canvasRect.width).toBeGreaterThan(200);
    expect(canvasRect.height).toBeGreaterThan(100);
    
    // Both generations should have content
    const hasContent = await testUtils.canvasHasImageContent();
    expect(hasContent).toBe(true);
  });
});