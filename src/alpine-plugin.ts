// AlpineJS plugin
import { TweakPineStore, type TweakConfig, type TweakValue } from './store';
import { Renderer, type PanelPosition } from './renderer';

// AlpineJS types (minimal definitions to avoid dependency)
interface AlpineComponent {
  $data(el: any): any;
  $nextTick(callback: () => void): void;
  effect(callback: () => void): void;
}

interface Alpine extends AlpineComponent {
  magic(name: string, callback: (el: any) => any): void;
  data(name: string, callback: (...args: any[]) => any): void;
}

let panelCounter = 0;

export interface TweakPineAlpineOptions {
  position?: PanelPosition;
}

export function TweakPinePlugin(Alpine: Alpine): void {
  // Register magic helper for reactive access
  Alpine.magic('tweakpine', (el: any) => {
    const component = Alpine.$data(el);
    return component.__tweakpineProxy || {};
  });

  // Register data component
  Alpine.data('tweakpine', (name: string, config: TweakConfig, options: TweakPineAlpineOptions = {}) => {
    const panelId = `tweakpine-alpine-${++panelCounter}`;
    let renderer: Renderer | null = null;
    let unsubscribe: (() => void) | null = null;

    // Build reactive proxy
    function buildProxy(cfg: TweakConfig, prefix = ''): any {
      const proxy: any = {};

      for (const [key, value] of Object.entries(cfg)) {
        if (key === '_collapsed') continue;
        const path = prefix ? `${prefix}.${key}` : key;

        if (typeof value === 'object' && value !== null && !Array.isArray(value) && !('type' in value)) {
          // Nested object
          proxy[key] = buildProxy(value as TweakConfig, path);
        } else {
          // Leaf value
          Object.defineProperty(proxy, key, {
            get: () => {
              const val = TweakPineStore.getValue(panelId, path);
              return Array.isArray(val) ? val[0] : val;
            },
            enumerable: true,
          });
        }
      }

      return proxy;
    }

    return {
      __tweakpineProxy: buildProxy(config),

      init() {
        // Register panel
        TweakPineStore.registerPanel(panelId, name, config);

        // Create renderer
        renderer = new Renderer({
          panelId,
          position: options.position,
        });
        renderer.mount();

        // Subscribe to changes and trigger Alpine reactivity
        unsubscribe = TweakPineStore.subscribeChange(panelId, () => {
          // Trigger Alpine reactivity by updating a dummy property
          if (typeof (this as any).$nextTick === 'function') {
            (this as any).$nextTick(() => {
              Alpine.effect(() => {
                // Access proxy to trigger reactivity
                Object.keys(this.__tweakpineProxy);
              });
            });
          }
        });
      },

      destroy() {
        if (unsubscribe) {
          unsubscribe();
        }
        if (renderer) {
          renderer.destroy();
        }
        TweakPineStore.unregisterPanel(panelId);
      },
    };
  });
}
