import { sendApnsPush, apnsConfigured } from "./apns.js";
import { listPushDevicesForUsers } from "./pushStore.js";

/**
 * Push téléphone pour les destinataires (même opt-in que les e-mails facultatifs).
 */
export async function pushToRecipients(recipients, { title, body, ecran }) {
  if (!apnsConfigured() || !recipients?.length) return { sent: 0, skipped: true };
  const devices = await listPushDevicesForUsers(recipients.map((entry) => entry.userId));
  let sent = 0;
  for (const device of devices) {
    if (device.platform && device.platform !== "ios") continue;
    try {
      const result = await sendApnsPush({
        token: device.token,
        title,
        body,
        ecran,
      });
      if (result.sent) sent += 1;
    } catch (error) {
      console.log("push-send", String(error?.message || error).slice(0, 120));
    }
  }
  return { sent, skipped: false };
}
