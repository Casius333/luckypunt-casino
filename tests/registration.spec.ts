import { test, expect } from '@playwright/test';

test.describe('Registration Flow', () => {
  test('should register a new user successfully', async ({ page }) => {
    // Start tracing for debugging
    await page.context().tracing.start({ screenshots: true, snapshots: true });

    try {
      // Go to homepage
      await page.goto('/');
      console.log('Navigated to homepage');
      
      // Click the Register button in the header to open modal
      await page.getByRole('banner').getByRole('button', { name: 'Register' }).click();
      console.log('Clicked Register button');
      
      // Wait for modal to appear and switch to registration tab if needed
      await page.waitForSelector('[role="dialog"]', { state: 'visible', timeout: 5000 });
      console.log('Modal appeared');
      
      // Click the Register tab in the modal
      await page.getByRole('button', { name: 'Register', exact: true }).nth(1).click();
      console.log('Switched to Register tab');
      
      // Fill in registration form - using more specific selectors
      const testEmail = `test${Date.now()}@example.com`;
      await page.locator('input[type="email"]').fill(testEmail);
      await page.locator('input[type="password"]').fill('password123');
      console.log('Filled form with:', testEmail);
      
      // Submit form using the submit button inside the form
      await page.locator('form button[type="submit"]').click();
      console.log('Submitted form');
      
      // Wait for the loading state to appear and then disappear
      const submitButton = page.locator('form button[type="submit"]');
      await expect(submitButton).toBeDisabled();
      console.log('Button disabled during loading');
      
      // Wait for success toast notification with increased timeout
      await expect(page.getByText('Registration successful', { exact: false })).toBeVisible({
        timeout: 15000
      });
      console.log('Success message appeared');

      // Wait for modal to be removed
      await expect(page.locator('[role="dialog"]')).toBeHidden({
        timeout: 5000
      });
      console.log('Modal closed');

    } catch (error) {
      // Log any errors
      console.error('Test failed:', error);
      
      // Take a screenshot on failure
      await page.screenshot({ path: './test-results/registration-error.png' });
      
      throw error;
    } finally {
      // Stop tracing and save for debugging
      await page.context().tracing.stop({
        path: './test-results/registration-trace.zip'
      });
    }
  });

  test('should handle registration errors appropriately', async ({ page }) => {
    await page.goto('/');
    
    // Click the Register button in the header
    await page.getByRole('banner').getByRole('button', { name: 'Register' }).click();
    
    // Wait for modal and switch to registration tab
    await page.waitForSelector('[role="dialog"]');
    await page.getByRole('button', { name: 'Register', exact: true }).nth(1).click();
    
    // Try to submit without filling form
    await page.locator('form button[type="submit"]').click();
    
    // Check for validation messages
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toHaveAttribute('required', '');
    
    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toHaveAttribute('required', '');
  });
}); 