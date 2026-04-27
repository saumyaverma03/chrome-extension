// Content script - injected into every webpage
// This script can read and modify the page's DOM

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === "FILL_RANDOM") {
    const fields = scanFields();
    console.log("Found fields:", fields);

    const data = {};
    fields.forEach((field) => {
      data[field.index] = generateValue(field);
    });
    fillFields(data);
  }

  if (message.action === "GET_FIELD_VALUES") {
    const fields = scanFields();
    sendResponse({ fields: fields });
  }

  if (message.action === "FILL_SAVED") {
    fillFields(message.data);
  }
  if (message.action === "SCAN_FIELDS") {
    sendResponse({ fields: scanFields() });
  }

  return true;
});

function fillFields(data) {
  const inputs = document.querySelectorAll("input, textarea, select");
  const seenRadioNames = new Set();

   const filtered = Array.from(inputs).filter((el) => {
    if (["submit", "button", "hidden", "file"].includes(el.type)) return false;
    if (el.type === 'radio') {
      if (seenRadioNames.has(el.name)) return false;
      seenRadioNames.add(el.name);
    }
    return true;
  });


  filtered.forEach((el, index) => {
    if (data[index] === undefined) return;

    if (el.type === 'checkbox') {
      const val = String(data[index]).toLowerCase();
      el.checked = val === 'true' || val === el.value.toLowerCase();
      el.dispatchEvent(new Event("change", { bubbles: true }));
    } else if (el.type === 'radio') {
      const radios = document.querySelectorAll(`input[type="radio"][name="${el.name}"]`);
      const match = Array.from(radios).find((r) => r.value === data[index]);
      const pick = match || radios[Math.floor(Math.random() * radios.length)];
      if (pick) {
        pick.checked = true;
        pick.dispatchEvent(new Event("change", { bubbles: true }));
      }
    } else if (el.tagName === "SELECT") {
      const options = Array.from(el.options);
      const match = options.find(
        (o) => o.value === data[index] ||
          o.text.trim().toLowerCase() === String(data[index]).toLowerCase(),
      );
      if (match) el.value = match.value;
      el.dispatchEvent(new Event("change", { bubbles: true }));
    } else {
      el.value = data[index];
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
      el.dispatchEvent(new Event("blur", { bubbles: true }));
    }
  });
}


function getLabel(el) {
  if (el.id) {
    const label = document.querySelector(`label[for="${el.id}"]`)
    if (label) return label.textContent.trim()
  }
  const parent = el.closest('label')
  if (parent) return parent.textContent.trim()
  const ariaLabel = el.getAttribute('aria-label')
  if (ariaLabel) return ariaLabel.trim()
  return ''
}

function scanFields() {
  const skipTypes = [ "submit", "button", "hidden", "file"];
  const inputs = document.querySelectorAll("input, textarea, select");
  const seenRadioNames = new Set();

  return Array.from(inputs)
    .filter((el) => !skipTypes.includes(el.type))
    .filter((el) => el.name !== 'g-recaptcha-response')
    .filter((el) => {
      if (el.type === 'radio') {
        if (seenRadioNames.has(el.name)) return false;
        seenRadioNames.add(el.name);
      }
      return true;
    })
    .map((el, index) => ({
      index,
      type: el.type,
      name: el.name,
      id: el.id,
      placeholder: el.placeholder,
      value: el.type === 'checkbox' ? (el.checked ? 'true' : 'false') : el.value,
      label: getLabel(el),
      options:
        el.type === 'radio'
          ? Array.from(document.querySelectorAll(`input[type="radio"][name="${el.name}"]`))
              .map((r) => r.value)
          : el.tagName === "SELECT"
          ? Array.from(el.options).map((o) => o.text).filter((t) => t.trim())
          : undefined,
    }));
}


function fakerOr(fakerFn, fallbackFn) {
    if (typeof faker !== 'undefined') {
        return fakerFn()
    }
    return fallbackFn()
}


function generateValue(field) {
    const hints = [field.name, field.id, field.placeholder].join(' ').toLowerCase()

    if (field.type === 'email' || hints.includes('email')) {
        return fakerOr(() => faker.internet.email(), randomEmail)
    }

    if (field.type === 'password' || hints.includes('password')) {
        return fakerOr(() => faker.internet.password(), randomPassword)
    }

    if (field.type === 'username' || hints.includes('username')) {
        return fakerOr(() => faker.internet.username(), randomUsername)
    }

    if (hints.includes('phone') || hints.includes('mobile')) {
        return fakerOr(() => faker.phone.number(), randomPhone)
    }

    if (hints.includes('name')) {
        return fakerOr(() => faker.person.fullName(), randomName)
    }
    if (field.type === 'checkbox') {
  return Math.random() > 0.5 ? 'true' : 'false';
}

    return 'test input'
}


function random(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomEmail() {
  return random(FALLBACK_EMAIL_NAMES) + '@' + random(FALLBACK_EMAIL_DOMAINS) + random(FALLBACK_EMAIL_EXTENSIONS)
}

function randomPassword() {
  return random(FALLBACK_PASSWORD_WORDS) + random(FALLBACK_PASSWORD_NUMBERS) + random(FALLBACK_PASSWORD_SYMBOLS)
}

function randomUsername() {
  return random(FALLBACK_USERNAME_NAMES) + '_' + random(FALLBACK_USERNAME_NUMBERS)
}

function randomPhone() {
  return '+1 ' + random(FALLBACK_PHONE_AREA) + '-' + random(FALLBACK_PHONE_MID) + '-' + random(FALLBACK_PHONE_LAST)
}

function randomName() {
  return random(FALLBACK_FIRST_NAMES) + ' ' + random(FALLBACK_LAST_NAMES)
}

