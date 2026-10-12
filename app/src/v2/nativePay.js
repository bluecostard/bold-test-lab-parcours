export function isNativeIos() {
  const cap = typeof window !== "undefined" ? window.Capacitor : null;
  return Boolean(cap?.isNativePlatform?.() && cap.getPlatform?.() === "ios");
}

function pluginMessage(error) {
  return error?.message || error?.errorMessage || String(error || "Erreur App Store.");
}

function withTimeout(promise, ms, message) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), ms);
  });
  return Promise.race([Promise.resolve(promise), timeout]).finally(() => clearTimeout(timer));
}

/** Appelle le plugin natif via le bridge injecté (évite le proxy @capacitor/core du bundle web). */
function nativeIap() {
  const Cap = typeof window !== "undefined" ? window.Capacitor : null;
  if (!Cap?.isNativePlatform?.() || Cap.getPlatform?.() !== "ios") {
    throw new Error("Paiement Apple réservé à l’app iOS.");
  }
  if (typeof Cap.nativePromise !== "function") {
    throw new Error("Bridge App Store indisponible. Réinstallez la dernière build TestFlight.");
  }
  const headers = Cap.PluginHeaders;
  const listed = Array.isArray(headers) && headers.some((h) => h?.name === "GemeloIap");
  const marked =
    typeof Cap.isPluginAvailable === "function" ? Cap.isPluginAvailable("GemeloIap") : listed;
  if (!marked && !listed) {
    throw new Error(
      "Module App Store non enregistré dans cette build. Supprimez Gemelo, réinstallez la dernière TestFlight, puis réessayez.",
    );
  }
  return {
    ping: () => Cap.nativePromise("GemeloIap", "ping", {}),
    purchase: (productId) => Cap.nativePromise("GemeloIap", "purchase", { productId }),
    finish: (transactionId) => Cap.nativePromise("GemeloIap", "finish", { transactionId }),
  };
}

export async function pingAppleIap() {
  try {
    const iap = nativeIap();
    const result = await withTimeout(
      iap.ping(),
      4000,
      "Module App Store sans réponse. Réinstallez la dernière build TestFlight.",
    );
    if (!result?.ok) throw new Error("Module App Store invalide.");
    return result;
  } catch (error) {
    throw new Error(pluginMessage(error));
  }
}

export async function purchaseAppleProduct(productId) {
  try {
    const iap = nativeIap();
    return await withTimeout(
      iap.purchase(productId),
      100000,
      "La fenêtre Apple Pay / App Store ne s’est pas ouverte. Compte Sandbox : Réglages → App Store.",
    );
  } catch (error) {
    throw new Error(pluginMessage(error));
  }
}

export async function finishAppleProduct(transactionId) {
  try {
    const iap = nativeIap();
    return await iap.finish(transactionId);
  } catch (error) {
    throw new Error(pluginMessage(error));
  }
}
