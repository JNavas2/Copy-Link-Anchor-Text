/*
 * File: content.js of Copy Link Anchor Text extension for Firefox
 * Description: Handles copy mode UI, listens for desktop context menu/Android tap events,
 * extracts anchor text, copies to clipboard, and shows toast notifications.
 * Copyright © 2025 John Navas, All Rights Reserved.
 */

console.log("content.js loaded");

let lastRightClickedElement = null;
let persistentCopyHandler = null; // State for the persistent mode toggle

// Listen for right-clicks to accurately identify the context menu target
document.addEventListener("contextmenu", event => {
  lastRightClickedElement = event.target;
}, true);

// Toast UI
function showToast(text) {
  console.log("Toast:", text);

  const toast = document.createElement("div");
  toast.style.position = "fixed";
  toast.style.bottom = "80px"; // closer to Android's toast position
  toast.style.left = "50%";
  toast.style.transform = "translateX(-50%)";
  toast.style.background = "#e0e0e0"; // light grey background
  toast.style.color = "#000"; // black text
  toast.style.padding = "8px 16px";
  toast.style.borderRadius = "24px"; // ovaled ends
  toast.style.zIndex = 999999;
  toast.style.fontSize = "14px";
  toast.style.display = "inline-flex";
  toast.style.alignItems = "center";
  toast.style.boxShadow = "0 2px 6px rgba(0,0,0,0.2)";

  // Extension icon
  const icon = document.createElement("img");
  icon.src = browser.runtime.getURL("images/icon-32.png");
  icon.style.width = "20px";
  icon.style.height = "20px";
  icon.style.marginRight = "8px";

  // Text node
  const message = document.createElement("span");
  message.textContent = text;

  toast.appendChild(icon);
  toast.appendChild(message);
  document.body.appendChild(toast);

  // Timed removal with fade-out
  setTimeout(() => {
    toast.style.transition = "opacity 0.3s ease";
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, 1500);
}


function copyToClipboard(text) {
  console.log("Attempting to copy text:", text);
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).then(
      () => showToast("Link Anchor Text COPIED"),
      () => fallbackCopy(text)
    );
  } else {
    fallbackCopy(text);
  }
}

function fallbackCopy(text) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  try {
    document.execCommand("copy");
    showToast("Link Anchor Text COPIED");
  } catch {
    showToast("Failed to copy!");
  }
  document.body.removeChild(textarea);
}

function getAnchorText(link) {
  let text = link.textContent.trim();
  if (!text) text = link.getAttribute("aria-label") || link.title || "";
  if (!text) {
    const img = link.querySelector("img[alt]");
    if (img) text = img.alt.trim();
  }
  return text || link.href || "(No Text)";
}

// Normalization helper to make URL comparisons more robust
function normalizeUrl(u) {
  try {
    const url = new URL(u, document.baseURI);
    url.hash = ""; // Drop fragment identifiers (#...)
    // Remove trailing slash for consistency, but only if not root path
    if (url.pathname !== "/" && url.pathname.endsWith("/")) {
      url.pathname = url.pathname.slice(0, -1);
    }
    return url.href;
  } catch {
    return u;
  }
}

function findAnchorTextByUrl(url) {
  const given = normalizeUrl(url);
  const anchors = document.querySelectorAll("a[href]");
  for (const anchor of anchors) {
    if (normalizeUrl(anchor.href) === given) {
      return getAnchorText(anchor);
    }
  }
  return null;
}

browser.runtime.onMessage.addListener(msg => {
  console.log("Received message:", msg);

  if (msg.action === "copyLinkTextByUrl" && msg.linkUrl) {
    const linkElement = lastRightClickedElement ? lastRightClickedElement.closest("a") : null;

    if (linkElement && normalizeUrl(linkElement.href) === normalizeUrl(msg.linkUrl)) {
      copyToClipboard(getAnchorText(linkElement));
    } else {
      const anchorText = findAnchorTextByUrl(msg.linkUrl);
      if (anchorText) {
        copyToClipboard(anchorText);
      } else {
        showToast("Could not find link!");
      }
    }
  } else if (msg.action === "triggerCopyModeOnce") {
    // If a persistent handler is already active, this click is a toggle to turn it OFF.
    if (persistentCopyHandler) {
      document.removeEventListener("click", persistentCopyHandler, true);
      persistentCopyHandler = null;
      showToast("Copy Mode OFF");
      return;
    }

    // Otherwise, this is a request to turn the mode ON.
    // We check storage to see if it should be persistent or one-time.
    browser.storage.local.get("persistentMode").then(data => {
      const isPersistent = data.persistentMode || false;

      const handler = e => {
        const link = e.target.closest("a");
        if (link) {
          e.preventDefault();
          copyToClipboard(getAnchorText(link));
        } else {
          showToast("Not a Link!");
        }

        // If not persistent, the listener removes itself after one click.
        if (!isPersistent) {
          document.removeEventListener("click", handler, true);
        }
      };

      document.addEventListener("click", handler, true);
      showToast("Copy Mode ON");

      // If persistent, store the handler so the next toggle can remove it.
      if (isPersistent) {
        persistentCopyHandler = handler;
      }
    });
  }
});