// ==UserScript==
// @name        com.google; arrange search pages
// @match       *://*.google.*/search*
// @version     1.0.0
// @description 2025-09-20
// @run-at      document-start
// @grant       GM_getValue
// @grant       GM_listValues
// @grant       GM_setValue
// @homepageURL https://github.com/ericchase/browseruserscripts
// ==/UserScript==

// src/lib/ericchase/Core_Promise_Deferred_Class.ts
class Class_Core_Promise_Deferred_Class {
  promise;
  reject;
  resolve;
  constructor() {
    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
    if (this.resolve === undefined || this.reject === undefined) {
      throw new Error(`${Class_Core_Promise_Deferred_Class.name}'s constructor failed to setup promise functions.`);
    }
  }
}
function Core_Promise_Deferred_Class() {
  return new Class_Core_Promise_Deferred_Class();
}

// src/lib/ericchase/Core_Promise_Orphan.ts
function Core_Promise_Orphan(promise) {}

// src/lib/ericchase/Core_Utility_Debounce.ts
function Core_Utility_Debounce(fn, delay_ms) {
  let deferred = Core_Promise_Deferred_Class();
  let timeout = undefined;
  async function async_callback(...args) {
    try {
      await fn(...args);
      deferred.resolve();
    } catch (error) {
      deferred.reject(error);
    } finally {
      deferred = Core_Promise_Deferred_Class();
    }
  }
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      Core_Promise_Orphan(async_callback(...args));
    }, delay_ms);
    return deferred.promise;
  };
}

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

// src/com.google; arrange search pages.user.ts
var init_search_page_order = ['Web', 'Images', 'Videos'];
setDefaultGMValue('absolute_search_page_order', init_search_page_order);
var user_search_page_order = GM_getValue('absolute_search_page_order', init_search_page_order);
main();
async function main() {
  const { div_main, div_more } = await getSearchPageListDivs();
  div_more.style.setProperty('display', 'none');
  const map_desired_name_to_index = new Map();
  {
    for (let i = 0; i < user_search_page_order.length; i++) {
      map_desired_name_to_index.set(user_search_page_order[i], i);
    }
  }
  const map_desired_name_to_element = new Map();
  const map_extras_name_to_element = new Map();
  const div_separator = document.createElement('div');
  div_separator.style.setProperty('width', '1em');
  const debounced_sort = Core_Utility_Debounce(() => {
    const sorted_items = [];
    for (const [name, index] of map_desired_name_to_index) {
      sorted_items[index] = map_desired_name_to_element.get(name);
    }
    sorted_items.push(div_separator);
    for (const name of Array.from(map_extras_name_to_element.keys()).sort()) {
      sorted_items.push(map_extras_name_to_element.get(name));
    }
    for (const item of sorted_items) {
      if (item) {
        div_main.appendChild(item);
      }
    }
  }, 50);
  for (const child of div_main.children) {
    if (map_desired_name_to_index.has(child.textContent)) {
      map_desired_name_to_element.set(child.textContent, child);
    } else {
      map_extras_name_to_element.set(child.textContent, child);
    }
    debounced_sort();
  }
  {
    const observer1 = WebPlatform_DOM_Element_Added_Observer_Class({
      selector: 'div[role="listitem"]',
      source: div_more,
    });
    observer1.subscribe((element1) => {
      if (map_desired_name_to_index.has(element1.textContent)) {
        map_desired_name_to_element.set(element1.textContent, element1);
      } else {
        map_extras_name_to_element.set(element1.textContent, element1);
      }
      debounced_sort();
    });
  }
}
function getSearchPageListDivs() {
  const { promise, resolve } = Core_Promise_Deferred_Class();
  const observer1 = WebPlatform_DOM_Element_Added_Observer_Class({
    selector: 'div[role="list"]',
  });
  observer1.subscribe((element1) => {
    const observer2 = WebPlatform_DOM_Element_Added_Observer_Class({
      selector: 'div[role="listitem"]',
      options: {
        subtree: false,
      },
      source: element1,
    });
    observer2.subscribe((element2) => {
      if (element2.textContent.startsWith('More')) {
        observer1.disconnect();
        observer2.disconnect();
        resolve({ div_main: element1, div_more: element2 });
      }
    });
  });
  return promise;
}
function setDefaultGMValue(key, value) {
  if (GM_getValue(key, undefined) === undefined) {
    GM_setValue(key, value);
  }
}
