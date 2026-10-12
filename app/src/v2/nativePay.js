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

async function iapPlugin() {
  const { Capacitor, registerPlugin } = await import("@capacitor/core");
  if (typeof Capacitor.isPluginAvailable === "function" && !Capacitor.isPluginAvailable("GemeloIap")) {
    throw new Error(
      "Module App Store non enregistré dans cette build. Supprimez Gemelo, réinstallez la dernière TestFlight, puis réessayez.",
    );
  }
  return registerPlugin("GemeloIap");
}

export async function pingAppleIap() {
  try {
    const GemeloIap = await iapPlugin();
    if (typeof GemeloIap?.ping !== "function") {
      throw new Error("Module App Store incomplet. Réinstallez la dernière build TestFlight.");
    }
    const result = await withTimeout(
      GemeloIap.ping(),
      6000,
      "Module App Store sans réponse (6 s). Réinstallez la dernière build TestFlight.",
    );
    if (!result?.ok) throw new Error("Module App Store invalide.");
    return result;
  } catch (error) {
    throw new Error(pluginMessage(error));
  }
}

export async function purchaseAppleProduct(productId) {
  try {
    await pingAppleIap();
    const GemeloIap = await iapPlugin();
    return await withTimeout(
      GemeloIap.purchase({ productId }),
      100000,
      "La fenêtre App Store ne s’est pas ouverte. Compte Sandbox : Réglages → App Store.",
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
