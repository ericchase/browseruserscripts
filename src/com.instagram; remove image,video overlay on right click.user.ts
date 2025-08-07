// ==UserScript==
// @name        com.instagram; remove image,video overlay on right click
// @match       *://*.instagram.com/*
// @version     1.0.2
// @description 1/28/2022, 6:07:39 AM
// @run-at      document-end
// @grant       none
// @homepageURL https://github.com/ericchase/browseruserscripts
// ==/UserScript==

import { Core_Console_Log } from './lib/ericchase/Core_Console_Log.js';

function GetImageElement(element: Element) {
  const image = element.querySelector(':scope>div>img') ?? undefined;
  return { image };
}

function GetVideoElement(element: Element) {
  // The modal video is displayed in the sort of focused component that is
  // overlayed on top of the page. The page in the background is then
  // slightly obscurred with a transparent black mask.
  const video_modal = element.querySelector(':scope>div>div>div>video') ?? undefined;
  const video = element.parentElement?.parentElement?.querySelector(':scope>video') ?? undefined;
  return { video_modal, video };
}

function RemoveChildren(parent: Element, video_modal: Element) {
  const removal_list = [];
  for (const child of parent.children) {
    if (child !== video_modal && !child.contains(video_modal)) removal_list.push(child);
  }
  for (const element of removal_list) {
    element.remove();
  }
}

function RemoveOverlayElement(event: MouseEvent, target: Element) {
  if (event.button === 2) {
    const parent = target.parentElement ?? undefined;
    if (parent !== undefined) {
      const { image } = GetImageElement(parent);
      if (image !== undefined) {
        target.remove();
        return true;
      }
      const { video_modal, video } = GetVideoElement(parent);
      if (video_modal !== undefined) {
        video_modal.toggleAttribute('controls', true);
        RemoveChildren(parent, video_modal);
        return true;
      }
      if (video !== undefined) {
        video.toggleAttribute('controls', true);
        parent.remove();
        return true;
      }
      Core_Console_Log('No overlay found?');
      return false;
    }
  }
}

function PreventContextMenuPopupOnce(event: PointerEvent) {
  window.removeEventListener('contextmenu', PreventContextMenuPopupOnce);
  event.preventDefault();
}

function MouseDownListener(event: MouseEvent) {
  if (event.target instanceof Element) {
    if (RemoveOverlayElement(event, event.target)) {
      window.addEventListener('contextmenu', PreventContextMenuPopupOnce);
      event.preventDefault();
      event.stopImmediatePropagation();
      event.stopPropagation();
    }
  }
}

document.body.addEventListener('mousedown', MouseDownListener);
