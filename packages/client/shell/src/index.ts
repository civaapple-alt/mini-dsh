import { Context } from '@deepseek-ai/cordis'
import * as SlotsPlugin from '@mini-dsh/client-slots'
import type {} from '@mini-dsh/client-slots'

declare global {
  interface Window {
    __MINI_BOOT__?: {
      modules: { id: string; url: string }[]
    }
  }
}

export function showHmrToast(message: string) {
  let container = document.getElementById('hmr-toast-container')
  if (!container) {
    container = document.createElement('div')
    container.id = 'hmr-toast-container'
    container.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 99999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: none;
    `
    document.body.appendChild(container)
  }

  const toast = document.createElement('div')
  toast.style.cssText = `
    background: #064e3b;
    border: 1px solid #10b981;
    color: #a7f3d0;
    padding: 12px 18px;
    border-radius: 8px;
    font-size: 0.9rem;
    font-weight: 600;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    opacity: 0;
    transform: translateY(15px);
  `
  toast.innerHTML = message
  container.appendChild(toast)

  // Animate in
  setTimeout(() => {
    toast.style.opacity = '1'
    toast.style.transform = 'translateY(0)'
  }, 10)

  // Animate out
  setTimeout(() => {
    toast.style.opacity = '0'
    toast.style.transform = 'translateY(15px)'
    setTimeout(() => toast.remove(), 300)
  }, 3000)
}

export async function boot() {
  console.log('%c[Mini-DSH Shell] Initializing Browser Cordis Context...', 'color: #3b82f6; font-weight: bold;')
  
  // 1. Create Browser Cordis Context
  const ctx = new Context()

  // 2. Load Core Client Plugins
  await ctx.plugin(SlotsPlugin)

  // 3. Track active plugin fibers for HMR replacement
  const pluginFibers = new Map<string, any>()

  // 4. Read Boot Graph injected by Host
  const bootGraph = window.__MINI_BOOT__
  if (!bootGraph || !Array.isArray(bootGraph.modules)) {
    console.warn('[Mini-DSH Shell] No boot graph found on window.__MINI_BOOT__')
    return
  }

  console.log(`%c[Mini-DSH Shell] Found ${bootGraph.modules.length} client plugin(s) to load`, 'color: #10b981;')

  // 5. Dynamically import each client plugin and register it into browser Cordis
  for (const mod of bootGraph.modules) {
    try {
      console.log(`[Mini-DSH Shell] Loading plugin: ${mod.id} from ${mod.url}`)
      const pluginModule = await import(/* @vite-ignore */ mod.url)
      const fiber = await ctx.plugin(pluginModule)
      pluginFibers.set(mod.id, fiber)
      console.log(`%c[Mini-DSH Shell] Successfully mounted plugin: ${mod.id}`, 'color: #10b981;')
    } catch (err) {
      console.error(`[Mini-DSH Shell] Failed to load plugin ${mod.id}:`, err)
    }
  }

  // 6. Setup Slot Rendering
  const updateSlots = () => {
    const mainSlotEl = document.getElementById('slot-main-cards')
    if (mainSlotEl) {
      ctx.slots.renderSlot('main.cards', mainSlotEl)
    }

    const sidebarSlotEl = document.getElementById('slot-sidebar-widgets')
    if (sidebarSlotEl) {
      ctx.slots.renderSlot('sidebar.widgets', sidebarSlotEl)
    }

    const headerSlotEl = document.getElementById('slot-header')
    if (headerSlotEl) {
      headerSlotEl.innerHTML = `<span class="badge" style="background: #065f46; color: #a7f3d0; border-color: #059669;">✓ Cordis Active (${pluginFibers.size} plugins)</span>`
    }
  }

  // Listen for slot updates (e.g. dynamic runtime plugin load/unload)
  ctx.on('slot/updated', () => {
    updateSlots()
  })

  // Initial render
  updateSlots()

  // 7. Establish Web HMR SSE Stream Connection
  try {
    const eventSource = new EventSource('/api/hmr/events')
    
    eventSource.onopen = () => {
      console.log('%c[Web HMR] 🔌 Connected to Host HMR SSE stream.', 'color: #10b981; font-weight: bold;')
      const statusEl = document.getElementById('hmr-status-indicator')
      if (statusEl) {
        statusEl.innerHTML = '<span style="color: #10b981;">● SSE Stream Connected (Live HMR)</span>'
      }
    }

    eventSource.onmessage = async (e) => {
      try {
        const data = JSON.parse(e.data)
        if (data.type === 'reload' && data.id) {
          console.log(`%c[Web HMR] 🔥 Hot-reloading client plugin: ${data.id}`, 'color: #f59e0b; font-weight: bold;')

          // A. Dispose old plugin fiber in browser Cordis (auto-cleans slots)
          const oldFiber = pluginFibers.get(data.id)
          if (oldFiber && typeof oldFiber.dispose === 'function') {
            await oldFiber.dispose()
            console.log(`[Web HMR] Disposed old fiber for ${data.id}`)
          }

          // B. Dynamically import new bundle with cache-busting timestamp
          const newUrl = data.url || `/plugins/${data.id}/client.js?t=${Date.now()}`
          const newMod = await import(/* @vite-ignore */ newUrl)

          // C. Mount new plugin into browser Cordis
          const newFiber = await ctx.plugin(newMod)
          pluginFibers.set(data.id, newFiber)
          console.log(`%c[Web HMR] ✨ Successfully hot-swapped plugin: ${data.id}`, 'color: #10b981; font-weight: bold;')

          // D. Show UI toast notification
          showHmrToast(`🔥 <b>[Web HMR]</b> Hot-Reloaded <code>${data.id}</code> (Zero Page Refresh)`)
        }
      } catch (err) {
        console.error('[Web HMR] Error handling SSE message:', err)
      }
    }

    eventSource.onerror = () => {
      const statusEl = document.getElementById('hmr-status-indicator')
      if (statusEl) {
        statusEl.innerHTML = '<span style="color: #94a3b8;">○ SSE Offline</span>'
      }
    }
  } catch (err) {
    console.warn('[Web HMR] Failed to initialize SSE stream:', err)
  }
}

// Auto-run in browser
if (typeof window !== 'undefined') {
  boot().catch(console.error)
}
