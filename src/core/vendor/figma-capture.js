// Adapted from Copy to Design 1.3.0 capture.js; see figma-capture.SOURCE.md.
const FIGMA_CAPTURE = (() => {
  "use strict";
  const assetFailures = new Set();
  class la extends Error {
    constructor(e = "Capture timed out") {
      (super(e), (this.name = "H2DCaptureTimeoutError"));
    }
  }
  function ca(t) {
    const e = new AbortController();
    let n = t,
      r = document.hidden ? null : Date.now(),
      o = r ? a() : null;
    function i() {
      (document.removeEventListener("visibilitychange", s),
        o !== null && (window.clearTimeout(o), (o = null)));
    }
    function a() {
      return window.setTimeout(() => {
        (i(), e.abort(new la()));
      }, n);
    }
    function s() {
      if (document.hidden) {
        o !== null &&
          (window.clearTimeout(o),
          (o = null),
          (n -= Date.now() - (r ?? Date.now())),
          (r = null));
        return;
      }
      o === null && n > 0 && ((r = Date.now()), (o = a()));
    }
    return (
      document.addEventListener("visibilitychange", s),
      e.signal.addEventListener("abort", i, { once: !0 }),
      e.signal
    );
  }
  const ua = "<!--(figh2d)",
    da = "(/figh2d)-->",
    fa = `<span data-h2d="${ua}`,
    ha = `${da}"></span>`,
    ga = "<!--(figmeta)",
    ma = "(/figmeta)-->",
    pa = `<span data-metadata="${ga}`,
    ya = `${ma}"></span>`;
  function Dn(t) {
    const e = new TextEncoder().encode(t);
    let n = "";
    const r = 32768;
    for (let o = 0; o < e.length; o += r)
      n += String.fromCharCode(...e.subarray(o, o + r));
    return btoa(n);
  }
  function ba(t) {
    const e = new Date().toISOString(),
      r = `${pa}${Dn(JSON.stringify({ dataType: "h2d", source: "copy-to-design", capturedAtIso: e, h2d: { v: 1, origin: { source: "copy-to-design", capturedAtIso: e } } }))}${ya}`,
      o = `${fa}${Dn(t)}${ha}`;
    return r + o;
  }
  const wa = { verbose: !1, log: (...t) => {}, error: (...t) => {} },
    xa = Object.defineProperty,
    Sa = Object.defineProperties,
    Ea = Object.getOwnPropertyDescriptors,
    Wt = Object.getOwnPropertySymbols,
    $n = Object.prototype.hasOwnProperty,
    Hn = Object.prototype.propertyIsEnumerable,
    Me = (t, e, n) =>
      e in t
        ? xa(t, e, { enumerable: !0, configurable: !0, writable: !0, value: n })
        : (t[e] = n),
    Q = (t, e) => {
      for (var n in e || (e = {})) $n.call(e, n) && Me(t, n, e[n]);
      if (Wt) for (var n of Wt(e)) Hn.call(e, n) && Me(t, n, e[n]);
      return t;
    },
    Bn = (t, e) => Sa(t, Ea(e)),
    Un = (t, e) => {
      var n = {};
      for (var r in t) $n.call(t, r) && e.indexOf(r) < 0 && (n[r] = t[r]);
      if (t != null && Wt)
        for (var r of Wt(t)) e.indexOf(r) < 0 && Hn.call(t, r) && (n[r] = t[r]);
      return n;
    },
    F = (t, e) => () => (t && (e = t((t = 0))), e),
    Y = (t, e, n) => (Me(t, typeof e != "symbol" ? e + "" : e, n), n),
    B = (t, e, n) =>
      new Promise((r, o) => {
        var i = (l) => {
            try {
              s(n.next(l));
            } catch (c) {
              o(c);
            }
          },
          a = (l) => {
            try {
              s(n.throw(l));
            } catch (c) {
              o(c);
            }
          },
          s = (l) =>
            l.done ? r(l.value) : Promise.resolve(l.value).then(i, a);
        s((n = n.apply(t, e)).next());
      });
  function Ta(t) {
    let e = t.tagName;
    return typeof e == "string"
      ? e.toUpperCase()
      : t instanceof HTMLFormElement
        ? "FORM"
        : null;
  }
  function va(t, e) {
    var n;
    if (!t) return null;
    if (t === "open-quote" || t === "close-quote") {
      let o =
        e && e !== "auto"
          ? Array.from(e.matchAll(/"((?:[^"\\]|\\.)*)"/g), (i) => zn(i[1]))
          : ["“", "”", "‘", "’"];
      return t === "open-quote"
        ? (n = o[0]) != null
          ? n
          : "“"
        : (n = o[1]) != null
          ? n
          : "”";
    }
    let r = t.match(/^"((?:[^"\\]|\\.)*)"/);
    return r ? zn(r[1]) : null;
  }
  function zn(t) {
    return t.replace(/\\([0-9a-fA-F]{1,6})\s?|\\(.)/g, (e, n, r) => {
      if (!n) return r ?? "";
      let o = parseInt(n, 16);
      return o <= 1114111 ? String.fromCodePoint(o) : "�";
    });
  }
  var Wn = F(() => {});
  function Ma(t, e) {
    return e != null && e.preserveOriginalAttributes && Aa(t)
      ? !1
      : !(
          t instanceof HTMLScriptElement ||
          (t.nodeType === Node.ELEMENT_NODE &&
            t.getAttribute("data-h2d-ignore") === "true")
        );
  }
  var Ca = new Set([
    "AREA",
    "AUDIO",
    "BASE",
    "BR",
    "CANVAS",
    "COL",
    "EMBED",
    "HR",
    "IFRAME",
    "IMG",
    "INPUT",
    "LINK",
    "META",
    "METER",
    "OBJECT",
    "PARAM",
    "PROGRESS",
    "SELECT",
    "SOURCE",
    "TEXTAREA",
    "TRACK",
    "VIDEO",
    "WBR",
  ]);
  function Aa(t) {
    if (
      !(t instanceof HTMLElement) ||
      t.childNodes.length !== 0 ||
      Ca.has(t.tagName) ||
      Ce(t)
    )
      return !1;
    let e = getComputedStyle(t),
      n = t.getBoundingClientRect();
    return Na(e) || Gn(t, "::before") || Gn(t, "::after") || ka(e)
      ? !1
      : n.width <= 0 && n.height <= 0;
  }
  function Na(t) {
    return t.backgroundImage !== "none" ||
      t.boxShadow !== "none" ||
      t.outlineStyle !== "none" ||
      (t.backgroundColor &&
        !/^rgba\(0,\s*0,\s*0,\s*0\)$/i.test(t.backgroundColor) &&
        t.backgroundColor !== "transparent")
      ? !0
      : ["Top", "Right", "Bottom", "Left"].some(
          (e) =>
            t[`border${e}Style`] !== "none" &&
            parseFloat(t[`border${e}Width`]) > 0,
        );
  }
  function Gn(t, e) {
    let n = getComputedStyle(t, e),
      r = n.content;
    return r && r !== "none" && r !== "normal" && r !== '""';
  }
  function ka(t) {
    return [
      "marginTop",
      "marginRight",
      "marginBottom",
      "marginLeft",
      "paddingTop",
      "paddingRight",
      "paddingBottom",
      "paddingLeft",
    ].some((e) => parseFloat(t[e]) > 0);
  }
  function Ce(t) {
    if (!t) return null;
    if (t.openOrClosedShadowRoot) return t.openOrClosedShadowRoot;
    if (t instanceof HTMLElement)
      try {
        let e = globalThis.chrome;
        if (e && e.dom && e.dom.openOrClosedShadowRoot) {
          let n = e.dom.openOrClosedShadowRoot(t);
          if (n) return n;
        }
      } catch {}
    return t.shadowRoot || null;
  }
  function Ra(t) {
    if (t)
      try {
        return JSON.parse(t);
      } catch {
        return;
      }
  }
  var Ia = new Set([
      "align",
      "background",
      "bgcolor",
      "border",
      "cellpadding",
      "cellspacing",
      "color",
      "cols",
      "colspan",
      "dir",
      "face",
      "frameborder",
      "framespacing",
      "height",
      "hidden",
      "lang",
      "media",
      "name",
      "noresize",
      "nowrap",
      "rowspan",
      "rows",
      "scrolling",
      "sizes",
      "style",
      "valign",
      "width",
    ]),
    La = new Set(["integrity", "nonce", "srcdoc"]),
    Oa = new Set(["rows", "cols"]);
  function Ae(t, e) {
    let n = {},
      r = !!e?.preserveOriginalAttributes,
      o = new Set(e?.allowedDataAttributes || []);
    for (let { name: i, value: a } of t.attributes) {
      let s = i.toLowerCase();
      if (r && s === "onclick") {
        n[i] = "";
        continue;
      }
      ((Pr.has(s) ||
        s.startsWith("aria-") ||
        (t.tagName === "FRAMESET" && Oa.has(s)) ||
        (r && Ia.has(s)) ||
        (r && _a(s, o))) &&
        (n[i] = a),
        r && s === "background" && (n[i] = Fa(a)));
    }
    if (
      (t instanceof HTMLImageElement &&
        (t.currentSrc && (n.currentSrc = t.currentSrc),
        t.src && n.src == null && (n.src = t.src),
        t.alt && n.alt == null && (n.alt = t.alt)),
      t instanceof HTMLVideoElement &&
        (t.poster && (n.poster = t.poster),
        t.currentSrc && (n.currentSrc = t.currentSrc),
        t.src && n.src == null && (n.src = t.src)),
      t instanceof HTMLIFrameElement && t.name && (n.name = t.name),
      t instanceof HTMLInputElement &&
        (n.type == null && (n.type = t.type),
        t.value && (n.value = t.value),
        t.checked && (n.checked = "checked")),
      t instanceof HTMLTextAreaElement && t.value && (n.value = t.value),
      t instanceof HTMLOptionElement && t.selected && (n.selected = "selected"),
      t instanceof HTMLDetailsElement && t.open && (n.open = "open"),
      r)
    ) {
      let i = Ce(t);
      i && (n["data-ctd-shadow-root"] = i.mode || "open");
    }
    return n;
  }
  function Fa(t) {
    let e = String(t || "").trim();
    if (!e || /^(?:data|blob):/i.test(e) || e.startsWith("#")) return e;
    try {
      return new URL(e, document.baseURI).href;
    } catch {
      return e;
    }
  }
  function _a(t, e) {
    return !(!e.has(t) || t.startsWith("on") || La.has(t));
  }
  function* Pa(t) {
    let e = t[Symbol.iterator](),
      n = e.next();
    for (; !n.done;)
      if (n.value.nodeType === Node.TEXT_NODE) {
        let r = [n.value];
        for (n = e.next(); !n.done && n.value.nodeType === Node.TEXT_NODE;)
          (r.push(n.value), (n = e.next()));
        yield r;
      } else (yield n.value, (n = e.next()));
  }
  function Vn(t, e) {
    var n, r, o, i;
    return t.getLineBoxHeight(
      (n = e.fontFamily) != null ? n : "Times",
      (r = e.fontStretch) != null ? r : "100%",
      e.fontStyle === "italic" ? "italic" : "normal",
      (o = e.fontWeight) != null ? o : "400",
      (i = e.fontSize) != null ? i : "16px",
    );
  }
  function jn(t, e) {
    var n, r, o, i;
    t.addFontFamily(
      (n = e.fontFamily) != null ? n : "Times",
      (r = e.fontStretch) != null ? r : "100%",
      e.fontStyle === "italic" ? "italic" : "normal",
      (o = e.fontWeight) != null ? o : "400",
      (i = e.fontSize) != null ? i : "16px",
    );
  }
  function Xn(t) {
    if (!t.endsWith("%")) return t.toLowerCase();
    let e = parseFloat(t);
    return isNaN(e)
      ? "normal"
      : e <= 50
        ? "ultra-condensed"
        : e <= 62.5
          ? "extra-condensed"
          : e <= 75
            ? "condensed"
            : e <= 87.5
              ? "semi-condensed"
              : e <= 100
                ? "normal"
                : e <= 112.5
                  ? "semi-expanded"
                  : e <= 125
                    ? "expanded"
                    : e <= 150
                      ? "extra-expanded"
                      : "ultra-expanded";
  }
  function Da(t) {
    var e, n, r;
    let o = [],
      i = /(?:"([^"]+)"|'([^']+)'|([^,\s][^,]*))/g,
      a;
    for (; (a = i.exec(t)) !== null;) {
      let s =
        (r = (n = (e = a[1]) != null ? e : a[2]) != null ? n : a[3]) == null
          ? void 0
          : r.trim();
      s && o.push(s);
    }
    return o;
  }
  var Yn,
    qn = F(() => {
      Yn = class {
        constructor() {
          (Y(this, "families", new Map()),
            Y(this, "processedUsages", new Set()),
            Y(this, "lineBoxHeightCache", new Map()),
            Y(this, "unavailable", new Set()),
            Y(this, "_canvas", null),
            Y(this, "_ctx", null));
        }
        get ctx() {
          return (
            this._ctx ||
              ((this._canvas = document.createElement("canvas")),
              (this._ctx = this._canvas.getContext("2d"))),
            this._ctx
          );
        }
        checkFontAvailable(t, e, n, r) {
          if (!this.ctx) return !1;
          let o = "mmmmmmmmmmlli",
            i = "72px",
            a = Xn(e),
            s = ["monospace", "sans-serif", "serif"];
          for (let l of s) {
            this.ctx.font = `${a} ${n} ${r} ${i} ${l}`;
            let c = this.ctx.measureText(o).width;
            this.ctx.font = `${a} ${n} ${r} ${i} "${t}", ${l}`;
            let u = this.ctx.measureText(o).width;
            if (c !== u) return !0;
          }
          return !1;
        }
        collectWebFontFaces() {}
        addFontFamily(t, e, n, r, o) {
          let i = Da(t);
          for (let a of i) {
            let s = a.toLowerCase(),
              l = `${s}|${e}|${n}|${r}`;
            if (!this.unavailable.has(l)) {
              if (this.families.has(s)) {
                this.addUsage(s, e, n, r, o, t);
                return;
              }
              if (!this.checkFontAvailable(a, e, n, r)) {
                this.unavailable.add(l);
                continue;
              }
              (this.families.set(s, { familyName: a, faces: [], usages: [] }),
                this.addUsage(s, e, n, r, o, t));
              return;
            }
          }
        }
        measureMetrics(t, e, n, r, o) {
          if (!this.ctx) return;
          let i = this.families.get(t.toLowerCase());
          if (!i) return;
          let a = Xn(e);
          this.ctx.font = `${a} ${n} ${r} ${o} "${i.familyName}"`;
          let s = this.ctx.measureText("Hg");
          return {
            fontBoundingBoxAscent: s.fontBoundingBoxAscent,
            fontBoundingBoxDescent: s.fontBoundingBoxDescent,
          };
        }
        getLineBoxHeight(t, e, n, r, o) {
          var i;
          let a = `${t}|${e}|${n}|${r}|${o}`;
          return (i = this.lineBoxHeightCache.get(a)) != null ? i : null;
        }
        addUsage(t, e, n, r, o, i) {
          let a = `${t}|${e}|${n}|${r}|${o}`;
          if (this.processedUsages.has(a)) return;
          this.processedUsages.add(a);
          let s = this.families.get(t);
          if (!s) return;
          let l = this.measureMetrics(t, e, n, r, o);
          if (
            (s.usages.push({
              fontWeight: r,
              fontStyle: n,
              fontStretch: e,
              fontSize: o,
              metrics: l,
            }),
            l)
          ) {
            let c = l.fontBoundingBoxAscent + l.fontBoundingBoxDescent,
              u = `${i}|${e}|${n}|${r}|${o}`;
            this.lineBoxHeightCache.set(u, c);
          }
        }
        getFonts() {
          return (
            this.collectWebFontFaces(),
            Object.fromEntries(this.families)
          );
        }
      };
    });
  function Kn(t, e, n) {
    if (t instanceof HTMLElement && (Ne(e) || n))
      return { width: t.offsetWidth, height: t.offsetHeight };
    if (t instanceof HTMLElement) {
      let r = t.getBoundingClientRect();
      return { width: r.width, height: r.height };
    } else if (t instanceof SVGSVGElement) {
      let r = getComputedStyle(t);
      return {
        width: parseFloat(r.width) || t.width.baseVal.value,
        height: parseFloat(r.height) || t.height.baseVal.value,
      };
    } else if (t instanceof SVGGraphicsElement) {
      let r = t.getBBox();
      return { width: r.width, height: r.height };
    } else if (t instanceof MathMLElement) {
      let r = t.getBoundingClientRect();
      return { width: r.width, height: r.height };
    } else {
      if (t instanceof Text)
        throw new Error("Text nodes should be handled separately");
      return { width: 0, height: 0 };
    }
  }
  function Zn(t, e) {
    return t.endsWith("%") ? `${(parseFloat(t) / 100) * e}px` : t;
  }
  function $a(t, e) {
    var n, r, o;
    if (!e) return new DOMMatrix();
    let i = e.trim().split(/\s+/);
    if (i.length === 0) return new DOMMatrix();
    if (i.length > 3) throw new Error(`Invalid translate: ${e}`);
    let a = Zn((n = i[0]) != null ? n : "0px", t.width),
      s = Zn((r = i[1]) != null ? r : "0px", t.height),
      l = (o = i[2]) != null ? o : "0px";
    return new DOMMatrix(`translate3d(${a},${s},${l})`);
  }
  function Ha(t) {
    var e;
    if (!t) return new DOMMatrix();
    let n = t.trim().split(/\s+/);
    if (n.length === 0) return new DOMMatrix();
    if (n.length > 3) throw new Error(`Invalid scale: ${t}`);
    return new DOMMatrix(
      `scale3d(${n[0]},${(e = n[1]) != null ? e : n[0]},${(e = n[2]) != null ? e : 1})`,
    );
  }
  function Ba(t) {
    if (!t) return new DOMMatrix();
    let e = t.trim().split(/\s+/);
    if (e.length === 0) return new DOMMatrix();
    if (e.length === 1) return new DOMMatrix(`rotate(${e[0]})`);
    if (e.length === 2)
      switch (e[0]) {
        case "x":
          return new DOMMatrix(`rotateX(${e[1]})`);
        case "y":
          return new DOMMatrix(`rotateY(${e[1]})`);
        case "z":
          return new DOMMatrix(`rotateZ(${e[1]})`);
        default:
          return new DOMMatrix();
      }
    return e.length === 4
      ? new DOMMatrix(`rotate3d(${e[0]},${e[1]},${e[2]},${e[3]})`)
      : new DOMMatrix();
  }
  function Jn(t, e) {
    var n;
    if (!Ne(e)) return null;
    try {
      let [r = "0px", o = "0px", i = "0px"] =
          (n = e.transformOrigin) == null ? void 0 : n.trim().split(/\s+/),
        a = new DOMMatrix(`translate3d(${r},${o},${i})`);
      return a
        .multiply($a(t, e.translate))
        .multiply(Ba(e.rotate))
        .multiply(Ha(e.scale))
        .multiply(new DOMMatrix((n = e.transform) != null ? n : "none"))
        .multiply(a.inverse());
    } catch {
      return null;
    }
  }
  function Qn(t, e, n) {
    if (!e) return t;
    try {
      let r = e.inverse();
      if (n) {
        let { x: o, y: i } = n;
        r = new DOMMatrix().translate(o, i).multiply(r).translate(-o, -i);
      }
      return t ? r.multiply(t) : r;
    } catch {
      return t;
    }
  }
  function Ua(t, e, n, r, o) {
    let i = new DOMPoint(t.x + t.width / 2, t.y + t.height / 2),
      a = new DOMPoint(e / 2, n / 2),
      s = r ? i.matrixTransform(r) : i,
      l = o ? a.matrixTransform(o) : a;
    return { x: s.x - l.x, y: s.y - l.y };
  }
  function za(t) {
    return (
      Math.abs(t.a - 1) > 1e-6 ||
      Math.abs(t.b) > 1e-6 ||
      Math.abs(t.c) > 1e-6 ||
      Math.abs(t.d - 1) > 1e-6 ||
      Math.abs(t.e) > 1e-6 ||
      Math.abs(t.f) > 1e-6
    );
  }
  function tr(t, e, n, r) {
    let o = t.getBoundingClientRect();
    if (!r && !n) return { x: o.x, y: o.y, width: e.width, height: e.height };
    let i = Math.max(e.width, 0.01),
      a = Math.max(e.height, 0.01);
    try {
      let s = Ua(o, i, a, r, n),
        l = { x: s.x, y: s.y, width: e.width, height: e.height };
      if (n && za(n))
        try {
          l.quad = Ya(n, i, a, s);
        } catch {}
      return l;
    } catch {
      return { x: o.x, y: o.y, width: e.width, height: e.height };
    }
  }
  function Wa(t) {
    let e = t.a * t.d - t.b * t.c;
    return Math.abs(e) < 1e-10
      ? null
      : { a: t.d / e, b: -t.b / e, c: -t.c / e, d: t.a / e };
  }
  function Ga(t, e, n) {
    let r = n.a * n.d - n.b * n.c;
    if (Math.abs(r) < 1e-10) return null;
    let o = (t * n.d - e * n.b) / r,
      i = (e * n.a - t * n.c) / r;
    return o <= 0 || i <= 0 ? null : { width: o, height: i };
  }
  function er(t, e, n) {
    if (t.length === 0) return null;
    let r = [];
    for (let o of t) {
      let i = n(o);
      if (!i) continue;
      let a = new DOMPoint(
        o.x + o.width / 2,
        o.y + o.height / 2,
      ).matrixTransform(e);
      r.push(
        new DOMRect(a.x - i.width / 2, a.y - i.height / 2, i.width, i.height),
      );
    }
    return r.length > 0 ? r : null;
  }
  function Va(t, e, n, r) {
    let o = Math.abs(n.a),
      i = Math.abs(n.b),
      a = Math.abs(n.c),
      s = Math.abs(n.d),
      l = o >= i;
    return (l ? o : i) < 1e-10
      ? null
      : er(t, e, (c) => {
          let u = l ? (c.width - a * r) / o : (c.height - s * r) / i;
          return u <= 0 ? null : { width: u, height: r };
        });
  }
  function ja(t, e, n) {
    return er(t, e, (r) => Ga(r.width, r.height, n));
  }
  function Xa(t) {
    return t.length === 0
      ? null
      : t.reduce((e, n) => {
          let r = Math.min(e.x, n.x),
            o = Math.min(e.y, n.y);
          return new DOMRect(
            r,
            o,
            Math.max(e.x + e.width, n.x + n.width) - r,
            Math.max(e.y + e.height, n.y + n.height) - o,
          );
        });
  }
  function nr(t, e) {
    return new DOMQuad(
      t.p1.matrixTransform(e),
      t.p2.matrixTransform(e),
      t.p3.matrixTransform(e),
      t.p4.matrixTransform(e),
    );
  }
  function Ya(t, e, n, r) {
    let o = DOMQuad.fromQuad({
        p1: { x: 0, y: 0 },
        p2: { x: e, y: 0 },
        p3: { x: e, y: n },
        p4: { x: 0, y: n },
      }),
      i = nr(o, t),
      a = nr(i, new DOMMatrix().translate(r.x, r.y));
    return {
      p1: { x: a.p1.x, y: a.p1.y },
      p2: { x: a.p2.x, y: a.p2.y },
      p3: { x: a.p3.x, y: a.p3.y },
      p4: { x: a.p4.x, y: a.p4.y },
    };
  }
  var Ne,
    ke = F(() => {
      Ne = (t) =>
        !!(
          (t.rotate && t.rotate !== "none") ||
          (t.scale && t.scale !== "none") ||
          (t.transform && t.transform !== "none") ||
          (t.translate && t.translate !== "none")
        );
    });
  function rr(t, e, n) {
    var r;
    let o = document.createRange();
    if (Array.isArray(t)) {
      let f = t[0],
        m = t[t.length - 1];
      (o.setStart(f, 0), o.setEnd(m, m.length));
    } else o.selectNode(t);
    let i = o.getBoundingClientRect(),
      a = Array.from(o.getClientRects()).filter(
        (f) => f.width > 0 || f.height > 0,
      ),
      s =
        o.commonAncestorContainer instanceof HTMLElement
          ? window
              .getComputedStyle(o.commonAncestorContainer)
              .writingMode.startsWith("vertical")
          : !1;
    if ((o.detach(), a.length > 0 && e)) {
      let f = Wa(e);
      if (f) {
        let m = n != null ? Va(a, e, f, n) : ja(a, e, f);
        if (m) {
          let g = (r = Xa(m)) != null ? r : i,
            y = or(m, s);
          return {
            x: g.x,
            y: g.y,
            width: g.width,
            height: g.height,
            lineCount: y,
          };
        } else console.warn("Failed to solve text bounding box");
      }
    }
    let { x: l, y: c, width: u, height: d } = i,
      h = or(a, s);
    return { x: l, y: c, width: u, height: d, lineCount: h };
  }
  function or(t, e) {
    let n = t
        .map((i) =>
          e ? { start: i.left, end: i.right } : { start: i.top, end: i.bottom },
        )
        .filter(({ start: i, end: a }) => a > i)
        .sort((i, a) => i.start - a.start),
      r = 0,
      o = -1 / 0;
    for (let { start: i, end: a } of n) {
      let s = (i + a) / 2;
      Math.abs(s - o) >= 1 && (r++, (o = s));
    }
    return r;
  }
  var ir = F(() => {
    ke();
  });
  function qa(t) {
    return B(this, null, function* () {
      let e = {};
      for (let [n, r] of t.assets.entries())
        e[n] = Bn(Q({}, r), { blob: yield Ka(r.blob) });
      return JSON.stringify(Bn(Q({}, t), { assets: e, fonts: t.fonts }));
    });
  }
  function Ka(t) {
    return B(this, null, function* () {
      if (t == null) return null;
      let e = yield t.arrayBuffer(),
        n = yield Za(new Uint8Array(e));
      return { type: t.type, base64Blob: n };
    });
  }
  function Za(t) {
    return B(this, null, function* () {
      return yield new Promise((e, n) => {
        let r = Object.assign(new FileReader(), {
          onload: () => e(r.result),
          onerror: () => n(r.error),
        });
        r.readAsDataURL(
          new File([t], "", { type: "application/octet-stream" }),
        );
      });
    });
  }
  var ar = F(() => {}),
    Ja = F(() => {
      ar();
    });
  function sr(t) {
    if (t) {
      for (let e in t) if (e.startsWith("__reactFiber")) return t[e];
    }
  }
  function Qa(t) {
    var e;
    if (t) {
      let n = (e = t.pendingProps) != null ? e : t.memoizedProps;
      if (n) return ((n = Q({}, n)), delete n.children, n);
    }
  }
  var lr = F(() => {}),
    Re,
    Ie = F(() => {
      Re = "data-fg-";
    });
  function cr(t, e) {
    if (typeof e != "string" || !t) return;
    let n = e.split(":"),
      r = n[0].replace(/\./g, ":"),
      o = n[1] ? "[" + n[1].replace(/\./g, ":") + "]" : "",
      i = n[2],
      a = Number(n[3]),
      s = Number(n[4]),
      l = Number(n[5]),
      c = Number(n[6]);
    switch (n[7]) {
      case "e":
        return {
          type: "element",
          sourceId: t,
          fileGuid: r,
          filePath: i,
          fileVersion: o,
          line: a,
          column: s,
          pos: l,
          len: c,
          name: n[8],
          childTypes: n[9] ? (n[9] === "_" ? [] : n[9].split("")) : void 0,
          isComponentDefinition: n[10] === "1" ? !0 : void 0,
          assetKey: n[11] ? n[11] : void 0,
          makeLibraryId: n[12] ? n[12] : void 0,
          libraryId: n[13] ? n[13] : void 0,
          componentId: n[14] ? n[14] : void 0,
          isLibraryInstance: n[15] === "1" ? !0 : void 0,
        };
      case "t":
        return {
          type: "text",
          sourceId: t,
          fileGuid: r,
          filePath: i,
          fileVersion: o,
          line: a,
          column: s,
          pos: l,
          len: c,
        };
      case "x":
        return {
          type: "expression",
          sourceId: t,
          fileGuid: r,
          filePath: i,
          fileVersion: o,
          line: a,
          column: s,
          pos: l,
          len: c,
        };
    }
  }
  function ts(t) {
    let e = [];
    if (!t) return e;
    for (let [n, r] of Object.entries(t)) {
      if (!rs(n) || typeof r != "string") continue;
      let o = n.split("-");
      if (o.length === 3) {
        let i = cr(o[2], r);
        i && e.push(i);
      }
    }
    return e;
  }
  function es(t) {
    let e = sr(t);
    if (e) {
      let n = Qa(e);
      if (n) {
        let r = ts(n);
        if (r.length > 0) return r;
      }
    } else if (t != null && t.attributes) {
      let n = [];
      for (let r = 0; r < t.attributes.length; r++) {
        let o = t.attributes[r];
        if (o != null && o.name.startsWith(Re)) {
          let i = cr(o.name.split("-")[2], o.value);
          i && n.push(i);
        }
      }
      if (n.length > 0) return n;
    }
  }
  function ns(t) {
    var e;
    return (e = t?.getAttribute("data-fginspector-selected")) != null
      ? e
      : void 0;
  }
  function rs(t) {
    return t.startsWith(Re);
  }
  var os = F(() => {
      (Ie(), lr());
    }),
    is = F(() => {
      Ie();
    }),
    ur = F(() => {
      (lr(), os(), is(), Ie());
    });
  function as(t, e) {
    var n;
    let r = sr(t);
    if (r == null) return e;
    if (r._debugOwner) {
      for (
        ;
        r._debugOwner &&
        ((n = r._debugOwner.memoizedProps) == null ? void 0 : n._fgT) != null;
      )
        r = r._debugOwner;
      let o = r._debugOwner ? fr(r._debugOwner) : void 0;
      return o && dr(o) ? o : e;
    }
    return (n = ss(r)) != null ? n : e;
  }
  function dr(t) {
    return (
      /^[A-Z].{2,}$/.test(t) &&
      !/^Primitive\./i.test(t) &&
      !/^Styled\./i.test(t) &&
      !/Provider$/i.test(t) &&
      !/Context$/i.test(t) &&
      t !== "__next_metadata_boundary__" &&
      !/^[a-zA-Z]+\(.*\)$/.test(t)
    );
  }
  function ss(t) {
    var e;
    let n = t.return;
    for (; n;) {
      if (n.tag === 5) return null;
      if (hr.has((e = n.tag) != null ? e : -1)) {
        let r = fr(n);
        if (r && dr(r)) return r;
      }
      n = n.return;
    }
    return null;
  }
  function fr(t) {
    var e;
    if (typeof t.type == "string") return t.type;
    if (typeof t.type == "function")
      return (e = t.type.displayName) != null ? e : t.type.name;
    if (typeof t.type == "object" && t.type !== null) {
      let n = t.type;
      return (e = n.displayName) != null ? e : n.name;
    }
  }
  var hr,
    ls = F(() => {
      (ur(), (hr = new Set([0, 1, 11, 14, 15])));
    });
  function Le(t, e, n) {
    var r;
    let o = {},
      i = window.getComputedStyle(t, e);
    if (
      (e === "::before" || e === "::after") &&
      (i.content === "none" ||
        i.content === "normal" ||
        i.content === "no-open-quote" ||
        i.content === "no-close-quote")
    )
      return null;
    for (let [l, c] of br) {
      let u = i[l];
      u !== c && (o[l] = u);
    }
    let a = {},
      s = "computedStyleMap" in t && !e ? t.computedStyleMap() : null;
    if (s) {
      for (let l of gr) {
        let c = (r = s?.get(At[l])) == null ? void 0 : r.toString(),
          u =
            n &&
            (l === "width" || l === "height") &&
            parseFloat(i.flexGrow) > 0;
        c && (c === Ct[l] ? u || delete o[l] : c !== o[l] && (a[l] = c));
      }
      for (let l of yr) {
        let c = (r = s.get(At[l])) == null ? void 0 : r.toString();
        c && c !== Ct[l] && c !== o[l] && (a[l] = c);
      }
      for (let l of mr)
        ((r = s.get(At[l])) == null ? void 0 : r.toString()) === "auto" &&
          (o[l] = "auto");
    }
    for (let l of pr)
      o[l.width] == null && (delete o[l.style], delete o[l.color]);
    return (
      o.outlineWidth == null && (delete o.outlineStyle, delete o.outlineColor),
      o.webkitTextFillColor != null &&
        o.webkitTextFillColor === i.color &&
        delete o.webkitTextFillColor,
      { styles: o, computedStyles: a }
    );
  }
  var gr,
    mr,
    pr,
    yr,
    Ct,
    br,
    At,
    wr = F(() => {
      ((gr = [
        "width",
        "height",
        "minWidth",
        "maxWidth",
        "minHeight",
        "maxHeight",
      ]),
        (mr = ["marginTop", "marginRight", "marginBottom", "marginLeft"]),
        (pr = [
          {
            style: "borderTopStyle",
            width: "borderTopWidth",
            color: "borderTopColor",
          },
          {
            style: "borderRightStyle",
            width: "borderRightWidth",
            color: "borderRightColor",
          },
          {
            style: "borderBottomStyle",
            width: "borderBottomWidth",
            color: "borderBottomColor",
          },
          {
            style: "borderLeftStyle",
            width: "borderLeftWidth",
            color: "borderLeftColor",
          },
        ]),
        (yr = [
          "gridTemplateColumns",
          "gridTemplateRows",
          "gridColumnStart",
          "gridColumnEnd",
          "gridRowStart",
          "gridRowEnd",
          "columnGap",
          "rowGap",
          "gridAutoFlow",
          "gridTemplateAreas",
          "gridAutoColumns",
          "gridAutoRows",
        ]),
        (Ct = {
          alignContent: "normal",
          alignItems: "normal",
          alignSelf: "auto",
          aspectRatio: "auto",
          backdropFilter: "none",
          backgroundAttachment: "scroll",
          backgroundBlendMode: "normal",
          backgroundClip: "border-box",
          backgroundColor: "rgba(0, 0, 0, 0)",
          backgroundImage: "none",
          backgroundOrigin: "padding-box",
          backgroundPositionX: "0%",
          backgroundPositionY: "0%",
          backgroundRepeat: "repeat",
          backgroundSize: "auto",
          borderBottomColor: "rgb(0, 0, 0)",
          borderBottomLeftRadius: "0px",
          borderBottomRightRadius: "0px",
          borderBottomStyle: "none",
          borderBottomWidth: "0px",
          borderCollapse: "separate",
          borderImageOutset: "0",
          borderImageRepeat: "stretch",
          borderImageSlice: "100%",
          borderImageSource: "none",
          borderImageWidth: "1",
          borderLeftColor: "rgb(0, 0, 0)",
          borderLeftStyle: "none",
          borderLeftWidth: "0px",
          borderRightColor: "rgb(0, 0, 0)",
          borderRightStyle: "none",
          borderRightWidth: "0px",
          borderSpacing: "0px",
          borderTopColor: "rgb(0, 0, 0)",
          borderTopLeftRadius: "0px",
          borderTopRightRadius: "0px",
          borderTopStyle: "none",
          borderTopWidth: "0px",
          bottom: "auto",
          boxShadow: "none",
          boxSizing: "content-box",
          clear: "none",
          clip: "auto",
          clipPath: "none",
          clipRule: "nonzero",
          color: "rgb(0, 0, 0)",
          colorScheme: "normal",
          columnCount: "auto",
          columnFill: "balance",
          columnGap: "normal",
          columnRuleColor: "rgb(0, 0, 0)",
          columnRuleStyle: "none",
          columnRuleWidth: "0px",
          columnSpan: "none",
          columnWidth: "auto",
          contain: "none",
          containerType: "normal",
          content: "normal",
          contentVisibility: "visible",
          display: "",
          filter: "none",
          flexBasis: "auto",
          flexDirection: "row",
          flexGrow: "0",
          flexShrink: "1",
          flexWrap: "nowrap",
          float: "none",
          fontFamily: "Times",
          fontFeatureSettings: "normal",
          fontKerning: "auto",
          fontOpticalSizing: "auto",
          fontPalette: "normal",
          fontSize: "16px",
          fontSizeAdjust: "none",
          fontStretch: "100%",
          fontStyle: "normal",
          fontWeight: "400",
          gridAutoColumns: "auto",
          gridAutoFlow: "row",
          gridAutoRows: "auto",
          gridColumnEnd: "auto",
          gridColumnStart: "auto",
          gridRowEnd: "auto",
          gridRowStart: "auto",
          gridTemplateAreas: "none",
          gridTemplateColumns: "none",
          gridTemplateRows: "none",
          height: "auto",
          isolation: "auto",
          justifyItems: "normal",
          justifySelf: "auto",
          justifyContent: "normal",
          left: "auto",
          letterSpacing: "normal",
          lineBreak: "auto",
          lineHeight: "normal",
          listStyleImage: "none",
          listStylePosition: "outside",
          listStyleType: "disc",
          marginBottom: "0px",
          marginLeft: "0px",
          marginRight: "0px",
          marginTop: "0px",
          maskImage: "none",
          maxHeight: "none",
          maxWidth: "none",
          minHeight: "auto",
          minWidth: "auto",
          mixBlendMode: "normal",
          objectFit: "fill",
          opacity: "1",
          order: "0",
          outlineColor: "rgb(0, 0, 0)",
          outlineOffset: "0px",
          outlineStyle: "none",
          outlineWidth: "0px",
          overflow: "visible",
          overflowX: "visible",
          overflowY: "visible",
          position: "static",
          paddingBottom: "0px",
          paddingLeft: "0px",
          paddingRight: "0px",
          paddingTop: "0px",
          quotes: "auto",
          right: "auto",
          rowGap: "normal",
          strokeDasharray: "none",
          strokeDashoffset: "0px",
          strokeLinecap: "butt",
          strokeLinejoin: "miter",
          strokeMiterlimit: "4",
          strokeOpacity: "1",
          strokeWidth: "1px",
          textAlign: "start",
          textDecorationColor: "rgb(0, 0, 0)",
          textDecorationLine: "none",
          textDecorationStyle: "solid",
          textIndent: "0px",
          textShadow: "none",
          textTransform: "none",
          textWrapStyle: "auto",
          top: "auto",
          perspective: "none",
          transform: "none",
          transformOrigin: "auto",
          translate: "none",
          transitionProperty: "all",
          verticalAlign: "baseline",
          visibility: "visible",
          webkitTextFillColor: "",
          whiteSpace: "normal",
          width: "auto",
          willChange: "auto",
          writingMode: "horizontal-tb",
          zIndex: "auto",
          rotate: "none",
          scale: "none",
        }),
        (br = Object.freeze(Object.entries(Ct))),
        (At = {}));
      for (let t of Object.keys(Ct)) {
        let e = t.replace(/([A-Z])/g, "-$1").toLowerCase(),
          n = t.startsWith("webkit") ? `-${e}` : e;
        At[t] = n;
      }
    });
  function cs(t) {
    if (Nt.has(t)) return;
    let e = new CSSStyleSheet();
    (e.insertRule(`[${Oe}]::before { content: none !important; }`),
      e.insertRule(`[${Fe}]::after { content: none !important; }`),
      (t.adoptedStyleSheets = [...t.adoptedStyleSheets, e]),
      Nt.set(t, e));
  }
  function xr() {
    for (let [t, e] of Nt)
      try {
        t.adoptedStyleSheets = t.adoptedStyleSheets.filter((n) => n !== e);
      } catch {}
    Nt.clear();
  }
  function Sr(t, e, n, r, o, i) {
    var a;
    let s = Le(t, e);
    if (s === null) return;
    let { styles: l } = s,
      c = (a = l.content) != null ? a : "normal",
      u = Ys(c, l.quotes),
      d = jr(t, e, l),
      h = Gr(i) && Xr(t, u, d);
    (jn(o, l), Dr(i, l));
    let f = t.getRootNode();
    if (!(f instanceof Document || f instanceof ShadowRoot)) return;
    cs(f);
    let m = document.createElement("span");
    ((m.style.all = "initial"),
      Object.assign(m.style, l),
      m.style.removeProperty("content"));
    let g = e === "::before" ? Oe : Fe;
    try {
      (t.setAttribute(g, ""),
        (m.textContent = u),
        e === "::before" ? t.prepend(m) : e === "::after" && t.append(m));
      let y = Kn(m, l, r != null),
        E = Jn(y, l),
        x = tr(m, y, E, r),
        S = Qn(r, E, { x: x.x, y: x.y }),
        T = [],
        b = Wr(t, l, x, i, n, e);
      if (b) return b;
      if (h) {
        let w = Yr(t, l, x, u, d, i, n, e);
        if (w) return w;
      }
      for (let w of m.childNodes)
        if (w.nodeType === Node.TEXT_NODE) {
          let v = rr(w, S ?? null, Vn(o, l)),
            { lineCount: C } = v;
          T.push({
            nodeType: tt.TEXT_NODE,
            id: n + "-text",
            text: w.textContent || "",
            rect: Un(v, ["lineCount"]),
            lineCount: C,
          });
          break;
        }
      return {
        nodeType: tt.ELEMENT_NODE,
        id: n,
        tag: "SPAN",
        attributes: {},
        styles: l,
        rect: x,
        childNodes: T,
      };
    } finally {
      (m.remove(), t.removeAttribute(g));
    }
  }
  var Oe,
    Fe,
    Nt,
    us = F(() => {
      (qn(),
        Wn(),
        We(),
        wr(),
        ir(),
        ke(),
        (Oe = "data-h2d-suppress-before"),
        (Fe = "data-h2d-suppress-after"),
        (Nt = new Map()));
    });
  function ds(t, e) {
    let n = t.cloneNode(!0);
    n.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    (e || De(t, n),
      e ? ws(t, n) : ys(t, n),
      Es(t.ownerDocument, n, e),
      gs(n, t.ownerDocument && t.ownerDocument.baseURI));
    if (!(t instanceof SVGSVGElement)) {
      const style = getComputedStyle(t);
      for (const name of ['fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'fill-rule', 'clip-rule']) {
        n.setAttribute(name, style.getPropertyValue(name));
      }
    }
    let { width: r, height: o } = window.getComputedStyle(t);
    return (
      r.endsWith("px") &&
        o.endsWith("px") &&
        (n.setAttribute("width", r), n.setAttribute("height", o)),
      new XMLSerializer().serializeToString(n)
    );
  }
  function Er(t) {
    $e.clear();
    let e = new Set();
    for (let n of Array.from(t.querySelectorAll("svg image"))) {
      let r = vr(Tr(n), n.ownerDocument && n.ownerDocument.baseURI);
      r && r.charAt(0) !== "#" && !/^data:/i.test(r) && e.add(r);
    }
    return Promise.allSettled(Array.from(e, (n) => fs(n)));
  }
  function fs(t) {
    return B(this, null, function* () {
      let e = new AbortController(),
        n = setTimeout(() => e.abort(), Ms);
      try {
        let r = yield fetch(t, { signal: e.signal });
        if (!r.ok) throw new Error(`Failed to fetch SVG image: ${r.status}`);
        let o = yield r.blob();
        if (!/^image\//i.test(o.type || ""))
          throw new Error(
            `Invalid SVG image content type: ${o.type || "unknown"}`,
          );
        let i = yield hs(o);
        return ($e.set(t, i), i);
      } catch (r) {
        return (
          assetFailures.add(t),
          console.warn("[Figma Capture] failed to inline SVG image:", t, r),
          null
        );
      } finally {
        clearTimeout(n);
      }
    });
  }
  function hs(t) {
    return new Promise((e, n) => {
      let r = new FileReader();
      ((r.onload = () => e(r.result)),
        (r.onerror = () => n(r.error || new Error("Failed to read SVG image"))),
        r.readAsDataURL(t));
    });
  }
  function gs(t, e) {
    for (let n of Array.from(t.querySelectorAll("image"))) {
      let r = Tr(n),
        o = vr(r, e);
      if (!o || o.charAt(0) === "#" || /^data:/i.test(o)) continue;
      let i = $e.get(o);
      i && ms(n, i, n);
    }
  }
  function Tr(t) {
    return (
      t.getAttribute("href") ||
      t.getAttribute("xlink:href") ||
      t.getAttributeNS("http://www.w3.org/1999/xlink", "href") ||
      (t.href && t.href.baseVal) ||
      ""
    );
  }
  function vr(t, e) {
    let n = String(t || "").trim();
    if (!n || n.charAt(0) === "#" || /^(?:data|blob):/i.test(n)) return n;
    try {
      return new URL(n, e || document.baseURI).href;
    } catch {
      return n;
    }
  }
  function ms(t, e, n) {
    n.hasAttribute("xlink:href") ||
    n.getAttributeNS("http://www.w3.org/1999/xlink", "href") != null
      ? t.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", e)
      : t.setAttribute("href", e);
  }
  function Mr(t) {
    let e = Array.from(t.querySelectorAll("use")),
      n = new Set();
    for (let r of e) {
      let o = kr(ht(r));
      o && !gt.has(o.url) && n.add(o.url);
    }
    return Promise.allSettled(Array.from(n, (r) => ps(r)));
  }
  function ps(t) {
    return B(this, null, function* () {
      if (gt.has(t)) return gt.get(t);
      let e = new AbortController(),
        n = setTimeout(() => e.abort(), vs);
      try {
        let r = yield fetch(t, { signal: e.signal });
        if (!r.ok) throw new Error(`Failed to fetch SVG sprite: ${r.status}`);
        let o = yield r.text(),
          i = new DOMParser().parseFromString(o, "image/svg+xml");
        if (i.querySelector("parsererror"))
          throw new Error("Failed to parse SVG sprite");
        return (gt.set(t, i), i);
      } catch (r) {
        return (
          assetFailures.add(t),
          console.warn("[Figma Capture] failed to preload SVG sprite:", t, r),
          gt.set(t, null),
          null
        );
      } finally {
        clearTimeout(n);
      }
    });
  }
  function ys(t, e) {
    let n = t.ownerDocument,
      r = t.querySelectorAll("use"),
      o = e.querySelectorAll("use");
    for (let i = 0; i < o.length; i++) {
      let a = o[i],
        s = ht(r[i]) || ht(a),
        l = Nr(s),
        c = l ? n.getElementById(l) : Ar(s);
      if ((s && ht(a) !== s && a.setAttribute("href", s), !c || c === a))
        continue;
      let u = c.getAttribute("viewBox");
      u && !e.getAttribute("viewBox") && e.setAttribute("viewBox", u);
      let d =
          c.tagName && c.tagName.toLowerCase() === "symbol"
            ? Array.from(c.childNodes).map((g) => n.importNode(g, !0))
            : [n.importNode(c, !0)],
        h = a.getAttribute("x"),
        f = a.getAttribute("y"),
        m = n.createDocumentFragment();
      if (h || f) {
        let g = n.createElementNS("http://www.w3.org/2000/svg", "g");
        (g.setAttribute("transform", `translate(${Rr(h)} ${Rr(f)})`),
          _e(c, g),
          Pe(a, g));
        for (let y of d)
          (y.nodeType === 1 && (_e(c, y), Pe(a, y)), g.appendChild(y));
        m.appendChild(g);
      } else
        for (let g of d)
          (g.nodeType === 1 && (_e(c, g), Pe(a, g)), m.appendChild(g));
      (bs(m, window.getComputedStyle(r[i]).color), a.replaceWith(m));
    }
  }
  function bs(t, e) {
    if (e)
      for (let n of [t, ...Array.from(t.querySelectorAll("*"))])
        for (let r of Array.from(n.attributes || []))
          /currentcolor/i.test(r.value) &&
            n.setAttribute(r.name, r.value.replace(/currentcolor/gi, e));
  }
  function ws(t, e) {
    let n = t.ownerDocument,
      r = t.querySelectorAll("use"),
      o = e.querySelectorAll("use"),
      i = new Map(),
      a = e.querySelector(":scope > defs");
    for (let s = 0; s < o.length; s++) {
      let l = o[s],
        c = ht(r[s]) || ht(l),
        u = Nr(c),
        d = u ? n.getElementById(u) : Ar(c);
      if (!d || d === l) continue;
      let h = xs(c),
        f = i.get(h);
      if (!f) {
        f = `ctd-svg-use-${Ss(h)}`;
        let m = n.importNode(d, !0);
        (m.setAttribute("id", f),
          a ||
            ((a = n.createElementNS("http://www.w3.org/2000/svg", "defs")),
            e.insertBefore(a, e.firstChild)),
          a.appendChild(m),
          i.set(h, f));
      }
      (l.removeAttribute("xlink:href"),
        l.removeAttributeNS("http://www.w3.org/1999/xlink", "href"),
        l.setAttribute("href", `#${f}`));
    }
  }
  function xs(t) {
    try {
      return new URL(t, document.baseURI).href;
    } catch {
      return t;
    }
  }
  function Ss(t) {
    let e = 2166136261;
    for (let n = 0; n < t.length; n++)
      ((e ^= t.charCodeAt(n)), (e = Math.imul(e, 16777619)));
    return (e >>> 0).toString(36);
  }
  function Es(t, e, n) {
    if (!t) return;
    let r = new Set(
        Array.from(e.querySelectorAll("[id]"), (a) => a.id).filter(Boolean),
      ),
      o = Cr(e),
      i = e.querySelector("defs");
    for (; o.length;) {
      let a = o.shift();
      if (!a || r.has(a)) continue;
      let s = t.getElementById(a);
      if (!s) continue;
      let l = t.importNode(s, !0);
      (n || De(s, l),
        i ||
          ((i = t.createElementNS("http://www.w3.org/2000/svg", "defs")),
          e.appendChild(i)),
        i.appendChild(l),
        r.add(a));
      for (let c of Cr(l)) r.has(c) || o.push(c);
    }
  }
  function Cr(t) {
    let e = [];
    for (let n of [t, ...Array.from(t.querySelectorAll("*"))])
      for (let r of Array.from(n.attributes || [])) {
        let o = /url\(\s*['"]?#([^'")\s]+)['"]?\s*\)/g,
          i;
        for (; (i = o.exec(r.value));) e.push(i[1]);
      }
    return e;
  }
  function Ar(t) {
    let e = kr(t);
    if (!e) return null;
    let n = gt.get(e.url);
    return n ? n.getElementById(e.id) : null;
  }
  function ht(t) {
    return (
      t.getAttribute("href") ||
      t.getAttribute("xlink:href") ||
      t.getAttributeNS("http://www.w3.org/1999/xlink", "href") ||
      (t.href && t.href.baseVal) ||
      ""
    );
  }
  function Nr(t) {
    if (!t) return null;
    if (t.charAt(0) === "#") return t.slice(1);
    try {
      let e = new URL(t, document.baseURI),
        n = new URL(window.location.href);
      n.hash = "";
      let r = new URL(e.href);
      return (
        (r.hash = ""),
        e.hash && r.href === n.href ? e.hash.slice(1) : null
      );
    } catch {
      return null;
    }
  }
  function kr(t) {
    if (!t) return null;
    try {
      let e = new URL(t, document.baseURI);
      if (!e.hash || e.protocol === "data:" || e.protocol === "blob:")
        return null;
      let n = new URL(e.href),
        r = new URL(window.location.href);
      return (
        (n.hash = ""),
        (r.hash = ""),
        n.href === r.href ? null : { url: n.href, id: e.hash.slice(1) }
      );
    } catch {
      return null;
    }
  }
  function Rr(t) {
    let e = parseFloat(t || "0");
    return Number.isFinite(e) ? e : 0;
  }
  function _e(t, e) {
    for (let n of Array.from(t.attributes || [])) {
      let r = n.name;
      r === "id" ||
        r === "viewBox" ||
        r === "xmlns" ||
        (!e.hasAttribute(r) && e.setAttribute(r, n.value));
    }
  }
  function Pe(t, e) {
    for (let n of Array.from(t.attributes)) {
      let r = n.name;
      r === "href" ||
        r === "xlink:href" ||
        r === "x" ||
        r === "y" ||
        r === "width" ||
        r === "height" ||
        (!e.hasAttribute(r) && e.setAttribute(r, n.value));
    }
  }
  function De(t, e) {
    if (!(t instanceof Element) || !(e instanceof Element)) return;
    let n = window.getComputedStyle(t);
    for (let [r, o] of Object.entries(He)) {
      let i = n.getPropertyValue(r);
      i && i.toLowerCase() !== o.toLowerCase() && e.setAttribute(Ir[r], i);
    }
    for (let r = 0; r < t.childNodes.length; r++)
      De(t.childNodes[r], e.childNodes[r]);
  }
  function Ts(t) {
    return Object.fromEntries(
      t.map((e) => [e, e.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase()]),
    );
  }
  var gt = new Map(),
    $e = new Map(),
    vs = 8e3,
    Ms = 8e3,
    He,
    Ir,
    Cs = F(() => {
      ((He = {
        alignmentBaseline: "baseline",
        clip: "auto",
        clipPath: "none",
        clipRule: "nonzero",
        color: "rgb(0, 0, 0)",
        colorInterpolation: "sRGB",
        colorRendering: "auto",
        cursor: "auto",
        direction: "ltr",
        display: "inline",
        dominantBaseline: "auto",
        fill: "rgb(0, 0, 0)",
        fillOpacity: "1",
        fillRule: "nonzero",
        filter: "none",
        floodColor: "rgb(0, 0, 0)",
        floodOpacity: "1",
        imageRendering: "auto",
        letterSpacing: "normal",
        lightingColor: "rgb(255, 255, 255)",
        lineHeight: "normal",
        markerEnd: "none",
        markerMid: "none",
        markerStart: "none",
        mask: "none",
        opacity: "1",
        overflow: "visible",
        paintOrder: "normal",
        shapeRendering: "auto",
        stopColor: "rgb(0, 0, 0)",
        stopOpacity: "1",
        stroke: "none",
        strokeDasharray: "none",
        strokeDashoffset: "0px",
        strokeLinecap: "butt",
        strokeLinejoin: "miter",
        strokeMiterlimit: "4",
        strokeOpacity: "1",
        strokeWidth: "1px",
        textAnchor: "start",
        textDecoration: "none solid rgb(0, 0, 0)",
        textRendering: "auto",
        unicodeBidi: "normal",
        vectorEffect: "none",
        visibility: "visible",
        whiteSpace: "normal",
        writingMode: "horizontal-tb",
      }),
        (Ir = Ts(Object.keys(He))));
    }),
    Lr,
    As = F(() => {
      (function (t) {
        ((t[(t.RUNTIME = 0)] = "RUNTIME"),
          (t[(t.SOURCE_MAP = 1)] = "SOURCE_MAP"),
          (t[(t.DATA_ATTRIBUTES = 2)] = "DATA_ATTRIBUTES"));
      })(Lr || (Lr = {}));
    });
  function at(t) {
    if (t !== null) {
      let n = ze.get(t);
      if (n) return n;
    }
    let e = `h2d-node-${++Ue}`;
    return (t !== null && ze.set(t, e), e);
  }
  var Ns = F(() => {}),
    Be,
    tt,
    Or,
    Ue,
    ze,
    Fr,
    _r,
    Pr,
    We = F(() => {
      (ur(),
        qn(),
        ul(),
        Wn(),
        us(),
        ls(),
        wr(),
        Cs(),
        ir(),
        As(),
        ke(),
        Ja(),
        Ns(),
        ar(),
        (Be = class extends Error {
          constructor(t, e) {
            (super(t),
              Y(this, "code"),
              (this.code = e),
              (this.name = "H2DError"));
          }
        }),
        (tt = { ELEMENT_NODE: 1, TEXT_NODE: 3 }),
        (Or = 1e4),
        (Ue = 0),
        (ze = new WeakMap()),
        (Fr = {
          assertLayoutValid: !0,
          skipRemoteAssetSerialization: !1,
          convertFontIconsToImages: !0,
          devtools: void 0,
        }),
        (_r = new Set([
          "text",
          "search",
          "tel",
          "url",
          "email",
          "password",
          "number",
        ])),
        (Pr = new Set([
          "alt",
          "checked",
          "class",
          "currentsrc",
          "disabled",
          "for",
          "href",
          "id",
          "multiple",
          "open",
          "placeholder",
          "poster",
          "readonly",
          "rel",
          "required",
          "role",
          "selected",
          "src",
          "target",
          "title",
          "type",
          "value",
        ])));
    });
  function ks() {
    Ue = 0;
  }
  function Rs(t, e, n) {
    (Zs(t, n), Qs(t, n), Dr(n, e));
  }
  function Dr(t, e) {
    for (const value of [e.backgroundImage, e.borderImageSource, e.listStyleImage]) {
      for (const match of String(value || '').matchAll(/url\(\s*("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|[^)]*)\s*\)/gi)) {
        let url = match[1].trim();
        if (/^["']/.test(url)) url = url.slice(1, -1);
        if (url && !url.startsWith('#')) t.addImage(zn(url));
      }
    }
  }
  var mt = new Map(),
    Gt = new Map();
  function Is(t) {
    var e;
    return (e = t?.maskImage) && e !== 'none' ? e : t?.webkitMaskImage;
  }
  function Ls(t) {
    if (!t || t === "none") return null;
    let e = String(t).match(
      /url\(\s*("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|[^)]*)\s*\)/i,
    );
    if (!e) return null;
    let n = e[1].trim(),
      r = n[0];
    return (
      (r === '"' || r === "'") &&
        n[n.length - 1] === r &&
        (n = n.slice(1, -1).replace(/\\(["'\\])/g, "$1")),
      n
    );
  }
  function Os(t) {
    if (!t) return null;
    if (/^(?:data|blob):/i.test(t)) return t;
    if (String(t).trim().startsWith("#")) return null;
    try {
      let e = new URL(t, document.baseURI),
        n = new URL(document.baseURI);
      return e.hash &&
        e.origin === n.origin &&
        e.pathname === n.pathname &&
        e.search === n.search
        ? null
        : e.href;
    } catch {
      return t;
    }
  }
  function $r(t) {
    return Os(Ls(Is(t)));
  }
  async function Hr(t) {
    (mt.clear(), Gt.clear());
    let e = t instanceof Document ? t.documentElement : t;
    if (!(e instanceof Element)) return;
    let n = new Set(),
      r = [e, ...e.querySelectorAll("*")];
    for (let o of r) {
      Br(window.getComputedStyle(o), n);
      for (let i of ["::before", "::after"]) {
        let a = window.getComputedStyle(o, i);
        a.content !== "none" && a.content !== "normal" && Br(a, n);
      }
    }
    n.size > 0 && (await Promise.allSettled(Array.from(n, (o) => Fs(o))));
  }
  function Br(t, e) {
    let n = $r(t);
    n && e.add(n);
  }
  function Fs(t) {
    if (mt.has(t)) return Promise.resolve(mt.get(t));
    let e = Gt.get(t);
    return (
      e ||
      ((e = _s(t)
        .then((n) => (mt.set(t, n), n))
        .catch(
          (n) => (
            assetFailures.add(t),
            console.warn("[Figma Capture] failed to preload CSS mask:", t, n),
            mt.set(t, null),
            null
          ),
        )
        .finally(() => Gt.delete(t))),
      Gt.set(t, e),
      e)
    );
  }
  async function _s(t) {
    let e = new AbortController(),
      n = setTimeout(() => e.abort(), jt);
    try {
      let r = await fetch(t, { signal: e.signal });
      if (!r.ok) throw new Error(`Failed to fetch CSS mask: ${r.status}`);
      let o = await r.blob(),
        i = o.type || "",
        s =
          /image\/svg\+xml/i.test(i) ||
          /^data:image\/svg\+xml/i.test(t) ||
          /\.svg(?:$|[?#])/i.test(t)
            ? await o.text()
            : null,
        l = await Ps(o);
      return { url: t, blob: o, image: l, svgMarkup: s };
    } finally {
      clearTimeout(n);
    }
  }
  function Ps(t) {
    return new Promise((e, n) => {
      let r = URL.createObjectURL(t),
        o = new Image(),
        i = () => URL.revokeObjectURL(r);
      ((o.onload = () => {
        (i(), e(o));
      }),
        (o.onerror = () => {
          (i(), n(new Error("Failed to decode CSS mask image.")));
        }),
        (o.decoding = "async"),
        (o.src = r));
    });
  }
  function Ds(t, e) {
    let n = window.getComputedStyle(t, e || null),
      r = n.backgroundColor,
      o = r && r !== "transparent" && r !== "rgba(0, 0, 0, 0)" ? r : n.color;
    return Ks(o || "rgb(0, 0, 0)");
  }
  function $s(t, e) {
    if (!t) return null;
    let n = new DOMParser().parseFromString(t, "image/svg+xml"),
      r = n.documentElement;
    if (
      !r ||
      r.tagName.toLowerCase() !== "svg" ||
      n.querySelector("parsererror") ||
      r.querySelector("style, image, foreignObject")
    )
      return null;
    (r.setAttribute("xmlns", "http://www.w3.org/2000/svg"),
      (r.style.color = e),
      !r.hasAttribute("fill") && !r.style.fill && r.setAttribute("fill", e));
    for (let o of [r, ...r.querySelectorAll("*")])
      for (let i of [
        "fill",
        "stroke",
        "stop-color",
        "flood-color",
        "lighting-color",
      ]) {
        let a = o.getAttribute(i);
        Ur(a) && o.setAttribute(i, e);
        let s = o.style == null ? void 0 : o.style.getPropertyValue(i);
        Ur(s) && o.style.setProperty(i, e);
      }
    return new XMLSerializer().serializeToString(r);
  }
  function Ur(t) {
    let e = String(t || "").trim();
    return !!(
      e &&
      e.toLowerCase() !== "none" &&
      e.toLowerCase() !== "transparent" &&
      !/^url\(/i.test(e)
    );
  }
  function Hs(t, e, n, r, o) {
    if (!t?.image) return null;
    let i = Math.max(1, Math.round(Number(e?.width) || 0)),
      a = Math.max(1, Math.round(Number(e?.height) || 0));
    if (!i || !a) return null;
    let s = Math.min(2, Math.max(1, window.devicePixelRatio || 1)),
      l = document.createElement("canvas");
    ((l.width = Math.max(1, Math.round(i * s))),
      (l.height = Math.max(1, Math.round(a * s))));
    let c = l.getContext("2d");
    if (!c) return null;
    (c.scale(s, s), c.clearRect(0, 0, i, a));
    let u = Bs(t.image, i, a, window.getComputedStyle(r, o || null));
    return (
      c.drawImage(t.image, u.x, u.y, u.width, u.height),
      (c.globalCompositeOperation = "source-in"),
      (c.fillStyle = n),
      c.fillRect(0, 0, i, a),
      (c.globalCompositeOperation = "source-over"),
      l
    );
  }
  function Bs(t, e, n, r) {
    let o = t.naturalWidth || e,
      i = t.naturalHeight || n,
      a =
        r.maskSize ||
        r.webkitMaskSize ||
        r.getPropertyValue("mask-size") ||
        "auto",
      s =
        a === "cover"
          ? Math.max(e / o, n / i)
          : a === "contain"
            ? Math.min(e / o, n / i)
            : 1,
      l = Math.max(1, o * s),
      c = Math.max(1, i * s);
    if (a !== "cover" && a !== "contain" && a !== "auto") {
      let m = a.split(/\s+/),
        g = parseFloat(m[0]),
        y = parseFloat(m[1]);
      (Number.isFinite(g) && (l = m[0].includes("%") ? (e * g) / 100 : g),
        Number.isFinite(y)
          ? (c = m[1].includes("%") ? (n * y) / 100 : y)
          : Number.isFinite(g) && (c = (i * l) / o));
    }
    let u =
        r.maskPosition ||
        r.webkitMaskPosition ||
        r.getPropertyValue("mask-position") ||
        "50% 50%",
      d = u.split(/\s+/),
      h = zr(d[0], e, l),
      f = zr(d[1] || d[0], n, c);
    return { x: h, y: f, width: l, height: c };
  }
  function zr(t, e, n) {
    if (t === "left" || t === "top") return 0;
    if (t === "right" || t === "bottom") return e - n;
    if (t === "center") return (e - n) / 2;
    let r = parseFloat(t);
    return Number.isFinite(r)
      ? String(t).includes("%")
        ? ((e - n) * r) / 100
        : r
      : (e - n) / 2;
  }
  function Wr(t, e, n, r, o, i) {
    let a = $r(e),
      s = a ? mt.get(a) : null;
    if (!s) return null;
    let l = Ds(t, i),
      c = $s(s.svgMarkup, l),
      u = `mask-${
        String(l)
          .replace(/[^a-z0-9]+/gi, "-")
          .replace(/^-|-$/g, "")
          .slice(0, 48) || "color"
      }`,
      d;
    if (c) d = r.addBlob(new Blob([c], { type: "image/svg+xml" }), u);
    else {
      let m = Hs(s, n, l, t, i);
      if (!m) return null;
      d = r.addCanvas(m, "image/png", u);
    }
    let h = Ae(t, r?.options);
    h.currentSrc = d;
    let f = Q({}, e);
    return (
      delete f.content,
      delete f.maskImage,
      delete f.webkitMaskImage,
      delete f.backgroundColor,
      (f.display =
        f.display && f.display !== "contents" ? f.display : "inline-block"),
      (f.objectFit = "contain"),
      {
        nodeType: tt.ELEMENT_NODE,
        id: o,
        tag: "IMG",
        attributes: h,
        styles: f,
        rect: n,
        childNodes: [],
        placeholderUrl: d,
      }
    );
  }
  var Us = [
      /\biconfont\b/i,
      /font\s*awesome/i,
      /\bfa(?:s|r|l|b|d)?\b/i,
      /material[-\s]*(?:icons?|symbols?)/i,
      /glyphicons?/i,
      /bootstrap[-\s]*icons?/i,
      /remixicon/i,
      /\banticon\b/i,
      /\bel-icon\b/i,
      /\blayui-icon\b/i,
    ],
    zs = [
      /\biconfont\b/i,
      /\bicon[-_][\w-]+/i,
      /\bfa(?:s|r|l|b|d)?\b/i,
      /\bfa[-_][\w-]+/i,
      /material[-_\s]*(?:icons?|symbols?)/i,
      /\bglyphicon\b/i,
      /\bbi[-_][\w-]+/i,
      /\bri[-_][\w-]+/i,
      /\banticon\b/i,
      /\bel-icon\b/i,
      /\blayui-icon\b/i,
    ],
    Ws = /[\uE000-\uF8FF]/u;
  function Gr(t) {
    return !t || !t.options || t.options.convertFontIconsToImages !== !1;
  }
  function Gs(t) {
    return `${t.getAttribute("class") || ""} ${t.getAttribute("role") || ""} ${t.getAttribute("aria-label") || ""}`.trim();
  }
  function Vr(t) {
    let e = String(t || "");
    return Us.some((n) => n.test(e));
  }
  function Vs(t) {
    let e = String(t || "");
    return zs.some((n) => n.test(e)) || Vr(e);
  }
  function js(t) {
    return Ws.test(String(t || ""));
  }
  function Xs(t) {
    let e = "";
    for (let n of t.childNodes)
      if (n.nodeType === Node.TEXT_NODE) e += n.textContent || "";
      else if (n.nodeType === Node.ELEMENT_NODE) return "";
    return e.replace(/\s+/g, " ").trim();
  }
  function Ys(t, e) {
    let n = va(t, e);
    return n ? n.replace(/\s+/g, " ").trim() : "";
  }
  function jr(t, e, n) {
    let r = window.getComputedStyle(t, e || null);
    return {
      color: r.color || n.color || "rgb(0, 0, 0)",
      fontFamily: r.fontFamily || n.fontFamily || "sans-serif",
      fontSize: r.fontSize || n.fontSize || "16px",
      fontStyle: r.fontStyle || n.fontStyle || "normal",
      fontWeight: r.fontWeight || n.fontWeight || "400",
      opacity: r.opacity || n.opacity || "1",
    };
  }
  function Xr(t, e, n) {
    if (
      !e ||
      t instanceof SVGElement ||
      t instanceof HTMLImageElement ||
      t instanceof HTMLCanvasElement ||
      t instanceof HTMLVideoElement ||
      t instanceof HTMLAudioElement
    )
      return !1;
    let r = Gs(t),
      o = Vr(n.fontFamily),
      i = Vs(r),
      a = js(e);
    return !!(
      (a && e.length <= 8) ||
      ((o || i) && a) ||
      (o && e.length <= 8 && !/[一-龥ぁ-んァ-ン가-힣]/u.test(e)) ||
      (/material[-\s]*(?:icons?|symbols?)/i.test(`${n.fontFamily} ${r}`) &&
        e.length <= 32)
    );
  }
  function qs(t, e, n) {
    let r = Number(e?.width),
      o = Number(e?.height);
    if (!Number.isFinite(r) || !Number.isFinite(o) || r <= 0 || o <= 0)
      return null;
    let i = Math.max(1, Math.round(r)),
      a = Math.max(1, Math.round(o)),
      s = document.createElement("canvas"),
      l = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
    ((s.width = Math.max(1, Math.round(i * l))),
      (s.height = Math.max(1, Math.round(a * l))),
      (s.style.width = `${i}px`),
      (s.style.height = `${a}px`));
    let c = s.getContext("2d");
    if (!c) return null;
    let u = Math.max(1, parseFloat(n.fontSize || "16") || 16),
      d = n.fontStyle && n.fontStyle !== "normal" ? `${n.fontStyle} ` : "",
      h = n.fontWeight || "400",
      f = n.fontFamily || "sans-serif";
    return (
      c.scale(l, l),
      c.clearRect(0, 0, i, a),
      (c.font = `${d}${h} ${u}px ${f}`),
      (c.fillStyle = n.color || "rgb(0, 0, 0)"),
      (c.textAlign = "center"),
      (c.textBaseline = "middle"),
      (c.globalAlpha = Math.max(
        0,
        Math.min(1, parseFloat(n.opacity || "1") || 1),
      )),
      c.fillText(t, i / 2, a / 2),
      s
    );
  }
  function Yr(t, e, n, r, o, i, a, s) {
    let l = qs(r, n, o);
    if (!l) return null;
    let c = i.addCanvas(l, "image/png"),
      u = Ae(t, i?.options),
      d = t.getAttribute("class");
    d && (u.class = d);
    let h = t.getAttribute("title");
    (h && (u.title = h),
      (u.currentSrc = c),
      (u["data-h2d-font-icon"] = "true"),
      s && (u["data-h2d-pseudo"] = s));
    let f = Q({}, e);
    return (
      delete f.content,
      (f.display =
        f.display && f.display !== "contents" ? f.display : "inline-block"),
      (f.objectFit = "contain"),
      {
        nodeType: tt.ELEMENT_NODE,
        id: a,
        tag: "IMG",
        attributes: u,
        styles: f,
        rect: n,
        childNodes: [],
        placeholderUrl: c,
      }
    );
  }
  function Ks(t) {
    if (/^rgba?\(/.test(t) || /^#[0-9a-fA-F]{3,8}$/.test(t)) return t;
    var e = document.createElement("canvas");
    ((e.width = 1), (e.height = 1));
    var n = e.getContext("2d");
    ((n.fillStyle = t), n.fillRect(0, 0, 1, 1));
    var r = n.getImageData(0, 0, 1, 1).data,
      o = r[0],
      i = r[1],
      a = r[2],
      s = r[3] / 255;
    return s === 1
      ? "rgb(" + o + ", " + i + ", " + a + ")"
      : "rgba(" + o + ", " + i + ", " + a + ", " + s + ")";
  }
  function Zs(t, e) {
    t instanceof HTMLImageElement && e.addImage(t.currentSrc, Js(t));
  }
  function Js(t) {
    let e = t.getBoundingClientRect();
    return {
      kind: "img",
      renderedWidth: et(e.width || t.width),
      renderedHeight: et(e.height || t.height),
      naturalWidth: et(t.naturalWidth),
      naturalHeight: et(t.naturalHeight),
    };
  }
  function et(t) {
    let e = Number(t);
    return Number.isFinite(e) && e > 0 ? Math.round(e) : 0;
  }
  function Qs(t, e) {
    t instanceof HTMLVideoElement &&
      (t.poster && e.addImage(t.poster),
      t.currentSrc && !tl(t) && e.addVideo(t));
  }
  function tl(t) {
    return t.poster
      ? t.readyState < HTMLMediaElement.HAVE_CURRENT_DATA ||
          t.videoWidth === 0 ||
          (t.currentTime === 0 && t.paused)
      : !1;
  }
  function el(t, e) {
    return B(this, null, function* () {
      let n = new AbortController();
      setTimeout(() => n.abort(), jt);
      let r = { signal: n.signal };
      nl(t) &&
        (r.headers = {
          Accept:
            "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        });
      let o = yield fetch(t, r);
      if (!o.ok) throw new Error(`Failed to fetch image: ${t} - ${o.status}`);
      let i = yield o.blob();
      return (
        Jr.has(i.type) && (i = yield rl(i)),
        (i = yield ol(i, e)),
        { url: t, blob: i }
      );
    });
  }
  function nl(t) {
    try {
      return new URL(t, document.baseURI).pathname.endsWith("/_next/image");
    } catch {
      return !1;
    }
  }
  function rl(t) {
    return B(this, null, function* () {
      let e = URL.createObjectURL(t);
      try {
        let n = new Image();
        ((n.src = e), yield n.decode());
        let r = document.createElement("canvas");
        ((r.width = n.naturalWidth), (r.height = n.naturalHeight));
        let o = r.getContext("2d");
        if (!o)
          throw new Error("Failed to get canvas context for image conversion");
        return (o.drawImage(n, 0, 0), yield Vt(r));
      } finally {
        URL.revokeObjectURL(e);
      }
    });
  }
  function ol(t, e) {
    return B(this, null, function* () {
      if (!il(t, e)) return t;
      let n = qr(e);
      if (!n) return t;
      let r = yield al(t, n.width, n.height, to);
      return r && r.size < t.size * eo ? r : t;
    });
  }
  function il(t, e) {
    return !!(
      e &&
      e.kind === "img" &&
      t &&
      t.size >= Qr &&
      /^image\/(?:png|jpe?g)$/i.test(t.type || "") &&
      qr(e)
    );
  }
  function qr(t) {
    let e = et(t?.naturalWidth),
      n = et(t?.naturalHeight),
      r = et(t?.renderedWidth),
      o = et(t?.renderedHeight);
    if (!e || !n || !r || !o) return null;
    let i = Math.min(e, Math.max(1, Math.round(r * Ve))),
      a = Math.min(n, Math.max(1, Math.round(o * Ve)));
    return i < e || a < n ? { width: i, height: a } : null;
  }
  function al(t, e, n, r) {
    return B(this, null, function* () {
      let o = URL.createObjectURL(t);
      try {
        let i = new Image();
        ((i.src = o), yield i.decode());
        let a = document.createElement("canvas");
        ((a.width = e), (a.height = n));
        let s = a.getContext("2d");
        return s
          ? ((s.imageSmoothingEnabled = !0),
            (s.imageSmoothingQuality = "high"),
            s.drawImage(i, 0, 0, e, n),
            yield Vt(a, "image/webp", r))
          : null;
      } catch {
        return null;
      } finally {
        URL.revokeObjectURL(o);
      }
    });
  }
  function Vt(t, e = "image/webp", n = 1) {
    return new Promise((r, o) => {
      t.toBlob(
        (i) => (i ? r(i) : o(new Error("Failed to create blob from canvas"))),
        e,
        n,
      );
    });
  }
  function sl(t) {
    try {
      return new URL(t, window.location.href).origin === window.location.origin;
    } catch {
      return !1;
    }
  }
  function ll(t) {
    return B(this, null, function* () {
      var e;
      let n = (e = t.currentSrc) != null ? e : t.src;
      if (sl(n) || t.crossOrigin !== null) return null;
      let r = document.createElement("video");
      return (
        (r.crossOrigin = "anonymous"),
        (r.src = n),
        (r.muted = !0),
        (r.preload = "auto"),
        (r.style.position = "absolute"),
        (r.style.visibility = "hidden"),
        (r.style.pointerEvents = "none"),
        new Promise((o, i) => {
          let a = t.currentTime,
            s = !1,
            l = !1,
            c = null,
            u = setTimeout(E, jt);
          (r.addEventListener("error", y),
            a === 0
              ? ((s = !0),
                (c = r.requestVideoFrameCallback(h)),
                r
                  .play()
                  .then(() => r.pause())
                  .catch(y))
              : r.readyState >= HTMLMediaElement.HAVE_METADATA
                ? d()
                : r.addEventListener("loadedmetadata", d, { once: !0 }));
          function d() {
            ((r.currentTime = a),
              r.addEventListener("seeked", f, { once: !0 }),
              (c = r.requestVideoFrameCallback(h)));
          }
          function h() {
            ((l = !0), m());
          }
          function f() {
            ((s = !0), m());
          }
          function m() {
            s && l && (g(), o(r));
          }
          function g() {
            (clearTimeout(u),
              r.removeEventListener("error", y),
              r.removeEventListener("loadedmetadata", d),
              r.removeEventListener("seeked", f),
              c !== null && r.cancelVideoFrameCallback(c));
          }
          function y() {
            var x, S;
            let T = new Error(
              `Video error: code: ${(x = r.error) == null ? void 0 : x.code}, message: ${(S = r.error) == null ? void 0 : S.message}`,
            );
            (g(), Ge(r), i(T));
          }
          function E() {
            (g(), Ge(r), i(new Be("Video loading timeout", "VIDEO_TIMEOUT")));
          }
        })
      );
    });
  }
  function Ge(t) {
    t.src = "";
  }
  function cl(t) {
    return B(this, null, function* () {
      let e = yield ll(t),
        n = e ?? t;
      try {
        if (n.videoWidth === 0 || n.videoHeight === 0)
          throw new Error("Video has invalid dimensions");
        let r = document.createElement("canvas");
        ((r.width = n.videoWidth), (r.height = n.videoHeight));
        let o = r.getContext("2d");
        if (!o) throw new Error("Failed to get canvas context");
        return (o.drawImage(n, 0, 0), Vt(r));
      } finally {
        e && Ge(e);
      }
    });
  }
  function Kr(t) {
    if (t.startsWith("data:") || t.startsWith("blob:")) return !1;
    if (
      !t.startsWith("http://") &&
      !t.startsWith("https://") &&
      !t.startsWith("//")
    )
      return Kr(window.location.href);
    try {
      let e = new URL(t, window.location.href).hostname;
      return !(
        e === "0.0.0.0" ||
        e === "localhost" ||
        e.startsWith("127.") ||
        e === "[::1]" ||
        e === "::1" ||
        e.endsWith(".local")
      );
    } catch {
      return !1;
    }
  }
  var Zr,
    Jr,
    jt,
    Qr,
    Ve,
    to,
    eo,
    ul = F(() => {
      (We(),
        (Zr = class {
          constructor(t) {
            (Y(this, "promises", new Map()),
              Y(this, "rasterizedId", 0),
              Y(this, "options"),
              (this.options = t));
          }
          addPromise(t, e) {
            this.promises.set(
              t,
              e.catch((n) => ({ url: t, blob: null, error: n.toString() })),
            );
          }
          addImage(t, e) {
            if (!t || this.promises.has(t)) return;
            let n =
              this.options.skipRemoteAssetSerialization && Kr(t)
                ? Promise.resolve({ url: t, blob: null })
                : el(t, e);
            this.addPromise(t, n);
          }
          addBlob(t, e) {
            let n = this.getRasterizedImageUrl(e),
              r = Promise.resolve({ url: n, blob: t });
            return (this.addPromise(n, r), n);
          }
          addCanvas(t, e, n) {
            let r = this.getRasterizedImageUrl(n),
              o = Vt(t, e).then((i) => ({ url: r, blob: i }));
            return (this.addPromise(r, o), r);
          }
          addVideo(t) {
            let e = t.currentSrc;
            !e ||
              this.promises.has(e) ||
              this.addPromise(
                e,
                cl(t).then((n) => ({ url: e, blob: n })),
              );
          }
          getRasterizedImageUrl(t = "rasterized") {
            return `${t}:${this.rasterizedId++}`;
          }
          getBlobMap() {
            return B(this, null, function* () {
              let t = yield Promise.all(
                Array.from(this.promises, (e) =>
                  B(this, [e], function* ([n, r]) {
                    return [n, yield r];
                  }),
                ),
              );
              const failed = t.filter(([, asset]) => !asset.blob);
              if (failed.length) throw new Error(`有 ${failed.length} 个图片资源无法读取（可能受 CORS/CSP 限制），未复制不完整设计`);
              return new Map(t);
            });
          }
        }),
        (Jr = new Set(["image/avif", "image/heif", "image/heic"])),
        (jt = 8e3),
        (Qr = 256 * 1024),
        (Ve = 3),
        (to = 0.9),
        (eo = 0.9));
    });
  function no(t) {
    return (
      t.forEach((e) => {
        (e.decoding !== "sync" && (e.decoding = "sync"),
          e.loading !== "eager" && (e.loading = "eager"));
      }),
      Promise.allSettled(t.map((e) => e.decode())).then((e) =>
        Promise.resolve(
          e.map((n, r) => {
            var o;
            n.status === "rejected" &&
              console.debug(
                "Error decoding image",
                n.reason,
                (o = t[r]) == null ? void 0 : o.src,
              );
          }),
        ),
      )
    );
  }
  const ro = 4,
    oo = 64,
    dl = 0.75,
    fl = 1.33,
    hl = "rgb(118, 118, 118)";
  function gl(t, e, n, r) {
    if (!ml(t, n)) return null;
    let o = window.getComputedStyle(t),
      i = Number(n?.width),
      a = Number(n?.height),
      s = i / 2,
      l = a / 2,
      c = Math.max(0.5, s - 0.5),
      u = Math.max(0.5, l - 0.5),
      d = Math.max(1, i * 0.23),
      h = Math.max(1, a * 0.23),
      f = pl(o),
      m = t.checked
        ? `<ellipse cx="${W(s)}" cy="${W(l)}" rx="${W(d)}" ry="${W(h)}" fill="${io(f)}"/>`
        : "",
      g = `<svg xmlns="http://www.w3.org/2000/svg" width="${W(i)}" height="${W(a)}" viewBox="0 0 ${W(i)} ${W(a)}"><ellipse cx="${W(s)}" cy="${W(l)}" rx="${W(c)}" ry="${W(u)}" fill="white" stroke="${io(f)}" stroke-width="1"/>${m}</svg>`,
      y = { "data-h2d-native-control": "radio" },
      E = t.getAttribute("id"),
      x = t.getAttribute("class"),
      S = Q({}, e);
    return (
      E && (y.id = E),
      x && (y.class = x),
      (S.display =
        S.display && S.display !== "contents" ? S.display : "inline-block"),
      {
        nodeType: tt.ELEMENT_NODE,
        id: r,
        tag: "SVG",
        attributes: y,
        styles: S,
        rect: n,
        childNodes: [],
        content: g,
      }
    );
  }
  function ml(t, e) {
    if (
      !(t instanceof HTMLInputElement) ||
      t.type !== "radio" ||
      t.hidden ||
      t.getAttribute("aria-hidden") === "true"
    )
      return !1;
    let n = window.getComputedStyle(t),
      r = String(n.appearance || n.webkitAppearance || "").toLowerCase(),
      o = Number(n.opacity),
      i = Number(e?.width),
      a = Number(e?.height);
    if (
      r === "none" ||
      n.display === "none" ||
      n.visibility === "hidden" ||
      n.visibility === "collapse" ||
      n.contentVisibility === "hidden" ||
      !Number.isFinite(o) ||
      o <= 0.01 ||
      !Number.isFinite(i) ||
      !Number.isFinite(a) ||
      i < ro ||
      a < ro ||
      i > oo ||
      a > oo
    )
      return !1;
    let s = i / a;
    return !(
      s < dl ||
      s > fl ||
      (n.clipPath && n.clipPath !== "none") ||
      (n.clip && n.clip !== "auto")
    );
  }
  function pl(t) {
    let e = String(t.accentColor || "").trim();
    return e && e !== "auto" ? e : hl;
  }
  function W(t) {
    return String(Math.round(Number(t) * 1e3) / 1e3);
  }
  function io(t) {
    return String(t)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }
  function yl(t, e) {
    return B(this, null, function* () {
      let n = Q(Q({}, Fr), e);
      (uo(n), ks());
      let r = new Zr(n),
        o = new Yn(),
        i;
      if (t instanceof Element) {
        (yield no(Array.from(t.querySelectorAll("img"))),
          yield Mr(t),
          yield Er(t),
          yield Hr(t));
        let a = yield so(t, r, o, n),
          s = yield r.getBlobMap(),
          l = o.getFonts(),
          { width: c, height: u } = t.getBoundingClientRect();
        if (!a || a.nodeType !== tt.ELEMENT_NODE)
          throw new Error("Container node could not be serialized");
        return (
          n.devtools && (i = yield n.devtools.assignCollectedElementSources(a)),
          {
            root: a,
            documentTitle: document.title || void 0,
            ...(n.preserveOriginalAttributes
              ? { documentDoctype: ao(document) }
              : {}),
            documentRect: {
              x: 0,
              y: 0,
              width: t.scrollWidth,
              height: t.scrollHeight,
            },
            viewportRect: {
              x: t.scrollLeft,
              y: t.scrollTop,
              width: c,
              height: u,
            },
            devicePixelRatio: window.devicePixelRatio,
            version: 2,
            assets: s,
            fonts: l,
            sourceDataMap: i,
          }
        );
      } else if (t instanceof Document) {
        (yield no(Array.from(t.images)), yield Mr(t), yield Er(t), yield Hr(t));
        let a = yield so(t.documentElement, r, o, n),
          s = yield r.getBlobMap(),
          l = o.getFonts();
        if (!a || a.nodeType !== tt.ELEMENT_NODE)
          throw new Error("Container node must have a body element");
        return (
          n.devtools && (i = yield n.devtools.assignCollectedElementSources(a)),
          {
            documentTitle: t.title || void 0,
            root: a,
            ...(n.preserveOriginalAttributes ? { documentDoctype: ao(t) } : {}),
            documentRect: {
              x: 0,
              y: 0,
              width: document.documentElement.scrollWidth,
              height: document.documentElement.scrollHeight,
            },
            viewportRect: {
              x: 0,
              y: 0,
              width: window.innerWidth,
              height: window.innerHeight,
            },
            devicePixelRatio: window.devicePixelRatio,
            version: 2,
            assets: s,
            fonts: l,
            sourceDataMap: i,
          }
        );
      }
      throw new Error("Container node must be an Element or Document");
    });
  }
  function ao(t) {
    let e = t?.doctype;
    if (e)
      return {
        name: e.name || "html",
        publicId: e.publicId || "",
        systemId: e.systemId || "",
      };
  }
  function so(t, e, n, r) {
    var o;
    uo(r);
    let i = (o = r.timeoutSignal) != null ? o : AbortSignal.timeout(Or);
    return new Promise((a, s) => {
      (bl(() => {
        try {
          a(lo(t, e, n, void 0, r.devtools, void 0));
        } catch (l) {
          s(l);
        } finally {
          xr();
        }
      }, i),
        i.addEventListener(
          "abort",
          () => {
            (xr(),
              s(
                new Be(
                  "H2D requestAnimationFrame timed out",
                  "PAGE_NOT_RESPONDING",
                ),
              ));
          },
          { once: !0 },
        ));
    });
  }
  function bl(t, e) {
    if (e.aborted) return;
    let n = requestAnimationFrame((r) => {
      e.aborted || t(r);
    });
    e.addEventListener("abort", () => cancelAnimationFrame(n), { once: !0 });
  }
  function lo(t, e, n, r, o, i) {
    return Array.isArray(t) || t.nodeType === Node.TEXT_NODE
      ? co(t, n, r)
      : t.nodeType === Node.ELEMENT_NODE
        ? wl(t, e, n, r, o, i)
        : (t.nodeType === Node.COMMENT_NODE ||
            console.warn(`Unsupported node type: ${t.nodeType}`),
          null);
  }
  function je(t, e, n, r, o, i) {
    let a = [];
    for (let s of Pa(t)) {
      let l = lo(s, e, n, r, o, i);
      l != null && a.push(l);
    }
    return a;
  }
  function wl(t, e, n, r, o, i) {
    var a, s;
    let l = r?.inverseTransform,
      c = [],
      u,
      d;
    if (!Ma(t, e?.options) || t.closest?.('.ai-editor-root') || /(?:^|\s)ai-editor-(?:hover-box|sel-box|sel-corner|sel-label|marquee)(?:\s|$)/.test(t.getAttribute('class') || '')) return null;
    let h = Ta(t);
    if (
      h === null ||
      h === "HEAD" ||
      h === "SCRIPT" ||
      h === "NOSCRIPT" ||
      (h === "STYLE" &&
        !e?.options?.includeStyleElements &&
        !r?.insideShadowRoot)
    )
      return null;
    let f = ns(t),
      m = es(t);
    if (
      m &&
      m.length > 0 &&
      ((a = m[0]) == null ? void 0 : a.type) === "text" &&
      t.childNodes.length === 1
    ) {
      let P = co(t.childNodes[0], n, r);
      return ((P.sources = m), P);
    }
    let { styles: g, computedStyles: y } = Le(
      t,
      void 0,
      !e.options.preserveOriginalAttributes,
    );
    jn(n, g);
    let E = Kn(t, g, l != null),
      x = Jn(E, g),
      S = tr(t, E, x, l),
      T = Qn(l, x, { x: S.x, y: S.y }),
      b = as(t, i),
      w = e.options.convertNativeRadiosToSvg ? gl(t, g, S, at(t)) : null;
    if (w)
      return (
        m && (w.sources = m),
        f && (w.selectionSourceId = f),
        b && (w.owningReactComponent = b),
        Object.keys(y).length > 0 && (w.computedStyles = y),
        o?.collectElementSource(w.id, t, {
          componentName: !0,
          sourceFile: !0,
          timeout: 5e3,
        }),
        w
      );
    let v = Xs(t);
    if (Gr(e) && v) {
      let P = jr(t, null, g);
      if (Xr(t, v, P)) {
        let L = Yr(t, g, S, v, P, e, at(t));
        if (L)
          return (
            m && (L.sources = m),
            f && (L.selectionSourceId = f),
            b && (L.owningReactComponent = b),
            Object.keys(y).length > 0 && (L.computedStyles = y),
            L
          );
      }
    }
    if (t instanceof SVGElement) {
      u = ds(t, e.options.preserveOriginalAttributes);
      if (!(t instanceof SVGSVGElement)) {
        const bounds = t.getBBox();
        u = `<svg xmlns="http://www.w3.org/2000/svg" width="${S.width}" height="${S.height}" viewBox="${bounds.x} ${bounds.y} ${bounds.width || 1} ${bounds.height || 1}">${u}</svg>`;
      }
      h = 'SVG';
    }
    else if (t instanceof HTMLCanvasElement) d = e.addCanvas(t);
    else {
      let P = Wr(t, g, S, e, at(t));
      if (P)
        return (
          m && (P.sources = m),
          f && (P.selectionSourceId = f),
          b && (P.owningReactComponent = b),
          Object.keys(y).length > 0 && (P.computedStyles = y),
          P
        );
      if (
        t instanceof HTMLSlotElement &&
        t.getRootNode() instanceof ShadowRoot
      ) {
        let L = { inverseTransform: T, styles: g };
        c = je(
          {
            assignedNodes: () => t.assignedNodes({ flatten: !0 }),
            [Symbol.iterator]: function* () {
              yield* t.assignedNodes({ flatten: !0 });
            },
          },
          e,
          n,
          L,
          o,
          b,
        );
      } else {
        let L = Ce(t);
        if (L) {
          let z = { inverseTransform: T, styles: g, insideShadowRoot: !0 };
          c = je(L.childNodes, e, n, z, o, b);
        } else {
          let z = { inverseTransform: T, styles: g };
          c = je(t.childNodes, e, n, z, o, b);
        }
      }
    }
    let C;
    ((t instanceof HTMLInputElement && _r.has(t.type)) ||
      t instanceof HTMLTextAreaElement) &&
      t.placeholder &&
      (C = { placeholder: Le(t, "::placeholder").styles });
    let A,
      _ = Sr(t, "::before", at(t) + "::before", T, n, e),
      $ = Sr(t, "::after", at(t) + "::after", T, n, e);
    ((_ || $) && (A = { before: _, after: $ }), Rs(t, g, e));
    let it = {
      nodeType: Node.ELEMENT_NODE,
      id: at(t),
      tag: h,
      attributes: Ae(t, e?.options),
      styles: g,
      rect: S,
      childNodes: c,
      content: u,
      placeholderUrl: d,
      pseudoElementNodes: A,
      pseudoElementStyles: C,
      owningReactComponent: b,
      sources: m,
      selectionSourceId: f,
      figmaComponentMetadata: t.getAttribute("data-figma-asset-key")
        ? {
            assetKey: t.getAttribute("data-figma-asset-key"),
            variantProps: Ra(
              (s = t.getAttribute("data-figma-variant-props")) != null
                ? s
                : void 0,
            ),
          }
        : void 0,
    };
    return (
      Object.keys(y).length > 0 && (it.computedStyles = y),
      o?.collectElementSource(it.id, t, {
        componentName: !0,
        sourceFile: !0,
        timeout: 5e3,
      }),
      it
    );
  }
  function co(t, e, n) {
    var r;
    let o = n ? Vn(e, n.styles) : null,
      i = rr(t, (r = n?.inverseTransform) != null ? r : null, o),
      { lineCount: a } = i,
      s = Un(i, ["lineCount"]),
      l = Array.isArray(t)
        ? t.map((u) => u.textContent || "").join("")
        : t.textContent || "",
      c = Array.isArray(t) ? (t.length === 1 ? t[0] : null) : t;
    return {
      nodeType: Node.TEXT_NODE,
      id: at(c),
      text: l,
      rect: s,
      lineCount: a,
    };
  }
  function uo(t) {
    if (!t.assertLayoutValid) return;
    let e = document.body.getBoundingClientRect();
    if (
      e.x === 0 &&
      e.y === 0 &&
      e.width === 0 &&
      e.height === 0 &&
      e.top === 0 &&
      e.right === 0 &&
      e.bottom === 0 &&
      e.left === 0
    )
      throw new Error("Document does not have valid layout");
  }
  We();
  const xl = !0,
    Sl = 1e4;
  async function El(t = {}) {
    await vl();
    const e = t.selector || "body",
      n = e === "body" || e === "html" ? document : document.querySelector(e);
    if (!n) throw new Error(`Element not found: ${e}`);
    const r = await yl(n, {
        timeoutSignal: ca(Sl),
        convertFontIconsToImages: t.convertFontIconsToImages ?? xl,
        convertNativeRadiosToSvg: t.convertNativeRadiosToSvg,
        preserveOriginalAttributes: t.preserveOriginalAttributes,
        allowedDataAttributes: t.allowedDataAttributes,
        includeStyleElements: t.includeStyleElements,
      }),
      o = String(await qa(r));
    return (
      wa.log(`Payload size: ${Math.round(o.length / 1024)} KB`),
      { json: o }
    );
  }
  async function Tl(t = {}) {
    const { json: e } = await El(t),
      n = JSON.parse(e);
    if (!n || typeof n != "object" || !n.root)
      throw new Error("H2D DOM snapshot is missing root.");
    return {
      success: !0,
      json: e,
      snapshot: n,
      htmlText: t.includeHtmlText ? ba(e) : null,
    };
  }
  async function vl() {
    document.readyState === "loading" &&
      (await new Promise((t) =>
        document.addEventListener("DOMContentLoaded", () => t(), { once: !0 }),
      ));
  }
  // Figma image fills cannot reproduce every SVG filter. Keep inline icons vector,
  // but encode SVG CSS image fills as self-contained PNGs with their rendered effects.
  async function normalizeBackgroundAssets(snapshot) {
    const backgrounds = new Set();
    function visit(node) {
      if (!node) return;
      const collector = { addImage: url => backgrounds.add(url) };
      Dr(collector, node.styles || {});
      visit(node.pseudoElementNodes?.before); visit(node.pseudoElementNodes?.after);
      (node.childNodes || []).forEach(visit);
    }
    visit(snapshot.root);
    for (const url of backgrounds) {
      const asset = snapshot.assets.get(url);
      if (!asset?.blob || !/^image\/svg\+xml/i.test(asset.blob.type)) continue;
      const doc = new DOMParser().parseFromString(await asset.blob.text(), 'image/svg+xml');
      if (doc.querySelector('parsererror')) throw new Error('SVG 背景解析失败');
      const svg = doc.documentElement;
      svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      const viewBox = svg.getAttribute('viewBox')?.trim().split(/[\s,]+/).map(Number);
      const size = (name, fallback) => {
        const value = svg.getAttribute(name) || '';
        return /^\d+(?:\.\d+)?(?:px)?$/.test(value) ? parseFloat(value) : fallback;
      };
      let width = size('width', viewBox?.[2] || 300), height = size('height', viewBox?.[3] || 150);
      if (!(width > 0 && height > 0)) throw new Error('SVG 背景尺寸无效');
      const scale = Math.min(1, 4096 / Math.max(width, height));
      width = Math.max(1, Math.round(width * scale)); height = Math.max(1, Math.round(height * scale));
      svg.setAttribute('width', String(width)); svg.setAttribute('height', String(height));
      // Images inside standalone SVGs cannot rely on another page's resource context.
      for (const image of svg.querySelectorAll('image')) {
        const href = Tr(image);
        if (!href || href.startsWith('data:')) continue;
        const response = await fetch(new URL(href, url), { signal: ca(Sl) });
        if (!response.ok) throw new Error('SVG 背景内嵌图片无法读取');
        image.setAttribute('href', await hs(await response.blob()));
        image.removeAttribute('xlink:href');
      }
      const image = await Ps(new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml' }));
      const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('无法编码 SVG 背景');
      context.drawImage(image, 0, 0, width, height);
      snapshot.assets.set(url, { ...asset, blob: await Vt(canvas, 'image/png') });
    }
  }
  // Keep the visual backdrop without copying unrelated sibling content.
  async function includeBackdrop(element, snapshot) {
    const bounds = element.getBoundingClientRect();
    const intersects = rect => rect.width > 0 && rect.height > 0 &&
      rect.right > bounds.left && rect.left < bounds.right &&
      rect.bottom > bounds.top && rect.top < bounds.bottom;
    const layers = [];
    const chain = [];
    for (let branch = element; branch.parentElement; branch = branch.parentElement) {
      chain.unshift([branch.parentElement, branch]);
    }
    let serial = 0;
    function merge(part) {
      const prefix = `backdrop-${++serial}-`;
      const urls = new Map();
      for (const [url, asset] of part.assets) {
        const key = /^(?:https?:|data:|blob:)/i.test(url) ? url : prefix + url;
        urls.set(url, key);
        snapshot.assets.set(key, { ...asset, url: key });
      }
      function visit(node) {
        if (!node) return;
        node.id = prefix + node.id;
        if (urls.has(node.placeholderUrl)) node.placeholderUrl = urls.get(node.placeholderUrl);
        for (const key of ['src', 'currentSrc', 'poster']) {
          if (urls.has(node.attributes?.[key])) node.attributes[key] = urls.get(node.attributes[key]);
        }
        visit(node.pseudoElementNodes?.before); visit(node.pseudoElementNodes?.after);
        (node.childNodes || []).forEach(visit);
      }
      visit(part.root);
      Object.assign(snapshot.fonts, part.fonts);
      return part.root;
    }
    for (const [ancestor, branch] of chain) {
      const css = getComputedStyle(ancestor);
      const rect = ancestor.getBoundingClientRect();
      const hasFill = css.backgroundImage !== 'none' ||
        !/^(?:transparent|rgba\(0,\s*0,\s*0,\s*0\))$/.test(css.backgroundColor);
      if (hasFill && intersects(rect)) {
        const styles = {};
        for (const key of Object.keys(Le(ancestor).styles)) {
          if (/^background|^border.*Radius$/.test(key)) styles[key] = css[key];
        }
        const resources = new Zr(Fr);
        Dr(resources, styles);
        for (const [url, asset] of await resources.getBlobMap()) snapshot.assets.set(url, asset);
        layers.push({ nodeType: 1, id: `backdrop-fill-${++serial}`, tag: 'DIV', attributes: {},
          styles, rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }, childNodes: [] });
      }
      const decorations = [...ancestor.children].filter(node => {
        if (node === branch || node.contains(element) || node.closest('.ai-editor-root')) return false;
        const style = getComputedStyle(node);
        return ['absolute', 'fixed'].includes(style.position) && Number.parseInt(style.zIndex, 10) < 0 &&
          style.display !== 'none' && style.visibility !== 'hidden' &&
          !node.textContent.trim() && !node.querySelector('input,button,select,textarea,iframe') &&
          intersects(node.getBoundingClientRect());
      }).sort((a, b) => Number(getComputedStyle(a).zIndex) - Number(getComputedStyle(b).zIndex));
      for (const decoration of decorations) {
        const part = await yl(decoration, { timeoutSignal: ca(Sl), convertFontIconsToImages: true });
        layers.push(merge(part));
      }
    }
    if (!layers.length) return;
    const content = snapshot.root;
    const rect = { ...content.rect };
    layers.push(content);
    layers.forEach((node, index) => {
      node.styles = { ...node.styles, position: 'absolute', zIndex: String(index) };
    });
    snapshot.root = { nodeType: 1, id: 'capture-frame', tag: 'DIV', attributes: {},
      styles: { position: 'relative', overflow: 'hidden', width: `${rect.width}px`, height: `${rect.height}px` },
      rect, childNodes: layers };
  }
  return async function captureElement(element) {
    assetFailures.clear();
    gt.clear();
    if (document.fonts) {
      let timer;
      try {
        await Promise.race([document.fonts.ready, new Promise((_, reject) => {
          timer = setTimeout(() => reject(new Error('字体加载超时，请等待页面字体加载后重试')), Sl);
        })]);
      } finally { clearTimeout(timer); }
    }
    const snapshot = await yl(element, {
      timeoutSignal: ca(Sl), convertFontIconsToImages: true,
      convertNativeRadiosToSvg: true,
    });
    await includeBackdrop(element, snapshot);
    if (assetFailures.size) throw new Error(`有 ${assetFailures.size} 个 SVG 或遮罩资源无法读取，未复制不完整设计`);
    await normalizeBackgroundAssets(snapshot);
    const x = snapshot.root.rect.x || 0, y = snapshot.root.rect.y || 0;
    function shift(node) {
      if (!node) return;
      if (node.rect) {
        node.rect.x -= x; node.rect.y -= y;
        if (node.rect.quad) for (const point of Object.values(node.rect.quad)) {
          point.x -= x; point.y -= y;
        }
      }
      shift(node.pseudoElementNodes?.before); shift(node.pseudoElementNodes?.after);
      if (!/^(iframe|frame)$/i.test(node.tag || '')) (node.childNodes || []).forEach(shift);
    }
    shift(snapshot.root);
    const json = String(await qa(snapshot));
    return ba(json);
  };
})();
