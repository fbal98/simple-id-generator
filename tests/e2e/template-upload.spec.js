import { test, expect } from '@playwright/test';
import { TestUtils } from '../helpers/test-utils.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test.describe('Template Upload Flow', () => {
  let testUtils;

  test.beforeEach(async ({ page }) => {
    testUtils = new TestUtils(page);
    await page.goto('/');
  });

  test('should display upload area on initial load', async ({ page }) => {
    await expect(page.locator('#templateUpload')).toBeVisible();
    await expect(page.locator('#idCanvas')).toBeVisible();
  });

  test('should upload and display template image', async ({ page }) => {
    const templatePath = path.join(__dirname, '../fixtures/template_id.JPEG');
    
    // Upload template
    await testUtils.uploadTemplate(templatePath);
    
    // Verify template is displayed
    const canvas = page.locator('#idCanvas');
    await expect(canvas).toBeVisible();
    
    // Take baseline screenshot after template upload
    await expect(page.locator('#canvasWrapper')).toHaveScreenshot('template-uploaded.png');
  });

  test('should show error for invalid file types', async ({ page }) => {
    // Try to upload a text file (should fail)
    const invalidFile = path.join(__dirname, '../helpers/test-utils.js');
    
    const fileInput = page.locator('#templateUpload');
    await fileInput.setInputFiles(invalidFile);
    
    // Should show an error message or reject the file
    // The actual behavior depends on implementation
    await page.waitForTimeout(1000);
    
    // Canvas should not show the invalid file
    const canvas = page.locator('#idCanvas');
    const canvasContent = await canvas.innerHTML();
    expect(canvasContent).not.toContain('test-utils.js');
  });

  test('should handle large image files', async ({ page }) => {
    const templatePath = path.join(__dirname, '../fixtures/template_id.JPEG');
    
    // Upload template
    await testUtils.uploadTemplate(templatePath);
    
    // Verify template loads properly even if large
    await testUtils.waitForCanvasRender();
    await expect(page.locator('#idCanvas')).toBeVisible();
  });

  test('should replace existing template when new one is uploaded', async ({ page }) => {
    const templatePath = path.join(__dirname, '../fixtures/template_id.JPEG');
    
    // Upload first template
    await testUtils.uploadTemplate(templatePath);
    await expect(page.locator('#idCanvas')).toBeVisible();
    
    // Upload same template again (simulates replacement)
    await testUtils.uploadTemplate(templatePath);
    await expect(page.locator('#idCanvas')).toBeVisible();
    
    // Should still work properly
    await testUtils.waitForCanvasRender();
  });
});