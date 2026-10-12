import { Capacitor } from "@capacitor/core";

let started = false;

function openEcran(ecran) {
  if (!ecran || typeof window === "undefined") return;
  const url = new URL(window.location.href);
  url.searchParams.set("app", "1");
  url.searchParams.set("ecran", ecran);
  window.location.assign(`${url.pathname}?${url.searchParams.toString()}${url.hash || ""}`);
}

async function postToken(getToken, token) {
  if (!getToken || !token) return;
  const auth = await getToken();
  if (!auth) return;
  await fetch("/api/push-token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${auth}`,
    },
    body: JSON.stringify({ token, platform: "ios" }),
  });
}

/**
 * Enregistre les push iOS (nouvelle campagne + classement).
 * @param {() => Promise<string|null>} getToken
 */
export async function startNativePush(getToken) {
  if (started || !Capacitor.isNativePlatform() || Capacitor.getPlatform() !== "ios") return;
  started = true;
  try {
    const { PushNotifications } = await import("@capacitor/push-notifications");
    await PushNotifications.addListener("registration", (event) => {
      postToken(getToken, event?.value).catch(() => {});
    });
    await PushNotifications.addListener("registrationError", (error) => {
      console.log("push-registration-error", error?.error || error);
    });
    await PushNotifications.addListener("pushNotificationActionPerformed", (event) => {
      const ecran = event?.notification?.data?.ecran;
      if (ecran) openEcran(String(ecran));
    });
    const current = await PushNotifications.checkPermissions();
    let status = current.receive;
    if (status !== "granted") {
      const requested = await PushNotifications.requestPermissions();
      status = requested.receive;
    }
    if (status === "granted") await PushNotifications.register();
  } catch (error) {
    console.log("push-start", String(error?.message || error).slice(0, 120));
    started = false;
  }
}
