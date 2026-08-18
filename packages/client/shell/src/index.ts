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

export async function boot() {
  console.log('%c[Mini-DSH Shell] Initializing Browser Cordis Context...', 'color: #3b82f6; font-weight: bold;')
  
  // 1. Create Browser Cordis Context
  const ctx = new Context()

  // 2. Load Core Client Plugins
  await ctx.plugin(SlotsPlugin)

  // 3. Read Boot Graph injected by Host
  const bootGraph = window.__MINI_BOOT__
  if (!bootGraph || !Array.isArray(bootGraph.modules)) {
    console.warn('[Mini-DSH Shell] No boot graph found on window.__MINI_BOOT__')
    return
  }

  console.log(`%c[Mini-DSH Shell] Found ${bootGraph.modules.length} client plugin(s) to load`, 'color: #10b981;')

  // 4. Dynamically import each client plugin and register it into browser Cordis
  for (const mod of bootGraph.modules) {
    try {
      console.log(`[Mini-DSH Shell] Loading plugin: ${mod.id} from ${mod.url}`)
      const pluginModule = await import(/* @vite-ignore */ mod.url)
      await ctx.plugin(pluginModule)
      console.log(`%c[Mini-DSH Shell] Successfully mounted plugin: ${mod.id}`, 'color: #10b981;')
    } catch (err) {
      console.error(`[Mini-DSH Shell] Failed to load plugin ${mod.id}:`, err)
    }
  }

  // 5. Setup Slot Rendering
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
      headerSlotEl.innerHTML = `<span class="badge" style="background: #065f46; color: #a7f3d0; border-color: #059669;">✓ Cordis Active (${bootGraph.modules.length} plugins)</span>`
    }
  }

  // Listen for slot updates (e.g. dynamic runtime plugin load/unload)
  ctx.on('slot/updated', () => {
    updateSlots()
  })

  // Initial render
  updateSlots()
}

// Auto-run in browser
if (typeof window !== 'undefined') {
  boot().catch(console.error)
}
