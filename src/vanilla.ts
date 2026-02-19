// Vanilla JS API
import { TweakPineStore, type TweakConfig, type TweakValue, type ResolvedValues } from './store';
import { Renderer, type PanelPosition } from './renderer';

let panelCounter = 0;

export interface TweakPineOptions {
  position?: PanelPosition;
  onAction?: (action: string) => void;
}

export class TweakPinePanel<T extends TweakConfig> {
  private panelId: string;
  private renderer: Renderer;
  private actionUnsubscribe: (() => void) | null = null;
  private changeUnsubscribe: (() => void) | null = null;
  public values: ResolvedValues<T>;

  constructor(name: string, config: T, options: TweakPineOptions = {}) {
    this.panelId = `tweakpine-${++panelCounter}`;

    // Register panel
    TweakPineStore.registerPanel(this.panelId, name, config);

    // Build resolved values proxy
    this.values = this.buildProxy(config) as ResolvedValues<T>;

    // Create renderer
    this.renderer = new Renderer({
      panelId: this.panelId,
      position: options.position,
    });
    this.renderer.mount();

    // Subscribe to actions
    if (options.onAction) {
      this.actionUnsubscribe = TweakPineStore.subscribeActions(this.panelId, options.onAction);
    }
  }

  private buildProxy(config: TweakConfig, prefix = ''): any {
    const proxy: any = {};

    for (const [key, value] of Object.entries(config)) {
      if (key === '_collapsed') continue;
      const path = prefix ? `${prefix}.${key}` : key;

      if (typeof value === 'object' && value !== null && !Array.isArray(value) && !('type' in value)) {
        // Nested object
        proxy[key] = this.buildProxy(value as TweakConfig, path);
      } else {
        // Leaf value - use getter that reads from store
        Object.defineProperty(proxy, key, {
          get: () => {
            const val = TweakPineStore.getValue(this.panelId, path);
            // For arrays (range tuples), return the resolved number
            return Array.isArray(val) ? val[0] : val;
          },
          enumerable: true,
        });
      }
    }

    return proxy;
  }

  on(event: 'change', listener: (values: Record<string, TweakValue>) => void): () => void;
  on(event: 'action', listener: (action: string) => void): () => void;
  on(event: string, listener: any): () => void {
    if (event === 'change') {
      return TweakPineStore.subscribeChange(this.panelId, listener);
    } else if (event === 'action') {
      return TweakPineStore.subscribeActions(this.panelId, listener);
    }
    return () => {};
  }

  destroy(): void {
    if (this.actionUnsubscribe) {
      this.actionUnsubscribe();
    }
    if (this.changeUnsubscribe) {
      this.changeUnsubscribe();
    }
    this.renderer.destroy();
    TweakPineStore.unregisterPanel(this.panelId);
  }
}

export const TweakPine = {
  create<T extends TweakConfig>(name: string, config: T, options?: TweakPineOptions): TweakPinePanel<T> {
    return new TweakPinePanel(name, config, options);
  },
};
