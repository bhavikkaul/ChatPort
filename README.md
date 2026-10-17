# ChatPort 🚀
### Move your AI conversations. Keep your context.

ChatPort is a Chrome extension that lets you transfer conversations between AI platforms without manually copying and pasting your entire chat history.

Switching from ChatGPT to Claude? Moving a conversation from Gemini to DeepSeek? ChatPort extracts the conversation, builds a context-rich prompt, and opens the destination AI with your conversation ready to continue.

**One conversation. Multiple AI platforms. No starting over.**

## ✨ Features

- **Cross-platform conversation transfer** — Move chats between ChatGPT, Claude, Gemini, Perplexity, DeepSeek, Grok, Microsoft Copilot, and Mistral Le Chat.
- **Automatic platform detection** — Detects the AI platform you're currently using and helps you select a destination.
- **Conversation extraction** — Reads messages from supported chat interfaces, with generic extraction for other pages.
- **Context-preserving prompts** — Organizes extracted messages into a readable transcript with user and assistant labels.
- **Selective transfer** — Transfer the last N messages instead of the entire conversation.
- **Custom instructions** — Add instructions for the destination AI, such as "Continue implementing the project" or "Write unit tests for the code above."
- **Markdown formatting** — Preserves useful formatting such as code blocks, headings, lists, and links when extracting supported conversations.
- **Clipboard fallback** — Copies the generated prompt so you can paste it manually if automatic filling fails.
- **Automatic sending option** — Choose whether to send the prepared conversation automatically or review it first.

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| JavaScript | Conversation extraction and transfer logic |
| HTML & CSS | Browser extension interface |
| Chrome Extension Manifest V3 | Extension configuration and permissions |
| Chrome Tabs & Scripting APIs | Read conversations and open destination tabs |
| Chrome Storage API | Save preferences and manage pending transfers |

## 🔄 How It Works

1. **Extract:** ChatPort reads the messages from your current conversation.
2. **Prepare:** It converts the messages into a structured transcript and adds your optional instructions.
3. **Transfer:** It opens the selected AI platform and attempts to insert the transcript into its prompt box.
4. **Continue:** Review the context and send it to the destination AI.

The extension uses dedicated conversation readers for ChatGPT, Claude, and Gemini, with a generic reader as a fallback for other pages.

## 📸 Demo

_Add screenshots or a short GIF here showing:_

1. ChatPort detecting the source platform.
2. Selecting a destination AI and adding an instruction.
3. The conversation appearing in the destination prompt.

## 🚀 Installation

ChatPort can currently be installed locally in Chrome using Developer Mode.

1. Download or clone this repository.
2. Extract the ZIP file if downloaded.
3. Open `chrome://extensions` in Chrome.
4. Enable **Developer mode**.
5. Click **Load unpacked**.
6. Select the `chat-transfer` project folder containing `manifest.json`.
7. Pin ChatPort from the Chrome extensions menu.

## 💡 Usage

1. Open the AI conversation you want to transfer.
2. Scroll to the top of the conversation so older messages are loaded.
3. Click the ChatPort extension icon.
4. Select your destination AI platform.
5. Optionally select the last N messages or add a custom instruction.
6. Click **Transfer**.
7. Review the prepared conversation in the destination AI and send it.

If automatic filling fails, paste the generated transcript from your clipboard.

## 🔒 Privacy & Limitations

- ChatPort is designed as a browser-side extension without a backend service in this repository.
- Only text conversations are transferred. Images, attachments, and special AI-generated cards are not included.
- Only messages currently loaded on the page can be extracted.
- Very long conversations may exceed the destination AI's context limits.
- Generic extraction and destination selectors may require updates when AI websites change their interfaces.

## 🗺️ Roadmap

- [ ] Improve conversation extraction reliability across AI platforms.
- [ ] Add more AI platform integrations.
- [ ] Improve handling of long conversations and context limits.
- [ ] Add transfer previews and better transcript editing.
- [ ] Improve formatting preservation for complex conversations.

## 🤝 Contributing

Contributions, bug reports, and suggestions are welcome!

If an AI platform changes its interface, improvements to its conversation reader or destination selectors are especially useful.

## 📄 License

_Add your preferred open-source license here._

---

Built to make switching between AI tools a little less painful.
