# Test info

- Name: ID Generation >> Single ID Generation >> should disable generate button during generation
- Location: /Users/fbal98/Desktop/work/2025/Tools/simple-id-generator/tests/id-generation.spec.js:88:9

# Error details

```
Error: Timed out 5000ms waiting for expect(locator).toBeDisabled()

Locator: locator('#generateButton')
Expected: disabled
Received: enabled
Call log:
  - expect.toBeDisabled with timeout 5000ms
  - waiting for locator('#generateButton')
    9 × locator resolved to <button id="generateButton" class="btn-primary" title="Generate the specified number of IDs">Generate IDs</button>
      - unexpected value "enabled"

    at /Users/fbal98/Desktop/work/2025/Tools/simple-id-generator/tests/id-generation.spec.js:101:36
```

# Page snapshot

```yaml
- heading "Controls" [level=3]
- text: "Upload ID Template:"
- button "Upload ID Template:"
- separator
- heading "Add Fields:" [level=4]
- button "Add Name"
- button "Add Date of Birth"
- button "Add Issue Date"
- button "Add Expiry Date"
- button "Add Civil Number"
- button "Add Photo Area"
- separator
- heading "Field Font" [level=4]
- text: "Font Family:"
- combobox "Font Family:" [disabled]:
  - option "Arial" [selected]
  - option "Courier New"
  - option "Times New Roman"
  - option "Verdana"
- text: "Font Size (px):"
- spinbutton "Font Size (px):" [disabled]: "16"
- heading "Generation" [level=3]
- text: "Number of IDs:"
- spinbutton "Number of IDs:": "1"
- button "Generate IDs"
- separator
- heading "Preview & Download" [level=4]
- button "Download Preview"
- button "Edit Layout"
```

# Test source

```ts
   1 | import { test, expect } from '@playwright/test';
   2 | import path from 'path';
   3 | import { setupFaceMocking } from './fixtures/mock-face.js';
   4 |
   5 | test.describe('ID Generation', () => {
   6 |   test.beforeEach(async ({ page }) => {
   7 |     // Setup face mocking for offline testing
   8 |     await setupFaceMocking(page);
   9 |     
   10 |     await page.goto('/');
   11 |     
   12 |     // Upload a realistic template
   13 |     const fileInput = page.locator('#templateUpload');
   14 |     const testImagePath = path.join(__dirname, 'fixtures', 'realistic-id-template.svg');
   15 |     await fileInput.setInputFiles(testImagePath);
   16 |     await page.waitForTimeout(1000);
   17 |   });
   18 |
   19 |   test.describe('Single ID Generation', () => {
   20 |     test('should generate single ID with all field types', async ({ page }) => {
   21 |       // Add all field types
   22 |       await page.click('#addNameField');
   23 |       await page.click('#addDOBField');
   24 |       await page.click('#addCivilNoField');
   25 |       await page.click('#addIssueDateField');
   26 |       await page.click('#addExpiryDateField');
   27 |       await page.click('#addPhotoField');
   28 |       
   29 |       // Position fields to avoid overlap
   30 |       const fields = page.locator('#fieldLayer .field');
   31 |       await fields.nth(0).dragTo(page.locator('#idCanvas'), { targetPosition: { x: 200, y: 100 } });
   32 |       await fields.nth(1).dragTo(page.locator('#idCanvas'), { targetPosition: { x: 200, y: 150 } });
   33 |       await fields.nth(2).dragTo(page.locator('#idCanvas'), { targetPosition: { x: 200, y: 200 } });
   34 |       await fields.nth(3).dragTo(page.locator('#idCanvas'), { targetPosition: { x: 200, y: 250 } });
   35 |       await fields.nth(4).dragTo(page.locator('#idCanvas'), { targetPosition: { x: 200, y: 300 } });
   36 |       await fields.nth(5).dragTo(page.locator('#idCanvas'), { targetPosition: { x: 50, y: 100 } });
   37 |       
   38 |       // Set number of IDs to 1
   39 |       await page.fill('#numIDsToGenerate', '1');
   40 |       
   41 |       // Generate ID
   42 |       await page.click('#generateButton');
   43 |       
   44 |       // Wait for generation to complete
   45 |       await page.waitForSelector('#generateButton:not([disabled])', { timeout: 30000 });
   46 |       
   47 |       // Check that buttons are enabled
   48 |       await expect(page.locator('#downloadPreviewButton')).toBeEnabled();
   49 |       await expect(page.locator('#editLayoutButton')).toBeVisible();
   50 |       
   51 |       // Check that canvas shows generated ID (not empty)
   52 |       const canvas = page.locator('#idCanvas');
   53 |       await expect(canvas).not.toHaveClass(/empty-canvas/);
   54 |     });
   55 |
   56 |     test('should show progress during generation', async ({ page }) => {
   57 |       await page.click('#addNameField');
   58 |       await page.click('#addPhotoField');
   59 |       
   60 |       // Set number of IDs to generate
   61 |       await page.fill('#numIDsToGenerate', '3');
   62 |       
   63 |       // Start generation
   64 |       const generateButton = page.locator('#generateButton');
   65 |       await generateButton.click();
   66 |       
   67 |       // Check that progress wrapper becomes visible
   68 |       const progressWrapper = page.locator('#progressWrapper');
   69 |       await expect(progressWrapper).toBeVisible();
   70 |       
   71 |       // Check that progress bar and text are present
   72 |       const progressBar = page.locator('#generationProgress');
   73 |       const progressText = page.locator('#progressText');
   74 |       
   75 |       await expect(progressBar).toBeVisible();
   76 |       await expect(progressText).toBeVisible();
   77 |       
   78 |       // Progress text should show current status
   79 |       await expect(progressText).toContainText('3');
   80 |       
   81 |       // Wait for completion
   82 |       await page.waitForSelector('#generateButton:not([disabled])', { timeout: 30000 });
   83 |       
   84 |       // Progress wrapper should be hidden after completion
   85 |       await expect(progressWrapper).toBeHidden();
   86 |     });
   87 |
   88 |     test('should disable generate button during generation', async ({ page }) => {
   89 |       await page.click('#addNameField');
   90 |       
   91 |       const generateButton = page.locator('#generateButton');
   92 |       
   93 |       // Initially enabled
   94 |       await expect(generateButton).toBeEnabled();
   95 |       await expect(generateButton).toHaveText('Generate IDs');
   96 |       
   97 |       // Click generate
   98 |       await generateButton.click();
   99 |       
  100 |       // Should be disabled and show different text
> 101 |       await expect(generateButton).toBeDisabled();
      |                                    ^ Error: Timed out 5000ms waiting for expect(locator).toBeDisabled()
  102 |       await expect(generateButton).toHaveText('Generating...');
  103 |       
  104 |       // Wait for completion
  105 |       await page.waitForSelector('#generateButton:not([disabled])', { timeout: 30000 });
  106 |       
  107 |       // Should be enabled again
  108 |       await expect(generateButton).toBeEnabled();
  109 |       await expect(generateButton).toHaveText('Generate IDs');
  110 |     });
  111 |
  112 |     test('should hide fields during generation', async ({ page }) => {
  113 |       await page.click('#addNameField');
  114 |       await page.click('#addDOBField');
  115 |       
  116 |       const fields = page.locator('#fieldLayer .field');
  117 |       
  118 |       // Fields should be visible initially
  119 |       await expect(fields.nth(0)).toBeVisible();
  120 |       await expect(fields.nth(1)).toBeVisible();
  121 |       
  122 |       // Start generation
  123 |       await page.click('#generateButton');
  124 |       
  125 |       // Fields should be hidden during generation
  126 |       await expect(fields.nth(0)).toHaveCSS('display', 'none');
  127 |       await expect(fields.nth(1)).toHaveCSS('display', 'none');
  128 |       
  129 |       // Wait for completion
  130 |       await page.waitForSelector('#generateButton:not([disabled])', { timeout: 30000 });
  131 |       
  132 |       // Fields should remain hidden after generation
  133 |       await expect(fields.nth(0)).toHaveCSS('display', 'none');
  134 |       await expect(fields.nth(1)).toHaveCSS('display', 'none');
  135 |     });
  136 |
  137 |     test('should handle generation without photo fields', async ({ page }) => {
  138 |       // Add only text fields
  139 |       await page.click('#addNameField');
  140 |       await page.click('#addDOBField');
  141 |       await page.click('#addCivilNoField');
  142 |       
  143 |       await page.click('#generateButton');
  144 |       
  145 |       // Should complete successfully without photo fetching
  146 |       await page.waitForSelector('#generateButton:not([disabled])', { timeout: 15000 });
  147 |       
  148 |       await expect(page.locator('#downloadPreviewButton')).toBeEnabled();
  149 |     });
  150 |
  151 |     test('should handle generation with only photo fields', async ({ page }) => {
  152 |       await page.click('#addPhotoField');
  153 |       
  154 |       await page.click('#generateButton');
  155 |       
  156 |       // Should complete with AI face fetching
  157 |       await page.waitForSelector('#generateButton:not([disabled])', { timeout: 30000 });
  158 |       
  159 |       await expect(page.locator('#downloadPreviewButton')).toBeEnabled();
  160 |     });
  161 |   });
  162 |
  163 |   test.describe('Batch ID Generation', () => {
  164 |     test('should generate multiple IDs', async ({ page }) => {
  165 |       await page.click('#addNameField');
  166 |       await page.click('#addDOBField');
  167 |       
  168 |       // Set batch size
  169 |       await page.fill('#numIDsToGenerate', '5');
  170 |       
  171 |       await page.click('#generateButton');
  172 |       
  173 |       // Wait for completion
  174 |       await page.waitForSelector('#generateButton:not([disabled])', { timeout: 45000 });
  175 |       
  176 |       // Download All button should be visible for multiple IDs
  177 |       await expect(page.locator('#downloadAllButton')).toBeVisible();
  178 |       await expect(page.locator('#downloadPreviewButton')).toBeEnabled();
  179 |     });
  180 |
  181 |     test('should update progress correctly for batch generation', async ({ page }) => {
  182 |       await page.click('#addNameField');
  183 |       
  184 |       const batchSize = 3;
  185 |       await page.fill('#numIDsToGenerate', batchSize.toString());
  186 |       
  187 |       await page.click('#generateButton');
  188 |       
  189 |       const progressBar = page.locator('#generationProgress');
  190 |       const progressText = page.locator('#progressText');
  191 |       
  192 |       // Check initial progress state
  193 |       await expect(progressText).toContainText(`0 / ${batchSize}`);
  194 |       
  195 |       // Wait for some progress
  196 |       await page.waitForFunction(() => {
  197 |         const text = document.querySelector('#progressText')?.textContent || '';
  198 |         return text.includes('1') || text.includes('2') || text.includes('3');
  199 |       }, { timeout: 20000 });
  200 |       
  201 |       // Wait for completion
```