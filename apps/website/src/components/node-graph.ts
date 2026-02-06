// Node graph canvas animation for the hero section

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  label: string;
  elements: string[];
  color: string;
  pulsePhase: number;
}

interface Edge {
  from: number;
  to: number;
  progress: number;
}

const NODES_DATA = [
  {
    label: "linkedin.com/jobs",
    elements: ["apply_button", "job_card", "search_input"],
  },
  {
    label: "github.com/issues",
    elements: ["issue_title", "label_badge", "comment_box"],
  },
  {
    label: "stripe.com/docs",
    elements: ["search_input", "nav_sidebar", "code_block"],
  },
  {
    label: "news.ycombinator.com",
    elements: ["story_title", "upvote_btn", "more_link"],
  },
  {
    label: "instagram.com/dm",
    elements: ["message_input", "send_button", "chat_list"],
  },
  {
    label: "twitter.com/home",
    elements: ["tweet_box", "like_button", "retweet_btn"],
  },
  {
    label: "reddit.com/r/all",
    elements: ["post_card", "vote_arrows", "comment_link"],
  },
];

const TEAL = "#0D9488";
const TEAL_LIGHT = "#14B8A6";
const TEAL_GLOW = "rgba(13, 148, 136, 0.15)";

export function initNodeGraph(): void {
  const canvas = document.getElementById(
    "hero-canvas",
  ) as HTMLCanvasElement | null;
  const tooltip = document.getElementById("node-tooltip") as HTMLElement | null;

  if (!canvas || !tooltip) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  let width = 0;
  let height = 0;
  let nodes: Node[] = [];
  let edges: Edge[] = [];
  let hoveredNode: number = -1;
  let animationId: number;
  let isVisible = true;

  function resize() {
    const wrapper = canvas!.parentElement!;
    const rect = wrapper.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    width = rect.width;
    height = rect.height;
    canvas!.width = width * dpr;
    canvas!.height = height * dpr;
    ctx!.scale(dpr, dpr);
    initNodes();
  }

  function initNodes() {
    const cx = width / 2;
    const cy = height / 2;
    const spread = Math.min(width, height) * 0.35;

    nodes = NODES_DATA.map((data, i) => {
      const angle = (i / NODES_DATA.length) * Math.PI * 2 - Math.PI / 2;
      const r = i === 0 ? 0 : spread * (0.6 + Math.random() * 0.4);

      return {
        x: cx + Math.cos(angle) * r,
        y: cy + Math.sin(angle) * r,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        radius: i === 0 ? 28 : 18 + Math.random() * 8,
        label: data.label,
        elements: data.elements,
        color: TEAL,
        pulsePhase: Math.random() * Math.PI * 2,
      };
    });

    // Build edges — connect center to all, plus some cross-links
    edges = [];
    for (let i = 1; i < nodes.length; i++) {
      edges.push({ from: 0, to: i, progress: 0 });
    }
    // A few cross-connections
    edges.push({ from: 1, to: 3, progress: 0 });
    edges.push({ from: 2, to: 5, progress: 0 });
    edges.push({ from: 4, to: 6, progress: 0 });
  }

  function update() {
    const cx = width / 2;
    const cy = height / 2;
    const padding = 40;

    for (const node of nodes) {
      node.x += node.vx;
      node.y += node.vy;

      // Soft boundary
      if (node.x < padding) {
        node.vx += 0.05;
      }
      if (node.x > width - padding) {
        node.vx -= 0.05;
      }
      if (node.y < padding) {
        node.vy += 0.05;
      }
      if (node.y > height - padding) {
        node.vy -= 0.05;
      }

      // Gentle pull toward center
      node.vx += (cx - node.x) * 0.0002;
      node.vy += (cy - node.y) * 0.0002;

      // Damping
      node.vx *= 0.995;
      node.vy *= 0.995;

      node.pulsePhase += 0.02;
    }

    // Edge animation progress
    for (const edge of edges) {
      if (edge.progress < 1) {
        edge.progress = Math.min(1, edge.progress + 0.005);
      }
    }
  }

  function draw() {
    ctx!.clearRect(0, 0, width, height);

    const time = Date.now() * 0.001;

    // Draw edges
    for (const edge of edges) {
      const from = nodes[edge.from];
      const to = nodes[edge.to];

      const dx = to.x - from.x;
      const dy = to.y - from.y;

      const endX = from.x + dx * edge.progress;
      const endY = from.y + dy * edge.progress;

      // Pulse effect along edge
      const pulsePos = (time * 0.5 + edge.from * 0.3) % 1;
      const pulseX = from.x + dx * pulsePos;
      const pulseY = from.y + dy * pulsePos;

      // Edge line
      ctx!.beginPath();
      ctx!.moveTo(from.x, from.y);
      ctx!.lineTo(endX, endY);
      ctx!.strokeStyle = "rgba(13, 148, 136, 0.15)";
      ctx!.lineWidth = 1.5;
      ctx!.stroke();

      // Pulse dot
      if (edge.progress >= 1) {
        ctx!.beginPath();
        ctx!.arc(pulseX, pulseY, 2.5, 0, Math.PI * 2);
        ctx!.fillStyle = TEAL_LIGHT;
        ctx!.fill();
      }
    }

    // Draw nodes
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const isHovered = i === hoveredNode;
      const pulse = Math.sin(node.pulsePhase) * 0.15 + 1;
      const drawRadius = node.radius * (isHovered ? 1.2 : pulse);

      // Glow
      if (isHovered || i === 0) {
        const gradient = ctx!.createRadialGradient(
          node.x,
          node.y,
          drawRadius,
          node.x,
          node.y,
          drawRadius * 2.5,
        );
        gradient.addColorStop(0, "rgba(13, 148, 136, 0.2)");
        gradient.addColorStop(1, "rgba(13, 148, 136, 0)");
        ctx!.beginPath();
        ctx!.arc(node.x, node.y, drawRadius * 2.5, 0, Math.PI * 2);
        ctx!.fillStyle = gradient;
        ctx!.fill();
      }

      // Node circle
      ctx!.beginPath();
      ctx!.arc(node.x, node.y, drawRadius, 0, Math.PI * 2);

      const nodeGradient = ctx!.createRadialGradient(
        node.x - drawRadius * 0.3,
        node.y - drawRadius * 0.3,
        0,
        node.x,
        node.y,
        drawRadius,
      );
      nodeGradient.addColorStop(0, TEAL_LIGHT);
      nodeGradient.addColorStop(1, TEAL);

      ctx!.fillStyle = nodeGradient;
      ctx!.fill();

      // White border
      ctx!.strokeStyle = isHovered ? "#fff" : "rgba(255, 255, 255, 0.6)";
      ctx!.lineWidth = isHovered ? 2.5 : 1.5;
      ctx!.stroke();

      // Label
      const fontSize = i === 0 ? 11 : 9;
      ctx!.font = `${isHovered ? 600 : 500} ${fontSize}px Inter, sans-serif`;
      ctx!.textAlign = "center";
      ctx!.textBaseline = "middle";

      // Label background
      const label =
        node.label.length > 18
          ? node.label.substring(0, 16) + "..."
          : node.label;
      const textWidth = ctx!.measureText(label).width;
      const labelY = node.y + drawRadius + 14;

      ctx!.fillStyle = "rgba(250, 251, 252, 0.9)";
      ctx!.beginPath();
      roundRect(
        ctx!,
        node.x - textWidth / 2 - 6,
        labelY - 8,
        textWidth + 12,
        16,
        4,
      );
      ctx!.fill();

      ctx!.fillStyle = isHovered ? TEAL : "#536471";
      ctx!.fillText(label, node.x, labelY);
    }
  }

  function roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number,
  ) {
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
  }

  function animate() {
    if (isVisible) {
      update();
      draw();
    }
    animationId = requestAnimationFrame(animate);
  }

  // Mouse interaction
  canvas.addEventListener("mousemove", (e) => {
    const rect = canvas!.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    hoveredNode = -1;

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const dx = mx - node.x;
      const dy = my - node.y;
      if (dx * dx + dy * dy < (node.radius + 10) * (node.radius + 10)) {
        hoveredNode = i;
        break;
      }
    }

    if (hoveredNode >= 0) {
      const node = nodes[hoveredNode];
      canvas!.style.cursor = "pointer";

      const titleEl = tooltip!.querySelector(".node-tooltip-title")!;
      const elemsEl = tooltip!.querySelector(".node-tooltip-elements")!;
      titleEl.textContent = node.label;
      elemsEl.textContent = node.elements.join(", ");

      const wrapperRect = canvas!.parentElement!.getBoundingClientRect();
      tooltip!.style.left = `${node.x + node.radius + 12}px`;
      tooltip!.style.top = `${node.y - 20}px`;

      // Keep tooltip in bounds
      const tooltipRect = tooltip!.getBoundingClientRect();
      if (tooltipRect.right > wrapperRect.right) {
        tooltip!.style.left = `${node.x - node.radius - tooltipRect.width - 12}px`;
      }

      tooltip!.classList.add("active");
    } else {
      canvas!.style.cursor = "default";
      tooltip!.classList.remove("active");
    }
  });

  canvas.addEventListener("mouseleave", () => {
    hoveredNode = -1;
    tooltip!.classList.remove("active");
    canvas!.style.cursor = "default";
  });

  // Visibility observer — pause animation when off-screen
  const visObserver = new IntersectionObserver(
    ([entry]) => {
      isVisible = entry.isIntersecting;
    },
    { threshold: 0 },
  );
  visObserver.observe(canvas);

  // Init
  resize();
  window.addEventListener("resize", resize);
  animate();
}
