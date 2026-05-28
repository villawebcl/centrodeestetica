import { defineConfig } from "vitest/config";

export default defineConfig({
  define: {
    "import.meta.env.ADMIN_SESSION_SECRET": JSON.stringify("test-session-secret-with-enough-entropy"),
    "import.meta.env.ADMIN_PASSWORD": JSON.stringify("Test-Password1!"),
    "import.meta.env.SUPABASE_SERVICE_ROLE_KEY": JSON.stringify("")
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    restoreMocks: true
  },
  resolve: {
    alias: {
      "@lib": new URL("./src/lib", import.meta.url).pathname
    }
  }
});
