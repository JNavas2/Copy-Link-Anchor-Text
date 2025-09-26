/*
 * File: content.js of Copy Link Anchor Text extension for Firefox
 * Description: Handles copy mode UI, listens for desktop context menu/Android tap events,
 * extracts anchor text, copies to clipboard, and shows toast notifications.
 * Copyright © 2025 John Navas, All Rights Reserved.
 */

console.log("content.js loaded");

// Toast UI
function showToast(text) {
  console.log("Toast:", text);
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

browser.runtime.onMessage.addListener(msg => {
  console.log("Received message:", msg);

  if (msg.action === "copyLinkTextByUrl" && msg.linkUrl) {
    const anchorText = findAnchorTextByUrl(msg.linkUrl);
    if (anchorText) {
      copyToClipboard(anchorText);
    } else {
      showToast("Not a Link!");
    }
    return;
  }

  if (msg.action === "triggerCopyModeOnce") {
    showToast("Copy Mode ON");
    const handler = e => {
      const link = e.target.closest("a");
      if (link) {
        e.preventDefault();
        copyToClipboard(getAnchorText(link));
        showToast("Link Anchor Text COPIED");
        document.removeEventListener("click", handler, true);
      } else {
        showToast("Not a Link!");
        document.removeEventListener("click", handler, true);
      }
    };
    document.addEventListener("click", handler, true);
  }
});
