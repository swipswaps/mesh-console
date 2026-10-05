import { expect, test } from '@playwright/test'

test('offline badges render honestly', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Mesh Console' })).toBeVisible()
  await expect(page.getByText('Public mirror: offline')).toBeVisible()
  await expect(page.getByText('Private registry: offline')).toBeVisible()
  await expect(page.getByText('Local backend: offline')).toBeVisible()
  await expect(page.getByText('No nodes reported.')).toBeVisible()
})
