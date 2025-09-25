/*
 * File: background.js of Copy Link Anchor Text extension for Firefox
 * Description: Handles context menu creation, click events, toggling copy mode, and onboarding options page.
 * Copyright © 2025 John Navas, All Rights Reserved.
 */

let copyMode = false;

// Show options page on install or update as onboarding
browser.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === "install" || reason === "update") {
    browser.runtime.openOptionsPage();
  }
});

// Create context menu only on non-Android platforms
browser.runtime.getPlatformInfo().then(({ os }) => {
  if (os !== "android") {
    browser.contextMenus.create({
      id: "copy-link-text",
      title: "Copy Link Anchor Text",
      contexts: ["link"]
    });
  }
});

browser.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "copy-link-text" && info.linkUrl) {
    browser.tabs.sendMessage(tab.id, {
      action: "copyLinkTextByUrl",
      linkUrl: info.linkUrl
    });
  }
});

browser.browserAction.onClicked.addListener(async () => {
  copyMode = !copyMode;
  const tabs = await browser.tabs.query({ active: true, currentWindow: true });
  for (const tab of tabs) {
    browser.tabs.sendMessage(tab.id, { action: "toggleCopyMode", state: copyMode });
  }
});

// On Android, activate copy mode on extension startup
browser.runtime.onStartup.addListener(async () => {
  copyMode = true;
  const tabs = await browser.tabs.query({ active: true, currentWindow: true });
  for (const tab of tabs) {
    browser.tabs.sendMessage(tab.id, { action: "toggleCopyMode", state: copyMode });
  }
});
