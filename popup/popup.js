console.log("Form Filler popup opened!");

const statusMsg = document.getElementById("statusMsg");

function showStatus(msg, isError = false) {
  statusMsg.textContent = msg;
  statusMsg.style.color = isError ? "#ff6b6b" : "#38ef7d";
  setTimeout(() => {
    statusMsg.textContent = "";
  }, 3000);
}

document.getElementById("fillRandom").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: "FILL_RANDOM" });
    showStatus("Filled with random data!");
  });
});

document.getElementById("saveProfile").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(
      tabs[0].id,
      { action: "GET_FIELD_VALUES" },
      (response) => {
        if (!response || !response.fields || response.fields.length === 0) {
          showStatus("No fields found on this page.", true);
          return;
        }

        chrome.storage.local.set({ savedProfile: response.fields }, () => {
          showStatus(`Saved ${response.fields.length} fields!`);
        });
      },
    );
  });
});

document.getElementById("fillSaved").addEventListener("click", () => {
  chrome.storage.local.get("savedProfile", (result) => {
    if (!result.savedProfile) {
      showStatus("No saved profile yet.", true);
      return;
    }

    const data = {};
    result.savedProfile.forEach((field) => {
      data[field.index] = field.value;
    });

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { action: "FILL_SAVED", data: data });
      showStatus("Filled from saved profile!");
    });
  });
});

document.getElementById("saveProfile").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(
      tabs[0].id,
      { action: "GET_FIELD_VALUES" },
      (response) => {
        const name = prompt("Name this profile: ");
        if (!name) return; //user cancelled
        chrome.storage.local.get("profiles", (result) => {
          const profiles = result.profiles || {}; //existing profiles or empty object
          profiles[name] = response.fields; //add new profile
          chrome.storage.local.set({ profiles }); //save back
          chrome.storage.local.get("profiles", (result) => {
            console.log("All saved profiles:", result.profiles);
          });
        });
      },
    );
  });
});
