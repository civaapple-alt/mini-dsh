import { Context } from '@deepseek-ai/cordis'
import type {} from '@mini-dsh/client-slots'

export function apply(ctx: Context) {
  // Inject the slots service and register a component in the 'main.cards' slot
  ctx.inject(['slots'], (ctx) => {
    ctx.effect(() => {
      const mountedAt = new Date().toLocaleTimeString()

      const unregister = ctx.slots.register('main.cards', (container) => {
        container.innerHTML = `
          <div class="card" style="border: 1px solid #3b82f6; animation: flash-card 0.6s ease-out;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
              <h3 style="margin-bottom: 0; color: #38bdf8;">👋 Greeter Plugin (Full-Stack)</h3>
              <span class="badge" style="background: #1e3a8a; color: #93c5fd; border: 1px solid #3b82f6; font-size: 0.75rem;">
                ⚡ Bundle Mounted: ${mountedAt}
              </span>
            </div>
            <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1rem;">
              This UI component was loaded dynamically via the <code>main.cards</code> Slot.
              It calls the backend service <code>GET /api/greet</code> hosted on Node.js Cordis Context.
            </p>
            <div style="display: flex; gap: 0.5rem; align-items: center;">
              <input type="text" id="greet-name-input" placeholder="Enter your name" value="Cordis Explorer" />
              <button id="greet-btn">Send Greeting Request</button>
            </div>
            <div id="greet-result" style="margin-top: 1rem; padding: 0.75rem; background: #0f172a; border-radius: 0.375rem; font-size: 0.9rem; display: none;"></div>
          </div>
        `

        const input = container.querySelector('#greet-name-input') as HTMLInputElement
        const btn = container.querySelector('#greet-btn') as HTMLButtonElement
        const resultEl = container.querySelector('#greet-result') as HTMLDivElement

        const handleGreet = async () => {
          const name = encodeURIComponent(input.value || 'Friend')
          resultEl.style.display = 'block'
          resultEl.innerHTML = '<span style="color: #94a3b8;">Calling Host API...</span>'
          try {
            const res = await fetch(`/api/greet?name=${name}`)
            const data = await res.json()
            resultEl.innerHTML = `
              <div style="color: #4ade80; font-weight: 600;">✓ Host Response:</div>
              <div style="margin-top: 0.25rem;">${data.message}</div>
              <div style="color: #64748b; font-size: 0.75rem; margin-top: 0.25rem;">Timestamp: ${new Date(data.timestamp).toLocaleTimeString()}</div>
            `
          } catch (err: any) {
            resultEl.innerHTML = `<span style="color: #f87171;">Failed: ${err.message}</span>`
          }
        }

        btn.addEventListener('click', handleGreet)

        return () => {
          btn.removeEventListener('click', handleGreet)
        }
      })

      return () => {
        unregister()
      }
    })
  })
}
