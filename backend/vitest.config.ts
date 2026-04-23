import { defineConfig } from 'vitest/config'
import { readFileSync } from 'fs'
import { resolve } from 'path'

function loadEnvFile (filename: string): Record<string, string> {
  try {
    const content = readFileSync(resolve(__dirname, filename), 'utf-8')
    const env: Record<string, string> = {}
    for (const line of content.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const idx = trimmed.indexOf('=')
      if (idx === -1) continue
      env[trimmed.slice(0, idx)] = trimmed.slice(idx + 1)
    }
    return env
  } catch {
    return {}
  }
}

export default defineConfig({
  css: { postcss: {} },
  test: {
    root: '.',
    env: loadEnvFile('.env.test'),
    testTimeout: 15000
  }
})
