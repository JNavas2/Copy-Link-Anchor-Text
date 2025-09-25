/*
 * File: options.js of Copy Link Anchor Text extension for Firefox
 * Description: Handles options page events, persistent mode checkbox, and uninstall button.
 * Copyright © 2025 John Navas, All Rights Reserved.
 */

const checkbox = document.getElementById("persistentMode");
const removeButton = document.getElementById("remove");

browser.storage.sync.get("persistentMode", data => {
  checkbox.checked = data.persistentMode || false;
});

checkbox.addEventListener("change", () => {
  browser.storage.sync.set({ persistentMode: checkbox.checked });
});

removeButton.addEventListener("click", () => {
  browser.management.uninstallSelf();
});
