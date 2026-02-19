// Color picker control
const HEX_COLOR_REGEX = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/;

function expandShorthandHex(hex: string): string {
  if (hex.length !== 4) return hex;
  return `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
}

export interface ColorControlOptions {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export class ColorControl {
  private container: HTMLDivElement;
  private hexSpan: HTMLSpanElement;
  private hexInput: HTMLInputElement | null = null;
  private swatch: HTMLButtonElement;
  private colorInput: HTMLInputElement;
  private value: string;
  private onChange: (value: string) => void;
  private isEditing = false;

  constructor(options: ColorControlOptions) {
    this.value = options.value;
    this.onChange = options.onChange;

    this.container = document.createElement('div');
    this.container.className = 'tweakpine-color-control';

    const label = document.createElement('span');
    label.className = 'tweakpine-color-label';
    label.textContent = options.label;
    this.container.appendChild(label);

    const inputs = document.createElement('div');
    inputs.className = 'tweakpine-color-inputs';

    this.hexSpan = document.createElement('span');
    this.hexSpan.className = 'tweakpine-color-hex';
    this.hexSpan.textContent = this.value.toUpperCase();
    this.hexSpan.addEventListener('click', () => this.startEditing());
    inputs.appendChild(this.hexSpan);

    this.swatch = document.createElement('button');
    this.swatch.className = 'tweakpine-color-swatch';
    this.swatch.type = 'button';
    this.swatch.style.backgroundColor = this.value;
    this.swatch.addEventListener('click', () => this.colorInput.click());
    inputs.appendChild(this.swatch);

    this.colorInput = document.createElement('input');
    this.colorInput.type = 'color';
    this.colorInput.className = 'tweakpine-color-picker-native';
    this.colorInput.value = this.value.length === 4 ? expandShorthandHex(this.value) : this.value.slice(0, 7);
    this.colorInput.addEventListener('change', (e) => {
      this.setValue((e.target as HTMLInputElement).value);
    });
    inputs.appendChild(this.colorInput);

    this.container.appendChild(inputs);
  }

  private startEditing(): void {
    this.isEditing = true;
    this.hexSpan.style.display = 'none';

    this.hexInput = document.createElement('input');
    this.hexInput.type = 'text';
    this.hexInput.className = 'tweakpine-color-hex-input';
    this.hexInput.value = this.value;
    this.hexInput.addEventListener('blur', () => this.submitEdit());
    this.hexInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.submitEdit();
      } else if (e.key === 'Escape') {
        this.cancelEdit();
      }
    });

    this.hexSpan.parentElement!.insertBefore(this.hexInput, this.hexSpan);
    this.hexInput.focus();
    this.hexInput.select();
  }

  private submitEdit(): void {
    if (!this.hexInput) return;
    const newValue = this.hexInput.value;
    if (HEX_COLOR_REGEX.test(newValue)) {
      this.setValue(newValue);
    }
    this.cancelEdit();
  }

  private cancelEdit(): void {
    if (this.hexInput) {
      this.hexInput.remove();
      this.hexInput = null;
    }
    this.isEditing = false;
    this.hexSpan.style.display = '';
  }

  private setValue(newValue: string): void {
    this.value = newValue;
    this.hexSpan.textContent = newValue.toUpperCase();
    this.swatch.style.backgroundColor = newValue;
    this.colorInput.value = newValue.length === 4 ? expandShorthandHex(newValue) : newValue.slice(0, 7);
    this.onChange(newValue);
  }

  update(value: string): void {
    this.value = value;
    this.hexSpan.textContent = value.toUpperCase();
    this.swatch.style.backgroundColor = value;
    this.colorInput.value = value.length === 4 ? expandShorthandHex(value) : value.slice(0, 7);
  }

  destroy(): void {
    this.container.remove();
  }

  getElement(): HTMLDivElement {
    return this.container;
  }
}
