import { bindDesktopStoreButtons, isOfficialDesktop } from "./desktopGate.js";

if (isOfficialDesktop()) {
  document.title = "Gemelo — Les yeux rivés sur vous";
  document.getElementById("desktop-css")?.setAttribute("media", "all");
  document.getElementById("desktop-site")?.removeAttribute("hidden");
  document.getElementById("root")?.setAttribute("hidden", "");
  bindDesktopStoreButtons();
} else {
  document.getElementById("desktop-site")?.remove();
  document.getElementById("desktop-css")?.remove();
  import("./boot.jsx");
}
