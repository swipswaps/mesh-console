import { expect, test } from '@playwright/test'

// Requires the local backend on :5180 (docker compose up) AND the dev
// server under test. Asserts the live path end to end: badge flips to
// live and the Security inventory renders real rows (names, never values).
test('local backend renders live with inventory', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('Local backend: live')).toBeVisible({ timeout: 15000 })
  await expect(page.getByText('Secrets inventory (names + modes only)')).toBeVisible()
  await expect(page.getByText(/recover\.log/)).toBeVisible()
  // No secret values may ever render: assert the absence positively.
  const body = (await page.textContent('body')) ?? ''
  expect(body).not.toMatch(/sk-[A-Za-z0-9]{8,}/)
  expect(body).not.toMatch(/apikey_[A-Za-z0-9_-]{4,}/)
})
