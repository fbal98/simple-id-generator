# Test info

- Name: ID Generation >> Single ID Generation >> should disable generate button during generation
- Location: /Users/fbal98/Desktop/work/2025/Tools/simple-id-generator/tests/id-generation.spec.js:84:9

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

    at /Users/fbal98/Desktop/work/2025/Tools/simple-id-generator/tests/id-generation.spec.js:97:36
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
   3 |
   4 | test.describe('ID Generation', () => {
   5 |   test.beforeEach(async ({ page }) => {
   6 |     await page.goto('/');
   7 |     
   8 |     // Upload a realistic template
   9 |     const fileInput = page.locator('#templateUpload');
   10 |     const testImagePath = path.join(__dirname, 'fixtures', 'realistic-id-template.svg');
   11 |     await fileInput.setInputFiles(testImagePath);
   12 |     await page.waitForTimeout(1000);
   13 |   });
   14 |
   15 |   test.describe('Single ID Generation', () => {
   16 |     test('should generate single ID with all field types', async ({ page }) => {
   17 |       // Add all field types
   18 |       await page.click('#addNameField');
   19 |       await page.click('#addDOBField');
   20 |       await page.click('#addCivilNoField');
   21 |       await page.click('#addIssueDateField');
   22 |       await page.click('#addExpiryDateField');
   23 |       await page.click('#addPhotoField');
   24 |       
   25 |       // Position fields to avoid overlap
   26 |       const fields = page.locator('#fieldLayer .field');
   27 |       await fields.nth(0).dragTo(page.locator('#idCanvas'), { targetPosition: { x: 200, y: 100 } });
   28 |       await fields.nth(1).dragTo(page.locator('#idCanvas'), { targetPosition: { x: 200, y: 150 } });
   29 |       await fields.nth(2).dragTo(page.locator('#idCanvas'), { targetPosition: { x: 200, y: 200 } });
   30 |       await fields.nth(3).dragTo(page.locator('#idCanvas'), { targetPosition: { x: 200, y: 250 } });
   31 |       await fields.nth(4).dragTo(page.locator('#idCanvas'), { targetPosition: { x: 200, y: 300 } });
   32 |       await fields.nth(5).dragTo(page.locator('#idCanvas'), { targetPosition: { x: 50, y: 100 } });
   33 |       
   34 |       // Set number of IDs to 1
   35 |       await page.fill('#numIDsToGenerate', '1');
   36 |       
   37 |       // Generate ID
   38 |       await page.click('#generateButton');
   39 |       
   40 |       // Wait for generation to complete
   41 |       await page.waitForSelector('#generateButton:not([disabled])', { timeout: 30000 });
   42 |       
   43 |       // Check that buttons are enabled
   44 |       await expect(page.locator('#downloadPreviewButton')).toBeEnabled();
   45 |       await expect(page.locator('#editLayoutButton')).toBeVisible();
   46 |       
   47 |       // Check that canvas shows generated ID (not empty)
   48 |       const canvas = page.locator('#idCanvas');
   49 |       await expect(canvas).not.toHaveClass(/empty-canvas/);
   50 |     });
   51 |
   52 |     test('should show progress during generation', async ({ page }) => {
   53 |       await page.click('#addNameField');
   54 |       await page.click('#addPhotoField');
   55 |       
   56 |       // Set number of IDs to generate
   57 |       await page.fill('#numIDsToGenerate', '3');
   58 |       
   59 |       // Start generation
   60 |       const generateButton = page.locator('#generateButton');
   61 |       await generateButton.click();
   62 |       
   63 |       // Check that progress wrapper becomes visible
   64 |       const progressWrapper = page.locator('#progressWrapper');
   65 |       await expect(progressWrapper).toBeVisible();
   66 |       
   67 |       // Check that progress bar and text are present
   68 |       const progressBar = page.locator('#generationProgress');
   69 |       const progressText = page.locator('#progressText');
   70 |       
   71 |       await expect(progressBar).toBeVisible();
   72 |       await expect(progressText).toBeVisible();
   73 |       
   74 |       // Progress text should show current status
   75 |       await expect(progressText).toContainText('3');
   76 |       
   77 |       // Wait for completion
   78 |       await page.waitForSelector('#generateButton:not([disabled])', { timeout: 30000 });
   79 |       
   80 |       // Progress wrapper should be hidden after completion
   81 |       await expect(progressWrapper).toBeHidden();
   82 |     });
   83 |
   84 |     test('should disable generate button during generation', async ({ page }) => {
   85 |       await page.click('#addNameField');
   86 |       
   87 |       const generateButton = page.locator('#generateButton');
   88 |       
   89 |       // Initially enabled
   90 |       await expect(generateButton).toBeEnabled();
   91 |       await expect(generateButton).toHaveText('Generate IDs');
   92 |       
   93 |       // Click generate
   94 |       await generateButton.click();
   95 |       
   96 |       // Should be disabled and show different text
>  97 |       await expect(generateButton).toBeDisabled();
      |                                    ^ Error: Timed out 5000ms waiting for expect(locator).toBeDisabled()
   98 |       await expect(generateButton).toHaveText('Generating...');
   99 |       
  100 |       // Wait for completion
  101 |       await page.waitForSelector('#generateButton:not([disabled])', { timeout: 30000 });
  102 |       
  103 |       // Should be enabled again
  104 |       await expect(generateButton).toBeEnabled();
  105 |       await expect(generateButton).toHaveText('Generate IDs');
  106 |     });
  107 |
  108 |     test('should hide fields during generation', async ({ page }) => {
  109 |       await page.click('#addNameField');
  110 |       await page.click('#addDOBField');
  111 |       
  112 |       const fields = page.locator('#fieldLayer .field');
  113 |       
  114 |       // Fields should be visible initially
  115 |       await expect(fields.nth(0)).toBeVisible();
  116 |       await expect(fields.nth(1)).toBeVisible();
  117 |       
  118 |       // Start generation
  119 |       await page.click('#generateButton');
  120 |       
  121 |       // Fields should be hidden during generation
  122 |       await expect(fields.nth(0)).toHaveCSS('display', 'none');
  123 |       await expect(fields.nth(1)).toHaveCSS('display', 'none');
  124 |       
  125 |       // Wait for completion
  126 |       await page.waitForSelector('#generateButton:not([disabled])', { timeout: 30000 });
  127 |       
  128 |       // Fields should remain hidden after generation
  129 |       await expect(fields.nth(0)).toHaveCSS('display', 'none');
  130 |       await expect(fields.nth(1)).toHaveCSS('display', 'none');
  131 |     });
  132 |
  133 |     test('should handle generation without photo fields', async ({ page }) => {
  134 |       // Add only text fields
  135 |       await page.click('#addNameField');
  136 |       await page.click('#addDOBField');
  137 |       await page.click('#addCivilNoField');
  138 |       
  139 |       await page.click('#generateButton');
  140 |       
  141 |       // Should complete successfully without photo fetching
  142 |       await page.waitForSelector('#generateButton:not([disabled])', { timeout: 15000 });
  143 |       
  144 |       await expect(page.locator('#downloadPreviewButton')).toBeEnabled();
  145 |     });
  146 |
  147 |     test('should handle generation with only photo fields', async ({ page }) => {
  148 |       await page.click('#addPhotoField');
  149 |       
  150 |       await page.click('#generateButton');
  151 |       
  152 |       // Should complete with AI face fetching
  153 |       await page.waitForSelector('#generateButton:not([disabled])', { timeout: 30000 });
  154 |       
  155 |       await expect(page.locator('#downloadPreviewButton')).toBeEnabled();
  156 |     });
  157 |   });
  158 |
  159 |   test.describe('Batch ID Generation', () => {
  160 |     test('should generate multiple IDs', async ({ page }) => {
  161 |       await page.click('#addNameField');
  162 |       await page.click('#addDOBField');
  163 |       
  164 |       // Set batch size
  165 |       await page.fill('#numIDsToGenerate', '5');
  166 |       
  167 |       await page.click('#generateButton');
  168 |       
  169 |       // Wait for completion
  170 |       await page.waitForSelector('#generateButton:not([disabled])', { timeout: 45000 });
  171 |       
  172 |       // Download All button should be visible for multiple IDs
  173 |       await expect(page.locator('#downloadAllButton')).toBeVisible();
  174 |       await expect(page.locator('#downloadPreviewButton')).toBeEnabled();
  175 |     });
  176 |
  177 |     test('should update progress correctly for batch generation', async ({ page }) => {
  178 |       await page.click('#addNameField');
  179 |       
  180 |       const batchSize = 3;
  181 |       await page.fill('#numIDsToGenerate', batchSize.toString());
  182 |       
  183 |       await page.click('#generateButton');
  184 |       
  185 |       const progressBar = page.locator('#generationProgress');
  186 |       const progressText = page.locator('#progressText');
  187 |       
  188 |       // Check initial progress state
  189 |       await expect(progressText).toContainText(`0 / ${batchSize}`);
  190 |       
  191 |       // Wait for some progress
  192 |       await page.waitForFunction(() => {
  193 |         const text = document.querySelector('#progressText')?.textContent || '';
  194 |         return text.includes('1') || text.includes('2') || text.includes('3');
  195 |       }, { timeout: 20000 });
  196 |       
  197 |       // Wait for completion
```