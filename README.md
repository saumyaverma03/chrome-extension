# Smart Fill — Chrome Extension

A Chrome extension that fills web forms instantly with realistic fake data. Built for testing websites without exposing personal information.

## Features

- **AI Fill** — scans form fields and generates a coherent fictional persona using Groq (Llama 3.3 70B) via a Cloudflare Worker proxy
- **Fill Random** — fills forms instantly with locally generated random data (no API call needed)
- **Save Profiles** — save a filled form as a named profile and reuse it across any site
- **Load Profiles** — pick a saved profile from the popup and fill the form in one click
- **Delete Profiles** — manage saved profiles directly from the popup

## Tech Stack

| Layer | Tech |
|---|---|
| Extension | Chrome Manifest V3 |
| Storage | `chrome.storage.local` |
| AI Model | Llama 3.3 70B via Groq API |
| Backend Proxy | Cloudflare Workers |
| Random Data | Custom JS generator |

## Project Structure

```
chrome-extension/
├── manifest.json          # Extension config (MV3)
├── background/
│   └── background.js      # Service worker — message relay
├── content/
│   └── content.js         # Injected into pages — scans and fills fields
├── popup/
│   ├── popup.html         # Extension popup UI
│   ├── popup.css          # Styles
│   └── popup.js           # Popup logic — AI fill, profiles, random fill
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## How It Works

### AI Fill
1. Popup scans all form fields on the active page
2. Field metadata (type, name, placeholder) is sent to a Cloudflare Worker
3. Worker forwards the prompt to Groq API (Llama 3.3 70B)
4. AI returns a coherent JSON persona keyed by field index
5. Content script fills the form with the response

### Why a Backend Proxy?
The Groq API key lives in a Cloudflare Worker secret — never exposed in the extension code. This makes it safe to distribute publicly.

### Save & Load Profiles
Form values are read from the DOM and saved to `chrome.storage.local` under a user-defined name. Loading a profile fills the same field indexes with the saved values.

## Setup

### 1. Clone the repo
```bash
git clone https://github.com/saumyaverma03/chrome-extension
```

### 2. Load the extension
1. Open Chrome → `chrome://extensions`
2. Enable **Developer Mode**
3. Click **Load Unpacked** → select this folder

### 3. Deploy the Cloudflare Worker
1. Create a [Cloudflare Worker](https://workers.cloudflare.com)
2. Paste the worker code from `background/background.js` comments or set up your own proxy
3. Add `GROQ_API_KEY` as a Worker secret
4. Update the worker URL in `popup/popup.js`

### 4. Get a Groq API Key
Sign up at [console.groq.com](https://console.groq.com) — free tier available.

## Usage

1. Navigate to any webpage with a form
2. Click the **Smart Fill** extension icon
3. Choose:
   - **AI Fill** — generates context-aware data using AI
   - **Fill Random Data** — instant fill with no API call
   - **Save Current Form** — save the current values as a named profile
   - Click **Fill** next to any saved profile to reuse it
  
     
## Engineering Decisions

- **Groq over Claude/OpenAI** — sub-second inference was critical for UX. Groq's Llama 3.3 70B is fast enough to feel instant, and the free tier absorbed all development/testing without a payment wall.
- **Regex-first, LLM-fallback** — most form fields (email, phone, name) are trivially pattern-matchable. Using AI for every field wastes latency and cost. The hybrid approach is fast *and* intelligent.
- **Cloudflare Worker proxy** — the Groq API key never touches the extension bundle. Users install the extension without needing their own key.
- **Vanilla JS over React** — the popup is simple enough that a build pipeline adds friction without value. Kept the bundle tiny.
- **`chrome.storage.local` over a backend DB** — privacy-first by design. User profiles never leave the browser.

  
## What I Learned Building This

- Chrome Extension architecture (Manifest V3, content scripts, service workers, message passing)
- DOM manipulation and cross-framework compatibility (React/Vue event dispatching)
- `chrome.storage.local` for persistent data
- API integration with a secure backend proxy pattern
- Prompt engineering for structured JSON output
- Cloudflare Workers for serverless backend deployment


## Limitations & Future Work

- Field detection accuracy drops on forms with generic labels (e.g., "Enter details") — would improve with few-shot examples in the prompt
- No structured outputs / JSON mode — current prompt relies on the model returning valid JSON, which fails ~5% of the time
- No evaluation harness — accuracy was measured manually; automating this is the next logical step
