import { defineManifest } from "@crxjs/vite-plugin";
import pkg from "./package.json";

export default defineManifest({
  manifest_version: 3,
  name: "Resonate Breathing",
  version: pkg.version,
  description: "A resonate breathing exercise app for relaxation and focus",
  icons: {
    48: "public/logo.png",
  },
  action: {
    default_icon: {
      48: "public/logo.png",
    },
  },
  background: {
    service_worker: "src/background/index.ts",
    type: "module",
  },
  options_ui: {
    page: "src/floating/index.html",
    open_in_tab: true,
  },
  permissions: ["scripting", "tabs"],
});
