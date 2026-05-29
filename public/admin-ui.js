(function () {
  window.escapeHtml = function escapeHtml(v) {
    return String(v === undefined || v === null ? "" : v)
      .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  };

  window.showFormStatus = function showFormStatus(el, message, isError) {
    el.textContent = message;
    el.className   = isError ? "form-status form-status--error" : "form-status form-status--success";
    el.hidden      = false;
    setTimeout(() => { el.hidden = true; }, 4000);
  };

  window.uploadAdminImage = async function uploadAdminImage(folder, file, fallbackUrl) {
    if (!file || file.size === 0) return fallbackUrl;
    const body = new FormData();
    body.set("folder", folder);
    body.set("file", file);
    const res    = await fetch("/api/admin/upload", { method: "POST", body });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || "No se pudo subir la imagen.");
    return result.url;
  };

  window.showToast = function showToast(message, isError = false) {
    const container = document.querySelector("#toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `svc-toast${isError ? " svc-toast--error" : " svc-toast--success"}`;
    toast.setAttribute("role", "status");
    toast.innerHTML = `<span class="svc-toast__icon">${isError ? "x" : "✓"}</span><span>${String(message)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")}</span>`;
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add("svc-toast--visible"));
    setTimeout(() => {
      toast.classList.remove("svc-toast--visible");
      toast.addEventListener("transitionend", () => toast.remove(), { once: true });
    }, 4000);
  };
})();
