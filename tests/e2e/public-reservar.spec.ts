import { expect, test } from "@playwright/test";

test.skip(!process.env.PUBLIC_SUPABASE_URL || !process.env.PUBLIC_SUPABASE_ANON_KEY, "Supabase env is required");

test("public reservation page renders the booking flow", async ({ page }) => {
  await page.goto("/reservar");

  await expect(page.getByRole("heading", { name: /elige tu tratamiento/i })).toBeVisible();
  await expect(page.getByLabel(/nombre completo/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /solicitar reserva/i })).toBeVisible();
});
