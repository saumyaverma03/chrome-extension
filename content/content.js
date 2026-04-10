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
  const filtered = Array.from(inputs).filter(
    (el) =>
      !["checkbox", "radio", "submit", "button", "hidden", "file"].includes(
        el.type,
      ),
  );

  filtered.forEach((el, index) => {
    if (data[index] === undefined) return;

    if (el.tagName === "SELECT") {
      const options = Array.from(el.options);
      const match = options.find(
        (o) =>
          o.value === data[index] ||
          o.text.trim().toLowerCase() === String(data[index]).toLowerCase(),
      );
      if (match) el.value = match.value;
    } else {
      el.value = data[index];
    }

    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    el.dispatchEvent(new Event("blur", { bubbles: true }));
  });
}

function scanFields() {
  const skipTypes = ["checkbox", "radio", "submit", "button", "hidden", "file"];
  const inputs = document.querySelectorAll("input, textarea, select");

  return Array.from(inputs)
    .filter((el) => !skipTypes.includes(el.type))
    .map((el, index) => ({
      index: index,
      type: el.type,
      name: el.name,
      id: el.id,
      placeholder: el.placeholder,
      value: el.value,
      options:
        el.tagName === "SELECT"
          ? Array.from(el.options)
              .map((o) => o.text)
              .filter((t) => t.trim())
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

