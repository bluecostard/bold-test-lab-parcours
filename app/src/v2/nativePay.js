export function isNativeIos() {
  const cap = typeof window !== "undefined" ? window.Capacitor : null;
  return Boolean(cap?.isNativePlatform?.() && cap.getPlatform?.() === "ios");
}

function iapPlugin() {
  return import("@capacitor/core").then(({ registerPlugin }) => registerPlugin("GemeloIap"));
}

export async function purchaseAppleProduct(productId) {
  const GemeloIap = await iapPlugin();
  return GemeloIap.purchase({ productId });
}

export async function finishAppleProduct(transactionId) {
  const GemeloIap = await iapPlugin();
  return GemeloIap.finish({ transactionId });
}
