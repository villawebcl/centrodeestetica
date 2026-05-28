import { expect, test } from "@playwright/test";

test.skip(
  !process.env.PUBLIC_SUPABASE_URL ||
    !process.env.PUBLIC_SUPABASE_ANON_KEY ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY ||
    !process.env.ADMIN_PASSWORD,
  "Supabase and admin env are required"
);

test("admin login page renders", async ({ page }) => {
  await page.goto("/admin/login");

  await expect(page.getByRole("heading", { name: /bienvenido/i })).toBeVisible();
  await expect(page.getByLabel(/contraseña/i)).toBeVisible();
});
