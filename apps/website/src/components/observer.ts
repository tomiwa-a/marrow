// Scroll animation observer — adds .visible class when elements enter viewport
export function initScrollAnimations(): void {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion) {
    // Immediately show all animated elements
    document.querySelectorAll('[data-animate]').forEach(el => {
      el.classList.add('visible');
    });
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // Add stagger index for children
          const parent = entry.target.parentElement;
          if (parent?.hasAttribute('data-stagger')) {
            const children = Array.from(parent.querySelectorAll('[data-animate]'));
            const index = children.indexOf(entry.target as Element);
            (entry.target as HTMLElement).style.setProperty('--stagger-index', String(index));
          }

          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.1,
      rootMargin: '0px 0px -40px 0px',
    }
  );

  document.querySelectorAll('[data-animate]').forEach((el) => {
    observer.observe(el);
  });
}
