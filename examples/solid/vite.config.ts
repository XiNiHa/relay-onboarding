import { defineConfig } from "vite";
import solid from "vite-plugin-solid";
import relay from "vite-plugin-relay-lite";

export default defineConfig({
  envDir: "../..",
  plugins: [solid(), relay({ codegen: false })],
});
