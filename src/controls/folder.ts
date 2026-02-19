// Folder control - collapsible group with motion animations
import { animate, type AnimationControls } from 'motion';

export interface FolderOptions {
  title: string;
  defaultOpen?: boolean;
  isRoot?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
}

export class Folder {
  private container: HTMLDivElement;
  private header: HTMLDivElement;
  private content: HTMLDivElement;
  private inner: HTMLDivElement;
  private chevron: SVGSVGElement | null = null;
  private isOpen: boolean;
  private isRoot: boolean;
  private onOpenChange?: (isOpen: boolean) => void;
  private contentAnimation: AnimationControls | null = null;

  constructor(options: FolderOptions) {
    this.isOpen = options.defaultOpen ?? true;
    this.isRoot = options.isRoot ?? false;
    this.onOpenChange = options.onOpenChange;

    this.container = document.createElement('div');
    this.container.className = this.isRoot ? 'tweakpine-folder tweakpine-folder-root' : 'tweakpine-folder';

    // Header
    this.header = document.createElement('div');
    this.header.className = this.isRoot ? 'tweakpine-folder-header tweakpine-panel-header' : 'tweakpine-folder-header';
    this.header.addEventListener('click', () => this.toggle());

    const headerTop = document.createElement('div');
    headerTop.className = 'tweakpine-folder-header-top';

    const titleRow = document.createElement('div');
    titleRow.className = 'tweakpine-folder-title-row';

    const title = document.createElement('span');
    title.className = this.isRoot ? 'tweakpine-folder-title tweakpine-folder-title-root' : 'tweakpine-folder-title';
    title.textContent = options.title;
    titleRow.appendChild(title);

    headerTop.appendChild(titleRow);

    if (this.isRoot) {
      // Root panel icon
      const icon = this.createPanelIcon();
      icon.setAttribute('class', 'tweakpine-panel-icon');
      headerTop.appendChild(icon);
    } else {
      // Chevron for folders
      this.chevron = this.createChevron();
      headerTop.appendChild(this.chevron);
    }

    this.header.appendChild(headerTop);
    this.container.appendChild(this.header);

    // Content
    this.content = document.createElement('div');
    this.content.className = 'tweakpine-folder-content';
    this.content.style.overflow = 'hidden';

    this.inner = document.createElement('div');
    this.inner.className = 'tweakpine-folder-inner';
    this.content.appendChild(this.inner);

    this.container.appendChild(this.content);

    // Initialize state
    if (!this.isOpen) {
      this.content.style.height = '0px';
      this.content.style.opacity = '0';
    }
  }

  private createChevron(): SVGSVGElement {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.classList.add('tweakpine-folder-icon');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2.5');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M6 9.5L12 15.5L18 9.5');
    svg.appendChild(path);

    // Set initial rotation
    svg.style.transform = this.isOpen ? 'rotate(0deg)' : 'rotate(180deg)';

    return svg;
  }

  private createPanelIcon(): SVGSVGElement {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 16 16');
    svg.setAttribute('fill', 'none');

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('opacity', '0.5');
    path.setAttribute('d', 'M6.84766 11.75C6.78583 11.9899 6.75 12.2408 6.75 12.5C6.75 12.7592 6.78583 13.0101 6.84766 13.25H2C1.58579 13.25 1.25 12.9142 1.25 12.5C1.25 12.0858 1.58579 11.75 2 11.75H6.84766ZM14 11.75C14.4142 11.75 14.75 12.0858 14.75 12.5C14.75 12.9142 14.4142 13.25 14 13.25H12.6523C12.7142 13.0101 12.75 12.7592 12.75 12.5C12.75 12.2408 12.7142 11.9899 12.6523 11.75H14ZM3.09766 7.25C3.03583 7.48994 3 7.74075 3 8C3 8.25925 3.03583 8.51006 3.09766 8.75H2C1.58579 8.75 1.25 8.41421 1.25 8C1.25 7.58579 1.58579 7.25 2 7.25H3.09766ZM14 7.25C14.4142 7.25 14.75 7.58579 14.75 8C14.75 8.41421 14.4142 8.75 14 8.75H8.90234C8.96417 8.51006 9 8.25925 9 8C9 7.74075 8.96417 7.48994 8.90234 7.25H14ZM7.59766 2.75C7.53583 2.98994 7.5 3.24075 7.5 3.5C7.5 3.75925 7.53583 4.01006 7.59766 4.25H2C1.58579 4.25 1.25 3.91421 1.25 3.5C1.25 3.08579 1.58579 2.75 2 2.75H7.59766ZM14 2.75C14.4142 2.75 14.75 3.08579 14.75 3.5C14.75 3.91421 14.4142 4.25 14 4.25H13.4023C13.4642 4.01006 13.5 3.75925 13.5 3.5C13.5 3.24075 13.4642 2.98994 13.4023 2.75H14Z');
    path.setAttribute('fill', 'currentColor');
    svg.appendChild(path);

    const circles = [
      { cx: '6', cy: '8' },
      { cx: '10.4999', cy: '3.5' },
      { cx: '9.75015', cy: '12.5' },
    ];

    circles.forEach(({ cx, cy }) => {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', cx);
      circle.setAttribute('cy', cy);
      circle.setAttribute('r', '0.998');
      circle.setAttribute('fill', 'currentColor');
      circle.setAttribute('stroke', 'currentColor');
      circle.setAttribute('stroke-width', '1.25');
      svg.appendChild(circle);
    });

    return svg;
  }

  private toggle(): void {
    this.isOpen = !this.isOpen;
    this.onOpenChange?.(this.isOpen);

    if (this.chevron) {
      animate(
        this.chevron,
        { rotate: this.isOpen ? 0 : 180 },
        { duration: 0.35, easing: [0.4, 0, 0.2, 1] }
      );
    }

    if (!this.isRoot) {
      if (this.isOpen) {
        // Opening: measure height and animate
        this.content.style.height = 'auto';
        const targetHeight = this.content.scrollHeight;
        this.content.style.height = '0px';

        if (this.contentAnimation) {
          this.contentAnimation.stop();
        }

        this.contentAnimation = animate(
          this.content,
          { height: `${targetHeight}px`, opacity: 1 },
          { duration: 0.35, easing: [0.4, 0, 0.2, 1] }
        );

        this.contentAnimation.finished.then(() => {
          this.content.style.height = 'auto';
        });
      } else {
        // Closing
        const currentHeight = this.content.scrollHeight;
        this.content.style.height = `${currentHeight}px`;

        if (this.contentAnimation) {
          this.contentAnimation.stop();
        }

        this.contentAnimation = animate(
          this.content,
          { height: '0px', opacity: 0 },
          { duration: 0.35, easing: [0.4, 0, 0.2, 1] }
        );
      }
    }
  }

  appendChild(element: HTMLElement): void {
    this.inner.appendChild(element);
  }

  destroy(): void {
    if (this.contentAnimation) {
      this.contentAnimation.stop();
    }
    this.container.remove();
  }

  getElement(): HTMLDivElement {
    return this.container;
  }

  getInner(): HTMLDivElement {
    return this.inner;
  }

  isRootFolder(): boolean {
    return this.isRoot;
  }
}
