import tls from "node:tls";

function clean(value, limit = 240) {
  return typeof value === "string" ? value.trim().slice(0, limit) : "";
}

export async function sendMail({ to, replyTo, subject, text }) {
  const resendKey = process.env.RESEND_API_KEY;
  const gmailUser = clean(process.env.GMAIL_USER || to, 254);
  const gmailPass = (process.env.GMAIL_APP_PASSWORD || "").replace(/\s+/g, "");
  if (resendKey) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.SMOKE_FROM_EMAIL || "Gemelo <beth.t@example.com>",
        to: [to],
        reply_to: replyTo,
        subject,
        text,
      }),
    });
    if (!response.ok) throw new Error(`resend-${response.status}`);
    return;
  }
  if (!gmailPass) throw new Error("missing-mail-provider");
  await sendGmail({ user: gmailUser, pass: gmailPass, to, replyTo, subject, text });
}

export async function notifyAdmin({ subject, text, replyTo }) {
  const to = clean(process.env.SMOKE_NOTIFY_EMAIL || "", 254);
  if (!to) return false;
  await sendMail({ to, replyTo, subject, text });
  return true;
}

function sendGmail({ user, pass, to, replyTo, subject, text }) {
  const encodedSubject = `=?UTF-8?B?${Buffer.from(subject, "utf8").toString("base64")}?=`;
  const body = text.replace(/\r?\n/g, "\r\n").replace(/^\./gm, "..");
  const payload = [
    `From: Gemelo <${user}>`,
    `To: ${to}`,
    replyTo ? `Reply-To: ${replyTo}` : null,
    `Subject: ${encodedSubject}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: 8bit",
    "",
    body,
    "",
  ].filter((line) => line != null).join("\r\n");

  return new Promise((resolve, reject) => {
    const socket = tls.connect({ host: "smtp.gmail.com", port: 465, servername: "smtp.gmail.com" });
    let buffer = "";
    const pending = [];
    const waiters = [];
    let settled = false;
    const finish = (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      socket.destroy();
      if (error) reject(error);
      else resolve();
    };
    const timer = setTimeout(() => finish(new Error("smtp-timeout")), 15000);
    const takeLine = () => (pending.length ? Promise.resolve(pending.shift()) : new Promise((res) => waiters.push(res)));
    const expect = async (ok, line) => {
      if (line != null) socket.write(`${line}\r\n`);
      const response = await takeLine();
      const code = Number(response.slice(0, 3));
      if (!ok(code)) throw new Error(response.slice(0, 120));
      return response;
    };
    socket.setEncoding("utf8");
    socket.on("data", (chunk) => {
      buffer += chunk;
      let index;
      while ((index = buffer.indexOf("\n")) >= 0) {
        const line = buffer.slice(0, index).replace(/\r$/, "");
        buffer = buffer.slice(index + 1);
        if (!/^\d{3}[ -]/.test(line) || line[3] === "-") continue;
        if (waiters.length) waiters.shift()(line);
        else pending.push(line);
      }
    });
    socket.on("error", (error) => finish(error));
    socket.on("end", () => {
      if (!settled) finish(new Error("smtp-end"));
    });
    (async () => {
      try {
        await expect((code) => code === 220, null);
        await expect((code) => code === 250, "EHLO gemelo.online");
        await expect((code) => code === 334, "AUTH LOGIN");
        await expect((code) => code === 334, Buffer.from(user, "utf8").toString("base64"));
        await expect((code) => code === 235, Buffer.from(pass, "utf8").toString("base64"));
        await expect((code) => code === 250, `MAIL FROM:<${user}>`);
        await expect((code) => code === 250, `RCPT TO:<${to}>`);
        await expect((code) => code === 354, "DATA");
        await expect((code) => code === 250, `${payload}\r\n.`);
        await expect((code) => code === 221, "QUIT");
        finish();
      } catch (error) {
        finish(error);
      }
    })();
  });
}
