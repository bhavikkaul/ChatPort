// Tiny helper: lets the fill script on a page learn which tab it is running in,
// so a transfer only lands in the tab the extension opened (not some other open tab).
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === "whoami") {
    sendResponse({ tabId: sender.tab ? sender.tab.id : null });
  }
});
