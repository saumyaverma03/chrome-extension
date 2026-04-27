# Smart Fill — Chrome Extension

A Chrome extension that fills web forms instantly with realistic fake data. Built for testing websites without exposing personal information.

## Features

- **AI Fill** — scans form fields and generates a coherent fictional persona using Groq (Llama 3.3 70B) via a Cloudflare Worker proxy
- **Fill Random** — fills forms instantly with Faker.js (regex-matched by field type), no API call needed
- **Save Profiles** — save a filled form as a named profile and reuse it across any site
- **Load Profiles** — pick a saved profile from the popup and fill the form in one click
- **Delete Profiles** — manage saved profiles directly from the popup
- **Pop-out window** — detach the popup into a floating window so it doesn't overlap the form

## Field Support

Tested on 18 real sites. Handles:
- Text inputs — name, email, phone, password, username
- Dropdowns — matches by option text when value attribute differs
- Radio buttons — selects correct option by value, random fallback
- Checkboxes — checks/unchecks based on AI true/false response
- Textareas — address and freeform fields
- React/Vue sites — dispatches `input`, `change`, `blur` events for framework compatibility

Known limitations: multi-step wizards, file inputs, complex date pickers.

## Tech Stack

| Layer | Tech |
|---|---|
| Extension | Chrome Manifest V3 |
| Storage | `chrome.storage.local` |
| AI Model | Llama 3.3 70B via Groq API |
| Backend Proxy | Cloudflare Workers |
| Random Data | Faker.js + regex fallback arrays |

## Project Structure

```
chrome-extension/
├── manifest.json          # Extension config (MV3)
├── background/
│   └── background.js      # Service worker
├── content/
│   ├── content.js         # Injected into pages — scans and fills fields
│   ├── config.js          # Fallback regex arrays for random fill
│   └── faker.min.js       # Faker.js for random data generation
├── popup/
│   ├── popup.html         # Extension popup UI
│   ├── popup.css          # Styles — light/dark theme (opposite mode)
│   └── popup.js           # Popup logic — AI fill, profiles, random fill
└── icons/
    ├── kitty (16).png
    ├── kitty (48).png
    └── kitty (128).png
```

## How It Works

### AI Fill
1. Popup scans all form fields on the active page
2. Checks `chrome.storage.local` for a cached result for this form
3. Cache hit → fills instantly, no API call
4. Cache miss → field metadata sent to Cloudflare Worker → Groq API (Llama 3.3 70B)
5. AI returns a coherent JSON persona keyed by field index
6. Result cached locally, form filled via content script

### Fill Random
1. Content script scans all form fields
2. `generateValue()` pattern-matches each field via Faker.js (email, phone, name, password)
3. Falls back to regex arrays in `config.js` if Faker is unavailable
4. `fillFields()` writes values to DOM and dispatches events for framework compatibility

### Why a Backend Proxy?
The Groq API key lives in a Cloudflare Worker secret — never exposed in the extension code. This makes it safe to distribute publicly.

### Save & Load Profiles
Form values are read from the DOM and saved to `chrome.storage.local` under a user-defined name. Loading a profile fills the same field indexes with the saved values.

### Light / Dark Theme
The popup automatically applies the **opposite** of the system theme — light popup on dark OS, dark popup on light OS — so it always contrasts the page behind it.

## Setup

### 1. Clone the repo
```bash
git clone https://github.com/saumyaverma03/smart-fill
```

### 2. Load the extension
1. Open Chrome → `chrome://extensions`
2. Enable **Developer Mode**
3. Click **Load Unpacked** → select this folder

### 3. Deploy the Cloudflare Worker
1. Create a [Cloudflare Worker](https://workers.cloudflare.com)
2. Add `GROQ_API_KEY` as a Worker secret
3. Update the worker URL in `popup/popup.js`

### 4. Get a Groq API Key
Sign up at [console.groq.com](https://console.groq.com) — free tier available.

## Usage

1. Navigate to any webpage with a form
2. Click the **Smart Fill** extension icon
3. Choose:
   - **✦ AI Fill** — generates context-aware data using AI (cache → LLM)
   - **Fill Random Data** — instant fill via Faker.js, no API call
   - **Save Current Form** — save the current values as a named profile
   - Click **Fill** next to any saved profile to reuse it
4. Use the **↗** button to pop the UI into a floating window if it overlaps the form

## Engineering Decisions

- **Groq over Claude/OpenAI** — sub-second inference was critical for UX. Groq's Llama 3.3 70B is fast enough to feel instant, and the free tier absorbed all development/testing without a payment wall.
- **Two fill modes, not one** — Fill Random handles trivially pattern-matchable fields (email, phone, name) instantly via Faker.js. AI Fill handles ambiguous fields via LLM. Keeping them separate avoids wasting API calls on fields that don't need them.
- **Cloudflare Worker proxy** — the Groq API key never touches the extension bundle. Users install the extension without needing their own key.
- **Vanilla JS over React** — the popup is simple enough that a build pipeline adds friction without value. Kept the bundle tiny.
- **`chrome.storage.local` over a backend DB** — privacy-first by design. User profiles never leave the browser.
- **Opposite theme mode** — popup always contrasts the page, reducing visual overlap and making it easier to use alongside forms.

## What I Learned Building This

- Chrome Extension architecture (Manifest V3, content scripts, service workers, message passing)
- DOM manipulation and cross-framework compatibility (React/Vue event dispatching)
- Handling diverse input types — selects, radios, checkboxes — with consistent index alignment
- `chrome.storage.local` for persistent profiles and AI response caching
- API integration with a secure backend proxy pattern
- Prompt engineering for structured JSON output
- Cloudflare Workers for serverless backend deployment

## Limitations & Future Work

- Multi-step forms (Typeform wizards) — content script only sees the current step
- Complex date inputs — DOM date pickers vary too much across sites
- File inputs — skipped by design, can't be filled programmatically
- No structured outputs / JSON mode — current prompt relies on the model returning valid JSON, which fails ~5% of the time
- No evaluation harness — accuracy was measured manually; automating this is the next logical step
