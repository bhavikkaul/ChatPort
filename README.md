# Chat Transfer — move a chat between AI tools

Take a conversation from one AI chat and continue it in another. Works in both directions between:

Claude · ChatGPT · Gemini · Perplexity · DeepSeek · Grok · Copilot · Le Chat

Any other page also works as a *source* through the generic reader, and you can always
**Copy** or **Download .md** to paste the chat into any tool, even ones not on the list.

## Install (Mac / Chrome)
1. Open `chrome://extensions`
2. Turn on **Developer mode** (top right)
3. Click **Load unpacked** and select this `chat-transfer` folder
4. Pin the extension from the puzzle-piece menu

## Use
1. Open the conversation you want to move. Scroll to the top once so older messages load.
2. Click the extension icon. **From** is detected automatically; pick **To**.
3. Optionally limit it to the last N messages, or add a note ("Now write the tests").
4. Click **Transfer**. The destination opens with the transcript in the prompt box. Review and send,
   or tick "Send automatically".

If filling ever fails, a note appears on the page and the transcript is already on your clipboard — paste with Cmd+V.

## How reading works
1. **Site reader** — written for Gemini, ChatGPT and Claude (most reliable).
2. **Generic reader** — a best guess based on common class and attribute names. Used for other sites.
   The popup tells you when it was used, so check the result looks right.
3. **Your selection** — if nothing is found, whatever text you've highlighted on the page is used.

## Files
- `providers.js` — the list of AI sites and how to fill each one. **Start here to add or fix a site.**
- `extractor.js` — reads the chat from the page.
- `popup.html` / `popup.js` — the interface and prompt builder.
- `fill.js` — puts the transcript into the destination's prompt box.
- `background.js` — small helper so a transfer only lands in the tab the extension opened.
- `manifest.json` — permissions and which sites the extension runs on.

## Add another AI
1. In `providers.js`, add an entry to `SITES` (hostname) and `TARGETS` (URL to open, prompt-box selector, send-button selector).
2. In `manifest.json`, add its URL to both `host_permissions` and `content_scripts.matches`.
3. Reload the extension on `chrome://extensions`.
To read chats *from* it more accurately, add a reader for it in `READERS` in `extractor.js`.

## If it breaks
These sites change their page code often, and the selectors were written without testing against the live pages.
- **"Couldn't find any messages"** → fix or add the site's reader in `extractor.js`.
- **Prompt box doesn't fill** → update that site's `editor` selectors in `providers.js`.
- **Auto-send doesn't click** → update that site's `send` selectors. Sending manually always works.
To find a selector: right-click the prompt box → Inspect, and look for a stable `id`, `role` or `data-testid`.

## Limits
- Text only. Images, uploaded files and special cards (Deep Research, canvases) aren't carried over.
- Only what's loaded on the page is read, so scroll up in long chats first.
- Very long transcripts can exceed the destination's limit — use "Last N messages".
- Other AIs don't *remember* the chat, they just receive it as text, so details like hidden system instructions don't transfer.
