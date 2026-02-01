import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  return {
    server: {
      port: 3000,
      host: "0.0.0.0",
      proxy: {
        "/api": {
          target: "http://localhost:5000",
          changeOrigin: true,
          secure: false,
        },
      },
      hmr: {
        clientPort: 3000,
        port: 3000,
      },
    },
    plugins: [react()],
    optimizeDeps: {
      include: ["react", "react-dom"],
    },
    define: {
      "process.env.API_KEY": JSON.stringify(env.QUBRID_API_KEY),
      "process.env.QUBRID_API_KEY": JSON.stringify(env.QUBRID_API_KEY),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
      dedupe: ["react", "react-dom"],
    },
  };
});
