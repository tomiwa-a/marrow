// Preview tabs + copy buttons

export function initPreview(): void {
  const tabs = document.querySelectorAll(".preview-tab");
  const panels = document.querySelectorAll(".preview-code");
  const copyBtn = document.querySelector(
    ".preview-copy",
  ) as HTMLButtonElement | null;

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const tabId = (tab as HTMLElement).dataset.tab;

      tabs.forEach((t) => t.classList.remove("active"));
      panels.forEach((p) => p.classList.remove("active"));

      tab.classList.add("active");
      document
        .querySelector(`[data-panel="${tabId}"]`)
        ?.classList.add("active");
    });
  });

  // Copy button for preview
  if (copyBtn) {
    const btn = copyBtn;
    btn.addEventListener("click", () => {
      const activePanel = document.querySelector(".preview-code.active");
      if (!activePanel) return;

      const text = activePanel.textContent || "";
      navigator.clipboard.writeText(text).then(() => {
        btn.textContent = "Copied!";
        btn.classList.add("copied");
        setTimeout(() => {
          btn.textContent = "Copy";
          btn.classList.remove("copied");
        }, 2000);
      });
    });
  }

  // Quick start copy button
  document.querySelectorAll(".qs-copy-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const codeBlock =
        btn.closest(".qs-code-window")?.querySelector("pre") ??
        btn.parentElement?.querySelector("code");
      if (!codeBlock) return;

      const text = codeBlock.textContent || "";
      navigator.clipboard.writeText(text).then(() => {
        (btn as HTMLElement).textContent = "Copied!";
        btn.classList.add("copied");
        setTimeout(() => {
          (btn as HTMLElement).textContent = "Copy";
          btn.classList.remove("copied");
        }, 2000);
      });
    });
  });
}
