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
    chrome.tabs.sendMessage(tabs[0].id, { action: "GET_FIELD_VALUES" }, (response) => {
      if (!response || !response.fields || response.fields.length === 0) {
        showStatus("No fields found.", true)
        return
      }
      const name = prompt("Name this profile:")
      if (!name) return
      chrome.storage.local.get("profiles", (result) => {
        const profiles = result.profiles || {}
        profiles[name] = response.fields
        chrome.storage.local.set({ profiles }, () => {
          showStatus("Saved as " + name)
          loadProfiles()
        })
      })
    })
  })
})


function loadProfiles() {
  chrome.storage.local.get("profiles", (result) => {
    const profiles = result.profiles || {}
    const names = Object.keys(profiles)
    const list = document.getElementById("profilesList")

    if (names.length === 0) {
      list.innerHTML = '<p class="empty-msg">No saved profiles yet.</p>'
      return
    }

    list.innerHTML = names.map(name => `
      <div class="profile-row">
        <span class="profile-name">${name}</span>
        <div class="profile-btns">
          <button class="btn-fill" data-name="${name}">Fill</button>
          <button class="btn-delete" data-name="${name}">✕</button>
        </div>
      </div>
    `).join('')

    list.querySelectorAll('.btn-fill').forEach(btn => {
      btn.addEventListener('click', () => fillFromProfile(btn.dataset.name))
    })

    list.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', () => deleteProfile(btn.dataset.name))
    })
  })
}

function fillFromProfile(name) {
  chrome.storage.local.get("profiles", (result) => {
    const profile = result.profiles[name]
    const data = {}
    profile.forEach(field => {
      data[field.index] = field.value
    })
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { action: "FILL_SAVED", data })
      showStatus("Filled from " + name)
    })
  })
}

function deleteProfile(name) {
  chrome.storage.local.get("profiles", (result) => {
    const profiles = result.profiles || {}
    delete profiles[name]
    chrome.storage.local.set({ profiles }, () => {
      showStatus("Deleted " + name)
      loadProfiles()
    })
  })
}

// load profiles when popup opens
loadProfiles()


