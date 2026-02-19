// Text input control
export interface TextControlOptions {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}

export class TextControl {
  private container: HTMLDivElement;
  private input: HTMLInputElement;
  private value: string;
  private onChange: (value: string) => void;

  constructor(options: TextControlOptions) {
    this.value = options.value;
    this.onChange = options.onChange;

    this.container = document.createElement('div');
    this.container.className = 'tweakpine-text-control';

    const label = document.createElement('label');
    label.className = 'tweakpine-text-label';
    label.textContent = options.label;
    this.container.appendChild(label);

    this.input = document.createElement('input');
    this.input.type = 'text';
    this.input.className = 'tweakpine-text-input';
    this.input.value = this.value;
    if (options.placeholder) {
      this.input.placeholder = options.placeholder;
    }
    this.input.addEventListener('input', (e) => {
      this.value = (e.target as HTMLInputElement).value;
      this.onChange(this.value);
    });
    this.container.appendChild(this.input);
  }

  update(value: string): void {
    this.value = value;
    this.input.value = value;
  }

  destroy(): void {
    this.container.remove();
  }

  getElement(): HTMLDivElement {
    return this.container;
  }
}
