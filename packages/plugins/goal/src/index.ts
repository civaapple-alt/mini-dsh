import { Context, Service } from '@deepseek-ai/cordis'

export type GoalStatus = 'active' | 'paused' | 'blocked' | 'completed'

export interface Goal {
  id: string
  objective: string
  status: GoalStatus
  round: number
  updatedAt: number
}

declare module '@deepseek-ai/cordis' {
  interface Context {
    goals: GoalService
  }
  interface Events {
    'goal/state-change'(goal: Goal): void
  }
}

export class GoalService extends Service {
  private goals = new Map<string, Goal>()

  constructor(ctx: Context) {
    super(ctx, 'goals')
    console.log('\x1b[36m[Goal Domain]\x1b[0m 🎯 Initialized. Persisted goal state machine active.')
  }

  public createGoal(id: string, objective: string): Goal {
    const goal: Goal = {
      id,
      objective,
      status: 'active',
      round: 1,
      updatedAt: Date.now(),
    }
    this.goals.set(id, goal)
    console.log(`\x1b[36m[Goal Domain]\x1b[0m 🎯 Created Goal: \x1b[1m"${objective}"\x1b[0m (Status: \x1b[32mactive\x1b[0m, Round: 1)`)
    this.ctx.emit('goal/state-change', goal)
    return goal
  }

  public nextRound(id: string): Goal | undefined {
    const goal = this.goals.get(id)
    if (!goal) return undefined
    goal.round++
    goal.updatedAt = Date.now()
    console.log(`\x1b[36m[Goal Domain]\x1b[0m 🔄 Goal "${goal.id}" advanced to \x1b[1mRound ${goal.round}\x1b[0m`)
    this.ctx.emit('goal/state-change', goal)
    return goal
  }

  public updateStatus(id: string, status: GoalStatus): Goal | undefined {
    const goal = this.goals.get(id)
    if (!goal) return undefined
    goal.status = status
    goal.updatedAt = Date.now()
    console.log(`\x1b[36m[Goal Domain]\x1b[0m 🎯 Goal "${goal.id}" status updated to: \x1b[1m\x1b[32m${status}\x1b[0m`)
    this.ctx.emit('goal/state-change', goal)
    return goal
  }

  public getGoal(id: string): Goal | undefined {
    return this.goals.get(id)
  }
}

export function apply(ctx: Context) {
  ctx.plugin(GoalService)
}
