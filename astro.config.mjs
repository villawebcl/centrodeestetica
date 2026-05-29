import { defineConfig } from "astro/config";
import netlify from "@astrojs/netlify";

export default defineConfig({
  site: process.env.PUBLIC_SITE_URL || "https://luminaestetica.cl",
  output: "server",
  adapter: netlify(),
});
