/*
 * File: options.js of Copy Link Anchor Text extension for Firefox
 * Description: Manages persistent mode setting, uninstall action in the options page UI,
 * and displays "What's New" loaded from whats_new.json.
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

// Load What's New from whats_new.json
fetch(browser.runtime.getURL("whats_new.json"))
  .then(response => response.json())
  .then(data => {
    const list = document.getElementById("whatsNewList");
    list.innerHTML = ""; // Clear fallback placeholder
    data.changes.forEach(change => {
      const li = document.createElement("li");
      li.textContent = change;
      list.appendChild(li);
    });
  })
  .catch(err => {
    console.error("Failed to load what's new:", err);
    const list = document.getElementById("whatsNewList");
    list.innerHTML = "<li>(Unable to load)</li>";
  });
