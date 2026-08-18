import { Context, Service } from '@deepseek-ai/cordis'
import type {} from '@mini-dsh/host-webserver'
import type {} from '@mini-dsh/host-client-modules'
import path from 'node:path'

export interface CounterConfig {
  initialCount?: number
}

declare module '@deepseek-ai/cordis' {
  interface Context {
    counter: CounterService
  }
}

export class CounterService extends Service {
  public count: number

  constructor(ctx: Context, config: CounterConfig = {}) {
    super(ctx, 'counter')
    this.count = config.initialCount ?? 0
    console.log(`\x1b[35m[Plugin Counter]\x1b[0m Initialized with start count: ${this.count}`)
  }

  public increment(delta = 1): number {
    this.count += delta
    return this.count
  }

  public get(): number {
    return this.count
  }
}

export function apply(ctx: Context, config?: CounterConfig) {
  // 1. Provide CounterService
  ctx.plugin(CounterService, config)

  // 2. When 'server' and 'counter' are available in context, mount HTTP routes
  ctx.inject(['server', 'counter'], (ctx) => {
    ctx.effect(() => {
      const unRoute = ctx.server.route('/api/count', (req, res) => {
        if (req.method === 'POST') {
          const newCount = ctx.counter.increment(1)
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ count: newCount }))
        } else {
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ count: ctx.counter.get() }))
        }
      })

      console.log('\x1b[35m[Plugin Counter]\x1b[0m Mounted HTTP route /api/count (GET/POST)')

      return () => {
        unRoute()
        console.log('\x1b[35m[Plugin Counter]\x1b[0m Unmounted HTTP route /api/count')
      }
    })
  })

  // 3. When 'clientModules' service is present on host, register its client UI bundle from lib/client.js
  ctx.inject(['clientModules'], (ctx) => {
    ctx.effect(() => {
      const clientPath = path.resolve(process.cwd(), 'packages/plugins/counter/lib/client.js')
      return ctx.clientModules.register('@mini-dsh/plugin-counter', clientPath)
    })
  })
}
