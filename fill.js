// Runs on every supported AI site. If a transfer is waiting for THIS site and THIS tab,
// it puts the transcript into the prompt box (and optionally sends it).
(async () => {
  const id = CT.idForHost(location.hostname);
  const target = id && CT.TARGETS[id];
  if (!target) return;

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  // The popup stores the transfer, then adds the new tab's id a moment later — wait for it.
  let pending = null;
  for (let i = 0; i < 12; i++) {
    ({ pendingTransfer: pending } = await chrome.storage.local.get("pendingTransfer"));
    if (!pending || pending.targetId !== id) return;
    if (pending.tabId) break;
    await sleep(250);
  }
  if (!pending || pending.targetId !== id) return;

  // Ignore stale transfers (older than 3 minutes).
  if (Date.now() - pending.createdAt > 3 * 60 * 1000) {
    await chrome.storage.local.remove("pendingTransfer");
    return;
  }

  // Only act in the tab the extension opened.
  try {
    const me = await chrome.runtime.sendMessage({ type: "whoami" });
    if (pending.tabId && me && me.tabId !== pending.tabId) return;
  } catch (_) {}

  // ---------- helpers ----------
  const waitFor = async (fn, timeout = 20000) => {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      const el = fn();
      if (el) return el;
      await sleep(250);
    }
    return null;
  };
  const firstMatch = (selectors, extra) => {
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && (!extra || extra(el))) return el;
    }
    return null;
  };

  function toast(msg) {
    const d = document.createElement("div");
    d.textContent = msg;
    d.style.cssText =
      "position:fixed;z-index:2147483647;left:50%;bottom:24px;transform:translateX(-50%);" +
      "background:#222;color:#fff;padding:10px 16px;border-radius:10px;font:13px system-ui,sans-serif;" +
      "box-shadow:0 4px 16px rgba(0,0,0,.3);max-width:80vw;";
    document.body.appendChild(d);
    setTimeout(() => d.remove(), 6000);
  }

  async function insert(el, text) {
    el.focus();
    if (el.tagName === "TEXTAREA" || el.tagName === "INPUT") {
      const proto = el.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(proto, "value").set.call(el, text);
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
      return el.value.length > 0;
    }
    // contenteditable (ProseMirror, Quill, Lexical…): try a paste event first
    const dt = new DataTransfer();
    dt.setData("text/plain", text);
    el.dispatchEvent(new ClipboardEvent("paste", { clipboardData: dt, bubbles: true, cancelable: true }));
    await sleep(250);
    if (!el.innerText.trim()) document.execCommand("insertText", false, text);
    await sleep(150);
    return el.innerText.trim().length > 0;
  }

  // ---------- go ----------
  const editor = await waitFor(() => firstMatch(target.editor));
  if (!editor) {
    toast("Chat Transfer: couldn't find the prompt box. The transcript is on your clipboard — paste with Cmd+V.");
    return;
  }

  const ok = await insert(editor, pending.prompt);
  if (!ok) {
    toast("Chat Transfer: couldn't fill the prompt box. The transcript is on your clipboard — paste with Cmd+V.");
    return;
  }
  await chrome.storage.local.remove("pendingTransfer");

  if (pending.autoSend) {
    const btn = await waitFor(
      () => firstMatch(target.send, (b) => !b.disabled && b.getAttribute("aria-disabled") !== "true"),
      8000
    );
    if (btn) {
      btn.click();
      return;
    }
    toast("Chat Transfer: filled the chat, but couldn't find Send — press Enter to send.");
    return;
  }
  toast(`Chat Transfer: ${pending.count} messages loaded — review and press Send.`);
})();
