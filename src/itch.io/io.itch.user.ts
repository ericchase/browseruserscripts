// ==UserScript==
// @name        itch.io: Test
// @author      ericchase, nazCodeland
// @namespace   ericchase
// @match       *://itch.io/*
// @version     1.0.0
// @description 5/5/2024, 7:21:16 PM
// @run-at      document-start
// @grant       none
// @homepageURL https://github.com/ericchase/browseruserscripts
// ==/UserScript==

import { ElementAddedObserver } from '../lib/ericchase/Platform/Web/DOM/MutationObserver/ElementAdded.js';
import { InjectCSS } from '../lib/ericchase/Platform/Web/InjectCSS.js';
import { Debounce } from '../lib/ericchase/Utility/Debounce.js';
import { NodeRef } from '../lib/ericchase/WebAPI/Node_Utility.js';
import heartcss from './assets/heart.css' assert { type: 'text' };
import heartsvg from './assets/heart.svg' assert { type: 'text' };
import { LocalStorageProvider } from './provider/storage/local-storage-provider.js';

InjectCSS(heartcss);

const storage = new LocalStorageProvider();

const favorites_set = new Set<string>(storage.get('favorites') ?? undefined);
const parser = new DOMParser();
const processed_set = new Set<HTMLDivElement>();

const storeFavoritesSet = Debounce(() => {
  storage.set('favorites', [...favorites_set]);
}, 50);

new ElementAddedObserver({
  selector: 'div.game_cell',
}).subscribe(async (element) => {
  if (element instanceof HTMLDivElement) {
    if (processed_set.has(element) === false) {
      processed_set.add(element);
      await processGameCell(element);
    }
  }
});

async function processGameCell(element: HTMLDivElement) {
  const game_id = element.getAttribute('data-game_id') ?? undefined;
  if (game_id !== undefined) {
    const icon = createHeartIcon();
    icon.classList.add('heart-icon');
    if (favorites_set.has(game_id) === true) {
      icon.classList.add('toggled');
    }
    icon.addEventListener('click', () => {
      if (favorites_set.has(game_id) === true) {
        favorites_set.delete(game_id);
        icon.classList.remove('toggled');
      } else {
        favorites_set.add(game_id);
        icon.classList.add('toggled');
      }
      storeFavoritesSet();
    });
    NodeRef(element.querySelector('a.title')).tryAs(HTMLAnchorElement)?.before(icon);
  }
}

function createHeartIcon() {
  const svg = NodeRef(parser.parseFromString(heartsvg, 'text/html').querySelector('svg')).as(SVGElement);
  svg.classList.add('heart-icon');
  return svg;
}
