// ==UserScript==
// @name        com.steampowered; click ignore on every game card
// @match       https://store.steampowered.com/curator/*
// @version     1.0.0
// @description 2026/03/17 - Experimental. Use at own risk.
// @run-at      document-start
// @grant       none
// @homepageURL https://github.com/ericchase/browseruserscripts
// ==/UserScript==

import { WebPlatform_DOM_Element_Added_Observer_Class } from './lib/ericchase/WebPlatform_DOM_Element_Added_Observer_Class.js';
import { WebPlatform_Node_Reference_Class } from './lib/ericchase/WebPlatform_Node_Reference_Class.js';

let process_index = 0;
const process_list: HTMLDivElement[] = [];
let process_timer_id: NodeJS.Timeout | undefined = undefined;

function process_set_timeout() {
  console.log('timer started');
  process_timer_id = setTimeout(async () => {
    await async_process_node(process_list[process_index]);
    process_index++;
    if (process_index < process_list.length) {
      process_set_timeout();
    } else {
      process_clear_timeout();
    }
  }, 50);
}

function process_clear_timeout() {
  console.log('timer stopped');
  clearTimeout(process_timer_id);
  process_timer_id = undefined;
}

function process_enqueue(element: HTMLDivElement) {
  process_list.push(element);
  if (process_timer_id === undefined) {
    process_set_timeout();
  }
}

function async_process_node(element: HTMLDivElement) {
  return new Promise<void>((resolve, reject) => {
    const timer_id = setTimeout(() => {
      return reject();
    }, 1000);
    // trigger mouseover
    const parent = element.parentElement;
    if (parent) {
      parent.addEventListener('mouseover', function handler() {
        parent.removeEventListener('mouseover', handler);
        // click to open menu
        element.click();
        clearTimeout(timer_id);
        return resolve();
      });
      element.dispatchEvent(new MouseEvent('mouseover', { view: window, bubbles: true, cancelable: true }));
    }
  });
}

const disconnect_functions: (() => void)[] = [];

function main_start() {
  // <div class="ds_options" aria-describedby="tooltip-20"><div></div></div>
  const observer_options = WebPlatform_DOM_Element_Added_Observer_Class({
    selector: 'div.ds_options',
  });

  // <div class="option">Ignore</div>
  const observer_ignore = WebPlatform_DOM_Element_Added_Observer_Class({
    selector: 'div.option',
  });

  disconnect_functions.push(
    observer_options.disconnect,
    observer_ignore.disconnect,
    //
  );

  observer_options.subscribe((element) => {
    if (element instanceof HTMLDivElement) {
      // check if visible
      const { width, height } = element.getBoundingClientRect();
      if (width > 0 && height > 0) {
        process_enqueue(element);
      }
    }
  });
  observer_ignore.subscribe((element) => {
    console.log(element);
    if (element instanceof HTMLDivElement) {
      if (element.textContent === 'Ignore') {
        element.click();
      }
    }
  });
}
function main_stop() {
  process_clear_timeout();
  for (const disconnect of disconnect_functions) {
    disconnect();
  }
  disconnect_functions.length = 0;
  process_index = 0;
  process_list.length = 0;
}

class FLOATING_PANEL {
  static DEFAULT_PROPS() {
    return {
      style: {
        'background-color': 'white',
        'border-radius': '0',
        'width': 'max-content',
        'height': 'max-content',
        'z-index': 9999,
      },
    };
  }
  node: HTMLDivElement;
  slot = new Map<'main', HTMLSlotElement>();
  constructor(props: ReturnType<typeof FLOATING_PANEL.DEFAULT_PROPS>) {
    const html = `
      <div style="background-color:${props.style['background-color']};border-radius:${props.style['border-radius']};width:${props.style.width};height:${props.style.height};z-index:${props.style['z-index']};position:fixed;top:8px;right:8px;">
        <slot data-tag="main"></slot>
      </div>
    `;
    try {
      this.node = WebPlatform_Node_Reference_Class(new DOMParser().parseFromString(html, 'text/html').body.firstElementChild).as(HTMLDivElement);
      this.slot.set('main', WebPlatform_Node_Reference_Class(this.node.querySelector('slot[data-tag="main"]')).as(HTMLSlotElement));
    } catch (error) {
      throw new Error(`${FLOATING_PANEL.name}: Parse error. Props: ${JSON.stringify(props)}, ${error}`);
    }
  }
  append(tag: 'main', ...children: Node[]) {
    this.slot.get(tag)?.append(...children);
  }
}

class FLEXBOX {
  static DEFAULT_PROPS() {
    return {
      style: {
        'flex-flow': 'row nowrap',
        'gap': '0 0',
      },
    };
  }
  node: HTMLDivElement;
  slot = new Map<'main', HTMLSlotElement>();
  constructor(props: ReturnType<typeof FLEXBOX.DEFAULT_PROPS>) {
    const html = `
      <div style="display:flex;flex-flow:${props.style['flex-flow']};gap:${props.style['gap']};">
        <slot data-tag="main"></slot>
      </div>
    `;
    try {
      this.node = WebPlatform_Node_Reference_Class(new DOMParser().parseFromString(html, 'text/html').body.firstElementChild).as(HTMLDivElement);
      this.slot.set('main', WebPlatform_Node_Reference_Class(this.node.querySelector('slot[data-tag="main"]')).as(HTMLSlotElement));
    } catch (error) {
      throw new Error(`${FLEXBOX.name}: Parse error. Props: ${JSON.stringify(props)}, ${error}`);
    }
  }
  append(tag: 'main', ...children: Node[]) {
    this.slot.get(tag)?.append(...children);
  }
}

class SVG_ICON_X {
  static DEFAULT_PROPS() {
    return {
      style: {
        'background-color': 'transparent',
        'border-radius': '0',
        'width': 16, // pixels
        'height': 16, // pixels
      },
      line_color: 'black',
      line_size: 8,
    };
  }
  node: SVGElement;
  constructor(props: ReturnType<typeof SVG_ICON_X.DEFAULT_PROPS>) {
    const html = `
      <svg style="background-color:${props.style['background-color']};border-radius:${props.style['border-radius']};width:${props.style.width}px;height:${props.style.height}px;" viewBox="-${props.style.width / 2} -${props.style.height / 2} ${props.style.width} ${props.style.height}" fill="none" stroke="${props.line_color}" xmlns="http://www.w3.org/2000/svg">
        <line x1="-${props.line_size / 2}" y1="-${props.line_size / 2}" x2="${props.line_size / 2}" y2="${props.line_size / 2}" />
        <line x1="-${props.line_size / 2}" y1="${props.line_size / 2}" x2="${props.line_size / 2}" y2="-${props.line_size / 2}" />
      </svg>
    `;
    try {
      this.node = WebPlatform_Node_Reference_Class(new DOMParser().parseFromString(html, 'text/html').body.firstElementChild).as(SVGElement);
    } catch (error) {
      throw new Error(`${FLOATING_PANEL.name}: Parse error. Props: ${JSON.stringify(props)}, ${error}`);
    }
  }
}

class SVG_ICON_GRIP {
  static DEFAULT_PROPS() {
    return {
      style: {
        'background-color': 'transparent',
        'border-radius': '0',
        'width': 12, // pixels
        'height': 18, // pixels
      },
      dot_color: 'black',
      dot_radius: 1,
    };
  }
  node: SVGElement;
  constructor(props: ReturnType<typeof SVG_ICON_GRIP.DEFAULT_PROPS>) {
    const html = `
      <svg style="background-color:${props.style['background-color']};border-radius:${props.style['border-radius']};width:${props.style.width}px;height:${props.style.height}px;" viewBox="-${props.style.width / 2} -${props.style.height / 2} ${props.style.width} ${props.style.height}" fill="${props.dot_color}" stroke="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="circle-row" width="6" height="6" patternUnits="userSpaceOnUse">
            <circle cx="3" cy="3" r="${props.dot_radius}" />
          </pattern>
        </defs>
        <rect x="0" y="0" width="6" height="18" fill="url(#circle-row)" style="transform-box: fill-box; transform: translate(-50%, -50%)" />
      </svg>
    `;
    try {
      this.node = WebPlatform_Node_Reference_Class(new DOMParser().parseFromString(html, 'text/html').body.firstElementChild).as(SVGElement);
    } catch (error) {
      throw new Error(`${FLOATING_PANEL.name}: Parse error. Props: ${JSON.stringify(props)}, ${error}`);
    }
  }
}

const body_observer = WebPlatform_DOM_Element_Added_Observer_Class({
  selector: 'body',
});
body_observer.subscribe((body) => {
  body_observer.disconnect();

  const panel = new FLOATING_PANEL({
    style: {
      'background-color': 'white',
      'border-radius': '4px',
      'width': 'max-content',
      'height': 'max-content',
      'z-index': 9999,
    },
  });
  body.appendChild(panel.node);
  panel.node.style.setProperty('color', 'black');
  panel.node.style.setProperty('line-height', '20px');
  {
    const row = new FLEXBOX(FLEXBOX.DEFAULT_PROPS());
    panel.append('main', row.node);

    const icon = new SVG_ICON_GRIP({
      style: {
        'background-color': 'transparent',
        'border-radius': '0',
        'width': 16, // pixels
        'height': 24, // pixels
      },
      dot_color: 'black',
      dot_radius: 1,
    });
    row.append('main', icon.node);
    icon.node.style.setProperty('cursor', 'grab');
    let iconX = 0;
    let iconY = 0;
    let panelRect = panel.node.getBoundingClientRect();
    function pointerMoveHandler(event: PointerEvent) {
      panel.node.style.setProperty('top', event.clientY - iconY + 'px');
      panel.node.style.setProperty('left', event.clientX - iconX + 'px');
    }
    icon.node.onpointerdown = function (event) {
      event.preventDefault();
      event.stopImmediatePropagation();
      event.stopPropagation();
      iconX = event.offsetX;
      iconY = event.offsetY;
      panelRect = panel.node.getBoundingClientRect();
      icon.node.style.setProperty('cursor', 'grabbing');
      window.addEventListener('pointermove', pointerMoveHandler);
    };
    icon.node.onpointerup = function (event) {
      event.preventDefault();
      event.stopImmediatePropagation();
      event.stopPropagation();
      iconX = 0;
      iconY = 0;
      icon.node.style.setProperty('cursor', 'grab');
      icon.node.onpointermove = null;
      window.removeEventListener('pointermove', pointerMoveHandler);
    };

    const button = document.createElement('button');
    row.append('main', button);
    button.textContent = 'Ignore All';
    button.style.setProperty('border', 'none');
    button.style.setProperty('border-radius', '4px');
    button.style.setProperty('cursor', 'pointer');
    button.style.setProperty('font-size', '13px');
    button.style.setProperty('padding-inline', '4px');
    let running = false;
    button.onclick = function () {
      if (running === false) {
        running = true;
        main_start();
      } else {
        running = false;
        main_stop();
      }
    };
  }
});
