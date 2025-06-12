import { test, expect } from '@playwright/test'

test.describe('Auth Modal', () => {
  test('should show sign in form when clicking Sign In', async ({ page }) => {
    await page.goto('/')
    await page.click('text=Sign In')
    await expect(page.locator('h2:text("Sign In")')).toBeVisible()
  })

  test('should show register form when clicking Register', async ({ page }) => {
    await page.goto('/')
    await page.click('text=Register')
    await expect(page.locator('button[role="tab"]:text("Register")')).toHaveAttribute('aria-selected', 'true')
  })
}) 