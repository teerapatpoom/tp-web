/**
 * GRURU MUSEUM — Core Application Engine
 * Includes:
 *   - Hall Router & Navigation
 *   - Web Audio API Synth FX (Sound effects)
 *   - Scrambled Text Decoder (Motion rule: Scan -> Decode -> Connect)
 *   - Hall 02: D3 Canvas Force-Directed Knowledge Graph
 *   - Hall 03: Data Booming Guided Radial Explosion Engine
 *   - Hall 04: Everyday Lab 1080x1350 Social Knowledge Card Generator
 *   - Style Guide & Accessibility Tools
 */

// ============================================================================
// 1. WEB AUDIO SYNTHESIZER (Sci-Fi Micro-interactions)
// ============================================================================
class AudioSynthesizer {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    if (!this.ctx && typeof AudioContext !== "undefined") {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  playClick() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1760, this.ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch (e) {}
  }

  playBoom() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(140, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(580, this.ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.35);
    } catch (e) {}
  }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }
}

const soundSynth = new AudioSynthesizer();

// ============================================================================
// 2. SCRAMBLED TEXT DECODER (Decode Animation ~600ms)
// ============================================================================
function scrambleText(element, finalText, duration = 650) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+*#_/:;<>";
  const startTime = Date.now();
  const originalLength = finalText.length;

  function update() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const revealedLength = Math.floor(progress * originalLength);

    let output = finalText.substring(0, revealedLength);
    for (let i = revealedLength; i < originalLength; i++) {
      if (finalText[i] === " ") {
        output += " ";
      } else {
        output += chars[Math.floor(Math.random() * chars.length)];
      }
    }

    element.textContent = output;

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      element.textContent = finalText;
    }
  }

  requestAnimationFrame(update);
}

// ============================================================================
// 3. HALL NAVIGATION ROUTER
// ============================================================================
function navigateHall(hallId) {
  soundSynth.playClick();
  const sections = document.querySelectorAll(".hall-section");
  sections.forEach(sec => sec.classList.remove("active-hall"));

  const targetSection = document.getElementById(hallId);
  if (targetSection) {
    targetSection.classList.add("active-hall");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const links = document.querySelectorAll(".hall-nav-link");
  links.forEach(l => {
    l.classList.toggle("active", l.getAttribute("data-hall") === hallId);
  });

  // Trigger hall specific initializations
  if (hallId === "hall-graph" && !window.graphInitialized) {
    initKnowledgeGraph();
    window.graphInitialized = true;
  } else if (hallId === "hall-booming" && !window.boomingInitialized) {
    initDataBooming();
    window.boomingInitialized = true;
  } else if (hallId === "hall-lab") {
    renderSocialCard();
  }

  // Scramble headline if present in target hall
  const decodeHeader = targetSection?.querySelector(".decode-headline");
  if (decodeHeader && decodeHeader.dataset.targetText) {
    scrambleText(decodeHeader, decodeHeader.dataset.targetText);
  }
}

// ============================================================================
// 4. HALL 02: D3 FORCE-DIRECTED CANVAS KNOWLEDGE GRAPH
// ============================================================================
let graphSimulation = null;
let graphNodes = [];
let graphEdges = [];
let activeFilters = new Set(["science", "history", "technology", "wisdom", "nature", "art"]);
let maxYearFilter = 2042;
let selectedNode = null;
let hoveredNode = null;
let graphTransform = { x: 0, y: 0, k: 1 };
let isDragging = false;
let dragNode = null;

function initKnowledgeGraph() {
  const canvas = document.getElementById("graphCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  // Resize canvas according to display width
  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  // Initialize node copies for simulation
  graphNodes = KNOWLEDGE_GRAPH_DATA.nodes.map(d => ({ ...d }));
  const nodeMap = new Map(graphNodes.map(n => [n.id, n]));

  graphEdges = KNOWLEDGE_GRAPH_DATA.edges.map(e => ({
    ...e,
    source: nodeMap.get(e.source) || e.source,
    target: nodeMap.get(e.target) || e.target
  }));

  // Force simulation using D3 or custom fallback
  if (typeof d3 !== "undefined") {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    graphSimulation = d3.forceSimulation(graphNodes)
      .force("link", d3.forceLink(graphEdges).id(d => d.id).distance(110))
      .force("charge", d3.forceManyBody().strength(-240))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(d => d.radius + 14))
      .on("tick", renderGraph);
  } else {
    // Basic physics fallback if offline/no CDN
    runFallbackPhysics(canvas.clientWidth, canvas.clientHeight);
  }

  function renderGraph() {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    ctx.save();
    ctx.clearRect(0, 0, width, height);

    // Apply pan & zoom transform
    ctx.translate(graphTransform.x, graphTransform.y);
    ctx.scale(graphTransform.k, graphTransform.k);

    // Draw grid crosshairs
    drawGraphGrid(ctx, width, height);

    // 1. Draw Links
    graphEdges.forEach(link => {
      const src = link.source;
      const tgt = link.target;
      if (!isNodeVisible(src) || !isNodeVisible(tgt)) return;

      const isConnectedToSelected = selectedNode && (selectedNode.id === src.id || selectedNode.id === tgt.id);

      ctx.beginPath();
      ctx.moveTo(src.x, src.y);
      ctx.lineTo(tgt.x, tgt.y);

      if (isConnectedToSelected) {
        ctx.strokeStyle = "#D7FF3A";
        ctx.lineWidth = 2.5;
        ctx.setLineDash([]);
      } else {
        ctx.strokeStyle = "rgba(44, 44, 58, 0.7)";
        ctx.lineWidth = 1;
        if (link.type === "dashed") ctx.setLineDash([4, 4]);
        else if (link.type === "dotted") ctx.setLineDash([2, 3]);
        else ctx.setLineDash([]);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // 2. Draw Nodes
    graphNodes.forEach(node => {
      if (!isNodeVisible(node)) return;

      const isSelected = selectedNode && selectedNode.id === node.id;
      const isHovered = hoveredNode && hoveredNode.id === node.id;

      ctx.save();
      ctx.translate(node.x, node.y);

      // Selected / Hover Glow
      if (isSelected || isHovered) {
        ctx.beginPath();
        ctx.arc(0, 0, node.radius + 8, 0, Math.PI * 2);
        ctx.fillStyle = isSelected ? "rgba(215, 255, 58, 0.35)" : "rgba(46, 230, 255, 0.25)";
        ctx.fill();
      }

      // Draw Shape based on category
      ctx.fillStyle = isSelected ? "#D7FF3A" : node.color;
      ctx.strokeStyle = isSelected ? "#000000" : "#0B0B0F";
      ctx.lineWidth = 2;

      drawGeometricShape(ctx, node.shape, node.radius);

      // Node Label
      ctx.font = isSelected ? "600 13px 'Chakra Petch', sans-serif" : "500 11px 'IBM Plex Sans Thai', sans-serif";
      ctx.fillStyle = isSelected ? "#D7FF3A" : "#F2EDE3";
      ctx.textAlign = "center";
      ctx.fillText(node.title_th, 0, node.radius + 16);

      ctx.restore();
    });

    ctx.restore();
  }

  function isNodeVisible(node) {
    if (!activeFilters.has(node.category)) return false;
    if (node.year > maxYearFilter) return false;
    return true;
  }

  function drawGraphGrid(ctx, w, h) {
    ctx.strokeStyle = "rgba(44, 44, 58, 0.2)";
    ctx.lineWidth = 1;
    const step = 64;
    for (let x = -w; x < w * 2; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, -h);
      ctx.lineTo(x, h * 2);
      ctx.stroke();
    }
    for (let y = -h; y < h * 2; y += step) {
      ctx.beginPath();
      ctx.moveTo(-w, y);
      ctx.lineTo(w * 2, y);
      ctx.stroke();
    }
  }

  function drawGeometricShape(ctx, shape, r) {
    ctx.beginPath();
    if (shape === "circle") {
      ctx.arc(0, 0, r, 0, Math.PI * 2);
    } else if (shape === "hexagon") {
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i;
        const x = r * Math.cos(angle);
        const y = r * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
    } else if (shape === "square") {
      ctx.rect(-r, -r, r * 2, r * 2);
    } else if (shape === "triangle") {
      ctx.moveTo(0, -r * 1.15);
      ctx.lineTo(r, r * 0.85);
      ctx.lineTo(-r, r * 0.85);
      ctx.closePath();
    } else if (shape === "diamond") {
      ctx.moveTo(0, -r * 1.2);
      ctx.lineTo(r * 1.2, 0);
      ctx.lineTo(0, r * 1.2);
      ctx.lineTo(-r * 1.2, 0);
      ctx.closePath();
    } else if (shape === "ring") {
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = "#0B0B0F";
      ctx.fill();
      return;
    }
    ctx.fill();
    ctx.stroke();
  }

  // Canvas Mouse & Interaction handlers
  canvas.addEventListener("mousedown", e => {
    const pt = getCanvasPoint(e);
    const clicked = findNodeAt(pt.x, pt.y);
    if (clicked) {
      soundSynth.playClick();
      selectedNode = clicked;
      showSpecimenDrawer(clicked);
      isDragging = true;
      dragNode = clicked;
      if (graphSimulation) graphSimulation.alphaTarget(0.3).restart();
    } else {
      isDragging = true;
      dragNode = null;
      lastMousePos = { x: e.clientX, y: e.clientY };
    }
    renderGraph();
  });

  let lastMousePos = { x: 0, y: 0 };
  window.addEventListener("mousemove", e => {
    if (!isDragging) {
      const pt = getCanvasPoint(e);
      const hovered = findNodeAt(pt.x, pt.y);
      if (hovered !== hoveredNode) {
        hoveredNode = hovered;
        canvas.style.cursor = hovered ? "pointer" : "grab";
        renderGraph();
      }
      return;
    }

    if (dragNode) {
      const pt = getCanvasPoint(e);
      dragNode.fx = pt.x;
      dragNode.fy = pt.y;
    } else {
      const dx = e.clientX - lastMousePos.x;
      const dy = e.clientY - lastMousePos.y;
      graphTransform.x += dx;
      graphTransform.y += dy;
      lastMousePos = { x: e.clientX, y: e.clientY };
    }
    renderGraph();
  });

  window.addEventListener("mouseup", () => {
    if (dragNode) {
      dragNode.fx = null;
      dragNode.fy = null;
      dragNode = null;
      if (graphSimulation) graphSimulation.alphaTarget(0);
    }
    isDragging = false;
  });

  canvas.addEventListener("wheel", e => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    graphTransform.k = Math.max(0.4, Math.min(3, graphTransform.k * zoomFactor));
    renderGraph();
  });

  function getCanvasPoint(e) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - graphTransform.x) / graphTransform.k;
    const y = (e.clientY - rect.top - graphTransform.y) / graphTransform.k;
    return { x, y };
  }

  function findNodeAt(x, y) {
    for (let i = graphNodes.length - 1; i >= 0; i--) {
      const n = graphNodes[i];
      if (!isNodeVisible(n)) continue;
      const dist = Math.hypot(n.x - x, n.y - y);
      if (dist <= n.radius + 6) return n;
    }
    return null;
  }

  // Filter Pill Listeners
  document.querySelectorAll(".filter-pill").forEach(pill => {
    pill.addEventListener("click", () => {
      soundSynth.playClick();
      const cat = pill.dataset.cat;
      if (activeFilters.has(cat)) {
        activeFilters.delete(cat);
        pill.classList.remove("active");
      } else {
        activeFilters.add(cat);
        pill.classList.add("active");
      }
      renderGraph();
    });
  });

  // Timeline Slider
  const slider = document.getElementById("timelineSlider");
  const yearDisplay = document.getElementById("timelineYearDisplay");
  if (slider && yearDisplay) {
    slider.addEventListener("input", e => {
      maxYearFilter = parseInt(e.target.value, 10);
      yearDisplay.textContent = maxYearFilter < 0 ? `${Math.abs(maxYearFilter)} BCE` : `${maxYearFilter} CE`;
      renderGraph();
    });
  }

  // Search input
  const searchInput = document.getElementById("graphSearchInput");
  if (searchInput) {
    searchInput.addEventListener("input", e => {
      const q = e.target.value.trim().toLowerCase();
      if (!q) {
        selectedNode = null;
      } else {
        const found = graphNodes.find(n => 
          n.title_th.toLowerCase().includes(q) || 
          n.title_en.toLowerCase().includes(q) ||
          n.specimen_id.toLowerCase().includes(q)
        );
        if (found) {
          selectedNode = found;
          showSpecimenDrawer(found);
          // Pan towards found node
          graphTransform.x = (canvas.clientWidth / 2) - found.x * graphTransform.k;
          graphTransform.y = (canvas.clientHeight / 2) - found.y * graphTransform.k;
        }
      }
      renderGraph();
    });
  }

  window.renderGraphSimulation = renderGraph;
}

function showSpecimenDrawer(node) {
  const drawer = document.getElementById("specimenDrawer");
  if (!drawer) return;

  drawer.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--gr-grid); padding-bottom:8px;">
      <span class="specimen-label">${node.specimen_id}</span>
      <button onclick="document.getElementById('specimenDrawer').classList.remove('open')" style="background:none; border:none; color:var(--gr-fog); cursor:pointer; font-size:16px;">✕</button>
    </div>
    <div>
      <span class="cat-badge cat-${node.category}">${node.category_th}</span>
      <h3 style="font-family:var(--font-heading); font-size:20px; color:var(--gr-paper); margin-top:6px;">${node.title_th}</h3>
      <div style="font-family:var(--font-mono); font-size:12px; color:var(--gr-lime);">${node.title_en} (${node.year < 0 ? Math.abs(node.year) + ' BCE' : node.year + ' CE'})</div>
    </div>
    <p style="font-size:13.5px; color:var(--gr-paper); line-height:1.6;">${node.summary}</p>
    <div style="background:rgba(0,0,0,0.4); padding:12px; border-left:3px solid var(--gr-lime); margin-top:4px;">
      <div style="font-family:var(--font-mono); font-size:11px; color:var(--gr-lime);">EVERYDAY TAKEAWAY</div>
      <div style="font-size:13px; color:var(--gr-paper); margin-top:3px;">${node.everyday_takeaway}</div>
    </div>
    <div style="font-size:11.5px; color:var(--gr-fog);">
      <strong>แหล่งอ้างอิง:</strong> ${node.sources.join(", ")}
    </div>
    <button class="btn-primary-lime" onclick="prepareSocialCard('${node.id}')" style="margin-top:6px; font-size:12px; padding:8px 14px; width:100%; justify-content:center;">
      สร้างการ์ดแชร์ 1080×1350
    </button>
  `;
  drawer.classList.add("open");
}

// Fallback Physics for graph when offline
function runFallbackPhysics(w, h) {
  graphNodes.forEach((n, i) => {
    const angle = (i / graphNodes.length) * Math.PI * 2;
    const r = 160 + (i % 3) * 70;
    n.x = w / 2 + Math.cos(angle) * r;
    n.y = h / 2 + Math.sin(angle) * r;
  });
  if (window.renderGraphSimulation) window.renderGraphSimulation();
}

// ============================================================================
// 5. HALL 03: DATA BOOMING (RADIAL EXPLOSION ENGINE)
// ============================================================================
let boomingCurrentTier = 0;
let boomingActiveNode = null;
let boomingExplodedNodes = [];

function initDataBooming() {
  const root = KNOWLEDGE_GRAPH_DATA.nodes[0]; // Photosynthesis as flagship starter
  boomingActiveNode = root;
  boomingCurrentTier = 1;
  boomingExplodedNodes = [root];

  renderBoomingTree();
}

function renderBoomingTree() {
  const svg = document.getElementById("boomingSvg");
  if (!svg) return;
  const rect = svg.getBoundingClientRect();
  const cx = rect.width / 2;
  const cy = rect.height / 2;

  svg.innerHTML = `
    <!-- Defs for glow filter -->
    <defs>
      <filter id="boomingGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    <!-- Background concentric time rings -->
    <circle cx="${cx}" cy="${cy}" r="120" fill="none" stroke="#2C2C3A" stroke-width="1" stroke-dasharray="4 4" />
    <circle cx="${cx}" cy="${cy}" r="220" fill="none" stroke="#2C2C3A" stroke-width="1" stroke-dasharray="4 4" />
    <circle cx="${cx}" cy="${cy}" r="300" fill="none" stroke="#2C2C3A" stroke-width="1" stroke-dasharray="4 4" />
    <g id="boomingLinksGroup"></g>
    <g id="boomingNodesGroup"></g>
  `;

  const linksGroup = document.getElementById("boomingLinksGroup");
  const nodesGroup = document.getElementById("boomingNodesGroup");

  // Find connected child nodes up to 10
  const relatedEdges = KNOWLEDGE_GRAPH_DATA.edges.filter(e => 
    e.source === boomingActiveNode.id || e.target === boomingActiveNode.id
  );

  const childIds = relatedEdges.map(e => e.source === boomingActiveNode.id ? e.target : e.source);
  const childNodes = KNOWLEDGE_GRAPH_DATA.nodes.filter(n => childIds.includes(n.id) && n.id !== boomingActiveNode.id);

  // Update Ticker
  const countEl = document.getElementById("boomingConnectionCount");
  if (countEl) countEl.textContent = childNodes.length + 1;

  // Render Root Node in Center
  const rootG = document.createElementNS("http://www.w3.org/2000/svg", "g");
  rootG.setAttribute("transform", `translate(${cx}, ${cy})`);
  rootG.style.cursor = "pointer";
  rootG.innerHTML = `
    <circle cx="0" cy="0" r="42" fill="rgba(215, 255, 58, 0.2)" filter="url(#boomingGlow)" />
    <circle cx="0" cy="0" r="32" fill="#D7FF3A" stroke="#000" stroke-width="3" />
    <text x="0" y="5" fill="#000" font-family="'Chakra Petch', sans-serif" font-weight="700" font-size="12" text-anchor="middle">แก่นเรื่อง</text>
    <text x="0" y="52" fill="#D7FF3A" font-family="'Chakra Petch', sans-serif" font-weight="700" font-size="14" text-anchor="middle">${boomingActiveNode.title_th}</text>
  `;
  rootG.onclick = () => {
    soundSynth.playBoom();
    showSpecimenDrawer(boomingActiveNode);
  };
  nodesGroup.appendChild(rootG);

  // Render Radial Children with Staggered Burst
  const radius = Math.min(cx, cy) * 0.65;
  childNodes.forEach((child, index) => {
    const angle = (index / childNodes.length) * Math.PI * 2 - Math.PI / 2;
    const nx = cx + Math.cos(angle) * radius;
    const ny = cy + Math.sin(angle) * radius;

    // Draw connecting laser line
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", cx);
    line.setAttribute("y1", cy);
    line.setAttribute("x2", nx);
    line.setAttribute("y2", ny);
    line.setAttribute("stroke", child.color);
    line.setAttribute("stroke-width", "1.5");
    line.setAttribute("stroke-opacity", "0.6");
    linksGroup.appendChild(line);

    // Draw Node
    const nodeG = document.createElementNS("http://www.w3.org/2000/svg", "g");
    nodeG.setAttribute("transform", `translate(${nx}, ${ny})`);
    nodeG.style.cursor = "pointer";
    nodeG.style.opacity = "0";
    nodeG.style.transition = `all 0.4s cubic-bezier(0.16, 1, 0.3, 1) ${index * 45}ms`;

    nodeG.innerHTML = `
      <circle cx="0" cy="0" r="22" fill="${child.color}" stroke="#0B0B0F" stroke-width="2" />
      <text x="0" y="34" fill="#F2EDE3" font-family="'IBM Plex Sans Thai', sans-serif" font-size="11" text-anchor="middle">${child.title_th}</text>
    `;

    nodeG.onclick = () => {
      soundSynth.playBoom();
      boomingActiveNode = child;
      boomingCurrentTier++;
      showSpecimenDrawer(child);
      renderBoomingTree();
    };

    nodesGroup.appendChild(nodeG);

    // Stagger animation trigger
    setTimeout(() => {
      nodeG.style.opacity = "1";
    }, 10);
  });
}

function resetDataBooming() {
  soundSynth.playClick();
  initDataBooming();
}

// ============================================================================
// 6. HALL 04: EVERYDAY LAB (SOCIAL KNOWLEDGE CARD GENERATOR 1080×1350)
// ============================================================================
let currentCardNode = KNOWLEDGE_GRAPH_DATA.nodes[0];

function prepareSocialCard(nodeId) {
  const node = KNOWLEDGE_GRAPH_DATA.nodes.find(n => n.id === nodeId);
  if (node) {
    currentCardNode = node;
    navigateHall("hall-lab");
    renderSocialCard();
  }
}

function renderSocialCard() {
  const canvas = document.getElementById("socialCardCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  // Dimensions for high-res 1080 x 1350
  canvas.width = 1080;
  canvas.height = 1350;

  const node = currentCardNode || KNOWLEDGE_GRAPH_DATA.nodes[0];

  // 1. Background Void Black
  ctx.fillStyle = "#0B0B0F";
  ctx.fillRect(0, 0, 1080, 1350);

  // 2. Specimen Grid background
  ctx.strokeStyle = "rgba(44, 44, 58, 0.4)";
  ctx.lineWidth = 1.5;
  const gridStep = 48;
  for (let x = 0; x < 1080; x += gridStep) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 1350);
    ctx.stroke();
  }
  for (let y = 0; y < 1350; y += gridStep) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(1080, y);
    ctx.stroke();
  }

  // 3. Ambient Aurora Glow
  const grad = ctx.createRadialGradient(540, 420, 50, 540, 420, 600);
  grad.addColorStop(0, "rgba(215, 255, 58, 0.12)");
  grad.addColorStop(0.5, "rgba(140, 107, 255, 0.08)");
  grad.addColorStop(1, "transparent");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1080, 1350);

  // 4. Header Badge & HUD Corners
  ctx.strokeStyle = "#D7FF3A";
  ctx.lineWidth = 3;
  ctx.strokeRect(60, 60, 960, 1230);

  // Top Label
  ctx.fillStyle = "#17171F";
  ctx.fillRect(80, 40, 480, 44);
  ctx.fillStyle = "#D7FF3A";
  ctx.font = "600 20px 'IBM Plex Mono', monospace";
  ctx.fillText(`GRURU MUSEUM // ${node.specimen_id}`, 100, 70);

  // Category Tag
  ctx.fillStyle = node.color;
  ctx.font = "700 22px 'IBM Plex Mono', monospace";
  ctx.fillText(`[ ${node.category_th.toUpperCase()} ]`, 100, 170);

  // Main Title
  ctx.fillStyle = "#F2EDE3";
  ctx.font = "700 68px 'Chakra Petch', sans-serif";
  ctx.fillText(node.title_th, 100, 260);

  // English Subtitle
  ctx.fillStyle = "#8A8A9E";
  ctx.font = "500 32px 'IBM Plex Mono', monospace";
  ctx.fillText(`${node.title_en} (${node.year < 0 ? Math.abs(node.year) + ' BCE' : node.year + ' CE'})`, 100, 320);

  // Geometric Graphic Icon
  ctx.save();
  ctx.translate(540, 520);
  ctx.beginPath();
  ctx.arc(0, 0, 120, 0, Math.PI * 2);
  ctx.strokeStyle = node.color;
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.fillStyle = "#D7FF3A";
  ctx.beginPath();
  ctx.arc(0, 0, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Summary Box
  ctx.fillStyle = "rgba(23, 23, 31, 0.9)";
  ctx.fillRect(100, 690, 880, 210);
  ctx.strokeStyle = "#2C2C3A";
  ctx.lineWidth = 2;
  ctx.strokeRect(100, 690, 880, 210);

  ctx.fillStyle = "#F2EDE3";
  ctx.font = "400 30px 'IBM Plex Sans Thai', sans-serif";
  wrapText(ctx, node.summary, 140, 750, 800, 44);

  // EVERYDAY TAKEAWAY CARD (The Hero Highlight)
  ctx.fillStyle = "#17171F";
  ctx.fillRect(100, 930, 880, 240);
  ctx.strokeStyle = "#D7FF3A";
  ctx.lineWidth = 3;
  ctx.strokeRect(100, 930, 880, 240);

  ctx.fillStyle = "#D7FF3A";
  ctx.font = "700 24px 'IBM Plex Mono', monospace";
  ctx.fillText("★ EVERYDAY TAKEAWAY (นำไปใช้จริงในชีวิตประจำวัน)", 140, 980);

  ctx.fillStyle = "#F2EDE3";
  ctx.font = "500 30px 'IBM Plex Sans Thai', sans-serif";
  wrapText(ctx, node.everyday_takeaway, 140, 1030, 800, 44);

  // Footer Branding
  ctx.fillStyle = "#8A8A9E";
  ctx.font = "400 20px 'IBM Plex Mono', monospace";
  ctx.fillText("GRURU.MUSEUM // FUTURE ARCHAEOLOGY LAB", 100, 1240);
  ctx.fillText("NEW KNOWLEDGE • BUILT FOR EVERYDAY LIVING", 540, 1240);
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(" ");
  let line = "";

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + " ";
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line, x, y);
      line = words[n] + " ";
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, y);
}

function downloadSocialCard() {
  soundSynth.playClick();
  const canvas = document.getElementById("socialCardCanvas");
  if (!canvas) return;
  const link = document.createElement("a");
  link.download = `GRURU_Card_${currentCardNode.id}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

// ============================================================================
// 7. STYLE GUIDE & ACCESSIBILITY MODAL
// ============================================================================
function toggleStyleGuide() {
  soundSynth.playClick();
  const modal = document.getElementById("styleGuideModal");
  if (modal) modal.classList.toggle("open");
}

function copyColorToken(hex, name) {
  navigator.clipboard.writeText(hex).then(() => {
    alert(`คัดลอกรหัสสี ${name} (${hex}) เรียบร้อยแล้ว`);
  });
}

// ============================================================================
// 8. INITIALIZE ON DOM LOAD
// ============================================================================
document.addEventListener("DOMContentLoaded", () => {
  // Navigation Links
  document.querySelectorAll(".hall-nav-link").forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();
      const hall = link.getAttribute("data-hall");
      navigateHall(hall);
    });
  });

  // Sound Toggle Button
  const soundBtn = document.getElementById("soundToggleBtn");
  if (soundBtn) {
    soundBtn.addEventListener("click", () => {
      const active = soundSynth.toggle();
      soundBtn.textContent = active ? "🔊 SOUND: ON" : "🔇 SOUND: OFF";
      soundBtn.style.color = active ? "var(--gr-lime)" : "var(--gr-fog)";
    });
  }

  // Initial Decode Scramble on Hero
  const heroDecode = document.querySelector(".decode-headline");
  if (heroDecode && heroDecode.dataset.targetText) {
    scrambleText(heroDecode, heroDecode.dataset.targetText);
  }
});
