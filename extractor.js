// Injected into the active tab when you click the extension.
// Reads the conversation and returns:
//   { siteId, source, title, method, messages: [{ role: "user" | "assistant" | "note", text }] }
//
// Order of attempts: site-specific reader → generic reader → your text selection.
(() => {
  const clean = (s) => (s || "").replace(/ /g, " ").replace(/\n{3,}/g, "\n\n").trim();
  const text = (el) => clean(el.innerText !== undefined ? el.innerText : el.textContent);

  // Keep only elements that are not inside another element of the same list.
  const outermost = (nodes) => nodes.filter((n) => !nodes.some((o) => o !== n && o.contains(n)));
  // Keep only elements that do not contain another element of the same list.
  const innermost = (nodes) => nodes.filter((n) => !nodes.some((o) => o !== n && n.contains(o)));

  // Turn an AI answer's HTML into light Markdown so code, lists and links survive.
  function toMarkdown(root) {
    const clone = root.cloneNode(true);
    clone
      .querySelectorAll("button, mat-icon, svg, style, script, .cdk-visually-hidden, .sr-only, [aria-hidden='true']")
      .forEach((n) => n.remove());

    clone.querySelectorAll("pre").forEach((pre) => {
      const code = (pre.innerText !== undefined ? pre.innerText : pre.textContent).replace(/^\s*(copy|code)\s*\n/i, "");
      pre.replaceWith(document.createTextNode("\n```\n" + code.trim() + "\n```\n"));
    });
    clone.querySelectorAll("code").forEach((c) => c.replaceWith(document.createTextNode("`" + c.textContent + "`")));
    clone.querySelectorAll("h1,h2,h3,h4,h5,h6").forEach((h) => {
      h.replaceWith(document.createTextNode("\n" + "#".repeat(Number(h.tagName[1])) + " " + h.textContent.trim() + "\n"));
    });
    clone.querySelectorAll("strong,b").forEach((n) => n.replaceWith(document.createTextNode("**" + n.textContent + "**")));
    clone.querySelectorAll("em,i").forEach((n) => n.replaceWith(document.createTextNode("*" + n.textContent + "*")));
    clone.querySelectorAll("a[href]").forEach((a) => {
      const t = a.textContent.trim();
      if (t) a.replaceWith(document.createTextNode(`[${t}](${a.href})`));
    });
    clone.querySelectorAll("ol").forEach((ol) => {
      [...ol.children].forEach((li, i) => li.prepend(document.createTextNode(`${i + 1}. `)));
    });
    clone.querySelectorAll("ul > li").forEach((li) => li.prepend(document.createTextNode("- ")));
    clone.querySelectorAll("li").forEach((li) => li.append(document.createTextNode("\n")));
    clone.querySelectorAll("tr").forEach((tr) => {
      const cells = [...tr.children].map((c) => c.textContent.trim());
      tr.replaceWith(document.createTextNode("| " + cells.join(" | ") + " |\n"));
    });
    clone.querySelectorAll("p, div, br").forEach((n) => n.append(document.createTextNode("\n")));
    return clean(clone.textContent);
  }

  // ---------- Site-specific readers ----------
  const READERS = {
    gemini() {
      const out = [];
      document.querySelectorAll("user-query, model-response").forEach((el) => {
        if (el.tagName.toLowerCase() === "user-query") {
          const body = el.querySelector(".query-text, .query-content") || el;
          const t = text(body);
          if (t) out.push({ role: "user", text: t });
        } else {
          const body = el.querySelector("message-content .markdown, message-content, .markdown, .response-content") || el;
          const t = toMarkdown(body);
          if (t) out.push({ role: "assistant", text: t });
        }
      });
      return out;
    },

    chatgpt() {
      const out = [];
      document.querySelectorAll("[data-message-author-role]").forEach((el) => {
        const role = el.getAttribute("data-message-author-role") === "user" ? "user" : "assistant";
        const body = el.querySelector(".markdown") || el;
        const t = role === "user" ? text(body) : toMarkdown(body);
        if (t) out.push({ role, text: t });
      });
      return out;
    },

    claude() {
      const out = [];
      const nodes = outermost([...document.querySelectorAll('[data-testid="user-message"], .font-claude-response')]);
      nodes.forEach((el) => {
        const isUser = el.matches('[data-testid="user-message"]');
        const t = isUser ? text(el) : toMarkdown(el);
        if (t) out.push({ role: isUser ? "user" : "assistant", text: t });
      });
      return out;
    },
  };

  // ---------- Generic reader (works on many chat UIs, but is a best guess) ----------
  function readGeneric() {
    const USER = /user|human|query|prompt|question|\bme\b/i;
    const BOT = /assistant|\bbot\b|model|response|answer|\bai\b|reply|markdown|claude|gpt|gemini|grok|copilot/i;

    const candidates = [
      ...document.querySelectorAll(
        "[data-message-author-role], [data-role], [data-author], [data-testid], [class*='message' i], [class*='turn' i], [class*='bubble' i], [class*='query' i], [class*='response' i], [class*='answer' i]"
      ),
    ];

    const classified = [];
    for (const el of candidates) {
      if (["BUTTON", "NAV", "ASIDE", "HEADER", "FOOTER", "FORM", "TEXTAREA", "INPUT"].includes(el.tagName)) continue;
      const sig = [
        el.getAttribute("data-message-author-role"),
        el.getAttribute("data-role"),
        el.getAttribute("data-author"),
        el.getAttribute("data-testid"),
        typeof el.className === "string" ? el.className : "",
        el.tagName,
      ].join(" ");
      let role = null;
      if (USER.test(sig)) role = "user";
      else if (BOT.test(sig)) role = "assistant";
      if (role) classified.push({ el, role });
    }

    const leaves = innermost(classified.map((c) => c.el));
    const roleOf = new Map(classified.map((c) => [c.el, c.role]));
    const out = [];
    const seen = new Set();
    for (const el of leaves) {
      const role = roleOf.get(el);
      const t = role === "user" ? text(el) : toMarkdown(el);
      if (t.length < 2 || seen.has(t)) continue;
      seen.add(t);
      out.push({ role, text: t });
    }
    return out;
  }

  // ---------- Run ----------
  const host = location.hostname;
  const site = Object.entries((globalThis.CT && globalThis.CT.SITES) || {}).find(([, s]) => s.hosts.includes(host));
  const siteId = site ? site[0] : null;
  const source = site ? site[1].name : host.replace(/^www\./, "");

  let messages = [];
  let method = "none";

  if (siteId && READERS[siteId]) {
    messages = READERS[siteId]();
    if (messages.length) method = "site";
  }
  if (!messages.length) {
    messages = readGeneric();
    if (messages.length) method = "generic";
  }
  if (!messages.length) {
    const sel = clean(String(window.getSelection ? window.getSelection() : ""));
    if (sel) {
      messages = [{ role: "note", text: sel }];
      method = "selection";
    }
  }

  let title = document.title.replace(/\s*[-–|—]\s*(Gemini|ChatGPT|Claude|Perplexity|DeepSeek|Grok|Copilot|Le Chat).*$/i, "").trim();
  // A bare site name isn't a useful chat title.
  if (/^(Gemini|ChatGPT|Claude|Perplexity|DeepSeek|Grok|Copilot|Le Chat)$/i.test(title)) title = "";
  return { siteId, source, title, method, messages };
})();
