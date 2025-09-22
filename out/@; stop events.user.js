// ==UserScript==
// @name        @; stop events
// @match       *://*/*
// @version     1.0.1
// @description 2024/07/22
// @run-at      document-start
// @grant       none
// @homepageURL https://github.com/ericchase/browseruserscripts
// ==/UserScript==

// src/@; stop events.user.ts
var event_list = ['afterscriptexecute', 'animationcancel', 'animationend', 'animationiteration', 'animationstart', 'auxclick', 'beforeinput', 'beforematch', 'beforescriptexecute', 'beforexrselect', 'blur', 'click', 'compositionend', 'compositionstart', 'compositionupdate', 'contentvisibilityautostatechange', 'contextmenu', 'copy', 'cut', 'dblclick', 'DOMMouseScroll', 'focus', 'focusin', 'focusout', 'fullscreenchange', 'fullscreenerror', 'gesturechange', 'gestureend', 'gesturestart', 'gotpointercapture', 'input', 'keydown', 'keypress', 'keyup', 'lostpointercapture', 'mousedown', 'mouseenter', 'mouseleave', 'mousemove', 'mouseout', 'mouseover', 'mouseup', 'mousewheel', 'MozMousePixelScroll', 'paste', 'pointercancel', 'pointerdown', 'pointerenter', 'pointerleave', 'pointermove', 'pointerout', 'pointerover', 'pointerrawupdate', 'pointerup', 'scroll', 'scrollend', 'securitypolicyviolation', 'touchcancel', 'touchend', 'touchmove', 'touchstart', 'transitioncancel', 'transitionend', 'transitionrun', 'transitionstart', 'webkitmouseforcechanged', 'webkitmouseforcedown', 'webkitmouseforceup', 'webkitmouseforcewillbegin', 'wheel'];
for (const evt of event_list) {
  document.addEventListener(evt, function (e) {
    e.stopImmediatePropagation();
    e.stopPropagation();
  });
  document.addEventListener(
    evt,
    function (e) {
      e.stopImmediatePropagation();
      e.stopPropagation();
    },
    { capture: true },
  );
}
