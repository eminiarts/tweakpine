// Preset manager control
import type { Preset } from '../store';
import { animate } from 'motion';

export interface PresetsOptions {
  presets: Preset[];
  activePresetId: string | null;
  onLoad: (presetId: string | null) => void;
  onSave: (name: string) => void;
  onDelete: (presetId: string) => void;
}

export class Presets {
  private container: HTMLDivElement;
  private trigger: HTMLButtonElement;
  private dropdown: HTMLDivElement | null = null;
  private chevron: SVGSVGElement;
  private labelSpan: HTMLSpanElement;
  private presets: Preset[];
  private activePresetId: string | null;
  private onLoad: (presetId: string | null) => void;
  private onSave: (name: string) => void;
  private onDelete: (presetId: string) => void;
  private isOpen = false;

  constructor(options: PresetsOptions) {
    this.presets = options.presets;
    this.activePresetId = options.activePresetId;
    this.onLoad = options.onLoad;
    this.onSave = options.onSave;
    this.onDelete = options.onDelete;

    this.container = document.createElement('div');
    this.container.className = 'tweakpine-preset-manager';

    this.trigger = document.createElement('button');
    this.trigger.className = 'tweakpine-preset-trigger';
    this.trigger.type = 'button';
    this.trigger.dataset.disabled = String(this.presets.length === 0);
    this.trigger.addEventListener('click', () => this.toggle());

    this.labelSpan = document.createElement('span');
    this.labelSpan.className = 'tweakpine-preset-label';
    this.updateLabel();
    this.trigger.appendChild(this.labelSpan);

    this.chevron = this.createChevron();
    this.trigger.appendChild(this.chevron);

    this.container.appendChild(this.trigger);
  }

  private createChevron(): SVGSVGElement {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.classList.add('tweakpine-select-chevron');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2.5');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M6 9.5L12 15.5L18 9.5');
    svg.appendChild(path);

    return svg;
  }

  private updateLabel(): void {
    const activePreset = this.presets.find(p => p.id === this.activePresetId);
    this.labelSpan.textContent = activePreset ? activePreset.name : 'Version 1';
  }

  private toggle(): void {
    if (this.presets.length === 0) return;
    
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  private open(): void {
    this.isOpen = true;
    this.trigger.dataset.open = 'true';
    animate(this.chevron, { rotate: 180, opacity: 0.6 }, { duration: 0.2 });

    this.dropdown = document.createElement('div');
    this.dropdown.className = 'tweakpine-root tweakpine-preset-dropdown';

    // Position
    const rect = this.trigger.getBoundingClientRect();
    this.dropdown.style.position = 'fixed';
    this.dropdown.style.top = `${rect.bottom + 4}px`;
    this.dropdown.style.left = `${rect.left}px`;
    this.dropdown.style.minWidth = `${rect.width}px`;
    this.dropdown.style.zIndex = '10000';

    // Add "Version 1" (base)
    const baseItem = this.createPresetItem('Version 1', null, !this.activePresetId);
    this.dropdown.appendChild(baseItem);

    // Add presets
    this.presets.forEach(preset => {
      const item = this.createPresetItem(preset.name, preset.id, preset.id === this.activePresetId);
      this.dropdown!.appendChild(item);
    });

    document.body.appendChild(this.dropdown);

    // Animate in
    animate(
      this.dropdown,
      { opacity: [0, 1], y: [4, 0], scale: [0.97, 1] },
      { duration: 0.15 }
    );

    // Click outside to close
    setTimeout(() => {
      document.addEventListener('mousedown', this.handleClickOutside);
    }, 0);
  }

  private createPresetItem(name: string, id: string | null, isActive: boolean): HTMLDivElement {
    const item = document.createElement('div');
    item.className = 'tweakpine-preset-item';
    item.dataset.active = String(isActive);
    item.addEventListener('click', () => {
      this.onLoad(id);
      this.close();
    });

    const nameSpan = document.createElement('span');
    nameSpan.className = 'tweakpine-preset-name';
    nameSpan.textContent = name;
    item.appendChild(nameSpan);

    if (id !== null) {
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'tweakpine-preset-delete';
      deleteBtn.type = 'button';
      deleteBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M5 6.5L5.80734 18.2064C5.91582 19.7794 7.22348 21 8.80023 21H15.1998C16.7765 21 18.0842 19.7794 18.1927 18.2064L19 6.5" />
          <path d="M10 11V16" />
          <path d="M14 11V16" />
          <path d="M3.5 6H20.5" />
          <path d="M8.07092 5.74621C8.42348 3.89745 10.0485 2.5 12 2.5C13.9515 2.5 15.5765 3.89745 15.9291 5.74621" />
        </svg>
      `;
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.onDelete(id);
        this.close();
      });
      item.appendChild(deleteBtn);
    }

    return item;
  }

  private close(): void {
    if (!this.dropdown) return;

    this.isOpen = false;
    this.trigger.dataset.open = 'false';
    animate(this.chevron, { rotate: 0, opacity: this.presets.length > 0 ? 0.6 : 0.25 }, { duration: 0.2 });

    const dropdown = this.dropdown;
    animate(
      dropdown,
      { opacity: 0, scale: 0.97 },
      { duration: 0.15 }
    ).finished.then(() => {
      dropdown.remove();
    });

    this.dropdown = null;
    document.removeEventListener('mousedown', this.handleClickOutside);
  }

  private handleClickOutside = (e: MouseEvent): void => {
    const target = e.target as Node;
    if (this.trigger.contains(target) || this.dropdown?.contains(target)) {
      return;
    }
    this.close();
  };

  update(presets: Preset[], activePresetId: string | null): void {
    this.presets = presets;
    this.activePresetId = activePresetId;
    this.trigger.dataset.disabled = String(presets.length === 0);
    this.updateLabel();
  }

  destroy(): void {
    if (this.isOpen) {
      this.close();
    }
    this.container.remove();
  }

  getElement(): HTMLDivElement {
    return this.container;
  }
}
