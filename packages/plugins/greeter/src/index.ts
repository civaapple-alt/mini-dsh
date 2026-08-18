import { Context, Service } from '@deepseek-ai/cordis'
import type {} from '@mini-dsh/host-webserver'
import type {} from '@mini-dsh/host-client-modules'
import path from 'node:path'

export interface GreeterConfig {
  greetingPrefix?: string
}

declare module '@deepseek-ai/cordis' {
  interface Context {
    greeter: GreeterService
  }
}

export class GreeterService extends Service {
  public prefix: string

  constructor(ctx: Context, config: GreeterConfig = {}) {
    super(ctx, 'greeter')
    this.prefix = config.greetingPrefix ?? 'Hello from Cordis Greeter'
    console.log(`\x1b[34m[Plugin Greeter]\x1b[0m Initialized with prefix: "${this.prefix}"`)
  }

  public greet(name: string): string {
    return `${this.prefix}, ${name}!`
  }
}

export function apply(ctx: Context, config?: GreeterConfig) {
  // 1. Provide GreeterService
  ctx.plugin(GreeterService, config)

  // 2. When 'server' and 'greeter' are available, mount HTTP API route
  ctx.inject(['server', 'greeter'], (ctx) => {
    ctx.effect(() => {
      const unRoute = ctx.server.route('/api/greet', (req, res) => {
        const url = new URL(req.url ?? '/', `http://${req.headers.host}`)
        const name = url.searchParams.get('name') || 'Guest'
        const message = ctx.greeter.greet(name)

        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ message, timestamp: Date.now() }))
      })
      console.log('\x1b[34m[Plugin Greeter]\x1b[0m Mounted HTTP route GET /api/greet')

      return () => {
        unRoute()
        console.log('\x1b[34m[Plugin Greeter]\x1b[0m Unmounted HTTP route GET /api/greet')
      }
    })
  })

  // 3. When 'clientModules' service is present on host, register its client UI bundle from lib/client.js
  ctx.inject(['clientModules'], (ctx) => {
    ctx.effect(() => {
      const clientPath = path.resolve(process.cwd(), 'packages/plugins/greeter/lib/client.js')
      return ctx.clientModules.register('@mini-dsh/plugin-greeter', clientPath)
    })
  })
}
