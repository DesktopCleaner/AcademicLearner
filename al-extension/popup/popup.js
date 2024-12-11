function showMasteredWords() {
    console.log("dropdown!");

    // Reference the existing header and search input from the DOM
    const header = document.querySelector('.header-container h3'); // Assuming the header is in a container
    const searchInput = document.getElementById('search-input'); // Reference the existing search input

    // Clear the existing list
    const list = document.getElementById('mastered-words-list');
    list.innerHTML = ''; // Clear existing list

    searchInput.addEventListener('keydown', (event) => {
        console.log("Key pressed: ", event.key); // Debugging log for any key press
        if (event.key === 'Enter') {
            event.preventDefault(); // Prevent default action
            console.log("Enter key pressed!"); // Debugging log
            
            const inputText = searchInput.value; // Get the input text
            console.log("Input text: ", inputText); // Log the input text for debugging
            displayWords(inputText.toLowerCase()); // Call displayWords with the current input value
        }
    });

    console.log("Search input added to DOM."); // Confirm input is added

    // Display all mastered words initially
    chrome.storage.sync.get(['masteredWords'], (result) => {
        const masteredWords = result.masteredWords || [];
        displayWords(''); // Show all words initially
    });
}

function displayWords(filter) {
    const list = document.getElementById('mastered-words-list');
    list.innerHTML = ''; // Clear existing list

    chrome.storage.sync.get(['masteredWords'], (result) => {
        const masteredWords = result.masteredWords || [];
        const filteredWords = masteredWords.filter(word => word.toLowerCase().startsWith(filter));

        filteredWords.forEach(word => {
            const listItem = document.createElement('li');
            listItem.textContent = word;

            // Create a toggle button
            const toggleButton = document.createElement('button');
            toggleButton.textContent = 'Toggle Mastery';
            toggleButton.onclick = () => toggleMasteredWord(word);

            listItem.appendChild(toggleButton);
            list.appendChild(listItem);
        });
    });
}


function toggleMasteredWord(word) {
    chrome.storage.sync.get(['masteredWords'], (result) => {
        let masteredWords = result.masteredWords || [];
        if (masteredWords.includes(word)) {
            // Remove the word from mastered
            masteredWords = masteredWords.filter(w => w !== word);
        } else {
            // Add the word to mastered
            masteredWords.push(word);
        }

        // Update storage
        chrome.storage.sync.set({ masteredWords }, () => {
            console.log(`Toggled mastery for: ${word}`);
            showMasteredWords(); // Refresh the list
        });
    });
    console.log("demastered!");
}

// Call this function to display mastered words when the popup is opened
showMasteredWords();