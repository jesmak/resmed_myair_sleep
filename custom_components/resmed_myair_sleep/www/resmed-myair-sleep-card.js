/*! resmed-myair-sleep-card 1.0.0 | MIT License */
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __decorateClass = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i5 = decorators.length - 1, decorator; i5 >= 0; i5--)
    if (decorator = decorators[i5])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result) __defProp(target, key, result);
  return result;
};

// node_modules/@lit/reactive-element/css-tag.js
var t = globalThis;
var e = t.ShadowRoot && (void 0 === t.ShadyCSS || t.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype;
var s = /* @__PURE__ */ Symbol();
var o = /* @__PURE__ */ new WeakMap();
var n = class {
  constructor(t3, e5, o6) {
    if (this._$cssResult$ = true, o6 !== s) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = t3, this.t = e5;
  }
  get styleSheet() {
    let t3 = this.o;
    const s4 = this.t;
    if (e && void 0 === t3) {
      const e5 = void 0 !== s4 && 1 === s4.length;
      e5 && (t3 = o.get(s4)), void 0 === t3 && ((this.o = t3 = new CSSStyleSheet()).replaceSync(this.cssText), e5 && o.set(s4, t3));
    }
    return t3;
  }
  toString() {
    return this.cssText;
  }
};
var r = (t3) => new n("string" == typeof t3 ? t3 : t3 + "", void 0, s);
var i = (t3, ...e5) => {
  const o6 = 1 === t3.length ? t3[0] : e5.reduce((e6, s4, o7) => e6 + ((t4) => {
    if (true === t4._$cssResult$) return t4.cssText;
    if ("number" == typeof t4) return t4;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + t4 + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(s4) + t3[o7 + 1], t3[0]);
  return new n(o6, t3, s);
};
var S = (s4, o6) => {
  if (e) s4.adoptedStyleSheets = o6.map((t3) => t3 instanceof CSSStyleSheet ? t3 : t3.styleSheet);
  else for (const e5 of o6) {
    const o7 = document.createElement("style"), n5 = t.litNonce;
    void 0 !== n5 && o7.setAttribute("nonce", n5), o7.textContent = e5.cssText, s4.appendChild(o7);
  }
};
var c = e ? (t3) => t3 : (t3) => t3 instanceof CSSStyleSheet ? ((t4) => {
  let e5 = "";
  for (const s4 of t4.cssRules) e5 += s4.cssText;
  return r(e5);
})(t3) : t3;

// node_modules/@lit/reactive-element/reactive-element.js
var { is: i2, defineProperty: e2, getOwnPropertyDescriptor: h, getOwnPropertyNames: r2, getOwnPropertySymbols: o2, getPrototypeOf: n2 } = Object;
var a = globalThis;
var c2 = a.trustedTypes;
var l = c2 ? c2.emptyScript : "";
var p = a.reactiveElementPolyfillSupport;
var d = (t3, s4) => t3;
var u = { toAttribute(t3, s4) {
  switch (s4) {
    case Boolean:
      t3 = t3 ? l : null;
      break;
    case Object:
    case Array:
      t3 = null == t3 ? t3 : JSON.stringify(t3);
  }
  return t3;
}, fromAttribute(t3, s4) {
  let i5 = t3;
  switch (s4) {
    case Boolean:
      i5 = null !== t3;
      break;
    case Number:
      i5 = null === t3 ? null : Number(t3);
      break;
    case Object:
    case Array:
      try {
        i5 = JSON.parse(t3);
      } catch (t4) {
        i5 = null;
      }
  }
  return i5;
} };
var f = (t3, s4) => !i2(t3, s4);
var b = { attribute: true, type: String, converter: u, reflect: false, useDefault: false, hasChanged: f };
Symbol.metadata ?? (Symbol.metadata = /* @__PURE__ */ Symbol("metadata")), a.litPropertyMetadata ?? (a.litPropertyMetadata = /* @__PURE__ */ new WeakMap());
var y = class extends HTMLElement {
  static addInitializer(t3) {
    this._$Ei(), (this.l ?? (this.l = [])).push(t3);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(t3, s4 = b) {
    if (s4.state && (s4.attribute = false), this._$Ei(), this.prototype.hasOwnProperty(t3) && ((s4 = Object.create(s4)).wrapped = true), this.elementProperties.set(t3, s4), !s4.noAccessor) {
      const i5 = /* @__PURE__ */ Symbol(), h3 = this.getPropertyDescriptor(t3, i5, s4);
      void 0 !== h3 && e2(this.prototype, t3, h3);
    }
  }
  static getPropertyDescriptor(t3, s4, i5) {
    const { get: e5, set: r6 } = h(this.prototype, t3) ?? { get() {
      return this[s4];
    }, set(t4) {
      this[s4] = t4;
    } };
    return { get: e5, set(s5) {
      const h3 = e5?.call(this);
      r6?.call(this, s5), this.requestUpdate(t3, h3, i5);
    }, configurable: true, enumerable: true };
  }
  static getPropertyOptions(t3) {
    return this.elementProperties.get(t3) ?? b;
  }
  static _$Ei() {
    if (this.hasOwnProperty(d("elementProperties"))) return;
    const t3 = n2(this);
    t3.finalize(), void 0 !== t3.l && (this.l = [...t3.l]), this.elementProperties = new Map(t3.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(d("finalized"))) return;
    if (this.finalized = true, this._$Ei(), this.hasOwnProperty(d("properties"))) {
      const t4 = this.properties, s4 = [...r2(t4), ...o2(t4)];
      for (const i5 of s4) this.createProperty(i5, t4[i5]);
    }
    const t3 = this[Symbol.metadata];
    if (null !== t3) {
      const s4 = litPropertyMetadata.get(t3);
      if (void 0 !== s4) for (const [t4, i5] of s4) this.elementProperties.set(t4, i5);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [t4, s4] of this.elementProperties) {
      const i5 = this._$Eu(t4, s4);
      void 0 !== i5 && this._$Eh.set(i5, t4);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(s4) {
    const i5 = [];
    if (Array.isArray(s4)) {
      const e5 = new Set(s4.flat(1 / 0).reverse());
      for (const s5 of e5) i5.unshift(c(s5));
    } else void 0 !== s4 && i5.push(c(s4));
    return i5;
  }
  static _$Eu(t3, s4) {
    const i5 = s4.attribute;
    return false === i5 ? void 0 : "string" == typeof i5 ? i5 : "string" == typeof t3 ? t3.toLowerCase() : void 0;
  }
  constructor() {
    super(), this._$Ep = void 0, this.isUpdatePending = false, this.hasUpdated = false, this._$Em = null, this._$Ev();
  }
  _$Ev() {
    this._$ES = new Promise((t3) => this.enableUpdating = t3), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), this.constructor.l?.forEach((t3) => t3(this));
  }
  addController(t3) {
    (this._$EO ?? (this._$EO = /* @__PURE__ */ new Set())).add(t3), void 0 !== this.renderRoot && this.isConnected && t3.hostConnected?.();
  }
  removeController(t3) {
    this._$EO?.delete(t3);
  }
  _$E_() {
    const t3 = /* @__PURE__ */ new Map(), s4 = this.constructor.elementProperties;
    for (const i5 of s4.keys()) this.hasOwnProperty(i5) && (t3.set(i5, this[i5]), delete this[i5]);
    t3.size > 0 && (this._$Ep = t3);
  }
  createRenderRoot() {
    const t3 = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
    return S(t3, this.constructor.elementStyles), t3;
  }
  connectedCallback() {
    this.renderRoot ?? (this.renderRoot = this.createRenderRoot()), this.enableUpdating(true), this._$EO?.forEach((t3) => t3.hostConnected?.());
  }
  enableUpdating(t3) {
  }
  disconnectedCallback() {
    this._$EO?.forEach((t3) => t3.hostDisconnected?.());
  }
  attributeChangedCallback(t3, s4, i5) {
    this._$AK(t3, i5);
  }
  _$ET(t3, s4) {
    const i5 = this.constructor.elementProperties.get(t3), e5 = this.constructor._$Eu(t3, i5);
    if (void 0 !== e5 && true === i5.reflect) {
      const h3 = (void 0 !== i5.converter?.toAttribute ? i5.converter : u).toAttribute(s4, i5.type);
      this._$Em = t3, null == h3 ? this.removeAttribute(e5) : this.setAttribute(e5, h3), this._$Em = null;
    }
  }
  _$AK(t3, s4) {
    const i5 = this.constructor, e5 = i5._$Eh.get(t3);
    if (void 0 !== e5 && this._$Em !== e5) {
      const t4 = i5.getPropertyOptions(e5), h3 = "function" == typeof t4.converter ? { fromAttribute: t4.converter } : void 0 !== t4.converter?.fromAttribute ? t4.converter : u;
      this._$Em = e5;
      const r6 = h3.fromAttribute(s4, t4.type);
      this[e5] = r6 ?? this._$Ej?.get(e5) ?? r6, this._$Em = null;
    }
  }
  requestUpdate(t3, s4, i5, e5 = false, h3) {
    if (void 0 !== t3) {
      const r6 = this.constructor;
      if (false === e5 && (h3 = this[t3]), i5 ?? (i5 = r6.getPropertyOptions(t3)), !((i5.hasChanged ?? f)(h3, s4) || i5.useDefault && i5.reflect && h3 === this._$Ej?.get(t3) && !this.hasAttribute(r6._$Eu(t3, i5)))) return;
      this.C(t3, s4, i5);
    }
    false === this.isUpdatePending && (this._$ES = this._$EP());
  }
  C(t3, s4, { useDefault: i5, reflect: e5, wrapped: h3 }, r6) {
    i5 && !(this._$Ej ?? (this._$Ej = /* @__PURE__ */ new Map())).has(t3) && (this._$Ej.set(t3, r6 ?? s4 ?? this[t3]), true !== h3 || void 0 !== r6) || (this._$AL.has(t3) || (this.hasUpdated || i5 || (s4 = void 0), this._$AL.set(t3, s4)), true === e5 && this._$Em !== t3 && (this._$Eq ?? (this._$Eq = /* @__PURE__ */ new Set())).add(t3));
  }
  async _$EP() {
    this.isUpdatePending = true;
    try {
      await this._$ES;
    } catch (t4) {
      Promise.reject(t4);
    }
    const t3 = this.scheduleUpdate();
    return null != t3 && await t3, !this.isUpdatePending;
  }
  scheduleUpdate() {
    return this.performUpdate();
  }
  performUpdate() {
    if (!this.isUpdatePending) return;
    if (!this.hasUpdated) {
      if (this.renderRoot ?? (this.renderRoot = this.createRenderRoot()), this._$Ep) {
        for (const [t5, s5] of this._$Ep) this[t5] = s5;
        this._$Ep = void 0;
      }
      const t4 = this.constructor.elementProperties;
      if (t4.size > 0) for (const [s5, i5] of t4) {
        const { wrapped: t5 } = i5, e5 = this[s5];
        true !== t5 || this._$AL.has(s5) || void 0 === e5 || this.C(s5, void 0, i5, e5);
      }
    }
    let t3 = false;
    const s4 = this._$AL;
    try {
      t3 = this.shouldUpdate(s4), t3 ? (this.willUpdate(s4), this._$EO?.forEach((t4) => t4.hostUpdate?.()), this.update(s4)) : this._$EM();
    } catch (s5) {
      throw t3 = false, this._$EM(), s5;
    }
    t3 && this._$AE(s4);
  }
  willUpdate(t3) {
  }
  _$AE(t3) {
    this._$EO?.forEach((t4) => t4.hostUpdated?.()), this.hasUpdated || (this.hasUpdated = true, this.firstUpdated(t3)), this.updated(t3);
  }
  _$EM() {
    this._$AL = /* @__PURE__ */ new Map(), this.isUpdatePending = false;
  }
  get updateComplete() {
    return this.getUpdateComplete();
  }
  getUpdateComplete() {
    return this._$ES;
  }
  shouldUpdate(t3) {
    return true;
  }
  update(t3) {
    this._$Eq && (this._$Eq = this._$Eq.forEach((t4) => this._$ET(t4, this[t4]))), this._$EM();
  }
  updated(t3) {
  }
  firstUpdated(t3) {
  }
};
y.elementStyles = [], y.shadowRootOptions = { mode: "open" }, y[d("elementProperties")] = /* @__PURE__ */ new Map(), y[d("finalized")] = /* @__PURE__ */ new Map(), p?.({ ReactiveElement: y }), (a.reactiveElementVersions ?? (a.reactiveElementVersions = [])).push("2.1.2");

// node_modules/lit-html/lit-html.js
var t2 = globalThis;
var i3 = (t3) => t3;
var s2 = t2.trustedTypes;
var e3 = s2 ? s2.createPolicy("lit-html", { createHTML: (t3) => t3 }) : void 0;
var h2 = "$lit$";
var o3 = `lit$${Math.random().toFixed(9).slice(2)}$`;
var n3 = "?" + o3;
var r3 = `<${n3}>`;
var l2 = document;
var c3 = () => l2.createComment("");
var a2 = (t3) => null === t3 || "object" != typeof t3 && "function" != typeof t3;
var u2 = Array.isArray;
var d2 = (t3) => u2(t3) || "function" == typeof t3?.[Symbol.iterator];
var f2 = "[ 	\n\f\r]";
var v = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g;
var _ = /-->/g;
var m = />/g;
var p2 = RegExp(`>|${f2}(?:([^\\s"'>=/]+)(${f2}*=${f2}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g");
var g = /'/g;
var $ = /"/g;
var y2 = /^(?:script|style|textarea|title)$/i;
var x = (t3) => (i5, ...s4) => ({ _$litType$: t3, strings: i5, values: s4 });
var b2 = x(1);
var w = x(2);
var T = x(3);
var E = /* @__PURE__ */ Symbol.for("lit-noChange");
var A = /* @__PURE__ */ Symbol.for("lit-nothing");
var C = /* @__PURE__ */ new WeakMap();
var P = l2.createTreeWalker(l2, 129);
function V(t3, i5) {
  if (!u2(t3) || !t3.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return void 0 !== e3 ? e3.createHTML(i5) : i5;
}
var N = (t3, i5) => {
  const s4 = t3.length - 1, e5 = [];
  let n5, l3 = 2 === i5 ? "<svg>" : 3 === i5 ? "<math>" : "", c4 = v;
  for (let i6 = 0; i6 < s4; i6++) {
    const s5 = t3[i6];
    let a3, u3, d3 = -1, f3 = 0;
    for (; f3 < s5.length && (c4.lastIndex = f3, u3 = c4.exec(s5), null !== u3); ) f3 = c4.lastIndex, c4 === v ? "!--" === u3[1] ? c4 = _ : void 0 !== u3[1] ? c4 = m : void 0 !== u3[2] ? (y2.test(u3[2]) && (n5 = RegExp("</" + u3[2], "g")), c4 = p2) : void 0 !== u3[3] && (c4 = p2) : c4 === p2 ? ">" === u3[0] ? (c4 = n5 ?? v, d3 = -1) : void 0 === u3[1] ? d3 = -2 : (d3 = c4.lastIndex - u3[2].length, a3 = u3[1], c4 = void 0 === u3[3] ? p2 : '"' === u3[3] ? $ : g) : c4 === $ || c4 === g ? c4 = p2 : c4 === _ || c4 === m ? c4 = v : (c4 = p2, n5 = void 0);
    const x2 = c4 === p2 && t3[i6 + 1].startsWith("/>") ? " " : "";
    l3 += c4 === v ? s5 + r3 : d3 >= 0 ? (e5.push(a3), s5.slice(0, d3) + h2 + s5.slice(d3) + o3 + x2) : s5 + o3 + (-2 === d3 ? i6 : x2);
  }
  return [V(t3, l3 + (t3[s4] || "<?>") + (2 === i5 ? "</svg>" : 3 === i5 ? "</math>" : "")), e5];
};
var S2 = class _S {
  constructor({ strings: t3, _$litType$: i5 }, e5) {
    let r6;
    this.parts = [];
    let l3 = 0, a3 = 0;
    const u3 = t3.length - 1, d3 = this.parts, [f3, v2] = N(t3, i5);
    if (this.el = _S.createElement(f3, e5), P.currentNode = this.el.content, 2 === i5 || 3 === i5) {
      const t4 = this.el.content.firstChild;
      t4.replaceWith(...t4.childNodes);
    }
    for (; null !== (r6 = P.nextNode()) && d3.length < u3; ) {
      if (1 === r6.nodeType) {
        if (r6.hasAttributes()) for (const t4 of r6.getAttributeNames()) if (t4.endsWith(h2)) {
          const i6 = v2[a3++], s4 = r6.getAttribute(t4).split(o3), e6 = /([.?@])?(.*)/.exec(i6);
          d3.push({ type: 1, index: l3, name: e6[2], strings: s4, ctor: "." === e6[1] ? I : "?" === e6[1] ? L : "@" === e6[1] ? z : H }), r6.removeAttribute(t4);
        } else t4.startsWith(o3) && (d3.push({ type: 6, index: l3 }), r6.removeAttribute(t4));
        if (y2.test(r6.tagName)) {
          const t4 = r6.textContent.split(o3), i6 = t4.length - 1;
          if (i6 > 0) {
            r6.textContent = s2 ? s2.emptyScript : "";
            for (let s4 = 0; s4 < i6; s4++) r6.append(t4[s4], c3()), P.nextNode(), d3.push({ type: 2, index: ++l3 });
            r6.append(t4[i6], c3());
          }
        }
      } else if (8 === r6.nodeType) if (r6.data === n3) d3.push({ type: 2, index: l3 });
      else {
        let t4 = -1;
        for (; -1 !== (t4 = r6.data.indexOf(o3, t4 + 1)); ) d3.push({ type: 7, index: l3 }), t4 += o3.length - 1;
      }
      l3++;
    }
  }
  static createElement(t3, i5) {
    const s4 = l2.createElement("template");
    return s4.innerHTML = t3, s4;
  }
};
function M(t3, i5, s4 = t3, e5) {
  if (i5 === E) return i5;
  let h3 = void 0 !== e5 ? s4._$Co?.[e5] : s4._$Cl;
  const o6 = a2(i5) ? void 0 : i5._$litDirective$;
  return h3?.constructor !== o6 && (h3?._$AO?.(false), void 0 === o6 ? h3 = void 0 : (h3 = new o6(t3), h3._$AT(t3, s4, e5)), void 0 !== e5 ? (s4._$Co ?? (s4._$Co = []))[e5] = h3 : s4._$Cl = h3), void 0 !== h3 && (i5 = M(t3, h3._$AS(t3, i5.values), h3, e5)), i5;
}
var R = class {
  constructor(t3, i5) {
    this._$AV = [], this._$AN = void 0, this._$AD = t3, this._$AM = i5;
  }
  get parentNode() {
    return this._$AM.parentNode;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  u(t3) {
    const { el: { content: i5 }, parts: s4 } = this._$AD, e5 = (t3?.creationScope ?? l2).importNode(i5, true);
    P.currentNode = e5;
    let h3 = P.nextNode(), o6 = 0, n5 = 0, r6 = s4[0];
    for (; void 0 !== r6; ) {
      if (o6 === r6.index) {
        let i6;
        2 === r6.type ? i6 = new k(h3, h3.nextSibling, this, t3) : 1 === r6.type ? i6 = new r6.ctor(h3, r6.name, r6.strings, this, t3) : 6 === r6.type && (i6 = new Z(h3, this, t3)), this._$AV.push(i6), r6 = s4[++n5];
      }
      o6 !== r6?.index && (h3 = P.nextNode(), o6++);
    }
    return P.currentNode = l2, e5;
  }
  p(t3) {
    let i5 = 0;
    for (const s4 of this._$AV) void 0 !== s4 && (void 0 !== s4.strings ? (s4._$AI(t3, s4, i5), i5 += s4.strings.length - 2) : s4._$AI(t3[i5])), i5++;
  }
};
var k = class _k {
  get _$AU() {
    return this._$AM?._$AU ?? this._$Cv;
  }
  constructor(t3, i5, s4, e5) {
    this.type = 2, this._$AH = A, this._$AN = void 0, this._$AA = t3, this._$AB = i5, this._$AM = s4, this.options = e5, this._$Cv = e5?.isConnected ?? true;
  }
  get parentNode() {
    let t3 = this._$AA.parentNode;
    const i5 = this._$AM;
    return void 0 !== i5 && 11 === t3?.nodeType && (t3 = i5.parentNode), t3;
  }
  get startNode() {
    return this._$AA;
  }
  get endNode() {
    return this._$AB;
  }
  _$AI(t3, i5 = this) {
    t3 = M(this, t3, i5), a2(t3) ? t3 === A || null == t3 || "" === t3 ? (this._$AH !== A && this._$AR(), this._$AH = A) : t3 !== this._$AH && t3 !== E && this._(t3) : void 0 !== t3._$litType$ ? this.$(t3) : void 0 !== t3.nodeType ? this.T(t3) : d2(t3) ? this.k(t3) : this._(t3);
  }
  O(t3) {
    return this._$AA.parentNode.insertBefore(t3, this._$AB);
  }
  T(t3) {
    this._$AH !== t3 && (this._$AR(), this._$AH = this.O(t3));
  }
  _(t3) {
    this._$AH !== A && a2(this._$AH) ? this._$AA.nextSibling.data = t3 : this.T(l2.createTextNode(t3)), this._$AH = t3;
  }
  $(t3) {
    const { values: i5, _$litType$: s4 } = t3, e5 = "number" == typeof s4 ? this._$AC(t3) : (void 0 === s4.el && (s4.el = S2.createElement(V(s4.h, s4.h[0]), this.options)), s4);
    if (this._$AH?._$AD === e5) this._$AH.p(i5);
    else {
      const t4 = new R(e5, this), s5 = t4.u(this.options);
      t4.p(i5), this.T(s5), this._$AH = t4;
    }
  }
  _$AC(t3) {
    let i5 = C.get(t3.strings);
    return void 0 === i5 && C.set(t3.strings, i5 = new S2(t3)), i5;
  }
  k(t3) {
    u2(this._$AH) || (this._$AH = [], this._$AR());
    const i5 = this._$AH;
    let s4, e5 = 0;
    for (const h3 of t3) e5 === i5.length ? i5.push(s4 = new _k(this.O(c3()), this.O(c3()), this, this.options)) : s4 = i5[e5], s4._$AI(h3), e5++;
    e5 < i5.length && (this._$AR(s4 && s4._$AB.nextSibling, e5), i5.length = e5);
  }
  _$AR(t3 = this._$AA.nextSibling, s4) {
    for (this._$AP?.(false, true, s4); t3 !== this._$AB; ) {
      const s5 = i3(t3).nextSibling;
      i3(t3).remove(), t3 = s5;
    }
  }
  setConnected(t3) {
    void 0 === this._$AM && (this._$Cv = t3, this._$AP?.(t3));
  }
};
var H = class {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(t3, i5, s4, e5, h3) {
    this.type = 1, this._$AH = A, this._$AN = void 0, this.element = t3, this.name = i5, this._$AM = e5, this.options = h3, s4.length > 2 || "" !== s4[0] || "" !== s4[1] ? (this._$AH = Array(s4.length - 1).fill(new String()), this.strings = s4) : this._$AH = A;
  }
  _$AI(t3, i5 = this, s4, e5) {
    const h3 = this.strings;
    let o6 = false;
    if (void 0 === h3) t3 = M(this, t3, i5, 0), o6 = !a2(t3) || t3 !== this._$AH && t3 !== E, o6 && (this._$AH = t3);
    else {
      const e6 = t3;
      let n5, r6;
      for (t3 = h3[0], n5 = 0; n5 < h3.length - 1; n5++) r6 = M(this, e6[s4 + n5], i5, n5), r6 === E && (r6 = this._$AH[n5]), o6 || (o6 = !a2(r6) || r6 !== this._$AH[n5]), r6 === A ? t3 = A : t3 !== A && (t3 += (r6 ?? "") + h3[n5 + 1]), this._$AH[n5] = r6;
    }
    o6 && !e5 && this.j(t3);
  }
  j(t3) {
    t3 === A ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, t3 ?? "");
  }
};
var I = class extends H {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(t3) {
    this.element[this.name] = t3 === A ? void 0 : t3;
  }
};
var L = class extends H {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(t3) {
    this.element.toggleAttribute(this.name, !!t3 && t3 !== A);
  }
};
var z = class extends H {
  constructor(t3, i5, s4, e5, h3) {
    super(t3, i5, s4, e5, h3), this.type = 5;
  }
  _$AI(t3, i5 = this) {
    if ((t3 = M(this, t3, i5, 0) ?? A) === E) return;
    const s4 = this._$AH, e5 = t3 === A && s4 !== A || t3.capture !== s4.capture || t3.once !== s4.once || t3.passive !== s4.passive, h3 = t3 !== A && (s4 === A || e5);
    e5 && this.element.removeEventListener(this.name, this, s4), h3 && this.element.addEventListener(this.name, this, t3), this._$AH = t3;
  }
  handleEvent(t3) {
    "function" == typeof this._$AH ? this._$AH.call(this.options?.host ?? this.element, t3) : this._$AH.handleEvent(t3);
  }
};
var Z = class {
  constructor(t3, i5, s4) {
    this.element = t3, this.type = 6, this._$AN = void 0, this._$AM = i5, this.options = s4;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(t3) {
    M(this, t3);
  }
};
var B = t2.litHtmlPolyfillSupport;
B?.(S2, k), (t2.litHtmlVersions ?? (t2.litHtmlVersions = [])).push("3.3.3");
var D = (t3, i5, s4) => {
  const e5 = s4?.renderBefore ?? i5;
  let h3 = e5._$litPart$;
  if (void 0 === h3) {
    const t4 = s4?.renderBefore ?? null;
    e5._$litPart$ = h3 = new k(i5.insertBefore(c3(), t4), t4, void 0, s4 ?? {});
  }
  return h3._$AI(t3), h3;
};

// node_modules/lit-element/lit-element.js
var s3 = globalThis;
var i4 = class extends y {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    var _a;
    const t3 = super.createRenderRoot();
    return (_a = this.renderOptions).renderBefore ?? (_a.renderBefore = t3.firstChild), t3;
  }
  update(t3) {
    const r6 = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(t3), this._$Do = D(r6, this.renderRoot, this.renderOptions);
  }
  connectedCallback() {
    super.connectedCallback(), this._$Do?.setConnected(true);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this._$Do?.setConnected(false);
  }
  render() {
    return E;
  }
};
i4._$litElement$ = true, i4["finalized"] = true, s3.litElementHydrateSupport?.({ LitElement: i4 });
var o4 = s3.litElementPolyfillSupport;
o4?.({ LitElement: i4 });
(s3.litElementVersions ?? (s3.litElementVersions = [])).push("4.2.2");

// node_modules/@lit/reactive-element/decorators/property.js
var o5 = { attribute: true, type: String, converter: u, reflect: false, hasChanged: f };
var r4 = (t3 = o5, e5, r6) => {
  const { kind: n5, metadata: i5 } = r6;
  let s4 = globalThis.litPropertyMetadata.get(i5);
  if (void 0 === s4 && globalThis.litPropertyMetadata.set(i5, s4 = /* @__PURE__ */ new Map()), "setter" === n5 && ((t3 = Object.create(t3)).wrapped = true), s4.set(r6.name, t3), "accessor" === n5) {
    const { name: o6 } = r6;
    return { set(r7) {
      const n6 = e5.get.call(this);
      e5.set.call(this, r7), this.requestUpdate(o6, n6, t3, true, r7);
    }, init(e6) {
      return void 0 !== e6 && this.C(o6, void 0, t3, e6), e6;
    } };
  }
  if ("setter" === n5) {
    const { name: o6 } = r6;
    return function(r7) {
      const n6 = this[o6];
      e5.call(this, r7), this.requestUpdate(o6, n6, t3, true, r7);
    };
  }
  throw Error("Unsupported decorator location: " + n5);
};
function n4(t3) {
  return (e5, o6) => "object" == typeof o6 ? r4(t3, e5, o6) : ((t4, e6, o7) => {
    const r6 = e6.hasOwnProperty(o7);
    return e6.constructor.createProperty(o7, t4), r6 ? Object.getOwnPropertyDescriptor(e6, o7) : void 0;
  })(t3, e5, o6);
}

// node_modules/@lit/reactive-element/decorators/state.js
function r5(r6) {
  return n4({ ...r6, state: true, attribute: false });
}

// src/charts.ts
var LEFT = 30;
var BOTTOM = 18;
var TOP = 6;
function roundTop(value) {
  const step2 = value / 4;
  const power = 10 ** Math.floor(Math.log10(step2 || 1));
  const nice = [1, 2, 2.5, 5, 10].find((factor) => factor * power >= step2) ?? 10;
  return nice * power * 4;
}
function barChart(bars, options) {
  const { width, height, goal, dates, line } = options;
  const right = line ? 30 : 4;
  const bottom = dates ? BOTTOM : 2;
  const values = bars.flatMap((bar) => bar.value === void 0 ? [] : [bar.value]);
  const top = roundTop(Math.max(1, ...values, goal ? goal.value * 1.25 : 0));
  const plot = height - TOP - bottom;
  const y3 = (value) => TOP + (1 - value / top) * plot;
  const slot = (width - LEFT - right) / Math.max(1, bars.length);
  const barWidth = Math.max(1, slot * 0.7);
  return w`<svg width=${width} height=${height} role="img">
        ${[0, top / 2, top].map(
    (tick) => w`<line class="grid ${tick ? "dashed" : ""}" x1=${LEFT} x2=${width - right} y1=${y3(tick)} y2=${y3(tick)}></line>
                <text class="axis" x=${LEFT - 5} y=${y3(tick) + 3} text-anchor="end">${options.number(tick)}</text>`
  )}
        ${bars.map(
    (bar, index) => bar.value === void 0 ? A : w`<rect x=${LEFT + index * slot + (slot - barWidth) / 2} y=${y3(bar.value)} width=${barWidth}
                      height=${Math.max(1, TOP + plot - y3(bar.value))} rx=${Math.min(2, barWidth / 3)} fill=${bar.color}><title>${bar.tooltip}</title></rect>`
  )}
        ${goal ? w`<line class="goal" x1=${LEFT} x2=${width - right} y1=${y3(goal.value)} y2=${y3(goal.value)}></line>
                <text class="goal-label" x=${LEFT + 4} y=${y3(goal.value) - 4}>${goal.label}</text>` : A}
        ${line ? lineOver(line, { width, right, plot, slot }) : A}
        ${dates ? [...dates].map(
    ([index, label]) => w`<text class="axis" x=${LEFT + index * slot + slot / 2} y=${height - 4} text-anchor="middle">${label}</text>`
  ) : A}
    </svg>`;
}
function lineOver(line, frame) {
  const present = line.values.flatMap((value) => value === void 0 ? [] : [value]);
  if (!present.length) {
    return A;
  }
  const low = Math.floor(Math.min(...present)) - 1;
  const high = Math.ceil(Math.max(...present)) + 1;
  const y3 = (value) => TOP + (1 - (value - low) / (high - low)) * frame.plot;
  const x2 = (index) => LEFT + index * frame.slot + frame.slot / 2;
  let path = "";
  let drawing = false;
  line.values.forEach((value, index) => {
    if (value === void 0) {
      drawing = false;
      return;
    }
    path += `${drawing ? "L" : "M"}${x2(index).toFixed(1)},${y3(value).toFixed(1)}`;
    drawing = true;
  });
  return w`<path d=${path} fill="none" stroke=${line.color} stroke-width="2"></path>
        ${line.values.map((value, index) => value === void 0 ? A : w`<circle cx=${x2(index)} cy=${y3(value)} r="2.2" fill=${line.color}></circle>`)}
        ${[low, high].map(
    (value) => w`<text class="axis" x=${frame.width - frame.right + 4} y=${y3(value) + 3} fill=${line.color}>${line.label(value)}</text>`
  )}`;
}
function scatter(points, options) {
  const { width, height, step: step2 } = options;
  const bottom = BOTTOM + 14;
  const xs = points.map((point) => point.x);
  const low = Math.floor(Math.min(...xs) - step2 / 2);
  const high = Math.ceil(Math.max(...xs) + step2 / 2);
  const top = roundTop(Math.max(options.goal ? options.goal * 1.6 : 0, ...points.map((point) => point.y)));
  const x2 = (value) => LEFT + (value - low) / (high - low) * (width - LEFT - 8);
  const y3 = (value) => TOP + (1 - value / top) * (height - TOP - bottom);
  const ticks = [];
  for (let tick = Math.ceil(low / step2) * step2; tick <= high; tick += step2) {
    ticks.push(tick);
  }
  return w`<svg width=${width} height=${height} role="img">
        ${[0, top / 4, top / 2, top * 3 / 4, top].map(
    (tick) => w`<line class="grid dashed" x1=${LEFT} x2=${width - 8} y1=${y3(tick)} y2=${y3(tick)}></line>
                <text class="axis" x=${LEFT - 5} y=${y3(tick) + 3} text-anchor="end">${options.number(tick)}</text>`
  )}
        ${ticks.map((tick) => w`<text class="axis" x=${x2(tick)} y=${height - bottom + 14} text-anchor="middle">${options.number(tick)}</text>`)}
        <text class="axis" x=${(width + LEFT) / 2} y=${height - 3} text-anchor="middle">${options.xTitle}</text>
        ${options.goal === void 0 ? A : w`<line class="goal" x1=${LEFT} x2=${width - 8} y1=${y3(options.goal)} y2=${y3(options.goal)}></line>`}
        ${points.map(
    (point) => w`<circle cx=${x2(point.x)} cy=${y3(point.y)} r="4.5" fill=${point.color} fill-opacity="0.85"><title>${point.tooltip}</title></circle>`
  )}
    </svg>`;
}
function timeline(options) {
  const { width } = options;
  const from = 20;
  const to = 36;
  const x2 = (hour) => 8 + (Math.min(to, Math.max(from, hour)) - from) / (to - from) * (width - 16);
  const hours = [20, 24, 28, 32, 36];
  const bar = options.start === void 0 || options.end === void 0 ? A : w`<rect class="session" x=${x2(options.start)} y="10" width=${Math.max(2, x2(options.end) - x2(options.start))} height="18" rx="6"></rect>
                <text class="session-label" x=${x2(options.start) + 6} y="23">${options.startLabel}</text>
                <text class="session-label" x=${x2(options.end) - 6} y="23" text-anchor="end">${options.endLabel}</text>`;
  return w`<svg width=${width} height="46" role="img">
        ${hours.map(
    (hour) => w`<line class="grid" x1=${x2(hour)} x2=${x2(hour)} y1="8" y2="30"></line>
                <text class="axis" x=${x2(hour)} y="44" text-anchor="middle">${options.hourLabel(hour % 24)}</text>`
  )}
        ${bar}
    </svg>`;
}

// src/const.ts
var CARD_VERSION = "1.0.0";

// src/data.ts
var DEFAULT_LIMITS = { ahi_limit: 5, leak_limit: 24, usage_hours: 4 };
function addDays(date, days) {
  const day = /* @__PURE__ */ new Date(`${date}T00:00:00Z`);
  day.setUTCDate(day.getUTCDate() + days);
  return day.toISOString().slice(0, 10);
}
function metricValue(night, metric) {
  if (!night) {
    return void 0;
  }
  return metric === "usage" ? night.usage_minutes === void 0 ? void 0 : night.usage_minutes / 60 : night[metric];
}
function used(night) {
  return (night?.usage_minutes ?? 0) > 0;
}
function level(metric, value, limits) {
  if (value === void 0) {
    return void 0;
  }
  switch (metric) {
    case "ahi":
      return value < limits.ahi_limit ? "good" : value < 2 * limits.ahi_limit ? "high" : "bad";
    case "leak":
      return value < limits.leak_limit ? "good" : value < limits.leak_limit * 5 / 3 ? "high" : "bad";
    case "usage":
      return value >= limits.usage_hours ? "good" : value > 0 ? "high" : "bad";
    case "score":
      return value >= 80 ? "good" : value >= 60 ? "high" : "bad";
  }
}
function latestNight(nights) {
  return [...nights].reverse().find(used) ?? nights.at(-1);
}
function windowEnd(nights, today) {
  const yesterday = addDays(today, -1);
  const newest = nights.at(-1)?.date;
  return newest && newest > yesterday ? newest : yesterday;
}
function nightsIn(nights, end, days) {
  const byDate = new Map(nights.map((night) => [night.date, night]));
  return Array.from({ length: days }, (_2, index) => {
    const date = addDays(end, index - days + 1);
    return { date, night: byDate.get(date) };
  });
}
function compliance(nights, end, limits) {
  const days = nightsIn(nights, end, 30);
  const kept = days.filter(({ night }) => (night?.usage_minutes ?? 0) >= limits.usage_hours * 60).length;
  return Math.round(kept / days.length * 100);
}
function roomStep(room) {
  return room === "temperature" ? 1 : 5;
}
function bins(nights, room) {
  const step2 = roomStep(room);
  const groups = /* @__PURE__ */ new Map();
  for (const night of nights) {
    const value = night[room];
    if (!used(night) || value === void 0 || night.ahi === void 0) {
      continue;
    }
    const from = Math.floor(value / step2) * step2;
    groups.set(from, [...groups.get(from) ?? [], night.ahi]);
  }
  return [...groups.entries()].sort(([a3], [b3]) => a3 - b3).map(([from, values]) => ({
    from,
    to: from + step2,
    average: values.reduce((sum, value) => sum + value, 0) / values.length,
    least: Math.min(...values),
    most: Math.max(...values),
    count: values.length
  }));
}
function roomNights(nights, room) {
  return nights.filter((night) => used(night) && night.ahi !== void 0 && night[room] !== void 0);
}

// src/localize/languages/en.json
var en_default = {
  common: {
    name: "ResMed myAir Sleep",
    description: "A CPAP's last night, how the nights have gone, and AHI against the bedroom's temperature and humidity",
    no_nights: "No nights yet.",
    duration: "{hours} h {minutes} min"
  },
  view: {
    last_night: "Last night",
    nights: "Nights",
    room: "Sleep and the room"
  },
  metric: {
    ahi: "AHI",
    usage: "Usage",
    leak: "Leak",
    score: "Score"
  },
  goal: {
    below: "below {value}",
    at_least: "at least {value}"
  },
  last: {
    score: "{score} points",
    no_session: "The night's start time isn't known.",
    mask_pairs: "Mask on/off",
    part_usage: "Usage",
    part_ahi: "AHI",
    part_mask: "Mask",
    part_leak: "Leak"
  },
  calendar: {
    compliance: "{value} % kept, 30 days",
    good: "good",
    high: "high",
    bad: "poor",
    unused: "no use"
  },
  room: {
    temperature: "Temperature",
    humidity: "Humidity",
    none: "No line",
    with_temperature: "+ Temperature",
    with_humidity: "+ Humidity",
    nights: "{count} nights",
    empty: "No night has the bedroom's temperature or humidity yet.",
    average_ahi: "average AHI",
    ahi_nights: "AHI \xB7 nights",
    bin_tooltip: "{count} nights, AHI {least}\u2013{most}",
    leak_below: "leak below {value}",
    leak_over: "over {value} L/min"
  },
  editor: {
    entity: "Sensor of the machine",
    view: "View",
    view_last_night: "Last night",
    view_nights: "Nights over time",
    view_room: "Sleep and the room",
    nights_chart: "Chart",
    nights_chart_bars: "Bars",
    nights_chart_charts: "Four small charts",
    nights_chart_calendar: "Calendar",
    metric: "Shown first",
    metric_ahi: "AHI",
    metric_usage: "Usage",
    metric_leak: "Leak",
    metric_score: "Score",
    room_line: "Line over the bars",
    room_line_none: "None",
    room_line_temperature: "Temperature",
    room_line_humidity: "Humidity",
    room_chart: "Chart",
    room_chart_bins: "Averages by range",
    room_chart_scatter: "Each night as a dot",
    room: "Shown first",
    room_temperature: "Temperature",
    room_humidity: "Humidity",
    days: "Days back",
    days_unit: "days",
    limits: "Limits for the colours",
    ahi_limit: "AHI is good below",
    leak_limit: "Leak is good below (L/min)",
    usage_hours: "Usage is good from (h)",
    row_step: "Height rounding",
    row_step_helper: "On automatic rows the card rounds its height to whole or half rows",
    row_step_full: "Whole rows",
    row_step_half: "Half rows"
  },
  error: {
    invalid_configuration: "Choose a sensor of ResMed myAir Sleep",
    invalid_option: "An option has a value the card doesn't know",
    invalid_height: "The height is auto, fixed or max, and the heights in pixels",
    invalid_row_step: "The row step is full or half",
    entity_not_found: "Sensor {entity} isn't found",
    not_supported: "{entity} isn't a sensor of ResMed myAir Sleep",
    fetch_failed: "The nights couldn't be fetched. Trying again in a minute."
  }
};

// src/localize/languages/fi.json
var fi_default = {
  common: {
    name: "ResMed myAir -uni",
    description: "CPAP-laitteen viime y\xF6, \xF6iden kehitys ja AHI:n vaihtelu makuuhuoneen l\xE4mp\xF6tilan ja kosteuden mukaan",
    no_nights: "Ei viel\xE4 \xF6it\xE4.",
    duration: "{hours} h {minutes} min"
  },
  view: {
    last_night: "Viime y\xF6",
    nights: "Y\xF6t",
    room: "Uni ja huone"
  },
  metric: {
    ahi: "AHI",
    usage: "K\xE4ytt\xF6",
    leak: "Vuoto",
    score: "Pisteet"
  },
  goal: {
    below: "alle {value}",
    at_least: "v\xE4hint\xE4\xE4n {value}"
  },
  last: {
    score: "{score} pistett\xE4",
    no_session: "Y\xF6n alkamisaika ei ole tiedossa.",
    mask_pairs: "Maskin irrotukset",
    part_usage: "K\xE4ytt\xF6",
    part_ahi: "AHI",
    part_mask: "Maski",
    part_leak: "Vuoto"
  },
  calendar: {
    compliance: "Hoitoon sitoutuminen {value} %, 30 pv",
    good: "hyv\xE4",
    high: "koholla",
    bad: "huono",
    unused: "ei k\xE4ytt\xF6\xE4"
  },
  room: {
    temperature: "L\xE4mp\xF6tila",
    humidity: "Kosteus",
    none: "Ei viivaa",
    with_temperature: "+ L\xE4mp\xF6tila",
    with_humidity: "+ Kosteus",
    nights: "{count} y\xF6t\xE4",
    empty: "Yhdelt\xE4k\xE4\xE4n y\xF6lt\xE4 ei ole viel\xE4 makuuhuoneen l\xE4mp\xF6tilaa tai kosteutta.",
    average_ahi: "keskim\xE4\xE4r\xE4inen AHI",
    ahi_nights: "AHI \xB7 \xF6it\xE4",
    bin_tooltip: "{count} y\xF6t\xE4, AHI {least}\u2013{most}",
    leak_below: "vuoto alle {value}",
    leak_over: "yli {value} L/min"
  },
  editor: {
    entity: "Laitteen anturi",
    view: "N\xE4kym\xE4",
    view_last_night: "Viime y\xF6",
    view_nights: "\xD6iden kehitys",
    view_room: "Uni ja huone",
    nights_chart: "Kaavio",
    nights_chart_bars: "Palkit",
    nights_chart_charts: "Nelj\xE4 pient\xE4 kaaviota",
    nights_chart_calendar: "Kalenteri",
    metric: "N\xE4ytet\xE4\xE4n ensin",
    metric_ahi: "AHI",
    metric_usage: "K\xE4ytt\xF6",
    metric_leak: "Vuoto",
    metric_score: "Pisteet",
    room_line: "Viiva palkkien p\xE4\xE4ll\xE4",
    room_line_none: "Ei mit\xE4\xE4n",
    room_line_temperature: "L\xE4mp\xF6tila",
    room_line_humidity: "Kosteus",
    room_chart: "Kaavio",
    room_chart_bins: "Keskiarvot ryhmitt\xE4in",
    room_chart_scatter: "Jokainen y\xF6 pisteen\xE4",
    room: "N\xE4ytet\xE4\xE4n ensin",
    room_temperature: "L\xE4mp\xF6tila",
    room_humidity: "Kosteus",
    days: "P\xE4ivi\xE4 taaksep\xE4in",
    days_unit: "pv",
    limits: "V\xE4rien rajat",
    ahi_limit: "AHI on hyv\xE4 alle",
    leak_limit: "Vuoto on hyv\xE4 alle (L/min)",
    usage_hours: "K\xE4ytt\xF6 on hyv\xE4 v\xE4hint\xE4\xE4n (h)",
    row_step: "Korkeuden py\xF6ristys",
    row_step_helper: "Automaattisilla riveill\xE4 kortti py\xF6rist\xE4\xE4 korkeutensa kokonaisiin tai puoliin riveihin",
    row_step_full: "Kokonaiset rivit",
    row_step_half: "Puolikkaat rivit"
  },
  error: {
    invalid_configuration: "Valitse ResMed myAir -laitteen anturi",
    invalid_option: "Asetuksella on arvo, jota kortti ei tunne",
    invalid_height: "Korkeus on auto, fixed tai max, ja korkeudet pikselein\xE4",
    invalid_row_step: "Rivien py\xF6ristys on full tai half",
    entity_not_found: "Anturia {entity} ei l\xF6ydy",
    not_supported: "{entity} ei ole ResMed myAir -laitteen anturi",
    fetch_failed: "\xD6iden haku ep\xE4onnistui. Uusi yritys minuutin kuluttua."
  }
};

// src/localize/localize.ts
var FILES = { "./languages/en.json": en_default, "./languages/fi.json": fi_default };
var LANGUAGES = Object.fromEntries(
  Object.entries(FILES).map(([path, table]) => [path.replace(/^.*\/|\.json$/g, "").toLowerCase(), table])
);
var LANGUAGE_CODES = Object.keys(LANGUAGES).sort();
function translate(language, key) {
  const code = (language ?? "en").split(/[-_]/)[0].toLowerCase();
  return read(LANGUAGES[code], key) ?? read(LANGUAGES.en, key) ?? key;
}
function read(table, key) {
  let value = table;
  for (const part of key.split(".")) {
    if (value === null || typeof value !== "object") {
      return void 0;
    }
    value = value[part];
  }
  return typeof value === "string" ? value : void 0;
}
function browserLanguage() {
  return document.documentElement.lang || navigator.language || "en";
}

// src/height.ts
var HEIGHT_MODES = ["auto", "fixed", "max"];
var pixels = (value) => value == null || typeof value === "number" && Number.isFinite(value) && value > 0;
function validHeight(config) {
  return (config.height_mode == null || HEIGHT_MODES.includes(config.height_mode)) && pixels(config.height) && pixels(config.max_height);
}
function heightMode(config) {
  return config.height_mode ?? (config.height ? "fixed" : config.max_height ? "max" : "auto");
}
var ROW_HEIGHT = 56;
var ROW_GAP = 8;
function heightStyle(config, layout, minimum = 0) {
  const rows = config.grid_options ? config.grid_options.rows : config.layout_options?.grid_rows;
  if (layout === "grid" && typeof rows === "number") {
    return "height: 100%";
  }
  const mode = heightMode(config);
  if (mode === "fixed" && config.height) {
    return `height: ${Math.max(config.height, minimum)}px`;
  }
  return mode === "max" && config.max_height ? `max-height: ${Math.max(config.max_height, minimum)}px` : "";
}
function gridMinRows(minimum) {
  return Math.max(1, Math.ceil((minimum + ROW_GAP) / (ROW_HEIGHT + ROW_GAP)));
}
function heightCardSize(config, content, minimum = 0) {
  const mode = heightMode(config);
  if (mode === "fixed" && config.height) {
    return Math.max(1, Math.round(Math.max(config.height, minimum) / 50));
  }
  return mode === "max" && config.max_height ? Math.max(1, Math.min(content, Math.round(Math.max(config.max_height, minimum) / 50))) : content;
}

// src/rows.ts
var ROW_STEPS = ["full", "half"];
var ROW_PX = 64;
var ROW_GAP_PX = 8;
function validRowStep(config) {
  return config.row_step === void 0 || config.row_step === null || ROW_STEPS.includes(config.row_step);
}
var step = (config) => config.row_step === "half" ? ROW_PX / 2 : ROW_PX;
var SLACK_PX = 0.01;
function drawnScale(card) {
  const layout = Number.parseFloat(getComputedStyle(card).width) || 0;
  const drawn = card.getBoundingClientRect().width;
  return layout > 0 && drawn > 0 ? drawn / layout : 1;
}
function filledHeight(content, config, limit = Infinity) {
  return Math.min(Math.max(1, Math.ceil((content - SLACK_PX + ROW_GAP_PX) / step(config))) * step(config) - ROW_GAP_PX, limit);
}
function spareRoom(filled, content) {
  return Math.max(0, Math.floor(filled - content + SLACK_PX));
}
function fillLimit(config, layout, minimum = 0) {
  const rows = config.grid_options ? config.grid_options.rows : config.layout_options?.grid_rows;
  if (layout !== "grid" || typeof rows === "number") {
    return 0;
  }
  const mode = heightMode(config);
  if (mode === "fixed" && config.height) {
    return 0;
  }
  if (mode !== "max" || !config.max_height) {
    return Infinity;
  }
  const down = Math.floor((config.max_height + ROW_GAP_PX) / step(config)) * step(config) - ROW_GAP_PX;
  return Math.max(down, filledHeight(minimum, config));
}
function filledStyle(config, layout, minimum, filled) {
  const limit = fillLimit(config, layout, minimum);
  if (!limit) {
    return heightStyle(config, layout, minimum);
  }
  return [limit < Infinity && `max-height: ${limit}px`, filled && `min-height: ${filled}px`].filter(Boolean).join("; ");
}
function rowStepSchema(config, text) {
  if (heightMode(config) === "fixed" && config.height) {
    return [];
  }
  return [
    {
      name: "row_step",
      selector: {
        select: { mode: "dropdown", options: ROW_STEPS.map((value) => ({ value, label: text(`editor.row_step_${value}`) })) }
      }
    }
  ];
}
function rowStepData(config) {
  return { ...config, row_step: config.row_step ?? "full" };
}
function tidyRowStep(config) {
  const tidied = { ...config };
  if (tidied.row_step !== "half" || heightMode(tidied) === "fixed" && tidied.height) {
    delete tidied.row_step;
  }
  return tidied;
}

// src/editor.ts
var DEFAULTS = {
  view: "last_night",
  nights_chart: "bars",
  room_chart: "bins",
  metric: "ahi",
  room_line: "temperature",
  room: "temperature",
  days: 90,
  ...DEFAULT_LIMITS
};
function cardEntities(hass) {
  return Object.values(hass.entities ?? {}).filter(
    (entry) => entry?.platform === "resmed_myair_sleep" && entry.entity_id.startsWith("sensor.") && hass.states[entry.entity_id]
  ).sort((a3, b3) => Number(b3?.translation_key === "ahi") - Number(a3?.translation_key === "ahi")).map((entry) => entry?.entity_id ?? "");
}
function select(name, values, text) {
  return {
    name,
    selector: { select: { mode: "dropdown", options: values.map((value) => ({ value, label: text(`editor.${name}_${value}`) })) } }
  };
}
function schema(config, text) {
  const view = config.view ?? DEFAULTS.view;
  const chart = config.nights_chart ?? DEFAULTS.nights_chart;
  const days = { name: "days", selector: { number: { min: 7, max: 3650, mode: "box", unit_of_measurement: text("editor.days_unit") } } };
  const viewParts = view === "nights" ? [
    select("nights_chart", ["bars", "charts", "calendar"], text),
    ...chart === "charts" ? [] : [select("metric", ["ahi", "usage", "leak", "score"], text)],
    ...chart === "bars" ? [select("room_line", ["none", "temperature", "humidity"], text)] : [],
    days
  ] : view === "room" ? [select("room_chart", ["bins", "scatter"], text), select("room", ["temperature", "humidity"], text), days] : [];
  const number = (name, step2) => ({ name, selector: { number: { min: step2, step: step2, mode: "box" } } });
  return [
    { name: "entity", required: true, selector: { entity: { filter: [{ integration: "resmed_myair_sleep" }] } } },
    select("view", ["last_night", "nights", "room"], text),
    ...viewParts,
    {
      name: "limits",
      type: "expandable",
      flatten: true,
      schema: [number("ahi_limit", 0.5), number("leak_limit", 1), number("usage_hours", 0.5)]
    },
    ...rowStepSchema(config, text)
  ];
}
var ResmedMyairSleepCardEditor = class extends i4 {
  constructor() {
    super(...arguments);
    this.config = { type: "custom:resmed-myair-sleep-card", entity: "" };
  }
  setConfig(config) {
    this.config = { ...config };
  }
  render() {
    if (!this.hass) {
      return A;
    }
    return b2`
            <ha-form
                .hass=${this.hass}
                .data=${{ ...DEFAULTS, ...rowStepData(this.config) }}
                .schema=${schema(this.config, (key) => this.text(key))}
                .computeLabel=${(entry) => this.text(`editor.${entry.name}`)}
                .computeHelper=${(entry) => this.helper(entry.name)}
                @value-changed=${this.valueChanged}
            ></ha-form>
        `;
  }
  valueChanged(event) {
    const config = tidyRowStep({ ...event.detail.value });
    for (const [key, value] of Object.entries(DEFAULTS)) {
      if (config[key] === value || config[key] == null) {
        delete config[key];
      }
    }
    this.dispatchEvent(new CustomEvent("config-changed", { detail: { config }, bubbles: true, composed: true }));
  }
  text(key) {
    return translate(this.language(), key);
  }
  helper(name) {
    const key = `editor.${name}_helper`;
    const helper = translate(this.language(), key);
    return helper === key ? void 0 : helper;
  }
  language() {
    return this.hass?.locale?.language ?? this.hass?.language ?? browserLanguage();
  }
};
__decorateClass([
  n4({ attribute: false })
], ResmedMyairSleepCardEditor.prototype, "hass", 2);
__decorateClass([
  r5()
], ResmedMyairSleepCardEditor.prototype, "config", 2);
if (!customElements.get("resmed-myair-sleep-card-editor")) {
  customElements.define("resmed-myair-sleep-card-editor", ResmedMyairSleepCardEditor);
}

// src/fade.ts
var fadeStyles = i`
    .fades {
        --fade-length: min(24px, 25%);
        scroll-padding-block: calc(var(--fade-top-offset, 0px) + var(--fade-length, 24px)) var(--fade-length, 24px);
    }

    .fade-top {
        mask-image: linear-gradient(
            to bottom,
            #000 var(--fade-top-offset, 0px),
            transparent var(--fade-top-offset, 0px),
            #000 calc(var(--fade-top-offset, 0px) + var(--fade-length, 24px))
        );
    }

    .fade-bottom {
        mask-image: linear-gradient(to top, transparent, #000 var(--fade-length, 24px));
    }

    .fade-top.fade-bottom {
        mask-image: linear-gradient(
            to bottom,
            #000 var(--fade-top-offset, 0px),
            transparent var(--fade-top-offset, 0px),
            #000 calc(var(--fade-top-offset, 0px) + var(--fade-length, 24px)),
            #000 calc(100% - var(--fade-length, 24px)),
            transparent
        );
    }
`;
function markFade(part) {
  const hidden = part.scrollHeight - part.clientHeight;
  part.classList.toggle("fade-top", hidden > 1 && part.scrollTop > 1);
  part.classList.toggle("fade-bottom", hidden > 1 && hidden - part.scrollTop > 1);
}
var onScroll = (event) => markFade(event.currentTarget);
var ScrollFade = class {
  constructor(host, parts) {
    this.host = host;
    this.parts = parts;
    /** Each followed part with the children whose size it watches. */
    this.followed = /* @__PURE__ */ new Map();
    this.resized = typeof ResizeObserver === "undefined" ? void 0 : new ResizeObserver((entries) => {
      for (const { target } of entries) {
        const part = this.followed.has(target) ? target : target.parentElement;
        if (part && this.followed.has(part)) {
          markFade(part);
        }
      }
    });
    host.addController(this);
  }
  hostConnected() {
    if (this.host.hasUpdated) {
      this.follow();
    }
  }
  hostUpdated() {
    if (this.host.isConnected) {
      this.follow();
    }
  }
  hostDisconnected() {
    for (const part of [...this.followed.keys()]) {
      this.forget(part);
    }
  }
  follow() {
    const now = new Set(this.parts());
    for (const part of [...this.followed.keys()]) {
      if (!now.has(part)) {
        this.forget(part);
      }
    }
    for (const part of now) {
      if (!this.followed.has(part)) {
        part.addEventListener("scroll", onScroll, { passive: true });
        this.resized?.observe(part);
      }
      part.classList.add("fades");
      const before = this.followed.get(part) ?? [];
      const children = [...part.children];
      before.filter((child) => !children.includes(child)).forEach((child) => this.resized?.unobserve(child));
      children.filter((child) => !before.includes(child)).forEach((child) => this.resized?.observe(child));
      this.followed.set(part, children);
      markFade(part);
    }
  }
  forget(part) {
    this.followed.get(part)?.forEach((child) => this.resized?.unobserve(child));
    this.followed.delete(part);
    part.removeEventListener("scroll", onScroll);
    this.resized?.unobserve(part);
    part.classList.remove("fades", "fade-top", "fade-bottom");
  }
};

// src/resmed-myair-sleep-card.ts
var VIEWS = ["last_night", "nights", "room"];
var NIGHTS_CHARTS = ["bars", "charts", "calendar"];
var ROOM_CHARTS = ["scatter", "bins"];
var METRICS = ["ahi", "usage", "leak", "score"];
var ROOMS = ["temperature", "humidity"];
var DEFAULT_DAYS = 90;
var RETRY = 6e4;
var BAR_CHART = 170;
var SMALL_CHART = 64;
var SCATTER_CHART = 220;
var MIN_CHART = 90;
var MIN_SMALL_CHART = 40;
var CHART_GAP_PX = 20;
var MIN_HEIGHTS = {
  last_night: 184,
  bars: 224,
  charts: 342,
  calendar: 200,
  scatter: 214,
  bins: 150
};
var LEVEL_COLORS = {
  good: "var(--sleep-good)",
  high: "var(--sleep-high)",
  bad: "var(--sleep-bad)"
};
function numberLocale(hass, language) {
  switch (hass?.locale?.number_format) {
    case "comma_decimal":
      return ["en-US", "en"];
    case "decimal_comma":
      return ["de", "es", "it"];
    case "space_comma":
      return ["fr", "sv", "cs"];
    case "quote_decimal":
      return ["de-CH"];
    case "none":
      return "en-US";
    case "system":
      return void 0;
    default:
      return language;
  }
}
var ResmedMyairSleepCard = class extends i4 {
  constructor() {
    super();
    this.picked = {};
    this.width = 0;
    this.extra = 0;
    this.gap = 0;
    this.filled = 0;
    this.held = 0;
    this.resizes = typeof ResizeObserver === "undefined" ? void 0 : new ResizeObserver(() => this.measureSoon());
    new ScrollFade(this, () => this.isHeld() ? [...this.renderRoot.querySelectorAll(".scroller")] : []);
  }
  static getConfigElement() {
    return document.createElement("resmed-myair-sleep-card-editor");
  }
  /** Offers the integration's first machine when the card is added from the picker. */
  static getStubConfig(hass) {
    return { entity: (hass ? cardEntities(hass)[0] : void 0) ?? "" };
  }
  setConfig(config) {
    const language = browserLanguage();
    if (!config?.entity || typeof config.entity !== "string") {
      throw new Error(translate(language, "error.invalid_configuration"));
    }
    const invalid = config.view != null && !VIEWS.includes(config.view) || config.nights_chart != null && !NIGHTS_CHARTS.includes(config.nights_chart) || config.room_chart != null && !ROOM_CHARTS.includes(config.room_chart) || config.metric != null && !METRICS.includes(config.metric) || config.room != null && !ROOMS.includes(config.room) || config.room_line != null && config.room_line !== "none" && !ROOMS.includes(config.room_line) || [config.days, config.ahi_limit, config.leak_limit, config.usage_hours].some(
      (value) => value != null && (typeof value !== "number" || !(value > 0))
    ) || config.days != null && !Number.isInteger(config.days);
    if (invalid) {
      throw new Error(translate(language, "error.invalid_option"));
    }
    if (!validHeight(config)) {
      throw new Error(translate(language, "error.invalid_height"));
    }
    if (!validRowStep(config)) {
      throw new Error(translate(language, "error.invalid_row_step"));
    }
    if (config.entity !== this.config?.entity) {
      this.nights = void 0;
      this.fetchedFor = void 0;
      this.error = void 0;
      window.clearTimeout(this.retry);
      this.retry = void 0;
    }
    this.picked = {};
    this.config = { ...config };
  }
  getCardSize() {
    return heightCardSize(this.config ?? {}, 5, this.minimum());
  }
  getGridOptions() {
    return { columns: 12, rows: "auto", min_columns: 6, min_rows: gridMinRows(this.minimum()) };
  }
  connectedCallback() {
    super.connectedCallback();
    if (this.hass) {
      this.requestUpdate();
    }
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this.resizes?.disconnect();
    this.observed = void 0;
    cancelAnimationFrame(this.frame ?? 0);
    if (this.retry !== void 0) {
      window.clearTimeout(this.retry);
      this.retry = void 0;
      this.fetchedFor = void 0;
    }
  }
  shouldUpdate(changed) {
    if ([...changed.keys()].some((key) => key !== "hass") || !this.config) {
      return true;
    }
    const previous = changed.get("hass");
    return !previous || this.deviceEntities().some((id) => previous.states[id] !== this.hass?.states[id]) || previous.entities !== this.hass?.entities || previous.locale !== this.hass?.locale || previous.language !== this.hass?.language;
  }
  render() {
    if (!this.hass || !this.config) {
      return A;
    }
    if (!this.hass.states[this.config.entity]) {
      return this.message(this.text("error.entity_not_found", { entity: this.config.entity }));
    }
    if (this.error) {
      return this.message(this.error);
    }
    const held = this.isHeld();
    const view = this.view();
    const classes = [held ? "held" : "", this.chartHeight() === void 0 ? "spread" : ""].join(" ");
    return b2`
            <ha-card class=${classes} style=${this.cardStyle()}>
                <div class="card">${this.nights && this.width ? this.content(view) : A}</div>
            </ha-card>
        `;
  }
  updated(changed) {
    void this.fetch();
    const card = this.renderRoot.querySelector("ha-card");
    if (card && card !== this.observed) {
      this.resizes?.disconnect();
      this.resizes?.observe(card);
      this.observed = card;
    }
    if (![...changed.keys()].every((key) => ["extra", "gap", "filled", "held"].includes(String(key)))) {
      this.measureSoon();
    }
    const calendar = this.renderRoot.querySelector(".scroller.calendar");
    if (calendar && calendar !== this.scrolledCalendar && calendar.scrollHeight > calendar.clientHeight) {
      calendar.scrollTop = calendar.scrollHeight;
      this.scrolledCalendar = calendar;
    }
  }
  // ---- Data ----
  async fetch() {
    const hass = this.hass;
    const entity = this.config?.entity;
    if (!hass?.callWS || !entity || !hass.states[entity] || this.retry !== void 0) {
      return;
    }
    const key = [entity, ...this.deviceEntities().map((id) => hass.states[id]?.last_updated ?? "")].join("|");
    if (key === this.fetchedFor) {
      return;
    }
    this.fetchedFor = key;
    try {
      const result = await hass.callWS({ type: "resmed_myair_sleep/nights", entity_id: entity });
      if (key === this.fetchedFor) {
        this.nights = result.nights;
        this.error = void 0;
      }
    } catch (error) {
      if (key !== this.fetchedFor) {
        return;
      }
      if (error?.code === "not_found") {
        this.error = this.text("error.not_supported", { entity });
        return;
      }
      this.error = this.text("error.fetch_failed");
      this.retry = window.setTimeout(() => {
        this.retry = void 0;
        this.fetchedFor = void 0;
        this.error = void 0;
      }, RETRY);
    }
  }
  /** The card's sensor and the other sensors of its machine, found through its device in the registry. */
  deviceEntities() {
    const entity = this.config?.entity ?? "";
    const device = this.hass?.entities?.[entity]?.device_id;
    if (!device) {
      return [entity];
    }
    return Object.values(this.hass?.entities ?? {}).flatMap((entry) => entry && entry.device_id === device ? [entry.entity_id] : []);
  }
  // ---- Settings ----
  view() {
    return this.config?.view ?? "last_night";
  }
  /** What the card draws: the view, or for the views over time and the room, their chart. */
  shape() {
    const view = this.view();
    if (view === "nights") {
      return this.config?.nights_chart ?? "bars";
    }
    if (view === "room") {
      return this.config?.room_chart ?? "bins";
    }
    return view;
  }
  limits() {
    return {
      ahi_limit: this.config?.ahi_limit ?? DEFAULT_LIMITS.ahi_limit,
      leak_limit: this.config?.leak_limit ?? DEFAULT_LIMITS.leak_limit,
      usage_hours: this.config?.usage_hours ?? DEFAULT_LIMITS.usage_hours
    };
  }
  metric() {
    return this.picked.metric ?? this.config?.metric ?? "ahi";
  }
  line() {
    return this.picked.line ?? this.config?.room_line ?? "temperature";
  }
  room() {
    return this.picked.room ?? this.config?.room ?? "temperature";
  }
  days() {
    return this.config?.days ?? DEFAULT_DAYS;
  }
  minimum() {
    return MIN_HEIGHTS[this.shape()] ?? MIN_HEIGHTS.last_night;
  }
  /** The chart's own height on automatic rows, or undefined for a view of rows. */
  chartHeight() {
    switch (this.shape()) {
      case "bars":
        return BAR_CHART;
      case "charts":
        return 4 * SMALL_CHART;
      case "scatter":
        return SCATTER_CHART;
      default:
        return void 0;
    }
  }
  // ---- Views ----
  content(view) {
    const nights = this.nights ?? [];
    if (!nights.length) {
      return b2`${this.head(this.text(`view.${view}`))}
                <div class="part muted">${this.text("common.no_nights")}</div>`;
    }
    if (view === "last_night") {
      return this.lastNight(nights);
    }
    if (view === "nights") {
      const shape = this.shape();
      return shape === "calendar" ? this.calendar(nights) : shape === "charts" ? this.smallCharts(nights) : this.bars(nights);
    }
    return this.shape() === "scatter" ? this.scatterView(nights) : this.binsView(nights);
  }
  head(title, aside) {
    return b2`<div class="head part">
            <span class="title">${title}</span>${aside ? b2`<span class="aside">${aside}</span>` : A}
        </div>`;
  }
  chips(options, chosen, pick, label) {
    return b2`<div class="chips part">
            ${options.map(
      (value) => b2`<button class="chip ${value === chosen ? "on" : ""}" aria-pressed=${value === chosen} @click=${() => pick(value)}>
                        ${label(value)}
                    </button>`
    )}
        </div>`;
  }
  lastNight(nights) {
    const night = latestNight(nights);
    const limits = this.limits();
    const score = night.score;
    const scoreLevel = level("score", score, limits);
    const chip = score === void 0 ? void 0 : b2`<span class="score" style="color: ${LEVEL_COLORS[scoreLevel ?? "good"]}"
                      >${this.text("last.score", { score: String(score) })}</span
                  >`;
    const parts = [
      ["usage", night.usage_score, 70],
      ["ahi", night.ahi_score, 5],
      ["mask", night.mask_score, 5],
      ["leak", night.leak_score, 20]
    ];
    const shown = parts.filter(([, value]) => value !== void 0);
    const row = (icon, label, value, metric, raw) => {
      const mark = metric ? level(metric, raw, limits) : void 0;
      return b2`<div class="figure">
                <ha-icon icon=${icon}></ha-icon><span class="label">${label}</span>
                <span class="value"
                    >${value}${mark ? b2`<span class="dot" style="background: ${LEVEL_COLORS[mark]}"></span>` : A}</span
                >
            </div>`;
    };
    const usage = night.usage_minutes;
    return b2`
            ${this.head(this.text("view.last_night"), b2`<span class="date">${this.dayLabel(night.date)}</span>${chip ?? A}`)}
            <div class="part">
                ${night.start && night.end ? this.session(night) : b2`<div class="muted">${this.text("last.no_session")}</div>`}
            </div>
            ${shown.length ? b2`<div class="parts part">
                          ${shown.map(
      ([key, value, most]) => b2`<span class="score-part">${this.text(`last.part_${key}`)} <b>${value}</b>/${most}</span>`
    )}
                      </div>` : A}
            <div class="scroller part">
                <div class="figures">
                    ${row("mdi:lungs", "AHI", this.number(night.ahi, 1), "ahi", night.ahi)}
                    ${row("mdi:timer-outline", this.text("metric.usage"), usage === void 0 ? "\u2013" : this.duration(usage), "usage", metricValue(night, "usage"))}
                    ${row("mdi:face-mask", this.text("metric.leak"), `${this.number(night.leak, 1)} L/min`, "leak", night.leak)}
                    ${row("mdi:face-mask-outline", this.text("last.mask_pairs"), this.number(night.mask_pairs, 0))}
                    ${night.temperature === void 0 ? A : row(
      "mdi:thermometer",
      this.text("room.temperature"),
      `${this.number(night.temperature, 1)} ${this.temperatureUnit()}`
    )}
                    ${night.humidity === void 0 ? A : row("mdi:water-percent", this.text("room.humidity"), `${this.number(night.humidity, 0)} %`)}
                </div>
            </div>
        `;
  }
  session(night) {
    const start = night.start;
    const end = night.end;
    return b2`${timeline({
      width: this.width,
      start: this.hourOfNight(start, night.date),
      end: this.hourOfNight(end, night.date),
      startLabel: this.time(start),
      endLabel: this.time(end),
      hourLabel: (hour) => String(hour).padStart(2, "0")
    })}`;
  }
  /** The nights of the window, each as a bar of the metric, coloured by its level. */
  bars(nights) {
    const metric = this.metric();
    const days = nightsIn(nights, windowEnd(nights, this.today()), this.days());
    const line = this.line();
    const height = BAR_CHART + this.extra;
    return b2`
            ${this.head(this.text("view.nights"))}
            ${this.chips(
      METRICS,
      metric,
      (value) => this.picked = { ...this.picked, metric: value },
      (value) => this.text(`metric.${value}`)
    )}
            <div class="chart part">
                ${barChart(this.barsOf(days, metric), {
      width: this.width,
      height,
      goal: this.goal(metric),
      dates: this.dateLabels(days.map(({ date }) => date)),
      line: line === "none" ? void 0 : {
        values: days.map(({ night }) => used(night) ? night?.[line] : void 0),
        color: line === "temperature" ? "var(--sleep-temperature)" : "var(--sleep-humidity)",
        label: (value) => `${this.number(value, 0)}${line === "temperature" ? "\xB0" : "%"}`
      },
      number: (value) => this.number(value, value % 1 ? 1 : 0)
    })}
            </div>
            ${this.chips(
      ["none", ...ROOMS],
      line,
      (value) => this.picked = { ...this.picked, line: value },
      (value) => this.text(value === "none" ? "room.none" : `room.with_${value}`)
    )}
        `;
  }
  smallCharts(nights) {
    const days = nightsIn(nights, windowEnd(nights, this.today()), this.days());
    const height = SMALL_CHART + this.extra / 4;
    return b2`
            ${this.head(this.text("view.nights"))}
            ${METRICS.map(
      (metric, index) => b2`<div class="small part">
                        <div class="small-label">
                            ${this.text(`metric.${metric}`)}${metric === "usage" ? ", h" : metric === "leak" ? ", L/min" : ""}
                        </div>
                        ${barChart(this.barsOf(days, metric), {
        width: this.width,
        height: height + (index === METRICS.length - 1 ? 16 : 0),
        goal: this.goal(metric),
        dates: index === METRICS.length - 1 ? this.dateLabels(days.map(({ date }) => date)) : void 0,
        number: (value) => this.number(value, value % 1 ? 1 : 0)
      })}
                    </div>`
    )}
        `;
  }
  calendar(nights) {
    const metric = this.metric();
    const limits = this.limits();
    const end = windowEnd(nights, this.today());
    const days = nightsIn(nights, end, this.days());
    const byDate = new Map(days.map((day) => [day.date, day.night]));
    const months = [...new Set(days.map(({ date }) => date.slice(0, 7)))];
    const weekdays = Array.from(
      { length: 7 },
      (_2, index) => new Intl.DateTimeFormat(this.language(), { weekday: "narrow", timeZone: "UTC" }).format(new Date(Date.UTC(2024, 0, 1 + index)))
    );
    const cell = (date) => {
      if (!byDate.has(date)) {
        return b2`<div class="day outside"></div>`;
      }
      const night = byDate.get(date);
      const value = metricValue(night, metric);
      const unused = !used(night);
      const mark = unused ? void 0 : level(metric, value, limits);
      const tooltip = `${this.dayLabel(date)} \xB7 ${unused ? this.text("calendar.unused") : `${this.text(`metric.${metric}`)} ${this.value(metric, value)}`}`;
      return b2`<div class="day ${unused ? "unused" : mark ?? ""}" title=${tooltip}>${Number(date.slice(8))}</div>`;
    };
    return b2`
            ${this.head(this.text("view.nights"), this.text("calendar.compliance", { value: String(compliance(nights, end, limits)) }))}
            ${this.chips(
      METRICS,
      metric,
      (value) => this.picked = { ...this.picked, metric: value },
      (value) => this.text(`metric.${value}`)
    )}
            <div class="scroller calendar part">
                <div class="months">
                    ${months.map((month) => {
      const first = `${month}-01`;
      const length = new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5)), 0)).getUTCDate();
      const weekday = (date) => ((/* @__PURE__ */ new Date(`${date}T00:00:00Z`)).getUTCDay() + 6) % 7;
      const shown = days[0] && days[0].date > first ? addDays(days[0].date, -weekday(days[0].date)) : first;
      const from = shown < first ? first : shown;
      const skipped = Number(from.slice(8)) - 1;
      return b2`<div class="month">
                            <div class="month-name">${this.monthLabel(first)}</div>
                            <div class="grid">
                                ${weekdays.map((day) => b2`<div class="weekday">${day}</div>`)}
                                ${Array.from({ length: weekday(from) }, () => b2`<div></div>`)}
                                ${Array.from({ length: length - skipped }, (_2, index) => cell(addDays(from, index)))}
                            </div>
                        </div>`;
    })}
                </div>
            </div>
            <div class="legend part">
                <span class="good">${this.text("calendar.good")}</span><span class="high">${this.text("calendar.high")}</span>
                <span class="bad">${this.text("calendar.bad")}</span><span class="unused">${this.text("calendar.unused")}</span>
            </div>
        `;
  }
  /** The nights of the window, for the room's views. */
  windowNights(nights) {
    return nightsIn(nights, windowEnd(nights, this.today()), this.days()).flatMap(({ night }) => night ? [night] : []);
  }
  scatterView(nights) {
    const room = this.room();
    const limits = this.limits();
    const points = roomNights(this.windowNights(nights), room);
    const leak = limits.leak_limit;
    const most = Math.round(leak * 5 / 3);
    return b2`
            ${this.head(this.text("view.room"), this.text("room.nights", { count: String(points.length) }))}
            ${this.chips(
      ROOMS,
      room,
      (value) => this.picked = { ...this.picked, room: value },
      (value) => this.text(`room.${value}`)
    )}
            <div class="chart part">
                ${points.length ? scatter(
      points.map((night) => ({
        x: night[room],
        y: night.ahi,
        color: LEVEL_COLORS[level("leak", night.leak, limits) ?? "good"],
        tooltip: `${this.dayLabel(night.date)} \xB7 AHI ${this.number(night.ahi, 1)} \xB7 ${this.roomValue(room, night[room])} \xB7 ${this.text("metric.leak")} ${this.number(night.leak, 1)} L/min`
      })),
      {
        width: this.width,
        height: SCATTER_CHART + this.extra,
        step: roomStep(room),
        goal: limits.ahi_limit,
        xTitle: `${this.text(`room.${room}`)}, ${room === "temperature" ? this.temperatureUnit() : "%"}`,
        number: (value) => this.number(value, value % 1 ? 1 : 0)
      }
    ) : b2`<div class="muted empty" style="height: ${SCATTER_CHART + this.extra}px">${this.text("room.empty")}</div>`}
            </div>
            <div class="legend part">
                <span class="good">${this.text("room.leak_below", { value: this.number(leak, 0) })}</span>
                <span class="high">${this.number(leak, 0)}–${this.number(most, 0)}</span>
                <span class="bad">${this.text("room.leak_over", { value: this.number(most, 0) })}</span>
            </div>
        `;
  }
  binsView(nights) {
    const room = this.room();
    const limits = this.limits();
    const list = bins(this.windowNights(nights), room);
    const most = Math.max(2 * limits.ahi_limit, ...list.map((bin) => bin.average));
    const count = list.reduce((sum, bin) => sum + bin.count, 0);
    const unit = room === "temperature" ? this.temperatureUnit() : "%";
    return b2`
            ${this.head(this.text("view.room"), this.text("room.nights", { count: String(count) }))}
            ${this.chips(
      ROOMS,
      room,
      (value) => this.picked = { ...this.picked, room: value },
      (value) => this.text(`room.${value}`)
    )}
            ${list.length ? b2`<div class="bins-head part">
                              <span>${this.text(`room.${room}`)}</span><span>${this.text("room.average_ahi")}</span
                              ><span>${this.text("room.ahi_nights")}</span>
                          </div>
                          <div class="scroller part">
                              ${list.map(
      (bin) => b2`<div
                                          class="bin"
                                          title=${this.text("room.bin_tooltip", { count: String(bin.count), least: this.number(bin.least, 1), most: this.number(bin.most, 1) })}
                                      >
                                          <span class="muted">${this.number(bin.from, 0)}–${this.number(bin.to, 0)} ${unit}</span>
                                          <span class="track"
                                              ><span
                                                  class="fill"
                                                  style="width: ${bin.average / most * 100}%; background: ${LEVEL_COLORS[level("ahi", bin.average, limits) ?? "good"]}"
                                              ></span
                                          ></span>
                                          <span class="figure-value"
                                              >${this.number(bin.average, 1)} <span class="muted">· ${bin.count}</span></span
                                          >
                                      </div>`
    )}
                          </div>` : b2`<div class="part muted">${this.text("room.empty")}</div>`}
        `;
  }
  barsOf(days, metric) {
    const limits = this.limits();
    return days.map(({ date, night }) => {
      const value = metricValue(night, metric);
      const mark = metric === "score" ? void 0 : level(metric, value, limits);
      return {
        value,
        color: mark ? LEVEL_COLORS[mark] : "var(--sleep-score)",
        tooltip: `${this.dayLabel(date)} \xB7 ${this.text(`metric.${metric}`)} ${this.value(metric, value)}`
      };
    });
  }
  goal(metric) {
    const limits = this.limits();
    switch (metric) {
      case "ahi":
        return { value: limits.ahi_limit, label: this.text("goal.below", { value: this.number(limits.ahi_limit, 0) }) };
      case "leak":
        return {
          value: limits.leak_limit,
          label: this.text("goal.below", { value: `${this.number(limits.leak_limit, 0)} L/min` })
        };
      case "usage":
        return {
          value: limits.usage_hours,
          label: this.text("goal.at_least", { value: `${this.number(limits.usage_hours, 0)} h` })
        };
      default:
        return void 0;
    }
  }
  /** About five dates under the bars, by the bars' index. */
  dateLabels(dates) {
    const step2 = Math.max(1, Math.ceil(dates.length / Math.max(2, Math.floor(this.width / 70))));
    return new Map(dates.flatMap((date, index) => index % step2 === 0 ? [[index, this.dayLabel(date)]] : []));
  }
  // ---- Sizing ----
  measureSoon() {
    cancelAnimationFrame(this.frame ?? 0);
    this.frame = requestAnimationFrame(() => this.measure());
  }
  /**
   * The content's width, then the height. Held to a height, a chart takes the room left from the other parts, at
   * least its least, and a view of rows scrolls its rows. On automatic rows in a sections view, the card fills whole
   * rows, the chart taking what that leaves over or, in a view of rows, the room spread between the parts.
   */
  measure() {
    const card = this.renderRoot.querySelector("ha-card");
    const inner = card?.querySelector(":scope > .card");
    if (!card || !inner || !card.clientWidth || !this.config) {
      return;
    }
    const style = getComputedStyle(inner);
    const width = Math.floor(inner.clientWidth - px(style.paddingLeft) - px(style.paddingRight));
    if (width !== this.width) {
      this.width = width;
      return;
    }
    const chart = this.chartHeight();
    const content = this.contentHeight(card, inner);
    if (content === void 0) {
      return;
    }
    const room = this.heldRoom(card, content);
    if (room !== void 0) {
      this.filled = 0;
      if (chart !== void 0) {
        const least = this.shape() === "charts" ? 4 * MIN_SMALL_CHART : MIN_CHART;
        const extra = Math.max(least - chart, this.extra + Math.floor(room - content));
        this.grow(chart, extra);
      }
      return;
    }
    const limit = fillLimit(this.config, this.layout, this.minimum());
    if (!limit) {
      this.filled = 0;
      this.grow(chart, 0);
      return;
    }
    const own = content - (chart === void 0 ? 0 : this.extra + 2 * this.gap);
    const filled = filledHeight(own, this.config, limit);
    this.filled = filled;
    this.grow(chart, chart === void 0 ? 0 : spareRoom(filled, own));
  }
  /** Gives a chart `extra` pixels over its own height, of which the first widen its gaps above and below, up to 20 px each. */
  grow(chart, extra) {
    if (chart === void 0) {
      this.extra = 0;
      this.gap = 0;
      return;
    }
    const gap = Math.min(CHART_GAP_PX, Math.max(0, Math.floor(extra / 2)));
    this.gap = extra > 0 ? gap : 0;
    this.extra = extra - 2 * this.gap;
  }
  /**
   * The content's height as drawn: from the card's top to the end of its last part, with the card's padding and
   * border under it. A part that scrolls counts at its whole height, so a held card knows what it would need.
   */
  contentHeight(card, inner) {
    const parts = [...inner.querySelectorAll(":scope > .part")];
    const last = parts.at(-1);
    if (!last) {
      return void 0;
    }
    const scale = drawnScale(card);
    const hidden = parts.reduce(
      (sum, part) => sum + (part.classList.contains("scroller") ? part.scrollHeight - part.clientHeight : 0),
      0
    );
    const gaps = (parts.length - 1) * px(getComputedStyle(inner).rowGap);
    const heights = parts.reduce((sum, part) => sum + part.getBoundingClientRect().height / scale, 0);
    return heights + hidden + gaps + px(getComputedStyle(inner).paddingTop) + px(getComputedStyle(inner).paddingBottom) + px(getComputedStyle(card).borderTopWidth) + px(getComputedStyle(card).borderBottomWidth);
  }
  /** The height the card is held to, or undefined while it takes its content's. A card growing up to a limit is held once its content passes it. */
  heldRoom(card, content) {
    const config = this.config ?? {};
    if (this.growsToLimit()) {
      const limit = Math.max(config.max_height ?? 0, this.minimum());
      const own = content - (this.chartHeight() === void 0 ? 0 : this.extra + 2 * this.gap);
      this.held = own > limit ? limit : 0;
      return this.held || void 0;
    }
    this.held = 0;
    return heightStyle(config, this.layout, this.minimum()) ? card.offsetHeight : void 0;
  }
  isHeld() {
    return this.held > 0 || heightStyle(this.config ?? {}, this.layout, this.minimum()) !== "" && !this.growsToLimit();
  }
  growsToLimit() {
    const config = this.config ?? {};
    return heightMode(config) === "max" && heightStyle(config, this.layout, this.minimum()).startsWith("max-height");
  }
  cardStyle() {
    const gap = this.gap ? `--sleep-gap: ${this.gap}px` : "";
    const height = this.held ? `height: ${this.held}px` : filledStyle(this.config ?? {}, this.layout, this.minimum(), this.filled);
    return [height, gap].filter(Boolean).join("; ");
  }
  // ---- Formats ----
  zone() {
    return this.hass?.locale?.time_zone === "server" ? this.hass.config?.time_zone : void 0;
  }
  today() {
    return new Intl.DateTimeFormat("en-CA", { timeZone: this.zone(), year: "numeric", month: "2-digit", day: "2-digit" }).format(
      /* @__PURE__ */ new Date()
    );
  }
  /** A time as hours from the night's evening midnight, so the next morning's 07:15 is 31.25. */
  hourOfNight(iso, date) {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: this.zone(),
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23"
    }).formatToParts(new Date(iso));
    const part = (type) => parts.find((entry) => entry.type === type)?.value ?? "0";
    const day = `${part("year")}-${part("month")}-${part("day")}`;
    const hour = Number(part("hour")) + Number(part("minute")) / 60;
    return day > date ? hour + 24 : hour;
  }
  time(iso) {
    return new Intl.DateTimeFormat(this.language(), { timeZone: this.zone(), hour: "2-digit", minute: "2-digit" }).format(
      new Date(iso)
    );
  }
  dayLabel(date) {
    return new Intl.DateTimeFormat(this.language(), { timeZone: "UTC", day: "numeric", month: "numeric" }).format(
      /* @__PURE__ */ new Date(`${date}T00:00:00Z`)
    );
  }
  monthLabel(date) {
    return new Intl.DateTimeFormat(this.language(), { timeZone: "UTC", month: "long", year: "numeric" }).format(
      /* @__PURE__ */ new Date(`${date}T00:00:00Z`)
    );
  }
  number(value, decimals) {
    if (value === void 0) {
      return "\u2013";
    }
    return new Intl.NumberFormat(numberLocale(this.hass, this.language()), {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
      useGrouping: this.hass?.locale?.number_format !== "none"
    }).format(value);
  }
  duration(minutes) {
    return this.text("common.duration", { hours: String(Math.floor(minutes / 60)), minutes: String(minutes % 60).padStart(2, "0") });
  }
  value(metric, value) {
    switch (metric) {
      case "usage":
        return value === void 0 ? "\u2013" : this.duration(Math.round(value * 60));
      case "leak":
        return `${this.number(value, 1)} L/min`;
      case "score":
        return this.number(value, 0);
      default:
        return this.number(value, 1);
    }
  }
  roomValue(room, value) {
    return room === "temperature" ? `${this.number(value, 1)} ${this.temperatureUnit()}` : `${this.number(value, 0)} %`;
  }
  /** The unit of the machine's temperature sensor, which is the room's own sensor's. */
  temperatureUnit() {
    const id = this.deviceEntities().find((entity) => this.hass?.entities?.[entity]?.translation_key === "temperature");
    const unit = id ? this.hass?.states[id]?.attributes.unit_of_measurement : void 0;
    return typeof unit === "string" ? unit : "\xB0C";
  }
  message(text) {
    return b2`<ha-card><div class="card message">${text}</div></ha-card>`;
  }
  text(key, replacements = {}) {
    let text = translate(this.language(), key);
    for (const [name, value] of Object.entries(replacements)) {
      text = text.replaceAll(`{${name}}`, value);
    }
    return text;
  }
  language() {
    return this.hass?.locale?.language ?? this.hass?.language ?? browserLanguage();
  }
  static get styles() {
    return [
      fadeStyles,
      i`
                /* As tall as a sections view's grid rows make its cell, which a card held by them fills. */
                :host {
                    display: block;
                    height: 100%;
                    --sleep-good: var(--sleep-good-color, var(--success-color, #4caf50));
                    --sleep-high: var(--sleep-high-color, var(--warning-color, #ff9800));
                    --sleep-bad: var(--sleep-bad-color, var(--error-color, #db4437));
                    --sleep-score: var(--sleep-score-color, var(--primary-color, #03a9f4));
                    --sleep-temperature: var(--sleep-temperature-color, var(--warning-color, #ff9800));
                    --sleep-humidity: var(--sleep-humidity-color, var(--info-color, #039be5));
                }
                ha-card {
                    height: 100%;
                    overflow: hidden;
                    transition: none;
                    box-sizing: border-box;
                    display: flex;
                    flex-direction: column;
                    container-type: inline-size;
                }
                .card {
                    display: flex;
                    flex-direction: column;
                    flex: 1 0 auto;
                    gap: 12px;
                    box-sizing: border-box;
                    padding: 16px;
                    min-height: 0;
                }
                ha-card.spread:not(.held) .card {
                    justify-content: space-between;
                }
                ha-card.held .card {
                    flex: 1 1 0;
                }
                ha-card.held .scroller {
                    flex: 1 1 0;
                    min-height: 0;
                    overflow-y: auto;
                }
                .chart {
                    margin: var(--sleep-gap, 0px) 0;
                }
                .message,
                .muted {
                    color: var(--secondary-text-color);
                }
                .message {
                    padding: 16px;
                }
                .head {
                    display: flex;
                    align-items: baseline;
                    gap: 8px;
                    flex-wrap: wrap;
                }
                .title {
                    font-size: 16px;
                    font-weight: 500;
                    flex: 1 1 auto;
                }
                .aside {
                    display: flex;
                    align-items: baseline;
                    gap: 8px;
                    color: var(--secondary-text-color);
                    font-size: 12px;
                }
                .score {
                    font-weight: 600;
                    font-size: 12px;
                }
                .chips {
                    display: flex;
                    gap: 6px;
                    flex-wrap: wrap;
                }
                .chip {
                    font: inherit;
                    font-size: 12px;
                    border: 1px solid var(--divider-color);
                    background: none;
                    color: var(--secondary-text-color);
                    border-radius: 999px;
                    padding: 3px 10px;
                    cursor: pointer;
                }
                .chip.on {
                    border-color: var(--primary-color);
                    color: var(--primary-color);
                }
                svg {
                    display: block;
                    overflow: visible;
                    font-family: inherit;
                }
                svg text {
                    font-size: 10px;
                    fill: var(--secondary-text-color);
                }
                svg .grid {
                    stroke: var(--divider-color);
                }
                svg .dashed {
                    stroke-dasharray: 3 3;
                }
                svg .goal {
                    stroke: var(--sleep-high);
                    stroke-width: 1.2;
                }
                svg .goal-label {
                    fill: var(--sleep-high);
                    font-weight: 500;
                    paint-order: stroke;
                    stroke: var(--ha-card-background, var(--card-background-color));
                    stroke-width: 3px;
                    stroke-linejoin: round;
                }
                svg .session {
                    fill: color-mix(in srgb, var(--sleep-score) 35%, transparent);
                    stroke: var(--sleep-score);
                }
                svg .session-label {
                    font-size: 11px;
                    fill: var(--primary-text-color);
                }
                .parts {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 4px 14px;
                    font-size: 12px;
                    color: var(--secondary-text-color);
                }
                .parts b {
                    color: var(--primary-text-color);
                    font-weight: 600;
                }
                .figures {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    column-gap: 18px;
                }
                /* One column on a card narrower than 380 px. */
                @container (max-width: 346px) {
                    .figures {
                        grid-template-columns: 1fr;
                    }
                }
                .figure {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 7px 0;
                    border-bottom: 1px solid var(--divider-color);
                    font-size: 14px;
                }
                .figure ha-icon {
                    color: var(--state-icon-color);
                    --mdc-icon-size: 18px;
                }
                .figure .label {
                    flex: 1 1 auto;
                }
                .figure .value {
                    font-weight: 600;
                    white-space: nowrap;
                }
                .dot {
                    display: inline-block;
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    margin-left: 6px;
                }
                .small-label {
                    font-size: 12px;
                    color: var(--secondary-text-color);
                    margin-bottom: 2px;
                }
                .months {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(136px, 1fr));
                    gap: 14px;
                }
                .month {
                    max-width: 210px;
                }
                .month-name {
                    font-size: 12px;
                    color: var(--secondary-text-color);
                    margin-bottom: 6px;
                }
                .grid {
                    display: grid;
                    grid-template-columns: repeat(7, 1fr);
                    gap: 3px;
                }
                .weekday {
                    font-size: 10px;
                    color: var(--secondary-text-color);
                    text-align: center;
                }
                .day {
                    aspect-ratio: 1;
                    border-radius: 4px;
                    font-size: 9px;
                    display: flex;
                    align-items: flex-end;
                    justify-content: flex-end;
                    padding: 2px 3px;
                    box-sizing: border-box;
                    background: color-mix(in srgb, var(--divider-color) 60%, transparent);
                    color: var(--primary-text-color);
                }
                .day.good {
                    background: color-mix(in srgb, var(--sleep-good) 55%, transparent);
                }
                .day.high {
                    background: color-mix(in srgb, var(--sleep-high) 60%, transparent);
                }
                .day.bad {
                    background: color-mix(in srgb, var(--sleep-bad) 65%, transparent);
                }
                .day.unused {
                    background: color-mix(in srgb, var(--sleep-bad) 12%, transparent);
                }
                .day.outside {
                    background: none;
                }
                .legend {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 4px 12px;
                    font-size: 11px;
                    color: var(--secondary-text-color);
                }
                .legend span::before {
                    content: "";
                    display: inline-block;
                    width: 9px;
                    height: 9px;
                    border-radius: 3px;
                    margin-right: 5px;
                    vertical-align: -1px;
                }
                .legend .good::before {
                    background: var(--sleep-good);
                }
                .legend .high::before {
                    background: var(--sleep-high);
                }
                .legend .bad::before {
                    background: var(--sleep-bad);
                }
                .legend .unused::before {
                    background: color-mix(in srgb, var(--sleep-bad) 25%, transparent);
                }
                .bins-head,
                .bin {
                    display: grid;
                    grid-template-columns: 78px 1fr auto;
                    gap: 8px;
                    align-items: center;
                }
                .bins-head {
                    font-size: 11px;
                    color: var(--secondary-text-color);
                }
                .bin {
                    font-size: 13px;
                    padding: 4px 0;
                }
                .track {
                    height: 14px;
                    background: var(--divider-color);
                    border-radius: 5px;
                    overflow: hidden;
                }
                .fill {
                    display: block;
                    height: 100%;
                    border-radius: 5px;
                    opacity: 0.85;
                }
                .figure-value {
                    font-weight: 600;
                    white-space: nowrap;
                }
                .empty {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
            `
    ];
  }
};
__decorateClass([
  n4({ attribute: false })
], ResmedMyairSleepCard.prototype, "hass", 2);
__decorateClass([
  n4({ attribute: false })
], ResmedMyairSleepCard.prototype, "layout", 2);
__decorateClass([
  r5()
], ResmedMyairSleepCard.prototype, "config", 2);
__decorateClass([
  r5()
], ResmedMyairSleepCard.prototype, "nights", 2);
__decorateClass([
  r5()
], ResmedMyairSleepCard.prototype, "error", 2);
__decorateClass([
  r5()
], ResmedMyairSleepCard.prototype, "picked", 2);
__decorateClass([
  r5()
], ResmedMyairSleepCard.prototype, "width", 2);
__decorateClass([
  r5()
], ResmedMyairSleepCard.prototype, "extra", 2);
__decorateClass([
  r5()
], ResmedMyairSleepCard.prototype, "gap", 2);
__decorateClass([
  r5()
], ResmedMyairSleepCard.prototype, "filled", 2);
__decorateClass([
  r5()
], ResmedMyairSleepCard.prototype, "held", 2);
function px(value) {
  return Number.parseFloat(value) || 0;
}
if (!customElements.get("resmed-myair-sleep-card")) {
  console.info(
    `%c  RESMED-MYAIR-SLEEP-CARD 
%c  ${CARD_VERSION}    `,
    "color: orange; font-weight: bold; background: black",
    "color: white; font-weight: bold; background: dimgray"
  );
  const registry = window;
  registry.customCards = registry.customCards ?? [];
  registry.customCards.push({
    type: "resmed-myair-sleep-card",
    name: translate(browserLanguage(), "common.name"),
    description: translate(browserLanguage(), "common.description"),
    documentationURL: "https://github.com/jesmak/resmed_myair_sleep#sleep-card",
    preview: true
  });
  customElements.define("resmed-myair-sleep-card", ResmedMyairSleepCard);
}
export {
  ResmedMyairSleepCard
};
