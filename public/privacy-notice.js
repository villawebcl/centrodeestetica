(function () {
  const key = "privacy_notice_seen";
  const banner = document.querySelector("#privacy-banner");
  const button = document.querySelector("#privacy-banner-ok");

  if (!banner || localStorage.getItem(key) === "1") return;

  banner.hidden = false;
  button?.addEventListener("click", () => {
    localStorage.setItem(key, "1");
    banner.hidden = true;
  });
})();
