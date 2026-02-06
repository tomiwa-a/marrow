// Styles
import "./styles/reset.css";
import "./styles/variables.css";
import "./styles/navbar.css";
import "./styles/hero.css";
import "./styles/problem-solution.css";
import "./styles/how-it-works.css";
import "./styles/architecture.css";
import "./styles/live-preview.css";
import "./styles/use-cases.css";
import "./styles/quickstart.css";
import "./styles/footer.css";

// Components
import { initNavbar } from "./components/navbar";
import { initNodeGraph } from "./components/node-graph";
import { initScrollAnimations } from "./components/observer";
import { initPreview } from "./components/preview";

// Initialize everything when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  initNavbar();
  initNodeGraph();
  initScrollAnimations();
  initPreview();
});
