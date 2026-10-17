// One place that lists every AI site the extension knows about.
//
// SITES   – which hostnames belong to which AI (used to detect where you are)
// TARGETS – where a chat can be sent: the page to open, how to find its prompt box,
//           and how to find its send button.
//
// To add a new AI:
//   1. Add it to SITES and TARGETS below.
//   2. Add its URL pattern to "host_permissions" and "content_scripts.matches" in manifest.json.
//   3. (Optional) add a dedicated reader for it in extractor.js. Without one, the
//      generic reader is used, which works on many chat UIs.
(() => {
  const SITES = {
    claude:     { name: "Claude",     hosts: ["claude.ai"] },
    chatgpt:    { name: "ChatGPT",    hosts: ["chatgpt.com", "chat.openai.com"] },
    gemini:     { name: "Gemini",     hosts: ["gemini.google.com"] },
    perplexity: { name: "Perplexity", hosts: ["www.perplexity.ai", "perplexity.ai"] },
    deepseek:   { name: "DeepSeek",   hosts: ["chat.deepseek.com"] },
    grok:       { name: "Grok",       hosts: ["grok.com"] },
    copilot:    { name: "Copilot",    hosts: ["copilot.microsoft.com"] },
    mistral:    { name: "Le Chat",    hosts: ["chat.mistral.ai"] },
  };

  const TARGETS = {
    claude: {
      url: "https://claude.ai/new",
      editor: ['div.ProseMirror[contenteditable="true"]', '[contenteditable="true"][role="textbox"]'],
      send: ['button[aria-label*="Send" i]', 'button[data-testid="send-button"]'],
    },
    chatgpt: {
      url: "https://chatgpt.com/",
      editor: ["#prompt-textarea", 'div.ProseMirror[contenteditable="true"]', "textarea"],
      send: ['button[data-testid="send-button"]', 'button[aria-label*="Send" i]'],
    },
    gemini: {
      url: "https://gemini.google.com/app",
      editor: [
        'rich-textarea div.ql-editor[contenteditable="true"]',
        'div.ql-editor[contenteditable="true"]',
        '[contenteditable="true"][role="textbox"]',
      ],
      send: ['button[aria-label*="Send" i]', "button.send-button"],
    },
    perplexity: {
      url: "https://www.perplexity.ai/",
      editor: ['div[contenteditable="true"][role="textbox"]', "textarea"],
      send: ['button[aria-label*="Submit" i]', 'button[aria-label*="Send" i]'],
    },
    deepseek: {
      url: "https://chat.deepseek.com/",
      editor: ["textarea#chat-input", "textarea"],
      send: ['button[type="submit"]'],
    },
    grok: {
      url: "https://grok.com/",
      editor: ["textarea", 'div[contenteditable="true"]'],
      send: ['button[type="submit"]', 'button[aria-label*="Submit" i]'],
    },
    copilot: {
      url: "https://copilot.microsoft.com/",
      editor: ["textarea#userInput", "textarea", '[contenteditable="true"]'],
      send: ['button[aria-label*="Submit" i]', 'button[data-testid="submit-button"]'],
    },
    mistral: {
      url: "https://chat.mistral.ai/chat",
      editor: ['div.ProseMirror[contenteditable="true"]', "textarea"],
      send: ['button[type="submit"]', 'button[aria-label*="Send" i]'],
    },
  };

  const idForHost = (host) =>
    Object.keys(SITES).find((id) => SITES[id].hosts.includes(host)) || null;

  globalThis.CT = { SITES, TARGETS, idForHost };
})();
