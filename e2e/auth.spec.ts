import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("shows login page", async ({ page }) => {
    await page.goto("/login");
    await expect(page).toHaveTitle(/Better Media/);
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
  });

  test("shows register page", async ({ page }) => {
    await page.goto("/register");
    await expect(
      page.getByRole("heading", { name: /create account/i }),
    ).toBeVisible();
  });

  test("shows validation errors on login form", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(
      page.getByText(/invalid/i),
    ).toBeVisible();
  });
});

test.describe("Home Page", () => {
  test("redirects unauthenticated users to login", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
  });
});
