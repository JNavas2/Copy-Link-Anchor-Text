/*
 * File: content.js of Copy Link Anchor Text extension for Firefox
 * Description: Handles copy mode UI, listens for desktop context menu/Android tap events,
 * extracts anchor text, copies to clipboard, and shows toast notifications.
 * Copyright © 2025 John Navas, All Rights Reserved.
 */

let copyMode = false;
let persistentMode = false;

// Load saved setting + initial copy mode state
browser.storage.local.get("persistentMode").then(data => {
  persistentMode = data.persistentMode || false;
});
browser.runtime.sendMessage({ action: "getCopyMode" }).then(state => {
  copyMode = state;
});

// Toast UI
function showToast(text) {
  const toast = document.createElement("div");
  toast.textContent = text;
  Object.assign(toast.style, {
    position: "fixed",
    bottom: "20px",
    left: "50%",
    transform: "translateX(-50%)",
    background: "#333",
    color: "#fff",
    padding: "6px 12px",
    borderRadius: "4px",
    zIndex: 999999,
    fontSize: "14px"
  });
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 1500);
}

// Clipboard write (with fallback for Android restrictions)
function copyToClipboard(text) {
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

// Extract readable link text
function getAnchorText(link) {
  let text = link.textContent.trim();
  if (!text) text = link.getAttribute("aria-label") || link.title || "";
  if (!text) {
    const img = link.querySelector("img[alt]");
    if (img) text = img.alt.trim();
  }
  return text || link.href || "(No Text)";
}

// Find anchor element by URL for context menu requests
function findAnchorTextByUrl(url) {
  const anchors = document.querySelectorAll("a[href]");
  for (const anchor of anchors) {
    let href = anchor.href.replace(/\/$/, "");
    let given = url.replace(/\/$/, "");
    if (href === given) {
      return getAnchorText(anchor);
    }
  }
  return null;
}

// Handle messages from background.js
browser.runtime.onMessage.addListener(msg => {
  if (msg.action === "toggleCopyMode") {
    copyMode = msg.state;
    showToast(copyMode ? "Copy Mode ON" : "Copy Mode OFF");
  } else if (msg.action === "copyLinkTextByUrl" && msg.linkUrl) {
    const anchorText = findAnchorTextByUrl(msg.linkUrl);
    if (anchorText) {
      copyToClipboard(anchorText);
    } else {
      showToast("Not a Link!");
    }
  }
});

// Tap-to-copy mode (Android + Desktop toolbar toggle)
document.addEventListener("click", e => {
  if (!copyMode) return;
  const link = e.target.closest("a");
  if (link) {
    e.preventDefault();
    copyToClipboard(getAnchorText(link));
    if (!persistentMode) {
      copyMode = false;
      showToast("Copy Mode OFF");
    }
  } else {
    showToast("Not a Link!");
  }
}, true);
