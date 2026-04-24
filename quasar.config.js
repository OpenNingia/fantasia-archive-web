/* eslint-env node */
import { configure } from "quasar/wrappers"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))

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
        // PouchDB expects Node.js `global` — polyfill it for browser builds
        viteConf.define = { ...(viteConf.define || {}), global: "globalThis" }
        viteConf.resolve = viteConf.resolve || {}
        viteConf.resolve.alias = {
          ...(viteConf.resolve.alias || {}),
          // Use browser-only build of PouchDB — avoids Node.js fs/leveldb adapters
          pouchdb: resolve(__dirname, "node_modules/pouchdb-browser/lib/index.js"),
          electron: resolve(__dirname, "src/electronStub.ts"),
          // ExportProject.vue still uses these Node.js modules — stub them until Phase 6 rewrites it
          "fs-extra": resolve(__dirname, "src/shims/node-stub.ts"),
          request: resolve(__dirname, "src/shims/node-stub.ts"),
          // vue-property-decorator@9 has broken interop with vue-class-component@8 — use shim
          "vue-property-decorator": resolve(__dirname, "src/shims/vue-property-decorator.ts")
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
      workboxMode: "generateSW",
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

