# Test info

- Name: ID Generation >> Batch ID Generation >> should update progress correctly for batch generation
- Location: /Users/fbal98/Desktop/work/2025/Tools/simple-id-generator/tests/id-generation.spec.js:181:9

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

    at /Users/fbal98/Desktop/work/2025/Tools/simple-id-generator/tests/id-generation.spec.js:193:34
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
> 193 |       await expect(progressText).toContainText(`0 / ${batchSize}`);
      |                                  ^ Error: Timed out 5000ms waiting for expect(locator).toContainText(expected)
  194 |       
  195 |       // Wait for some progress
  196 |       await page.waitForFunction(() => {
  197 |         const text = document.querySelector('#progressText')?.textContent || '';
  198 |         return text.includes('1') || text.includes('2') || text.includes('3');
  199 |       }, { timeout: 20000 });
  200 |       
  201 |       // Wait for completion
  202 |       await page.waitForSelector('#generateButton:not([disabled])', { timeout: 30000 });
  203 |       
  204 |       // Final progress should show completion
  205 |       const finalProgress = await progressBar.getAttribute('value');
  206 |       expect(parseInt(finalProgress)).toBe(batchSize);
  207 |     });
  208 |
  209 |     test('should show Download All button only for multiple IDs', async ({ page }) => {
  210 |       await page.click('#addNameField');
  211 |       
  212 |       const downloadAllButton = page.locator('#downloadAllButton');
  213 |       
  214 |       // Single ID - Download All should be hidden
  215 |       await page.fill('#numIDsToGenerate', '1');
  216 |       await page.click('#generateButton');
  217 |       await page.waitForSelector('#generateButton:not([disabled])', { timeout: 20000 });
  218 |       
  219 |       await expect(downloadAllButton).toBeHidden();
  220 |       
  221 |       // Multiple IDs - Download All should be visible
  222 |       await page.fill('#numIDsToGenerate', '3');
  223 |       await page.click('#generateButton');
  224 |       await page.waitForSelector('#generateButton:not([disabled])', { timeout: 30000 });
  225 |       
  226 |       await expect(downloadAllButton).toBeVisible();
  227 |     });
  228 |
  229 |     test('should handle large batch generation', async ({ page }) => {
  230 |       await page.click('#addNameField');
  231 |       await page.click('#addDOBField');
  232 |       
  233 |       // Test larger batch (but reasonable for CI)
  234 |       await page.fill('#numIDsToGenerate', '10');
  235 |       
  236 |       await page.click('#generateButton');
  237 |       
  238 |       // Wait for completion with longer timeout
  239 |       await page.waitForSelector('#generateButton:not([disabled])', { timeout: 60000 });
  240 |       
  241 |       await expect(page.locator('#downloadAllButton')).toBeVisible();
  242 |       await expect(page.locator('#downloadPreviewButton')).toBeEnabled();
  243 |     });
  244 |   });
  245 |
  246 |   test.describe('Data Generation Validation', () => {
  247 |     test('should generate different data for each ID in batch', async ({ page }) => {
  248 |       await page.click('#addNameField');
  249 |       
  250 |       // Generate 3 IDs to check data variation
  251 |       await page.fill('#numIDsToGenerate', '3');
  252 |       await page.click('#generateButton');
  253 |       await page.waitForSelector('#generateButton:not([disabled])', { timeout: 30000 });
  254 |       
  255 |       // Check that app state contains generated data
  256 |       const generatedIds = await page.evaluate(() => {
  257 |         return window.appState.getGeneratedIds();
  258 |       });
  259 |       
  260 |       expect(generatedIds).toHaveLength(3);
  261 |       
  262 |       // Each ID should have unique data
  263 |       const names = generatedIds.map(id => id.instanceData.text[Object.keys(id.instanceData.text)[0]]);
  264 |       const uniqueNames = new Set(names);
  265 |       
  266 |       // Should have some variation (though not guaranteed to be all unique due to random generation)
  267 |       expect(uniqueNames.size).toBeGreaterThan(0);
  268 |     });
  269 |
  270 |     test('should generate valid date formats', async ({ page }) => {
  271 |       await page.click('#addDOBField');
  272 |       await page.click('#addIssueDateField');
  273 |       await page.click('#addExpiryDateField');
  274 |       
  275 |       await page.click('#generateButton');
  276 |       await page.waitForSelector('#generateButton:not([disabled])', { timeout: 20000 });
  277 |       
  278 |       const generatedIds = await page.evaluate(() => {
  279 |         return window.appState.getGeneratedIds();
  280 |       });
  281 |       
  282 |       expect(generatedIds).toHaveLength(1);
  283 |       
  284 |       const textData = generatedIds[0].instanceData.text;
  285 |       const dateFields = Object.values(textData);
  286 |       
  287 |       // Check date format (YYYY-MM-DD)
  288 |       const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  289 |       dateFields.forEach(date => {
  290 |         expect(date).toMatch(dateRegex);
  291 |       });
  292 |     });
  293 |
```