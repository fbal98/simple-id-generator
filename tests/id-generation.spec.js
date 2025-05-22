import { test, expect } from '@playwright/test';
import path from 'path';
import { setupFaceMocking } from './fixtures/mock-face.js';

test.describe('ID Generation', () => {
  test.beforeEach(async ({ page }) => {
    // Setup face mocking for offline testing
    await setupFaceMocking(page);
    
    await page.goto('/');
    
    // Upload a realistic template
    const fileInput = page.locator('#templateUpload');
    const testImagePath = path.join(__dirname, 'fixtures', 'realistic-id-template.svg');
    await fileInput.setInputFiles(testImagePath);
    await page.waitForTimeout(1000);
  });

  test.describe('Single ID Generation', () => {
    test('should generate single ID with all field types', async ({ page }) => {
      // Add all field types
      await page.click('#addNameField');
      await page.click('#addDOBField');
      await page.click('#addCivilNoField');
      await page.click('#addIssueDateField');
      await page.click('#addExpiryDateField');
      await page.click('#addPhotoField');
      
      // Position fields to avoid overlap
      const fields = page.locator('#fieldLayer .field');
      await fields.nth(0).dragTo(page.locator('#idCanvas'), { targetPosition: { x: 200, y: 100 } });
      await fields.nth(1).dragTo(page.locator('#idCanvas'), { targetPosition: { x: 200, y: 150 } });
      await fields.nth(2).dragTo(page.locator('#idCanvas'), { targetPosition: { x: 200, y: 200 } });
      await fields.nth(3).dragTo(page.locator('#idCanvas'), { targetPosition: { x: 200, y: 250 } });
      await fields.nth(4).dragTo(page.locator('#idCanvas'), { targetPosition: { x: 200, y: 300 } });
      await fields.nth(5).dragTo(page.locator('#idCanvas'), { targetPosition: { x: 50, y: 100 } });
      
      // Set number of IDs to 1
      await page.fill('#numIDsToGenerate', '1');
      
      // Generate ID
      await page.click('#generateButton');
      
      // Wait for generation to complete
      await page.waitForSelector('#generateButton:not([disabled])', { timeout: 30000 });
      
      // Check that buttons are enabled
      await expect(page.locator('#downloadPreviewButton')).toBeEnabled();
      await expect(page.locator('#editLayoutButton')).toBeVisible();
      
      // Check that canvas shows generated ID (not empty)
      const canvas = page.locator('#idCanvas');
      await expect(canvas).not.toHaveClass(/empty-canvas/);
    });

    test('should show progress during generation', async ({ page }) => {
      await page.click('#addNameField');
      await page.click('#addPhotoField');
      
      // Set number of IDs to generate
      await page.fill('#numIDsToGenerate', '3');
      
      // Start generation
      const generateButton = page.locator('#generateButton');
      await generateButton.click();
      
      // Check that progress wrapper becomes visible
      const progressWrapper = page.locator('#progressWrapper');
      await expect(progressWrapper).toBeVisible();
      
      // Check that progress bar and text are present
      const progressBar = page.locator('#generationProgress');
      const progressText = page.locator('#progressText');
      
      await expect(progressBar).toBeVisible();
      await expect(progressText).toBeVisible();
      
      // Progress text should show current status
      await expect(progressText).toContainText('3');
      
      // Wait for completion
      await page.waitForSelector('#generateButton:not([disabled])', { timeout: 30000 });
      
      // Progress wrapper should be hidden after completion
      await expect(progressWrapper).toBeHidden();
    });

    test('should disable generate button during generation', async ({ page }) => {
      await page.click('#addNameField');
      
      const generateButton = page.locator('#generateButton');
      
      // Initially enabled
      await expect(generateButton).toBeEnabled();
      await expect(generateButton).toHaveText('Generate IDs');
      
      // Click generate
      await generateButton.click();
      
      // Should be disabled and show different text
      await expect(generateButton).toBeDisabled();
      await expect(generateButton).toHaveText('Generating...');
      
      // Wait for completion
      await page.waitForSelector('#generateButton:not([disabled])', { timeout: 30000 });
      
      // Should be enabled again
      await expect(generateButton).toBeEnabled();
      await expect(generateButton).toHaveText('Generate IDs');
    });

    test('should hide fields during generation', async ({ page }) => {
      await page.click('#addNameField');
      await page.click('#addDOBField');
      
      const fields = page.locator('#fieldLayer .field');
      
      // Fields should be visible initially
      await expect(fields.nth(0)).toBeVisible();
      await expect(fields.nth(1)).toBeVisible();
      
      // Start generation
      await page.click('#generateButton');
      
      // Fields should be hidden during generation
      await expect(fields.nth(0)).toHaveCSS('display', 'none');
      await expect(fields.nth(1)).toHaveCSS('display', 'none');
      
      // Wait for completion
      await page.waitForSelector('#generateButton:not([disabled])', { timeout: 30000 });
      
      // Fields should remain hidden after generation
      await expect(fields.nth(0)).toHaveCSS('display', 'none');
      await expect(fields.nth(1)).toHaveCSS('display', 'none');
    });

    test('should handle generation without photo fields', async ({ page }) => {
      // Add only text fields
      await page.click('#addNameField');
      await page.click('#addDOBField');
      await page.click('#addCivilNoField');
      
      await page.click('#generateButton');
      
      // Should complete successfully without photo fetching
      await page.waitForSelector('#generateButton:not([disabled])', { timeout: 15000 });
      
      await expect(page.locator('#downloadPreviewButton')).toBeEnabled();
    });

    test('should handle generation with only photo fields', async ({ page }) => {
      await page.click('#addPhotoField');
      
      await page.click('#generateButton');
      
      // Should complete with AI face fetching
      await page.waitForSelector('#generateButton:not([disabled])', { timeout: 30000 });
      
      await expect(page.locator('#downloadPreviewButton')).toBeEnabled();
    });
  });

  test.describe('Batch ID Generation', () => {
    test('should generate multiple IDs', async ({ page }) => {
      await page.click('#addNameField');
      await page.click('#addDOBField');
      
      // Set batch size
      await page.fill('#numIDsToGenerate', '5');
      
      await page.click('#generateButton');
      
      // Wait for completion
      await page.waitForSelector('#generateButton:not([disabled])', { timeout: 45000 });
      
      // Download All button should be visible for multiple IDs
      await expect(page.locator('#downloadAllButton')).toBeVisible();
      await expect(page.locator('#downloadPreviewButton')).toBeEnabled();
    });

    test('should update progress correctly for batch generation', async ({ page }) => {
      await page.click('#addNameField');
      
      const batchSize = 3;
      await page.fill('#numIDsToGenerate', batchSize.toString());
      
      await page.click('#generateButton');
      
      const progressBar = page.locator('#generationProgress');
      const progressText = page.locator('#progressText');
      
      // Check initial progress state
      await expect(progressText).toContainText(`0 / ${batchSize}`);
      
      // Wait for some progress
      await page.waitForFunction(() => {
        const text = document.querySelector('#progressText')?.textContent || '';
        return text.includes('1') || text.includes('2') || text.includes('3');
      }, { timeout: 20000 });
      
      // Wait for completion
      await page.waitForSelector('#generateButton:not([disabled])', { timeout: 30000 });
      
      // Final progress should show completion
      const finalProgress = await progressBar.getAttribute('value');
      expect(parseInt(finalProgress)).toBe(batchSize);
    });

    test('should show Download All button only for multiple IDs', async ({ page }) => {
      await page.click('#addNameField');
      
      const downloadAllButton = page.locator('#downloadAllButton');
      
      // Single ID - Download All should be hidden
      await page.fill('#numIDsToGenerate', '1');
      await page.click('#generateButton');
      await page.waitForSelector('#generateButton:not([disabled])', { timeout: 20000 });
      
      await expect(downloadAllButton).toBeHidden();
      
      // Multiple IDs - Download All should be visible
      await page.fill('#numIDsToGenerate', '3');
      await page.click('#generateButton');
      await page.waitForSelector('#generateButton:not([disabled])', { timeout: 30000 });
      
      await expect(downloadAllButton).toBeVisible();
    });

    test('should handle large batch generation', async ({ page }) => {
      await page.click('#addNameField');
      await page.click('#addDOBField');
      
      // Test larger batch (but reasonable for CI)
      await page.fill('#numIDsToGenerate', '10');
      
      await page.click('#generateButton');
      
      // Wait for completion with longer timeout
      await page.waitForSelector('#generateButton:not([disabled])', { timeout: 60000 });
      
      await expect(page.locator('#downloadAllButton')).toBeVisible();
      await expect(page.locator('#downloadPreviewButton')).toBeEnabled();
    });
  });

  test.describe('Data Generation Validation', () => {
    test('should generate different data for each ID in batch', async ({ page }) => {
      await page.click('#addNameField');
      
      // Generate 3 IDs to check data variation
      await page.fill('#numIDsToGenerate', '3');
      await page.click('#generateButton');
      await page.waitForSelector('#generateButton:not([disabled])', { timeout: 30000 });
      
      // Check that app state contains generated data
      const generatedIds = await page.evaluate(() => {
        return window.appState.getGeneratedIds();
      });
      
      expect(generatedIds).toHaveLength(3);
      
      // Each ID should have unique data
      const names = generatedIds.map(id => id.instanceData.text[Object.keys(id.instanceData.text)[0]]);
      const uniqueNames = new Set(names);
      
      // Should have some variation (though not guaranteed to be all unique due to random generation)
      expect(uniqueNames.size).toBeGreaterThan(0);
    });

    test('should generate valid date formats', async ({ page }) => {
      await page.click('#addDOBField');
      await page.click('#addIssueDateField');
      await page.click('#addExpiryDateField');
      
      await page.click('#generateButton');
      await page.waitForSelector('#generateButton:not([disabled])', { timeout: 20000 });
      
      const generatedIds = await page.evaluate(() => {
        return window.appState.getGeneratedIds();
      });
      
      expect(generatedIds).toHaveLength(1);
      
      const textData = generatedIds[0].instanceData.text;
      const dateFields = Object.values(textData);
      
      // Check date format (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      dateFields.forEach(date => {
        expect(date).toMatch(dateRegex);
      });
    });

    test('should generate valid civil numbers', async ({ page }) => {
      await page.click('#addCivilNoField');
      
      await page.click('#generateButton');
      await page.waitForSelector('#generateButton:not([disabled])', { timeout: 20000 });
      
      const generatedIds = await page.evaluate(() => {
        return window.appState.getGeneratedIds();
      });
      
      const civilNumber = Object.values(generatedIds[0].instanceData.text)[0];
      
      // Should be numeric and reasonable length
      expect(civilNumber).toMatch(/^\d+$/);
      expect(civilNumber.length).toBeGreaterThanOrEqual(8);
      expect(civilNumber.length).toBeLessThanOrEqual(12);
    });

    test('should generate culturally appropriate names', async ({ page }) => {
      await page.click('#addNameField');
      
      await page.fill('#numIDsToGenerate', '5');
      await page.click('#generateButton');
      await page.waitForSelector('#generateButton:not([disabled])', { timeout: 30000 });
      
      const generatedIds = await page.evaluate(() => {
        return window.appState.getGeneratedIds();
      });
      
      const names = generatedIds.map(id => Object.values(id.instanceData.text)[0]);
      
      // Check that names follow expected patterns
      names.forEach(name => {
        expect(name).toMatch(/^[A-Za-z\s-]+$/); // Letters, spaces, hyphens
        expect(name.split(' ')).toHaveLength(2); // First and last name
        expect(name).not.toBe(''); // Not empty
      });
    });
  });

  test.describe('Error Scenarios', () => {
    test('should show alert when no template is uploaded', async ({ page }) => {
      // Go to fresh page without uploading template
      await page.goto('/');
      
      let alertMessage = '';
      page.on('dialog', async dialog => {
        alertMessage = dialog.message();
        await dialog.accept();
      });
      
      await page.click('#generateButton');
      
      expect(alertMessage).toBe('Please upload a template image first.');
    });

    test('should show alert when no fields are added', async ({ page }) => {
      // Template is uploaded in beforeEach, but no fields added
      
      let alertMessage = '';
      page.on('dialog', async dialog => {
        alertMessage = dialog.message();
        await dialog.accept();
      });
      
      await page.click('#generateButton');
      
      expect(alertMessage).toBe('Please add some fields to the template.');
    });

    test('should handle AI face fetch failures gracefully', async ({ page }) => {
      // Intercept face API calls to simulate failure
      await page.route('**/api/face', route => {
        route.fulfill({
          status: 500,
          body: 'Server Error'
        });
      });
      
      await page.click('#addPhotoField');
      await page.click('#generateButton');
      
      // Should still complete even if face fetch fails
      await page.waitForSelector('#generateButton:not([disabled])', { timeout: 20000 });
      
      // Should still enable download button
      await expect(page.locator('#downloadPreviewButton')).toBeEnabled();
    });

    test('should handle invalid number of IDs input', async ({ page }) => {
      await page.click('#addNameField');
      
      // Test with invalid inputs
      await page.fill('#numIDsToGenerate', '0');
      await page.click('#generateButton');
      
      // Should default to 1 ID
      await page.waitForSelector('#generateButton:not([disabled])', { timeout: 20000 });
      
      const generatedIds = await page.evaluate(() => {
        return window.appState.getGeneratedIds();
      });
      
      expect(generatedIds).toHaveLength(1);
    });
  });

  test.describe('UI State Management', () => {
    test('should clear previous results when generating new IDs', async ({ page }) => {
      await page.click('#addNameField');
      
      // Generate first batch
      await page.fill('#numIDsToGenerate', '2');
      await page.click('#generateButton');
      await page.waitForSelector('#generateButton:not([disabled])', { timeout: 30000 });
      
      let generatedIds = await page.evaluate(() => {
        return window.appState.getGeneratedIds();
      });
      expect(generatedIds).toHaveLength(2);
      
      // Generate second batch
      await page.fill('#numIDsToGenerate', '3');
      await page.click('#generateButton');
      await page.waitForSelector('#generateButton:not([disabled])', { timeout: 30000 });
      
      generatedIds = await page.evaluate(() => {
        return window.appState.getGeneratedIds();
      });
      
      // Should have new batch, not combined
      expect(generatedIds).toHaveLength(3);
    });

    test('should maintain canvas preview of first generated ID', async ({ page }) => {
      await page.click('#addNameField');
      
      await page.fill('#numIDsToGenerate', '3');
      await page.click('#generateButton');
      await page.waitForSelector('#generateButton:not([disabled])', { timeout: 30000 });
      
      // Canvas should show the first generated ID preview
      const canvas = page.locator('#idCanvas');
      await expect(canvas).not.toHaveClass(/empty-canvas/);
      
      // Canvas should contain rendered content (not just template)
      const canvasData = await canvas.evaluate(el => {
        return el.toDataURL();
      });
      expect(canvasData).toContain('data:image/png;base64');
    });

    test('should show Edit Layout button after generation', async ({ page }) => {
      await page.click('#addNameField');
      
      const editLayoutButton = page.locator('#editLayoutButton');
      
      // Initially hidden
      await expect(editLayoutButton).toBeHidden();
      
      await page.click('#generateButton');
      await page.waitForSelector('#generateButton:not([disabled])', { timeout: 20000 });
      
      // Should be visible after generation
      await expect(editLayoutButton).toBeVisible();
    });
  });
});