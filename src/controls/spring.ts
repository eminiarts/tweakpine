// Spring config editor with visualization
import type { SpringConfig } from '../store';
import { Slider } from './slider';
import { Folder } from './folder';
import { animate } from 'motion';

export interface SpringControlOptions {
  panelId: string;
  path: string;
  label: string;
  spring: SpringConfig;
  mode: 'simple' | 'advanced';
  onChange: (spring: SpringConfig) => void;
  onModeChange: (mode: 'simple' | 'advanced') => void;
}

export class SpringControl {
  private folder: Folder;
  private modeControl: HTMLDivElement;
  private visualization: HTMLCanvasElement;
  private sliders: Slider[] = [];
  private spring: SpringConfig;
  private mode: 'simple' | 'advanced';
  private onChange: (spring: SpringConfig) => void;
  private onModeChange: (mode: 'simple' | 'advanced') => void;

  constructor(options: SpringControlOptions) {
    this.spring = options.spring;
    this.mode = options.mode;
    this.onChange = options.onChange;
    this.onModeChange = options.onModeChange;

    this.folder = new Folder({
      title: options.label,
      defaultOpen: true,
      isRoot: false,
    });

    const inner = this.folder.getInner();

    // Visualization
    this.visualization = this.createVisualization();
    inner.appendChild(this.visualization);
    this.updateVisualization();

    // Mode selector
    this.modeControl = this.createModeControl();
    inner.appendChild(this.modeControl);

    // Sliders
    this.updateSliders();
  }

  private createVisualization(): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.className = 'tweakpine-spring-viz';
    canvas.width = 280 * window.devicePixelRatio;
    canvas.height = 60 * window.devicePixelRatio;
    canvas.style.width = '100%';
    canvas.style.height = '60px';
    return canvas;
  }

  private updateVisualization(): void {
    const ctx = this.visualization.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio;
    const width = this.visualization.width;
    const height = this.visualization.height;

    ctx.clearRect(0, 0, width, height);

    // Draw spring curve
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2 * dpr;
    ctx.beginPath();

    const steps = 100;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const y = this.evaluateSpring(t);
      const x = t * width;
      const py = height - y * (height * 0.8);

      if (i === 0) {
        ctx.moveTo(x, py);
      } else {
        ctx.lineTo(x, py);
      }
    }

    ctx.stroke();
  }

  private evaluateSpring(t: number): number {
    // Simplified spring evaluation for visualization
    const isSimple = this.mode === 'simple';
    
    if (isSimple) {
      const duration = this.spring.visualDuration ?? 0.3;
      const bounce = this.spring.bounce ?? 0.2;
      const omega = (1 - bounce) * 8;
      const damping = omega * 0.5;
      const normalizedT = t / (duration / 1000);
      
      if (normalizedT >= 1) return 1;
      
      const exp = Math.exp(-damping * normalizedT);
      const sin = Math.sin(omega * normalizedT);
      return 1 - exp * (1 + damping * normalizedT * sin);
    } else {
      const stiffness = this.spring.stiffness ?? 200;
      const damping = this.spring.damping ?? 25;
      const mass = this.spring.mass ?? 1;
      
      const omega = Math.sqrt(stiffness / mass);
      const zeta = damping / (2 * Math.sqrt(stiffness * mass));
      
      if (zeta < 1) {
        // Underdamped
        const omegaD = omega * Math.sqrt(1 - zeta * zeta);
        const exp = Math.exp(-zeta * omega * t);
        return 1 - exp * (Math.cos(omegaD * t) + (zeta * omega / omegaD) * Math.sin(omegaD * t));
      } else {
        // Critically damped or overdamped
        const exp = Math.exp(-omega * t);
        return 1 - exp * (1 + omega * t);
      }
    }
  }

  private createModeControl(): HTMLDivElement {
    const container = document.createElement('div');
    container.className = 'tweakpine-labeled-control';

    const label = document.createElement('span');
    label.className = 'tweakpine-labeled-control-label';
    label.textContent = 'Type';
    container.appendChild(label);

    const segmented = document.createElement('div');
    segmented.className = 'tweakpine-segmented';

    const pill = document.createElement('div');
    pill.className = 'tweakpine-segmented-pill';
    segmented.appendChild(pill);

    const simpleBtn = document.createElement('button');
    simpleBtn.className = 'tweakpine-segmented-button';
    simpleBtn.textContent = 'Time';
    simpleBtn.type = 'button';
    simpleBtn.dataset.active = String(this.mode === 'simple');
    simpleBtn.addEventListener('click', () => this.switchMode('simple'));
    segmented.appendChild(simpleBtn);

    const advancedBtn = document.createElement('button');
    advancedBtn.className = 'tweakpine-segmented-button';
    advancedBtn.textContent = 'Physics';
    advancedBtn.type = 'button';
    advancedBtn.dataset.active = String(this.mode === 'advanced');
    advancedBtn.addEventListener('click', () => this.switchMode('advanced'));
    segmented.appendChild(advancedBtn);

    container.appendChild(segmented);

    // Position pill
    setTimeout(() => {
      const targetButton = this.mode === 'simple' ? simpleBtn : advancedBtn;
      pill.style.left = `${targetButton.offsetLeft}px`;
      pill.style.width = `${targetButton.offsetWidth}px`;
    }, 0);

    return container;
  }

  private switchMode(newMode: 'simple' | 'advanced'): void {
    if (this.mode === newMode) return;
    this.mode = newMode;

    // Update button states
    const buttons = this.modeControl.querySelectorAll('.tweakpine-segmented-button');
    buttons[0].dataset.active = String(newMode === 'simple');
    buttons[1].dataset.active = String(newMode === 'advanced');

    // Animate pill
    const pill = this.modeControl.querySelector('.tweakpine-segmented-pill') as HTMLDivElement;
    const targetButton = buttons[newMode === 'simple' ? 0 : 1] as HTMLButtonElement;
    animate(pill, { left: targetButton.offsetLeft, width: targetButton.offsetWidth }, { duration: 0.2 });

    this.onModeChange(newMode);
    this.updateSliders();
    this.updateVisualization();
  }

  private updateSliders(): void {
    // Remove old sliders
    this.sliders.forEach(slider => slider.destroy());
    this.sliders = [];

    const inner = this.folder.getInner();
    const existingSliders = inner.querySelectorAll('.tweakpine-slider-wrapper');
    existingSliders.forEach(el => el.remove());

    if (this.mode === 'simple') {
      const durationSlider = new Slider({
        label: 'Duration',
        value: this.spring.visualDuration ?? 0.3,
        min: 0.1,
        max: 1,
        step: 0.05,
        onChange: (v) => this.updateSpring('visualDuration', v),
      });
      inner.appendChild(durationSlider.getElement());
      this.sliders.push(durationSlider);

      const bounceSlider = new Slider({
        label: 'Bounce',
        value: this.spring.bounce ?? 0.2,
        min: 0,
        max: 1,
        step: 0.05,
        onChange: (v) => this.updateSpring('bounce', v),
      });
      inner.appendChild(bounceSlider.getElement());
      this.sliders.push(bounceSlider);
    } else {
      const stiffnessSlider = new Slider({
        label: 'Stiffness',
        value: this.spring.stiffness ?? 400,
        min: 1,
        max: 1000,
        step: 10,
        onChange: (v) => this.updateSpring('stiffness', v),
      });
      inner.appendChild(stiffnessSlider.getElement());
      this.sliders.push(stiffnessSlider);

      const dampingSlider = new Slider({
        label: 'Damping',
        value: this.spring.damping ?? 17,
        min: 1,
        max: 100,
        step: 1,
        onChange: (v) => this.updateSpring('damping', v),
      });
      inner.appendChild(dampingSlider.getElement());
      this.sliders.push(dampingSlider);

      const massSlider = new Slider({
        label: 'Mass',
        value: this.spring.mass ?? 1,
        min: 0.1,
        max: 10,
        step: 0.1,
        onChange: (v) => this.updateSpring('mass', v),
      });
      inner.appendChild(massSlider.getElement());
      this.sliders.push(massSlider);
    }
  }

  private updateSpring(key: keyof SpringConfig, value: number): void {
    if (this.mode === 'simple') {
      const { stiffness, damping, mass, ...rest } = this.spring;
      this.spring = { ...rest, [key]: value };
    } else {
      const { visualDuration, bounce, ...rest } = this.spring;
      this.spring = { ...rest, [key]: value };
    }

    this.onChange(this.spring);
    this.updateVisualization();
  }

  update(spring: SpringConfig, mode: 'simple' | 'advanced'): void {
    this.spring = spring;
    this.mode = mode;
    this.updateVisualization();
    // Update sliders if mode changed
    if (this.mode !== mode) {
      this.updateSliders();
    } else {
      // Just update values
      this.sliders.forEach(slider => slider.destroy());
      this.sliders = [];
      this.updateSliders();
    }
  }

  destroy(): void {
    this.sliders.forEach(slider => slider.destroy());
    this.folder.destroy();
  }

  getElement(): HTMLDivElement {
    return this.folder.getElement();
  }
}
