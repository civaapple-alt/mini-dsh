import { Context, Service } from '@deepseek-ai/cordis'
import type { ExecResult } from '@mini-dsh/seam-executor'

declare module '@deepseek-ai/cordis' {
  interface Context {
    toolBash: ToolBashService
  }
}

/**
 * ToolBashService (Consumer)
 * 
 * 面向大模型与任务运行器的 Bash 工具。
 * 它完全不知道底层是本地子进程还是云端沙箱，只通过 ctx.executor 契约执行。
 */
export class ToolBashService extends Service {
  static inject = ['executor']

  constructor(ctx: Context) {
    super(ctx, 'toolBash')
    console.log('\x1b[32m[Consumer ToolBash]\x1b[0m Initialized and dynamically bound to `ctx.executor`')
  }

  /**
   * 执行 Bash 命令
   * @param command 命令文本
   */
  public async execute(command: string): Promise<ExecResult> {
    return await this.ctx.executor.exec(command)
  }
}

export function apply(ctx: Context) {
  ctx.inject(['executor'], (ctx) => {
    ctx.plugin(ToolBashService)
  })
}
