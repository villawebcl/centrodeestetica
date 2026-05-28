(function () {
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
