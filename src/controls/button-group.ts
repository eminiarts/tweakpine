// Button group for actions
export interface ButtonGroupOptions {
  buttons: Array<{
    label: string;
    path: string;
    onClick: () => void;
  }>;
}

export class ButtonGroup {
  private container: HTMLDivElement;

  constructor(options: ButtonGroupOptions) {
    this.container = document.createElement('div');
    this.container.className = 'tweakpine-button-group';

    options.buttons.forEach(button => {
      const btn = document.createElement('button');
      btn.className = 'tweakpine-button';
      btn.type = 'button';
      btn.textContent = button.label;
      btn.addEventListener('click', button.onClick);
      this.container.appendChild(btn);
    });
  }

  destroy(): void {
    this.container.remove();
  }

  getElement(): HTMLDivElement {
    return this.container;
  }
}
