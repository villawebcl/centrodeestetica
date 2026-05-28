import { defineMiddleware } from "astro:middleware";
import { refreshAdminSessionCookie } from "@lib/adminAuth";

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, redirect } = context;

  // Si intenta entrar a /admin (pero no al login)
  if (
    (url.pathname.startsWith("/admin") && url.pathname !== "/admin/login") ||
    url.pathname.startsWith("/api/admin")
  ) {
    if (!(await refreshAdminSessionCookie(context))) {
      if (url.pathname.startsWith("/api/admin")) {
        return new Response(JSON.stringify({ error: "No autorizado" }), {
          status: 401,
          headers: { "content-type": "application/json" }
        });
      }

      return redirect("/admin/login");
    }
  }

  return next();
});
