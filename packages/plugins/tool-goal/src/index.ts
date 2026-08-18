import { Context, Service } from '@deepseek-ai/cordis'
import type {} from '@mini-dsh/plugin-goal'

declare module '@deepseek-ai/cordis' {
  interface Context {
    toolGoal: ToolGoalService
  }
}

export class ToolGoalService extends Service {
  static inject = ['goals']

  constructor(ctx: Context) {
    super(ctx, 'toolGoal')
    console.log('\x1b[35m[Consumer ToolGoal]\x1b[0m 🛠️  Model-facing Goal tool registered (bound to `ctx.goals`).')
  }

  public async completeGoal(goalId: string) {
    const goal = this.ctx.goals.updateStatus(goalId, 'completed')
    return { ok: true, goal }
  }

  public async getGoalStatus(goalId: string) {
    const goal = this.ctx.goals.getGoal(goalId)
    return { ok: !!goal, goal }
  }
}

export function apply(ctx: Context) {
  ctx.plugin(ToolGoalService)
}
