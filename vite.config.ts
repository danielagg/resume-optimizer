import { readFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

const baseCvPath = fileURLToPath(new URL("./base_cv.json", import.meta.url))

export default defineConfig({
  plugins: [
    react(),
    {
      name: "local-base-cv",
      configureServer(server) {
        server.middlewares.use(
          "/__resume/base-cv",
          async (_request, response) => {
            try {
              const body = await readFile(baseCvPath, "utf8")
              response.statusCode = 200
              response.setHeader("Content-Type", "application/json")
              response.setHeader("Cache-Control", "no-store")
              response.end(body)
            } catch (error) {
              const message =
                error instanceof Error ? error.message : String(error)
              response.statusCode = 500
              response.setHeader("Content-Type", "text/plain; charset=utf-8")
              response.end(`Could not read base_cv.json:\n${message}`)
            }
          }
        )

        server.watcher.add(baseCvPath)
        server.watcher.on("change", (path) => {
          if (path === baseCvPath) server.ws.send({ type: "full-reload" })
        })
      },
    },
  ],
})
