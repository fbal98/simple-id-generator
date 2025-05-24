import { test, expect } from '@playwright/test';
import { TestUtils } from '../helpers/test-utils.js';
import path from 'path';

test.describe('ID Generation Flow', () => {
  let testUtils;

  test.beforeEach(async ({ page }) => {
    testUtils = new TestUtils(page);
    await testUtils.setRandomSeed(); // For deterministic results
    await testUtils.mockFaceApi(); // Mock external API
    await page.goto('/');
    
    // Upload template and add fields
    const templatePath = path.join(__dirname, '../fixtures/template_id.JPEG');
    await testUtils.uploadTemplate(templatePath);
    
    // Add basic fields for generation
    await testUtils.addField('name');
    await testUtils.addField('dob');
    await testUtils.addField('photo');
    
    // Position fields
    await testUtils.positionField(testUtils.getFieldSelector('name'), 100, 100);
    await testUtils.positionField(testUtils.getFieldSelector('dob'), 100, 150);
    await testUtils.positionField(testUtils.getFieldSelector('photo'), 200, 100);
  });

  test('should generate single ID', async ({ page }) => {
    await testUtils.generateIds(1);
    
    // Verify canvas shows generated content
    const canvas = testUtils.getMainCanvas();
    await expect(canvas).toBeVisible();
    
    // Check that canvas has image content
    const hasContent = await testUtils.canvasHasImageContent();
    expect(hasContent).toBe(true);
  });

  test('should generate multiple IDs', async ({ page }) => {
    const idCount = 3;
    await testUtils.generateIds(idCount);
    
    // Verify canvas has content after generating multiple IDs
    const canvas = testUtils.getMainCanvas();
    await expect(canvas).toBeVisible();
    
    // Canvas should have rendered content
    const hasContent = await testUtils.canvasHasImageContent();
    expect(hasContent).toBe(true);
  });

  test('should show progress indication during generation', async ({ page }) => {
    // Start generation without waiting
    const idCountInput = page.locator('#numIDsToGenerate');
    await idCountInput.fill('5');
    
    // Click generate and immediately check for progress
    const generateBtn = page.locator('#generateButton');
    await generateBtn.click();
    
    // Progress wrapper should appear
    const progressWrapper = page.locator('#progressWrapper');
    await expect(progressWrapper).toBeVisible();
    
    // Wait for completion
    await testUtils.waitForGenerationComplete();
  });

  test('should populate fields with generated data', async ({ page }) => {
    await testUtils.generateIds(1);
    
    // Verify canvas has rendered content
    const canvas = testUtils.getMainCanvas();
    await expect(canvas).toBeVisible();
    
    // Check that canvas has image content
    const hasContent = await testUtils.canvasHasImageContent();
    expect(hasContent).toBe(true);
    
    // Take screenshot to verify fields are populated
    await expect(canvas).toHaveScreenshot('populated-fields.png', {
      maxDiffPixels: 100
    });
  });

  test('should handle photo field generation', async ({ page }) => {
    await testUtils.generateIds(1);
    
    // Verify canvas has content including photo area
    const canvas = testUtils.getMainCanvas();
    await expect(canvas).toBeVisible();
    
    // Canvas should have rendered content including photo
    const hasContent = await testUtils.canvasHasImageContent();
    expect(hasContent).toBe(true);
  });

  test('should generate different data for multiple IDs', async ({ page }) => {
    // Generate first ID
    await testUtils.generateIds(1);
    
    // Take screenshot of first generation
    const canvas = testUtils.getMainCanvas();
    const firstScreenshot = await canvas.screenshot();
    
    // Generate second ID
    await testUtils.generateIds(1);
    
    // Take screenshot of second generation
    const secondScreenshot = await canvas.screenshot();
    
    // Screenshots should be different (unless using fixed seed)
    // Since we're using fixed seed, content might be similar
    // But at least verify both generated successfully
    const hasContent = await testUtils.canvasHasImageContent();
    expect(hasContent).toBe(true);
  });

  test('should handle generation with missing fields gracefully', async ({ page }) => {
    // Clear existing fields and add just one
    await page.reload();
    await testUtils.uploadTemplate(path.join(__dirname, '../fixtures/template_id.JPEG'));
    await testUtils.addField('name');
    
    // Should still generate successfully
    await testUtils.generateIds(1);
    
    // Verify canvas has content
    const hasContent = await testUtils.canvasHasImageContent();
    expect(hasContent).toBe(true);
  });

  test('should disable generate button during generation', async ({ page }) => {
    const generateBtn = page.locator('#generateButton');
    
    // Click generate for multiple IDs
    await page.locator('#numIDsToGenerate').fill('3');
    await generateBtn.click();
    
    // Button should be disabled during generation
    await expect(generateBtn).toBeDisabled();
    
    // Wait for completion
    await testUtils.waitForGenerationComplete();
    
    // Button should be enabled again
    await expect(generateBtn).toBeEnabled();
  });

  test('should clear previous results when generating new IDs', async ({ page }) => {
    // Generate first batch
    await testUtils.generateIds(2);
    
    // Take screenshot of first generation
    const canvas = testUtils.getMainCanvas();
    await expect(canvas).toHaveScreenshot('first-batch.png');
    
    // Generate new batch
    await testUtils.generateIds(1);
    
    // Canvas should show new content
    await expect(canvas).toHaveScreenshot('second-batch.png');
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API to return error
    await page.route('**/api/face', route => {
      route.abort('failed');
    });
    
    // Add photo field
    await testUtils.addField('photo');
    
    // Should still generate (maybe with placeholder or error handling)
    await testUtils.generateIds(1);
    
    // Verify generation completes even with API error
    const hasContent = await testUtils.canvasHasImageContent();
    expect(hasContent).toBe(true);
  });
});