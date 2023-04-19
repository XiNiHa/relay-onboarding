import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import relay from "vite-plugin-relay";
import rescript from "@jihchi/vite-plugin-rescript"

export default defineConfig({
  plugins: [react(), relay, rescript()],
});
