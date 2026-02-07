// Navbar — scroll behavior + mobile full-screen overlay

export function initNavbar(): void {
  const navbar = document.getElementById("navbar");
  const toggle = document.getElementById("nav-toggle");
  const links = document.getElementById("nav-links");

  if (!navbar) return;

  // Scroll — frosted glass effect
  let ticking = false;
  window.addEventListener("scroll", () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        navbar.classList.toggle("scrolled", window.scrollY > 10);
        ticking = false;
      });
      ticking = true;
    }
  });

  // Mobile toggle — full-screen overlay
  toggle?.addEventListener("click", () => {
    const isOpen = links?.classList.toggle("open");
    toggle.classList.toggle("active", isOpen);
    document.body.style.overflow = isOpen ? "hidden" : "";
  });

  // Close mobile menu on link click
  links?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      links.classList.remove("open");
      toggle?.classList.remove("active");
      document.body.style.overflow = "";
    });
  });

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", (e) => {
      const href = (anchor as HTMLAnchorElement).getAttribute("href");
      if (!href || href === "#") return;

      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        const navbarHeight = navbar.getBoundingClientRect().height;
        const targetTop =
          (target as HTMLElement).getBoundingClientRect().top +
          window.scrollY -
          navbarHeight;
        window.scrollTo({
          top: targetTop,
          behavior: "smooth",
        });
      }
    });
  });

  // Close mobile nav on escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && links?.classList.contains("open")) {
      links.classList.remove("open");
      toggle?.classList.remove("active");
      document.body.style.overflow = "";
    }
  });
}
