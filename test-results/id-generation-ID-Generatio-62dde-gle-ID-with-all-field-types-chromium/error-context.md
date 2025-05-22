# Test info

- Name: ID Generation >> Single ID Generation >> should generate single ID with all field types
- Location: /Users/fbal98/Desktop/work/2025/Tools/simple-id-generator/tests/id-generation.spec.js:16:9

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

    at /Users/fbal98/Desktop/work/2025/Tools/simple-id-generator/tests/id-generation.spec.js:27:27
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
>  27 |       await fields.nth(0).dragTo(page.locator('#idCanvas'), { targetPosition: { x: 200, y: 100 } });
      |                           ^ TimeoutError: locator.dragTo: Timeout 5000ms exceeded.
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
   97 |       await expect(generateButton).toBeDisabled();
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
```