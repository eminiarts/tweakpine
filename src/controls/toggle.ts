// Toggle control - segmented control style
import { animate } from 'motion';

export interface ToggleOptions {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export class Toggle {
  private container: HTMLDivElement;
  private value: boolean;
  private onChange: (checked: boolean) => void;
  private pill: HTMLDivElement;
  private onButton: HTMLButtonElement;
  private offButton: HTMLButtonElement;

  constructor(options: ToggleOptions) {
    this.value = options.checked;
    this.onChange = options.onChange;

    // Create labeled control wrapper
    this.container = document.createElement('div');
    this.container.className = 'tweakpine-labeled-control';

    const label = document.createElement('span');
    label.className = 'tweakpine-labeled-control-label';
    label.textContent = options.label;
    this.container.appendChild(label);

    // Create segmented control
    const segmented = document.createElement('div');
    segmented.className = 'tweakpine-segmented';

    this.pill = document.createElement('div');
    this.pill.className = 'tweakpine-segmented-pill';
    segmented.appendChild(this.pill);

    this.offButton = document.createElement('button');
    this.offButton.className = 'tweakpine-segmented-button';
    this.offButton.textContent = 'Off';
    this.offButton.type = 'button';
    this.offButton.addEventListener('click', () => this.toggle(false));
    segmented.appendChild(this.offButton);

    this.onButton = document.createElement('button');
    this.onButton.className = 'tweakpine-segmented-button';
    this.onButton.textContent = 'On';
    this.onButton.type = 'button';
    this.onButton.addEventListener('click', () => this.toggle(true));
    segmented.appendChild(this.onButton);

    this.container.appendChild(segmented);

    this.updateDisplay();
  }

  private toggle(checked: boolean): void {
    if (this.value === checked) return;
    this.value = checked;
    this.updateDisplay();
    this.onChange(checked);
  }

  private updateDisplay(): void {
    this.offButton.dataset.active = String(!this.value);
    this.onButton.dataset.active = String(this.value);

    // Position pill
    const targetButton = this.value ? this.onButton : this.offButton;
    const left = targetButton.offsetLeft;
    const width = targetButton.offsetWidth;

    animate(this.pill, { left, width }, { duration: 0.2, easing: 'ease-out' });
  }

  update(checked: boolean): void {
    if (this.value === checked) return;
    this.value = checked;
    this.updateDisplay();
  }

  destroy(): void {
    this.container.remove();
  }

  getElement(): HTMLDivElement {
    return this.container;
  }
}
