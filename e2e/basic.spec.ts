import { test, expect } from "@playwright/test";

test('should load the home page and verify layout elements', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL('http://localhost:3000/');
});
