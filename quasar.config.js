/* eslint-env node */
import { configure } from "quasar/wrappers"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"
import { execSync } from "child_process"
import { readFileSync, existsSync } from "fs"

const __dirname = dirname(fileURLToPath(import.meta.url))

// Resolve APP_VERSION/BUILD_DATE in this priority order:
//   1. .app-version.json — written by the Dockerfile pre-build (Portainer/Docker case)
//   2. live `git` invocation — the developer's host during `npm run dev`/`build`
//   3. "unknown" / now() fallback — should not happen in practice
function gitOutput (cmd) {
  try {
    return execSync(cmd, { stdio: ["ignore", "pipe", "ignore"] }).toString().trim()
  } catch {
    return null
  }
}

function readVersionFile () {
  const path = resolve(__dirname, ".app-version.json")
  if (!existsSync(path)) return null
  try {
    return JSON.parse(readFileSync(path, "utf8"))
  } catch {
    return null
  }
}

const stamped = readVersionFile()
const APP_VERSION = stamped?.version ?? gitOutput("git rev-parse --short HEAD") ?? "unknown"
const BUILD_DATE = stamped?.date ?? gitOutput("git log -1 --format=%cI") ?? new Date().toISOString()

export default configure(function (/* ctx */) {
  return {
    boot: [
      "pinia",
      "i18n",
      "axios",
      "notify-defaults",
      "apex",
      "auth"
    ],

    css: ["app.scss"],

    extras: [
      "mdi-v5",
      "fontawesome-v5",
      "roboto-font-latin-ext",
      "material-icons"
    ],

    build: {
      target: {
        browser: ["es2019", "edge88", "firefox78", "chrome87", "safari13.1"],
        node: "node20"
      },
      vueRouterMode: "history",
      env: {
        API_URL: process.env.API_URL || ""
      },
      extendViteConf (viteConf) {
        // PouchDB expects Node.js `global` — polyfill it for browser builds.
        // __APP_VERSION__/__BUILD_DATE__ surface the git SHA + commit date in the UI.
        viteConf.define = {
          ...(viteConf.define || {}),
          global: "globalThis",
          __APP_VERSION__: JSON.stringify(APP_VERSION),
          __BUILD_DATE__: JSON.stringify(BUILD_DATE)
        }
        viteConf.resolve = viteConf.resolve || {}
        viteConf.resolve.alias = {
          ...(viteConf.resolve.alias || {}),
          // Use browser-only build of PouchDB — avoids Node.js fs/leveldb adapters
          pouchdb: resolve(__dirname, "node_modules/pouchdb-browser/lib/index.js"),
          // ExportProject.vue still uses these Node.js modules — stub them until Phase 6 rewrites it
          "fs-extra": resolve(__dirname, "src/shims/node-stub.ts"),
          request: resolve(__dirname, "src/shims/node-stub.ts"),
        }
        // Handle .md files as raw string imports (replaces @quasar/qmarkdown extension)
        viteConf.plugins = viteConf.plugins || []
        viteConf.plugins.push({
          name: "vite-plugin-md-raw",
          transform (code, id) {
            if (id.endsWith(".md")) {
              const escaped = JSON.stringify(code)
              return `export default ${escaped}`
            }
          }
        })
      }
    },

    devServer: {
      https: false,
      port: 9000,
      open: true,
      proxy: {
        "/api": "http://localhost:3000",
        "/auth": "http://localhost:3000",
        "/files": "http://localhost:3000"
      }
    },

    framework: {
      iconSet: "material-icons",
      lang: "en-US",
      config: {},
      plugins: ["AppFullscreen", "Notify"]
    },

    animations: "all",

    pwa: {
      workboxMode: "GenerateSW",
      extendGenerateSWOptions (cfg) {
        cfg.runtimeCaching = [
          {
            urlPattern: /^\/api\//,
            handler: "NetworkOnly"
          },
          {
            urlPattern: /^\/auth\//,
            handler: "NetworkOnly"
          }
        ]
      },
      manifest: {
        name: "Fantasia Archive",
        short_name: "Fantasia Archive",
        description: "A database manager for world building",
        display: "standalone",
        orientation: "portrait",
        background_color: "#1b333e",
        theme_color: "#ffd673",
        icons: [
          { src: "icons/icon-128x128.png", sizes: "128x128", type: "image/png" },
          { src: "icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/icon-256x256.png", sizes: "256x256", type: "image/png" },
          { src: "icons/icon-384x384.png", sizes: "384x384", type: "image/png" },
          { src: "icons/icon-512x512.png", sizes: "512x512", type: "image/png" }
        ]
      }
    }
  }
})

