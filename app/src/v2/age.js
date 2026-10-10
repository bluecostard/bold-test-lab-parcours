const KEY = "gemelo-age-ok";

export function hasConfirmedAge() {
  try {
    return localStorage.getItem(KEY) === "16";
  } catch {
    return false;
  }
}

export function confirmAge() {
  localStorage.setItem(KEY, "16");
}
