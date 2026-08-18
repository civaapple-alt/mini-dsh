import { Context } from '@deepseek-ai/cordis'
import { ExecutorService, ExecResult } from '@mini-dsh/seam-executor'
import { exec as nodeExec } from 'node:child_process'
import { promisify } from 'node:util'

const execAsync = promisify(nodeExec)

export interface LocalExecutorConfig {
  cwd?: string
  timeout?: number
}

/**
 * LocalExecutor (Service Provider)
 * 
 * 在本地宿主机环境中直接通过 Node.js 子进程执行命令。
 */
export class LocalExecutor extends ExecutorService {
  private cwd: string
  private timeout: number

  constructor(ctx: Context, config: LocalExecutorConfig = {}) {
    super(ctx)
    this.cwd = config.cwd ?? process.cwd()
    this.timeout = config.timeout ?? 10000
    console.log(`\x1b[34m[Provider LocalExecutor]\x1b[0m Initialized (cwd: "${this.cwd}")`)
  }

  async exec(command: string): Promise<ExecResult> {
    const startTime = Date.now()
    console.log(`\x1b[34m[Local Host Process]\x1b[0m 🖥️  Executing: "${command}"`)
    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd: this.cwd,
        timeout: this.timeout,
      })
      const durationMs = Date.now() - startTime
      return {
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        exitCode: 0,
        environment: 'local',
        durationMs,
      }
    } catch (err: any) {
      const durationMs = Date.now() - startTime
      return {
        stdout: err.stdout?.trim() ?? '',
        stderr: err.stderr?.trim() ?? err.message,
        exitCode: err.code ?? 1,
        environment: 'local',
        durationMs,
      }
    }
  }
}

export function apply(ctx: Context, config?: LocalExecutorConfig) {
  ctx.plugin(LocalExecutor, config)
}
