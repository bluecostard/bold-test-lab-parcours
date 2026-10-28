export function isOfficialDesktop() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("ecran") || params.get("v1") === "1" || params.get("app") === "1") return false;
  const path = window.location.pathname;
  if (path === "/app" || path.startsWith("/app/") || path.startsWith("/besoin")) return false;
  if (/^\/(confidentialite|cgu|cgv|legal|contact|mentions|stores|supprimer|regles|introuvable)(\/|$)/.test(path)) return false;
  if (/^#\/(verify|sign-up|sign-in|factor|continue|sso-callback|oauth)/i.test(window.location.hash)) return false;
  const mobile = window.matchMedia("(max-width: 900px)").matches
    || /Android|iPhone|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  return !mobile;
}

export function bindDesktopStoreButtons() {
  // Only .unavailable (App Store). Google Play is a live link — no “bientôt” handler.
  document.querySelectorAll("#desktop-site .unavailable").forEach((button) => {
    button.addEventListener("click", () => {
      const status = document.getElementById("storeStatus");
      if (status) {
        status.textContent = "Gemelo est déjà sur Google Play. L’App Store ouvrira dès la validation Apple. Suivez @bluecostard pour la date iOS.";
      }
    });
  });
}
