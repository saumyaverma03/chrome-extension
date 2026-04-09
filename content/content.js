// Content script - injected into every webpage
// This script can read and modify the page's DOM

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === "FILL_RANDOM") {
    const fields = scanFields();
    console.log("Found fields:", fields)

    const data = {}
    fields.forEach((field) => {
        data[field.index] = generateValue(field)
    })
    fillFields(data)
  }

  if (message.action === 'GET_FIELD_VALUES') {
    const fields = scanFields()
    sendResponse({ fields: fields })
  }

  if (message.action === 'FILL_SAVED') {
    fillFields(message.data)
  }
  if(message.action === 'SCAN_FIELDS') {
    sendResponse({ fields: scanFields()})
  }

  return true
})

function fillFields(data) {
  const inputs = document.querySelectorAll('input, textarea, select')
  const filtered = Array.from(inputs).filter((el) => !['checkbox', 'radio', 'submit', 'button', 'hidden', 'file'].includes(el.type))

  filtered.forEach((el, index) => {
    el.value = data[index]
    el.dispatchEvent(new Event('input', { bubbles: true }))
    el.dispatchEvent(new Event('change', { bubbles: true }))
    el.dispatchEvent(new Event('blur', { bubbles: true }))
  })
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
  }));
}

function generateValue(field) {
    const hints = [field.name, field.id, field.placeholder].join(' ').toLowerCase()

    if (field.type === 'email' || hints.includes('email')) {
        return randomEmail()
    }

    if (field.type === 'password' || hints.includes('password')) {
        return randomPassword()
    }

    if (field.type === 'username' || hints.includes('username')) {
        return randomUsername()
    }

    if (hints.includes('phone') || hints.includes('mobile')) {
        return randomPhone()
    }

    if (hints.includes('name')) {
        return randomName()
    }

    // fallback — not sure what it is, put something generic
    return 'test input'
}


function random(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomEmail() {
  const names = ['alex', 'jordan', 'taylor', 'morgan', 'casey', 'riley']
  const domains = ['gmail', 'yahoo', 'hotmail', 'outlook']
  const extensions = ['.com', '.in', '.au', '.net']

  return random(names) + '@' + random(domains) + random(extensions)
}
function randomPassword() {
  const words = ['Tiger', 'Storm', 'Blade', 'Phoenix', 'Nova']
  const numbers = ['12', '99', '42', '007', '123']
  const symbols = ['!', '@', '#', '$']

  return random(words) + random(numbers) + random(symbols)
}

function randomUsername() {
  const names = ['alex', 'jordan', 'taylor', 'morgan', 'casey']
  const numbers = ['42', '99', '7', '101', '23']

  return random(names) + '_' + random(numbers)
}

function randomPhone() {
  const area = ['555', '212', '415', '312', '713']
  const mid = ['867', '234', '456', '789', '321']
  const last = ['5309', '1234', '5678', '9012', '3456']

  return '+1 ' + random(area) + '-' + random(mid) + '-' + random(last)
}

function randomName() {
  const first = ['Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley']
  const last = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia']

  return random(first) + ' ' + random(last)
}