# TweakPine

**Real-time parameter tweaking for AlpineJS & Vanilla JS apps**

Inspired by [Dialkit](https://github.com/joshpuckett/dialkit) by Josh Puckett — reimagined for the AlpineJS/Vanilla JS ecosystem.

TweakPine is a lightweight, beautiful parameter tweaking panel that helps you fine-tune animations, colors, layouts, and more in real-time. Perfect for design iteration, creative coding, and prototyping.

## Features

- 🎨 **Dark glassmorphic UI** - Beautiful design inspired by Dialkit
- ⚡️ **Reactive** - Changes update instantly
- 🎯 **Type-safe** - Full TypeScript support
- 🌲 **AlpineJS & Vanilla JS** - Works with or without AlpineJS
- 🎬 **Motion.js animations** - Smooth spring-based interactions
- 💾 **Presets** - Save and load parameter configurations
- 🎛️ **Multiple control types** - Sliders, toggles, colors, select, text, spring configs, and more

## Installation

```bash
npm install tweakpine
```

### Peer Dependencies

- `motion` (>= 11.0.0) - For animations
- `alpinejs` (>= 3.0.0) - Only if using Alpine integration

Both are optional depending on your use case.

## Usage

### Vanilla JS

```js
import { TweakPine } from 'tweakpine';
import 'tweakpine/styles.css';

const panel = TweakPine.create('My Animation', {
  rotation: [15, 0, 360],     // [default, min, max]
  scale: [1, 0.5, 2, 0.1],    // [default, min, max, step]
  opacity: 0.8,               // Auto-infers range (0-1)
  color: '#ff0000',           // Color picker
  easing: {
    type: 'select',
    options: ['linear', 'ease-in', 'ease-out'],
    default: 'ease-out'
  },
  spring: {
    type: 'spring',
    stiffness: 200,
    damping: 25,
    mass: 1
  }
});

// Use reactive values
const box = document.querySelector('.box');
panel.on('change', () => {
  box.style.transform = `rotate(${panel.values.rotation}deg) scale(${panel.values.scale})`;
  box.style.opacity = panel.values.opacity;
  box.style.backgroundColor = panel.values.color;
});
```

### AlpineJS

```html
<script type="module">
  import Alpine from 'alpinejs';
  import { TweakPinePlugin } from 'tweakpine';
  import 'tweakpine/styles.css';

  Alpine.plugin(TweakPinePlugin);
  Alpine.start();
</script>

<div x-data="tweakpine('Animation Panel', {
  rotation: [15, 0, 360],
  opacity: 0.8,
  color: '#ff0000'
})">
  <div :style="{
    transform: `rotate(${$tweakpine.rotation}deg)`,
    opacity: $tweakpine.opacity,
    backgroundColor: $tweakpine.color
  }">
    Tweakable Box
  </div>
</div>
```

## Control Types

### Number (Slider)

```js
{
  // Single number - auto-infers range
  opacity: 0.5,
  
  // Tuple: [default, min, max]
  rotation: [45, 0, 360],
  
  // Tuple: [default, min, max, step]
  scale: [1, 0.1, 3, 0.05]
}
```

### Boolean (Toggle)

```js
{
  enabled: true,
  visible: false
}
```

### Color

```js
{
  // Auto-detects hex colors
  background: '#ff0000',
  
  // Explicit color config
  accent: {
    type: 'color',
    default: '#00ff00'
  }
}
```

### Select (Dropdown)

```js
{
  mode: {
    type: 'select',
    options: ['fast', 'slow', 'custom'],
    default: 'fast'
  },
  
  // With custom labels
  quality: {
    type: 'select',
    options: [
      { value: 'low', label: 'Low Quality' },
      { value: 'high', label: 'High Quality' }
    ]
  }
}
```

### Text Input

```js
{
  title: {
    type: 'text',
    default: 'Hello World',
    placeholder: 'Enter text...'
  }
}
```

### Spring Config

```js
{
  spring: {
    type: 'spring',
    // Simple mode (time-based)
    visualDuration: 0.3,
    bounce: 0.2,
    
    // OR advanced mode (physics-based)
    stiffness: 200,
    damping: 25,
    mass: 1
  }
}
```

You can switch between simple and advanced modes in the UI.

### Actions (Buttons)

```js
const panel = TweakPine.create('Controls', {
  reset: {
    type: 'action',
    label: 'Reset All'
  }
});

panel.on('action', (name) => {
  if (name === 'reset') {
    // Handle reset action
  }
});
```

### Folders (Nested Groups)

```js
{
  transform: {
    rotation: [0, 0, 360],
    scale: 1,
    _collapsed: false  // Start open
  },
  colors: {
    _collapsed: true,  // Start collapsed
    primary: '#ff0000',
    secondary: '#00ff00'
  }
}
```

## Panel Position

```js
TweakPine.create('Panel', config, {
  position: 'top-right'  // 'top-left' | 'bottom-right' | 'bottom-left'
});
```

## Presets

Save and load parameter configurations:

1. Click the **+** button in the panel toolbar
2. Enter a preset name
3. Switch between presets using the dropdown
4. Delete presets with the trash icon

Presets are stored in memory and lost on page reload. For persistence, listen to changes and save to localStorage:

```js
panel.on('change', (values) => {
  localStorage.setItem('myParams', JSON.stringify(values));
});
```

## API Reference

### Vanilla JS

```ts
import { TweakPine } from 'tweakpine';

const panel = TweakPine.create(name, config, options);

// Access values
panel.values.rotation  // Reactive getter

// Listen to changes
const unsubscribe = panel.on('change', (values) => { });

// Listen to actions
panel.on('action', (actionName) => { });

// Cleanup
panel.destroy();
```

### AlpineJS

```html
<div x-data="tweakpine(name, config, options)">
  <!-- Access values via $tweakpine magic -->
  {{ $tweakpine.rotation }}
</div>
```

## Styling

TweakPine uses CSS custom properties for theming:

```css
.tweakpine-root {
  --tweak-surface: rgba(255, 255, 255, 0.05);
  --tweak-glass-bg: #212121;
  --tweak-text-root: #FFFFFF;
  /* ... see theme.css for all variables */
}
```

## Motion.js Integration

TweakPine uses Motion.js for smooth animations. Spring configs from TweakPine can be passed directly to Motion:

```js
import { animate } from 'motion';

animate(element, { x: 100 }, panel.values.spring);
```

## Browser Support

- Modern browsers with ES2020 support
- Chrome/Edge 80+
- Firefox 75+
- Safari 13.1+

## Credits

Inspired by [Dialkit](https://github.com/joshpuckett/dialkit) by Josh Puckett. TweakPine reimagines Dialkit's elegant design and powerful features for the AlpineJS and Vanilla JS ecosystem.

## License

MIT License - see LICENSE file for details

## Contributing

Issues and pull requests welcome! This is a community project.

## Roadmap

- [ ] localStorage persistence helper
- [ ] Keyboard shortcuts
- [ ] Copy values to clipboard
- [ ] Import/export presets
- [ ] Custom control types
- [ ] Touch device support improvements

---

Made with ❤️ for the Alpine and vanilla JS community
