import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { appendFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import glsl from "vite-plugin-glsl";

// https://vite.dev/config/
export default defineConfig(({ command }) => {
  const devTelemetryLog = {
    name: "dev-telemetry-log",
    apply: "serve" as const,
    configureServer(server: import("vite").ViteDevServer) {
      const logPath = resolve(__dirname, "logs", "telemetry.dev.ndjson");
      let writeQueue = Promise.resolve();

      server.middlewares.use("/__dev/telemetry-log", (request, response) => {
        if (request.method !== "POST") {
          response.statusCode = 405;
          response.end();
          return;
        }

        let body = "";
        request.setEncoding("utf8");
        request.on("data", (chunk: string) => {
          body += chunk;
          if (body.length > 1_000_000) request.destroy();
        });
        request.on("end", () => {
          try {
            const entry: unknown = JSON.parse(body);
            if (!entry || typeof entry !== "object") throw new Error("Invalid telemetry entry");

            writeQueue = writeQueue
              .catch(() => undefined)
              .then(async () => {
                await mkdir(dirname(logPath), { recursive: true });
                await appendFile(logPath, `${JSON.stringify(entry)}\n`, "utf8");
              });

            void writeQueue.then(
              () => {
                response.statusCode = 204;
                response.end();
              },
              () => {
                response.statusCode = 500;
                response.end();
              },
            );
          } catch {
            response.statusCode = 400;
            response.end();
          }
        });
      });
    },
  };

  return {
    base: "./",
    plugins: [vue(), glsl(), ...(command === "serve" ? [devTelemetryLog] : [])],
    assetsInclude: ["**/*.glb", "**/*.ogg"],
    resolve: {
      alias: {
        "@": resolve(__dirname, "src"), // @ указывает на папку src
      },
    },
  };
});
