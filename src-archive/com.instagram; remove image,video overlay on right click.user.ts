// ==UserScript==
// @name        com.instagram; remove image,video overlay on right click
// @match       *://*.instagram.com/*
// @version     1.0.3
// @description 2022/01/28
// @run-at      document-end
// @grant       none
// @homepageURL https://github.com/ericchase/browseruserscripts
// ==/UserScript==

// !! Not Working

import { WebPlatform_DOM_Element_Added_Observer_Class } from './lib/ericchase/WebPlatform_DOM_Element_Added_Observer_Class.js';

const selector_image = 'img[alt^="Photo shared by"],img[alt^="Photo by"]';
const selector_image_container = 'div[role="button"]';
const selector_popup_scrollview_container = 'body>div:has(>div#scrollview)';

// const map_image_to_container_path = new Map<HTMLImageElement, HTMLElement[]>();

WebPlatform_DOM_Element_Added_Observer_Class({
  selector: selector_image,
}).subscribe((image, unsubscribe) => {
  if (image instanceof HTMLImageElement) {
    const container = image.closest(selector_image_container);
    if (container instanceof HTMLDivElement) {
      // map_image_to_container_path.set(image, getElementPath(container, image));
      consumeAllPointerEvents(container);
      // const div_mousetrap = container.children[1];
      // if (div_mousetrap instanceof HTMLDivElement) {
      //   div_mousetrap.remove();
      // }
    }
  }
});

WebPlatform_DOM_Element_Added_Observer_Class({
  selector: selector_popup_scrollview_container,
}).subscribe((container, unsubscribe) => {
  if (container instanceof HTMLDivElement) {
    container.style.setProperty('visibility', 'hidden');
  }
});

function consumeAllPointerEvents(element: HTMLElement) {
  for (const eventType of ['click', 'contextmenu', 'dblclick', 'mousedown', 'mousemove', 'mouseup', 'pointercancel', 'pointerdown', 'pointerenter', 'pointerleave', 'pointermove', 'pointerout', 'pointerover', 'pointerup', 'touchcancel', 'touchend', 'touchmove', 'touchstart']) {
    element[`on${eventType}` as keyof GlobalEventHandlers] = (event: any) => {
      event.stopImmediatePropagation();
      event.stopPropagation();
      const { target } = event;
      if (target !== element && target instanceof HTMLDivElement) {
        target.style.setProperty('pointer-events', 'none');
        console.log(event.target, event.currentTarget);
        // event.target.remove();
      }
    };
  }
  element.ondragstart = (event) => {
    event.preventDefault();
  };
  element.style.setProperty('cursor', 'default');
}

function getElementPath(ancestor: HTMLElement, descendant: HTMLElement) {
  const path = [];
  let current = descendant.parentElement;
  while (current !== null && current !== ancestor) {
    path.push(current);
    current = current.parentElement;
  }
  return path.reverse();
}

// function GetImageElement(element: Element) {
//   const image = element.querySelector(':scope>div>img') ?? undefined;
//   return { image };
// }

// function GetVideoElement(element: Element) {
//   // The modal video is displayed in the sort of focused component that is
//   // overlaid on top of the page. The page in the background is then slightly
//   // obscured with a transparent black mask.
//   const video_modal = element.querySelector(':scope>div>div>div>video') ?? undefined;
//   const video = element.parentElement?.parentElement?.querySelector(':scope>video') ?? undefined;
//   return { video_modal, video };
// }

// function RemoveChildren(parent: Element, video_modal: Element) {
//   const removal_list = [];
//   for (const child of parent.children) {
//     if (child !== video_modal && !child.contains(video_modal)) removal_list.push(child);
//   }
//   for (const element of removal_list) {
//     element.remove();
//   }
// }

// function RemoveOverlayElement(event: MouseEvent, target: Element) {
//   if (event.button === 2) {
//     const parent = target.parentElement ?? undefined;
//     if (parent !== undefined) {
//       const { image } = GetImageElement(parent);
//       if (image !== undefined) {
//         target.remove();
//         return true;
//       }
//       const { video_modal, video } = GetVideoElement(parent);
//       if (video_modal !== undefined) {
//         video_modal.toggleAttribute('controls', true);
//         RemoveChildren(parent, video_modal);
//         return true;
//       }
//       if (video !== undefined) {
//         video.toggleAttribute('controls', true);
//         parent.remove();
//         return true;
//       }
//       Core_Console_Log('No overlay found?');
//       return false;
//     }
//   }
// }

// function PreventContextMenuPopupOnce(event: PointerEvent) {
//   window.removeEventListener('contextmenu', PreventContextMenuPopupOnce);
//   event.preventDefault();
// }

// function MouseDownListener(event: MouseEvent) {
//   if (event.target instanceof Element) {
//     if (RemoveOverlayElement(event, event.target)) {
//       window.addEventListener('contextmenu', PreventContextMenuPopupOnce);
//       event.preventDefault();
//       event.stopImmediatePropagation();
//       event.stopPropagation();
//     }
//   }
// }

// document.body.addEventListener('mousedown', MouseDownListener);
