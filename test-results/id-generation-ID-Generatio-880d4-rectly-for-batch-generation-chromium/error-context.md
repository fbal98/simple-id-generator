# Test info

- Name: ID Generation >> Batch ID Generation >> should update progress correctly for batch generation
- Location: /Users/fbal98/Desktop/work/2025/Tools/simple-id-generator/tests/id-generation.spec.js:177:9

# Error details

```
Error: Timed out 5000ms waiting for expect(locator).toContainText(expected)

Locator: locator('#progressText')
Expected string: "0 / 3"
Received string: ""
Call log:
  - expect.toContainText with timeout 5000ms
  - waiting for locator('#progressText')
    9 × locator resolved to <div id="progressText"></div>
      - unexpected value ""

    at /Users/fbal98/Desktop/work/2025/Tools/simple-id-generator/tests/id-generation.spec.js:189:34
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
- spinbutton "Number of IDs:": "3"
- button "Generate IDs"
- separator
- heading "Preview & Download" [level=4]
- button "Download Preview"
- button "Edit Layout"
- button "Download All (ZIP)"
```

# Test source

```ts
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
> 189 |       await expect(progressText).toContainText(`0 / ${batchSize}`);
      |                                  ^ Error: Timed out 5000ms waiting for expect(locator).toContainText(expected)
  190 |       
  191 |       // Wait for some progress
  192 |       await page.waitForFunction(() => {
  193 |         const text = document.querySelector('#progressText')?.textContent || '';
  194 |         return text.includes('1') || text.includes('2') || text.includes('3');
  195 |       }, { timeout: 20000 });
  196 |       
  197 |       // Wait for completion
  198 |       await page.waitForSelector('#generateButton:not([disabled])', { timeout: 30000 });
  199 |       
  200 |       // Final progress should show completion
  201 |       const finalProgress = await progressBar.getAttribute('value');
  202 |       expect(parseInt(finalProgress)).toBe(batchSize);
  203 |     });
  204 |
  205 |     test('should show Download All button only for multiple IDs', async ({ page }) => {
  206 |       await page.click('#addNameField');
  207 |       
  208 |       const downloadAllButton = page.locator('#downloadAllButton');
  209 |       
  210 |       // Single ID - Download All should be hidden
  211 |       await page.fill('#numIDsToGenerate', '1');
  212 |       await page.click('#generateButton');
  213 |       await page.waitForSelector('#generateButton:not([disabled])', { timeout: 20000 });
  214 |       
  215 |       await expect(downloadAllButton).toBeHidden();
  216 |       
  217 |       // Multiple IDs - Download All should be visible
  218 |       await page.fill('#numIDsToGenerate', '3');
  219 |       await page.click('#generateButton');
  220 |       await page.waitForSelector('#generateButton:not([disabled])', { timeout: 30000 });
  221 |       
  222 |       await expect(downloadAllButton).toBeVisible();
  223 |     });
  224 |
  225 |     test('should handle large batch generation', async ({ page }) => {
  226 |       await page.click('#addNameField');
  227 |       await page.click('#addDOBField');
  228 |       
  229 |       // Test larger batch (but reasonable for CI)
  230 |       await page.fill('#numIDsToGenerate', '10');
  231 |       
  232 |       await page.click('#generateButton');
  233 |       
  234 |       // Wait for completion with longer timeout
  235 |       await page.waitForSelector('#generateButton:not([disabled])', { timeout: 60000 });
  236 |       
  237 |       await expect(page.locator('#downloadAllButton')).toBeVisible();
  238 |       await expect(page.locator('#downloadPreviewButton')).toBeEnabled();
  239 |     });
  240 |   });
  241 |
  242 |   test.describe('Data Generation Validation', () => {
  243 |     test('should generate different data for each ID in batch', async ({ page }) => {
  244 |       await page.click('#addNameField');
  245 |       
  246 |       // Generate 3 IDs to check data variation
  247 |       await page.fill('#numIDsToGenerate', '3');
  248 |       await page.click('#generateButton');
  249 |       await page.waitForSelector('#generateButton:not([disabled])', { timeout: 30000 });
  250 |       
  251 |       // Check that app state contains generated data
  252 |       const generatedIds = await page.evaluate(() => {
  253 |         return window.appState.getGeneratedIds();
  254 |       });
  255 |       
  256 |       expect(generatedIds).toHaveLength(3);
  257 |       
  258 |       // Each ID should have unique data
  259 |       const names = generatedIds.map(id => id.instanceData.text[Object.keys(id.instanceData.text)[0]]);
  260 |       const uniqueNames = new Set(names);
  261 |       
  262 |       // Should have some variation (though not guaranteed to be all unique due to random generation)
  263 |       expect(uniqueNames.size).toBeGreaterThan(0);
  264 |     });
  265 |
  266 |     test('should generate valid date formats', async ({ page }) => {
  267 |       await page.click('#addDOBField');
  268 |       await page.click('#addIssueDateField');
  269 |       await page.click('#addExpiryDateField');
  270 |       
  271 |       await page.click('#generateButton');
  272 |       await page.waitForSelector('#generateButton:not([disabled])', { timeout: 20000 });
  273 |       
  274 |       const generatedIds = await page.evaluate(() => {
  275 |         return window.appState.getGeneratedIds();
  276 |       });
  277 |       
  278 |       expect(generatedIds).toHaveLength(1);
  279 |       
  280 |       const textData = generatedIds[0].instanceData.text;
  281 |       const dateFields = Object.values(textData);
  282 |       
  283 |       // Check date format (YYYY-MM-DD)
  284 |       const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  285 |       dateFields.forEach(date => {
  286 |         expect(date).toMatch(dateRegex);
  287 |       });
  288 |     });
  289 |
```