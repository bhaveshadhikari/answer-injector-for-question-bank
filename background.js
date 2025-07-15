let latestModalContent = '';

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'modal-content') {
    latestModalContent = message.content;
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'get-modal-content') {
    sendResponse({ content: latestModalContent });
  }
});
