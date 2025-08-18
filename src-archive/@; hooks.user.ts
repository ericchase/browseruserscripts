// Hook all navigations
['assign', 'replace'].forEach((fn) => {
  const orig = location[fn];
  location[fn] = function (url) {
    console.log('NAV via location.' + fn, url);
    return orig.call(this, url);
  };
});

['write', 'writeln', 'open'].forEach((fn) => {
  const orig = document[fn];
  document[fn] = function (...args) {
    console.log('DOM replaced via document.' + fn, args[0]?.slice(0, 200));
    return orig.apply(this, args);
  };
});

// Hook form submits
HTMLFormElement.prototype.submit = new Proxy(HTMLFormElement.prototype.submit, {
  apply(target, thisArg, args) {
    console.log('NAV via form.submit', thisArg.action);
    return Reflect.apply(target, thisArg, args);
  },
});

// Hook XHR requests
(function () {
  const origOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    this._url = url;
    this._method = method;
    console.log('XHR open', method, url);
    return origOpen.call(this, method, url, ...rest);
  };
  const origSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.send = function (body) {
    console.log('XHR send', this._method, this._url, body);
    this.addEventListener('load', () => {
      console.log('XHR load', this._url, this.status, this.responseText.slice(0, 200));
    });
    return origSend.call(this, body);
  };
})();

// Hook XHR responses
(function () {
  const origSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.send = function (...args) {
    this.addEventListener('load', function () {
      console.log('XHR completed', this.responseURL, this.responseText.slice(0, 200));
    });
    return origSend.apply(this, args);
  };
})();

// Detect history changes
['pushState', 'replaceState'].forEach((fn) => {
  const orig = history[fn];
  history[fn] = function (state, title, url) {
    console.log('History.' + fn, '→', url, 'state:', state);
    // return orig.apply(this, arguments);
  };
});

// DOM OPS

// Hook document-level methods
['write', 'writeln', 'open', 'close', 'execCommand', 'adoptNode', 'clear'].forEach((fn) => {
  if (document[fn]) {
    const orig = document[fn];
    document[fn] = function (...args) {
      console.log('document.' + fn, args);
      return orig.apply(this, args);
    };
  }
});

// Hook Node prototype methods
['appendChild', 'insertBefore', 'replaceChild', 'removeChild', 'cloneNode', 'normalize', 'remove'].forEach((fn) => {
  const orig = Node.prototype[fn];
  Node.prototype[fn] = function (...args) {
    console.log('Node.' + fn, this, args);
    switch (fn) {
      case 'insertBefore':
      case 'removeChild':
        // if (args[0].matches('div.x78zum5.xdt5ytf.x1t2pt76.x1n2onr6.x1ja2u2z.x10cihs4')) {
        // }
        break;
      default:
        return orig.apply(this, args);
    }
  };
});

// Hook Element-specific methods
['setAttribute', 'removeAttribute', 'insertAdjacentHTML', 'insertAdjacentElement', 'insertAdjacentText'].forEach((fn) => {
  const orig = Element.prototype[fn];
  Element.prototype[fn] = function (...args) {
    console.log('Element.' + fn, this, args);
    return orig.apply(this, args);
  };
});

// Hook property setters for content
['innerHTML', 'outerHTML', 'textContent', 'innerText'].forEach((prop) => {
  const proto = prop === 'innerText' ? HTMLElement.prototype : Node.prototype;
  const desc = Object.getOwnPropertyDescriptor(proto, prop);
  Object.defineProperty(proto, prop, {
    set: function (val) {
      console.log(prop + ' set on', this, val?.slice?.(0, 200) || val);
      return desc.set.call(this, val);
    },
  });
});

// Hook style and class changes
['className', 'id', 'value'].forEach((prop) => {
  const desc = Object.getOwnPropertyDescriptor(Element.prototype, prop);
  if (desc && desc.set) {
    Object.defineProperty(Element.prototype, prop, {
      set: function (val) {
        console.log(prop + ' set on', this, val);
        return desc.set.call(this, val);
      },
    });
  }
});

// Hook Shadow DOM
const origAttach = Element.prototype.attachShadow;
Element.prototype.attachShadow = function (init) {
  console.log('attachShadow on', this, init);
  return origAttach.call(this, init);
};
