import { test, expect } from '@playwright/test';
import path from 'path';
import { setupFaceMocking } from './fixtures/mock-face.js';

test.describe('Field Management', () => {
  test.beforeEach(async ({ page }) => {
    // Setup face mocking for offline testing
    await setupFaceMocking(page);
    await page.goto('/');
    
    // Upload a template first
    const fileInput = page.locator('#templateUpload');
    const testImagePath = path.join(__dirname, 'fixtures', 'realistic-id-template.svg');
    await fileInput.setInputFiles(testImagePath);
    await page.waitForTimeout(1000);
  });

  test.describe('Field Addition', () => {
    test('should add name field with correct properties', async ({ page }) => {
      await page.click('#addNameField');
      
      const fieldLayer = page.locator('#fieldLayer');
      const nameField = fieldLayer.locator('.field[data-type="name"]');
      
      await expect(nameField).toBeVisible();
      await expect(nameField).toHaveText('Full Name');
      await expect(nameField).toHaveClass(/field/);
      await expect(nameField).toHaveClass(/focused/);
      
      // Check that it has a resize handle
      const resizeHandle = nameField.locator('.resize-handle');
      await expect(resizeHandle).toBeVisible();
    });

    test('should add all field types', async ({ page }) => {
      const fieldButtons = [
        { button: '#addNameField', type: 'name', text: 'Full Name' },
        { button: '#addDOBField', type: 'dob', text: 'YYYY-MM-DD' },
        { button: '#addIssueDateField', type: 'issueDate', text: 'YYYY-MM-DD' },
        { button: '#addExpiryDateField', type: 'expiryDate', text: 'YYYY-MM-DD' },
        { button: '#addCivilNoField', type: 'civilNo', text: 'Civil Number/ID' },
        { button: '#addPhotoField', type: 'photo', text: 'Photo Area' }
      ];

      for (const field of fieldButtons) {
        await page.click(field.button);
        
        const addedField = page.locator(`#fieldLayer .field[data-type="${field.type}"]`);
        await expect(addedField).toBeVisible();
        await expect(addedField).toHaveText(field.text);
      }
      
      // Should have 6 fields total
      const allFields = page.locator('#fieldLayer .field');
      await expect(allFields).toHaveCount(6);
    });

    test('should auto-size text fields correctly', async ({ page }) => {
      await page.click('#addNameField');
      
      const nameField = page.locator('#fieldLayer .field[data-type="name"]');
      
      // Get initial dimensions
      const initialBox = await nameField.boundingBox();
      expect(initialBox.width).toBeGreaterThan(50); // Should auto-size to content
      expect(initialBox.height).toBeGreaterThan(15);
    });

    test('should size photo fields with fixed dimensions', async ({ page }) => {
      await page.click('#addPhotoField');
      
      const photoField = page.locator('#fieldLayer .field[data-type="photo"]');
      
      // Check photo field dimensions (should be 100x120 as per fieldManager.js)
      const photoBox = await photoField.boundingBox();
      expect(photoBox.width).toBe(100);
      expect(photoBox.height).toBe(120);
    });

    test('should stagger new fields to avoid overlap', async ({ page }) => {
      await page.click('#addNameField');
      await page.click('#addDOBField');
      await page.click('#addCivilNoField');
      
      const fields = page.locator('#fieldLayer .field');
      const field1Box = await fields.nth(0).boundingBox();
      const field2Box = await fields.nth(1).boundingBox();
      const field3Box = await fields.nth(2).boundingBox();
      
      // Fields should be staggered vertically
      expect(field2Box.y).toBeGreaterThan(field1Box.y);
      expect(field3Box.y).toBeGreaterThan(field2Box.y);
    });
  });

  test.describe('Field Focus and Selection', () => {
    test('should focus field on click', async ({ page }) => {
      await page.click('#addNameField');
      await page.click('#addDOBField');
      
      const nameField = page.locator('#fieldLayer .field[data-type="name"]');
      const dobField = page.locator('#fieldLayer .field[data-type="dob"]');
      
      // Initially DOB field should be focused (last added)
      await expect(dobField).toHaveClass(/focused/);
      await expect(nameField).not.toHaveClass(/focused/);
      
      // Click name field to focus it
      await nameField.click();
      await expect(nameField).toHaveClass(/focused/);
      await expect(dobField).not.toHaveClass(/focused/);
    });

    test('should remove focus when clicking outside fields', async ({ page }) => {
      await page.click('#addNameField');
      
      const nameField = page.locator('#fieldLayer .field[data-type="name"]');
      await expect(nameField).toHaveClass(/focused/);
      
      // Click outside field area (on canvas)
      const canvas = page.locator('#idCanvas');
      await canvas.click({ position: { x: 400, y: 300 } });
      
      await expect(nameField).not.toHaveClass(/focused/);
    });

    test('should enable font controls when text field is focused', async ({ page }) => {
      const fontFamilySelect = page.locator('#fontFamilySelect');
      const fontSizeInput = page.locator('#fontSizeInput');
      
      // Initially disabled
      await expect(fontFamilySelect).toBeDisabled();
      await expect(fontSizeInput).toBeDisabled();
      
      // Add and focus text field
      await page.click('#addNameField');
      
      await expect(fontFamilySelect).toBeEnabled();
      await expect(fontSizeInput).toBeEnabled();
    });

    test('should disable font controls when photo field is focused', async ({ page }) => {
      const fontFamilySelect = page.locator('#fontFamilySelect');
      const fontSizeInput = page.locator('#fontSizeInput');
      
      await page.click('#addPhotoField');
      
      await expect(fontFamilySelect).toBeDisabled();
      await expect(fontSizeInput).toBeDisabled();
    });
  });

  test.describe('Field Dragging', () => {
    test('should drag field to new position', async ({ page }) => {
      await page.click('#addNameField');
      
      const nameField = page.locator('#fieldLayer .field[data-type="name"]');
      const initialBox = await nameField.boundingBox();
      
      // Drag field to new position
      const newX = initialBox.x + 100;
      const newY = initialBox.y + 50;
      
      await nameField.dragTo(page.locator('#idCanvas'), {
        targetPosition: { x: newX, y: newY }
      });
      
      const newBox = await nameField.boundingBox();
      expect(newBox.x).toBeCloseTo(newX, 10);
      expect(newBox.y).toBeCloseTo(newY, 10);
    });

    test('should constrain dragging within canvas bounds', async ({ page }) => {
      await page.click('#addNameField');
      
      const nameField = page.locator('#fieldLayer .field[data-type="name"]');
      const canvas = page.locator('#idCanvas');
      const canvasBox = await canvas.boundingBox();
      
      // Try to drag field outside canvas bounds
      await nameField.dragTo(canvas, {
        targetPosition: { x: canvasBox.width + 100, y: canvasBox.height + 100 }
      });
      
      const fieldBox = await nameField.boundingBox();
      const fieldLayer = page.locator('#fieldLayer');
      const layerBox = await fieldLayer.boundingBox();
      
      // Field should be constrained within field layer
      expect(fieldBox.x + fieldBox.width).toBeLessThanOrEqual(layerBox.x + layerBox.width);
      expect(fieldBox.y + fieldBox.height).toBeLessThanOrEqual(layerBox.y + layerBox.height);
    });

    test('should not drag when resize handle is clicked', async ({ page }) => {
      await page.click('#addNameField');
      
      const nameField = page.locator('#fieldLayer .field[data-type="name"]');
      const resizeHandle = nameField.locator('.resize-handle');
      const initialBox = await nameField.boundingBox();
      
      // Try to drag by the resize handle
      await resizeHandle.hover();
      await page.mouse.down();
      await page.mouse.move(initialBox.x + 100, initialBox.y + 50);
      await page.mouse.up();
      
      const finalBox = await nameField.boundingBox();
      
      // Position should not have changed significantly (might resize instead)
      expect(Math.abs(finalBox.x - initialBox.x)).toBeLessThan(20);
      expect(Math.abs(finalBox.y - initialBox.y)).toBeLessThan(20);
    });
  });

  test.describe('Field Resizing', () => {
    test('should resize field using resize handle', async ({ page }) => {
      await page.click('#addNameField');
      
      const nameField = page.locator('#fieldLayer .field[data-type="name"]');
      const resizeHandle = nameField.locator('.resize-handle');
      const initialBox = await nameField.boundingBox();
      
      // Resize field
      await resizeHandle.hover();
      await page.mouse.down();
      await page.mouse.move(initialBox.x + initialBox.width + 50, initialBox.y + initialBox.height + 30);
      await page.mouse.up();
      
      const newBox = await nameField.boundingBox();
      expect(newBox.width).toBeGreaterThan(initialBox.width);
      expect(newBox.height).toBeGreaterThan(initialBox.height);
    });

    test('should enforce minimum field dimensions', async ({ page }) => {
      await page.click('#addNameField');
      
      const nameField = page.locator('#fieldLayer .field[data-type="name"]');
      const resizeHandle = nameField.locator('.resize-handle');
      const initialBox = await nameField.boundingBox();
      
      // Try to resize to very small dimensions
      await resizeHandle.hover();
      await page.mouse.down();
      await page.mouse.move(initialBox.x + 5, initialBox.y + 5);
      await page.mouse.up();
      
      const newBox = await nameField.boundingBox();
      
      // Should maintain minimum dimensions (MIN_WIDTH = 20, MIN_HEIGHT = 20)
      expect(newBox.width).toBeGreaterThanOrEqual(20);
      expect(newBox.height).toBeGreaterThanOrEqual(20);
    });

    test('should constrain resize within field layer bounds', async ({ page }) => {
      await page.click('#addNameField');
      
      const nameField = page.locator('#fieldLayer .field[data-type="name"]');
      const resizeHandle = nameField.locator('.resize-handle');
      const fieldLayer = page.locator('#fieldLayer');
      const layerBox = await fieldLayer.boundingBox();
      
      // Try to resize beyond field layer bounds
      await resizeHandle.hover();
      await page.mouse.down();
      await page.mouse.move(layerBox.width + 100, layerBox.height + 100);
      await page.mouse.up();
      
      const fieldBox = await nameField.boundingBox();
      
      // Field should not extend beyond layer bounds
      expect(fieldBox.x + fieldBox.width).toBeLessThanOrEqual(layerBox.x + layerBox.width + 5); // Small tolerance
      expect(fieldBox.y + fieldBox.height).toBeLessThanOrEqual(layerBox.y + layerBox.height + 5);
    });

    test('should auto-adjust text field height for content', async ({ page }) => {
      await page.click('#addNameField');
      
      const nameField = page.locator('#fieldLayer .field[data-type="name"]');
      const resizeHandle = nameField.locator('.resize-handle');
      const initialBox = await nameField.boundingBox();
      
      // Resize width only
      await resizeHandle.hover();
      await page.mouse.down();
      await page.mouse.move(initialBox.x + initialBox.width + 100, initialBox.y + initialBox.height);
      await page.mouse.up();
      
      const newBox = await nameField.boundingBox();
      
      // Width should increase, height might adjust to content
      expect(newBox.width).toBeGreaterThan(initialBox.width);
    });
  });

  test.describe('Font Styling', () => {
    test('should update field font family', async ({ page }) => {
      await page.click('#addNameField');
      
      const nameField = page.locator('#fieldLayer .field[data-type="name"]');
      const fontFamilySelect = page.locator('#fontFamilySelect');
      
      // Change font family
      await fontFamilySelect.selectOption('Courier New');
      
      // Check that field style updated
      const fontFamily = await nameField.evaluate(el => window.getComputedStyle(el).fontFamily);
      expect(fontFamily).toContain('Courier New');
    });

    test('should update field font size', async ({ page }) => {
      await page.click('#addNameField');
      
      const nameField = page.locator('#fieldLayer .field[data-type="name"]');
      const fontSizeInput = page.locator('#fontSizeInput');
      
      // Change font size
      await fontSizeInput.fill('24');
      await fontSizeInput.blur();
      
      // Check that field style updated
      const fontSize = await nameField.evaluate(el => window.getComputedStyle(el).fontSize);
      expect(fontSize).toBe('24px');
    });

    test('should maintain font settings when field is moved', async ({ page }) => {
      await page.click('#addNameField');
      
      const nameField = page.locator('#fieldLayer .field[data-type="name"]');
      const fontFamilySelect = page.locator('#fontFamilySelect');
      const fontSizeInput = page.locator('#fontSizeInput');
      
      // Set custom font
      await fontFamilySelect.selectOption('Times New Roman');
      await fontSizeInput.fill('20');
      await fontSizeInput.blur();
      
      // Move field
      const initialBox = await nameField.boundingBox();
      await nameField.dragTo(page.locator('#idCanvas'), {
        targetPosition: { x: initialBox.x + 50, y: initialBox.y + 30 }
      });
      
      // Font settings should be preserved
      const fontFamily = await nameField.evaluate(el => window.getComputedStyle(el).fontFamily);
      const fontSize = await nameField.evaluate(el => window.getComputedStyle(el).fontSize);
      
      expect(fontFamily).toContain('Times New Roman');
      expect(fontSize).toBe('20px');
    });
  });

  test.describe('Field State Management', () => {
    test('should clear all fields when new template is uploaded', async ({ page }) => {
      // Add multiple fields
      await page.click('#addNameField');
      await page.click('#addDOBField');
      await page.click('#addPhotoField');
      
      const fields = page.locator('#fieldLayer .field');
      await expect(fields).toHaveCount(3);
      
      // Upload new template
      const fileInput = page.locator('#templateUpload');
      const testImagePath = path.join(__dirname, 'fixtures', 'small-test-template.svg');
      await fileInput.setInputFiles(testImagePath);
      await page.waitForTimeout(500);
      
      // Fields should be cleared
      await expect(fields).toHaveCount(0);
    });

    test('should hide fields during ID generation', async ({ page }) => {
      await page.click('#addNameField');
      await page.click('#addDOBField');
      
      const fields = page.locator('#fieldLayer .field');
      await expect(fields.nth(0)).toBeVisible();
      await expect(fields.nth(1)).toBeVisible();
      
      // Trigger ID generation
      await page.click('#generateButton');
      
      // Wait a moment for generation to start
      await page.waitForTimeout(500);
      
      // Fields should be hidden during generation
      await expect(fields.nth(0)).toHaveCSS('display', 'none');
      await expect(fields.nth(1)).toHaveCSS('display', 'none');
    });

    test('should show fields when editing layout', async ({ page }) => {
      await page.click('#addNameField');
      await page.click('#addDOBField');
      
      // Generate IDs first
      await page.click('#generateButton');
      await page.waitForSelector('#editLayoutButton:visible', { timeout: 10000 });
      
      // Click edit layout
      await page.click('#editLayoutButton');
      
      const fields = page.locator('#fieldLayer .field');
      
      // Fields should be visible again
      await expect(fields.nth(0)).toBeVisible();
      await expect(fields.nth(1)).toBeVisible();
    });
  });
});