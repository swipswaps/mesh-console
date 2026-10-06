import { expect, test } from '@playwright/test'

// Dev serves frontend/public/endpoints.json (bootstrap snapshot, aged)
// so the honest states are: mirror stale, registry offline, local
// backend offline (nothing on :5180 in test env), ws24 row visible.
test('stale mirror renders honestly', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Mesh Console' })).toBeVisible()
  await expect(page.getByText('Public mirror: stale')).toBeVisible()
  await expect(page.getByText('Private registry: offline')).toBeVisible()
  await expect(page.getByText('Local backend: offline')).toBeVisible()
  await expect(page.getByText(/ws24 — lan/)).toBeVisible()
})
