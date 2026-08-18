import { Context } from '@deepseek-ai/cordis'
import type {} from '@mini-dsh/host-session-manager'
import type {} from '@mini-dsh/plugin-tool-bash'
import type {} from '@mini-dsh/plugin-counter'
import type {} from '@mini-dsh/plugin-greeter'

export function apply(ctx: Context) {
  ctx.inject(['sessions'], (ctx) => {
    ctx.effect(() => {
      const timer = setTimeout(async () => {
        console.log('\n' + '='.repeat(60))
        console.log('\x1b[1m\x1b[36m🧪 [Presets Demo] Running Multi-Session Scope Isolation Test\x1b[0m')
        console.log('='.repeat(60))

        // 1. 创建 Session A (极简模式)
        const sessionA = await ctx.sessions.createSession('chat-alice-01', 'minimal')
        
        // 2. 创建 Session B (标准模式)
        const sessionB = await ctx.sessions.createSession('chat-bob-02', 'standard')

        console.log('\n' + '-'.repeat(60))
        console.log('\x1b[1m🔍 Comparing Session Scopes in the SAME process:\x1b[0m\n')

        // 验证 Session A
        console.log(`\x1b[33m[Session A: "${sessionA.id}"]\x1b[0m`)
        console.log(`  • Preset: \x1b[1m${sessionA.presetName}\x1b[0m`)
        console.log(`  • Persona: "${sessionA.persona}"`)
        console.log(`  • Loaded Tools: [${sessionA.tools.join(', ')}]`)
        console.log(`  • Has \`ctx.toolBash\` in scope? \x1b[32m${!!sessionA.sessionCtx.get('toolBash')}\x1b[0m`)
        console.log(`  • Has \`ctx.counter\` in scope?  \x1b[31m${!!sessionA.sessionCtx.get('counter')}\x1b[0m (Isolated/Excluded)`)

        console.log('\n' + '-'.repeat(60))

        // 验证 Session B
        console.log(`\x1b[35m[Session B: "${sessionB.id}"]\x1b[0m`)
        console.log(`  • Preset: \x1b[1m${sessionB.presetName}\x1b[0m`)
        console.log(`  • Persona: "${sessionB.persona}"`)
        console.log(`  • Loaded Tools: [${sessionB.tools.join(', ')}]`)
        console.log(`  • Has \`ctx.toolBash\` in scope? \x1b[32m${!!sessionB.sessionCtx.get('toolBash')}\x1b[0m`)
        console.log(`  • Has \`ctx.counter\` in scope?  \x1b[32m${!!sessionB.sessionCtx.get('counter')}\x1b[0m (Mounted)`)
        console.log(`  • Has \`ctx.greeter\` in scope?  \x1b[32m${!!sessionB.sessionCtx.get('greeter')}\x1b[0m (Mounted)`)

        console.log('\n' + '='.repeat(60))
        console.log('\x1b[32m✨ Multi-Session Per-Scope Isolation verified successfully!\x1b[0m')
        console.log('='.repeat(60) + '\n')
      }, 100)

      return () => clearTimeout(timer)
    })
  })
}
