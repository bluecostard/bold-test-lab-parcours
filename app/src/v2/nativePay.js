export function isNativeIos() {
  const cap = typeof window !== "undefined" ? window.Capacitor : null;
  return Boolean(cap?.isNativePlatform?.() && cap.getPlatform?.() === "ios");
}

function iapPlugin() {
  return import("@capacitor/core").then(({ registerPlugin }) => registerPlugin("GemeloIap"));
}

function pluginMessage(error) {
  return error?.message || error?.errorMessage || String(error || "Erreur App Store.");
}

function withTimeout(promise, ms, message) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

export async function purchaseAppleProduct(productId) {
  try {
    const GemeloIap = await iapPlugin();
    if (!GemeloIap?.purchase) {
      throw new Error("Achats Apple indisponibles dans cette version. Mettez Gemelo à jour via TestFlight.");
    }
    if (typeof GemeloIap.ping === "function") {
      try {
        await withTimeout(GemeloIap.ping(), 5000, "Plugin App Store muet.");
      } catch {
        throw new Error("Le module App Store n’est pas chargé. Installez la dernière build TestFlight.");
      }
    }
    return await withTimeout(
      GemeloIap.purchase({ productId }),
      130000,
      "La fenêtre App Store ne s’est pas ouverte. Compte Sandbox : Réglages → App Store → Sandbox. Puis rouvrez Gemelo.",
    );
  } catch (error) {
    throw new Error(pluginMessage(error));
  }
}

export async function finishAppleProduct(transactionId) {
  try {
    const GemeloIap = await iapPlugin();
    return await GemeloIap.finish({ transactionId });
  } catch (error) {
    throw new Error(pluginMessage(error));
  }
}
