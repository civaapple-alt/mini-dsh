import { Context, Service } from '@deepseek-ai/cordis'
import type {} from '@mini-dsh/host-webserver'
import fs from 'node:fs'
import path from 'node:path'
import yaml from 'js-yaml'

export interface SessionPreset {
  persona: string
  tools: string[]
}

export interface Session {
  id: string
  presetName: string
  persona: string
  tools: string[]
  sessionCtx: Context
  createdAt: number
}

export interface SessionInfo {
  id: string
  presetName: string
  persona: string
  tools: string[]
  createdAt: number
}

declare module '@deepseek-ai/cordis' {
  interface Context {
    sessions: SessionManagerService
  }
}

export class SessionManagerService extends Service {
  private sessions = new Map<string, Session>()
  private presetsDir: string

  constructor(ctx: Context) {
    super(ctx, 'sessions')
    this.presetsDir = path.resolve(process.cwd(), 'presets')
    console.log(`\x1b[36m[Host SessionManager]\x1b[0m Initialized. Presets directory: "${this.presetsDir}"`)
  }

  /**
   * 列出所有可用的 Preset 预设文件
   */
  public listPresets(): Array<{ name: string; preset: SessionPreset }> {
    if (!fs.existsSync(this.presetsDir)) return []
    const files = fs.readdirSync(this.presetsDir).filter((f) => f.endsWith('.yml') || f.endsWith('.yaml'))
    return files.map((file) => {
      const name = file.replace(/\.ya?ml$/, '')
      const content = fs.readFileSync(path.join(this.presetsDir, file), 'utf8')
      const preset = yaml.load(content) as SessionPreset
      return { name, preset }
    })
  }

  /**
   * 动态创建一个按 Preset 隔离的会话
   * @param sessionId 会话唯一标识
   * @param presetName 预设名称（默认 standard）
   */
  public async createSession(sessionId: string, presetName: string = 'standard'): Promise<Session> {
    const presetPath = path.join(this.presetsDir, `${presetName}.yml`)
    if (!fs.existsSync(presetPath)) {
      throw new Error(`Preset "${presetName}" not found at ${presetPath}`)
    }

    const presetContent = fs.readFileSync(presetPath, 'utf8')
    const presetConfig = yaml.load(presetContent) as SessionPreset

    // 1. 核心：从根 Context 派生一个子 Context 并对会话级服务做 isolate 隔离
    // 确保当前 Session 挂载的工具服务不会泄漏回根 Context 或污染其他并发 Session
    const sessionCtx = this.ctx.isolate('counter').isolate('greeter').isolate('toolBash')

    // 2. 将 Preset 声明的工具插件装配到该会话的子 Context 中
    for (const toolName of presetConfig.tools) {
      try {
        const toolMod = await import(toolName)
        await sessionCtx.plugin(toolMod)
      } catch (err: any) {
        console.error(`[SessionManager] Failed to load tool "${toolName}" for session ${sessionId}:`, err.message)
      }
    }

    const session: Session = {
      id: sessionId,
      presetName,
      persona: presetConfig.persona,
      tools: presetConfig.tools,
      sessionCtx,
      createdAt: Date.now(),
    }

    this.sessions.set(sessionId, session)
    console.log(
      `\x1b[36m[SessionManager]\x1b[0m 🌟 Created Session \x1b[1m"${sessionId}"\x1b[0m using Preset \x1b[32m"${presetName}"\x1b[0m (Tools: ${presetConfig.tools.length})`
    )
    return session
  }

  public getSession(id: string): Session | undefined {
    return this.sessions.get(id)
  }

  public listSessions(): SessionInfo[] {
    return Array.from(this.sessions.values()).map(({ id, presetName, persona, tools, createdAt }) => ({
      id,
      presetName,
      persona,
      tools,
      createdAt,
    }))
  }
}

export function apply(ctx: Context) {
  // 1. 挂载 SessionManagerService
  ctx.plugin(SessionManagerService)

  // 2. 当 WebServer 存在时，挂载 Session 管理的 HTTP REST API
  ctx.inject(['server', 'sessions'], (ctx) => {
    ctx.effect(() => {
      // 获取可用预设列表
      const unPresets = ctx.server.route('/api/presets', (_req, res) => {
        const presets = ctx.sessions.listPresets()
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify(presets))
      })

      // 列出所有活跃会话
      const unList = ctx.server.route('/api/sessions', (_req, res) => {
        const sessions = ctx.sessions.listSessions()
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify(sessions))
      })

      // 创建会话
      const unCreate = ctx.server.route('/api/sessions/create', async (req, res) => {
        if (req.method === 'POST') {
          let body = ''
          req.on('data', (chunk) => (body += chunk))
          req.on('end', async () => {
            try {
              const data = body ? JSON.parse(body) : {}
              const sessionId = data.id || `session-${Date.now().toString(36)}`
              const preset = data.preset || 'standard'
              const session = await ctx.sessions.createSession(sessionId, preset)
              res.writeHead(200, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({
                id: session.id,
                presetName: session.presetName,
                persona: session.persona,
                tools: session.tools,
              }))
            } catch (err: any) {
              res.writeHead(400, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ error: err.message }))
            }
          })
        }
      })

      console.log('\x1b[36m[Host SessionManager]\x1b[0m Mounted HTTP APIs: /api/presets, /api/sessions, /api/sessions/create')

      return () => {
        unPresets()
        unList()
        unCreate()
      }
    })
  })
}
