import { Context, Service } from '@deepseek-ai/cordis'
import { watch, type FSWatcher } from 'chokidar'
import Schema from 'schemastery'
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

  constructor(ctx: Context) {
    super(ctx, 'hmr')
    console.log('\x1b[35m[Host HMR]\x1b[0m 🔥 Initialized. Hot Module Replacement & Config watcher active.')
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

  // 2. 如果配置了 watchPaths，自动开启监听
  if (config?.watchPaths && config.watchPaths.length > 0) {
    ctx.inject(['hmr'], (ctx) => {
      ctx.effect(() => {
        const disposers = config.watchPaths!.map((watchPath) => {
          return ctx.hmr.watchConfig(watchPath, (changed) => {
            console.log(`[Host HMR Auto-Watch] File changed: ${changed}`)
          })
        })

        return () => {
          disposers.forEach((d) => d())
        }
      })
    })
  }
}
