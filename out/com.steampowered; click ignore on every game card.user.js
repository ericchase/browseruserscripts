// ==UserScript==
// @name        com.steampowered; click ignore on every game card
// @match       https://store.steampowered.com/curator/*
// @version     1.0.1
// @description 2026/03/17 - Experimental. Use at own risk.
// @run-at      document-start
// @grant       none
// @homepageURL https://github.com/ericchase/browseruserscripts
// ==/UserScript==

// src/lib/ericchase/WebPlatform_DOM_Element_Added_Observer_Class.ts
class Class_WebPlatform_DOM_Element_Added_Observer_Class {
  config;
  $match_set = new Set();
  $mutation_observer;
  $subscription_set = new Set();
  constructor(config) {
    this.config = {
      include_existing_elements: config.include_existing_elements ?? true,
      options: {
        subtree: config.options?.subtree ?? true,
      },
      selector: config.selector,
      source: config.source ?? document.documentElement,
    };
    this.$mutation_observer = new MutationObserver((mutationRecords) => {
      const sent_set = new Set();
      for (const record of mutationRecords) {
        for (const node of record.addedNodes) {
          const tree_walker = document.createTreeWalker(node, NodeFilter.SHOW_ELEMENT);
          const processCurrentNode = () => {
            if (sent_set.has(tree_walker.currentNode) === false) {
              if (tree_walker.currentNode instanceof Element && tree_walker.currentNode.matches(this.config.selector) === true) {
                this.$send(tree_walker.currentNode);
                sent_set.add(tree_walker.currentNode);
              }
            }
          };
          processCurrentNode();
          if (this.config.options.subtree === true) {
            while (tree_walker.nextNode()) {
              processCurrentNode();
            }
          }
        }
      }
    });
    this.$mutation_observer.observe(this.config.source, {
      childList: true,
      subtree: this.config.options.subtree,
    });
    if (this.config.include_existing_elements === true) {
      if (this.config.options.subtree === true) {
        const sent_set = new Set();
        const tree_walker = document.createTreeWalker(this.config.source, NodeFilter.SHOW_ELEMENT);
        const processCurrentNode = () => {
          if (sent_set.has(tree_walker.currentNode) === false) {
            if (tree_walker.currentNode instanceof Element && tree_walker.currentNode.matches(this.config.selector) === true) {
              this.$send(tree_walker.currentNode);
              sent_set.add(tree_walker.currentNode);
            }
          }
        };
        while (tree_walker.nextNode()) {
          processCurrentNode();
        }
      } else {
        for (const child of this.config.source.childNodes) {
          if (child instanceof Element && child.matches(this.config.selector) === true) {
            this.$send(child);
          }
        }
      }
    }
  }
  disconnect() {
    this.$mutation_observer.disconnect();
    for (const callback of this.$subscription_set) {
      this.$subscription_set.delete(callback);
    }
  }
  subscribe(callback) {
    this.$subscription_set.add(callback);
    let abort = false;
    for (const element of this.$match_set) {
      callback(element, () => {
        this.$subscription_set.delete(callback);
        abort = true;
      });
      if (abort) {
        return () => {};
      }
    }
    return () => {
      this.$subscription_set.delete(callback);
    };
  }
  $send(element) {
    this.$match_set.add(element);
    for (const callback of this.$subscription_set) {
      callback(element, () => {
        this.$subscription_set.delete(callback);
      });
    }
  }
}
function WebPlatform_DOM_Element_Added_Observer_Class(config) {
  return new Class_WebPlatform_DOM_Element_Added_Observer_Class(config);
}

// src/lib/ericchase/WebPlatform_Node_Reference_Class.ts
class Class_WebPlatform_Node_Reference_Class {
  node;
  constructor(node) {
    this.node = node;
  }
  as(constructor_ref) {
    if (this.node instanceof constructor_ref) {
      return this.node;
    }
    throw new TypeError(`Reference node ${this.node} is not ${constructor_ref}`);
  }
  is(constructor_ref) {
    return this.node instanceof constructor_ref;
  }
  passAs(constructor_ref, fn) {
    if (this.node instanceof constructor_ref) {
      fn(this.node);
    }
  }
  tryAs(constructor_ref) {
    if (this.node instanceof constructor_ref) {
      return this.node;
    }
  }
  get classList() {
    return this.as(HTMLElement).classList;
  }
  get className() {
    return this.as(HTMLElement).className;
  }
  get style() {
    return this.as(HTMLElement).style;
  }
  getAttribute(qualifiedName) {
    return this.as(HTMLElement).getAttribute(qualifiedName);
  }
  setAttribute(qualifiedName, value) {
    this.as(HTMLElement).setAttribute(qualifiedName, value);
  }
  getStyleProperty(property) {
    return this.as(HTMLElement).style.getPropertyValue(property);
  }
  setStyleProperty(property, value, priority) {
    this.as(HTMLElement).style.setProperty(property, value, priority);
  }
}
function WebPlatform_Node_Reference_Class(node) {
  return new Class_WebPlatform_Node_Reference_Class(node);
}

// src/com.steampowered; click ignore on every game card.user.ts
var process_index = 0;
var process_list = [];
var process_timer_id = undefined;
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
  }, 500);
}
function process_clear_timeout() {
  console.log('timer stopped');
  clearTimeout(process_timer_id);
  process_timer_id = undefined;
}
function process_enqueue(element) {
  process_list.push(element);
  if (process_timer_id === undefined) {
    process_set_timeout();
  }
}
function async_process_node(element) {
  return new Promise((resolve, reject) => {
    const timer_id = setTimeout(() => {
      return reject();
    }, 1000);
    const parent = element.parentElement;
    if (parent) {
      parent.addEventListener('mouseover', function handler() {
        parent.removeEventListener('mouseover', handler);
        element.click();
        clearTimeout(timer_id);
        return resolve();
      });
      element.dispatchEvent(new MouseEvent('mouseover', { view: window, bubbles: true, cancelable: true }));
    }
  });
}
var disconnect_functions = [];
function main_start() {
  const observer_options = WebPlatform_DOM_Element_Added_Observer_Class({
    selector: 'div.ds_options',
  });
  const observer_ignore = WebPlatform_DOM_Element_Added_Observer_Class({
    selector: 'div.option',
  });
  disconnect_functions.push(observer_options.disconnect, observer_ignore.disconnect);
  observer_options.subscribe((element) => {
    if (element instanceof HTMLDivElement) {
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
  node;
  slot = new Map();
  constructor(props) {
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
  append(tag, ...children) {
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
  node;
  slot = new Map();
  constructor(props) {
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
  append(tag, ...children) {
    this.slot.get(tag)?.append(...children);
  }
}
class SVG_ICON_GRIP {
  static DEFAULT_PROPS() {
    return {
      style: {
        'background-color': 'transparent',
        'border-radius': '0',
        'width': 12,
        'height': 18,
      },
      dot_color: 'black',
      dot_radius: 1,
    };
  }
  node;
  constructor(props) {
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
var body_observer = WebPlatform_DOM_Element_Added_Observer_Class({
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
    let pointerMoveHandler = function (event) {
      panel.node.style.setProperty('top', event.clientY - iconY + 'px');
      panel.node.style.setProperty('left', event.clientX - iconX + 'px');
    };
    const row = new FLEXBOX(FLEXBOX.DEFAULT_PROPS());
    panel.append('main', row.node);
    const icon = new SVG_ICON_GRIP({
      style: {
        'background-color': 'transparent',
        'border-radius': '0',
        'width': 16,
        'height': 24,
      },
      dot_color: 'black',
      dot_radius: 1,
    });
    row.append('main', icon.node);
    icon.node.style.setProperty('cursor', 'grab');
    let iconX = 0;
    let iconY = 0;
    let panelRect = panel.node.getBoundingClientRect();
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
