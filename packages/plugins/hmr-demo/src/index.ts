import { Context } from '@deepseek-ai/cordis'
import type {} from '@mini-dsh/host-hmr'
import type {} from '@mini-dsh/plugin-greeter'
import Schema from 'schemastery'
import fs from 'node:fs'
import path from 'node:path'

export interface HmrDemoConfig {
  sampleName?: string
  enableSimulation?: boolean
}

export const Config: Schema<HmrDemoConfig> = Schema.object({
  sampleName: Schema.string().default('Alice').description('演示问候目标用户名'),
  enableSimulation: Schema.boolean().default(true).description('是否自动触发一次 HMR 动态热重载模拟'),
})

export function apply(ctx: Context, config: HmrDemoConfig) {
  ctx.inject(['hmr', 'greeter'], (ctx) => {
    ctx.effect(() => {
      const sampleName = config.sampleName || 'Alice'
      const demoConfigFile = path.resolve(process.cwd(), 'scratch-live-config.json')

      // 1. 写入初始配置文件
      fs.writeFileSync(demoConfigFile, JSON.stringify({ greetingPrefix: 'Initial Prefix (v1)', enthusiasmLevel: 1 }, null, 2))

      console.log('\n' + '='.repeat(60))
      console.log('\x1b[1m\x1b[35m🔥 [HMR & Schemastery Demo] Running Live Hot-Reload Test\x1b[0m')
      console.log('='.repeat(60))
      console.log(`[Before HMR] Initial Greeter Output: "${ctx.greeter.greet(sampleName)}"`)

      // 2. 开启 HMR 监听该配置文件
      const unwatch = ctx.hmr.watchConfig(demoConfigFile, async (filePath) => {
        const content = JSON.parse(fs.readFileSync(filePath, 'utf8'))
        // 动态热更新 greeter 内部状态（无需重启进程）
        ctx.greeter.prefix = content.greetingPrefix
        ctx.greeter.enthusiasm = content.enthusiasmLevel
        console.log(`\x1b[32m[After HMR] Hot-Reloaded Greeter Output:\x1b[0m "${ctx.greeter.greet(sampleName)}"`)
      })

      // 3. 模拟 300ms 后外部写入新配置文件触发 HMR
      let timer: NodeJS.Timeout | null = null
      if (config.enableSimulation) {
        timer = setTimeout(() => {
          console.log(`\n\x1b[33m[Simulated External Editor]\x1b[0m 📝 Modifying "scratch-live-config.json" to v2...`)
          fs.writeFileSync(
            demoConfigFile,
            JSON.stringify({ greetingPrefix: '🔥 Hot-Reloaded Super Greeter (v2)', enthusiasmLevel: 4 }, null, 2)
          )
          setTimeout(() => {
            console.log('\n' + '='.repeat(60))
            console.log('\x1b[32m✔ [HMR Demo] Live Hot-Reload test completed successfully!\x1b[0m')
            console.log('='.repeat(60) + '\n')
            process.exit(0)
          }, 300)
        }, 300)
      }

      return () => {
        if (timer) clearTimeout(timer)
        unwatch()
        try {
          if (fs.existsSync(demoConfigFile)) fs.unlinkSync(demoConfigFile)
        } catch {}
      }
    })
  })
}
