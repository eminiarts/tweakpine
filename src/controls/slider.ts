// Slider control - vanilla JS port of Dialkit's Slider component
import { animate, type AnimationControls } from 'motion';

const CLICK_THRESHOLD = 3;
const DEAD_ZONE = 32;
const MAX_CURSOR_RANGE = 200;
const MAX_STRETCH = 8;

function decimalsForStep(step: number): number {
  const s = step.toString();
  const dot = s.indexOf('.');
  return dot === -1 ? 0 : s.length - dot - 1;
}

function roundValue(val: number, step: number): number {
  const raw = Math.round(val / step) * step;
  return parseFloat(raw.toFixed(decimalsForStep(step)));
}

function snapToDecile(rawValue: number, min: number, max: number): number {
  const normalized = (rawValue - min) / (max - min);
  const nearest = Math.round(normalized * 10) / 10;
  if (Math.abs(normalized - nearest) <= 0.03125) {
    return min + nearest * (max - min);
  }
  return rawValue;
}

export interface SliderOptions {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
}

export class Slider {
  private wrapper: HTMLDivElement;
  private track: HTMLDivElement;
  private fill: HTMLDivElement;
  private handle: HTMLDivElement;
  private labelSpan: HTMLSpanElement;
  private valueSpan: HTMLSpanElement;
  private input: HTMLInputElement | null = null;
  
  private value: number;
  private min: number;
  private max: number;
  private step: number;
  private onChange: (value: number) => void;
  
  private isInteracting = false;
  private isDragging = false;
  private isHovered = false;
  private isValueHovered = false;
  private isValueEditable = false;
  private showInput = false;
  
  private pointerDownPos: { x: number; y: number } | null = null;
  private isClick = true;
  private wrapperRect: DOMRect | null = null;
  private scale = 1;
  private fillAnim: AnimationControls | null = null;
  private handleAnim: AnimationControls | null = null;
  private rubberAnim: AnimationControls | null = null;
  private hoverTimeout: number | null = null;

  constructor(options: SliderOptions) {
    this.value = options.value;
    this.min = options.min ?? 0;
    this.max = options.max ?? 1;
    this.step = options.step ?? 0.01;
    this.onChange = options.onChange;

    // Create DOM structure
    this.wrapper = document.createElement('div');
    this.wrapper.className = 'tweakpine-slider-wrapper';

    this.track = document.createElement('div');
    this.track.className = 'tweakpine-slider';
    
    // Hash marks
    const hashMarks = this.createHashMarks();
    this.track.appendChild(hashMarks);

    this.fill = document.createElement('div');
    this.fill.className = 'tweakpine-slider-fill';
    this.fill.style.background = 'rgba(255, 255, 255, 0.11)';
    this.track.appendChild(this.fill);

    this.handle = document.createElement('div');
    this.handle.className = 'tweakpine-slider-handle';
    this.handle.style.background = 'rgba(255, 255, 255, 0.9)';
    this.handle.style.opacity = '0';
    this.track.appendChild(this.handle);

    this.labelSpan = document.createElement('span');
    this.labelSpan.className = 'tweakpine-slider-label';
    this.labelSpan.textContent = options.label;
    this.track.appendChild(this.labelSpan);

    this.valueSpan = document.createElement('span');
    this.valueSpan.className = 'tweakpine-slider-value';
    this.track.appendChild(this.valueSpan);

    this.wrapper.appendChild(this.track);

    // Bind event handlers
    this.track.addEventListener('pointerdown', this.handlePointerDown.bind(this));
    this.track.addEventListener('pointermove', this.handlePointerMove.bind(this));
    this.track.addEventListener('pointerup', this.handlePointerUp.bind(this));
    this.track.addEventListener('mouseenter', () => this.setHovered(true));
    this.track.addEventListener('mouseleave', () => this.setHovered(false));
    
    this.valueSpan.addEventListener('mouseenter', () => this.setValueHovered(true));
    this.valueSpan.addEventListener('mouseleave', () => this.setValueHovered(false));
    this.valueSpan.addEventListener('click', this.handleValueClick.bind(this));

    this.updateDisplay();
  }

  private createHashMarks(): HTMLDivElement {
    const container = document.createElement('div');
    container.className = 'tweakpine-slider-hashmarks';

    const discreteSteps = (this.max - this.min) / this.step;
    const marks = discreteSteps <= 10
      ? Array.from({ length: discreteSteps - 1 }, (_, i) => {
          const pct = ((i + 1) * this.step) / (this.max - this.min) * 100;
          return pct;
        })
      : Array.from({ length: 9 }, (_, i) => (i + 1) * 10);

    marks.forEach(pct => {
      const mark = document.createElement('div');
      mark.className = 'tweakpine-slider-hashmark';
      mark.style.left = `${pct}%`;
      container.appendChild(mark);
    });

    return container;
  }

  private setHovered(hovered: boolean): void {
    this.isHovered = hovered;
    this.updateActiveState();
  }

  private setValueHovered(hovered: boolean): void {
    this.isValueHovered = hovered;
    
    if (hovered && !this.showInput && !this.isValueEditable) {
      this.hoverTimeout = window.setTimeout(() => {
        this.isValueEditable = true;
        this.valueSpan.classList.add('tweakpine-slider-value-editable');
        this.valueSpan.style.cursor = 'text';
      }, 800);
    } else if (!hovered && !this.showInput) {
      if (this.hoverTimeout) {
        clearTimeout(this.hoverTimeout);
        this.hoverTimeout = null;
      }
      this.isValueEditable = false;
      this.valueSpan.classList.remove('tweakpine-slider-value-editable');
      this.valueSpan.style.cursor = 'default';
    }
  }

  private updateActiveState(): void {
    const isActive = this.isInteracting || this.isHovered;
    
    if (isActive) {
      this.track.classList.add('tweakpine-slider-active');
      this.fill.style.background = 'rgba(255, 255, 255, 0.15)';
    } else {
      this.track.classList.remove('tweakpine-slider-active');
      this.fill.style.background = 'rgba(255, 255, 255, 0.11)';
    }

    this.updateHandleVisibility();
  }

  private updateHandleVisibility(): void {
    const isActive = this.isInteracting || this.isHovered;
    const percentage = ((this.value - this.min) / (this.max - this.min)) * 100;
    
    // Value dodge logic
    const HANDLE_BUFFER = 8;
    const trackWidth = this.wrapper.offsetWidth;
    let leftThreshold = 30;
    let rightThreshold = 78;
    
    if (trackWidth > 0) {
      const labelWidth = this.labelSpan.offsetWidth;
      const valueWidth = this.valueSpan.offsetWidth;
      leftThreshold = ((10 + labelWidth + HANDLE_BUFFER) / trackWidth) * 100;
      rightThreshold = ((trackWidth - 10 - valueWidth - HANDLE_BUFFER) / trackWidth) * 100;
    }
    
    const valueDodge = percentage < leftThreshold || percentage > rightThreshold;
    const handleOpacity = !isActive
      ? 0
      : valueDodge
        ? 0.1
        : this.isDragging
          ? 0.9
          : 0.5;

    if (this.handleAnim) {
      this.handleAnim.stop();
    }

    this.handleAnim = animate(
      this.handle,
      { 
        opacity: handleOpacity,
        scaleX: isActive ? 1 : 0.25,
        scaleY: isActive && valueDodge ? 0.75 : 1
      },
      { duration: 0.15 }
    );
  }

  private handlePointerDown(e: PointerEvent): void {
    if (this.showInput) return;
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    this.pointerDownPos = { x: e.clientX, y: e.clientY };
    this.isClick = true;
    this.isInteracting = true;

    // Capture wrapper rect
    this.wrapperRect = this.wrapper.getBoundingClientRect();
    const nativeWidth = this.wrapper.offsetWidth;
    this.scale = this.wrapperRect.width / nativeWidth;

    this.updateActiveState();
  }

  private handlePointerMove(e: PointerEvent): void {
    if (!this.isInteracting || !this.pointerDownPos) return;

    const dx = e.clientX - this.pointerDownPos.x;
    const dy = e.clientY - this.pointerDownPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (this.isClick && distance > CLICK_THRESHOLD) {
      this.isClick = false;
      this.isDragging = true;
      this.updateHandleVisibility();
    }

    if (!this.isClick) {
      const newValue = this.positionToValue(e.clientX);
      this.setValue(roundValue(newValue, this.step), false);
    }
  }

  private handlePointerUp(e: PointerEvent): void {
    if (!this.isInteracting) return;

    if (this.isClick) {
      const rawValue = this.positionToValue(e.clientX);
      const discreteSteps = (this.max - this.min) / this.step;
      const snappedValue = discreteSteps <= 10
        ? Math.max(this.min, Math.min(this.max, this.min + Math.round((rawValue - this.min) / this.step) * this.step))
        : snapToDecile(rawValue, this.min, this.max);

      this.setValue(roundValue(snappedValue, this.step), true);
    }

    this.isInteracting = false;
    this.isDragging = false;
    this.pointerDownPos = null;
    this.updateActiveState();
  }

  private positionToValue(clientX: number): number {
    const rect = this.wrapperRect;
    if (!rect) return this.value;
    const screenX = clientX - rect.left;
    const sceneX = screenX / this.scale;
    const nativeWidth = this.wrapper.offsetWidth;
    const percent = Math.max(0, Math.min(1, sceneX / nativeWidth));
    const rawValue = this.min + percent * (this.max - this.min);
    return Math.max(this.min, Math.min(this.max, rawValue));
  }

  private setValue(newValue: number, animate: boolean): void {
    this.value = newValue;
    this.updateDisplay();
    this.onChange(newValue);
  }

  private updateDisplay(): void {
    const percentage = ((this.value - this.min) / (this.max - this.min)) * 100;
    this.fill.style.width = `${percentage}%`;
    this.handle.style.left = `max(5px, calc(${percentage}% - 9px))`;
    this.handle.style.transform = 'translateY(-50%)';
    
    const displayValue = this.value.toFixed(decimalsForStep(this.step));
    this.valueSpan.textContent = displayValue;
  }

  private handleValueClick(e: MouseEvent): void {
    if (!this.isValueEditable) return;
    e.stopPropagation();
    e.preventDefault();
    
    this.showInput = true;
    this.valueSpan.style.display = 'none';
    
    this.input = document.createElement('input');
    this.input.type = 'text';
    this.input.className = 'tweakpine-slider-input';
    this.input.value = this.value.toFixed(decimalsForStep(this.step));
    this.input.style.pointerEvents = 'auto';
    
    this.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.submitInput();
      } else if (e.key === 'Escape') {
        this.cancelInput();
      }
    });
    
    this.input.addEventListener('blur', () => this.submitInput());
    this.input.addEventListener('click', (e) => e.stopPropagation());
    this.input.addEventListener('mousedown', (e) => e.stopPropagation());
    
    this.track.appendChild(this.input);
    this.input.focus();
    this.input.select();
  }

  private submitInput(): void {
    if (!this.input) return;
    
    const parsed = parseFloat(this.input.value);
    if (!isNaN(parsed)) {
      const clamped = Math.max(this.min, Math.min(this.max, parsed));
      this.setValue(roundValue(clamped, this.step), false);
    }
    
    this.cancelInput();
  }

  private cancelInput(): void {
    if (this.input) {
      this.input.remove();
      this.input = null;
    }
    this.showInput = false;
    this.isValueHovered = false;
    this.isValueEditable = false;
    this.valueSpan.style.display = '';
    this.valueSpan.classList.remove('tweakpine-slider-value-editable');
  }

  update(value: number): void {
    if (this.isInteracting) return; // Don't update while user is dragging
    this.value = value;
    this.updateDisplay();
  }

  destroy(): void {
    if (this.fillAnim) this.fillAnim.stop();
    if (this.handleAnim) this.handleAnim.stop();
    if (this.rubberAnim) this.rubberAnim.stop();
    if (this.hoverTimeout) clearTimeout(this.hoverTimeout);
    this.wrapper.remove();
  }

  getElement(): HTMLDivElement {
    return this.wrapper;
  }
}
