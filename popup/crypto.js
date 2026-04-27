//verfication hash or PIN verification function

async function hashPin(pin) {
  const encoded = new TextEncoder().encode(pin);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  return bufferToBase64(hashBuffer);
}

function bufferToBase64(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

function base64ToBuffer(base64) {
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}

//TextEncoder : converts PIN string -> raw bytes as
//  Web Crypto only works with bytes not strings

//crypto.subtle.digest('SHA-256', encoded) : this is
// what hashes those bytes

//bufferToBase64 : converts the result -> readable string
//for storage

//base64ToBuffer() : to load stored data and decrypt ; reverse

async function deriveKey(pin, salt) {
  const encoded = new TextEncoder().encode(pin);

  const baseKey = await crypto.subtle.importKey(
    "raw",
    encoded,
    "PBKDF2",
    false,
    ["deriveKey"],
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 1000000,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

async function encryptProfile(data, pin) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(pin, salt);

  const encoded = new TextEncoder().encode(JSON.stringify(data));

  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    key,
    encoded,
  );

  return {
    type: "protected",
    pinHash: await hashPin(pin),
    salt: bufferToBase64(salt),
    iv: bufferToBase64(iv),
    ciphertext: bufferToBase64(ciphertext),
  };
}

async function decryptProfile(encryptedData, pin) {
  const pinHash = await hashPin(pin);
  if (pinHash !== encryptedData.pinHash) {
    throw new Error("Wrong PIN");
  }
  const salt = base64ToBuffer(encryptedData.salt);
  const iv = base64ToBuffer(encryptedData.iv);
  const ciphertext = base64ToBuffer(encryptedData.ciphertext);
  const key = await deriveKey(pin, salt);

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv },
    key,
    ciphertext,
  );
  return JSON.parse(new TextDecoder().decode(decrypted));
}
