import { useEffect } from "react";

/** Retire le splash HTML pré-React (#boot-splash dans index.html). */
export function hideHtmlSplash() {
  const node = document.getElementById("boot-splash");
  if (!node) return;
  node.setAttribute("hidden", "");
  node.remove();
}

/** Masque le splash natif Capacitor (handoff vers le splash web ou le contenu). */
export function hideNativeSplash() {
  const Cap = typeof window !== "undefined" ? window.Capacitor : null;
  if (!Cap?.isNativePlatform?.()) return;
  import("@capacitor/splash-screen")
    .then(({ SplashScreen }) => SplashScreen.hide({ fadeOutDuration: 220 }))
    .catch(() => {});
}

/** Fin du boot : HTML + natif. */
export function dismissBootSplash() {
  hideHtmlSplash();
  hideNativeSplash();
}

/**
 * Écran de démarrage unique : logo Gemelo centré, fond marque.
 * Remplace les états textuels successifs pendant le boot.
 */
export function BootSplash() {
  useEffect(() => {
    hideHtmlSplash();
    hideNativeSplash();
  }, []);

  return (
    <div className="v2-boot-splash" role="status" aria-live="polite" aria-label="Chargement de Gemelo">
      <img className="v2-boot-splash-logo" src="/logo-gemelo.png" alt="" width="220" height="41" decoding="async" />
    </div>
  );
}
