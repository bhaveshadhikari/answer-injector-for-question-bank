document.getElementById("savekey").onclick = () => {
  const key = document.getElementById("apikey").value;
  if (key) {
    chrome.storage.local.set({ apiKey: key }, () => {
      document.getElementById("savekey").textContent = "Key Saved Successfully!";
      document.getElementById("apikey").value = "";

      // Reload the active tab
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.reload(tabs[0].id);
        }
      });
    });
  }
};

  