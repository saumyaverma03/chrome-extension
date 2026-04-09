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
          showStatus("No fields found.", true);
          return;
        }
        const name = prompt("Name this profile:");
        if (!name) return;
        chrome.storage.local.get("profiles", (result) => {
          const profiles = result.profiles || {};
          profiles[name] = response.fields;
          chrome.storage.local.set({ profiles }, () => {
            showStatus("Saved as " + name);
            loadProfiles();
          });
        });
      },
    );
  });
});

function loadProfiles() {
  chrome.storage.local.get("profiles", (result) => {
    const profiles = result.profiles || {};
    const names = Object.keys(profiles);
    const list = document.getElementById("profilesList");

    if (names.length === 0) {
      list.innerHTML = '<p class="empty-msg">No saved profiles yet.</p>';
      return;
    }

    list.innerHTML = names
      .map(
        (name) => `
      <div class="profile-row">
        <span class="profile-name">${name}</span>
        <div class="profile-btns">
          <button class="btn-fill" data-name="${name}">Fill</button>
          <button class="btn-delete" data-name="${name}">✕</button>
        </div>
      </div>
    `,
      )
      .join("");

    list.querySelectorAll(".btn-fill").forEach((btn) => {
      btn.addEventListener("click", () => fillFromProfile(btn.dataset.name));
    });

    list.querySelectorAll(".btn-delete").forEach((btn) => {
      btn.addEventListener("click", () => deleteProfile(btn.dataset.name));
    });
  });
}

function fillFromProfile(name) {
  chrome.storage.local.get("profiles", (result) => {
    const profile = result.profiles[name];
    const data = {};
    profile.forEach((field) => {
      data[field.index] = field.value;
    });
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { action: "FILL_SAVED", data });
      showStatus("Filled from " + name);
    });
  });
}

function deleteProfile(name) {
  chrome.storage.local.get("profiles", (result) => {
    const profiles = result.profiles || {};
    delete profiles[name];
    chrome.storage.local.set({ profiles }, () => {
      showStatus("Deleted " + name);
      loadProfiles();
    });
  });
}

// load profiles when popup opens
loadProfiles();

document.getElementById("fillAI").addEventListener("click", async () => {
  showStatus("Generating...");

  chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
    chrome.tabs.sendMessage(
      tabs[0].id,
      { action: "SCAN_FIELDS" },
      async (response) => {
        const fields = response.fields.map((f) => ({
          index: f.index,
          type: f.type,
          placeholder: f.placeholder,
          name: f.name,
        }));

        const aiPrompt = `Generate realistic fake data for a form. Return ONLY a valid JSON object, no explanation.

Fields:
${JSON.stringify(fields, null, 2)}

Requirements:
- All data should belong to the same fictional person
- Match field types (valid emails for email fields, etc.)
- Be professional but fictional
- Return format: { "0": "value", "1": "value" }`;

        try {
          const res = await fetch(
            "https://gentle-tooth-e125.saumyaaverma03.workers.dev",
            {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ prompt: aiPrompt }),
            },
          );

          if (!res.ok) {
            const errText = await res.text();
            console.log("Worker error:", errText);
            throw new Error("Worker returned " + res.status);
          }

          const data = await res.json();
          console.log("API response:", data);
          const fillData = JSON.parse(data);

          chrome.tabs.sendMessage(tabs[0].id, {
            action: "FILL_SAVED",
            data: fillData,
          });
          showStatus("AI filled the form!");
        } catch (err) {
          showStatus("AI failed — try again.", true);
          console.error(err);
        }
      },
    );
  });
});
