const $ = (id) => document.getElementById(id);
const { SITES, TARGETS, idForHost } = CT;

const LONG_CHARS = 150000; // warn above this; many chat UIs struggle with bigger pastes

function setStatus(msg, kind = "") {
  $("status").textContent = msg;
  $("status").className = kind;
}

// ---------- Prompt building ----------
function buildPrompt({ source, title, messages }, targetName, note) {
  const label = (role) => (role === "user" ? "User" : role === "note" ? "Selected text" : source);
  const transcript = messages.map((m) => `### ${label(m.role)}\n${m.text}`).join("\n\n");
  const where = targetName ? `here on ${targetName}` : "in this new chat";

  const lines = [
    `I'm continuing a conversation I started on ${source}${title ? ` (titled "${title}")` : ""} ${where}. ` +
      `The transcript is below. Treat it as our shared history and pick up exactly where it left off. ` +
      `Don't repeat it back — reply with one short line saying where we are and what comes next.`,
  ];
  if (note) lines.push("", `My instruction: ${note}`);
  lines.push("", "<transcript>", transcript, "</transcript>");
  return lines.join("\n");
}

// ---------- Reading the page ----------
let detected = { id: null, name: null };

async function activeTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function extract() {
  const tab = await activeTab();
  if (!tab || !/^https?:/.test(tab.url || "")) {
    throw new Error("Open the chat you want to move in a normal browser tab first.");
  }
  const [{ result }] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["providers.js", "extractor.js"],
  });
  if (!result || !result.messages.length) {
    throw new Error("Couldn't find any messages. Scroll the chat so it's loaded, or select the text you want and try again.");
  }
  const n = Number($("lastN").value);
  if (n > 0) result.messages = result.messages.slice(-n);
  return result;
}

function reportReadQuality(data, promptLength) {
  const parts = [`Read ${data.messages.length} message${data.messages.length === 1 ? "" : "s"} from ${data.source}.`];
  if (data.method === "generic") parts.push("Used generic detection — check the result looks right.");
  if (data.method === "selection") parts.push("No chat found, so I used your selected text.");
  if (promptLength > LONG_CHARS) parts.push("Very long — consider “Last N messages”.");
  const kind = data.method !== "site" || promptLength > LONG_CHARS ? "warn" : "";
  return [parts.join(" "), kind];
}

// ---------- Setup ----------
async function init() {
  for (const [id, t] of Object.entries(TARGETS)) {
    const opt = document.createElement("option");
    opt.value = id;
    opt.textContent = SITES[id].name;
    $("target").appendChild(opt);
  }

  const saved = await chrome.storage.local.get(["lastTarget", "autoSend"]);
  if (saved.lastTarget && TARGETS[saved.lastTarget]) $("target").value = saved.lastTarget;
  $("autoSend").checked = !!saved.autoSend;

  const tab = await activeTab();
  try {
    const host = new URL(tab.url).hostname;
    const id = idForHost(host);
    detected = { id, name: id ? SITES[id].name : host.replace(/^www\./, "") };
    $("from").textContent = id ? detected.name : `${detected.name} (generic page)`;
    // Default the destination to something different from where you are.
    if (id && $("target").value === id) {
      const other = Object.keys(TARGETS).find((t) => t !== id);
      if (other) $("target").value = other;
    }
  } catch (_) {
    $("from").textContent = "This page";
  }
}

// ---------- Actions ----------
$("go").addEventListener("click", async () => {
  $("go").disabled = true;
  try {
    setStatus("Reading conversation…");
    const data = await extract();
    const targetId = $("target").value;
    const target = TARGETS[targetId];
    const prompt = buildPrompt(data, SITES[targetId].name, $("note").value.trim());
    const [msg, kind] = reportReadQuality(data, prompt.length);

    await chrome.storage.local.set({ lastTarget: targetId, autoSend: $("autoSend").checked });
    await chrome.storage.local.set({
      pendingTransfer: {
        prompt,
        targetId,
        autoSend: $("autoSend").checked,
        count: data.messages.length,
        createdAt: Date.now(),
        tabId: null,
      },
    });
    try { await navigator.clipboard.writeText(prompt); } catch (_) {}

    setStatus(`${msg} Opening ${SITES[targetId].name}…`, kind);
    const newTab = await chrome.tabs.create({ url: target.url });

    // Tie the transfer to the tab we just opened.
    const { pendingTransfer } = await chrome.storage.local.get("pendingTransfer");
    if (pendingTransfer) {
      pendingTransfer.tabId = newTab.id;
      await chrome.storage.local.set({ pendingTransfer });
    }
    if (kind !== "warn") window.close();
  } catch (e) {
    setStatus(e.message, "err");
  } finally {
    $("go").disabled = false;
  }
});

$("copy").addEventListener("click", async () => {
  try {
    const data = await extract();
    const prompt = buildPrompt(data, null, $("note").value.trim());
    await navigator.clipboard.writeText(prompt);
    const [msg, kind] = reportReadQuality(data, prompt.length);
    setStatus(`${msg} Copied to clipboard.`, kind);
  } catch (e) {
    setStatus(e.message, "err");
  }
});

$("download").addEventListener("click", async () => {
  try {
    const data = await extract();
    const prompt = buildPrompt(data, null, $("note").value.trim());
    const blob = new Blob([prompt], { type: "text/markdown" });
    const a = document.createElement("a");
    const safe = (data.title || data.source).replace(/[^\w\- ]+/g, "").trim().slice(0, 50) || "chat";
    a.href = URL.createObjectURL(blob);
    a.download = `${safe} - ${data.source}.md`;
    a.click();
    URL.revokeObjectURL(a.href);
    const [msg, kind] = reportReadQuality(data, prompt.length);
    setStatus(`${msg} Downloaded.`, kind);
  } catch (e) {
    setStatus(e.message, "err");
  }
});

init();
