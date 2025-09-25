/*
 * File: content.js of Copy Link Anchor Text extension for Firefox
 * Description: Content script manages copy mode, listens for background messages, copies anchor text to clipboard, shows toasts.
 * Copyright © 2025 John Navas, All Rights Reserved.
 */

let copyMode = false;
let persistentMode = false;

browser.storage.sync.get("persistentMode", data => {
  persistentMode = data.persistentMode || false;
});

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

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    showToast("Link Anchor Text COPIED");
  }).catch(() => {
    showToast("Failed to copy!");
  });
}

function findAnchorTextByUrl(url) {
  const anchors = document.querySelectorAll(`a[href]`);
  for (const anchor of anchors) {
    let aHref = anchor.href;
    if (aHref.endsWith("/")) aHref = aHref.slice(0, -1);
    let givenUrl = url;
    if (givenUrl.endsWith("/")) givenUrl = givenUrl.slice(0, -1);

    if (aHref === givenUrl) {
      let text = anchor.textContent.trim();
      if (!text) {
        text = anchor.getAttribute("aria-label") || anchor.title || "";
        text = text.trim();
      }
      if (!text) {
        const img = anchor.querySelector("img[alt]");
        if (img) text = img.alt.trim();
      }
      if (!text) {
        text = anchor.href;
      }
      return text || "(No Text)";
    }
  }
  return null;
}

browser.runtime.onMessage.addListener((msg) => {
  if (msg.action === "copyLinkTextByUrl") {
    if (msg.linkUrl) {
      const anchorText = findAnchorTextByUrl(msg.linkUrl);
      if (anchorText !== null) {
        copyToClipboard(anchorText);
      } else {
        showToast("Not a Link!");
      }
    } else {
      showToast("Not a Link!");
    }
  }

  if (msg.action === "toggleCopyMode") {
    copyMode = msg.state;
    showToast(copyMode ? "Copy Link Anchor Text ON" : "Copy Link Anchor Text OFF");
  }
});

document.addEventListener("click", (e) => {
  if (!copyMode) return;

  let link = e.target.closest("a");
  if (link) {
    e.preventDefault();
    const anchorText = (() => {
      let text = link.textContent.trim();
      if (!text) {
        text = link.getAttribute("aria-label") || link.title || "";
        text = text.trim();
      }
      if (!text) {
        const img = link.querySelector("img[alt]");
        if (img) text = img.alt.trim();
      }
      if (!text) {
        text = link.href;
      }
      return text || "(No Text)";
    })();

    copyToClipboard(anchorText);
    if (!persistentMode) {
      copyMode = false;
      showToast("Copy Link Anchor Text OFF");
    }
  } else {
    showToast("Not a Link!");
  }
}, true);
