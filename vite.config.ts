import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { ROUTE_META, canonicalFor } from './src/seo.ts'

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

function replaceOnce(html: string, pattern: RegExp, replacement: string, what: string): string {
  if (!pattern.test(html)) throw new Error(`[static-routes] tag ${what} tidak ditemukan di index.html`)
  return html.replace(pattern, replacement)
}

function withMeta(html: string, path: string): string {
  const meta = ROUTE_META[path]
  const url = canonicalFor(path)
  const tag = (attr: string, key: string, value: string) =>
    (h: string) =>
      replaceOnce(h, new RegExp(`(<meta ${attr}="${key}" content=")[^"]*(")`), `$1${esc(value)}$2`, key)
  const steps = [
    (h: string) => replaceOnce(h, /<title>[^<]*<\/title>/, `<title>${esc(meta.title)}</title>`, 'title'),
    tag('name', 'description', meta.description),
    tag('name', 'robots', meta.index ? 'index,follow' : 'noindex,follow'),
    (h: string) => replaceOnce(h, /(<link rel="canonical" href=")[^"]*(")/, `$1${url}$2`, 'canonical'),
    tag('property', 'og:title', meta.title),
    tag('property', 'og:description', meta.description),
    tag('property', 'og:url', url),
    tag('name', 'twitter:title', meta.title),
    tag('name', 'twitter:description', meta.description),
  ]
  return steps.reduce((h, step) => step(h), html)
}

/**
 * GitHub Pages tidak tahu rute SPA: /edukasi akan dilayani lewat 404.html (status 404,
 * tidak diindeks Google). Plugin ini menulis dist/<rute>/index.html untuk setiap rute
 * dengan title/description/canonical masing-masing, sehingga dilayani dengan status 200.
 */
function staticRoutes(): Plugin {
  let outDir = 'dist'
  return {
    name: 'mochi-static-routes',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir)
    },
    closeBundle() {
      const base = readFileSync(resolve(outDir, 'index.html'), 'utf-8')
      for (const path of Object.keys(ROUTE_META)) {
        const html = withMeta(base, path)
        const dir = path === '/' ? outDir : resolve(outDir, path.slice(1))
        mkdirSync(dir, { recursive: true })
        writeFileSync(resolve(dir, 'index.html'), html)
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), staticRoutes()],
  server: {
    port: 3010,
    strictPort: true
  }
})
