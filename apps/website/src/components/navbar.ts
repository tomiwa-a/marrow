// Navbar scroll behavior + mobile toggle

export function initNavbar(): void {
  const navbar = document.getElementById("navbar");
  const toggle = document.getElementById("nav-toggle");
  const links = document.getElementById("nav-links");

  if (!navbar) return;

  // Scroll — add .scrolled class
  let ticking = false;
  window.addEventListener("scroll", () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        navbar.classList.toggle("scrolled", window.scrollY > 20);
        ticking = false;
      });
      ticking = true;
    }
  });

  // Mobile toggle
  toggle?.addEventListener("click", () => {
    links?.classList.toggle("open");
  });

  // Close mobile menu on link click
  links?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      links.classList.remove("open");
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
        const offsetTop = (target as HTMLElement).offsetTop - 80;
        window.scrollTo({
          top: offsetTop,
          behavior: "smooth",
        });
      }
    });
  });
}
