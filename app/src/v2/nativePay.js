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

export async function purchaseAppleProduct(productId) {
  try {
    const GemeloIap = await iapPlugin();
    if (!GemeloIap?.purchase) throw new Error("Achats Apple indisponibles dans cette version. Mettez Gemelo à jour via TestFlight.");
    return await GemeloIap.purchase({ productId });
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
