// Preview tabs + copy buttons

// Fallback copy method for environments where Clipboard API is not available
function fallbackCopyText(text: string): boolean {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.position = "fixed";
  textArea.style.left = "-999999px";
  textArea.style.top = "-999999px";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  
  try {
    const successful = document.execCommand("copy");
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    document.body.removeChild(textArea);
    return false;
  }
}

// Copy text to clipboard with fallback support
async function copyToClipboard(text: string): Promise<boolean> {
  // Try modern Clipboard API first
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      // Fall back to execCommand if Clipboard API fails
      console.warn("Clipboard API failed, trying fallback method:", err);
      return fallbackCopyText(text);
    }
  }
  
  // Use fallback for environments without Clipboard API
  return fallbackCopyText(text);
}

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
  copyBtn?.addEventListener("click", async () => {
    const activePanel = document.querySelector(".preview-code.active");
    if (!activePanel) return;

    const text = activePanel.textContent || "";
    const success = await copyToClipboard(text);
    
    if (success) {
      copyBtn.textContent = "Copied!";
      copyBtn.classList.add("copied");
      setTimeout(() => {
        copyBtn.textContent = "Copy";
        copyBtn.classList.remove("copied");
      }, 2000);
    } else {
      copyBtn.textContent = "Failed!";
      copyBtn.classList.add("error");
      setTimeout(() => {
        copyBtn.textContent = "Copy";
        copyBtn.classList.remove("error");
      }, 2000);
    }
  });

  // Quick start copy button
  document.querySelectorAll(".qs-copy-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const codeBlock =
        btn.closest(".qs-code-window")?.querySelector("pre") ??
        btn.parentElement?.querySelector("code");
      if (!codeBlock) return;

      const text = codeBlock.textContent || "";
      const success = await copyToClipboard(text);
      
      if (success) {
        (btn as HTMLElement).textContent = "Copied!";
        btn.classList.add("copied");
        setTimeout(() => {
          (btn as HTMLElement).textContent = "Copy";
          btn.classList.remove("copied");
        }, 2000);
      } else {
        (btn as HTMLElement).textContent = "Failed!";
        btn.classList.add("error");
        setTimeout(() => {
          (btn as HTMLElement).textContent = "Copy";
          btn.classList.remove("error");
        }, 2000);
      }
    });
  });
}
