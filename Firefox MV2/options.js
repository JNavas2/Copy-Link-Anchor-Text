/*
 * File: options.js of Copy Link Anchor Text extension for Firefox
 * Description: Manages persistent mode setting and uninstall action in the options page UI.
 * Copyright © 2025 John Navas, All Rights Reserved.
 */

const checkbox = document.getElementById("persistentMode");
const removeButton = document.getElementById("remove");

// Load saved setting
browser.storage.local.get("persistentMode").then(data => {
  checkbox.checked = data.persistentMode || false;
});

// Save setting
checkbox.addEventListener("change", () => {
  browser.storage.local.set({ persistentMode: checkbox.checked });
});

// Remove extension
removeButton.addEventListener("click", () => {
  browser.management.uninstallSelf();
});
