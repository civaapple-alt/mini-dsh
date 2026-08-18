import { Context, Service } from '@deepseek-ai/cordis'
import type {} from '@mini-dsh/host-webserver'
import { watch, type FSWatcher } from 'chokidar'
import Schema from 'schemastery'
import http from 'node:http'
import path from 'node:path'

export interface HmrConfig {
  watchPaths?: string[]
  ignored?: string[]
}

export const Config: Schema<HmrConfig> = Schema.object({
  watchPaths: Schema.array(Schema.string()).default([]).description('需要监听热重载的文件或目录路径列表'),
  ignored: Schema.array(Schema.string()).default(['**/node_modules/**', '**/.git/**']).description('忽略的文件模式'),
})

declare module '@deepseek-ai/cordis' {
  interface Context {
    hmr: HmrService
  }
  interface Events {
    'hmr/change'(filePath: string): void
    'hmr/reload'(target: string): void
  }
}

export class HmrService extends Service {
  private watchers = new Map<string, FSWatcher>()
  private sseClients = new Set<http.ServerResponse>()

  constructor(ctx: Context) {
    super(ctx, 'hmr')
    console.log('\x1b[35m[Host HMR]\x1b[0m 🔥 Initialized. Hot Module Replacement & SSE Stream active.')
  }

  /**
   * 注册 Web 端 SSE 客户端连接
   */
  public addClient(res: http.ServerResponse): void {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    })

    res.write(`data: ${JSON.stringify({ type: 'connected', timestamp: Date.now() })}\n\n`)
    this.sseClients.add(res)
    console.log(`\x1b[35m[Host HMR]\x1b[0m 🔌 Browser Web client connected to HMR SSE stream (Total: ${this.sseClients.size})`)

    res.on('close', () => {
      this.sseClients.delete(res)
      console.log(`\x1b[35m[Host HMR]\x1b[0m 🔌 Browser Web client disconnected (Remaining: ${this.sseClients.size})`)
    })
  }

  /**
   * 向所有连接的浏览器客户端广播插件热重载指令
   */
  public broadcastReload(pluginId: string): void {
    const payload = {
      type: 'reload',
      id: pluginId,
      url: `/plugins/${pluginId}/client.js?t=${Date.now()}`,
      timestamp: Date.now(),
    }

    const sseMessage = `data: ${JSON.stringify(payload)}\n\n`
    for (const client of this.sseClients) {
      try {
        client.write(sseMessage)
      } catch {
        this.sseClients.delete(client)
      }
    }

    console.log(`\x1b[35m[Host HMR]\x1b[0m 📡 Broadcasted client reload for "\x1b[1m${pluginId}\x1b[0m" to ${this.sseClients.size} web client(s)`)
  }

  /**
   * 监听指定配置文件并在变更时触发热重载
   */
  public watchConfig(targetPath: string, onReload: (filePath: string) => Promise<void> | void): () => void {
    const fullPath = path.resolve(process.cwd(), targetPath)
    console.log(`\x1b[35m[Host HMR]\x1b[0m 👁️  Watching for live config changes: "${targetPath}"`)

    const watcher = watch(fullPath, {
      ignoreInitial: true,
      persistent: true,
    })

    let debounceTimer: NodeJS.Timeout | null = null

    watcher.on('change', (changedPath) => {
      if (debounceTimer) clearTimeout(debounceTimer)
      debounceTimer = setTimeout(async () => {
        console.log(`\n\x1b[35m[Host HMR]\x1b[0m 🔥 Detected change in \x1b[1m"${changedPath}"\x1b[0m! Triggering live reload...`)
        this.ctx.emit('hmr/change', changedPath)
        try {
          await onReload(changedPath)
          this.ctx.emit('hmr/reload', changedPath)
          console.log(`\x1b[32m[Host HMR]\x1b[0m ✨ Live reload complete for "${changedPath}".`)
        } catch (err: any) {
          console.error(`\x1b[31m[Host HMR Error]\x1b[0m Reload failed for "${changedPath}":`, err.message)
        }
      }, 100)
    })

    this.watchers.set(fullPath, watcher)

    const disposer = () => {
      watcher.close()
      this.watchers.delete(fullPath)
      console.log(`\x1b[35m[Host HMR]\x1b[0m Stopped watching: "${targetPath}"`)
    }

    return disposer
  }
}

export function apply(ctx: Context, config?: HmrConfig) {
  // 1. 注册 HmrService
  ctx.plugin(HmrService)

  // 2. 当 WebServer 可用时，挂载 SSE 路由与手动触发 API，并监听 client bundle
  ctx.inject(['server', 'hmr'], (ctx) => {
    ctx.effect(() => {
      // SSE 订阅端点
      const unRouteSse = ctx.server.route('/api/hmr/events', (req, res) => {
        ctx.hmr.addClient(res)
      })

      // 手动触发 Client HMR 热重载接口 (用于 Web UI 按钮或 curl)
      const unRouteTrigger = ctx.server.route('/api/hmr/trigger', (req, res) => {
        const url = new URL(req.url ?? '/', `http://${req.headers.host}`)
        const plugin = url.searchParams.get('plugin') || '@mini-dsh/plugin-greeter'
        ctx.hmr.broadcastReload(plugin)

        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ success: true, reloadedPlugin: plugin, timestamp: Date.now() }))
      })

      // 监听 packages/plugins/*/lib/client.js 变动
      const clientBundlesGlob = path.resolve(process.cwd(), 'packages/plugins/*/lib/client.js')
      const watcher = watch(clientBundlesGlob, { ignoreInitial: true })

      watcher.on('change', (filePath) => {
        // 从路径提取插件名，如 packages/plugins/greeter/lib/client.js -> @mini-dsh/plugin-greeter
        const match = filePath.match(/packages[\\/]plugins[\\/]([^\\/]+)[\\/]lib[\\/]client\.js/)
        if (match && match[1]) {
          const pluginId = `@mini-dsh/plugin-${match[1]}`
          ctx.hmr.broadcastReload(pluginId)
        }
      })

      return () => {
        unRouteSse()
        unRouteTrigger()
        watcher.close()
      }
    })
  })
}
