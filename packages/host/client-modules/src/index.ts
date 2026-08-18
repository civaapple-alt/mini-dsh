import { Context, Service } from '@deepseek-ai/cordis'
import type {} from '@mini-dsh/host-webserver'
import fs from 'node:fs'
import path from 'node:path'

export interface ClientModuleEntry {
  id: string
  url: string
  clientPath: string
}

export interface BootGraph {
  modules: { id: string; url: string }[]
}

declare module '@deepseek-ai/cordis' {
  interface Context {
    clientModules: ClientModuleService
  }
}

export class ClientModuleService extends Service {
  public static readonly inject = ['server']
  private modules = new Map<string, ClientModuleEntry>()

  constructor(ctx: Context) {
    super(ctx, 'clientModules')

    ctx.effect(() => {
      // 1. Serve HTML index page with dynamically injected window.__MINI_BOOT__
      const unRouteRoot = ctx.server.route('/', (req, res) => this.handleIndex(req, res))
      const unRouteHtml = ctx.server.route('/index.html', (req, res) => this.handleIndex(req, res))

      // 2. Serve API endpoint for runtime plugin discovery
      const unRouteApi = ctx.server.route('/api/plugins', (req, res) => {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify(this.getBootGraph(), null, 2))
      })

      // 3. Serve Client Shell Bundle
      const shellPath = path.resolve(process.cwd(), 'packages/client/shell/lib/index.js')
      const unRouteShell = ctx.server.route('/lib/client-shell.js', (req, res) => {
        if (fs.existsSync(shellPath)) {
          res.writeHead(200, {
            'Content-Type': 'application/javascript; charset=utf-8',
            'Cache-Control': 'no-cache'
          })
          res.end(fs.readFileSync(shellPath, 'utf8'))
        } else {
          res.writeHead(404, { 'Content-Type': 'text/plain' })
          res.end(`Client shell bundle not built yet. Expected at ${shellPath}`)
        }
      })

      return () => {
        unRouteRoot()
        unRouteHtml()
        unRouteApi()
        unRouteShell()
      }
    })
  }

  /**
   * Dynamically register an active plugin's client bundle.
   * Returns a disposer function for clean unregistration.
   */
  public register(id: string, clientPath: string): () => void {
    const entry: ClientModuleEntry = {
      id,
      url: `/plugins/${id}/client.js`,
      clientPath
    }
    this.modules.set(id, entry)
    console.log(`\x1b[32m[Client Modules]\x1b[0m Registered active client plugin: ${id}`)

    // Register dynamic route for this plugin's bundle
    const unRoute = this.ctx.server.route(`/plugins/${id}/client.js`, (req, res) => {
      if (fs.existsSync(clientPath)) {
        res.writeHead(200, {
          'Content-Type': 'application/javascript; charset=utf-8',
          'Cache-Control': 'no-cache'
        })
        res.end(fs.readFileSync(clientPath, 'utf8'))
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' })
        res.end(`Client bundle not built yet for ${id}. Expected at ${clientPath}`)
      }
    })

    return () => {
      this.modules.delete(id)
      unRoute()
      console.log(`\x1b[33m[Client Modules]\x1b[0m Unregistered client plugin: ${id}`)
    }
  }

  public getBootGraph(): BootGraph {
    return {
      modules: Array.from(this.modules.values()).map(m => ({ id: m.id, url: m.url }))
    }
  }

  private handleIndex(req: any, res: any) {
    const bootGraphJson = JSON.stringify(this.getBootGraph())
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Mini-DSH | Everything is a Plugin</title>
  <style>
    :root {
      --bg: #0f172a;
      --panel-bg: #1e293b;
      --text: #f8fafc;
      --text-muted: #94a3b8;
      --primary: #3b82f6;
      --primary-hover: #2563eb;
      --border: #334155;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    header {
      padding: 1rem 2rem;
      background: var(--panel-bg);
      border-bottom: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    header h1 { font-size: 1.25rem; font-weight: 700; color: #60a5fa; }
    .badge {
      font-size: 0.75rem;
      background: #1e3a8a;
      color: #93c5fd;
      padding: 0.25rem 0.6rem;
      border-radius: 9999px;
      border: 1px solid #3b82f6;
    }
    .layout {
      flex: 1;
      display: grid;
      grid-template-columns: 320px 1fr;
      height: calc(100vh - 65px);
    }
    aside {
      background: #111827;
      border-right: 1px solid var(--border);
      padding: 1.5rem;
      overflow-y: auto;
    }
    main {
      padding: 2rem;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .section-title {
      font-size: 0.875rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
      margin-bottom: 1rem;
    }
    .slot-container {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .card {
      background: var(--panel-bg);
      border: 1px solid var(--border);
      border-radius: 0.5rem;
      padding: 1.25rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    .card h3 {
      font-size: 1.1rem;
      margin-bottom: 0.5rem;
      color: #38bdf8;
    }
    button {
      background: var(--primary);
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 0.375rem;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s;
    }
    button:hover { background: var(--primary-hover); }
    input {
      background: #0f172a;
      border: 1px solid var(--border);
      color: var(--text);
      padding: 0.5rem;
      border-radius: 0.375rem;
      margin-right: 0.5rem;
    }
  </style>
  <script>
    window.__MINI_BOOT__ = ${bootGraphJson};
  </script>
</head>
<body>
  <header>
    <div>
      <h1>Mini-DSH Web Shell</h1>
      <small style="color: var(--text-muted);">Cordis "Everything is a Plugin" Demonstration</small>
    </div>
    <div id="slot-header" class="slot-container">
      <span class="badge">Cordis Container Initializing...</span>
    </div>
  </header>
  <div class="layout">
    <aside>
      <div class="section-title">Sidebar Slot (<code>sidebar.widgets</code>)</div>
      <div id="slot-sidebar-widgets" class="slot-container">
        <div style="color: var(--text-muted); font-size: 0.875rem;">Waiting for plugins to mount...</div>
      </div>

      <div class="card" style="margin-top: 1.5rem; background: #182234; border: 1px solid #3b82f6;">
        <h3 style="color: #60a5fa; font-size: 0.95rem; margin-bottom: 0.5rem;">🔥 Web HMR Control</h3>
        <div id="hmr-status-indicator" style="font-size: 0.75rem; margin-bottom: 0.75rem;">
          <span style="color: #94a3b8;">Connecting to SSE...</span>
        </div>
        <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.75rem;">
          点击下方按钮模拟修改前端 Bundle 并通过 SSE 触发客户端组件热替换（无需刷新浏览器）：
        </p>
        <div style="display: flex; flex-direction: column; gap: 0.5rem;">
          <button onclick="fetch('/api/hmr/trigger?plugin=@mini-dsh/plugin-greeter', {method:'POST'})" style="background: #2563eb; font-size: 0.8rem; padding: 0.4rem 0.6rem;">
            ⚡ 触发 Greeter 卡片热重载
          </button>
          <button onclick="fetch('/api/hmr/trigger?plugin=@mini-dsh/plugin-counter', {method:'POST'})" style="background: #0d9488; font-size: 0.8rem; padding: 0.4rem 0.6rem;">
            ⚡ 触发 Counter 组件热重载
          </button>
        </div>
      </div>
    </aside>
    <main>
      <div class="section-title">Main Content Slot (<code>main.cards</code>)</div>
      <div id="slot-main-cards" class="slot-container">
        <div style="color: var(--text-muted); font-size: 0.875rem;">Waiting for plugins to mount...</div>
      </div>
    </main>
  </div>

  <!-- Boot Client Shell from /lib/client-shell.js -->
  <script type="module" src="/lib/client-shell.js"></script>
</body>
</html>`
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
    res.end(html)
  }
}

export function apply(ctx: Context) {
  ctx.plugin(ClientModuleService)
}
