const isObject = (value) => value !== null && typeof value === 'object';

function createReactive(target, notify) {
  if (!isObject(target)) {
    return target;
  }

  const cache = new WeakMap();

  const wrap = (obj) => {
    if (!isObject(obj)) {
      return obj;
    }

    if (cache.has(obj)) {
      return cache.get(obj);
    }

    const proxy = new Proxy(obj, {
      get(original, key, receiver) {
        const value = Reflect.get(original, key, receiver);

        if (Array.isArray(original) && typeof value === 'function') {
          return function (...args) {
            const result = value.apply(original, args);
            notify();
            return result;
          };
        }

        if (typeof value === 'function') {
          return value.bind(proxy);
        }

        if (isObject(value)) {
          return wrap(value);
        }

        return value;
      },
      set(original, key, value, receiver) {
        const result = Reflect.set(original, key, value, receiver);
        notify();
        return result;
      },
      deleteProperty(original, key) {
        const result = Reflect.deleteProperty(original, key);
        notify();
        return result;
      }
    });

    cache.set(obj, proxy);
    return proxy;
  };

  return wrap(target);
}

function createElement(vnode) {
  if (vnode == null || vnode === false) {
    return document.createComment('');
  }

  if (typeof vnode === 'string' || typeof vnode === 'number') {
    return document.createTextNode(String(vnode));
  }

  if (vnode.type === Fragment) {
    const fragment = document.createDocumentFragment();
    vnode.children.forEach((child) => {
      fragment.appendChild(createElement(child));
    });
    return fragment;
  }

  const el = document.createElement(vnode.type);

  const props = vnode.props || {};
  Object.keys(props).forEach((key) => {
    const value = props[key];
    if (key.startsWith('on') && typeof value === 'function') {
      const eventName = key.slice(2).toLowerCase();
      el.addEventListener(eventName, value);
      return;
    }

    if (key === 'class') {
      el.className = value || '';
      return;
    }

    if (key === 'style' && isObject(value)) {
      Object.assign(el.style, value);
      return;
    }

    if (key in el) {
      el[key] = value;
    } else if (value !== false && value != null) {
      el.setAttribute(key, value);
    }
  });

  vnode.children.forEach((child) => {
    el.appendChild(createElement(child));
  });

  return el;
}

export const Fragment = Symbol('Fragment');

export function h(type, props = {}, ...children) {
  const normalizedChildren = [];
  children.forEach((child) => {
    if (Array.isArray(child)) {
      normalizedChildren.push(...child);
    } else {
      normalizedChildren.push(child);
    }
  });

  return { type, props, children: normalizedChildren };
}

export function createApp(component) {
  let root = null;
  let isScheduled = false;
  let context = null;

  const scheduleRender = () => {
    if (isScheduled) return;
    isScheduled = true;
    Promise.resolve().then(() => {
      isScheduled = false;
      render();
    });
  };

  const render = () => {
    if (!root || !component.render) {
      return;
    }
    const tree = component.render(context);
    root.innerHTML = '';
    const element = createElement(tree);
    root.appendChild(element);
  };

  const setupResult = component.setup ? component.setup() : {};
  context = createReactive(setupResult, scheduleRender);

  return {
    mount(selector) {
      const target = typeof selector === 'string' ? document.querySelector(selector) : selector;
      if (!target) {
        throw new Error('Failed to mount: target element not found');
      }
      root = target;
      render();
    }
  };
}
