"use strict";

const STORE_KEY = "paraxial-optics-testbench-v1";
const EPS = 1e-12;
const SVG_W = 1100;
const SVG_H = 520;

const rayColors = ["#43c7d6", "#f2c15c", "#ef7f75", "#7ed889", "#b992ff"];
let benchDrag = null;

const componentDefs = {
  space: {
    label: "Free Space",
    short: "Gap",
    category: "Spacing",
    glyph: "S",
    color: "#75a8ff",
    description: "Paraxial translation through a uniform medium.",
    defaults: { length: 80, n: 1 },
    fields: [
      { key: "length", label: "Length", unit: "mm", min: -10000, max: 10000, step: 1 },
      { key: "n", label: "Index", unit: "", min: 0.1, max: 5, step: 0.01 }
    ]
  },
  thinLens: {
    label: "Thin Lens",
    short: "Lens",
    category: "Lenses",
    glyph: "L",
    color: "#43c7d6",
    description: "Ideal thin lens with focal length f.",
    defaults: { f: 75, diameter: 25 },
    fields: [
      { key: "f", label: "Focal length", unit: "mm", min: -5000, max: 5000, step: 1 },
      { key: "diameter", label: "Clear diameter", unit: "mm", min: 0.1, max: 1000, step: 1 }
    ]
  },
  asphere: {
    label: "Aspheric Lens",
    short: "Asphere",
    category: "Lenses",
    glyph: "AS",
    color: "#43c7d6",
    description: "Diffraction-limited asphere modeled as an ideal thin lens with NA metadata.",
    defaults: { f: 8, diameter: 5, na: 0.5, conic: -1 },
    fields: [
      { key: "f", label: "Focal length", unit: "mm", min: -5000, max: 5000, step: 0.1 },
      { key: "diameter", label: "Clear aperture", unit: "mm", min: 0.1, max: 1000, step: 0.1 },
      { key: "na", label: "Numerical aperture", unit: "", min: 0, max: 1.6, step: 0.01 },
      { key: "conic", label: "Conic constant", unit: "", min: -100, max: 100, step: 0.1 }
    ]
  },
  cylindricalLens: {
    label: "Cylindrical Lens",
    short: "Cylinder",
    category: "Lenses",
    glyph: "CY",
    color: "#43c7d6",
    description: "One-axis focusing element; the active meridian uses the thin-lens ABCD matrix.",
    defaults: { f: 100, diameter: 25 },
    fields: [
      { key: "f", label: "Focal length", unit: "mm", min: -5000, max: 5000, step: 1 },
      { key: "diameter", label: "Clear aperture", unit: "mm", min: 0.1, max: 1000, step: 1 }
    ]
  },
  thickLens: {
    label: "Thick Lens",
    short: "Thick",
    category: "Lenses",
    glyph: "T",
    color: "#43c7d6",
    description: "Two spherical refracting surfaces with center thickness.",
    defaults: { r1: 55, r2: -55, thickness: 8, nLens: 1.5168, nIn: 1, nOut: 1, diameter: 25 },
    fields: [
      { key: "r1", label: "Radius R1", unit: "mm", min: -10000, max: 10000, step: 1 },
      { key: "r2", label: "Radius R2", unit: "mm", min: -10000, max: 10000, step: 1 },
      { key: "thickness", label: "Thickness", unit: "mm", min: 0, max: 1000, step: 0.5 },
      { key: "nLens", label: "Lens index", unit: "", min: 0.1, max: 5, step: 0.001 },
      { key: "nIn", label: "Input index", unit: "", min: 0.1, max: 5, step: 0.001 },
      { key: "nOut", label: "Output index", unit: "", min: 0.1, max: 5, step: 0.001 },
      { key: "diameter", label: "Clear diameter", unit: "mm", min: 0.1, max: 1000, step: 1 }
    ]
  },
  sphericalInterface: {
    label: "Spherical Interface",
    short: "Surface",
    category: "Surfaces",
    glyph: "R",
    color: "#b992ff",
    description: "Refraction at a spherical boundary, using positive radius to the right.",
    defaults: { radius: 60, nIn: 1, nOut: 1.5168, diameter: 25 },
    fields: [
      { key: "radius", label: "Radius", unit: "mm", min: -10000, max: 10000, step: 1 },
      { key: "nIn", label: "Input index", unit: "", min: 0.1, max: 5, step: 0.001 },
      { key: "nOut", label: "Output index", unit: "", min: 0.1, max: 5, step: 0.001 },
      { key: "diameter", label: "Clear diameter", unit: "mm", min: 0.1, max: 1000, step: 1 }
    ]
  },
  planeInterface: {
    label: "Plane Interface",
    short: "Plane",
    category: "Surfaces",
    glyph: "P",
    color: "#b992ff",
    description: "Flat refracting boundary between two media.",
    defaults: { nIn: 1, nOut: 1.5168, diameter: 25 },
    fields: [
      { key: "nIn", label: "Input index", unit: "", min: 0.1, max: 5, step: 0.001 },
      { key: "nOut", label: "Output index", unit: "", min: 0.1, max: 5, step: 0.001 },
      { key: "diameter", label: "Clear diameter", unit: "mm", min: 0.1, max: 1000, step: 1 }
    ]
  },
  slab: {
    label: "Dielectric Slab",
    short: "Slab",
    category: "Surfaces",
    glyph: "D",
    color: "#b992ff",
    description: "Plane-parallel plate with angular refraction inside.",
    defaults: { thickness: 12, nSlab: 1.5168, nIn: 1, nOut: 1, diameter: 30 },
    fields: [
      { key: "thickness", label: "Thickness", unit: "mm", min: 0, max: 1000, step: 0.5 },
      { key: "nSlab", label: "Slab index", unit: "", min: 0.1, max: 5, step: 0.001 },
      { key: "nIn", label: "Input index", unit: "", min: 0.1, max: 5, step: 0.001 },
      { key: "nOut", label: "Output index", unit: "", min: 0.1, max: 5, step: 0.001 },
      { key: "diameter", label: "Clear diameter", unit: "mm", min: 0.1, max: 1000, step: 1 }
    ]
  },
  curvedMedium: {
    label: "Curved Medium",
    short: "Curved",
    category: "Surfaces",
    glyph: "CM",
    color: "#b992ff",
    description: "Refraction through a finite curved dielectric medium with two spherical boundaries.",
    defaults: { r1: 40, r2: -80, thickness: 10, nMedium: 1.45, nIn: 1, nOut: 1, diameter: 24 },
    fields: [
      { key: "r1", label: "Entrance radius", unit: "mm", min: -10000, max: 10000, step: 1 },
      { key: "r2", label: "Exit radius", unit: "mm", min: -10000, max: 10000, step: 1 },
      { key: "thickness", label: "Path thickness", unit: "mm", min: 0, max: 1000, step: 0.5 },
      { key: "nMedium", label: "Medium index", unit: "", min: 0.1, max: 5, step: 0.001 },
      { key: "nIn", label: "Input index", unit: "", min: 0.1, max: 5, step: 0.001 },
      { key: "nOut", label: "Output index", unit: "", min: 0.1, max: 5, step: 0.001 },
      { key: "diameter", label: "Clear diameter", unit: "mm", min: 0.1, max: 1000, step: 1 }
    ]
  },
  ballLens: {
    label: "Ball Lens",
    short: "Ball",
    category: "Lenses",
    glyph: "B",
    color: "#43c7d6",
    description: "Spherical ball lens modeled by two curved refracting surfaces and a diameter translation.",
    defaults: { radius: 2.5, nBall: 1.8, nMedium: 1, diameter: 5 },
    fields: [
      { key: "radius", label: "Ball radius", unit: "mm", min: 0.01, max: 1000, step: 0.1 },
      { key: "nBall", label: "Ball index", unit: "", min: 0.1, max: 5, step: 0.001 },
      { key: "nMedium", label: "Medium index", unit: "", min: 0.1, max: 5, step: 0.001 },
      { key: "diameter", label: "Clear diameter", unit: "mm", min: 0.1, max: 1000, step: 0.1 }
    ]
  },
  aperture: {
    label: "Aperture Stop",
    short: "Stop",
    category: "Stops",
    glyph: "A",
    color: "#ef7f75",
    description: "Hard circular stop that clips rays by height.",
    defaults: { radius: 8 },
    fields: [{ key: "radius", label: "Radius", unit: "mm", min: 0.01, max: 1000, step: 0.5 }]
  },
  screen: {
    label: "Screen",
    short: "Screen",
    category: "Stops",
    glyph: "Q",
    color: "#7ed889",
    description: "Observation plane for spot size and ray intercepts.",
    defaults: { radius: 20 },
    fields: [{ key: "radius", label: "Visible radius", unit: "mm", min: 0.1, max: 1000, step: 1 }]
  },
  curvedMirror: {
    label: "Curved Mirror",
    short: "Mirror",
    category: "Mirrors",
    glyph: "M",
    color: "#f2c15c",
    description: "Unfolded paraxial equivalent of a spherical mirror.",
    defaults: { radius: 120, diameter: 30 },
    fields: [
      { key: "radius", label: "Radius", unit: "mm", min: -10000, max: 10000, step: 1 },
      { key: "diameter", label: "Clear diameter", unit: "mm", min: 0.1, max: 1000, step: 1 }
    ]
  },
  flatMirror: {
    label: "Flat Mirror",
    short: "Fold",
    category: "Mirrors",
    glyph: "F",
    color: "#f2c15c",
    description: "Fold marker with identity ABCD matrix.",
    defaults: { diameter: 30 },
    fields: [{ key: "diameter", label: "Clear diameter", unit: "mm", min: 0.1, max: 1000, step: 1 }]
  },
  grin: {
    label: "GRIN Medium",
    short: "GRIN",
    category: "Advanced",
    glyph: "G",
    color: "#7ed889",
    description: "Quadratic-index medium with sinusoidal ray transfer.",
    defaults: { length: 20, gamma: 0.025, n0: 1.6, diameter: 20 },
    fields: [
      { key: "length", label: "Length", unit: "mm", min: 0, max: 1000, step: 0.5 },
      { key: "gamma", label: "Gradient", unit: "1/mm", min: 0, max: 2, step: 0.001 },
      { key: "n0", label: "Center index", unit: "", min: 0.1, max: 5, step: 0.001 },
      { key: "diameter", label: "Clear diameter", unit: "mm", min: 0.1, max: 1000, step: 1 }
    ]
  },
  afocalBlock: {
    label: "Afocal Magnifier",
    short: "Afocal",
    category: "Advanced",
    glyph: "AF",
    color: "#7ed889",
    description: "Compact telescope/beam expander block with matrix [M 0; 0 1/M].",
    defaults: { magnification: 2, diameter: 25 },
    fields: [
      { key: "magnification", label: "Magnification", unit: "x", min: -100, max: 100, step: 0.1 },
      { key: "diameter", label: "Clear diameter", unit: "mm", min: 0.1, max: 1000, step: 1 }
    ]
  },
  custom: {
    label: "Custom ABCD",
    short: "ABCD",
    category: "Advanced",
    glyph: "C",
    color: "#ffffff",
    description: "User-defined ray-transfer matrix.",
    defaults: { a: 1, b: 0, c: 0, d: 1, diameter: 25 },
    fields: [
      { key: "a", label: "A", unit: "", min: -10000, max: 10000, step: 0.01 },
      { key: "b", label: "B", unit: "mm", min: -10000, max: 10000, step: 0.1 },
      { key: "c", label: "C", unit: "1/mm", min: -10000, max: 10000, step: 0.0001 },
      { key: "d", label: "D", unit: "", min: -10000, max: 10000, step: 0.01 },
      { key: "diameter", label: "Clear diameter", unit: "mm", min: 0.1, max: 1000, step: 1 }
    ]
  }
};

const sourceFields = [
  { key: "centerHeight", label: "Center height", unit: "mm", min: -500, max: 500, step: 0.1 },
  { key: "fieldSpan", label: "Field span", unit: "mm", min: 0, max: 1000, step: 0.5 },
  { key: "fieldCount", label: "Field points", unit: "", min: 1, max: 5, step: 1 },
  { key: "raysPerField", label: "Rays per field", unit: "", min: 1, max: 17, step: 2 },
  { key: "chiefAngle", label: "Chief angle", unit: "mrad", min: -1000, max: 1000, step: 1 },
  { key: "fanAngle", label: "Fan half-angle", unit: "mrad", min: 0, max: 1000, step: 1 }
];

const gaussianFields = [
  { key: "wavelength", label: "Wavelength", unit: "nm", min: 100, max: 20000, step: 1 },
  { key: "waist", label: "Input waist", unit: "mm", min: 0.001, max: 100, step: 0.01 },
  { key: "waistOffset", label: "Input z from waist", unit: "mm", min: -10000, max: 10000, step: 1 }
];

const fiberFields = [
  { key: "mfd", label: "Fiber MFD", unit: "um", min: 0.1, max: 100, step: 0.1 },
  { key: "wavelength", label: "Wavelength", unit: "nm", min: 100, max: 20000, step: 1 },
  { key: "focalLength", label: "Asphere f", unit: "mm", min: 0.1, max: 1000, step: 0.1 },
  { key: "defocus", label: "Defocus", unit: "mm", min: -1000, max: 1000, step: 0.01 },
  { key: "targetDiameter", label: "Target beam", unit: "mm", min: 0.01, max: 1000, step: 0.1 },
  { key: "lensDiameter", label: "Clear aperture", unit: "mm", min: 0.1, max: 1000, step: 0.1 },
  { key: "lensNA", label: "Asphere NA", unit: "", min: 0, max: 1.6, step: 0.01 },
  { key: "workingDistance", label: "Output throw", unit: "mm", min: 0, max: 10000, step: 1 }
];

let state = loadState() || presetState("camera");

const el = {
  library: document.getElementById("componentLibrary"),
  sourceControls: document.getElementById("sourceControls"),
  gaussianControls: document.getElementById("gaussianControls"),
  gaussianOutput: document.getElementById("gaussianOutput"),
  benchSvg: document.getElementById("benchSvg"),
  benchHud: document.getElementById("benchHud"),
  sequenceList: document.getElementById("sequenceList"),
  inspectorBody: document.getElementById("inspectorBody"),
  matrixPanel: document.getElementById("matrixPanel"),
  matrixOutput: document.getElementById("matrixOutput"),
  metricsOutput: document.getElementById("metricsOutput"),
  optimizerControls: document.getElementById("optimizerControls"),
  optimizerResult: document.getElementById("optimizerResult"),
  fiberControls: document.getElementById("fiberControls"),
  fiberResult: document.getElementById("fiberResult"),
  systemSummary: document.getElementById("systemSummary"),
  showMatricesToggle: document.getElementById("showMatricesToggle"),
  showGaussianToggle: document.getElementById("showGaussianToggle"),
  showGridToggle: document.getElementById("showGridToggle")
};

function identity() {
  return [
    [1, 0],
    [0, 1]
  ];
}

function multiply(left, right) {
  return [
    [
      left[0][0] * right[0][0] + left[0][1] * right[1][0],
      left[0][0] * right[0][1] + left[0][1] * right[1][1]
    ],
    [
      left[1][0] * right[0][0] + left[1][1] * right[1][0],
      left[1][0] * right[0][1] + left[1][1] * right[1][1]
    ]
  ];
}

function transform(matrix, vector) {
  return [
    matrix[0][0] * vector[0] + matrix[0][1] * vector[1],
    matrix[1][0] * vector[0] + matrix[1][1] * vector[1]
  ];
}

function translation(length) {
  return [
    [1, finite(length)],
    [0, 1]
  ];
}

function refraction(nIn, nOut, radius) {
  const n1 = Math.max(finite(nIn, 1), 0.0001);
  const n2 = Math.max(finite(nOut, 1), 0.0001);
  const r = finite(radius);
  if (!Number.isFinite(r) || Math.abs(r) < EPS || Math.abs(r) > 1e11) {
    return [
      [1, 0],
      [0, n1 / n2]
    ];
  }
  return [
    [1, 0],
    [(n1 - n2) / (r * n2), n1 / n2]
  ];
}

function componentMatrix(component) {
  const v = component.values;
  switch (component.type) {
    case "space":
      return translation(v.length);
    case "thinLens":
    case "asphere":
    case "cylindricalLens":
      return [
        [1, 0],
        [-1 / safeNonZero(v.f), 1]
      ];
    case "thickLens": {
      const m1 = refraction(v.nIn, v.nLens, v.r1);
      const t = translation(v.thickness);
      const m2 = refraction(v.nLens, v.nOut, v.r2);
      return multiply(m2, multiply(t, m1));
    }
    case "sphericalInterface":
      return refraction(v.nIn, v.nOut, v.radius);
    case "planeInterface":
      return refraction(v.nIn, v.nOut, Infinity);
    case "slab": {
      const m1 = refraction(v.nIn, v.nSlab, Infinity);
      const t = translation(v.thickness);
      const m2 = refraction(v.nSlab, v.nOut, Infinity);
      return multiply(m2, multiply(t, m1));
    }
    case "curvedMedium": {
      const m1 = refraction(v.nIn, v.nMedium, v.r1);
      const t = translation(v.thickness);
      const m2 = refraction(v.nMedium, v.nOut, v.r2);
      return multiply(m2, multiply(t, m1));
    }
    case "ballLens": {
      const radius = Math.max(0.0001, finite(v.radius, 1));
      const m1 = refraction(v.nMedium, v.nBall, radius);
      const t = translation(2 * radius);
      const m2 = refraction(v.nBall, v.nMedium, -radius);
      return multiply(m2, multiply(t, m1));
    }
    case "curvedMirror":
      return [
        [1, 0],
        [-2 / safeNonZero(v.radius), 1]
      ];
    case "flatMirror":
    case "aperture":
    case "screen":
      return identity();
    case "grin": {
      const length = finite(v.length);
      const gamma = Math.max(0, finite(v.gamma));
      if (gamma < EPS) return translation(length);
      const phase = gamma * length;
      return [
        [Math.cos(phase), Math.sin(phase) / gamma],
        [-gamma * Math.sin(phase), Math.cos(phase)]
      ];
    }
    case "afocalBlock": {
      const magnification = safeNonZero(v.magnification);
      return [
        [magnification, 0],
        [0, 1 / magnification]
      ];
    }
    case "custom":
      return [
        [finite(v.a, 1), finite(v.b)],
        [finite(v.c), finite(v.d, 1)]
      ];
    default:
      return identity();
  }
}

function componentLength(component) {
  const v = component.values;
  if (component.type === "space") return finite(v.length);
  if (component.type === "thickLens") return Math.max(0, finite(v.thickness));
  if (component.type === "slab") return Math.max(0, finite(v.thickness));
  if (component.type === "curvedMedium") return Math.max(0, finite(v.thickness));
  if (component.type === "ballLens") return Math.max(0, 2 * finite(v.radius, 1));
  if (component.type === "grin") return Math.max(0, finite(v.length));
  return 0;
}

function componentRadius(component) {
  const v = component.values;
  if (component.type === "aperture" || component.type === "screen") return Math.max(0.01, finite(v.radius, 10));
  if ("diameter" in v) return Math.max(0.01, finite(v.diameter, 20) / 2);
  return 12;
}

function finite(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function safeNonZero(value) {
  const number = finite(value);
  if (Math.abs(number) < EPS) return number < 0 ? -EPS : EPS;
  return number;
}

function uid() {
  return `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function makeComponent(type, overrides = {}) {
  const def = componentDefs[type];
  return {
    id: uid(),
    type,
    name: overrides.name || def.label,
    values: { ...clone(def.defaults), ...(overrides.values || {}) }
  };
}

function presetState(name) {
  const base = {
    source: {
      centerHeight: 0,
      fieldSpan: 8,
      fieldCount: 3,
      raysPerField: 7,
      chiefAngle: 0,
      fanAngle: 24
    },
    gaussian: {
      wavelength: 632.8,
      waist: 0.35,
      waistOffset: 0
    },
    position: {
      nudgeStep: 5
    },
    fiber: {
      mfd: 10.4,
      wavelength: 1550,
      focalLength: 8,
      defocus: 0,
      targetDiameter: 2.4,
      lensDiameter: 5,
      lensNA: 0.5,
      workingDistance: 120
    },
    view: {
      showMatrices: true,
      showGaussian: true,
      showGrid: true
    },
    optimizer: {
      componentId: null,
      parameter: null,
      target: "screenSpot",
      min: 5,
      max: 250,
      span: 50,
      targetDistance: 100,
      targetHeight: 0,
      targetDivergence: 1,
      targetRayleigh: 1000,
      targetSpotDistance: 100,
      targetSpotRadius: 1,
      lastResult: null
    },
    selectedId: null,
    components: []
  };

  if (name === "fourf") {
    base.components = [
      makeComponent("space", { name: "Object distance", values: { length: 75, n: 1 } }),
      makeComponent("thinLens", { name: "Lens 1", values: { f: 75, diameter: 30 } }),
      makeComponent("space", { name: "Fourier space", values: { length: 150, n: 1 } }),
      makeComponent("thinLens", { name: "Lens 2", values: { f: 75, diameter: 30 } }),
      makeComponent("space", { name: "Image distance", values: { length: 75, n: 1 } }),
      makeComponent("screen", { name: "Image plane", values: { radius: 18 } })
    ];
  } else if (name === "expander") {
    base.source.fieldSpan = 0;
    base.source.raysPerField = 11;
    base.source.fanAngle = 8;
    base.gaussian.waist = 0.45;
    base.components = [
      makeComponent("space", { name: "Input gap", values: { length: 25, n: 1 } }),
      makeComponent("thinLens", { name: "Diverger", values: { f: -25, diameter: 12 } }),
      makeComponent("space", { name: "Lens separation", values: { length: 50, n: 1 } }),
      makeComponent("thinLens", { name: "Collimator", values: { f: 75, diameter: 35 } }),
      makeComponent("space", { name: "Output throw", values: { length: 140, n: 1 } }),
      makeComponent("screen", { name: "Output plane", values: { radius: 18 } })
    ];
  } else if (name === "empty") {
    base.components = [makeComponent("screen", { name: "Output plane", values: { radius: 20 } })];
  } else {
    base.components = [
      makeComponent("space", { name: "Object distance", values: { length: 65, n: 1 } }),
      makeComponent("aperture", { name: "Entrance stop", values: { radius: 9 } }),
      makeComponent("space", { name: "Lens gap", values: { length: 15, n: 1 } }),
      makeComponent("thickLens", {
        name: "Imaging lens",
        values: { r1: 45, r2: -45, thickness: 7, nLens: 1.5168, nIn: 1, nOut: 1, diameter: 28 }
      }),
      makeComponent("space", { name: "Back focus", values: { length: 71, n: 1 } }),
      makeComponent("screen", { name: "Sensor", values: { radius: 16 } })
    ];
  }

  base.selectedId = base.components[0]?.id || null;
  return base;
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return null;
    return normalizeState(JSON.parse(raw));
  } catch {
    return null;
  }
}

function saveState() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  } catch {
    // Local files can be opened in privacy modes where storage is unavailable.
  }
}

function normalizeState(input) {
  const fallback = presetState("camera");
  const next = { ...fallback, ...input };
  next.source = { ...fallback.source, ...(input.source || {}) };
  next.gaussian = { ...fallback.gaussian, ...(input.gaussian || {}) };
  next.position = { ...fallback.position, ...(input.position || {}) };
  next.fiber = { ...fallback.fiber, ...(input.fiber || {}) };
  next.view = { ...fallback.view, ...(input.view || {}) };
  next.optimizer = { ...fallback.optimizer, ...(input.optimizer || {}) };
  next.components = Array.isArray(input.components)
    ? input.components
        .filter((component) => componentDefs[component.type])
        .map((component) => ({
          id: component.id || uid(),
          type: component.type,
          name: component.name || componentDefs[component.type].label,
          values: { ...clone(componentDefs[component.type].defaults), ...(component.values || {}) }
        }))
    : fallback.components;
  if (!next.components.some((component) => component.id === next.selectedId)) {
    next.selectedId = next.components[0]?.id || null;
  }
  return next;
}

function generateRays() {
  const fieldCount = clampInt(state.source.fieldCount, 1, 5);
  const raysPerField = clampInt(state.source.raysPerField, 1, 17);
  const fields = [];
  if (fieldCount === 1 || Math.abs(state.source.fieldSpan) < EPS) {
    fields.push(finite(state.source.centerHeight));
  } else {
    const span = finite(state.source.fieldSpan);
    for (let i = 0; i < fieldCount; i += 1) {
      fields.push(finite(state.source.centerHeight) - span / 2 + (span * i) / (fieldCount - 1));
    }
  }

  const rays = [];
  fields.forEach((height, fieldIndex) => {
    for (let i = 0; i < raysPerField; i += 1) {
      const t = raysPerField === 1 ? 0 : -1 + (2 * i) / (raysPerField - 1);
      const theta = (finite(state.source.chiefAngle) + t * finite(state.source.fanAngle)) / 1000;
      rays.push({
        fieldIndex,
        rayIndex: i,
        vec: [height, theta],
        alive: true,
        clippedBy: null,
        points: [{ z: 0, y: height }]
      });
    }
  });
  return rays;
}

function clipAtClearAperture(rays, component, z) {
  const hasAperture =
    component.type === "aperture" || component.type === "screen" || "diameter" in component.values || "radius" in component.values;
  if (!hasAperture) return;
  const radius = componentRadius(component);
  rays.forEach((ray) => {
    if (ray.alive && Math.abs(ray.vec[0]) > radius) {
      ray.alive = false;
      ray.clippedBy = component.id;
      ray.points.push({ z, y: ray.vec[0], clipped: true });
    }
  });
}

function traceSystem(components = state.components) {
  const rays = generateRays();
  let total = identity();
  let z = 0;
  const componentData = [];

  components.forEach((component, index) => {
    const before = rays.map((ray) => ({
      y: ray.vec[0],
      theta: ray.vec[1],
      alive: ray.alive
    }));
    const matrix = componentMatrix(component);
    const zStart = z;
    const length = componentLength(component);
    let screenHits = [];

    if (!["aperture", "screen", "space"].includes(component.type)) {
      clipAtClearAperture(rays, component, z);
    }

    if (component.type === "aperture") {
      clipAtClearAperture(rays, component, z);
    } else if (component.type === "screen") {
      screenHits = rays
        .filter((ray) => ray.alive)
        .map((ray) => ({ fieldIndex: ray.fieldIndex, y: ray.vec[0], theta: ray.vec[1] }));
    } else if (component.type === "space") {
      rays.forEach((ray) => {
        if (!ray.alive) return;
        ray.vec = transform(translation(component.values.length), ray.vec);
        ray.points.push({ z: z + component.values.length, y: ray.vec[0] });
      });
      z += component.values.length;
    } else if (component.type === "thickLens") {
      const v = component.values;
      const m1 = refraction(v.nIn, v.nLens, v.r1);
      const t = translation(v.thickness);
      const m2 = refraction(v.nLens, v.nOut, v.r2);
      rays.forEach((ray) => {
        if (!ray.alive) return;
        ray.vec = transform(m1, ray.vec);
        ray.vec = transform(t, ray.vec);
        ray.points.push({ z: z + v.thickness, y: ray.vec[0] });
        ray.vec = transform(m2, ray.vec);
      });
      z += Math.max(0, v.thickness);
    } else if (component.type === "slab") {
      const v = component.values;
      const m1 = refraction(v.nIn, v.nSlab, Infinity);
      const t = translation(v.thickness);
      const m2 = refraction(v.nSlab, v.nOut, Infinity);
      rays.forEach((ray) => {
        if (!ray.alive) return;
        ray.vec = transform(m1, ray.vec);
        ray.vec = transform(t, ray.vec);
        ray.points.push({ z: z + v.thickness, y: ray.vec[0] });
        ray.vec = transform(m2, ray.vec);
      });
      z += Math.max(0, v.thickness);
    } else if (component.type === "curvedMedium" || component.type === "ballLens") {
      rays.forEach((ray) => {
        if (!ray.alive) return;
        ray.vec = transform(matrix, ray.vec);
        ray.points.push({ z: z + length, y: ray.vec[0] });
      });
      z += length;
    } else if (component.type === "grin") {
      const v = component.values;
      const lengthNow = Math.max(0, finite(v.length));
      rays.forEach((ray) => {
        if (!ray.alive) return;
        const start = [...ray.vec];
        const samples = 18;
        for (let i = 1; i <= samples; i += 1) {
          const s = (lengthNow * i) / samples;
          const sample = transform(grinMatrixFor(v.gamma, s), start);
          ray.points.push({ z: z + s, y: sample[0] });
        }
        ray.vec = transform(matrix, start);
      });
      z += lengthNow;
    } else {
      rays.forEach((ray) => {
        if (!ray.alive) return;
        ray.vec = transform(matrix, ray.vec);
      });
    }

    if (!["aperture", "screen", "space"].includes(component.type)) {
      clipAtClearAperture(rays, component, z);
    }

    total = multiply(matrix, total);
    const cumulativeMatrix = total;

    const after = rays.map((ray) => ({
      y: ray.vec[0],
      theta: ray.vec[1],
      alive: ray.alive
    }));

    componentData.push({
      component,
      index,
      zStart,
      zEnd: zStart + length,
      matrix,
      cumulativeMatrix,
      before,
      after,
      screenHits,
      liveBefore: before.filter((ray) => ray.alive).length,
      liveAfter: after.filter((ray) => ray.alive).length
    });
  });

  return {
    rays,
    components: componentData,
    matrix: total,
    totalLength: z,
    opticalPath: opticalPathLength(components)
  };
}

function grinMatrixFor(gammaValue, length) {
  const gamma = Math.max(0, finite(gammaValue));
  if (gamma < EPS) return translation(length);
  const phase = gamma * length;
  return [
    [Math.cos(phase), Math.sin(phase) / gamma],
    [-gamma * Math.sin(phase), Math.cos(phase)]
  ];
}

function opticalPathLength(components) {
  return components.reduce((sum, component) => {
    const v = component.values;
    if (component.type === "space") return sum + finite(v.length) * finite(v.n, 1);
    if (component.type === "thickLens") return sum + finite(v.thickness) * finite(v.nLens, 1);
    if (component.type === "slab") return sum + finite(v.thickness) * finite(v.nSlab, 1);
    if (component.type === "curvedMedium") return sum + finite(v.thickness) * finite(v.nMedium, 1);
    if (component.type === "ballLens") return sum + 2 * finite(v.radius, 1) * finite(v.nBall, 1);
    if (component.type === "grin") return sum + finite(v.length) * finite(v.n0, 1);
    return sum;
  }, 0);
}

function render() {
  state = normalizeState(state);
  const trace = traceSystem();

  renderLibrary();
  renderSourceControls();
  renderGaussianControls();
  renderFiberControls();
  renderOptimizerControls();
  renderInspector(trace);
  renderBench(trace);
  renderSequence(trace);
  renderAnalysis(trace);
  updateViewToggles();
  saveState();
}

function renderLibrary() {
  const groups = {};
  Object.entries(componentDefs).forEach(([type, def]) => {
    groups[def.category] ||= [];
    groups[def.category].push([type, def]);
  });
  el.library.innerHTML = Object.entries(groups)
    .map(([category, items]) => {
      const buttons = items
        .map(([type, def]) => {
          return `
            <button class="component-add" type="button" data-add-type="${type}">
              <span class="glyph" style="background:${def.color}">${def.glyph}</span>
              <span><strong>${escapeHtml(def.label)}</strong><span>${escapeHtml(def.description)}</span></span>
            </button>
          `;
        })
        .join("");
      return `<div class="library-group"><div class="library-title">${escapeHtml(category)}</div>${buttons}</div>`;
    })
    .join("");
  el.library.querySelectorAll("[data-add-type]").forEach((button) => {
    button.addEventListener("click", () => addComponent(button.dataset.addType));
  });
}

function renderSourceControls() {
  el.sourceControls.innerHTML = sourceFields.map((field) => fieldHtml("source", field, state.source[field.key])).join("");
  el.sourceControls.querySelectorAll("input").forEach((input) => {
    input.addEventListener("change", () => {
      const field = sourceFields.find((item) => item.key === input.dataset.key);
      state.source[field.key] = coerceFieldValue(input.value, field);
      render();
    });
  });
}

function renderGaussianControls() {
  el.gaussianControls.innerHTML = gaussianFields.map((field) => fieldHtml("gaussian", field, state.gaussian[field.key])).join("");
  el.gaussianControls.querySelectorAll("input").forEach((input) => {
    input.addEventListener("change", () => {
      const field = gaussianFields.find((item) => item.key === input.dataset.key);
      state.gaussian[field.key] = coerceFieldValue(input.value, field);
      render();
    });
  });
}

function renderFiberControls() {
  el.fiberControls.innerHTML = fiberFields.map((field) => fieldHtml("fiber", field, state.fiber[field.key])).join("");
  el.fiberControls.querySelectorAll("input").forEach((input) => {
    input.addEventListener("change", () => {
      const field = fiberFields.find((item) => item.key === input.dataset.key);
      state.fiber[field.key] = coerceFieldValue(input.value, field);
      render();
    });
  });
  renderFiberResult();
}

function renderOptimizerControls() {
  const candidates = state.components.filter((component) => numericFieldsFor(component).length > 0);
  if (!candidates.length) {
    el.optimizerControls.innerHTML = "";
    el.optimizerResult.textContent = "Add a component with numeric parameters to use the solver.";
    el.optimizerResult.className = "solver-result warn";
    return;
  }
  const selected = selectedComponent();
  const selectedCanOptimize = selected && numericFieldsFor(selected).length > 0;
  if (!candidates.some((component) => component.id === state.optimizer.componentId)) {
    state.optimizer.componentId = selectedCanOptimize ? selected.id : candidates[0].id;
  }
  const component = candidates.find((item) => item.id === state.optimizer.componentId) || candidates[0];
  const params = numericFieldsFor(component);
  if (!params.some((field) => field.key === state.optimizer.parameter)) {
    state.optimizer.parameter = params[0]?.key || null;
  }
  const currentValue = finite(component.values[state.optimizer.parameter]);
  const currentScore = optimizerObjective(traceSystem());
  const targetInputs = optimizerTargetInputs();

  el.optimizerControls.innerHTML = `
    <div class="optimizer-card">
      <div class="field">
        <span>Component</span>
        <select data-opt="componentId">
          ${candidates.map((item) => `<option value="${item.id}" ${item.id === component.id ? "selected" : ""}>${escapeHtml(item.name)}</option>`).join("")}
        </select>
      </div>
      <div class="field">
        <span>Variable</span>
        <select data-opt="parameter">
          ${params.map((field) => `<option value="${field.key}" ${field.key === state.optimizer.parameter ? "selected" : ""}>${escapeHtml(field.label)}</option>`).join("")}
        </select>
      </div>
      <div class="optimizer-current">
        <div><span>Current</span><strong>${format(currentValue)}</strong></div>
        <div><span>Residual</span><strong>${formatScore(currentScore)}</strong></div>
      </div>
      <div class="optimizer-actions">
        <button type="button" data-opt-action="useSelected" ${selectedCanOptimize ? "" : "disabled"}>Use Selected</button>
        <button type="button" data-opt-action="rangeAround">Center Range</button>
      </div>
    </div>
    <div class="target-buttons">
      ${optimizerTargets()
        .map(
          (target) => `
            <button type="button" class="${target.value === state.optimizer.target ? "active" : ""}" data-target="${target.value}">
              <strong>${target.label}</strong>
              <span>${target.meta}</span>
            </button>
          `
        )
        .join("")}
    </div>
    <div class="form-grid optimizer-range-grid">
      ${optimizerNumber("min", "Min")}
      ${optimizerNumber("max", "Max")}
      ${optimizerNumber("span", "Span")}
      ${targetInputs}
    </div>
  `;

  el.optimizerControls.querySelectorAll("select").forEach((select) => {
    select.addEventListener("change", () => {
      state.optimizer[select.dataset.opt] = select.value;
      if (select.dataset.opt === "componentId") {
        state.selectedId = select.value;
        state.optimizer.parameter = null;
      }
      state.optimizer.lastResult = null;
      render();
    });
  });

  el.optimizerControls.querySelectorAll("input").forEach((input) => {
    input.addEventListener("change", () => {
      state.optimizer[input.dataset.opt] = finite(input.value);
      state.optimizer.lastResult = null;
      if (input.dataset.opt === "span") {
        centerOptimizerRange();
        return;
      }
      if (input.dataset.opt === "min" || input.dataset.opt === "max") {
        state.optimizer.span = Math.abs(finite(state.optimizer.max) - finite(state.optimizer.min));
      }
      render();
    });
  });

  el.optimizerControls.querySelectorAll("[data-target]").forEach((button) => {
    button.addEventListener("click", () => {
      state.optimizer.target = button.dataset.target;
      state.optimizer.lastResult = null;
      render();
    });
  });

  el.optimizerControls.querySelectorAll("[data-opt-action]").forEach((button) => {
    button.addEventListener("click", () => {
      if (button.dataset.optAction === "useSelected") {
        useSelectedForOptimizer();
      } else if (button.dataset.optAction === "rangeAround") {
        centerOptimizerRange();
      }
    });
  });
}

function optimizerNumber(key, label) {
  return `
    <div class="field">
      <span>${label}</span>
      <input type="number" data-opt="${key}" value="${formatInput(state.optimizer[key])}" step="0.1" />
    </div>
  `;
}

function optimizerTargetInputs() {
  if (state.optimizer.target === "focusDistance") {
    return optimizerNumber("targetDistance", "Focus distance");
  }
  if (state.optimizer.target === "screenHeight") {
    return optimizerNumber("targetHeight", "Screen height");
  }
  if (state.optimizer.target === "matchDivergence") {
    return optimizerNumber("targetDivergence", "Divergence mrad");
  }
  if (state.optimizer.target === "rayleighRange") {
    return optimizerNumber("targetRayleigh", "Rayleigh range");
  }
  if (state.optimizer.target === "targetSpotSize") {
    return `${optimizerNumber("targetSpotDistance", "Target plane")}${optimizerNumber("targetSpotRadius", "Spot RMS")}`;
  }
  return "";
}

function renderInspector(trace) {
  const component = selectedComponent();
  if (!component) {
    el.inspectorBody.innerHTML = `<div class="empty-state">Select a component on the bench or add one from the library.</div>`;
    return;
  }
  const def = componentDefs[component.type];
  const data = trace.components.find((item) => item.component.id === component.id);
  const positionPanel = component.type === "space" ? "" : railPositionHtml(component, data);
  const beamPanel = component.type === "screen" ? beamCheckHtml(data) : "";
  el.inspectorBody.innerHTML = `
    <div class="component-title">
      <strong>${escapeHtml(def.label)}</strong>
      <span>${escapeHtml(def.description)}</span>
    </div>
    <div class="field">
      <span>Name</span>
      <input type="text" data-name value="${escapeHtml(component.name)}" />
    </div>
    <div class="component-actions">
      <button type="button" data-action="left">Prev</button>
      <button type="button" data-action="right">Next</button>
      <button type="button" data-action="duplicate">Copy</button>
      <button type="button" data-action="delete">Delete</button>
    </div>
    ${positionPanel}
    ${beamPanel}
    <div class="form-grid">
      ${def.fields.map((field) => fieldHtml("component", field, component.values[field.key])).join("")}
    </div>
    <div class="mini-matrix">
      <span>${escapeHtml(component.name)} matrix</span>
      <span>${matrixLine(componentMatrix(component))}</span>
      <span>z = ${format(data?.zStart || 0)} mm, live rays ${data?.liveAfter ?? 0}/${trace.rays.length}</span>
    </div>
  `;

  el.inspectorBody.querySelector("[data-name]").addEventListener("change", (event) => {
    component.name = event.target.value.trim() || def.label;
    render();
  });

  el.inspectorBody.querySelectorAll("input[data-key]").forEach((input) => {
    input.addEventListener("change", () => {
      const field = def.fields.find((item) => item.key === input.dataset.key);
      component.values[field.key] = coerceFieldValue(input.value, field);
      render();
    });
  });

  el.inspectorBody.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", () => handleComponentAction(button.dataset.action));
  });

  el.inspectorBody.querySelectorAll("[data-nudge]").forEach((button) => {
    button.addEventListener("click", () => {
      const multiplier = finite(button.dataset.nudge, 1);
      const step = Math.max(0.001, finite(state.position.nudgeStep, 5));
      slideComponentBy(component.id, multiplier * step);
    });
  });

  el.inspectorBody.querySelectorAll("[data-position]").forEach((input) => {
    input.addEventListener("change", () => {
      const key = input.dataset.position;
      if (key === "nudgeStep") {
        state.position.nudgeStep = Math.max(0.001, finite(input.value, 5));
      } else if (key === "zStart") {
        setComponentStart(component.id, finite(input.value));
      } else if (key === "gapBefore" || key === "gapAfter") {
        setAdjacentGap(component.id, key === "gapBefore" ? "before" : "after", Math.max(0, finite(input.value)));
      }
      render();
    });
  });
}

function railPositionHtml(component, data) {
  const gaps = adjacentGapInfo(component.id);
  return `
    <div class="rail-card">
      <div class="rail-head">
        <strong>Rail Position</strong>
        <span>Spacing around the selected component.</span>
      </div>
      <div class="nudge-row">
        <button type="button" data-nudge="-10" title="Nudge left by 10 steps">&lt;&lt;</button>
        <button type="button" data-nudge="-1" title="Nudge left">&lt;</button>
        <label>
          <span>Step</span>
          <input type="number" data-position="nudgeStep" value="${formatInput(state.position.nudgeStep)}" min="0.001" step="0.5" />
        </label>
        <button type="button" data-nudge="1" title="Nudge right">&gt;</button>
        <button type="button" data-nudge="10" title="Nudge right by 10 steps">&gt;&gt;</button>
      </div>
      <div class="form-grid rail-grid">
        <label class="field">
          <span>Start z</span>
          <div class="field-row">
            <input type="number" data-position="zStart" value="${formatInput(data?.zStart || 0)}" step="0.1" />
            <span class="unit">mm</span>
          </div>
        </label>
        <label class="field">
          <span>Gap before</span>
          <div class="field-row">
            <input type="number" data-position="gapBefore" value="${formatInput(gaps.before)}" min="0" step="0.1" />
            <span class="unit">mm</span>
          </div>
        </label>
        <label class="field">
          <span>Gap after</span>
          <div class="field-row">
            <input type="number" data-position="gapAfter" value="${formatInput(gaps.after)}" min="0" step="0.1" />
            <span class="unit">mm</span>
          </div>
        </label>
      </div>
    </div>
  `;
}

function beamCheckHtml(data, compact = false) {
  const stats = beamCheckStats(data);
  if (!stats) {
    return `
      <div class="beam-card">
        <div class="rail-head">
          <strong>Beam Check</strong>
          <span>No live rays reach this plane.</span>
        </div>
      </div>
    `;
  }
  const gaussian = stats.gaussian;
  const items = [
    ["Centroid", `${format(stats.centroid)} mm`],
    ["RMS spot", `${format(stats.rms)} mm`],
    ["Diameter", `${format(stats.diameter)} mm`],
    ["Angle RMS", `${format(stats.angleRms * 1000)} mrad`]
  ];
  if (!compact) {
    items.push(["Rays", `${stats.count}`]);
  }
  return `
    <div class="beam-card">
      <div class="rail-head">
        <strong>Beam Check</strong>
        <span>Plane z = ${format(data?.zStart || 0)} mm</span>
      </div>
      <div class="beam-metrics">
        ${items.map(([label, value]) => `<div><span>${label}</span><strong>${value}</strong></div>`).join("")}
      </div>
      ${
        gaussian?.ok
          ? `<div class="beam-gaussian">
              Gaussian radius ${format(gaussian.radius)} mm, waist ${format(gaussian.waistRadius)} mm ${format(gaussian.waistDistance)} mm from this plane, Rayleigh ${format(gaussian.outputRayleigh)} mm.
            </div>`
          : `<div class="beam-gaussian">Gaussian beam is unstable at this plane.</div>`
      }
    </div>
  `;
}

function beamCheckStats(data) {
  if (!data || !data.screenHits.length) return null;
  const y = data.screenHits.map((hit) => hit.y);
  const theta = data.screenHits.map((hit) => hit.theta);
  const centroid = y.reduce((sum, value) => sum + value, 0) / y.length;
  return {
    count: y.length,
    centroid,
    rms: rms(y.map((value) => value - centroid)),
    diameter: diameter(y),
    angleRms: rms(theta),
    gaussian: gaussianResult(data.cumulativeMatrix)
  };
}

function renderBenchHud(trace, xScale) {
  const component = selectedComponent();
  if (!component) {
    el.benchHud.classList.add("hidden");
    el.benchHud.innerHTML = "";
    return;
  }
  const data = trace.components.find((item) => item.component.id === component.id);
  const def = componentDefs[component.type];
  const centerZ = (data?.zStart || 0) + componentLength(component) / 2;
  const xPct = Math.max(10, Math.min(90, (xScale(centerZ) / SVG_W) * 100));
  const alignRight = xPct > 62;
  el.benchHud.classList.toggle("hidden", false);
  el.benchHud.classList.toggle("align-right", alignRight);
  el.benchHud.style.left = `${xPct}%`;
  el.benchHud.innerHTML = `
    <div class="hud-title">
      <div>
        <strong>${escapeHtml(component.name)}</strong>
        <span>${escapeHtml(def.short)} at z ${format(data?.zStart || 0)} mm</span>
      </div>
      <button type="button" class="icon-btn" data-hud-close title="Close quick inspector">x</button>
    </div>
    ${component.type === "screen" ? beamCheckHtml(data, true) : ""}
    ${component.type === "space" ? "" : miniRailHtml(component, data)}
    ${miniParamHtml(component)}
  `;
  bindBenchHud(component, def);
}

function miniRailHtml(component, data) {
  const gaps = adjacentGapInfo(component.id);
  return `
    <div class="hud-rail">
      <button type="button" data-nudge="-1" title="Nudge left">&lt;</button>
      <label>
        <span>z</span>
        <input type="number" data-position="zStart" value="${formatInput(data?.zStart || 0)}" step="0.1" />
      </label>
      <button type="button" data-nudge="1" title="Nudge right">&gt;</button>
      <label>
        <span>before</span>
        <input type="number" data-position="gapBefore" value="${formatInput(gaps.before)}" min="0" step="0.1" />
      </label>
      <label>
        <span>after</span>
        <input type="number" data-position="gapAfter" value="${formatInput(gaps.after)}" min="0" step="0.1" />
      </label>
    </div>
  `;
}

function miniParamHtml(component) {
  const fields = componentDefs[component.type].fields.slice(0, component.type === "screen" ? 1 : 3);
  if (!fields.length) return "";
  return `
    <div class="hud-params">
      ${fields
        .map(
          (field) => `
            <label>
              <span>${escapeHtml(field.label)}</span>
              <input type="number" data-key="${field.key}" value="${formatInput(component.values[field.key])}" min="${field.min}" max="${field.max}" step="${field.step}" />
            </label>
          `
        )
        .join("")}
    </div>
  `;
}

function bindBenchHud(component, def) {
  const close = el.benchHud.querySelector("[data-hud-close]");
  close?.addEventListener("click", () => {
    state.selectedId = null;
    render();
  });
  el.benchHud.querySelectorAll("[data-nudge]").forEach((button) => {
    button.addEventListener("click", () => {
      const multiplier = finite(button.dataset.nudge, 1);
      const step = Math.max(0.001, finite(state.position.nudgeStep, 5));
      slideComponentBy(component.id, multiplier * step);
    });
  });
  el.benchHud.querySelectorAll("input[data-position]").forEach((input) => {
    input.addEventListener("change", () => {
      const key = input.dataset.position;
      if (key === "zStart") {
        setComponentStart(component.id, finite(input.value));
      } else if (key === "gapBefore" || key === "gapAfter") {
        setAdjacentGap(component.id, key === "gapBefore" ? "before" : "after", Math.max(0, finite(input.value)));
        render();
      }
    });
  });
  el.benchHud.querySelectorAll("input[data-key]").forEach((input) => {
    input.addEventListener("change", () => {
      const field = def.fields.find((item) => item.key === input.dataset.key);
      component.values[field.key] = coerceFieldValue(input.value, field);
      render();
    });
  });
}

function renderBench(trace) {
  const zMin = Math.min(0, ...trace.rays.flatMap((ray) => ray.points.map((point) => point.z)));
  const zMaxRaw = Math.max(1, ...trace.rays.flatMap((ray) => ray.points.map((point) => point.z)), trace.totalLength);
  const zPad = Math.max(10, (zMaxRaw - zMin) * 0.04);
  const zMax = zMaxRaw + zPad;
  const yValues = trace.rays.flatMap((ray) => ray.points.map((point) => point.y).filter(Number.isFinite));
  const componentY = trace.components.map((item) => componentRadius(item.component));
  const yMax = Math.max(8, Math.min(5000, Math.max(...yValues.map(Math.abs), ...componentY, 1) * 1.22));
  const margin = { left: 58, right: 42, top: 34, bottom: 56 };
  const xScale = (z) => margin.left + ((z - zMin) / (zMax - zMin)) * (SVG_W - margin.left - margin.right);
  const yScale = (y) => SVG_H / 2 - (y / yMax) * (SVG_H / 2 - margin.top - margin.bottom);

  const grid = state.view.showGrid ? renderGrid(xScale, yScale, zMin, zMax, yMax, margin) : "";
  const rays = trace.rays
    .map((ray) => {
      const path = ray.points
        .filter((point) => Number.isFinite(point.y) && Number.isFinite(point.z))
        .map((point, index) => `${index === 0 ? "M" : "L"} ${xScale(point.z).toFixed(2)} ${yScale(point.y).toFixed(2)}`)
        .join(" ");
      const color = rayColors[ray.fieldIndex % rayColors.length];
      const clipped = ray.clippedBy ? "ray-clipped" : "";
      return `<path class="ray-path ${clipped}" d="${path}" stroke="${color}" />`;
    })
    .join("");

  const components = trace.components.map((item) => renderComponentSvg(item, xScale, yScale, yMax)).join("");
  const axis = `<line class="axis" x1="${margin.left}" y1="${SVG_H / 2}" x2="${SVG_W - margin.right}" y2="${SVG_H / 2}" />`;

  el.benchSvg.setAttribute("viewBox", `0 0 ${SVG_W} ${SVG_H}`);
  el.benchSvg.innerHTML = `
    <rect width="${SVG_W}" height="${SVG_H}" fill="#0f141a" />
    ${grid}
    ${axis}
    ${rays}
    ${components}
    <text x="${margin.left}" y="${SVG_H - 20}" fill="#7d8b97" font-size="11">z: ${format(zMin)} to ${format(zMaxRaw)} mm</text>
    <text x="${SVG_W - margin.right}" y="${SVG_H - 20}" fill="#7d8b97" font-size="11" text-anchor="end">height scale: +/- ${format(yMax)} mm</text>
  `;

  el.benchSvg.querySelectorAll("[data-component-id]").forEach((node) => {
    node.addEventListener("click", () => {
      state.selectedId = node.dataset.componentId;
      render();
    });
    node.addEventListener("pointerdown", (event) => {
      const component = state.components.find((item) => item.id === node.dataset.componentId);
      if (!component || component.type === "space") return;
      const componentData = trace.components.find((item) => item.component.id === component.id);
      const rect = el.benchSvg.getBoundingClientRect();
      const dragScale = { rect, zMin, zMax, margin };
      state.selectedId = component.id;
      benchDrag = {
        componentId: component.id,
        startZ: componentData?.zStart || 0,
        pointerZ: clientXToBenchZ(event.clientX, dragScale),
        ...dragScale
      };
      document.body.classList.add("dragging-bench");
      event.preventDefault();
    });
  });
  renderBenchHud(trace, xScale);
}

function renderGrid(xScale, yScale, zMin, zMax, yMax, margin) {
  const lines = [];
  const zStep = niceStep((zMax - zMin) / 8);
  const firstZ = Math.ceil(zMin / zStep) * zStep;
  for (let z = firstZ; z <= zMax; z += zStep) {
    const x = xScale(z);
    lines.push(`<line class="grid-line" x1="${x}" y1="${margin.top}" x2="${x}" y2="${SVG_H - margin.bottom}" />`);
  }
  const yStep = niceStep((2 * yMax) / 8);
  for (let y = -Math.floor(yMax / yStep) * yStep; y <= yMax; y += yStep) {
    const yy = yScale(y);
    lines.push(`<line class="grid-line" x1="${margin.left}" y1="${yy}" x2="${SVG_W - margin.right}" y2="${yy}" />`);
  }
  return lines.join("");
}

function renderComponentSvg(item, xScale, yScale) {
  const { component } = item;
  const def = componentDefs[component.type];
  const selected = component.id === state.selectedId ? "component-selected" : "";
  const radius = componentRadius(component);
  const yTop = yScale(radius);
  const yBottom = yScale(-radius);
  const yMid = yScale(0);
  const x1 = xScale(item.zStart);
  const x2 = xScale(item.zEnd);
  const x = componentLength(component) > 0 ? (x1 + x2) / 2 : x1;
  const label = escapeHtml(component.name);
  let shape = "";

  if (component.type === "space") {
    const y = yMid + 22;
    shape = `
      <line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="rgba(117,168,255,0.36)" stroke-width="2" />
      <path d="M ${x1} ${y} l 7 -4 m -7 4 l 7 4 M ${x2} ${y} l -7 -4 m 7 4 l -7 4" stroke="rgba(117,168,255,0.62)" fill="none" />
    `;
  } else if (component.type === "thinLens") {
    const bow = component.values.f >= 0 ? 12 : -12;
    shape = `
      <path class="component-shape" stroke="${def.color}" d="M ${x} ${yTop} Q ${x + bow} ${yMid} ${x} ${yBottom}" />
      <path class="component-shape" stroke="${def.color}" d="M ${x} ${yTop} Q ${x - bow} ${yMid} ${x} ${yBottom}" />
    `;
  } else if (component.type === "asphere") {
    const bow = component.values.f >= 0 ? 18 : -18;
    shape = `
      <path class="component-shape" stroke="${def.color}" d="M ${x - 5} ${yTop} L ${x - 5} ${yBottom}" />
      <path class="component-shape" stroke="${def.color}" d="M ${x - 5} ${yTop} Q ${x + bow} ${yMid} ${x - 5} ${yBottom}" />
      <circle cx="${x + Math.sign(bow) * 10}" cy="${yMid}" r="3" fill="${def.color}" />
    `;
  } else if (component.type === "cylindricalLens") {
    const bow = component.values.f >= 0 ? 10 : -10;
    shape = `
      <path class="component-shape" stroke="${def.color}" d="M ${x} ${yTop} Q ${x + bow} ${yMid} ${x} ${yBottom}" />
      <line class="component-shape" x1="${x - 9}" y1="${yTop}" x2="${x - 9}" y2="${yBottom}" stroke="${def.color}" opacity="0.55" />
      <line class="component-shape" x1="${x + 9}" y1="${yTop}" x2="${x + 9}" y2="${yBottom}" stroke="${def.color}" opacity="0.55" />
    `;
  } else if (component.type === "thickLens") {
    shape = `
      <path class="component-body" d="M ${x1} ${yTop} Q ${x1 + 12} ${yMid} ${x1} ${yBottom} L ${x2} ${yBottom} Q ${x2 - 12} ${yMid} ${x2} ${yTop} Z" />
    `;
  } else if (component.type === "sphericalInterface") {
    const bow = component.values.radius >= 0 ? 12 : -12;
    shape = `<path class="component-shape" stroke="${def.color}" d="M ${x} ${yTop} Q ${x + bow} ${yMid} ${x} ${yBottom}" />`;
  } else if (component.type === "planeInterface") {
    shape = `<line class="component-shape" x1="${x}" y1="${yTop}" x2="${x}" y2="${yBottom}" stroke="${def.color}" />`;
  } else if (component.type === "slab" || component.type === "grin") {
    shape = `<rect class="component-body" x="${Math.min(x1, x2)}" y="${yTop}" width="${Math.max(2, Math.abs(x2 - x1))}" height="${Math.max(2, yBottom - yTop)}" rx="4" />`;
  } else if (component.type === "curvedMedium") {
    const bow1 = component.values.r1 >= 0 ? 12 : -12;
    const bow2 = component.values.r2 >= 0 ? 12 : -12;
    shape = `
      <path class="component-body" d="M ${x1} ${yTop} Q ${x1 + bow1} ${yMid} ${x1} ${yBottom} L ${x2} ${yBottom} Q ${x2 + bow2} ${yMid} ${x2} ${yTop} Z" />
    `;
  } else if (component.type === "ballLens") {
    const r = Math.max(6, Math.abs(yBottom - yTop) / 2);
    shape = `<ellipse class="component-body" cx="${x}" cy="${yMid}" rx="${Math.max(8, Math.abs(x2 - x1) / 2)}" ry="${r}" />`;
  } else if (component.type === "aperture") {
    const block = 34;
    shape = `
      <rect class="aperture-block" x="${x - 6}" y="${yTop - block}" width="12" height="${block}" />
      <rect class="aperture-block" x="${x - 6}" y="${yBottom}" width="12" height="${block}" />
      <line class="component-shape" x1="${x}" y1="${yTop}" x2="${x}" y2="${yBottom}" stroke="${def.color}" />
    `;
  } else if (component.type === "screen") {
    const stats = beamCheckStats(item);
    const centroidY = stats ? yScale(stats.centroid) : yMid;
    shape = `
      <line class="component-shape screen-line" x1="${x}" y1="${yTop}" x2="${x}" y2="${yBottom}" />
      ${
        stats
          ? `<circle cx="${x}" cy="${centroidY}" r="4" fill="#7ed889" />
             <text class="component-label screen-readout" x="${x + 8}" y="${Math.max(18, centroidY - 8)}" text-anchor="start">RMS ${format(stats.rms)} mm | y ${format(stats.centroid)} mm</text>`
          : ""
      }
    `;
  } else if (component.type === "curvedMirror") {
    const bow = component.values.radius >= 0 ? -14 : 14;
    shape = `<path class="component-shape" stroke="${def.color}" d="M ${x} ${yTop} Q ${x + bow} ${yMid} ${x} ${yBottom}" />`;
  } else if (component.type === "flatMirror") {
    shape = `<line class="component-shape" x1="${x - 10}" y1="${yTop}" x2="${x + 10}" y2="${yBottom}" stroke="${def.color}" />`;
  } else if (component.type === "afocalBlock") {
    shape = `
      <rect class="component-body" x="${x - 15}" y="${yTop}" width="30" height="${Math.max(2, yBottom - yTop)}" rx="5" />
      <path class="component-shape" stroke="${def.color}" d="M ${x - 8} ${yMid + 12} L ${x} ${yMid - 12} L ${x + 8} ${yMid + 12}" />
    `;
  } else {
    shape = `<path class="component-shape" stroke="${def.color}" d="M ${x} ${yTop} L ${x + 12} ${yMid} L ${x} ${yBottom} L ${x - 12} ${yMid} Z" />`;
  }

  const hitWidth = Math.max(18, Math.abs(x2 - x1) + 18);
  return `
    <g class="component-hit ${selected}" data-component-id="${component.id}" data-component-type="${component.type}">
      <rect class="component-drag-target" x="${x - hitWidth / 2}" y="${Math.min(yTop, yBottom) - 22}" width="${hitWidth}" height="${Math.abs(yBottom - yTop) + 64}" fill="transparent" pointer-events="all" />
      ${shape}
      <text class="component-label" x="${x}" y="${SVG_H - 38}">${label.slice(0, 18)}</text>
    </g>
  `;
}

function renderSequence(trace) {
  el.sequenceList.innerHTML = trace.components
    .map((item) => {
      const component = item.component;
      const def = componentDefs[component.type];
      const selected = component.id === state.selectedId ? "selected" : "";
      const length = componentLength(component);
      const detail = length ? `${format(length)} mm, z ${format(item.zStart)}-${format(item.zEnd)}` : `z ${format(item.zStart)} mm`;
      return `
        <div class="sequence-item ${selected}" draggable="true" data-sequence-id="${component.id}">
          <strong>${escapeHtml(component.name)}</strong>
          <span>${escapeHtml(def.short)} | ${detail}</span>
          <span>${matrixLine(componentMatrix(component), true)}</span>
        </div>
      `;
    })
    .join("");

  let draggingId = null;
  el.sequenceList.querySelectorAll(".sequence-item").forEach((item) => {
    item.addEventListener("click", () => {
      state.selectedId = item.dataset.sequenceId;
      render();
    });
    item.addEventListener("dragstart", (event) => {
      draggingId = item.dataset.sequenceId;
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", draggingId);
    });
    item.addEventListener("dragover", (event) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
    });
    item.addEventListener("drop", (event) => {
      event.preventDefault();
      const sourceId = draggingId || event.dataTransfer.getData("text/plain");
      reorderComponent(sourceId, item.dataset.sequenceId);
    });
  });
}

function renderAnalysis(trace) {
  const m = trace.matrix;
  const metrics = computeMetrics(trace);
  el.systemSummary.textContent = `${state.components.length} components | ${format(trace.totalLength)} mm physical length | ${metrics.live}/${metrics.totalRays} rays live`;
  el.matrixPanel.classList.toggle("hidden", !state.view.showMatrices);
  document.getElementById("gaussianPanel").classList.toggle("hidden", !state.view.showGaussian);

  el.matrixOutput.innerHTML = `
    <div class="matrix-table">
      <div class="matrix-cell">${format(m[0][0])}</div>
      <div class="matrix-cell">${format(m[0][1])}</div>
      <div class="matrix-cell">${format(m[1][0])}</div>
      <div class="matrix-cell">${format(m[1][1])}</div>
    </div>
    <div class="matrix-note">State vector is [height mm, angle rad]. B is in mm, C is in 1/mm.</div>
    <div class="per-component">
      ${trace.components.map((item) => `<div class="matrix-row"><span>${escapeHtml(item.component.name)}</span><span class="matrix-code">${matrixLine(item.matrix, true)}</span></div>`).join("")}
    </div>
  `;

  el.metricsOutput.innerHTML = [
    metricHtml("Effective focal length", signedLength(metrics.efl)),
    metricHtml("Back focal distance", signedLength(metrics.bfl)),
    metricHtml("Front focus distance", signedLength(metrics.ffd)),
    metricHtml("Determinant", format(metrics.det)),
    metricHtml("Spot RMS", signedLength(metrics.spotRms)),
    metricHtml("Spot diameter", signedLength(metrics.spotDiameter)),
    metricHtml("Final angle RMS", `${format(metrics.thetaRms * 1000)} mrad`),
    metricHtml("Optical path", signedLength(trace.opticalPath))
  ].join("");

  renderGaussianOutput(trace);
}

function renderGaussianOutput(trace) {
  const result = gaussianResult(trace.matrix);
  if (!result.ok) {
    el.gaussianOutput.innerHTML = result.message;
    return;
  }
  el.gaussianOutput.innerHTML = `
    <div>Output radius: <strong>${format(result.radius)} mm</strong></div>
    <div>Wavefront radius: <strong>${result.wavefront}</strong></div>
    <div>Waist from output plane: <strong>${format(result.waistDistance)} mm</strong></div>
    <div>Waist radius there: <strong>${format(result.waistRadius)} mm</strong></div>
  `;
}

function renderFiberResult() {
  const design = fiberDesign();
  if (!design.ok) {
    el.fiberResult.className = "solver-result warn";
    el.fiberResult.textContent = design.message;
    return;
  }
  const warnings = [];
  if (design.requiredNA > design.lensNA) warnings.push("lens NA is undersized");
  if (design.apertureFill > 0.9) warnings.push("clear aperture is tight");
  el.fiberResult.className = `solver-result ${warnings.length ? "warn" : "good"}`;
  el.fiberResult.innerHTML = `
    <div>Beam radius at asphere: <strong>${format(design.outputRadius)} mm</strong></div>
    <div>Beam diameter at asphere: <strong>${format(design.outputDiameter)} mm</strong></div>
    <div>Output waist from asphere: <strong>${format(design.waistDistance)} mm</strong></div>
    <div>Output waist radius: <strong>${format(design.outputWaistRadius)} mm</strong></div>
    <div>Fiber half-angle: <strong>${format(design.theta * 1000)} mrad</strong>, NA ${format(design.requiredNA)}</div>
    <div>Output divergence: <strong>${format(design.outputDivergence * 1000)} mrad</strong></div>
    <div>Rayleigh range: <strong>${format(design.outputRayleigh)} mm</strong></div>
    <div>Collimated target f: <strong>${format(design.recommendedF)} mm</strong></div>
    <div>${warnings.length ? warnings.join("; ") : "Asphere NA and clear aperture are adequate."}</div>
  `;
}

function fiberDesign() {
  const mfd = finite(state.fiber.mfd, 10.4);
  const wavelengthNm = finite(state.fiber.wavelength, 1550);
  const f = finite(state.fiber.focalLength, 8);
  const defocus = finite(state.fiber.defocus);
  const lensDistance = f + defocus;
  const targetDiameter = finite(state.fiber.targetDiameter, 2.4);
  if (mfd <= 0 || wavelengthNm <= 0 || f <= 0 || lensDistance <= 0) {
    return { ok: false, message: "MFD, wavelength, focal length, and fiber-lens distance must be positive." };
  }
  const waist = mfd / 2000;
  const wavelength = wavelengthNm * 1e-6;
  const inputRayleigh = Math.PI * waist * waist / wavelength;
  const theta = wavelength / (Math.PI * waist);
  const qAtLens = { re: lensDistance, im: inputRayleigh };
  const qAfterLens = complexDiv(qAtLens, complexAdd({ re: 1, im: 0 }, complexScale(qAtLens, -1 / f)));
  const beamAtLens = waist * Math.sqrt(1 + (lensDistance / inputRayleigh) ** 2);
  const invQ = complexDiv({ re: 1, im: 0 }, qAfterLens);
  const outputRadius = invQ.im < -EPS ? Math.sqrt(-wavelength / (Math.PI * invQ.im)) : beamAtLens;
  const outputDiameter = 2 * outputRadius;
  const recommendedF = Math.max(0, targetDiameter / (2 * theta));
  const outputRayleigh = Math.max(0, qAfterLens.im);
  const outputWaistRadius = Math.sqrt((wavelength * Math.max(outputRayleigh, 0)) / Math.PI);
  const outputDivergence = outputWaistRadius > EPS ? wavelength / (Math.PI * outputWaistRadius) : Infinity;
  const waistDistance = -qAfterLens.re;
  const requiredNA = Math.sin(Math.atan(theta));
  const lensDiameter = Math.max(0.0001, finite(state.fiber.lensDiameter, 5));
  const lensNA = Math.max(0, finite(state.fiber.lensNA, 0.5));
  return {
    ok: true,
    waist,
    wavelength,
    inputRayleigh,
    theta,
    lensDistance,
    qAfterLens,
    outputRadius,
    outputDiameter,
    outputWaistRadius,
    waistDistance,
    recommendedF,
    outputDivergence,
    outputRayleigh,
    requiredNA,
    lensNA,
    lensDiameter,
    apertureFill: outputDiameter / lensDiameter
  };
}

function solveFiberFocalLength() {
  const design = fiberDesign();
  if (!design.ok || !Number.isFinite(design.recommendedF) || design.recommendedF <= 0) {
    toast("Set a valid fiber target first");
    return;
  }
  state.fiber.focalLength = design.recommendedF;
  render();
}

function syncFiberToGaussian() {
  const design = fiberDesign();
  if (!design.ok) return;
  state.gaussian.wavelength = state.fiber.wavelength;
  state.gaussian.waist = design.waist;
  state.gaussian.waistOffset = 0;
  render();
}

function insertFiberAsphere() {
  const design = fiberDesign();
  if (!design.ok) {
    toast(design.message);
    return;
  }
  state.source = {
    ...state.source,
    centerHeight: 0,
    fieldSpan: 0,
    fieldCount: 1,
    raysPerField: 11,
    chiefAngle: 0,
    fanAngle: design.theta * 1000
  };
  state.gaussian = {
    wavelength: state.fiber.wavelength,
    waist: design.waist,
    waistOffset: 0
  };
  const fiberGap = makeComponent("space", {
    name: Math.abs(state.fiber.defocus) > EPS ? "Fiber to asphere defocus" : "Fiber to asphere",
    values: { length: design.lensDistance, n: 1 }
  });
  const asphere = makeComponent("asphere", {
    name: "Fiber collimating asphere",
    values: {
      f: state.fiber.focalLength,
      diameter: state.fiber.lensDiameter,
      na: state.fiber.lensNA,
      conic: -1
    }
  });
  const throwSpace = makeComponent("space", {
    name: "Collimated throw",
    values: { length: state.fiber.workingDistance, n: 1 }
  });
  const screen = makeComponent("screen", {
    name: "Beam check plane",
    values: { radius: Math.max(1, design.outputDiameter * 1.2, design.outputWaistRadius * 2.4) }
  });
  const bundle = [fiberGap, asphere, throwSpace, screen];
  const selectedIndex = state.components.findIndex((component) => component.id === state.selectedId);
  const insertAt = selectedIndex >= 0 ? selectedIndex + 1 : state.components.length;
  state.components.splice(insertAt, 0, ...bundle);
  state.selectedId = asphere.id;
  render();
  toast("Fiber asphere inserted");
}

function computeMetrics(trace) {
  const m = trace.matrix;
  const c = m[1][0];
  const liveRays = trace.rays.filter((ray) => ray.alive);
  const finalY = liveRays.map((ray) => ray.vec[0]);
  const finalTheta = liveRays.map((ray) => ray.vec[1]);
  const lastScreen = [...trace.components].reverse().find((item) => item.component.type === "screen");
  const screenY = lastScreen?.screenHits.map((hit) => hit.y) || finalY;
  return {
    totalRays: trace.rays.length,
    live: liveRays.length,
    det: m[0][0] * m[1][1] - m[0][1] * m[1][0],
    efl: Math.abs(c) > EPS ? -1 / c : Infinity,
    bfl: Math.abs(c) > EPS ? -m[0][0] / c : Infinity,
    ffd: Math.abs(c) > EPS ? m[1][1] / c : Infinity,
    spotRms: rms(centered(screenY)),
    spotDiameter: diameter(screenY),
    thetaRms: rms(finalTheta)
  };
}

function gaussianResult(matrix) {
  const wavelengthMm = finite(state.gaussian.wavelength, 632.8) * 1e-6;
  const waist = Math.max(0.000001, finite(state.gaussian.waist, 0.3));
  const zRayleigh = Math.PI * waist * waist / wavelengthMm;
  const qIn = { re: finite(state.gaussian.waistOffset), im: zRayleigh };
  const numerator = complexAdd(complexScale(qIn, matrix[0][0]), { re: matrix[0][1], im: 0 });
  const denominator = complexAdd(complexScale(qIn, matrix[1][0]), { re: matrix[1][1], im: 0 });
  const qOut = complexDiv(numerator, denominator);
  const invQ = complexDiv({ re: 1, im: 0 }, qOut);
  if (invQ.im >= -EPS) {
    return { ok: false, message: "Gaussian result is unstable for this matrix." };
  }
  const radius = Math.sqrt(-wavelengthMm / (Math.PI * invQ.im));
  const wavefront = Math.abs(invQ.re) < EPS ? "flat" : `${format(1 / invQ.re)} mm`;
  const waistDistance = -qOut.re;
  const waistQ = { re: 0, im: qOut.im };
  const waistRadius = Math.sqrt((wavelengthMm * Math.max(waistQ.im, 0)) / Math.PI);
  return { ok: true, radius, wavefront, waistDistance, waistRadius, outputRayleigh: Math.max(0, qOut.im) };
}

function centered(values) {
  if (!values.length) return [];
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  return values.map((value) => value - mean);
}

function rms(values) {
  if (!values.length) return 0;
  return Math.sqrt(values.reduce((sum, value) => sum + value * value, 0) / values.length);
}

function diameter(values) {
  if (!values.length) return 0;
  return Math.max(...values) - Math.min(...values);
}

function fieldHtml(scope, field, value) {
  return `
    <label class="field">
      <span>${escapeHtml(field.label)}</span>
      <div class="field-row">
        <input type="number" data-scope="${scope}" data-key="${field.key}" value="${formatInput(value)}" min="${field.min}" max="${field.max}" step="${field.step}" />
        <span class="unit">${escapeHtml(field.unit)}</span>
      </div>
    </label>
  `;
}

function coerceFieldValue(value, field) {
  let next = finite(value);
  if (Number.isFinite(field.min)) next = Math.max(field.min, next);
  if (Number.isFinite(field.max)) next = Math.min(field.max, next);
  if (Number.isInteger(field.step)) next = Math.round(next);
  return next;
}

function selectedComponent() {
  return state.components.find((component) => component.id === state.selectedId) || null;
}

function addComponent(type) {
  const component = makeComponent(type);
  const selectedIndex = state.components.findIndex((item) => item.id === state.selectedId);
  const insertAt = selectedIndex >= 0 ? selectedIndex + 1 : state.components.length;
  state.components.splice(insertAt, 0, component);
  state.selectedId = component.id;
  render();
  toast(`${componentDefs[type].label} added`);
}

function handleComponentAction(action) {
  const index = state.components.findIndex((component) => component.id === state.selectedId);
  if (index < 0) return;
  if (action === "left" && index > 0) {
    [state.components[index - 1], state.components[index]] = [state.components[index], state.components[index - 1]];
  } else if (action === "right" && index < state.components.length - 1) {
    [state.components[index + 1], state.components[index]] = [state.components[index], state.components[index + 1]];
  } else if (action === "duplicate") {
    const copy = clone(state.components[index]);
    copy.id = uid();
    copy.name = `${copy.name} copy`;
    state.components.splice(index + 1, 0, copy);
    state.selectedId = copy.id;
  } else if (action === "delete") {
    state.components.splice(index, 1);
    state.selectedId = state.components[Math.min(index, state.components.length - 1)]?.id || null;
  }
  render();
}

function adjacentGapInfo(componentId) {
  const index = state.components.findIndex((component) => component.id === componentId);
  if (index < 0) return { before: 0, after: 0 };
  const beforeComponent = state.components[index - 1];
  const afterComponent = state.components[index + 1];
  return {
    before: beforeComponent?.type === "space" ? Math.max(0, finite(beforeComponent.values.length)) : 0,
    after: afterComponent?.type === "space" ? Math.max(0, finite(afterComponent.values.length)) : 0
  };
}

function setAdjacentGap(componentId, side, length) {
  const index = state.components.findIndex((component) => component.id === componentId);
  if (index < 0) return;
  const nextLength = Math.max(0, finite(length));
  const offset = side === "before" ? -1 : 1;
  const adjacent = state.components[index + offset];
  if (adjacent?.type === "space") {
    adjacent.values.length = nextLength;
    return;
  }
  if (nextLength <= EPS) return;
  const selected = state.components[index];
  const space = makeComponent("space", {
    name: side === "before" ? `Gap before ${selected.name}` : `Gap after ${selected.name}`,
    values: { length: nextLength, n: 1 }
  });
  state.components.splice(side === "before" ? index : index + 1, 0, space);
}

function slideComponentBy(componentId, delta) {
  const index = state.components.findIndex((component) => component.id === componentId);
  if (index < 0 || state.components[index].type === "space") return;
  const gaps = adjacentGapInfo(componentId);
  if (delta > 0) {
    setAdjacentGap(componentId, "before", gaps.before + delta);
    setAdjacentGap(componentId, "after", Math.max(0, gaps.after - delta));
  } else if (delta < 0) {
    const move = Math.min(-delta, gaps.before);
    setAdjacentGap(componentId, "before", gaps.before - move);
    setAdjacentGap(componentId, "after", gaps.after + move);
  }
  state.selectedId = componentId;
  render();
}

function setComponentStart(componentId, zStart) {
  const trace = traceSystem();
  const componentData = trace.components.find((item) => item.component.id === componentId);
  if (!componentData) return;
  slideComponentBy(componentId, finite(zStart) - componentData.zStart);
}

function clientXToBenchZ(clientX, drag) {
  const svgX = ((clientX - drag.rect.left) / Math.max(1, drag.rect.width)) * SVG_W;
  const usable = SVG_W - drag.margin.left - drag.margin.right;
  const t = (svgX - drag.margin.left) / usable;
  return drag.zMin + t * (drag.zMax - drag.zMin);
}

function reorderComponent(sourceId, targetId) {
  if (!sourceId || !targetId || sourceId === targetId) return;
  const sourceIndex = state.components.findIndex((component) => component.id === sourceId);
  const targetIndex = state.components.findIndex((component) => component.id === targetId);
  if (sourceIndex < 0 || targetIndex < 0) return;
  const [component] = state.components.splice(sourceIndex, 1);
  const nextTargetIndex = state.components.findIndex((item) => item.id === targetId);
  state.components.splice(nextTargetIndex, 0, component);
  state.selectedId = sourceId;
  render();
}

function numericFieldsFor(component) {
  const passive = new Set(["conic", "na"]);
  return componentDefs[component.type].fields.filter((field) => {
    if (passive.has(field.key)) return false;
    return field.key !== "radius" || component.type !== "screen";
  });
}

function optimizerTargets() {
  return [
    { value: "screenSpot", label: "Screen Spot", meta: "smallest RMS" },
    { value: "collimate", label: "Collimate", meta: "lowest angle RMS" },
    { value: "focusDistance", label: "Focus Plane", meta: "at distance" },
    { value: "screenHeight", label: "Screen Height", meta: "match target" },
    { value: "matchDivergence", label: "Divergence", meta: "match mrad" },
    { value: "targetSpotSize", label: "Spot At Plane", meta: "match RMS" },
    { value: "rayleighRange", label: "Rayleigh", meta: "Gaussian q" }
  ];
}

function useSelectedForOptimizer() {
  const selected = selectedComponent();
  if (!selected || !numericFieldsFor(selected).length) return;
  state.optimizer.componentId = selected.id;
  const params = numericFieldsFor(selected);
  if (!params.some((field) => field.key === state.optimizer.parameter)) {
    state.optimizer.parameter = params[0].key;
  }
  centerOptimizerRange();
}

function centerOptimizerRange() {
  const component = state.components.find((item) => item.id === state.optimizer.componentId);
  if (!component || !state.optimizer.parameter) return;
  const field = optimizerField(component, state.optimizer.parameter);
  const value = finite(component.values[state.optimizer.parameter]);
  const span = Math.max(0.001, finite(state.optimizer.span, suggestOptimizerSpan(value)));
  state.optimizer.span = span;
  state.optimizer.min = clampForField(value - span / 2, field);
  state.optimizer.max = clampForField(value + span / 2, field);
  state.optimizer.lastResult = null;
  render();
}

function suggestOptimizerSpan(value) {
  const abs = Math.abs(finite(value));
  if (abs < 0.01) return 10;
  return Math.max(1, abs);
}

function runOptimizer() {
  const component = state.components.find((item) => item.id === state.optimizer.componentId);
  if (!component || !state.optimizer.parameter) {
    optimizerMessage("Select a component and numeric parameter.", "warn");
    return;
  }
  const param = state.optimizer.parameter;
  const field = optimizerField(component, param);
  let min = finite(state.optimizer.min);
  let max = finite(state.optimizer.max);
  if (max < min) [min, max] = [max, min];
  min = clampForField(min, field);
  max = clampForField(max, field);
  if (Math.abs(max - min) < EPS) {
    optimizerMessage("Search range needs width.", "warn");
    return;
  }

  const original = component.values[param];
  const originalScore = optimizerObjective(traceSystem());
  const objective = (value) => {
    component.values[param] = clampForField(value, field);
    return optimizerObjective(traceSystem());
  };

  let a = min;
  let b = max;
  const gr = (Math.sqrt(5) - 1) / 2;
  let c = b - gr * (b - a);
  let d = a + gr * (b - a);
  let fc = objective(c);
  let fd = objective(d);
  for (let i = 0; i < 70; i += 1) {
    if (fc < fd) {
      b = d;
      d = c;
      fd = fc;
      c = b - gr * (b - a);
      fc = objective(c);
    } else {
      a = c;
      c = d;
      fc = fd;
      d = a + gr * (b - a);
      fd = objective(d);
    }
  }
  const best = (a + b) / 2;
  const score = objective(best);
  if (!Number.isFinite(score)) {
    component.values[param] = original;
    optimizerMessage("No finite solution found in that range.", "warn");
    render();
    return;
  }
  const finalValue = clampForField(best, field);
  component.values[param] = finalValue;
  state.selectedId = component.id;
  state.optimizer.lastResult = {
    component: component.name,
    parameter: param,
    beforeValue: original,
    afterValue: finalValue,
    beforeScore: originalScore,
    afterScore: score
  };
  optimizerMessage(
    `${component.name}: ${param} ${format(original)} -> ${format(finalValue)}. Residual ${formatScore(originalScore)} -> ${formatScore(score)}.`,
    "good"
  );
  render();
}

function optimizerField(component, param) {
  return componentDefs[component.type].fields.find((field) => field.key === param) || null;
}

function clampForField(value, field) {
  let next = finite(value);
  if (!field) return next;
  if (Number.isFinite(field.min)) next = Math.max(field.min, next);
  if (Number.isFinite(field.max)) next = Math.min(field.max, next);
  return next;
}

function optimizerObjective(trace) {
  const liveRays = trace.rays.filter((ray) => ray.alive);
  if (!liveRays.length) return Infinity;
  if (state.optimizer.target === "collimate") {
    return rms(liveRays.map((ray) => ray.vec[1]));
  }
  if (state.optimizer.target === "matchDivergence") {
    const target = Math.max(0, finite(state.optimizer.targetDivergence)) / 1000;
    return Math.abs(rms(liveRays.map((ray) => ray.vec[1])) - target);
  }
  if (state.optimizer.target === "focusDistance") {
    const distance = finite(state.optimizer.targetDistance);
    return rms(centered(liveRays.map((ray) => ray.vec[0] + distance * ray.vec[1])));
  }
  if (state.optimizer.target === "targetSpotSize") {
    const distance = finite(state.optimizer.targetSpotDistance);
    const target = Math.max(0, finite(state.optimizer.targetSpotRadius));
    const yAtTarget = liveRays.map((ray) => ray.vec[0] + distance * ray.vec[1]);
    return Math.abs(rms(centered(yAtTarget)) - target);
  }
  if (state.optimizer.target === "rayleighRange") {
    const result = gaussianResult(trace.matrix);
    if (!result.ok || !Number.isFinite(result.outputRayleigh)) return Infinity;
    return Math.abs(result.outputRayleigh - Math.max(0, finite(state.optimizer.targetRayleigh)));
  }
  const lastScreen = [...trace.components].reverse().find((item) => item.component.type === "screen");
  const y = lastScreen?.screenHits.map((hit) => hit.y) || liveRays.map((ray) => ray.vec[0]);
  if (state.optimizer.target === "screenHeight") {
    const target = finite(state.optimizer.targetHeight);
    return rms(y.map((value) => value - target));
  }
  return rms(centered(y));
}

function optimizerMessage(message, kind) {
  el.optimizerResult.textContent = message;
  el.optimizerResult.className = `solver-result ${kind}`;
}

function formatScore(score) {
  if (!Number.isFinite(score)) return "blocked";
  const unit = state.optimizer.target === "collimate" || state.optimizer.target === "matchDivergence" ? " rad" : " mm";
  return `${format(score)}${unit}`;
}

function updateViewToggles() {
  el.showMatricesToggle.checked = Boolean(state.view.showMatrices);
  el.showGaussianToggle.checked = Boolean(state.view.showGaussian);
  el.showGridToggle.checked = Boolean(state.view.showGrid);
}

function metricHtml(label, value) {
  return `<div class="metric"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
}

function matrixLine(matrix, compact = false) {
  const precision = compact ? 3 : 5;
  return `[${format(matrix[0][0], precision)} ${format(matrix[0][1], precision)}; ${format(matrix[1][0], precision)} ${format(matrix[1][1], precision)}]`;
}

function format(value, precision = 5) {
  if (!Number.isFinite(value)) return value > 0 ? "inf" : "-inf";
  if (Math.abs(value) < 1e-10) return "0";
  const abs = Math.abs(value);
  if (abs >= 10000 || abs < 0.001) return value.toExponential(3);
  return Number(value.toPrecision(precision)).toString();
}

function formatInput(value) {
  if (!Number.isFinite(Number(value))) return "0";
  return String(Number(value));
}

function signedLength(value) {
  return Number.isFinite(value) ? `${format(value)} mm` : "collimated";
}

function clampInt(value, min, max) {
  return Math.max(min, Math.min(max, Math.round(finite(value, min))));
}

function niceStep(value) {
  const power = 10 ** Math.floor(Math.log10(Math.max(value, EPS)));
  const normalized = value / power;
  if (normalized < 1.5) return power;
  if (normalized < 3) return 2 * power;
  if (normalized < 7) return 5 * power;
  return 10 * power;
}

function complexAdd(a, b) {
  return { re: a.re + b.re, im: a.im + b.im };
}

function complexScale(a, factor) {
  return { re: a.re * factor, im: a.im * factor };
}

function complexDiv(a, b) {
  const denom = b.re * b.re + b.im * b.im;
  return {
    re: (a.re * b.re + a.im * b.im) / denom,
    im: (a.im * b.re - a.re * b.im) / denom
  };
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function toast(message) {
  const node = document.createElement("div");
  node.className = "toast";
  node.textContent = message;
  document.body.appendChild(node);
  window.setTimeout(() => node.remove(), 1800);
}

function exportBench() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "paraxial-optics-bench.json";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function importBench(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    try {
      state = normalizeState(JSON.parse(reader.result));
      render();
      toast("Bench imported");
    } catch {
      toast("Import failed");
    }
  });
  reader.readAsText(file);
}

function copyMatrix() {
  const trace = traceSystem();
  const text = matrixLine(trace.matrix);
  navigator.clipboard?.writeText(text).then(
    () => toast("Matrix copied"),
    () => toast(text)
  );
}

function bindStaticEvents() {
  document.querySelectorAll("[data-preset]").forEach((button) => {
    button.addEventListener("click", () => {
      state = presetState(button.dataset.preset);
      render();
      toast(`${button.textContent.trim()} loaded`);
    });
  });
  document.getElementById("newBenchBtn").addEventListener("click", () => {
    state = presetState("empty");
    render();
  });
  document.getElementById("clearBenchBtn").addEventListener("click", () => {
    state.components = [];
    state.selectedId = null;
    render();
  });
  document.getElementById("centerRaysBtn").addEventListener("click", () => {
    state.source.centerHeight = 0;
    state.source.chiefAngle = 0;
    render();
  });
  document.getElementById("duplicateBtn").addEventListener("click", () => handleComponentAction("duplicate"));
  document.getElementById("runOptimizerBtn").addEventListener("click", runOptimizer);
  document.getElementById("solveFiberFBtn").addEventListener("click", solveFiberFocalLength);
  document.getElementById("syncGaussianBtn").addEventListener("click", syncFiberToGaussian);
  document.getElementById("applyFiberBtn").addEventListener("click", insertFiberAsphere);
  document.getElementById("exportBtn").addEventListener("click", exportBench);
  document.getElementById("importInput").addEventListener("change", (event) => importBench(event.target.files[0]));
  document.getElementById("copyMatrixBtn").addEventListener("click", copyMatrix);
  el.showMatricesToggle.addEventListener("change", () => {
    state.view.showMatrices = el.showMatricesToggle.checked;
    render();
  });
  el.showGaussianToggle.addEventListener("change", () => {
    state.view.showGaussian = el.showGaussianToggle.checked;
    render();
  });
  el.showGridToggle.addEventListener("change", () => {
    state.view.showGrid = el.showGridToggle.checked;
    render();
  });
  window.addEventListener("pointermove", (event) => {
    if (!benchDrag) return;
    const pointerZ = clientXToBenchZ(event.clientX, benchDrag);
    setComponentStart(benchDrag.componentId, benchDrag.startZ + pointerZ - benchDrag.pointerZ);
  });
  window.addEventListener("pointerup", () => {
    if (!benchDrag) return;
    benchDrag = null;
    document.body.classList.remove("dragging-bench");
  });
  document.addEventListener("keydown", (event) => {
    if (event.target.matches("input, textarea, select")) return;
    if (event.key === "Delete" || event.key === "Backspace") {
      handleComponentAction("delete");
    }
    if (event.key === "ArrowLeft") handleComponentAction("left");
    if (event.key === "ArrowRight") handleComponentAction("right");
  });
}

bindStaticEvents();
render();
