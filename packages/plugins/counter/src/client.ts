import { Context } from '@deepseek-ai/cordis'
import type {} from '@mini-dsh/client-slots'

export function apply(ctx: Context) {
  // Register an interactive widget in 'sidebar.widgets' slot
  ctx.inject(['slots'], (ctx) => {
    ctx.effect(() => {
      const unregister = ctx.slots.register('sidebar.widgets', (container) => {
        container.innerHTML = `
          <div class="card" style="border-left: 3px solid #ec4899;">
            <h3 style="color: #f472b6;">🔢 Counter Widget</h3>
            <p style="color: var(--text-muted); font-size: 0.8rem; margin-bottom: 0.75rem;">
              State is persisted in Host <code>CounterService</code>.
            </p>
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <span id="counter-value" style="font-size: 1.5rem; font-weight: 700; color: #f8fafc;">--</span>
              <button id="counter-inc-btn" style="background: #ec4899; padding: 0.35rem 0.75rem; font-size: 0.85rem;">+ Increment</button>
            </div>
          </div>
        `

        const valueEl = container.querySelector('#counter-value') as HTMLSpanElement
        const incBtn = container.querySelector('#counter-inc-btn') as HTMLButtonElement

        const fetchCount = async () => {
          try {
            const res = await fetch('/api/count')
            const data = await res.json()
            valueEl.innerText = String(data.count)
          } catch (e) {
            valueEl.innerText = 'Err'
          }
        }

        const handleInc = async () => {
          try {
            const res = await fetch('/api/count', { method: 'POST' })
            const data = await res.json()
            valueEl.innerText = String(data.count)
          } catch (e) {
            console.error(e)
          }
        }

        incBtn.addEventListener('click', handleInc)
        fetchCount()

        return () => {
          incBtn.removeEventListener('click', handleInc)
        }
      })

      return () => {
        unregister()
      }
    })
  })
}
