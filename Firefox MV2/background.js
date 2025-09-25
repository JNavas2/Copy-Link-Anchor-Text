/*
 * File: background.js of Copy Link Anchor Text extension for Firefox
 * Description: Manages global copy mode, onboarding, context menu (desktop), and communication with content scripts.
 * Copyright © 2025 John Navas, All Rights Reserved.
 */

let copyMode = true; // default ON for Android convenience

// On install/update → show options page
browser.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === "install" || reason === "update") {
    browser.runtime.openOptionsPage();
  }
});

// Add context menu only on desktop
browser.runtime.getPlatformInfo().then(({ os }) => {
  if (os !== "android") {
    browser.contextMenus.create({
      id: "copy-link-text",
      title: "Copy Link Anchor Text",
      contexts: ["link"]
    });
  }
});

// Handle context menu clicks (desktop only)
browser.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "copy-link-text" && info.linkUrl) {
    browser.tabs.sendMessage(tab.id, {
      action: "copyLinkTextByUrl",
      linkUrl: info.linkUrl
    }).catch(() => {});
  }
});

// Toggle copy mode
function toggleCopyMode() {
  copyMode = !copyMode;
  notifyContentScripts();
}

browser.browserAction?.onClicked.addListener(toggleCopyMode);
browser.commands.onCommand.addListener(command => {
  if (command === "toggle-copy-mode") toggleCopyMode();
});

// Respond to queries from content scripts
browser.runtime.onMessage.addListener(msg => {
  if (msg.action === "getCopyMode") return Promise.resolve(copyMode);
});

// Push updates to content scripts
function notifyContentScripts() {
  browser.tabs.query({}).then(tabs => {
    for (const tab of tabs) {
      browser.tabs.sendMessage(tab.id, { action: "toggleCopyMode", state: copyMode }).catch(() => {});
    }
  });
}
