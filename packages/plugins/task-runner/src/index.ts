import { Context, Service } from '@deepseek-ai/cordis'
import type {} from '@mini-dsh/plugin-greeter'
import type {} from '@mini-dsh/plugin-counter'
import type {} from '@mini-dsh/seam-executor'

export interface TaskRunnerConfig {
  /** 任务名称 */
  taskName?: string
  /** 目标用户 */
  targetUser?: string
  /** 步数/迭代轮次 */
  iterations?: number
  /** 启动时是否自动执行任务 */
  autoRun?: boolean
  /** 执行完成后是否自动退出进程（常用于 CI/Headless 批量任务） */
  exitOnComplete?: boolean
  /** 可选执行的 Shell 指令（测试 Capability Seam 执行器） */
  shellCommand?: string
}

export interface TaskStepEvent {
  step: number
  total: number
  description: string
  timestamp: number
}

export interface TaskCompleteEvent {
  taskName: string
  durationMs: number
  stepsCompleted: number
  finalCount: number
}

declare module '@deepseek-ai/cordis' {
  interface Context {
    taskRunner: TaskRunnerService
  }
  interface Events {
    'task/start': (taskName: string) => void
    'task/step': (event: TaskStepEvent) => void
    'task/complete': (event: TaskCompleteEvent) => void
  }
}

export class TaskRunnerService extends Service {
  private config: TaskRunnerConfig

  constructor(ctx: Context, config: TaskRunnerConfig = {}) {
    super(ctx, 'taskRunner')
    this.config = {
      taskName: config.taskName ?? 'Automated Workflow Job',
      targetUser: config.targetUser ?? 'Headless Runner',
      iterations: config.iterations ?? 3,
      autoRun: config.autoRun ?? true,
      exitOnComplete: config.exitOnComplete ?? false,
      shellCommand: config.shellCommand ?? 'node -v',
    }
    console.log(`\x1b[32m[Plugin TaskRunner]\x1b[0m Initialized. Configured task: "${this.config.taskName}"`)
  }

  /**
   * 执行一个结构化的多步骤 Headless 任务
   */
  public async runTask(customName?: string, options?: Partial<TaskRunnerConfig>): Promise<TaskCompleteEvent> {
    const taskName = customName || this.config.taskName!
    const targetUser = options?.targetUser || this.config.targetUser!
    const iterations = options?.iterations ?? this.config.iterations!
    const shellCommand = options?.shellCommand ?? this.config.shellCommand!
    const hasExecutor = !!this.ctx.root.executor
    const totalSteps = iterations + (hasExecutor ? 2 : 1)
    const startTime = Date.now()

    console.log('\n' + '='.repeat(55))
    console.log(`\x1b[1m\x1b[32m▶ [TaskRunner] Starting Task: "${taskName}"\x1b[0m`)
    console.log('='.repeat(55))

    // 1. 触发 task/start 事件并初始化 Goal 领域（若存在）
    this.ctx.emit('task/start', taskName)
    const goals = (this.ctx.root as any).goals
    if (goals) {
      goals.createGoal(taskName, taskName)
    }

    let currentStepIndex = 1

    // 2. 步骤 1: 调用 greeter 服务进行初始化（若可用）
    const greeter = this.ctx.root.greeter
    const step1Msg = greeter 
      ? greeter.greet(targetUser) 
      : `[Fallback] Hello, ${targetUser} (Greeter service not mounted)`
    
    console.log(`\x1b[36m[Step ${currentStepIndex}/${totalSteps}]\x1b[0m Context init: "${step1Msg}"`)
    this.ctx.emit('task/step', {
      step: currentStepIndex,
      total: totalSteps,
      description: `Init context: ${step1Msg}`,
      timestamp: Date.now(),
    })
    await new Promise(r => setTimeout(r, 150))
    currentStepIndex++

    // 3. 可选步骤: 如果当前环境中挂载了 executor 契约，执行 Shell 任务
    const executor = this.ctx.root.executor
    if (executor) {
      console.log(`\x1b[36m[Step ${currentStepIndex}/${totalSteps}]\x1b[0m 🚀 Executing shell via \`ctx.executor\` seam...`)
      const execRes = await executor.exec(shellCommand)
      console.log(`\x1b[32m[Step ${currentStepIndex}/${totalSteps} Output]\x1b[0m (Env: \x1b[1m${execRes.environment}\x1b[0m in ${execRes.durationMs}ms):\n  👉 ${execRes.stdout || execRes.stderr}`)
      this.ctx.emit('task/step', {
        step: currentStepIndex,
        total: totalSteps,
        description: `Exec: ${shellCommand} [${execRes.environment}]`,
        timestamp: Date.now(),
      })
      if (goals) {
        goals.nextRound(taskName)
      }
      await new Promise(r => setTimeout(r, 150))
      currentStepIndex++
    }

    // 4. 循环步骤: 调用 counter 服务递增计数与记录状态
    const counter = this.ctx.root.counter
    for (let i = 1; i <= iterations; i++) {
      const currentCount = counter 
        ? counter.increment(10) 
        : i * 10
      
      console.log(`\x1b[36m[Step ${currentStepIndex}/${totalSteps}]\x1b[0m Iteration #${i} metric = \x1b[1m${currentCount}\x1b[0m`)
      this.ctx.emit('task/step', {
        step: currentStepIndex,
        total: totalSteps,
        description: `Iteration #${i} (Metric=${currentCount})`,
        timestamp: Date.now(),
      })
      if (goals && i < iterations) {
        goals.nextRound(taskName)
      }
      await new Promise(r => setTimeout(r, 150))
      currentStepIndex++
    }

    // 5. 任务完成汇总
    if (goals) {
      goals.updateStatus(taskName, 'completed')
    }
    const durationMs = Date.now() - startTime
    const finalCount = counter ? counter.get() : iterations * 10
    const summary: TaskCompleteEvent = {
      taskName,
      durationMs,
      stepsCompleted: totalSteps,
      finalCount,
    }

    console.log('='.repeat(55))
    console.log(`\x1b[1m\x1b[32m✔ [TaskRunner] Task Completed in ${durationMs}ms!\x1b[0m`)
    console.log(`📊 Summary: Total Steps = ${summary.stepsCompleted}, Final Counter = ${summary.finalCount}`)
    console.log('='.repeat(55) + '\n')

    this.ctx.emit('task/complete', summary)
    return summary
  }
}

export function apply(ctx: Context, config?: TaskRunnerConfig) {
  // 1. 注册 TaskRunnerService
  ctx.plugin(TaskRunnerService, config)

  // 2. 当所需依赖就绪时，执行调度监听与自动运行
  ctx.inject(['taskRunner'], (ctx) => {
    ctx.effect(() => {
      // 注册事件监听演示（Event Consumer）
      const unTaskStart = ctx.on('task/start', (name) => {
        // 可以被日志插件、遥测（Telemetry）或持久化插件监听
      })

      const unTaskComplete = ctx.on('task/complete', async (result) => {
        if (config?.exitOnComplete) {
          console.log('[TaskRunner] exitOnComplete is true. Shutting down process...')
          setTimeout(() => process.exit(0), 100)
        }
      })

      // 如果开启了 autoRun，在当前 tick 后自动启动执行
      if (config?.autoRun !== false) {
        setTimeout(async () => {
          try {
            await ctx.taskRunner.runTask()
          } catch (err) {
            console.error('\x1b[31m[TaskRunner] Task execution failed:\x1b[0m', err)
          }
        }, 100)
      }

      return () => {
        unTaskStart()
        unTaskComplete()
      }
    })
  })
}
