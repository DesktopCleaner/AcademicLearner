// background.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getData") {
        Promise.all([
            fetch(chrome.runtime.getURL('data/academic_words.json')).then(response => response.json()),
            fetch(chrome.runtime.getURL('data/academic_words_reference.json')).then(response => response.json())
        ])
        .then(([academicWords, academicWordsReference]) => {
            sendResponse({ data: {
                academic_words: academicWords,
                academic_words_reference: academicWordsReference
            }});
        })
        .catch(error => sendResponse({ error: error.message }));
        return true; // Keep the message channel open for sendResponse
    }
});