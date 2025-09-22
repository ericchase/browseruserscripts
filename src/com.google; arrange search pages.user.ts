// ==UserScript==
// @name        com.google; arrange search pages
// @match       *://*.google.*/search*
// @version     1.0.0
// @description 2025/09/20
// @run-at      document-start
// @grant       GM_getValue
// @grant       GM_listValues
// @grant       GM_setValue
// @homepageURL https://github.com/ericchase/browseruserscripts
// ==/UserScript==

import { Core_Promise_Deferred_Class } from './lib/ericchase/Core_Promise_Deferred_Class.js';
import { Core_Utility_Debounce } from './lib/ericchase/Core_Utility_Debounce.js';
import { WebPlatform_DOM_Element_Added_Observer_Class } from './lib/ericchase/WebPlatform_DOM_Element_Added_Observer_Class.js';

const init_search_page_order = ['Web', 'Images', 'Videos'];
setDefaultGMValue('absolute_search_page_order', init_search_page_order);
const user_search_page_order = GM_getValue('absolute_search_page_order', init_search_page_order);

main();

async function main() {
  const { div_main, div_more } = await getSearchPageListDivs();

  // hide More div
  (div_more as HTMLElement).style.setProperty('display', 'none');

  const map_desired_name_to_index = new Map<string, number>();
  {
    for (let i = 0; i < user_search_page_order.length; i++) {
      map_desired_name_to_index.set(user_search_page_order[i], i);
    }
  }
  const map_desired_name_to_element = new Map<string, Element>();
  const map_extras_name_to_element = new Map<string, Element>();

  // add separator
  const div_separator = document.createElement('div');
  div_separator.style.setProperty('width', '1em');

  const debounced_sort = Core_Utility_Debounce(() => {
    const sorted_items: Element[] = [];
    for (const [name, index] of map_desired_name_to_index) {
      sorted_items[index] = map_desired_name_to_element.get(name)!;
    }
    sorted_items.push(div_separator);
    for (const name of Array.from(map_extras_name_to_element.keys()).sort()) {
      sorted_items.push(map_extras_name_to_element.get(name)!);
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

  // watch for More items
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
  const { promise, resolve } = Core_Promise_Deferred_Class<{ div_main: Element; div_more: Element }>();
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

function setDefaultGMValue(key: string, value: any) {
  if (GM_getValue(key, undefined) === undefined) {
    GM_setValue(key, value);
  }
}
