// Select dropdown control
import { animate } from 'motion';

type SelectOption = string | { value: string; label: string };

function toTitleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

function normalizeOptions(options: SelectOption[]): { value: string; label: string }[] {
  return options.map((opt) =>
    typeof opt === 'string' ? { value: opt, label: toTitleCase(opt) } : opt
  );
}

export interface SelectControlOptions {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
}

export class SelectControl {
  private container: HTMLDivElement;
  private trigger: HTMLButtonElement;
  private dropdown: HTMLDivElement | null = null;
  private chevron: SVGSVGElement;
  private valueSpan: HTMLSpanElement;
  private value: string;
  private options: { value: string; label: string }[];
  private onChange: (value: string) => void;
  private isOpen = false;

  constructor(options: SelectControlOptions) {
    this.value = options.value;
    this.options = normalizeOptions(options.options);
    this.onChange = options.onChange;

    this.container = document.createElement('div');
    this.container.className = 'tweakpine-select-row';

    this.trigger = document.createElement('button');
    this.trigger.className = 'tweakpine-select-trigger';
    this.trigger.type = 'button';
    this.trigger.addEventListener('click', () => this.toggle());

    const label = document.createElement('span');
    label.className = 'tweakpine-select-label';
    label.textContent = options.label;
    this.trigger.appendChild(label);

    const right = document.createElement('div');
    right.className = 'tweakpine-select-right';

    this.valueSpan = document.createElement('span');
    this.valueSpan.className = 'tweakpine-select-value';
    this.updateValueDisplay();
    right.appendChild(this.valueSpan);

    this.chevron = this.createChevron();
    right.appendChild(this.chevron);

    this.trigger.appendChild(right);
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

  private toggle(): void {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  private open(): void {
    this.isOpen = true;
    this.trigger.dataset.open = 'true';
    animate(this.chevron, { rotate: 180 }, { duration: 0.2, easing: [0.4, 0, 0.2, 1] });

    // Create dropdown
    this.dropdown = document.createElement('div');
    this.dropdown.className = 'tweakpine-select-dropdown';
    
    // Position dropdown
    const rect = this.trigger.getBoundingClientRect();
    const dropdownHeight = 8 + this.options.length * 36;
    const spaceBelow = window.innerHeight - rect.bottom - 4;
    const above = spaceBelow < dropdownHeight && rect.top > spaceBelow;

    this.dropdown.style.position = 'fixed';
    this.dropdown.style.left = `${rect.left}px`;
    this.dropdown.style.width = `${rect.width}px`;
    this.dropdown.style.zIndex = '10000';

    if (above) {
      this.dropdown.style.bottom = `${window.innerHeight - rect.top}px`;
      this.dropdown.style.transformOrigin = 'bottom';
    } else {
      this.dropdown.style.top = `${rect.bottom + 4}px`;
      this.dropdown.style.transformOrigin = 'top';
    }

    // Add options
    this.options.forEach(option => {
      const btn = document.createElement('button');
      btn.className = 'tweakpine-select-option';
      btn.type = 'button';
      btn.textContent = option.label;
      btn.dataset.selected = String(option.value === this.value);
      btn.addEventListener('click', () => {
        this.select(option.value);
        this.close();
      });
      this.dropdown!.appendChild(btn);
    });

    // Find closest .tweakpine-root or use body
    const root = this.container.closest('.tweakpine-root') as HTMLElement || document.body;
    root.appendChild(this.dropdown);

    // Animate in
    animate(
      this.dropdown,
      { opacity: [0, 1], y: [above ? 8 : -8, 0], scale: [0.95, 1] },
      { duration: 0.15, easing: [0.4, 0, 0.2, 1] }
    );

    // Click outside to close
    setTimeout(() => {
      document.addEventListener('mousedown', this.handleClickOutside);
    }, 0);
  }

  private close(): void {
    if (!this.dropdown) return;

    this.isOpen = false;
    this.trigger.dataset.open = 'false';
    animate(this.chevron, { rotate: 0 }, { duration: 0.2, easing: [0.4, 0, 0.2, 1] });

    const dropdown = this.dropdown;
    animate(
      dropdown,
      { opacity: 0, scale: 0.95 },
      { duration: 0.15, easing: [0.4, 0, 0.2, 1] }
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

  private select(value: string): void {
    this.value = value;
    this.updateValueDisplay();
    this.onChange(value);
  }

  private updateValueDisplay(): void {
    const option = this.options.find(o => o.value === this.value);
    this.valueSpan.textContent = option?.label ?? this.value;
  }

  update(value: string): void {
    this.value = value;
    this.updateValueDisplay();
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
