import type { APIRoute } from "astro";

const routes = [
  "",
  "servicios",
  "promociones",
  "profesionales",
  "reservar",
  "contacto",
  "preguntas-frecuentes",
  "politicas"
];

export const GET: APIRoute = ({ site, url }) => {
  const origin = site?.toString().replace(/\/$/, "") || url.origin;
  const today = new Date().toISOString().slice(0, 10);
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
  .map((route) => `  <url><loc>${origin}/${route}</loc><lastmod>${today}</lastmod></url>`)
  .join("\n")}
</urlset>`;

  return new Response(body, {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": "public, max-age=0, s-maxage=3600"
    }
  });
};
