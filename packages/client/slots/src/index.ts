import { Context, Service } from '@deepseek-ai/cordis'

export type SlotRenderer = (container: HTMLElement, ctx: Context) => (() => void) | void

declare module '@deepseek-ai/cordis' {
  interface Context {
    slots: SlotRegistryService
  }
  interface Events {
    'slot/updated'(slotName: string): void
  }
}

export class SlotRegistryService extends Service {
  private slots = new Map<string, Set<SlotRenderer>>()

  constructor(ctx: Context) {
    super(ctx, 'slots')
  }

  /**
   * Register a UI component renderer into a slot.
   * Returns a disposer function for clean unmounting.
   */
  public register(slotName: string, renderer: SlotRenderer): () => void {
    if (!this.slots.has(slotName)) {
      this.slots.set(slotName, new Set())
    }
    const set = this.slots.get(slotName)!
    set.add(renderer)

    this.ctx.emit('slot/updated', slotName)
    
    return () => {
      set.delete(renderer)
      this.ctx.emit('slot/updated', slotName)
    }
  }

  public getRenderers(slotName: string): SlotRenderer[] {
    return Array.from(this.slots.get(slotName) || [])
  }

  /**
   * Render all registered components in the target DOM container.
   */
  public renderSlot(slotName: string, container: HTMLElement): () => void {
    container.innerHTML = ''
    const disposers: (() => void)[] = []
    const renderers = this.getRenderers(slotName)

    if (renderers.length === 0) {
      container.innerHTML = `<div style="color: #64748b; font-size: 0.875rem; font-style: italic;">No plugins registered for slot [${slotName}]</div>`
    } else {
      for (const r of renderers) {
        const itemEl = document.createElement('div')
        itemEl.className = `slot-item slot-${slotName.replace(/\./g, '-')}`
        container.appendChild(itemEl)
        const cleanup = r(itemEl, this.ctx)
        if (typeof cleanup === 'function') {
          disposers.push(cleanup)
        }
      }
    }

    return () => disposers.forEach(d => d())
  }
}

export function apply(ctx: Context) {
  ctx.plugin(SlotRegistryService)
}
