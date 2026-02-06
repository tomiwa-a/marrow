// Hero canvas animation — data flow visualization
// Shows website data flowing through a pipeline into a shared registry

interface DataPacket {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  speed: number;
  size: number;
  opacity: number;
  color: string;
  label: string;
  phase: "entering" | "processing" | "stored";
  progress: number;
}

interface RegistryRow {
  domain: string;
  elements: number;
  opacity: number;
  y: number;
}

const TEAL = "#0D9488";
const TEAL_LIGHT = "#14B8A6";
const TEAL_DIM = "rgba(13, 148, 136, 0.3)";
const TEXT_DIM = "rgba(255, 255, 255, 0.3)";
const TEXT_MED = "rgba(255, 255, 255, 0.5)";
const TEXT_BRIGHT = "rgba(255, 255, 255, 0.8)";
const BG_DARK = "#18181B";
const BG_CARD = "rgba(255, 255, 255, 0.04)";
const BORDER = "rgba(255, 255, 255, 0.06)";

const DOMAINS = [
  { label: "linkedin.com/jobs", short: "linkedin.com", elements: 24 },
  { label: "github.com/issues", short: "github.com", elements: 18 },
  { label: "stripe.com/docs", short: "stripe.com", elements: 31 },
  { label: "news.ycombinator.com", short: "ycombinator", elements: 12 },
  { label: "twitter.com/home", short: "twitter.com", elements: 22 },
  { label: "reddit.com/r/all", short: "reddit.com", elements: 16 },
  { label: "instagram.com/dm", short: "instagram", elements: 19 },
  { label: "amazon.com/search", short: "amazon.com", elements: 28 },
];

export function initDataFlow(): void {
  const canvas = document.getElementById(
    "hero-canvas",
  ) as HTMLCanvasElement | null;

  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  let width = 0;
  let height = 0;
  let packets: DataPacket[] = [];
  let rows: RegistryRow[] = [];
  let frameCount = 0;
  let isVisible = true;
  let isMobile = false;

  function resize(): void {
    const wrapper = canvas!.parentElement!;
    const rect = wrapper.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    width = rect.width;
    height = rect.height;
    canvas!.width = width * dpr;
    canvas!.height = height * dpr;
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    isMobile = width < 400;
    initRows();
  }

  function initRows(): void {
    const dbY = height * 0.15;
    const rowH = Math.min(32, height * 0.08);
    const maxRows = isMobile ? 4 : Math.min(6, Math.floor((height * 0.7) / rowH));

    rows = DOMAINS.slice(0, maxRows).map(
      (d, i) => ({
        domain: isMobile ? d.short : d.label,
        elements: d.elements,
        opacity: 0.5 + Math.random() * 0.5,
        y: dbY + 40 + i * rowH,
      }),
    );
  }

  function spawnPacket(): void {
    const domain = DOMAINS[Math.floor(Math.random() * DOMAINS.length)];
    const startSide = Math.random() > 0.5 ? "left" : "top";

    const startX =
      startSide === "left" ? -20 : width * 0.1 + Math.random() * width * 0.25;
    const startY =
      startSide === "left" ? height * 0.2 + Math.random() * height * 0.5 : -20;

    const dbX = width * 0.55;
    const dbY = height * 0.15 + Math.random() * height * 0.5;

    packets.push({
      x: startX,
      y: startY,
      targetX: dbX - 10,
      targetY: dbY,
      speed: 0.003 + Math.random() * 0.004,
      size: 3 + Math.random() * 3,
      opacity: 0.6 + Math.random() * 0.4,
      color: Math.random() > 0.3 ? TEAL_LIGHT : "#67E8F9",
      label: domain.label,
      phase: "entering",
      progress: 0,
    });
  }

  function drawDatabase(): void {
    if (!ctx) return;

    const dbX = width * 0.5;
    const dbW = width * 0.44;
    const dbY = height * 0.08;
    const dbH = height * 0.84;
    const r = 12;

    // Database container
    ctx.beginPath();
    ctx.roundRect(dbX, dbY, dbW, dbH, r);
    ctx.fillStyle = BG_CARD;
    ctx.fill();
    ctx.strokeStyle = BORDER;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Header bar
    ctx.fillStyle = "rgba(255, 255, 255, 0.02)";
    ctx.beginPath();
    ctx.roundRect(dbX, dbY, dbW, 36, [r, r, 0, 0]);
    ctx.fill();

    // Header separator
    ctx.beginPath();
    ctx.moveTo(dbX, dbY + 36);
    ctx.lineTo(dbX + dbW, dbY + 36);
    ctx.strokeStyle = BORDER;
    ctx.stroke();

    // Header text
    ctx.fillStyle = TEXT_MED;
    const headerFont = isMobile ? 9 : 11;
    ctx.font = `500 ${headerFont}px 'Geist Mono', monospace`;
    ctx.fillText("DOMAIN", dbX + 12, dbY + 23);
    ctx.fillText("ELEMENTS", dbX + dbW - (isMobile ? 64 : 80), dbY + 23);

    // Database icon in header
    ctx.fillStyle = TEAL_DIM;
    ctx.beginPath();
    ctx.ellipse(dbX + dbW - 24, dbY + 18, 6, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(dbX + dbW - 30, dbY + 18);
    ctx.lineTo(dbX + dbW - 30, dbY + 24);
    ctx.arc(dbX + dbW - 24, dbY + 24, 6, Math.PI, 0, true);
    ctx.lineTo(dbX + dbW - 18, dbY + 18);
    ctx.fillStyle = "rgba(13, 148, 136, 0.15)";
    ctx.fill();

    // Data rows
    const rowH = Math.min(32, (dbH - 50) / rows.length);
    rows.forEach((row, i) => {
      const ry = dbY + 44 + i * rowH;
      row.y = ry;

      // Subtle row hover effect (pulsing)
      const pulse = Math.sin(frameCount * 0.02 + i * 0.8) * 0.02;
      if (pulse > 0) {
        ctx!.fillStyle = `rgba(13, 148, 136, ${pulse})`;
        ctx!.fillRect(dbX + 1, ry, dbW - 2, rowH - 2);
      }

      // Row separator
      if (i < rows.length - 1) {
        ctx!.beginPath();
        ctx!.moveTo(dbX + 12, ry + rowH - 1);
        ctx!.lineTo(dbX + dbW - 12, ry + rowH - 1);
        ctx!.strokeStyle = BORDER;
        ctx!.stroke();
      }

      // Domain name
      ctx!.fillStyle = row.opacity > 0.8 ? TEXT_BRIGHT : TEXT_MED;
      const domainFont = isMobile ? 10 : 12;
      ctx!.font = `400 ${domainFont}px 'Geist Mono', monospace`;
      ctx!.fillText(row.domain, dbX + (isMobile ? 12 : 16), ry + rowH / 2 + 4);

      // Element count badge
      const badgeText = `${row.elements}`;
      const badgeW = ctx!.measureText(badgeText).width + 16;
      const badgeX = dbX + dbW - badgeW - 16;
      const badgeY = ry + rowH / 2 - 8;

      ctx!.fillStyle = "rgba(13, 148, 136, 0.1)";
      ctx!.beginPath();
      ctx!.roundRect(badgeX, badgeY, badgeW, 16, 8);
      ctx!.fill();

      ctx!.fillStyle = TEAL;
      ctx!.font = `500 10px 'Geist Mono', monospace`;
      ctx!.fillText(badgeText, badgeX + 8, badgeY + 12);
    });

    // Registry label at bottom
    ctx.fillStyle = TEXT_DIM;
    ctx.font = `500 10px 'Geist Mono', monospace`;
    ctx.textAlign = "center";
    ctx.fillText("SHARED REGISTRY", dbX + dbW / 2, dbY + dbH - 10);
    ctx.textAlign = "left";
  }

  function drawPipelineLabel(): void {
    if (!ctx) return;

    const x = width * 0.05;
    const y = height * 0.12;

    // "Websites" label
    ctx.fillStyle = TEXT_DIM;
    ctx.font = `500 10px 'Geist Mono', monospace`;
    ctx.textAlign = "left";
    ctx.fillText("INCOMING PAGES", x, y);

    // Subtle arrow
    const arrowY = height * 0.5;
    const arrowStartX = width * 0.28;
    const arrowEndX = width * 0.47;

    ctx.beginPath();
    ctx.moveTo(arrowStartX, arrowY);
    ctx.lineTo(arrowEndX, arrowY);
    ctx.strokeStyle = TEAL_DIM;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Arrow head
    ctx.beginPath();
    ctx.moveTo(arrowEndX, arrowY);
    ctx.lineTo(arrowEndX - 6, arrowY - 4);
    ctx.lineTo(arrowEndX - 6, arrowY + 4);
    ctx.closePath();
    ctx.fillStyle = TEAL_DIM;
    ctx.fill();

    // "AI Mapper" label in middle
    ctx.fillStyle = TEXT_DIM;
    ctx.font = `500 9px 'Geist Mono', monospace`;
    ctx.textAlign = "center";
    ctx.fillText("MARROW", (arrowStartX + arrowEndX) / 2, arrowY - 10);
    ctx.textAlign = "left";
  }

  function drawPackets(): void {
    if (!ctx) return;

    packets.forEach((p) => {
      p.progress += p.speed;

      if (p.progress >= 1) {
        p.phase = "stored";
      }

      // Ease-out interpolation
      const t = 1 - Math.pow(1 - Math.min(p.progress, 1), 3);
      p.x = p.x + (p.targetX - p.x) * t * 0.05;
      p.y = p.y + (p.targetY - p.y) * t * 0.05;

      // Fade out when stored
      const alpha =
        p.phase === "stored"
          ? Math.max(0, p.opacity - p.progress * 0.5)
          : p.opacity;

      if (alpha <= 0) return;

      // Glow
      const gradient = ctx!.createRadialGradient(
        p.x,
        p.y,
        0,
        p.x,
        p.y,
        p.size * 4,
      );
      gradient.addColorStop(0, `rgba(13, 148, 136, ${alpha * 0.4})`);
      gradient.addColorStop(1, "rgba(13, 148, 136, 0)");
      ctx!.fillStyle = gradient;
      ctx!.fillRect(p.x - p.size * 4, p.y - p.size * 4, p.size * 8, p.size * 8);

      // Core dot
      ctx!.beginPath();
      ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx!.fillStyle = p.color;
      ctx!.globalAlpha = alpha;
      ctx!.fill();
      ctx!.globalAlpha = 1;

      // Label (only for larger, more visible packets)
      if (p.size > 4 && p.progress < 0.5 && p.x > 20 && p.x < width * 0.4) {
        ctx!.fillStyle = `rgba(255, 255, 255, ${alpha * 0.5})`;
        ctx!.font = `400 9px 'Geist Mono', monospace`;
        ctx!.fillText(p.label, p.x + p.size + 6, p.y + 3);
      }
    });

    // Remove dead packets
    packets = packets.filter(
      (p) => p.progress < 1.5 && p.x < width + 20 && p.y < height + 20,
    );
  }

  function drawScanlines(): void {
    if (!ctx) return;

    // Subtle scan lines for depth
    for (let y = 0; y < height; y += 3) {
      ctx.fillStyle = `rgba(0, 0, 0, ${0.03 + Math.sin(y * 0.01 + frameCount * 0.005) * 0.01})`;
      ctx.fillRect(0, y, width, 1);
    }
  }

  function draw(): void {
    if (!ctx || !isVisible) {
      requestAnimationFrame(draw);
      return;
    }

    frameCount++;

    // Clear
    ctx.fillStyle = BG_DARK;
    ctx.fillRect(0, 0, width, height);

    drawScanlines();
    drawPipelineLabel();
    drawDatabase();
    drawPackets();

    // Spawn new packets periodically
    if (frameCount % 30 === 0) {
      spawnPacket();
    }

    // Keep a reasonable number of packets
    if (packets.length > 15) {
      packets = packets.slice(-15);
    }

    requestAnimationFrame(draw);
  }

  // Visibility observer
  const observer = new IntersectionObserver(
    ([entry]) => {
      isVisible = entry.isIntersecting;
    },
    { threshold: 0.1 },
  );

  if (canvas.parentElement) {
    observer.observe(canvas.parentElement);
  }

  // Init
  resize();
  window.addEventListener("resize", resize);

  // Spawn initial packets
  for (let i = 0; i < 5; i++) {
    spawnPacket();
  }

  draw();
}
