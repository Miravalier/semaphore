(function () {
  'use strict';

  var _WINDOW = {};
  var _DOCUMENT = {};
  try {
    if (typeof window !== 'undefined') _WINDOW = window;
    if (typeof document !== 'undefined') _DOCUMENT = document;
  } catch (e) {} // eslint-disable-line no-empty

  var _ref = _WINDOW.navigator || {},
    _ref$userAgent = _ref.userAgent,
    userAgent = _ref$userAgent === void 0 ? '' : _ref$userAgent;
  var WINDOW = _WINDOW;
  var DOCUMENT = _DOCUMENT;
  var IS_BROWSER = !!WINDOW.document;
  var IS_DOM = !!DOCUMENT.documentElement && !!DOCUMENT.head && typeof DOCUMENT.addEventListener === 'function' && typeof DOCUMENT.createElement === 'function';
  var IS_IE = ~userAgent.indexOf('MSIE') || ~userAgent.indexOf('Trident/');

  function _arrayLikeToArray(r, a) {
    (null == a || a > r.length) && (a = r.length);
    for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e];
    return n;
  }
  function _arrayWithoutHoles(r) {
    if (Array.isArray(r)) return _arrayLikeToArray(r);
  }
  function _defineProperty(e, r, t) {
    return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, {
      value: t,
      enumerable: !0,
      configurable: !0,
      writable: !0
    }) : e[r] = t, e;
  }
  function _iterableToArray(r) {
    if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r);
  }
  function _nonIterableSpread() {
    throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }
  function ownKeys(e, r) {
    var t = Object.keys(e);
    if (Object.getOwnPropertySymbols) {
      var o = Object.getOwnPropertySymbols(e);
      r && (o = o.filter(function (r) {
        return Object.getOwnPropertyDescriptor(e, r).enumerable;
      })), t.push.apply(t, o);
    }
    return t;
  }
  function _objectSpread2(e) {
    for (var r = 1; r < arguments.length; r++) {
      var t = null != arguments[r] ? arguments[r] : {};
      r % 2 ? ownKeys(Object(t), !0).forEach(function (r) {
        _defineProperty(e, r, t[r]);
      }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) {
        Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));
      });
    }
    return e;
  }
  function _toConsumableArray(r) {
    return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread();
  }
  function _toPrimitive(t, r) {
    if ("object" != typeof t || !t) return t;
    var e = t[Symbol.toPrimitive];
    if (void 0 !== e) {
      var i = e.call(t, r || "default");
      if ("object" != typeof i) return i;
      throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return ("string" === r ? String : Number)(t);
  }
  function _toPropertyKey(t) {
    var i = _toPrimitive(t, "string");
    return "symbol" == typeof i ? i : i + "";
  }
  function _unsupportedIterableToArray(r, a) {
    if (r) {
      if ("string" == typeof r) return _arrayLikeToArray(r, a);
      var t = {}.toString.call(r).slice(8, -1);
      return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0;
    }
  }

  var _cl;
  var rl = {
      classic: {
        fa: "solid",
        fas: "solid",
        "fa-solid": "solid",
        far: "regular",
        "fa-regular": "regular",
        fal: "light",
        "fa-light": "light",
        fat: "thin",
        "fa-thin": "thin",
        fab: "brands",
        "fa-brands": "brands"
      },
      duotone: {
        fa: "solid",
        fad: "solid",
        "fa-solid": "solid",
        "fa-duotone": "solid",
        fadr: "regular",
        "fa-regular": "regular",
        fadl: "light",
        "fa-light": "light",
        fadt: "thin",
        "fa-thin": "thin"
      },
      sharp: {
        fa: "solid",
        fass: "solid",
        "fa-solid": "solid",
        fasr: "regular",
        "fa-regular": "regular",
        fasl: "light",
        "fa-light": "light",
        fast: "thin",
        "fa-thin": "thin"
      },
      "sharp-duotone": {
        fa: "solid",
        fasds: "solid",
        "fa-solid": "solid",
        fasdr: "regular",
        "fa-regular": "regular",
        fasdl: "light",
        "fa-light": "light",
        fasdt: "thin",
        "fa-thin": "thin"
      },
      slab: {
        "fa-regular": "regular",
        faslr: "regular"
      },
      "slab-press": {
        "fa-regular": "regular",
        faslpr: "regular"
      },
      "slab-duo": {
        "fa-regular": "regular",
        fasldr: "regular"
      },
      "slab-press-duo": {
        "fa-regular": "regular",
        faslpdr: "regular"
      },
      thumbprint: {
        "fa-light": "light",
        fatl: "light"
      },
      vellum: {
        "fa-solid": "solid",
        favs: "solid"
      },
      pixel: {
        "fa-regular": "regular",
        fapr: "regular"
      },
      mosaic: {
        "fa-solid": "solid",
        fams: "solid"
      },
      whiteboard: {
        "fa-semibold": "semibold",
        fawsb: "semibold"
      },
      notdog: {
        "fa-solid": "solid",
        fans: "solid"
      },
      "notdog-duo": {
        "fa-solid": "solid",
        fands: "solid"
      },
      etch: {
        "fa-solid": "solid",
        faes: "solid"
      },
      graphite: {
        "fa-thin": "thin",
        fagt: "thin"
      },
      jelly: {
        "fa-regular": "regular",
        fajr: "regular"
      },
      "jelly-fill": {
        "fa-regular": "regular",
        fajfr: "regular"
      },
      "jelly-duo": {
        "fa-regular": "regular",
        fajdr: "regular"
      },
      chisel: {
        "fa-regular": "regular",
        facr: "regular"
      },
      utility: {
        "fa-semibold": "semibold",
        fausb: "semibold"
      },
      "utility-duo": {
        "fa-semibold": "semibold",
        faudsb: "semibold"
      },
      "utility-fill": {
        "fa-semibold": "semibold",
        faufsb: "semibold"
      }
    };
  var u = "classic",
    l = "duotone",
    h = "sharp",
    t = "sharp-duotone",
    g = "chisel",
    n = "etch",
    m = "graphite",
    p = "jelly",
    s = "jelly-duo",
    y = "jelly-fill",
    w = "mosaic",
    x = "notdog",
    e = "notdog-duo",
    b = "pixel",
    c = "slab",
    o = "slab-duo",
    I = "slab-press",
    a = "slab-press-duo",
    r = "thumbprint",
    v = "utility",
    i = "utility-duo",
    F = "utility-fill",
    d = "vellum",
    S = "whiteboard",
    A = "Classic",
    P = "Duotone",
    j = "Sharp",
    B = "Sharp Duotone",
    N = "Chisel",
    D = "Etch",
    k = "Graphite",
    T = "Jelly",
    C = "Jelly Duo",
    W = "Jelly Fill",
    R = "Mosaic",
    K = "Notdog",
    L = "Notdog Duo",
    U = "Pixel",
    J = "Slab",
    _ = "Slab Duo",
    M = "Slab Press",
    E = "Slab Press Duo",
    G = "Thumbprint",
    V = "Utility",
    z = "Utility Duo",
    O = "Utility Fill",
    Y = "Vellum",
    q = "Whiteboard",
    cl = (_cl = {}, _defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_cl, u, A), l, P), h, j), t, B), g, N), n, D), m, k), p, T), s, C), y, W), _defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_cl, w, R), x, K), e, L), b, U), c, J), o, _), I, M), a, E), r, G), v, V), _defineProperty(_defineProperty(_defineProperty(_defineProperty(_cl, i, z), F, O), d, Y), S, q));
  var Al = {
      classic: {
        900: "fas",
        400: "far",
        normal: "far",
        300: "fal",
        100: "fat"
      },
      duotone: {
        900: "fad",
        400: "fadr",
        300: "fadl",
        100: "fadt"
      },
      sharp: {
        900: "fass",
        400: "fasr",
        300: "fasl",
        100: "fast"
      },
      "sharp-duotone": {
        900: "fasds",
        400: "fasdr",
        300: "fasdl",
        100: "fasdt"
      },
      slab: {
        400: "faslr"
      },
      "slab-press": {
        400: "faslpr"
      },
      "slab-duo": {
        400: "fasldr"
      },
      "slab-press-duo": {
        400: "faslpdr"
      },
      vellum: {
        900: "favs"
      },
      mosaic: {
        900: "fams"
      },
      pixel: {
        400: "fapr"
      },
      whiteboard: {
        600: "fawsb"
      },
      thumbprint: {
        300: "fatl"
      },
      notdog: {
        900: "fans"
      },
      "notdog-duo": {
        900: "fands"
      },
      etch: {
        900: "faes"
      },
      graphite: {
        100: "fagt"
      },
      chisel: {
        400: "facr"
      },
      jelly: {
        400: "fajr"
      },
      "jelly-fill": {
        400: "fajfr"
      },
      "jelly-duo": {
        400: "fajdr"
      },
      utility: {
        600: "fausb"
      },
      "utility-duo": {
        600: "faudsb"
      },
      "utility-fill": {
        600: "faufsb"
      }
    };
  var $l = {
      chisel: {
        regular: "facr"
      },
      classic: {
        brands: "fab",
        light: "fal",
        regular: "far",
        solid: "fas",
        thin: "fat"
      },
      duotone: {
        light: "fadl",
        regular: "fadr",
        solid: "fad",
        thin: "fadt"
      },
      etch: {
        solid: "faes"
      },
      graphite: {
        thin: "fagt"
      },
      jelly: {
        regular: "fajr"
      },
      "jelly-duo": {
        regular: "fajdr"
      },
      "jelly-fill": {
        regular: "fajfr"
      },
      mosaic: {
        solid: "fams"
      },
      notdog: {
        solid: "fans"
      },
      "notdog-duo": {
        solid: "fands"
      },
      pixel: {
        regular: "fapr"
      },
      sharp: {
        light: "fasl",
        regular: "fasr",
        solid: "fass",
        thin: "fast"
      },
      "sharp-duotone": {
        light: "fasdl",
        regular: "fasdr",
        solid: "fasds",
        thin: "fasdt"
      },
      slab: {
        regular: "faslr"
      },
      "slab-duo": {
        regular: "fasldr"
      },
      "slab-press": {
        regular: "faslpr"
      },
      "slab-press-duo": {
        regular: "faslpdr"
      },
      thumbprint: {
        light: "fatl"
      },
      utility: {
        semibold: "fausb"
      },
      "utility-duo": {
        semibold: "faudsb"
      },
      "utility-fill": {
        semibold: "faufsb"
      },
      vellum: {
        solid: "favs"
      },
      whiteboard: {
        semibold: "fawsb"
      }
    };
  var rt = {
      kit: {
        fak: "kit",
        "fa-kit": "kit"
      },
      "kit-duotone": {
        fakd: "kit-duotone",
        "fa-kit-duotone": "kit-duotone"
      }
    },
    it = ["kit"];
  var H = "kit",
    f = "kit-duotone",
    Q = "Kit",
    X = "Kit Duotone",
    ht = _defineProperty(_defineProperty({}, H, Q), f, X);
  var mt = {
    kit: {
      "fa-kit": "fak"
    },
    "kit-duotone": {
      "fa-kit-duotone": "fakd"
    }
  };
  var It = {
      kit: {
        fak: "fa-kit"
      },
      "kit-duotone": {
        fakd: "fa-kit-duotone"
      }
    };
  var St = {
      kit: {
        kit: "fak"
      },
      "kit-duotone": {
        "kit-duotone": "fakd"
      }
    };

  var _jl;
  var l$1 = {
      GROUP: "duotone-group",
      SWAP_OPACITY: "swap-opacity",
      PRIMARY: "primary",
      SECONDARY: "secondary"
    };
  var g$1 = "classic",
    a$1 = "duotone",
    m$1 = "sharp",
    t$1 = "sharp-duotone",
    p$1 = "chisel",
    y$1 = "etch",
    b$1 = "graphite",
    w$1 = "jelly",
    e$1 = "jelly-duo",
    x$1 = "jelly-fill",
    c$1 = "mosaic",
    I$1 = "notdog",
    o$1 = "notdog-duo",
    v$1 = "pixel",
    F$1 = "slab",
    r$1 = "slab-duo",
    S$1 = "slab-press",
    i$1 = "slab-press-duo",
    d$1 = "thumbprint",
    A$1 = "utility",
    f$1 = "utility-duo",
    P$1 = "utility-fill",
    u$1 = "vellum",
    j$1 = "whiteboard",
    B$1 = "Classic",
    N$1 = "Duotone",
    D$1 = "Sharp",
    k$1 = "Sharp Duotone",
    C$1 = "Chisel",
    T$1 = "Etch",
    L$1 = "Graphite",
    W$1 = "Jelly",
    R$1 = "Jelly Duo",
    K$1 = "Jelly Fill",
    U$1 = "Mosaic",
    J$1 = "Notdog",
    _$1 = "Notdog Duo",
    M$1 = "Pixel",
    E$1 = "Slab",
    G$1 = "Slab Duo",
    O$1 = "Slab Press",
    V$1 = "Slab Press Duo",
    z$1 = "Thumbprint",
    Y$1 = "Utility",
    $$1 = "Utility Duo",
    q$1 = "Utility Fill",
    H$1 = "Vellum",
    Q$1 = "Whiteboard",
    jl$1 = (_jl = {}, _defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_jl, g$1, B$1), a$1, N$1), m$1, D$1), t$1, k$1), p$1, C$1), y$1, T$1), b$1, L$1), w$1, W$1), e$1, R$1), x$1, K$1), _defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_jl, c$1, U$1), I$1, J$1), o$1, _$1), v$1, M$1), F$1, E$1), r$1, G$1), S$1, O$1), i$1, V$1), d$1, z$1), A$1, Y$1), _defineProperty(_defineProperty(_defineProperty(_defineProperty(_jl, f$1, $$1), P$1, q$1), u$1, H$1), j$1, Q$1));
  var X$1 = "kit",
    h$1 = "kit-duotone",
    Z$1 = "Kit",
    ll$1 = "Kit Duotone",
    ws = _defineProperty(_defineProperty({}, X$1, Z$1), h$1, ll$1);
  var ra = {
      classic: {
        "fa-brands": "fab",
        "fa-duotone": "fad",
        "fa-light": "fal",
        "fa-regular": "far",
        "fa-solid": "fas",
        "fa-thin": "fat"
      },
      duotone: {
        "fa-regular": "fadr",
        "fa-light": "fadl",
        "fa-thin": "fadt"
      },
      sharp: {
        "fa-solid": "fass",
        "fa-regular": "fasr",
        "fa-light": "fasl",
        "fa-thin": "fast"
      },
      "sharp-duotone": {
        "fa-solid": "fasds",
        "fa-regular": "fasdr",
        "fa-light": "fasdl",
        "fa-thin": "fasdt"
      },
      slab: {
        "fa-regular": "faslr"
      },
      "slab-press": {
        "fa-regular": "faslpr"
      },
      "slab-duo": {
        "fa-regular": "fasldr"
      },
      "slab-press-duo": {
        "fa-regular": "faslpdr"
      },
      pixel: {
        "fa-regular": "fapr"
      },
      mosaic: {
        "fa-solid": "fams"
      },
      vellum: {
        "fa-solid": "favs"
      },
      whiteboard: {
        "fa-semibold": "fawsb"
      },
      thumbprint: {
        "fa-light": "fatl"
      },
      notdog: {
        "fa-solid": "fans"
      },
      "notdog-duo": {
        "fa-solid": "fands"
      },
      etch: {
        "fa-solid": "faes"
      },
      graphite: {
        "fa-thin": "fagt"
      },
      jelly: {
        "fa-regular": "fajr"
      },
      "jelly-fill": {
        "fa-regular": "fajfr"
      },
      "jelly-duo": {
        "fa-regular": "fajdr"
      },
      chisel: {
        "fa-regular": "facr"
      },
      utility: {
        "fa-semibold": "fausb"
      },
      "utility-duo": {
        "fa-semibold": "faudsb"
      },
      "utility-fill": {
        "fa-semibold": "faufsb"
      }
    },
    al$1 = {
      classic: ["fas", "far", "fal", "fat", "fad"],
      duotone: ["fadr", "fadl", "fadt"],
      sharp: ["fass", "fasr", "fasl", "fast"],
      "sharp-duotone": ["fasds", "fasdr", "fasdl", "fasdt"],
      slab: ["faslr"],
      "slab-press": ["faslpr"],
      "slab-duo": ["fasldr"],
      "slab-press-duo": ["faslpdr"],
      pixel: ["fapr"],
      mosaic: ["fams"],
      vellum: ["favs"],
      whiteboard: ["fawsb"],
      thumbprint: ["fatl"],
      notdog: ["fans"],
      "notdog-duo": ["fands"],
      etch: ["faes"],
      graphite: ["fagt"],
      jelly: ["fajr"],
      "jelly-fill": ["fajfr"],
      "jelly-duo": ["fajdr"],
      chisel: ["facr"],
      utility: ["fausb"],
      "utility-duo": ["faudsb"],
      "utility-fill": ["faufsb"]
    },
    da = {
      classic: {
        fab: "fa-brands",
        fad: "fa-duotone",
        fal: "fa-light",
        far: "fa-regular",
        fas: "fa-solid",
        fat: "fa-thin"
      },
      duotone: {
        fadr: "fa-regular",
        fadl: "fa-light",
        fadt: "fa-thin"
      },
      sharp: {
        fass: "fa-solid",
        fasr: "fa-regular",
        fasl: "fa-light",
        fast: "fa-thin"
      },
      "sharp-duotone": {
        fasds: "fa-solid",
        fasdr: "fa-regular",
        fasdl: "fa-light",
        fasdt: "fa-thin"
      },
      slab: {
        faslr: "fa-regular"
      },
      "slab-press": {
        faslpr: "fa-regular"
      },
      "slab-duo": {
        fasldr: "fa-regular"
      },
      "slab-press-duo": {
        faslpdr: "fa-regular"
      },
      pixel: {
        fapr: "fa-regular"
      },
      mosaic: {
        fams: "fa-solid"
      },
      vellum: {
        favs: "fa-solid"
      },
      whiteboard: {
        fawsb: "fa-semibold"
      },
      thumbprint: {
        fatl: "fa-light"
      },
      notdog: {
        fans: "fa-solid"
      },
      "notdog-duo": {
        fands: "fa-solid"
      },
      etch: {
        faes: "fa-solid"
      },
      graphite: {
        fagt: "fa-thin"
      },
      jelly: {
        fajr: "fa-regular"
      },
      "jelly-fill": {
        fajfr: "fa-regular"
      },
      "jelly-duo": {
        fajdr: "fa-regular"
      },
      chisel: {
        facr: "fa-regular"
      },
      utility: {
        fausb: "fa-semibold"
      },
      "utility-duo": {
        faudsb: "fa-semibold"
      },
      "utility-fill": {
        faufsb: "fa-semibold"
      }
    },
    el$1 = ["solid", "regular", "light", "thin", "duotone", "brands", "semibold"],
    sl$1 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    ol$1 = sl$1.concat([11, 12, 13, 14, 15, 16, 17, 18, 19, 20]),
    rl$1 = ["aw", "fw", "pull-left", "pull-right"],
    ga = [].concat(_toConsumableArray(Object.keys(al$1)), el$1, rl$1, ["2xs", "xs", "sm", "lg", "xl", "2xl", "beat", "beat-fade", "border", "bounce", "buzz", "canvas-square", "canvas-roomy", "fade", "flip-360", "flip-both", "flip-horizontal", "flip-vertical", "flip", "float", "inverse", "jello", "layers", "layers-bottom-left", "layers-bottom-right", "layers-counter", "layers-text", "layers-top-left", "layers-top-right", "li", "pull-end", "pull-start", "pulse", "rotate-180", "rotate-270", "rotate-90", "rotate-by", "shake", "spin-pulse", "spin-reverse", "spin", "spin-snap", "spin-snap-4", "spin-snap-8", "stack-1x", "stack-2x", "stack", "swing", "ul", "wag", "width-auto", "width-fixed", l$1.GROUP, l$1.SWAP_OPACITY, l$1.PRIMARY, l$1.SECONDARY]).concat(sl$1.map(function (s) {
      return "".concat(s, "x");
    })).concat(ol$1.map(function (s) {
      return "w-".concat(s);
    }));

  var NAMESPACE_IDENTIFIER = '___FONT_AWESOME___';
  var PRODUCTION = function () {
    try {
      return "production" === 'production';
    } catch (e$$1) {
      return false;
    }
  }();
  function familyProxy(obj) {
    // Defaults to the classic family if family is not available
    return new Proxy(obj, {
      get: function get(target, prop) {
        return prop in target ? target[prop] : target[u];
      }
    });
  }
  var _PREFIX_TO_STYLE = _objectSpread2({}, rl);

  // We changed FACSSClassesToStyleId in the icons repo to be canonical and as such, "classic" family does not have any
  // duotone styles.  But we do still need duotone in _PREFIX_TO_STYLE below, so we are manually adding
  // {'fa-duotone': 'duotone'}
  _PREFIX_TO_STYLE[u] = _objectSpread2(_objectSpread2(_objectSpread2(_objectSpread2({}, {
    'fa-duotone': 'duotone'
  }), rl[u]), rt['kit']), rt['kit-duotone']);
  var PREFIX_TO_STYLE = familyProxy(_PREFIX_TO_STYLE);
  var _STYLE_TO_PREFIX = _objectSpread2({}, $l);

  // We changed FAStyleIdToShortPrefixId in the icons repo to be canonical and as such, "classic" family does not have any
  // duotone styles.  But we do still need duotone in _STYLE_TO_PREFIX below, so we are manually adding {duotone: 'fad'}
  _STYLE_TO_PREFIX[u] = _objectSpread2(_objectSpread2(_objectSpread2(_objectSpread2({}, {
    duotone: 'fad'
  }), _STYLE_TO_PREFIX[u]), St['kit']), St['kit-duotone']);
  var STYLE_TO_PREFIX = familyProxy(_STYLE_TO_PREFIX);
  var _PREFIX_TO_LONG_STYLE = _objectSpread2({}, da);
  _PREFIX_TO_LONG_STYLE[u] = _objectSpread2(_objectSpread2({}, _PREFIX_TO_LONG_STYLE[u]), It['kit']);
  var PREFIX_TO_LONG_STYLE = familyProxy(_PREFIX_TO_LONG_STYLE);
  var _LONG_STYLE_TO_PREFIX = _objectSpread2({}, ra);
  _LONG_STYLE_TO_PREFIX[u] = _objectSpread2(_objectSpread2({}, _LONG_STYLE_TO_PREFIX[u]), mt['kit']);
  var LONG_STYLE_TO_PREFIX = familyProxy(_LONG_STYLE_TO_PREFIX);
  var _FONT_WEIGHT_TO_PREFIX = _objectSpread2({}, Al);
  var FONT_WEIGHT_TO_PREFIX = familyProxy(_FONT_WEIGHT_TO_PREFIX);
  var RESERVED_CLASSES = [].concat(_toConsumableArray(it), _toConsumableArray(ga));

  function bunker(fn) {
    try {
      for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }
      fn.apply(void 0, args);
    } catch (e) {
      if (!PRODUCTION) {
        throw e;
      }
    }
  }

  var w$2 = WINDOW || {};
  if (!w$2[NAMESPACE_IDENTIFIER]) w$2[NAMESPACE_IDENTIFIER] = {};
  if (!w$2[NAMESPACE_IDENTIFIER].styles) w$2[NAMESPACE_IDENTIFIER].styles = {};
  if (!w$2[NAMESPACE_IDENTIFIER].hooks) w$2[NAMESPACE_IDENTIFIER].hooks = {};
  if (!w$2[NAMESPACE_IDENTIFIER].shims) w$2[NAMESPACE_IDENTIFIER].shims = [];
  var namespace = w$2[NAMESPACE_IDENTIFIER];

  function normalizeIcons(icons) {
    return Object.keys(icons).reduce(function (acc, iconName) {
      var icon = icons[iconName];
      var expanded = !!icon.icon;
      if (expanded) {
        acc[icon.iconName] = icon.icon;
      } else {
        acc[iconName] = icon;
      }
      return acc;
    }, {});
  }
  function defineIcons(prefix, icons) {
    var params = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    var _params$skipHooks = params.skipHooks,
      skipHooks = _params$skipHooks === void 0 ? false : _params$skipHooks;
    var normalized = normalizeIcons(icons);
    if (typeof namespace.hooks.addPack === 'function' && !skipHooks) {
      namespace.hooks.addPack(prefix, normalizeIcons(icons));
    } else {
      namespace.styles[prefix] = _objectSpread2(_objectSpread2({}, namespace.styles[prefix] || {}), normalized);
    }

    /**
     * Font Awesome 4 used the prefix of `fa` for all icons. With the introduction
     * of new styles we needed to differentiate between them. Prefix `fa` is now an alias
     * for `fas` so we'll ease the upgrade process for our users by automatically defining
     * this as well.
     */
    if (prefix === 'fas') {
      defineIcons('fa', icons);
    }
  }

  var icons = {
    
    "camera": [512,512,["62258","camera-alt"],"f030","M149.1 64.8L138.7 96 64 96C28.7 96 0 124.7 0 160L0 416c0 35.3 28.7 64 64 64l384 0c35.3 0 64-28.7 64-64l0-256c0-35.3-28.7-64-64-64l-74.7 0-10.4-31.2C356.4 45.2 338.1 32 317.4 32L194.6 32c-20.7 0-39 13.2-45.5 32.8zM256 192a96 96 0 1 1 0 192 96 96 0 1 1 0-192z"],
    "camera-slash": [576,512,[],"e0d9","M41-24.9c-9.4-9.4-24.6-9.4-33.9 0S-2.3-.3 7 9.1l528 528c9.4 9.4 24.6 9.4 33.9 0s9.4-24.6 0-33.9l-42.8-42.8c11-11.5 17.8-27.1 17.8-44.3l0-256c0-35.3-28.7-64-64-64l-74.7 0-10.4-31.2C388.4 45.2 370.1 32 349.4 32L226.6 32c-20.7 0-39 13.2-45.5 32.8L170.7 96 161.8 96 41-24.9zM261.5 195.7c8.4-2.4 17.3-3.7 26.5-3.7 53 0 96 43 96 96 0 9.2-1.3 18.1-3.7 26.5L261.5 195.7zM192 288c0-8 1-15.9 2.9-23.3L47.9 117.7C38 129 32 143.8 32 160l0 256c0 35.3 28.7 64 64 64l314.2 0-98.9-98.9c-7.5 1.9-15.3 2.9-23.3 2.9-53 0-96-43-96-96z"],
    "display": [512,512,[],"e163","M448 96l0 256-384 0 0-256 384 0zM64 32C28.7 32 0 60.7 0 96L0 352c0 35.3 28.7 64 64 64l144 0-16 48-72 0c-13.3 0-24 10.7-24 24s10.7 24 24 24l272 0c13.3 0 24-10.7 24-24s-10.7-24-24-24l-72 0-16-48 144 0c35.3 0 64-28.7 64-64l0-256c0-35.3-28.7-64-64-64L64 32z"],
    "display-slash": [576,512,["desktop-slash"],"e2fa","M41-24.9c-9.4-9.4-24.6-9.4-33.9 0S-2.3-.3 7 9.1l528 528c9.4 9.4 24.6 9.4 33.9 0s9.4-24.6 0-33.9L481.8 416c34.5-1 62.2-29.2 62.2-64l0-256c0-35.3-28.7-64-64-64L97.8 32 41-24.9zM161.8 96l318.2 0 0 256-62.2 0-256-256zM282 352l-186 0 0-186-64-64 0 250c0 35.3 28.7 64 64 64l144 0-16 48-72 0c-13.3 0-24 10.7-24 24s10.7 24 24 24l272 0c5.1 0 9.8-1.6 13.7-4.3l-43.7-43.7-42 0-16-48 10 0-64-64z"],
    "eye": [576,512,["128065"],"f06e","M288 32c-80.8 0-145.5 36.8-192.6 80.6-46.8 43.5-78.1 95.4-93 131.1-3.3 7.9-3.3 16.7 0 24.6 14.9 35.7 46.2 87.7 93 131.1 47.1 43.7 111.8 80.6 192.6 80.6s145.5-36.8 192.6-80.6c46.8-43.5 78.1-95.4 93-131.1 3.3-7.9 3.3-16.7 0-24.6-14.9-35.7-46.2-87.7-93-131.1-47.1-43.7-111.8-80.6-192.6-80.6zM144 256a144 144 0 1 1 288 0 144 144 0 1 1 -288 0zm144-64c0 35.3-28.7 64-64 64-11.5 0-22.3-3-31.7-8.4-1 10.9-.1 22.1 2.9 33.2 13.7 51.2 66.4 81.6 117.6 67.9s81.6-66.4 67.9-117.6c-12.2-45.7-55.5-74.8-101.1-70.8 5.3 9.3 8.4 20.1 8.4 31.7z"],
    "eye-slash": [576,512,[],"f070","M41-24.9c-9.4-9.4-24.6-9.4-33.9 0S-2.3-.3 7 9.1l528 528c9.4 9.4 24.6 9.4 33.9 0s9.4-24.6 0-33.9l-96.4-96.4c2.7-2.4 5.4-4.8 8-7.2 46.8-43.5 78.1-95.4 93-131.1 3.3-7.9 3.3-16.7 0-24.6-14.9-35.7-46.2-87.7-93-131.1-47.1-43.7-111.8-80.6-192.6-80.6-56.8 0-105.6 18.2-146 44.2L41-24.9zM204.5 138.7c23.5-16.8 52.4-26.7 83.5-26.7 79.5 0 144 64.5 144 144 0 31.1-9.9 59.9-26.7 83.5l-34.7-34.7c12.7-21.4 17-47.7 10.1-73.7-13.7-51.2-66.4-81.6-117.6-67.9-8.6 2.3-16.7 5.7-24 10l-34.7-34.7zM325.3 395.1c-11.9 3.2-24.4 4.9-37.3 4.9-79.5 0-144-64.5-144-144 0-12.9 1.7-25.4 4.9-37.3L69.4 139.2c-32.6 36.8-55 75.8-66.9 104.5-3.3 7.9-3.3 16.7 0 24.6 14.9 35.7 46.2 87.7 93 131.1 47.1 43.7 111.8 80.6 192.6 80.6 37.3 0 71.2-7.9 101.5-20.6l-64.2-64.2z"],
    "gear": [512,512,["9881","cog"],"f013","M195.1 9.5C198.1-5.3 211.2-16 226.4-16l59.8 0c15.2 0 28.3 10.7 31.3 25.5L332 79.5c14.1 6 27.3 13.7 39.3 22.8l67.8-22.5c14.4-4.8 30.2 1.2 37.8 14.4l29.9 51.8c7.6 13.2 4.9 29.8-6.5 39.9L447 233.3c.9 7.4 1.3 15 1.3 22.7s-.5 15.3-1.3 22.7l53.4 47.5c11.4 10.1 14 26.8 6.5 39.9l-29.9 51.8c-7.6 13.1-23.4 19.2-37.8 14.4l-67.8-22.5c-12.1 9.1-25.3 16.7-39.3 22.8l-14.4 69.9c-3.1 14.9-16.2 25.5-31.3 25.5l-59.8 0c-15.2 0-28.3-10.7-31.3-25.5l-14.4-69.9c-14.1-6-27.2-13.7-39.3-22.8L73.5 432.3c-14.4 4.8-30.2-1.2-37.8-14.4L5.8 366.1c-7.6-13.2-4.9-29.8 6.5-39.9l53.4-47.5c-.9-7.4-1.3-15-1.3-22.7s.5-15.3 1.3-22.7L12.3 185.8c-11.4-10.1-14-26.8-6.5-39.9L35.7 94.1c7.6-13.2 23.4-19.2 37.8-14.4l67.8 22.5c12.1-9.1 25.3-16.7 39.3-22.8L195.1 9.5zM256.3 336a80 80 0 1 0 -.6-160 80 80 0 1 0 .6 160z"],
    "microphone": [384,512,[],"f130","M192 0C139 0 96 43 96 96l0 128c0 53 43 96 96 96s96-43 96-96l0-128c0-53-43-96-96-96zM48 184c0-13.3-10.7-24-24-24S0 170.7 0 184l0 40c0 97.9 73.3 178.7 168 190.5l0 49.5-48 0c-13.3 0-24 10.7-24 24s10.7 24 24 24l144 0c13.3 0 24-10.7 24-24s-10.7-24-24-24l-48 0 0-49.5c94.7-11.8 168-92.6 168-190.5l0-40c0-13.3-10.7-24-24-24s-24 10.7-24 24l0 40c0 79.5-64.5 144-144 144S48 303.5 48 224l0-40z"],
    "microphone-signal-meter": [576,512,[],"e760","M344 0c-53 0-96 43-96 96l0 128c0 53 43 96 96 96s96-43 96-96l0-128c0-53-43-96-96-96zM200 184c0-13.3-10.7-24-24-24s-24 10.7-24 24l0 40c0 97.9 73.3 178.7 168 190.5l0 49.5-48 0c-13.3 0-24 10.7-24 24s10.7 24 24 24l144 0c13.3 0 24-10.7 24-24s-10.7-24-24-24l-48 0 0-49.5c94.7-11.8 168-92.6 168-190.5l0-40c0-13.3-10.7-24-24-24s-24 10.7-24 24l0 40c0 79.5-64.5 144-144 144S200 303.5 200 224l0-40zM88 64a32 32 0 1 0 -64 0 32 32 0 1 0 64 0zM56 224a32 32 0 1 0 0-64 32 32 0 1 0 0 64zm32 96a32 32 0 1 0 -64 0 32 32 0 1 0 64 0zM56 480a32 32 0 1 0 0-64 32 32 0 1 0 0 64z"],
    "microphone-slash": [576,512,[],"f131","M41-24.9c-9.4-9.4-24.6-9.4-33.9 0S-2.3-.3 7 9.1l528 528c9.4 9.4 24.6 9.4 33.9 0s9.4-24.6 0-33.9L424.7 358.8C458.9 324.2 480 276.6 480 224l0-40c0-13.3-10.7-24-24-24s-24 10.7-24 24l0 40c0 39.3-15.7 74.9-41.3 100.9L356.8 291C373.6 273.7 384 250 384 224l0-128c0-53-43-96-96-96s-96 43-96 96l0 30.2-151-151zm298.3 434l-41.4-41.4c-3.3 .2-6.5 .3-9.8 .3-79.5 0-144-64.5-144-144l0-10.2-43.6-43.6c-2.8 3.9-4.4 8.7-4.4 13.8l0 40c0 97.9 73.3 178.7 168 190.5l0 49.5-48 0c-13.3 0-24 10.7-24 24s10.7 24 24 24l144 0c13.3 0 24-10.7 24-24s-10.7-24-24-24l-48 0 0-49.5c9.3-1.2 18.4-3 27.3-5.4z"],
    "phone-hangup": [640,512,[],"e225","M602 366.2c-10.1 17.7-31.8 25.1-50.6 17.4l-97.5-40.1c-16.6-6.8-26.7-23.7-24.9-41.5l5.7-56.7c-73.6-27.7-154.9-29-229.2-3.9l6.1 60.7c1.8 17.8-8.3 34.7-24.9 41.5L89.1 383.6c-18.8 7.8-40.5 .3-50.6-17.4l-2.9-5c-33.2-58.2-28-141.4 37.3-183.9 149.9-97.5 344.7-97.5 494.6 0 65.4 42.5 70.5 125.8 37.3 183.9l-2.9 5z"],
    "speaker": [384,512,[],"f8df","M0 64C0 28.7 28.7 0 64 0L320 0c35.3 0 64 28.7 64 64l0 384c0 35.3-28.7 64-64 64L64 512c-35.3 0-64-28.7-64-64L0 64zM304 336a112 112 0 1 0 -224 0 112 112 0 1 0 224 0zM192 272a64 64 0 1 1 0 128 64 64 0 1 1 0-128zm0-112a48 48 0 1 0 0-96 48 48 0 1 0 0 96z"],
    "video": [576,512,["video-camera"],"f03d","M96 64c-35.3 0-64 28.7-64 64l0 256c0 35.3 28.7 64 64 64l256 0c35.3 0 64-28.7 64-64l0-256c0-35.3-28.7-64-64-64L96 64zM464 336l73.5 58.8c4.2 3.4 9.4 5.2 14.8 5.2 13.1 0 23.7-10.6 23.7-23.7l0-240.6c0-13.1-10.6-23.7-23.7-23.7-5.4 0-10.6 1.8-14.8 5.2L464 176 464 336z"],
    "video-slash": [576,512,[],"f4e2","M41-24.9c-9.4-9.4-24.6-9.4-33.9 0S-2.3-.3 7 9.1l528 528c9.4 9.4 24.6 9.4 33.9 0s9.4-24.6 0-33.9l-153-153 0-222.2c0-35.3-28.7-64-64-64L129.8 64 41-24.9zM32 128l0 256c0 35.3 28.7 64 64 64l256 0c7.8 0 15.3-1.4 22.2-4L36 105.8c-2.6 6.9-4 14.4-4 22.2zM464 336l73.5 58.8c4.2 3.4 9.4 5.2 14.8 5.2 13.1 0 23.7-10.6 23.7-23.7l0-240.6c0-13.1-10.6-23.7-23.7-23.7-5.4 0-10.6 1.8-14.8 5.2L464 176 464 336z"],
    "volume": [512,512,["128265","volume-medium"],"f6a8","M48 352l48 0 134.1 119.2c6.4 5.7 14.6 8.8 23.1 8.8 19.2 0 34.8-15.6 34.8-34.8l0-378.4c0-19.2-15.6-34.8-34.8-34.8-8.5 0-16.7 3.1-23.1 8.8L96 160 48 160c-26.5 0-48 21.5-48 48l0 96c0 26.5 21.5 48 48 48zM441.1 107c-10.3-8.4-25.4-6.8-33.8 3.5s-6.8 25.4 3.5 33.8C443.3 170.7 464 210.9 464 256s-20.7 85.3-53.2 111.8c-10.3 8.4-11.8 23.5-3.5 33.8s23.5 11.8 33.8 3.5c43.2-35.2 70.9-88.9 70.9-149s-27.7-113.8-70.9-149zm-60.5 74.5c-10.3-8.4-25.4-6.8-33.8 3.5s-6.8 25.4 3.5 33.8C361.1 227.6 368 241 368 256s-6.9 28.4-17.7 37.3c-10.3 8.4-11.8 23.5-3.5 33.8s23.5 11.8 33.8 3.5C402.1 312.9 416 286.1 416 256s-13.9-56.9-35.5-74.5z"],
    "volume-xmark": [576,512,["volume-mute","volume-times"],"f6a9","M48 352l48 0 134.1 119.2c6.4 5.7 14.6 8.8 23.1 8.8 19.2 0 34.8-15.6 34.8-34.8l0-378.4c0-19.2-15.6-34.8-34.8-34.8-8.5 0-16.7 3.1-23.1 8.8L96 160 48 160c-26.5 0-48 21.5-48 48l0 96c0 26.5 21.5 48 48 48zM367 175c-9.4 9.4-9.4 24.6 0 33.9l47 47-47 47c-9.4 9.4-9.4 24.6 0 33.9s24.6 9.4 33.9 0l47-47 47 47c9.4 9.4 24.6 9.4 33.9 0s9.4-24.6 0-33.9l-47-47 47-47c9.4-9.4 9.4-24.6 0-33.9s-24.6-9.4-33.9 0l-47 47-47-47c-9.4-9.4-24.6-9.4-33.9 0z"]

  };
  var prefixes = [null    ,'fas',
    ,'fa-solid'
];
  bunker(function () {
    for (var _i = 0, _prefixes = prefixes; _i < _prefixes.length; _i++) {
      var prefix = _prefixes[_i];
      if (!prefix) continue;
      defineIcons(prefix, icons);
    }
  });

}());
