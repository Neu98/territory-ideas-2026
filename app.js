const data = window.ALTAI_SITE_DATA;
const teams = data.teams;
const winners = teams.filter((team) => team.type === "winner");
const top30 = teams.filter((team) => team.type === "top30");
const drawableTeams = addOffsets(teams.filter((team) => team.hasMapPoint));
const municipalityGroups = createMunicipalityGroups(drawableTeams);
const teamById = new Map(teams.map((team) => [team.id, team]));

const svgNS = "http://www.w3.org/2000/svg";
const mapImageBounds = { x: 465, y: 243, width: 904, height: 627 };
const mapSvg = document.getElementById("map-svg");
const mapScreen = document.getElementById("map-screen");
const projectScreen = document.getElementById("project-screen");
const participantRegionLayer = document.getElementById("participant-region-layer");
const participantLabelLayer = document.getElementById("participant-label-layer");
const pointsLayer = document.getElementById("points-layer");
const infoCard = document.getElementById("info-card");
const districtPanel = document.getElementById("district-panel");
const districtPanelTitle = document.getElementById("district-panel-title");
const districtPanelCount = document.getElementById("district-panel-count");
const districtTeamGrid = document.getElementById("district-team-grid");
const districtPanelClose = document.getElementById("district-panel-close");
const mapEditorPanel = document.getElementById("map-editor-panel");
const downloadMapPositionsButton = document.getElementById("download-map-positions");
const resetMapPositionsButton = document.getElementById("reset-map-positions");
const mapEditorStatus = document.getElementById("map-editor-status");
const modal = document.getElementById("modal");
const modalCard = modal.querySelector(".modal-card");
const modalMedia = document.getElementById("modal-media");
const aboutModal = document.getElementById("about-modal");
const aboutButton = document.getElementById("about-button");
const aboutClose = document.getElementById("about-close");
const backButton = document.getElementById("back-button");
const homeButton = document.getElementById("home-button");
const mapWrap = document.querySelector(".map-wrap");
const ambientCanvas = document.getElementById("ambient-canvas");
const interactionHint = document.getElementById("interaction-hint");
const carousel = document.getElementById("project-carousel");
const carouselStage = document.getElementById("carousel-stage");
const carouselCaption = document.getElementById("carousel-caption");
const carouselDots = document.getElementById("carousel-dots");
const carouselPrev = document.getElementById("carousel-prev");
const carouselNext = document.getElementById("carousel-next");
const filterButtons = document.querySelectorAll("[data-filter]");

const allCoordinates = flattenCoordinates(window.ALTAI_GEOJSON.features[0].geometry.coordinates);
const geoBounds = getBounds(allCoordinates);
const mapSetupMode = new URLSearchParams(window.location.search).has("setup-map");
const mapPositionStorageKey = "altai-ideas-map-positions-v1";
const mapLabelPositionStorageKey = "altai-ideas-map-label-positions-v1";
const fixedClusterPositions = {
  "алтайский район": { x: 1196.12, y: 676.37 },
  "бийский район": { x: 1192.22, y: 513.25 },
  "благовещенский район": { x: 658.95, y: 509.89 },
  "г. барнаул": { x: 1019.54, y: 418.62 },
  "г. бийск": { x: 1126.33, y: 541.09 },
  "г. камень-на-оби": { x: 807.47, y: 374.86 },
  "г. новоалтайск": { x: 1086.18, y: 426.41 },
  "г. рубцовск": { x: 741.71, y: 755.33 },
  "г. славгород": { x: 524.42, y: 475.18 },
  "г. славгород, с. пригородное": { x: 579.24, y: 452.95 },
  "крутихинский район": { x: 758.16, y: 314.26 },
  "курьинский район": { x: 889.24, y: 716.51 },
  "локтевский район": { x: 812.49, y: 812.18 },
  "первомайский район": { x: 1059.95, y: 371.1 },
  "поспелихинский район": { x: 843.59, y: 673.74 },
  "рубцовский район": { x: 804.24, y: 737.04 },
  "смоленский район": { x: 1162.48, y: 603.95 },
  "солонешенский район": { x: 1111.51, y: 706.6 },
  "суетский район": { x: 661.62, y: 441.36 },
  "топчихинский район": { x: 979.1, y: 529.82 },
  "угловский район": { x: 663.71, y: 764.21 },
  "чарышский район": { x: 1031.35, y: 783.52 }
};

const fixedLabelPositions = {
  "алтайский район": { x: 1284.53, y: 707.54 },
  "бийский район": { x: 1276.48, y: 509.09 },
  "благовещенский район": { x: 777.07, y: 500.53 },
  "г. барнаул": { x: 979.91, y: 462.36 },
  "г. бийск": { x: 1219.62, y: 562.09 },
  "г. камень-на-оби": { x: 902.47, y: 342.26 },
  "г. новоалтайск": { x: 1190.34, y: 419.21 },
  "г. рубцовск": { x: 686.84, y: 715.05 },
  "г. славгород": { x: 546.58, y: 524.36 },
  "г. славгород, с. пригородное": { x: 456.3, y: 418.77 },
  "крутихинский район": { x: 653.72, y: 318.66 },
  "курьинский район": { x: 959.7, y: 693.46 },
  "локтевский район": { x: 903.38, y: 822.25 },
  "первомайский район": { x: 1163.75, y: 352.58 },
  "поспелихинский район": { x: 848.17, y: 620.55 },
  "рубцовский район": { x: 761.44, y: 683.53 },
  "смоленский район": { x: 1251.48, y: 616.47 },
  "солонешенский район": { x: 1167.25, y: 760.43 },
  "суетский район": { x: 599.95, y: 391.73 },
  "топчихинский район": { x: 977.8, y: 589.7 },
  "угловский район": { x: 585, y: 814.08 },
  "чарышский район": { x: 1108.48, y: 829.03 }
};

let activeScreen = "map";
let selectedMunicipalityKey = null;
let flippedParticipantCard = null;
let activeTeamFilter = "all";
let idleTimer = null;
let manualClusterPositions = mapSetupMode ? loadManualClusterPositions() : {};
let manualLabelPositions = mapSetupMode ? loadManualLabelPositions() : {};
const dragClusterState = {
  key: null,
  pointerId: null,
  startX: 0,
  startY: 0,
  originX: 0,
  originY: 0,
  moved: false
};
const dragLabelState = {
  key: null,
  pointerId: null,
  startX: 0,
  startY: 0,
  originX: 0,
  originY: 0
};
const ribbonState = {
  startIndexByKey: new Map(),
  activeKey: null,
  pointerId: null,
  startX: 0,
  dragX: 0,
  suppressClickUntil: 0
};
const carouselState = {
  slides: [],
  active: 0,
  dragX: 0,
  dragY: 0,
  pointerX: 0,
  pointerY: 0,
  startX: 0,
  startY: 0,
  pointerId: null,
  isDragging: false
};
const mapViewportState = {
  scale: 1,
  x: 0,
  y: 0,
  pointers: new Map(),
  startScale: 1,
  startDistance: 0,
  startMidpoint: null,
  panPointerId: null,
  panStart: null,
  frame: 0,
  suppressClickUntil: 0
};

const clusterOffsets = {
  "бийский район": [36, 24],
  "г. бийск": [-28, -18],
  "г. барнаул": [-22, -14],
  "г. новоалтайск": [24, 0],
  "г. рубцовск": [-26, -8],
  "рубцовский район": [30, 18],
  "г. славгород": [-18, -18],
  "г. славгород, с. пригородное": [24, 14],
  "первомайский район": [30, 20]
};

const labelOffsets = {
  "алтайский район": [116, 48],
  "бийский район": [136, 92],
  "благовещенский район": [-126, -8],
  "г. барнаул": [-142, -8],
  "г. бийск": [38, -118],
  "г. камень-на-оби": [60, -62],
  "г. новоалтайск": [-52, -112],
  "г. рубцовск": [-116, -6],
  "г. славгород": [-82, -64],
  "г. славгород, с. пригородное": [80, 60],
  "крутихинский район": [-86, -52],
  "курьинский район": [92, -10],
  "локтевский район": [92, 46],
  "первомайский район": [122, 64],
  "поспелихинский район": [-72, -88],
  "рубцовский район": [-10, -104],
  "смоленский район": [-70, 88],
  "солонешенский район": [-70, 84],
  "суетский район": [-82, 42],
  "топчихинский район": [-126, -74],
  "угловский район": [-96, 76],
  "чарышский район": [92, 84]
};

const labelLines = {
  "алтайский район": ["Алтайский", "район"],
  "бийский район": ["Бийский", "район"],
  "благовещенский район": ["Благовещенский", "район"],
  "г. барнаул": ["Барнаул"],
  "г. бийск": ["Бийск"],
  "г. камень-на-оби": ["Камень-на-Оби"],
  "г. новоалтайск": ["Новоалтайск"],
  "г. рубцовск": ["Рубцовск"],
  "г. славгород": ["Славгород"],
  "г. славгород, с. пригородное": ["Славгород", "с. Пригородное"],
  "крутихинский район": ["Крутихинский", "район"],
  "курьинский район": ["Курьинский", "район"],
  "локтевский район": ["Локтевский", "район"],
  "первомайский район": ["Первомайский", "район"],
  "поспелихинский район": ["Поспелихинский", "район"],
  "рубцовский район": ["Рубцовский", "район"],
  "смоленский район": ["Смоленский", "район"],
  "солонешенский район": ["Солонешенский", "район"],
  "суетский район": ["Суетский", "район"],
  "топчихинский район": ["Топчихинский", "район"],
  "угловский район": ["Угловский", "район"],
  "чарышский район": ["Чарышский", "район"]
};

function flattenCoordinates(coordinates) {
  const flat = [];
  const walk = (items) => {
    if (typeof items[0] === "number") {
      flat.push(items);
      return;
    }
    items.forEach(walk);
  };
  walk(coordinates);
  return flat;
}

function getBounds(coordinates) {
  return coordinates.reduce(
    (acc, point) => ({
      minLon: Math.min(acc.minLon, point[0]),
      maxLon: Math.max(acc.maxLon, point[0]),
      minLat: Math.min(acc.minLat, point[1]),
      maxLat: Math.max(acc.maxLat, point[1])
    }),
    { minLon: Infinity, maxLon: -Infinity, minLat: Infinity, maxLat: -Infinity }
  );
}

function projectPoint(lon, lat, offset = [0, 0]) {
  const x = mapImageBounds.x + ((lon - geoBounds.minLon) / (geoBounds.maxLon - geoBounds.minLon)) * mapImageBounds.width;
  const y = mapImageBounds.y + ((geoBounds.maxLat - lat) / (geoBounds.maxLat - geoBounds.minLat)) * mapImageBounds.height;
  return { x: x + offset[0], y: y + offset[1] };
}

function getClusterPosition(group) {
  const saved = manualClusterPositions[group.key];
  if (saved && Number.isFinite(saved.x) && Number.isFinite(saved.y)) {
    return { x: saved.x, y: saved.y };
  }
  const fixed = fixedClusterPositions[group.key];
  if (fixed && Number.isFinite(fixed.x) && Number.isFinite(fixed.y)) {
    return { x: fixed.x, y: fixed.y };
  }
  return projectPoint(group.lon, group.lat, clusterOffsets[group.key] || [0, 0]);
}

function loadManualClusterPositions() {
  try {
    return JSON.parse(localStorage.getItem(mapPositionStorageKey) || "{}") || {};
  } catch {
    return {};
  }
}

function saveManualClusterPositions() {
  localStorage.setItem(mapPositionStorageKey, JSON.stringify(manualClusterPositions));
}

function loadManualLabelPositions() {
  try {
    return JSON.parse(localStorage.getItem(mapLabelPositionStorageKey) || "{}") || {};
  } catch {
    return {};
  }
}

function saveManualLabelPositions() {
  localStorage.setItem(mapLabelPositionStorageKey, JSON.stringify(manualLabelPositions));
}

function getLabelPosition(group) {
  const saved = manualLabelPositions[group.key];
  if (saved && Number.isFinite(saved.x) && Number.isFinite(saved.y)) {
    return { x: saved.x, y: saved.y };
  }
  const fixed = fixedLabelPositions[group.key];
  if (fixed && Number.isFinite(fixed.x) && Number.isFinite(fixed.y)) {
    return { x: fixed.x, y: fixed.y };
  }
  return projectPoint(group.lon, group.lat, labelOffsets[group.key] || [0, 0]);
}

function clientToSvgPoint(event) {
  const point = mapSvg.createSVGPoint();
  point.x = event.clientX;
  point.y = event.clientY;
  return point.matrixTransform(mapSvg.getScreenCTM().inverse());
}

function clampMapPoint(point) {
  return {
    x: clampNumber(point.x, 320, 1680),
    y: clampNumber(point.y, 250, 920)
  };
}

function addOffsets(items) {
  const groups = new Map();
  return items.map((item) => {
    const key = `${item.lon.toFixed(2)}:${item.lat.toFixed(2)}`;
    const index = groups.get(key) || 0;
    groups.set(key, index + 1);
    return { ...item, offset: scatterOffset(index) };
  });
}

function scatterOffset(index) {
  if (index === 0) {
    return [0, 0];
  }
  const angle = (index * 137.5 * Math.PI) / 180;
  const radius = 26 + Math.floor(index / 7) * 12;
  return [Math.round(Math.cos(angle) * radius), Math.round(Math.sin(angle) * radius)];
}

function normalizeMunicipality(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .replace("г.барнаул", "г. Барнаул")
    .trim()
    .toLowerCase();
}

function normalizeDisplayMunicipality(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .replace("г.барнаул", "г. Барнаул")
    .trim();
}

function createMunicipalityGroups(items) {
  const groups = new Map();

  items.forEach((team) => {
    const key = normalizeMunicipality(team.municipality);
    const existing = groups.get(key);
    if (existing) {
      existing.teams.push(team);
      return;
    }

    groups.set(key, {
      key,
      name: normalizeDisplayMunicipality(team.municipality),
      lon: team.lon,
      lat: team.lat,
      teams: [team]
    });
  });

  return [...groups.values()]
    .map((group) => ({
      ...group,
      count: group.teams.length,
      hasWinner: group.teams.some((team) => team.type === "winner"),
      hasTop30: group.teams.some((team) => team.type === "top30")
    }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "ru"));
}

function teamMatchesActiveFilter(team) {
  return activeTeamFilter === "all" || team.type === activeTeamFilter;
}

function getFilteredGroup(group) {
  const filteredTeams = group.teams.filter(teamMatchesActiveFilter);
  return {
    ...group,
    teams: filteredTeams,
    count: filteredTeams.length,
    hasWinner: filteredTeams.some((team) => team.type === "winner"),
    hasTop30: filteredTeams.some((team) => team.type === "top30"),
    hasParticipant: filteredTeams.some((team) => team.type === "participant")
  };
}

function getVisibleMunicipalityGroups() {
  return municipalityGroups
    .map(getFilteredGroup)
    .filter((group) => group.count > 0);
}

function getVisibleMunicipalityGroup(key) {
  const group = municipalityGroups.find((item) => item.key === key);
  if (!group) {
    return null;
  }
  const filtered = getFilteredGroup(group);
  return filtered.count > 0 ? filtered : null;
}

function svgElement(name, attributes = {}) {
  const element = document.createElementNS(svgNS, name);
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
  return element;
}

function textElement(tag, text, className) {
  const element = document.createElement(tag);
  if (className) {
    element.className = className;
  }
  element.textContent = text || "";
  return element;
}

function initAmbientBackground() {
  if (!ambientCanvas || !mapWrap || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  const context = ambientCanvas.getContext("2d");
  const colors = [
    { r: 0, g: 125, b: 177 },
    { r: 228, g: 81, b: 142 },
    { r: 188, g: 207, b: 0 },
    { r: 245, g: 240, b: 224 }
  ];
  const pointer = { x: -1000, y: -1000, activeUntil: 0 };
  const particles = [];
  const pulses = [];
  let width = 0;
  let height = 0;
  let pixelRatio = 1;

  function resizeCanvas() {
    const rect = mapWrap.getBoundingClientRect();
    width = Math.max(1, Math.round(rect.width));
    height = Math.max(1, Math.round(rect.height));
    pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    ambientCanvas.width = Math.round(width * pixelRatio);
    ambientCanvas.height = Math.round(height * pixelRatio);
    ambientCanvas.style.width = `${width}px`;
    ambientCanvas.style.height = `${height}px`;
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    seedParticles();
  }

  function seedParticles() {
    const targetCount = Math.round(Math.min(96, Math.max(48, (width * height) / 18000)));
    particles.length = 0;

    for (let index = 0; index < targetCount; index++) {
      const color = colors[index % colors.length];
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.26,
        vy: (Math.random() - 0.5) * 0.26,
        size: Math.random() * 1.8 + 1.1,
        color
      });
    }
  }

  function localPoint(event) {
    const rect = mapWrap.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  }

  function addPulse(event) {
    const point = localPoint(event);
    pointer.x = point.x;
    pointer.y = point.y;
    pointer.activeUntil = performance.now() + 1100;
    pulses.push({ ...point, startedAt: performance.now() });
    hideInteractionHint();
  }

  function updatePointer(event) {
    const point = localPoint(event);
    pointer.x = point.x;
    pointer.y = point.y;
    pointer.activeUntil = performance.now() + 260;
  }

  function moveParticles(now) {
    const pointerActive = now < pointer.activeUntil;

    particles.forEach((particle) => {
      if (pointerActive) {
        const dx = particle.x - pointer.x;
        const dy = particle.y - pointer.y;
        const distance = Math.hypot(dx, dy) || 1;
        if (distance < 170) {
          const force = (1 - distance / 170) * 1.45;
          particle.x += (dx / distance) * force;
          particle.y += (dy / distance) * force;
        }
      }

      particle.x += particle.vx;
      particle.y += particle.vy;

      if (particle.x < -20) {
        particle.x = width + 20;
      } else if (particle.x > width + 20) {
        particle.x = -20;
      }

      if (particle.y < -20) {
        particle.y = height + 20;
      } else if (particle.y > height + 20) {
        particle.y = -20;
      }
    });
  }

  function drawGrid(now) {
    const offset = (now * 0.018) % 90;
    context.lineWidth = 1;

    for (let x = -90 + offset; x < width + 90; x += 90) {
      context.strokeStyle = "rgba(245, 240, 224, 0.08)";
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x + height * 0.42, height);
      context.stroke();
    }

    const scanX = ((now * 0.055) % (width + 420)) - 220;
    const gradient = context.createLinearGradient(scanX - 80, 0, scanX + 210, height);
    gradient.addColorStop(0, "rgba(0, 125, 177, 0)");
    gradient.addColorStop(0.48, "rgba(245, 240, 224, 0.18)");
    gradient.addColorStop(1, "rgba(228, 81, 142, 0)");
    context.strokeStyle = gradient;
    context.lineWidth = 3;
    context.beginPath();
    context.moveTo(scanX, 0);
    context.lineTo(scanX + height * 0.62, height);
    context.stroke();
  }

  function drawConnections() {
    for (let index = 0; index < particles.length; index++) {
      const first = particles[index];
      for (let nextIndex = index + 1; nextIndex < particles.length; nextIndex++) {
        const second = particles[nextIndex];
        const dx = first.x - second.x;
        const dy = first.y - second.y;
        const distance = Math.hypot(dx, dy);

        if (distance > 138) {
          continue;
        }

        const alpha = (1 - distance / 138) * 0.22;
        context.strokeStyle = `rgba(245, 240, 224, ${alpha.toFixed(3)})`;
        context.lineWidth = 1;
        context.beginPath();
        context.moveTo(first.x, first.y);
        context.lineTo(second.x, second.y);
        context.stroke();
      }
    }
  }

  function drawParticles() {
    particles.forEach((particle) => {
      context.fillStyle = `rgba(${particle.color.r}, ${particle.color.g}, ${particle.color.b}, 0.78)`;
      context.beginPath();
      context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      context.fill();
    });
  }

  function drawPulses(now) {
    for (let index = pulses.length - 1; index >= 0; index--) {
      const pulse = pulses[index];
      const age = Math.max(0, (now - pulse.startedAt) / 1000);
      const alpha = Math.max(0, 1 - age / 1.2);
      const radius = Math.max(1, age * 430);

      if (alpha <= 0) {
        pulses.splice(index, 1);
        continue;
      }

      const gradient = context.createRadialGradient(pulse.x, pulse.y, 0, pulse.x, pulse.y, radius);
      gradient.addColorStop(0, `rgba(245, 240, 224, ${(alpha * 0.2).toFixed(3)})`);
      gradient.addColorStop(0.2, `rgba(188, 207, 0, ${(alpha * 0.14).toFixed(3)})`);
      gradient.addColorStop(0.64, `rgba(0, 125, 177, ${(alpha * 0.12).toFixed(3)})`);
      gradient.addColorStop(1, "rgba(0, 125, 177, 0)");
      context.fillStyle = gradient;
      context.beginPath();
      context.arc(pulse.x, pulse.y, radius, 0, Math.PI * 2);
      context.fill();

      context.strokeStyle = `rgba(245, 240, 224, ${(alpha * 0.58).toFixed(3)})`;
      context.lineWidth = 2;
      context.beginPath();
      context.arc(pulse.x, pulse.y, radius * 0.38, 0, Math.PI * 2);
      context.stroke();
    }
  }

  function animate(now) {
    context.clearRect(0, 0, width, height);
    moveParticles(now);
    drawGrid(now);
    drawConnections();
    drawParticles();
    drawPulses(now);
    requestAnimationFrame(animate);
  }

  resizeCanvas();
  mapWrap.addEventListener("pointerdown", addPulse, { passive: true });
  mapWrap.addEventListener("pointermove", updatePointer, { passive: true });
  window.addEventListener("resize", resizeCanvas);
  requestAnimationFrame(animate);
}

function hideInteractionHint() {
  return;
}

function renderParticipantLabels() {
  participantLabelLayer.replaceChildren();

  getVisibleMunicipalityGroups()
    .sort((a, b) => a.count - b.count || b.name.localeCompare(a.name, "ru"))
    .forEach((group, index) => {
      const position = getLabelPosition(group);
      const lines = labelLines[group.key] || makeLabelLines(group.name);
      const box = getLabelBox(lines);
      const classes = [
        "participant-label",
        group.hasWinner ? "has-winner" : "",
        group.hasTop30 ? "has-top30" : "",
        group.key.startsWith("г.") ? "is-city" : ""
      ]
        .filter(Boolean)
        .join(" ");

      const label = svgElement("g", {
        class: classes,
        transform: `translate(${position.x.toFixed(2)} ${position.y.toFixed(2)})`,
        style: `animation-delay: ${Math.min(index * 18, 360)}ms`
      });

      label.append(
        svgElement("rect", {
          class: "participant-label-bg",
          x: (-box.width / 2).toFixed(2),
          y: (-box.height / 2).toFixed(2),
          width: box.width,
          height: box.height,
          rx: 8
        }),
        svgElement("circle", { class: "participant-label-dot", cx: (-box.width / 2 + 14).toFixed(2), cy: (-box.height / 2 + 14).toFixed(2), r: 6 })
      );

      const nameText = svgElement("text", {
        class: "participant-label-name",
        "text-anchor": "middle",
        x: 0,
        y: lines.length > 1 ? -7 : 5
      });
      lines.forEach((line, lineIndex) => {
        const tspan = svgElement("tspan", {
          x: 0,
          dy: lineIndex === 0 ? 0 : 17
        });
        tspan.textContent = line;
        nameText.appendChild(tspan);
      });

      label.appendChild(nameText);
      if (mapSetupMode) {
        attachLabelDrag(label, group);
      }
      participantLabelLayer.appendChild(label);
    });
}

function attachLabelDrag(label, group) {
  label.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    event.stopPropagation();
    const point = clientToSvgPoint(event);
    const origin = getLabelPosition(group);
    dragLabelState.key = group.key;
    dragLabelState.pointerId = event.pointerId;
    dragLabelState.startX = point.x;
    dragLabelState.startY = point.y;
    dragLabelState.originX = origin.x;
    dragLabelState.originY = origin.y;
    label.classList.add("is-dragging");
    label.setPointerCapture?.(event.pointerId);
    setMapEditorStatus(`Перемещаем подпись: ${group.name}`);
  });

  label.addEventListener("pointermove", (event) => {
    if (dragLabelState.pointerId !== event.pointerId || dragLabelState.key !== group.key) return;
    event.preventDefault();
    event.stopPropagation();
    const point = clientToSvgPoint(event);
    const next = clampMapPoint({
      x: dragLabelState.originX + point.x - dragLabelState.startX,
      y: dragLabelState.originY + point.y - dragLabelState.startY
    });
    manualLabelPositions[group.key] = next;
    label.setAttribute("transform", `translate(${next.x.toFixed(2)} ${next.y.toFixed(2)})`);
  });

  const finish = (event) => {
    if (dragLabelState.pointerId !== event.pointerId || dragLabelState.key !== group.key) return;
    label.releasePointerCapture?.(event.pointerId);
    label.classList.remove("is-dragging");
    dragLabelState.pointerId = null;
    dragLabelState.key = null;
    saveManualLabelPositions();
    setMapEditorStatus(`Сохранена подпись: ${group.name}`);
  };
  label.addEventListener("pointerup", finish);
  label.addEventListener("pointercancel", finish);
}

function renderParticipantRegionHighlights() {
  participantRegionLayer.replaceChildren();

  getVisibleMunicipalityGroups()
    .sort((a, b) => a.count - b.count || a.name.localeCompare(b.name, "ru"))
    .forEach((group, index) => {
      const position = getClusterPosition(group);
      const size = getRegionHighlightSize(group);
      const classes = [
        "region-highlight",
        group.hasWinner ? "has-winner" : "",
        group.hasTop30 ? "has-top30" : "",
        group.key.startsWith("г.") ? "is-city" : ""
      ]
        .filter(Boolean)
        .join(" ");
      const highlight = svgElement("g", {
        class: classes,
        transform: `translate(${position.x.toFixed(2)} ${position.y.toFixed(2)})`,
        style: `animation-delay: ${Math.min(index * 24, 520)}ms`
      });

      highlight.append(
        svgElement("ellipse", {
          class: "region-highlight-glow",
          cx: 0,
          cy: 0,
          rx: size.rx + 18,
          ry: size.ry + 14
        }),
        svgElement("ellipse", {
          class: "region-highlight-fill",
          cx: 0,
          cy: 0,
          rx: size.rx,
          ry: size.ry
        })
      );
      participantRegionLayer.appendChild(highlight);
    });
}

function getRegionHighlightSize(group) {
  const base = group.key.startsWith("г.") ? 54 : 76;
  const countBoost = Math.min(54, group.count * 7);
  const wideDistricts = new Set([
    "благовещенский район",
    "угловский район",
    "курьинский район",
    "чарышский район",
    "алтайский район",
    "солонешенский район",
    "локтевский район"
  ]);
  const rx = base + countBoost + (wideDistricts.has(group.key) ? 28 : 0);
  const ry = (base + countBoost) * (group.key.startsWith("г.") ? 0.72 : 0.82);
  return { rx, ry };
}

function makeLabelLines(name) {
  const cleaned = normalizeDisplayMunicipality(name);
  if (cleaned.includes("район")) {
    return [cleaned.replace(/\s*район$/i, ""), "район"];
  }
  return [cleaned.replace(/^г\.\s*/i, "")];
}

function getLabelBox(lines) {
  const longest = Math.max(...lines.map((line) => line.length));
  return {
    width: Math.max(92, Math.min(196, longest * 10 + 28)),
    height: lines.length > 1 ? 52 : 34
  };
}

function pluralizeTeams(count) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) {
    return "команда";
  }
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return "команды";
  }
  return "команд";
}

function geometryToPath(geometry) {
  if (geometry.type === "Polygon") {
    return polygonToPath(geometry.coordinates);
  }
  return geometry.coordinates.map(polygonToPath).join(" ");
}

function polygonToPath(rings) {
  return rings
    .map((ring) => {
      const commands = ring.map(([lon, lat], index) => {
        const point = projectPoint(lon, lat);
        return `${index === 0 ? "M" : "L"}${point.x.toFixed(2)} ${point.y.toFixed(2)}`;
      });
      return `${commands.join(" ")} Z`;
    })
    .join(" ");
}

function renderPoints() {
  pointsLayer.replaceChildren();
  clearMarkerClips();

  getVisibleMunicipalityGroups()
    .sort((a, b) => {
      if (a.key === selectedMunicipalityKey) {
        return 1;
      }
      if (b.key === selectedMunicipalityKey) {
        return -1;
      }
      return a.count - b.count || b.name.localeCompare(a.name, "ru");
    })
    .forEach(renderMunicipalityGroup);
}

function renderMunicipalityGroup(group) {
  const position = getClusterPosition(group);
  const isSelected = group.key === selectedMunicipalityKey;
  const radius = Math.min(42, 22 + group.count * 1.8);
  const classes = [
    "municipality-cluster",
    group.hasWinner ? "has-winner" : "",
    group.hasTop30 ? "has-top30" : "",
    group.key.startsWith("г.") ? "is-city" : "",
    isSelected ? "is-selected" : "",
    mapSetupMode ? "is-map-setup" : ""
  ]
    .filter(Boolean)
    .join(" ");
  const cluster = svgElement("g", {
    class: classes,
    transform: `translate(${position.x.toFixed(2)} ${position.y.toFixed(2)})`,
    tabindex: "0",
    role: "button",
    "aria-label": `${group.name}. Команд: ${group.count}`
  });

  cluster.append(
    svgElement("circle", { class: "cluster-glow", r: radius + 10 }),
    svgElement("circle", { class: "cluster-body", r: radius }),
    svgElement("text", { class: "cluster-count", "text-anchor": "middle", "dominant-baseline": "central" })
  );
  cluster.querySelector(".cluster-count").textContent = group.count;

  cluster.addEventListener("click", (event) => {
    event.stopPropagation();
    if (mapSetupMode || dragClusterState.moved || Date.now() < mapViewportState.suppressClickUntil) {
      dragClusterState.moved = false;
      return;
    }
    if (isSelected) {
      closeDistrictPanel();
      return;
    }
    openDistrictPanel(group);
  });
  cluster.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      cluster.dispatchEvent(new Event("click"));
    }
  });
  if (mapSetupMode) {
    attachClusterDrag(cluster, group);
  }
  pointsLayer.appendChild(cluster);
}

function attachClusterDrag(cluster, group) {
  cluster.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    event.stopPropagation();
    const point = clientToSvgPoint(event);
    const origin = getClusterPosition(group);
    dragClusterState.key = group.key;
    dragClusterState.pointerId = event.pointerId;
    dragClusterState.startX = point.x;
    dragClusterState.startY = point.y;
    dragClusterState.originX = origin.x;
    dragClusterState.originY = origin.y;
    dragClusterState.moved = false;
    cluster.classList.add("is-dragging");
    cluster.setPointerCapture?.(event.pointerId);
    setMapEditorStatus(`Перемещаем: ${group.name}`);
  });

  cluster.addEventListener("pointermove", (event) => {
    if (dragClusterState.pointerId !== event.pointerId || dragClusterState.key !== group.key) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    const point = clientToSvgPoint(event);
    const next = clampMapPoint({
      x: dragClusterState.originX + point.x - dragClusterState.startX,
      y: dragClusterState.originY + point.y - dragClusterState.startY
    });
    manualClusterPositions[group.key] = next;
    dragClusterState.moved = true;
    cluster.setAttribute("transform", `translate(${next.x.toFixed(2)} ${next.y.toFixed(2)})`);
  });

  cluster.addEventListener("pointerup", (event) => finishClusterDrag(event, cluster, group));
  cluster.addEventListener("pointercancel", (event) => finishClusterDrag(event, cluster, group));
}

function finishClusterDrag(event, cluster, group) {
  if (dragClusterState.pointerId !== event.pointerId || dragClusterState.key !== group.key) {
    return;
  }
  cluster.releasePointerCapture?.(event.pointerId);
  cluster.classList.remove("is-dragging");
  dragClusterState.pointerId = null;
  dragClusterState.key = null;
  saveManualClusterPositions();
  setMapEditorStatus(`Сохранено: ${group.name}`);
}

function openDistrictPanel(group) {
  resetMapViewport();
  selectedMunicipalityKey = group.key;
  flippedParticipantCard = null;
  closeModal();
  closeInfo();
  renderPoints();
  renderDistrictPanel(group);
  mapWrap.classList.add("has-district-panel");
  districtPanel.hidden = false;
  districtPanel.classList.remove("is-closing");
  districtPanel.classList.add("is-open");
  updateNav();
}

function closeDistrictPanel() {
  selectedMunicipalityKey = null;
  flippedParticipantCard = null;
  mapWrap.classList.remove("has-district-panel");
  districtPanel.classList.remove("is-open");
  districtPanel.hidden = true;
  districtTeamGrid.replaceChildren();
  renderPoints();
  updateNav();
}

function renderDistrictPanel(group) {
  const visibleGroup = getVisibleMunicipalityGroup(group.key) || { ...group, teams: [], count: 0 };
  districtPanelTitle.textContent = visibleGroup.name;
  districtPanelCount.textContent = `${visibleGroup.count} ${pluralizeTeams(visibleGroup.count)}`;
  districtTeamGrid.replaceChildren();

  sortTeamsForRibbon(visibleGroup.teams).forEach((team) => {
    districtTeamGrid.appendChild(renderDistrictTeamTile(team));
  });
}

function renderDistrictTeamTile(team) {
  if (team.type === "participant") {
    return renderParticipantFlipTile(team);
  }

  const button = document.createElement("button");
  button.type = "button";
  button.className = `district-team-tile ${team.type}`;
  button.dataset.teamId = team.id;
  button.append(
    renderTileVisual(team),
    renderTileText(team)
  );
  button.addEventListener("click", () => {
    if (team.type === "winner") {
      showProject(team.id);
      return;
    }
    showModal(team, button.getBoundingClientRect());
  });
  return button;
}

function renderParticipantFlipTile(team) {
  const card = document.createElement("button");
  card.type = "button";
  card.className = "district-team-tile participant flip-card";
  card.dataset.teamId = team.id;
  card.setAttribute("aria-label", `${team.teamLabel}. Нажмите, чтобы перевернуть карточку`);

  const inner = document.createElement("span");
  inner.className = "flip-card-inner";

  const front = document.createElement("span");
  front.className = "flip-card-face flip-card-front";
  front.append(renderTileText(team));

  const back = document.createElement("span");
  back.className = "flip-card-face flip-card-back";
  back.append(
    textElement("strong", "Идея"),
    textElement("span", compactText(team.idea_short || getShortIdea(team, 3), 360), "flip-idea")
  );

  inner.append(front, back);
  card.appendChild(inner);
  card.addEventListener("click", (event) => {
    event.stopPropagation();
    if (flippedParticipantCard && flippedParticipantCard !== card) {
      flippedParticipantCard.classList.remove("is-flipped");
    }
    card.classList.toggle("is-flipped");
    flippedParticipantCard = card.classList.contains("is-flipped") ? card : null;
  });
  return card;
}

function renderTileVisual(team) {
  const visual = document.createElement("span");
  visual.className = "tile-visual";
  if (team.images?.thumb) {
    const image = document.createElement("img");
    image.src = team.images.thumb;
    image.alt = "";
    image.draggable = false;
    visual.appendChild(image);
  }
  return visual;
}

function renderTileText(team) {
  const text = document.createElement("span");
  text.className = "tile-text";
  text.append(
    textElement("strong", `№${team.rank}. ${team.team}`),
    textElement("span", team.title),
    textElement("small", team.organization || team.municipality)
  );
  return text;
}

function getShortIdea(team, maxSentences = 3) {
  const source = team.idea || team.short || "Описание идеи будет добавлено после загрузки материалов проекта.";
  const sentences = source.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [source];
  return sentences.slice(0, maxSentences).join(" ").trim();
}

function compactText(value, maxLength = 260) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (text.length <= maxLength) {
    return text;
  }
  const clipped = text.slice(0, maxLength - 1).trim();
  return `${clipped.slice(0, clipped.lastIndexOf(" ") > 140 ? clipped.lastIndexOf(" ") : clipped.length)}…`;
}

function renderTeamRibbon(group) {
  const anchor = projectPoint(group.lon, group.lat, clusterOffsets[group.key] || [0, 0]);
  const teamsList = sortTeamsForRibbon(group.teams);
  const visibleCount = Math.min(teamsList.length, 8);
  const maxStart = Math.max(0, teamsList.length - visibleCount);
  const startIndex = clampNumber(ribbonState.startIndexByKey.get(group.key) || 0, 0, maxStart);
  ribbonState.startIndexByKey.set(group.key, startIndex);

  const visibleTeams = teamsList.slice(startIndex, startIndex + visibleCount);
  const direction = anchor.x > 1110 ? -1 : 1;
  const rail = getRibbonLayout(anchor, visibleTeams.length, direction);
  const ribbon = svgElement("g", {
    class: `team-ribbon ${direction < 0 ? "opens-left" : "opens-right"}`,
    "aria-label": `${group.name}. Команды района`,
    role: "group"
  });
  ribbon.addEventListener("click", (event) => event.stopPropagation());
  const pathD = `M ${anchor.x.toFixed(2)} ${anchor.y.toFixed(2)} C ${(anchor.x + direction * 36).toFixed(2)} ${anchor.y.toFixed(2)}, ${(rail.firstX - direction * 38).toFixed(2)} ${rail.y.toFixed(2)}, ${rail.firstX.toFixed(2)} ${rail.y.toFixed(2)}`;

  ribbon.appendChild(svgElement("path", { class: "ribbon-connector", d: pathD }));
  ribbon.appendChild(
    svgElement("rect", {
      class: "ribbon-track",
      x: rail.trackX,
      y: rail.y - 54,
      width: rail.trackWidth,
      height: 108,
      rx: 8
    })
  );

  if (teamsList.length > visibleCount) {
    ribbon.appendChild(renderRibbonNav(group, "prev", rail, startIndex > 0));
    ribbon.appendChild(renderRibbonNav(group, "next", rail, startIndex < maxStart));
  }

  const items = svgElement("g", { class: "ribbon-items" });
  const dragOffset = ribbonState.activeKey === group.key ? ribbonState.dragX * 0.34 : 0;
  items.setAttribute("transform", `translate(${dragOffset.toFixed(2)} 0)`);

  visibleTeams.forEach((team, index) => {
    const point = {
      x: rail.firstX + direction * rail.step * index,
      y: rail.y + (index % 2 === 1 && visibleTeams.length > 5 ? 8 : 0)
    };
    items.appendChild(renderRibbonItem(team, point, anchor, index));
  });

  ribbon.appendChild(items);
  attachRibbonDragHandlers(ribbon, items, group, maxStart);
  pointsLayer.appendChild(ribbon);
}

function sortTeamsForRibbon(items) {
  const typeOrder = { winner: 1, top30: 2, participant: 3 };
  return [...items].sort((a, b) => typeOrder[a.type] - typeOrder[b.type] || a.rank - b.rank);
}

function getRibbonLayout(anchor, count, direction) {
  const view = { minX: 328, maxX: 1672, minY: 292, maxY: 872 };
  const step = count > 6 ? 68 : 76;
  const firstDistance = 76;
  let y = anchor.y + (anchor.y > 700 ? -96 : anchor.y < 380 ? 92 : -78);
  y = clampNumber(y, view.minY, view.maxY);

  let firstX = anchor.x + direction * firstDistance;
  const lastX = firstX + direction * step * Math.max(0, count - 1);
  const minItemX = Math.min(firstX, lastX) - 50;
  const maxItemX = Math.max(firstX, lastX) + 50;

  if (minItemX < view.minX) {
    firstX += view.minX - minItemX;
  }
  if (maxItemX > view.maxX) {
    firstX -= maxItemX - view.maxX;
  }

  const adjustedLastX = firstX + direction * step * Math.max(0, count - 1);
  const trackX = Math.min(firstX, adjustedLastX) - 62;
  const trackWidth = Math.abs(adjustedLastX - firstX) + 124;

  return {
    firstX,
    y,
    step,
    trackX,
    trackWidth,
    prevX: trackX - 30,
    nextX: trackX + trackWidth + 30
  };
}

function renderRibbonItem(team, point, anchor, index) {
  const size = ribbonMarkerSize(team);
  const item = svgElement("g", {
    class: `team-ribbon-item ${team.type}`,
    transform: `translate(${point.x.toFixed(2)} ${point.y.toFixed(2)})`,
    style: `--delay: ${Math.min(index * 58, 520)}ms`,
    tabindex: "0",
    role: "button",
    "aria-label": `${team.teamLabel}. ${team.municipality}. ${team.title}`
  });
  const motion = svgElement("animateTransform", {
    attributeName: "transform",
    type: "translate",
    from: `${anchor.x.toFixed(2)} ${anchor.y.toFixed(2)}`,
    to: `${point.x.toFixed(2)} ${point.y.toFixed(2)}`,
    dur: "0.42s",
    begin: `${(index * 0.045).toFixed(3)}s`,
    fill: "freeze",
    calcMode: "spline",
    keySplines: "0.18 0.78 0.2 1"
  });

  item.appendChild(motion);

  if (team.type === "participant") {
    item.append(
      svgElement("circle", { class: "ribbon-participant-pulse", r: size.ring }),
      svgElement("circle", { class: "ribbon-participant-core", r: size.core })
    );
  } else {
    item.appendChild(renderPhotoMarker(team, size));
  }

  item.addEventListener("click", (event) => {
    event.stopPropagation();
    if (Date.now() < ribbonState.suppressClickUntil) {
      return;
    }
    handleTeamClick(team);
  });
  item.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleTeamClick(team);
    }
  });
  item.addEventListener("mouseenter", () => showInfo(team));
  item.addEventListener("focus", () => showInfo(team));

  return item;
}

function renderRibbonNav(group, direction, rail, isEnabled) {
  const isPrev = direction === "prev";
  const x = isPrev ? rail.prevX : rail.nextX;
  const nav = svgElement("g", {
    class: `ribbon-nav ${direction} ${isEnabled ? "" : "is-disabled"}`,
    transform: `translate(${x.toFixed(2)} ${rail.y.toFixed(2)})`,
    tabindex: isEnabled ? "0" : "-1",
    role: "button",
    "aria-label": isPrev ? "Предыдущие команды" : "Следующие команды"
  });

  nav.append(
    svgElement("circle", { class: "ribbon-nav-body", r: 22 }),
    svgElement("text", { class: "ribbon-nav-icon", "text-anchor": "middle", "dominant-baseline": "central" })
  );
  nav.querySelector(".ribbon-nav-icon").textContent = isPrev ? "‹" : "›";

  if (isEnabled) {
    nav.addEventListener("click", (event) => {
      event.stopPropagation();
      moveRibbon(group, isPrev ? -1 : 1);
    });
    nav.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        moveRibbon(group, isPrev ? -1 : 1);
      }
    });
  }

  return nav;
}

function attachRibbonDragHandlers(target, dragElement, group, maxStart) {
  if (maxStart <= 0) {
    return;
  }

  target.addEventListener("pointerdown", (event) => {
    if (event.target.closest(".ribbon-nav")) {
      return;
    }
    event.stopPropagation();
    ribbonState.activeKey = group.key;
    ribbonState.pointerId = event.pointerId;
    ribbonState.startX = event.clientX;
    ribbonState.dragX = 0;
    target.classList.add("is-dragging");
    target.setPointerCapture?.(event.pointerId);
  });
  target.addEventListener("pointermove", (event) => {
    if (ribbonState.pointerId !== event.pointerId || ribbonState.activeKey !== group.key) {
      return;
    }
    event.preventDefault();
    ribbonState.dragX = event.clientX - ribbonState.startX;
    dragElement.setAttribute("transform", `translate(${(ribbonState.dragX * 0.34).toFixed(2)} 0)`);
  });
  target.addEventListener("pointerup", (event) => finishRibbonDrag(event, target, dragElement, group, maxStart));
  target.addEventListener("pointercancel", (event) => finishRibbonDrag(event, target, dragElement, group, maxStart));
}

function finishRibbonDrag(event, target, dragElement, group, maxStart) {
  if (ribbonState.pointerId !== event.pointerId || ribbonState.activeKey !== group.key) {
    return;
  }

  const dragX = ribbonState.dragX;
  ribbonState.pointerId = null;
  ribbonState.activeKey = null;
  ribbonState.dragX = 0;
  target.classList.remove("is-dragging");
  target.releasePointerCapture?.(event.pointerId);

  if (dragX < -52) {
    ribbonState.suppressClickUntil = Date.now() + 320;
    moveRibbon(group, 1, maxStart);
    return;
  }
  if (dragX > 52) {
    ribbonState.suppressClickUntil = Date.now() + 320;
    moveRibbon(group, -1, maxStart);
    return;
  }

  dragElement.setAttribute("transform", "translate(0 0)");
}

function moveRibbon(group, direction, knownMaxStart) {
  const visibleCount = Math.min(group.teams.length, 8);
  const maxStart = typeof knownMaxStart === "number" ? knownMaxStart : Math.max(0, group.teams.length - visibleCount);
  const current = ribbonState.startIndexByKey.get(group.key) || 0;
  ribbonState.startIndexByKey.set(group.key, clampNumber(current + direction, 0, maxStart));
  renderPoints();
}

function clampNumber(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function spreadTeams(items) {
  const count = items.length;
  const sorted = [...items].sort((a, b) => {
    const typeOrder = { winner: 1, top30: 2, participant: 3 };
    return typeOrder[a.type] - typeOrder[b.type] || a.rank - b.rank;
  });

  return sorted.map((team, index) => {
    if (count === 1) {
      return { ...team, offset: [0, -64] };
    }

    const angle = -Math.PI / 2 + (index / count) * Math.PI * 2;
    const radius = Math.min(122, 48 + count * 4);
    const ring = count > 12 && index % 2 === 1 ? radius + 32 : radius;

    return {
      ...team,
      offset: [Math.round(Math.cos(angle) * ring), Math.round(Math.sin(angle) * ring)]
    };
  });
}

function renderPoint(team, index = 0) {
  const position = projectPoint(team.lon, team.lat, team.offset);
  const size = markerSize(team);
  const group = svgElement("g", {
    class: `map-point ${team.type} is-expanded`,
    transform: `translate(${position.x.toFixed(2)} ${position.y.toFixed(2)})`,
    style: `animation-delay: ${Math.min(index * 45, 560)}ms`,
    tabindex: "0",
    role: "button",
    "aria-label": `${team.teamLabel}. ${team.municipality}. ${team.title}`
  });

  if (team.type !== "participant") {
    group.appendChild(renderPhotoMarker(team, size));
  } else {
    group.append(
      svgElement("circle", { class: "point-ring", r: size.ring }),
      svgElement("circle", { class: "point-core", r: size.core })
    );
  }

  group.addEventListener("click", (event) => {
    event.stopPropagation();
    handleTeamClick(team);
  });
  group.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleTeamClick(team);
    }
  });
  group.addEventListener("mouseenter", () => showInfo(team));
  group.addEventListener("focus", () => showInfo(team));

  pointsLayer.appendChild(group);
}

function renderPhotoMarker(team, size) {
  const radius = size.radius;
  const marker = svgElement("g", { class: "photo-marker" });
  const clipPath = createPhotoMarkerClip(team, radius);

  marker.append(
    svgElement("ellipse", { class: "photo-marker-shadow", cx: 0, cy: radius * 0.74, rx: radius * 0.78, ry: radius * 0.18 }),
    svgElement("circle", { class: "photo-marker-pulse", r: radius + 10 }),
    svgElement("circle", { class: "photo-marker-bg", r: radius + 4 })
  );

  if (team.images.thumb) {
    marker.appendChild(
      svgElement("image", {
        class: "photo-marker-image",
        href: team.images.thumb,
        x: -radius,
        y: -radius,
        width: radius * 2,
        height: radius * 2,
        preserveAspectRatio: "xMidYMid slice",
        "clip-path": clipPath
      })
    );
  }

  marker.appendChild(svgElement("circle", { class: "photo-marker-frame", r: radius }));
  return marker;
}

function createPhotoMarkerClip(team, radius) {
  const defs = mapSvg.querySelector("defs");
  const id = `clip-photo-${team.id.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
  const clipPath = svgElement("clipPath", { id, class: "marker-clip" });
  clipPath.appendChild(svgElement("circle", { cx: 0, cy: 0, r: radius }));
  defs.appendChild(clipPath);
  return `url(#${id})`;
}

function clearMarkerClips() {
  mapSvg.querySelectorAll(".marker-clip").forEach((clip) => clip.remove());
}

function markerSize(team) {
  if (team.type === "winner") {
    return { radius: 35 };
  }
  if (team.type === "top30") {
    return { radius: 29 };
  }
  return { ring: 11, core: 6 };
}

function ribbonMarkerSize(team) {
  if (team.type === "winner") {
    return { radius: 40 };
  }
  if (team.type === "top30") {
    return { radius: 31 };
  }
  return { ring: 19, core: 12 };
}

function showClusterInfo(group) {
  const winnerCount = group.teams.filter((team) => team.type === "winner").length;
  const top30Count = group.teams.filter((team) => team.type === "top30").length;
  const participantCount = group.teams.filter((team) => team.type === "participant").length;
  const textParts = [];

  if (winnerCount) {
    textParts.push(`победителей: ${winnerCount}`);
  }
  if (top30Count) {
    textParts.push(`топ-30: ${top30Count}`);
  }
  if (participantCount) {
    textParts.push(`ниже 30 места: ${participantCount}`);
  }

  infoCard.hidden = false;
  infoCard.replaceChildren(
    textElement("p", "Муниципалитет участника", "kicker"),
    textElement("h2", group.name),
    textElement("p", `Команд: ${group.count}`),
    textElement("p", textParts.join(" · "))
  );
  updateNav();
}

function handleTeamClick(team) {
  if (team.type === "winner") {
    showProject(team.id);
    return;
  }
  if (team.type === "top30") {
    showModal(team);
    return;
  }
  showInfo(team, true);
}

function showInfo(team, keepOpen = false) {
  infoCard.hidden = false;
  infoCard.replaceChildren(
    textElement("p", team.type === "winner" ? "Победитель" : team.type === "top30" ? "Топ-30" : "Участник", "kicker"),
    textElement("h2", `№${team.rank}. ${team.team}`),
    textElement("p", team.title),
    textElement("p", `${team.municipality} · ${team.organization}`),
    textElement("p", team.score ? `${team.score} баллов` : "")
  );
  infoCard.dataset.keepOpen = keepOpen ? "true" : "false";
  updateNav();
}

let lastModalSourceRect = null;

function showModal(team, sourceRect = null) {
  closeInfo();
  lastModalSourceRect = sourceRect;
  const modalImage = team.images?.visualization || team.images?.thumb || "";
  modalMedia.hidden = !modalImage;
  modalMedia.style.backgroundImage = modalImage ? `url("${modalImage}")` : "";
  modalCard.classList.remove("is-collapsing", "is-expanding");
  setText("modal-rank", `Место №${team.rank} · топ-30`);
  setText("modal-title", team.title);
  setText("modal-team", `${team.teamLabel} · ${team.organization || team.municipality}`);
  setText("modal-text", getShortIdea(team, 4));
  setText("modal-municipality", team.municipality);
  setText("modal-organization", team.organization);
  setText("modal-score", team.score ? String(team.score) : "не указано");
  modal.hidden = false;
  if (sourceRect) {
    requestAnimationFrame(() => {
      const targetRect = modalCard.getBoundingClientRect();
      const scaleX = sourceRect.width / targetRect.width;
      const scaleY = sourceRect.height / targetRect.height;
      const deltaX = sourceRect.left + sourceRect.width / 2 - (targetRect.left + targetRect.width / 2);
      const deltaY = sourceRect.top + sourceRect.height / 2 - (targetRect.top + targetRect.height / 2);
      modalCard.style.setProperty("--modal-start-x", `${deltaX.toFixed(2)}px`);
      modalCard.style.setProperty("--modal-start-y", `${deltaY.toFixed(2)}px`);
      modalCard.style.setProperty("--modal-start-scale-x", scaleX.toFixed(3));
      modalCard.style.setProperty("--modal-start-scale-y", scaleY.toFixed(3));
      modalCard.classList.add("is-expanding");
    });
  }
  updateNav();
}

function closeModal() {
  if (modal.hidden) {
    return;
  }
  if (lastModalSourceRect) {
    modalCard.classList.remove("is-expanding");
    modalCard.classList.add("is-collapsing");
    window.setTimeout(() => {
      modal.hidden = true;
      modalCard.classList.remove("is-collapsing");
      lastModalSourceRect = null;
      updateNav();
    }, 240);
    return;
  }
  modal.hidden = true;
  lastModalSourceRect = null;
  updateNav();
}

function closeInfo() {
  infoCard.hidden = true;
  infoCard.replaceChildren();
  updateNav();
}

function showProject(teamId, updateAddress = true) {
  const team = teamById.get(teamId);
  if (!team || team.type !== "winner") {
    showMap(updateAddress);
    return;
  }

  closeModal();
  closeInfo();
  closeDistrictPanel();
  activeScreen = "project";
  mapScreen.classList.remove("is-active");
  mapScreen.hidden = true;
  projectScreen.hidden = false;
  projectScreen.classList.add("is-active");

  setText("project-rank", `Место №${team.rank} · победитель`);
  setText("project-title", team.title);
  setText("project-team", `${team.teamLabel} · ${team.organization}`);
  setText("project-idea", team.idea);
  renderProjectDetails(team);
  setText("project-municipality", team.municipality);
  setText("project-organization", team.organization);
  setText("project-score", team.score ? String(team.score) : "не указано");
  renderProjectGallery(team);

  if (updateAddress) {
    history.pushState(null, "", `#project/${team.id}`);
  }
  updateNav();
}

function renderProjectGallery(team) {
  carouselState.slides = buildProjectSlides(team);
  carouselState.active = 0;
  carouselState.dragX = 0;
  carouselState.dragY = 0;
  carouselState.pointerX = 0;
  carouselState.pointerY = 0;
  carouselStage.replaceChildren();
  carouselDots.replaceChildren();

  if (!carouselState.slides.length) {
    carouselPrev.hidden = true;
    carouselNext.hidden = true;
    carouselDots.hidden = true;
    carouselCaption.textContent = "Материалы проекта будут добавлены";
    return;
  }

  carouselState.slides.forEach((slide, index) => {
    const card = document.createElement("figure");
    card.className = "carousel-card";
    card.dataset.index = String(index);

    const image = document.createElement("img");
    image.src = slide.src;
    image.alt = slide.alt;
    image.draggable = false;
    image.onerror = () => {
      card.classList.add("is-missing");
    };

    card.appendChild(image);
    carouselStage.appendChild(card);

    const dot = document.createElement("button");
    dot.className = "carousel-dot";
    dot.type = "button";
    dot.setAttribute("aria-label", `Показать изображение ${index + 1}`);
    dot.addEventListener("click", () => goToCarouselSlide(index));
    carouselDots.appendChild(dot);
  });

  carouselPrev.hidden = carouselState.slides.length < 2;
  carouselNext.hidden = carouselState.slides.length < 2;
  carouselDots.hidden = carouselState.slides.length < 2;
  carouselCaption.textContent = "";
  updateCarousel();
}

function buildProjectSlides(team) {
  const gallery = Array.isArray(team.images?.gallery) ? team.images.gallery : [];
  const sourceSlides = gallery.length
    ? gallery
    : [
        { src: team.images?.visualization, label: "Визуализация проекта" },
        { src: team.images?.teamPhoto, label: "Команда проекта" },
        { src: team.images?.thumb, label: "Обложка проекта" }
      ];
  const used = new Set();

  return sourceSlides
    .filter((slide) => slide?.src && !used.has(slide.src) && used.add(slide.src))
    .map((slide, index) => ({
      src: slide.src,
      label: slide.label || `Материал проекта ${index + 1}`,
      alt: `${slide.label || "Материал проекта"}: ${team.title}`
    }));
}

function goToCarouselSlide(index) {
  if (!carouselState.slides.length) {
    return;
  }

  carouselState.active = wrapIndex(index, carouselState.slides.length);
  carouselState.dragX = 0;
  carouselState.dragY = 0;
  carouselState.pointerX = 0;
  carouselState.pointerY = 0;
  updateCarousel();
}

function wrapIndex(index, length) {
  return ((index % length) + length) % length;
}

function getCarouselOffset(index) {
  const length = carouselState.slides.length;
  let offset = index - carouselState.active;

  if (length > 2) {
    const half = length / 2;
    if (offset > half) {
      offset -= length;
    }
    if (offset < -half) {
      offset += length;
    }
  }

  const stageWidth = carouselStage.clientWidth || 1;
  return offset + carouselState.dragX / stageWidth;
}

function updateCarousel() {
  if (!carouselStage || !carouselState.slides.length) {
    return;
  }

  carousel.style.setProperty("--parallax-x", carouselState.pointerX.toFixed(3));
  carousel.style.setProperty("--parallax-y", carouselState.pointerY.toFixed(3));
  carousel.style.setProperty("--parallax-shift-x", `${(carouselState.pointerX * 8).toFixed(2)}px`);
  carousel.style.setProperty("--parallax-shift-y", `${(carouselState.pointerY * 6).toFixed(2)}px`);
  carousel.style.setProperty("--glow-shift-x", `${(carouselState.pointerX * -18).toFixed(2)}px`);
  carousel.style.setProperty("--glow-shift-y", `${(carouselState.pointerY * -12).toFixed(2)}px`);
  carousel.style.setProperty("--glow-x", `${(50 + carouselState.pointerX * 26).toFixed(2)}%`);
  carousel.style.setProperty("--glow-y", `${(50 + carouselState.pointerY * 20).toFixed(2)}%`);
  carousel.style.setProperty("--grid-x", `${(carouselState.pointerX * -22).toFixed(2)}px`);
  carousel.style.setProperty("--grid-y", `${(carouselState.pointerY * -18).toFixed(2)}px`);
  carousel.style.setProperty("--card-grid-x", `${(carouselState.pointerX * -8).toFixed(2)}px`);
  carousel.style.setProperty("--card-grid-y", `${(carouselState.pointerY * -6).toFixed(2)}px`);

  const travel = Math.min((carouselStage.clientWidth || 720) * 0.38, 330);
  const cards = [...carouselStage.querySelectorAll(".carousel-card")];
  const dots = [...carouselDots.querySelectorAll(".carousel-dot")];

  cards.forEach((card, index) => {
    const offset = getCarouselOffset(index);
    const distance = Math.abs(offset);
    const visibleDistance = Math.min(distance, 2.8);
    const isActive = distance < 0.45;
    const pullX = carouselState.isDragging && isActive ? Math.max(-46, Math.min(46, carouselState.dragX * 0.18)) : 0;
    const pullY = carouselState.isDragging && isActive ? Math.max(-34, Math.min(34, carouselState.dragY * 0.2)) : 0;
    const translateX = Math.max(-2.2, Math.min(2.2, offset)) * travel;
    const translateZ = -visibleDistance * 92 + (isActive && carouselState.isDragging ? 34 : 0);
    const rotateX = carouselState.isDragging && isActive ? Math.max(-9, Math.min(9, carouselState.dragY * -0.035)) : 0;
    const rotateY = Math.max(-24, Math.min(24, offset * -14 + (carouselState.isDragging && isActive ? carouselState.dragX * -0.018 : 0)));
    const rotateZ = Math.max(-4, Math.min(4, offset * 1.2));
    const scale = Math.max(0.72, 1 - visibleDistance * 0.12);
    const opacity = distance > 2.65 ? 0 : Math.max(0.18, 1 - visibleDistance * 0.28);
    const image = card.querySelector("img");

    card.classList.toggle("is-active", isActive);
    card.style.opacity = opacity.toFixed(3);
    card.style.pointerEvents = distance < 0.7 ? "auto" : "none";
    card.style.zIndex = String(100 - Math.round(visibleDistance * 10));
    card.style.transform = `translate3d(calc(-50% + ${(translateX + pullX).toFixed(2)}px), calc(-50% + ${pullY.toFixed(2)}px), ${translateZ.toFixed(2)}px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) rotateZ(${rotateZ.toFixed(2)}deg) scale(${scale.toFixed(3)})`;

    if (image) {
      const imagePullX = carouselState.isDragging && isActive ? Math.max(-18, Math.min(18, carouselState.dragX * -0.06)) : 0;
      const imagePullY = carouselState.isDragging && isActive ? Math.max(-14, Math.min(14, carouselState.dragY * -0.07)) : 0;
      const depthX = isActive ? carouselState.pointerX * -12 : 0;
      const depthY = isActive ? carouselState.pointerY * -10 : 0;
      const imageScale = carouselState.isDragging && isActive ? 1.052 : 1.018;
      image.style.transform = `translate3d(${(imagePullX + depthX).toFixed(2)}px, ${(imagePullY + depthY).toFixed(2)}px, 34px) scale(${imageScale})`;
    }
  });

  dots.forEach((dot, index) => {
    dot.classList.toggle("is-active", index === carouselState.active);
  });
  carouselCaption.textContent = "";
}

function initProjectCarousel() {
  if (!carousel) {
    return;
  }

  carouselPrev.addEventListener("click", () => goToCarouselSlide(carouselState.active - 1));
  carouselNext.addEventListener("click", () => goToCarouselSlide(carouselState.active + 1));
  carousel.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      goToCarouselSlide(carouselState.active - 1);
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      goToCarouselSlide(carouselState.active + 1);
    }
  });
  carousel.addEventListener("pointerdown", startCarouselDrag);
  carousel.addEventListener("pointermove", moveCarouselDrag);
  carousel.addEventListener("pointerup", endCarouselDrag);
  carousel.addEventListener("pointercancel", endCarouselDrag);
  window.addEventListener("resize", updateCarousel);
}

function startCarouselDrag(event) {
  if (event.target.closest("button") || carouselState.slides.length < 2) {
    return;
  }

  carouselState.isDragging = true;
  carouselState.pointerId = event.pointerId;
  carouselState.startX = event.clientX;
  carouselState.startY = event.clientY;
  carouselState.dragX = 0;
  carouselState.dragY = 0;
  updateCarouselPointer(event);
  carousel.classList.add("is-dragging");
  carousel.setPointerCapture?.(event.pointerId);
}

function moveCarouselDrag(event) {
  if (!carouselState.isDragging || event.pointerId !== carouselState.pointerId) {
    return;
  }

  event.preventDefault();
  carouselState.dragX = event.clientX - carouselState.startX;
  carouselState.dragY = event.clientY - carouselState.startY;
  updateCarouselPointer(event);
  updateCarousel();
}

function updateCarouselPointer(event) {
  const rect = carousel.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
  const y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
  carouselState.pointerX = Math.max(-1, Math.min(1, x));
  carouselState.pointerY = Math.max(-1, Math.min(1, y));
}

function endCarouselDrag(event) {
  if (!carouselState.isDragging || event.pointerId !== carouselState.pointerId) {
    return;
  }

  const dragX = carouselState.dragX;
  const threshold = Math.max(54, (carouselStage.clientWidth || 720) * 0.12);
  carouselState.isDragging = false;
  carouselState.pointerId = null;
  carousel.classList.remove("is-dragging");
  carousel.releasePointerCapture?.(event.pointerId);

  if (dragX < -threshold) {
    goToCarouselSlide(carouselState.active + 1);
    return;
  }
  if (dragX > threshold) {
    goToCarouselSlide(carouselState.active - 1);
    return;
  }

  carouselState.dragX = 0;
  carouselState.dragY = 0;
  carouselState.pointerX = 0;
  carouselState.pointerY = 0;
  updateCarousel();
}

function renderProjectDetails(team) {
  const details = document.getElementById("project-details");
  details.replaceChildren();

  (team.details || []).slice(0, 5).forEach((item) => {
    const block = document.createElement("section");
    block.className = "detail-item";
    block.append(textElement("strong", item.title), textElement("p", item.text));
    details.appendChild(block);
  });

  const members = team.members?.length ? `Состав команды: ${team.members.join(", ")}` : "";
  setText("project-members", members);
}

function showMap(updateAddress = true) {
  resetMapViewport();
  activeScreen = "map";
  projectScreen.classList.remove("is-active");
  projectScreen.hidden = true;
  mapScreen.hidden = false;
  mapScreen.classList.add("is-active");
  closeModal();
  closeInfo();
  closeDistrictPanel();
  renderPoints();
  if (updateAddress) {
    history.pushState(null, "", "#map");
  }
  updateNav();
}

function setImage(id, src, alt) {
  const image = document.getElementById(id);
  if (!image) {
    return;
  }
  const figure = image.closest("figure");
  figure.classList.remove("image-empty");
  image.alt = alt;
  image.onerror = () => {
    figure.classList.add("image-empty");
    image.removeAttribute("src");
  };

  if (!src) {
    figure.classList.add("image-empty");
    image.removeAttribute("src");
    return;
  }

  image.src = src;
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = value || "";
  }
}

function updateNav() {
  const hasOverlay = !modal.hidden || !aboutModal.hidden || !infoCard.hidden || Boolean(selectedMunicipalityKey);
  backButton.disabled = activeScreen === "map" && !hasOverlay;
}

function setActiveTeamFilter(nextFilter) {
  activeTeamFilter = activeTeamFilter === nextFilter && nextFilter !== "all" ? "all" : nextFilter;
  closeInfo();
  updateFilterButtons();

  if (selectedMunicipalityKey && !getVisibleMunicipalityGroup(selectedMunicipalityKey)) {
    closeDistrictPanel();
  } else if (selectedMunicipalityKey) {
    renderDistrictPanel({ key: selectedMunicipalityKey });
  }

  renderParticipantRegionHighlights();
  renderParticipantLabels();
  renderPoints();
  updateNav();
}

function resetTeamFilter() {
  if (activeTeamFilter === "all") {
    return;
  }
  activeTeamFilter = "all";
  updateFilterButtons();
}

function updateFilterButtons() {
  filterButtons.forEach((button) => {
    const isActive = button.dataset.filter === activeTeamFilter;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", isActive ? "true" : "false");
  });
}

function readRoute() {
  const projectMatch = location.hash.match(/^#project\/(.+)$/);
  if (projectMatch) {
    showProject(projectMatch[1], false);
    return;
  }
  showMap(false);
}

function fillCounts() {
  setText("about-participants", `${data.meta.participants}, ${teams.length} команд, 10 лучших инициатив в сборнике проектов.`);
  setText("about-organizer", data.meta.organizer);
}

function initMapSetupMode() {
  if (!mapSetupMode) {
    return;
  }

  document.body.classList.add("map-setup-mode");
  mapEditorPanel.hidden = false;
  if (interactionHint) {
    interactionHint.hidden = true;
  }
  closeDistrictPanel();
  mapSvg.appendChild(participantLabelLayer);
  setMapEditorStatus("Перетащите кружки и подписи районов в правильные места.");
}

function setMapEditorStatus(text) {
  if (mapEditorStatus) {
    mapEditorStatus.textContent = text;
  }
}

function exportMapPositions() {
  const payload = {
    generatedAt: new Date().toISOString(),
    note: "Координаты кружков и подписей районов для интерактивной карты Территории идей 2026",
    positions: municipalityGroups
      .map((group) => {
        const position = getClusterPosition(group);
        return {
          key: group.key,
          name: group.name,
          teams: group.count,
          x: Number(position.x.toFixed(2)),
          y: Number(position.y.toFixed(2))
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name, "ru")),
    labels: municipalityGroups
      .map((group) => {
        const position = getLabelPosition(group);
        return {
          key: group.key,
          name: group.name,
          x: Number(position.x.toFixed(2)),
          y: Number(position.y.toFixed(2))
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name, "ru"))
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "altai-map-positions.json";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  setMapEditorStatus("Файл координат скачан. Его можно прислать для закрепления карты.");
}

function resetMapPositions() {
  manualClusterPositions = {};
  manualLabelPositions = {};
  localStorage.removeItem(mapPositionStorageKey);
  localStorage.removeItem(mapLabelPositionStorageKey);
  renderParticipantLabels();
  renderPoints();
  setMapEditorStatus("Черновик сброшен. Можно расставить кружки и подписи заново.");
}

function initMapViewport() {
  if (mapSetupMode || !mapSvg || !mapWrap) {
    return;
  }

  mapSvg.addEventListener("pointerdown", onMapPointerDown);
  mapSvg.addEventListener("pointermove", onMapPointerMove);
  mapSvg.addEventListener("pointerup", onMapPointerEnd);
  mapSvg.addEventListener("pointercancel", onMapPointerEnd);
  mapSvg.addEventListener("wheel", onMapWheel, { passive: false });
}

function onMapPointerDown(event) {
  if (selectedMunicipalityKey || activeScreen !== "map") return;
  mapViewportState.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

  if (mapViewportState.pointers.size === 2) {
    mapViewportState.pointers.forEach((value, pointerId) => mapSvg.setPointerCapture?.(pointerId));
    const [first, second] = [...mapViewportState.pointers.values()];
    mapViewportState.startDistance = Math.hypot(second.x - first.x, second.y - first.y);
    mapViewportState.startScale = mapViewportState.scale;
    mapViewportState.startMidpoint = midpoint(first, second);
    mapViewportState.panPointerId = null;
    mapViewportState.suppressClickUntil = Date.now() + 500;
  } else if (mapViewportState.scale > 1.01) {
    mapViewportState.panPointerId = event.pointerId;
    mapViewportState.panStart = {
      clientX: event.clientX,
      clientY: event.clientY,
      x: mapViewportState.x,
      y: mapViewportState.y
    };
  }
}

function onMapPointerMove(event) {
  if (!mapViewportState.pointers.has(event.pointerId)) return;
  mapViewportState.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

  if (mapViewportState.pointers.size >= 2) {
    event.preventDefault();
    const [first, second] = [...mapViewportState.pointers.values()];
    const distance = Math.hypot(second.x - first.x, second.y - first.y);
    if (!mapViewportState.startDistance) return;
    const nextScale = clampNumber(mapViewportState.startScale * distance / mapViewportState.startDistance, 1, 2.8);
    zoomMapAt(nextScale, midpoint(first, second));
    mapViewportState.suppressClickUntil = Date.now() + 500;
    return;
  }

  if (mapViewportState.panPointerId === event.pointerId && mapViewportState.panStart) {
    const dx = event.clientX - mapViewportState.panStart.clientX;
    const dy = event.clientY - mapViewportState.panStart.clientY;
    if (Math.hypot(dx, dy) > 5) {
      event.preventDefault();
      mapSvg.setPointerCapture?.(event.pointerId);
      mapViewportState.x = mapViewportState.panStart.x + dx;
      mapViewportState.y = mapViewportState.panStart.y + dy;
      clampMapViewport();
      scheduleMapViewportRender();
      mapViewportState.suppressClickUntil = Date.now() + 350;
    }
  }
}

function onMapPointerEnd(event) {
  mapViewportState.pointers.delete(event.pointerId);
  if (mapSvg.hasPointerCapture?.(event.pointerId)) {
    mapSvg.releasePointerCapture?.(event.pointerId);
  }
  if (mapViewportState.pointers.size < 2) {
    mapViewportState.startDistance = 0;
    mapViewportState.startMidpoint = null;
  }
  if (mapViewportState.panPointerId === event.pointerId) {
    mapViewportState.panPointerId = null;
    mapViewportState.panStart = null;
  }
}

function onMapWheel(event) {
  if (selectedMunicipalityKey || activeScreen !== "map") return;
  event.preventDefault();
  const factor = Math.exp(-event.deltaY * 0.0015);
  zoomMapAt(clampNumber(mapViewportState.scale * factor, 1, 2.8), { x: event.clientX, y: event.clientY });
}

function zoomMapAt(nextScale, clientPoint) {
  const rect = mapWrap.getBoundingClientRect();
  const focusX = clientPoint.x - (rect.left + rect.width / 2);
  const focusY = clientPoint.y - (rect.top + rect.height / 2);
  const ratio = nextScale / mapViewportState.scale;
  mapViewportState.x = focusX - (focusX - mapViewportState.x) * ratio;
  mapViewportState.y = focusY - (focusY - mapViewportState.y) * ratio;
  mapViewportState.scale = nextScale;
  clampMapViewport();
  scheduleMapViewportRender();
}

function clampMapViewport() {
  const rect = mapWrap.getBoundingClientRect();
  const maxX = Math.max(0, (rect.width * (mapViewportState.scale - 1)) / 2);
  const maxY = Math.max(0, (rect.height * (mapViewportState.scale - 1)) / 2);
  mapViewportState.x = clampNumber(mapViewportState.x, -maxX, maxX);
  mapViewportState.y = clampNumber(mapViewportState.y, -maxY, maxY);
}

function scheduleMapViewportRender() {
  if (mapViewportState.frame) return;
  mapViewportState.frame = requestAnimationFrame(() => {
    mapViewportState.frame = 0;
    mapSvg.style.setProperty("--map-zoom", mapViewportState.scale.toFixed(3));
    mapSvg.style.setProperty("--map-pan-x", `${mapViewportState.x.toFixed(1)}px`);
    mapSvg.style.setProperty("--map-pan-y", `${mapViewportState.y.toFixed(1)}px`);
    mapWrap.classList.toggle("is-map-zoomed", mapViewportState.scale > 1.01);
  });
}

function resetMapViewport() {
  mapViewportState.scale = 1;
  mapViewportState.x = 0;
  mapViewportState.y = 0;
  mapViewportState.pointers.clear();
  mapViewportState.panPointerId = null;
  mapViewportState.panStart = null;
  scheduleMapViewportRender();
}

function midpoint(first, second) {
  return { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 };
}

document.getElementById("modal-close").addEventListener("click", closeModal);
districtPanelClose.addEventListener("click", closeDistrictPanel);
districtTeamGrid.addEventListener("click", (event) => {
  if (event.target === districtTeamGrid && flippedParticipantCard) {
    flippedParticipantCard.classList.remove("is-flipped");
    flippedParticipantCard = null;
  }
});
aboutButton.addEventListener("click", () => {
  aboutModal.hidden = false;
  updateNav();
});
aboutClose.addEventListener("click", () => {
  aboutModal.hidden = true;
  updateNav();
});
aboutModal.addEventListener("click", (event) => {
  if (event.target === aboutModal) {
    aboutModal.hidden = true;
    updateNav();
  }
});
modal.addEventListener("click", (event) => {
  if (event.target === modal) {
    closeModal();
  }
});
filterButtons.forEach((button) => {
  button.addEventListener("click", () => setActiveTeamFilter(button.dataset.filter || "all"));
});
backButton.addEventListener("click", () => {
  if (!modal.hidden) {
    closeModal();
    return;
  }
  if (!aboutModal.hidden) {
    aboutModal.hidden = true;
    updateNav();
    return;
  }
  if (activeScreen === "project") {
    showMap();
    return;
  }
  if (selectedMunicipalityKey) {
    closeDistrictPanel();
    return;
  }
  if (!infoCard.hidden) {
    closeInfo();
    return;
  }
  showMap();
});
homeButton.addEventListener("click", () => {
  resetTeamFilter();
  showMap();
});
mapSvg.addEventListener("click", () => {
  if (Date.now() < mapViewportState.suppressClickUntil) {
    return;
  }
  if (!selectedMunicipalityKey) {
    return;
  }
  closeDistrictPanel();
});
window.addEventListener("popstate", readRoute);

downloadMapPositionsButton?.addEventListener("click", exportMapPositions);
resetMapPositionsButton?.addEventListener("click", resetMapPositions);

function resetIdleTimer() {
  if (mapSetupMode) {
    return;
  }
  document.body.classList.remove("is-idle");
  window.clearTimeout(idleTimer);
  idleTimer = window.setTimeout(() => {
    document.body.classList.add("is-idle");
    showMap(false);
  }, 90000);
}

["pointerdown", "keydown"].forEach((eventName) => {
  window.addEventListener(eventName, resetIdleTimer, { passive: true });
});

initAmbientBackground();
fillCounts();
updateFilterButtons();
renderParticipantRegionHighlights();
renderParticipantLabels();
renderPoints();
initProjectCarousel();
initMapViewport();
readRoute();
initMapSetupMode();
resetIdleTimer();
