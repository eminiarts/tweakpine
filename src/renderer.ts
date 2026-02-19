// Renderer - creates and manages the floating panel DOM
import { TweakPineStore, type ControlMeta, type TweakValue, type SpringConfig } from './store';
import { Folder } from './controls/folder';
import { Slider } from './controls/slider';
import { Toggle } from './controls/toggle';
import { ColorControl } from './controls/color';
import { SelectControl } from './controls/select';
import { TextControl } from './controls/text';
import { SpringControl } from './controls/spring';
import { ButtonGroup } from './controls/button-group';
import { Presets } from './controls/presets';

export type PanelPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';

export interface RendererOptions {
  panelId: string;
  position?: PanelPosition;
}

export class Renderer {
  private panelId: string;
  private position: PanelPosition;
  private root: HTMLDivElement | null = null;
  private panel: HTMLDivElement | null = null;
  private rootFolder: Folder | null = null;
  private controls: Map<string, any> = new Map();
  private presets: Presets | null = null;
  private unsubscribe: (() => void) | null = null;

  constructor(options: RendererOptions) {
    this.panelId = options.panelId;
    this.position = options.position ?? 'top-right';
  }

  mount(): void {
    // Create root container
    this.root = document.createElement('div');
    this.root.className = 'tweakpine-root';

    // Create panel
    this.panel = document.createElement('div');
    this.panel.className = 'tweakpine-panel';
    this.panel.dataset.position = this.position;

    // Get panel config
    const panelConfig = TweakPineStore.getPanel(this.panelId);
    if (!panelConfig) {
      console.warn(`Panel ${this.panelId} not found`);
      return;
    }

    // Create root folder
    this.rootFolder = new Folder({
      title: panelConfig.name,
      defaultOpen: true,
      isRoot: true,
    });

    // Create toolbar with presets and add button
    const toolbar = this.createToolbar();
    const rootElement = this.rootFolder.getElement();
    
    // Insert toolbar after header
    const header = rootElement.querySelector('.tweakpine-folder-header');
    if (header && toolbar) {
      header.appendChild(toolbar);
    }

    // Render controls
    this.renderControls(panelConfig.controls, this.rootFolder.getInner());

    this.panel.appendChild(this.rootFolder.getElement());
    this.root.appendChild(this.panel);
    document.body.appendChild(this.root);

    // Subscribe to changes
    this.unsubscribe = TweakPineStore.subscribe(this.panelId, () => {
      this.update();
    });
  }

  private createToolbar(): HTMLDivElement | null {
    const toolbar = document.createElement('div');
    toolbar.className = 'tweakpine-panel-toolbar';
    toolbar.addEventListener('click', (e) => e.stopPropagation());

    // Create add button for saving presets
    const addBtn = document.createElement('button');
    addBtn.className = 'tweakpine-toolbar-add';
    addBtn.type = 'button';
    addBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 5v14M5 12h14"/>
      </svg>
    `;
    addBtn.addEventListener('click', () => {
      const name = prompt('Preset name:');
      if (name) {
        TweakPineStore.savePreset(this.panelId, name);
      }
    });
    toolbar.appendChild(addBtn);

    // Create presets dropdown
    this.presets = new Presets({
      presets: TweakPineStore.getPresets(this.panelId),
      activePresetId: TweakPineStore.getActivePresetId(this.panelId),
      onLoad: (id) => {
        if (id) {
          TweakPineStore.loadPreset(this.panelId, id);
        } else {
          TweakPineStore.clearActivePreset(this.panelId);
        }
      },
      onSave: (name) => {
        TweakPineStore.savePreset(this.panelId, name);
      },
      onDelete: (id) => {
        TweakPineStore.deletePreset(this.panelId, id);
      },
    });
    toolbar.appendChild(this.presets.getElement());

    return toolbar;
  }

  private renderControls(controls: ControlMeta[], container: HTMLElement): void {
    controls.forEach(control => {
      const element = this.renderControl(control);
      if (element) {
        container.appendChild(element);
      }
    });
  }

  private renderControl(meta: ControlMeta): HTMLElement | null {
    const value = TweakPineStore.getValue(this.panelId, meta.path);

    switch (meta.type) {
      case 'slider': {
        const slider = new Slider({
          label: meta.label,
          value: value as number,
          min: meta.min,
          max: meta.max,
          step: meta.step,
          onChange: (v) => TweakPineStore.updateValue(this.panelId, meta.path, v),
        });
        this.controls.set(meta.path, slider);
        return slider.getElement();
      }

      case 'toggle': {
        const toggle = new Toggle({
          label: meta.label,
          checked: value as boolean,
          onChange: (v) => TweakPineStore.updateValue(this.panelId, meta.path, v),
        });
        this.controls.set(meta.path, toggle);
        return toggle.getElement();
      }

      case 'color': {
        const color = new ColorControl({
          label: meta.label,
          value: value as string,
          onChange: (v) => TweakPineStore.updateValue(this.panelId, meta.path, v),
        });
        this.controls.set(meta.path, color);
        return color.getElement();
      }

      case 'select': {
        const select = new SelectControl({
          label: meta.label,
          value: value as string,
          options: meta.options || [],
          onChange: (v) => TweakPineStore.updateValue(this.panelId, meta.path, v),
        });
        this.controls.set(meta.path, select);
        return select.getElement();
      }

      case 'text': {
        const text = new TextControl({
          label: meta.label,
          value: value as string,
          placeholder: meta.placeholder,
          onChange: (v) => TweakPineStore.updateValue(this.panelId, meta.path, v),
        });
        this.controls.set(meta.path, text);
        return text.getElement();
      }

      case 'spring': {
        const spring = new SpringControl({
          panelId: this.panelId,
          path: meta.path,
          label: meta.label,
          spring: value as SpringConfig,
          mode: TweakPineStore.getSpringMode(this.panelId, meta.path),
          onChange: (v) => TweakPineStore.updateValue(this.panelId, meta.path, v),
          onModeChange: (mode) => TweakPineStore.updateSpringMode(this.panelId, meta.path, mode),
        });
        this.controls.set(meta.path, spring);
        return spring.getElement();
      }

      case 'folder': {
        const folder = new Folder({
          title: meta.label,
          defaultOpen: meta.defaultOpen,
          isRoot: false,
        });
        if (meta.children) {
          this.renderControls(meta.children, folder.getInner());
        }
        this.controls.set(meta.path, folder);
        return folder.getElement();
      }

      case 'action': {
        const buttonGroup = new ButtonGroup({
          buttons: [{
            label: meta.label,
            path: meta.path,
            onClick: () => TweakPineStore.triggerAction(this.panelId, meta.path),
          }],
        });
        this.controls.set(meta.path, buttonGroup);
        return buttonGroup.getElement();
      }
    }

    return null;
  }

  private update(): void {
    const values = TweakPineStore.getValues(this.panelId);
    
    // Update all controls
    for (const [path, control] of this.controls.entries()) {
      const value = values[path];
      if (value !== undefined && control.update) {
        if (control instanceof SpringControl) {
          control.update(value as SpringConfig, TweakPineStore.getSpringMode(this.panelId, path));
        } else {
          control.update(value);
        }
      }
    }

    // Update presets
    if (this.presets) {
      this.presets.update(
        TweakPineStore.getPresets(this.panelId),
        TweakPineStore.getActivePresetId(this.panelId)
      );
    }
  }

  destroy(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
    }

    // Destroy all controls
    for (const control of this.controls.values()) {
      if (control.destroy) {
        control.destroy();
      }
    }
    this.controls.clear();

    if (this.presets) {
      this.presets.destroy();
    }

    if (this.rootFolder) {
      this.rootFolder.destroy();
    }

    if (this.root) {
      this.root.remove();
    }
  }
}
