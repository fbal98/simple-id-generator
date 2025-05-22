# Test info

- Name: ID Generation >> Single ID Generation >> should generate single ID with all field types
- Location: /Users/fbal98/Desktop/work/2025/Tools/simple-id-generator/tests/id-generation.spec.js:20:9

# Error details

```
TimeoutError: locator.dragTo: Timeout 5000ms exceeded.
Call log:
  - waiting for locator('#fieldLayer .field').first()
    - locator resolved to <div class="field" data-type="name" id="field-name-0">…</div>
  - attempting move and down action
    - waiting for element to be visible and stable
    - element is visible and stable
    - scrolling into view if needed
    - done scrolling
    - performing move and down action
    - move and down action done
    - waiting for scheduled navigations to finish
    - navigations have finished
  - waiting for locator('#idCanvas')
    - locator resolved to <canvas class="" width="600" height="380" id="idCanvas"></canvas>
  - attempting move and up action
    2 × waiting for element to be visible and stable
      - element is visible and stable
      - scrolling into view if needed
      - done scrolling
      - <div id="fieldLayer">…</div> intercepts pointer events
    - retrying move and up action
    - waiting 20ms
    2 × waiting for element to be visible and stable
      - element is visible and stable
      - scrolling into view if needed
      - done scrolling
      - <div id="fieldLayer">…</div> intercepts pointer events
    - retrying move and up action
      - waiting 100ms
    9 × waiting for element to be visible and stable
      - element is visible and stable
      - scrolling into view if needed
      - done scrolling
      - <div id="fieldLayer">…</div> intercepts pointer events
    - retrying move and up action
      - waiting 500ms

    at /Users/fbal98/Desktop/work/2025/Tools/simple-id-generator/tests/id-generation.spec.js:31:27
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
- combobox "Font Family:":
  - option "Arial" [selected]
  - option "Courier New"
  - option "Times New Roman"
  - option "Verdana"
- text: "Font Size (px):"
- spinbutton "Font Size (px):": "16"
- text: Full Name YYYY-MM-DD Civil Number/ID YYYY-MM-DD YYYY-MM-DD Photo Area
- heading "Generation" [level=3]
- text: "Number of IDs:"
- spinbutton "Number of IDs:": "1"
- button "Generate IDs"
- separator
- heading "Preview & Download" [level=4]
- button "Download Preview" [disabled]
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
>  31 |       await fields.nth(0).dragTo(page.locator('#idCanvas'), { targetPosition: { x: 200, y: 100 } });
      |                           ^ TimeoutError: locator.dragTo: Timeout 5000ms exceeded.
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
  101 |       await expect(generateButton).toBeDisabled();
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
```