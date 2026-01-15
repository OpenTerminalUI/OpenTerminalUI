import {
  createComponent,
  createMemo,
  createRenderEffect,
  createRoot,
  mergeProps,
  untrack,
} from 'solid-js';

interface RendererOptions<T> {
  createElement(tagName: string): T;
  createTextNode(value: string | number): T;
  replaceText(textNode: T, value: string): void;
  setProperty(node: T, name: string, value: unknown, prev: unknown): void;
  isTextNode(node: T): boolean;
  insertNode(parent: T, node: T, anchor?: T): void;
  removeNode(parent: T, node: T): void;
  getParentNode(node: T): T | undefined;
  getFirstChild(node: T): T | undefined;
  getNextSibling(node: T): T | undefined;
}

const memo = <T>(fn: () => T) => createMemo(() => fn());

export function createRenderer<T>(options: RendererOptions<T>) {
  const {
    createElement,
    createTextNode,
    isTextNode,
    replaceText,
    insertNode,
    removeNode,
    setProperty,
    getParentNode,
    getFirstChild,
    getNextSibling,
  } = options;

  function insert(parent: T, accessor: unknown, marker?: T, initial?: unknown) {
    if (marker !== undefined && !initial) initial = [];
    if (typeof accessor !== 'function') return insertExpression(parent, accessor, initial, marker);
    createRenderEffect(
      (current) => insertExpression(parent, (accessor as () => unknown)(), current, marker),
      initial,
    );
  }

  function insertExpression(
    parent: T,
    value: unknown,
    current: unknown,
    marker?: T,
    unwrapArray?: boolean,
  ): unknown {
    while (typeof current === 'function') current = (current as () => unknown)();
    if (value === current) return current;
    const t = typeof value;
    const multi = marker !== undefined;

    if (t === 'string' || t === 'number') {
      if (t === 'number') value = String(value);
      if (multi) {
        let node = (current as T[])[0];
        if (node && isTextNode(node)) {
          replaceText(node, value as string);
        } else {
          node = createTextNode(value as string);
        }
        current = cleanChildren(parent, current as T[], marker, node);
      } else {
        if (current !== '' && typeof current === 'string') {
          replaceText(getFirstChild(parent)!, (current = value) as string);
        } else {
          cleanChildren(parent, current as T[], marker, createTextNode(value as string));
          current = value;
        }
      }
    } else if (value == null || t === 'boolean') {
      current = cleanChildren(parent, current as T[], marker);
    } else if (t === 'function') {
      createRenderEffect(() => {
        let v = (value as () => unknown)();
        while (typeof v === 'function') v = (v as () => unknown)();
        current = insertExpression(parent, v, current, marker);
      });
      return () => current;
    } else if (Array.isArray(value)) {
      const array: T[] = [];
      if (normalizeIncomingArray(array, value, unwrapArray)) {
        createRenderEffect(
          () => (current = insertExpression(parent, array, current, marker, true)),
        );
        return () => current;
      }
      if (array.length === 0) {
        const replacement = cleanChildren(parent, current as T[], marker);
        if (multi) return (current = replacement);
      } else {
        if (Array.isArray(current)) {
          if ((current as T[]).length === 0) {
            appendNodes(parent, array, marker);
          } else {
            reconcileArrays(parent, current as T[], array);
          }
        } else if (current == null || current === '') {
          appendNodes(parent, array);
        } else {
          reconcileArrays(
            parent,
            multi && current ? (current as T[]) : [getFirstChild(parent)!],
            array,
          );
        }
      }
      current = array;
    } else {
      if (Array.isArray(current)) {
        if (multi) return (current = cleanChildren(parent, current as T[], marker, value as T));
        cleanChildren(parent, current as T[], undefined, value as T);
      } else if (current == null || current === '' || !getFirstChild(parent)) {
        insertNode(parent, value as T);
      } else {
        replaceNode(parent, value as T, getFirstChild(parent)!);
      }
      current = value;
    }
    return current;
  }

  function normalizeIncomingArray(normalized: T[], array: unknown[], unwrap?: boolean): boolean {
    let dynamic = false;
    for (const item of array) {
      if (item == null || item === true || item === false) continue;
      if (Array.isArray(item)) {
        dynamic = normalizeIncomingArray(normalized, item) || dynamic;
      } else if (typeof item === 'string' || typeof item === 'number') {
        normalized.push(createTextNode(item));
      } else if (typeof item === 'function') {
        if (unwrap) {
          let resolved = item as unknown;
          while (typeof resolved === 'function') resolved = (resolved as () => unknown)();
          dynamic =
            normalizeIncomingArray(normalized, Array.isArray(resolved) ? resolved : [resolved]) ||
            dynamic;
        } else {
          normalized.push(item as T);
          dynamic = true;
        }
      } else {
        normalized.push(item as T);
      }
    }
    return dynamic;
  }

  function reconcileArrays(parentNode: T, a: T[], b: T[]): void {
    const bLength = b.length;
    let aEnd = a.length;
    let bEnd = bLength;
    let aStart = 0;
    let bStart = 0;
    const after = aEnd > 0 ? getNextSibling(a[aEnd - 1]) : undefined;
    let map: Map<T, number> | null = null;

    while (aStart < aEnd || bStart < bEnd) {
      if (a[aStart] === b[bStart]) {
        aStart++;
        bStart++;
        continue;
      }
      while (a[aEnd - 1] === b[bEnd - 1]) {
        aEnd--;
        bEnd--;
      }
      if (aEnd === aStart) {
        const node =
          bEnd < bLength ? (bStart ? getNextSibling(b[bStart - 1]) : b[bEnd - bStart]) : after;
        while (bStart < bEnd) insertNode(parentNode, b[bStart++], node);
      } else if (bEnd === bStart) {
        while (aStart < aEnd) {
          if (!map || !map.has(a[aStart])) removeNode(parentNode, a[aStart]);
          aStart++;
        }
      } else if (a[aStart] === b[bEnd - 1] && b[bStart] === a[aEnd - 1]) {
        const node = getNextSibling(a[--aEnd]);
        insertNode(parentNode, b[bStart++], getNextSibling(a[aStart++]));
        insertNode(parentNode, b[--bEnd], node);
        a[aEnd] = b[bEnd];
      } else {
        if (!map) {
          map = new Map();
          let i = bStart;
          while (i < bEnd) map.set(b[i], i++);
        }
        const index = map.get(a[aStart]);
        if (index != null) {
          if (bStart < index && index < bEnd) {
            let i = aStart;
            let sequence = 1;
            while (++i < aEnd && i < bEnd) {
              const t = map.get(a[i]);
              if (t == null || t !== index + sequence) break;
              sequence++;
            }
            if (sequence > index - bStart) {
              const node = a[aStart];
              while (bStart < index) insertNode(parentNode, b[bStart++], node);
            } else {
              replaceNode(parentNode, b[bStart++], a[aStart++]);
            }
          } else {
            aStart++;
          }
        } else {
          removeNode(parentNode, a[aStart++]);
        }
      }
    }
  }

  function cleanChildren(parent: T, current: T[], marker?: T, replacement?: T): T[] {
    if (marker === undefined) {
      let removed: T | undefined;
      while ((removed = getFirstChild(parent))) removeNode(parent, removed);
      if (replacement) insertNode(parent, replacement);
      return replacement ? [replacement] : [];
    }
    if (current && current.length) {
      let inserted = false;
      for (let i = current.length - 1; i >= 0; i--) {
        const el = current[i];
        if (replacement !== el) {
          const isParent = getParentNode(el) === parent;
          if (!inserted && !i) {
            if (isParent) replaceNode(parent, replacement!, el);
            else insertNode(parent, replacement!, marker);
          } else if (isParent) {
            removeNode(parent, el);
          }
        } else {
          inserted = true;
        }
      }
    } else {
      insertNode(parent, replacement!, marker);
    }
    return replacement ? [replacement] : [];
  }

  function appendNodes(parent: T, array: T[], marker?: T): void {
    for (const node of array) insertNode(parent, node, marker);
  }

  function replaceNode(parent: T, newNode: T, oldNode: T): void {
    insertNode(parent, newNode, oldNode);
    removeNode(parent, oldNode);
  }

  function spreadExpression(
    node: T,
    props: Record<string, unknown>,
    prevProps: Record<string, unknown> = {},
    skipChildren?: boolean,
  ): Record<string, unknown> {
    props = props || {};
    if (!skipChildren) {
      createRenderEffect(() => {
        prevProps.children = insertExpression(node, props.children, prevProps.children);
      });
    }
    createRenderEffect(() => {
      if (props.ref) (props.ref as (el: T) => void)(node);
    });
    createRenderEffect(() => {
      for (const prop in props) {
        if (prop === 'children' || prop === 'ref') continue;
        const value = props[prop];
        if (value === prevProps[prop]) continue;
        setProperty(node, prop, value, prevProps[prop]);
        prevProps[prop] = value;
      }
    });
    return prevProps;
  }

  return {
    render(code: () => unknown, element: T) {
      let disposer: () => void;
      createRoot((dispose) => {
        disposer = dispose;
        insert(element, code());
      });
      return disposer!;
    },
    insert,
    spread(node: T, accessor: unknown, skipChildren?: boolean) {
      if (typeof accessor === 'function') {
        createRenderEffect((current) =>
          spreadExpression(
            node,
            (accessor as () => Record<string, unknown>)(),
            current as Record<string, unknown>,
            skipChildren,
          ),
        );
      } else {
        spreadExpression(node, accessor as Record<string, unknown>, undefined, skipChildren);
      }
    },
    createElement,
    createTextNode,
    insertNode,
    setProp(node: T, name: string, value: unknown, prev: unknown) {
      setProperty(node, name, value, prev);
      return value;
    },
    mergeProps,
    effect: createRenderEffect,
    memo,
    createComponent,
    use<Arg>(fn: (element: T, arg: Arg) => unknown, element: T, arg: Arg) {
      return untrack(() => fn(element, arg));
    },
  };
}
