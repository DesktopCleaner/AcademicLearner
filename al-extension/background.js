   // background.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getAcademicWords") {
        fetch(chrome.runtime.getURL('data/academic_words.json'))
            .then(response => response.json())
            .then(data => sendResponse({ data }))
            .catch(error => sendResponse({ error: error.message }));
        return true; // Keep the message channel open for sendResponse
    }
});
