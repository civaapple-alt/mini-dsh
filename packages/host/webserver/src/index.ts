import { Context, Service } from '@deepseek-ai/cordis'
import http from 'node:http'

export interface RouteHandler {
  (req: http.IncomingMessage, res: http.ServerResponse): void | Promise<void>
}

declare module '@deepseek-ai/cordis' {
  interface Context {
    server: WebServerService
  }
}

export interface WebServerConfig {
  port?: number
}

export class WebServerService extends Service {
  private server: http.Server
  private routes = new Map<string, RouteHandler>()
  public port: number

  constructor(ctx: Context, config: WebServerConfig = {}) {
    super(ctx, 'server')
    this.port = config.port ?? 3000
    this.server = http.createServer((req, res) => this.handle(req, res))

    ctx.effect(() => {
      this.server.listen(this.port, () => {
        console.log(`\x1b[32m[Host WebServer]\x1b[0m Listening on http://localhost:${this.port}`)
      })
      return () => {
        this.server.close()
        console.log('\x1b[33m[Host WebServer]\x1b[0m Stopped')
      }
    })
  }

  public route(path: string, handler: RouteHandler): () => void {
    this.routes.set(path, handler)
    return () => this.routes.delete(path)
  }

  private async handle(req: http.IncomingMessage, res: http.ServerResponse) {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

    if (req.method === 'OPTIONS') {
      res.writeHead(204)
      res.end()
      return
    }

    const url = req.url?.split('?')[0] || '/'
    const handler = this.routes.get(url)
    if (handler) {
      try {
        await handler(req, res)
      } catch (err: any) {
        res.writeHead(500, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: err?.message ?? String(err) }))
      }
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' })
      res.end(`Not Found: ${url}`)
    }
  }
}

export function apply(ctx: Context, config?: WebServerConfig) {
  ctx.plugin(WebServerService, config)
}
