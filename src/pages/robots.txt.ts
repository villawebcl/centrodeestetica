import type { APIRoute } from "astro";

export const GET: APIRoute = ({ site, url }) => {
  const origin = site?.toString().replace(/\/$/, "") || url.origin;

  return new Response(`User-agent: *\nAllow: /\nDisallow: /admin\nSitemap: ${origin}/sitemap.xml\n`, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=0, s-maxage=3600"
    }
  });
};
