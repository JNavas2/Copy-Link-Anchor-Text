/*
 * File: background.js of Copy Link Anchor Text extension for Firefox
 * Description: Manages global copy mode, onboarding, context menu (desktop),
 * and communication with content scripts. Supports cross-platform activation.
 * Copyright © 2025 John Navas, All Rights Reserved.
 */

console.log("background.js loading");

browser.runtime.getPlatformInfo().then(({ os }) => {
  console.log("Platform OS:", os);

  // Guard contextMenus usage — it is NOT supported on Firefox Android.
  if (os !== "android" && browser.contextMenus) {
    browser.contextMenus.create({
      id: "copy-link-text",
      title: "Copy Link Anchor Text",
      contexts: ["link"]
    });
    console.log("Context menu created for desktop");

    browser.contextMenus.onClicked.addListener((info, tab) => {
      console.log("Context menu clicked:", info.menuItemId, info.linkUrl);
      if (info.menuItemId === "copy-link-text" && info.linkUrl && tab.id !== undefined) {
        browser.tabs.sendMessage(tab.id, {
          action: "copyLinkTextByUrl",
          linkUrl: info.linkUrl
        }).catch(() => {
          console.warn("Failed to send context menu message to tab", tab.id);
        });
      }
    });
  } else {
    console.log("Context menu not available on this platform");
  }
});

browser.runtime.onInstalled.addListener(({ reason }) => {
  console.log("runtime.onInstalled event. Reason:", reason);
  if (reason === "install" || reason === "update") {
    browser.runtime.openOptionsPage();
  }
});

browser.browserAction.onClicked.addListener(tab => {
  console.log("browserAction.onClicked for tab", tab.id);
  browser.tabs.sendMessage(tab.id, { action: "triggerCopyModeOnce" }).catch(() => {
    console.warn("Failed to send triggerCopyModeOnce message");
  });
});

browser.commands.onCommand.addListener(command => {
  console.log("command received:", command);
  if (command === "toggle-copy-mode") {
    browser.tabs.query({ active: true, currentWindow: true }).then(tabs => {
      if (tabs[0]) {
        console.log("Sending triggerCopyModeOnce to tab", tabs[0].id);
        browser.tabs.sendMessage(tabs[0].id, { action: "triggerCopyModeOnce" }).catch(() => {
          console.warn("Failed to send command message");
        });
      } else {
        console.warn("No active tab found for command");
      }
    });
  }
});
