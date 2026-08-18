import { Context, Service } from '@deepseek-ai/cordis'

/** 命令执行的标准结果对象 */
export interface ExecResult {
  stdout: string
  stderr: string
  exitCode: number
  environment: 'local' | 'remote-sandbox'
  durationMs: number
}

// 1. 在 Cordis Context 中声明全局 executor 键
declare module '@deepseek-ai/cordis' {
  interface Context {
    executor: ExecutorService
  }
}

/**
 * ExecutorService（抽象契约 / Service Definition）
 * 
 * 仅定义接口契约与标准模型，不包含具体的平台或环境代码。
 * 具体的提供方（如 LocalExecutor、RemoteSandboxExecutor）继承此类并实现抽象方法。
 */
export abstract class ExecutorService extends Service {
  constructor(ctx: Context) {
    super(ctx, 'executor')
  }

  /**
   * 抽象执行方法：执行单条 Shell 指令并返回标准化结果
   * @param command 要执行的 Shell 命令
   */
  abstract exec(command: string): Promise<ExecResult>
}
