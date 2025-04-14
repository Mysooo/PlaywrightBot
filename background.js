chrome.runtime.onInstalled.addListener(() => {
    console.log('Playwright Flow Generator extension installed.');
  });
  
  // Listen for messages from the content script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'generateLocatorFlow') {
      // Here, you can handle the logic to send locators to Gemini API or log them
      console.log('Generating flow with locator:', message.locator);
      // You can also call your API here or perform other actions
      sendResponse({status: 'success'});
    }
  });
  