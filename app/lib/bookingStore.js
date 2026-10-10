import { get, put } from "@vercel/blob";

const access = "private";

function bookingPath(userId) {
  return `bookings/${String(userId).replace(/[^a-zA-Z0-9_-]/g, "")}.json`;
}

async function readJson(pathname) {
  const result = await get(pathname, { access, useCache: false });
  if (!result || result.statusCode !== 200) return null;
  const text = await new Response(result.stream).text();
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function readBooking(userId) {
  if (!userId) return null;
  return readJson(bookingPath(userId));
}

export async function saveBooking(booking) {
  await put(bookingPath(booking.userId), JSON.stringify(booking), {
    access,
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
  return booking;
}
