window.onload = async function() {

    showLoader();
    await highlightWords(); // Call your function here
    hideLoader();
    addPopups();
};

async function loadData() {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ action: "getData" }, (response) => {
            if (response.data) {
                console.log("Dict loaded!!!");
                console.log(response.data["access"]);
                resolve({
                    academicWords: response.data.academic_words,
                    academicWordsReference: response.data.academic_words_reference
                }); // Resolve the promise with both data sets
            } else {
                console.error(response.error);
                reject(new Error(response.error)); // Reject the promise on error
            }
        });
    });
}

async function highlightWords() {
    const { academicWords, academicWordsReference } = await loadData();
    const paragraphs = document.querySelectorAll('p'); // Targeting only paragraph elements
    const highlighted_words = new Set();
    let number_of_highlights = 0;
    let shouldBreak = false;
    console.log("start highlighting!")

    // Load words that have been learned or mastered
    await chrome.storage.sync.get(['masteredWords'], (result) => {
        const masteredWords = result.masteredWords || [];

        for (const paragraph of paragraphs) {
            if (number_of_highlights >= 40) {
                shouldBreak = true; // Set the flag to true to indicate we should stop
                console.log("reached max number");
                break; // Exit the loop
            }

            let text = paragraph.innerHTML;

            if (paragraph.tagName.toLowerCase() === 'style' || 
                paragraph.tagName.toLowerCase() === 'script' || 
                paragraph.classList.contains('highlighted') || 
                paragraph.hasAttribute('data-ved')) {
                continue;
            }

            for (const word of Object.keys(academicWordsReference)) {
                if (highlighted_words.has(word) || masteredWords.includes(word)) {
                    continue;
                }

                let regex = new RegExp(`\\b${word}\\b(?![^<]*>)`, "i");
                if (number_of_highlights >= 40) {
                    shouldBreak = true; // Set the flag to true to indicate we should stop
                    console.log("reached max number");
                    break; // Exit the loop
                }

                if (regex.test(text)) {
                    number_of_highlights += 1;
                    console.log("highlighted a word!");
                    text = text.replace(regex, (match) => {
                        highlighted_words.add(word); // Mark the word as highlighted
                        return `<span class="highlighted" style="background-color: pink;">${match}</span>`;
                    });


                }
            }
            paragraph.innerHTML = text; // Update only the paragraph's innerHTML
            console.log("highlighted paragraph!")
        };
        console.log("number of words highlighted: ", number_of_highlights)
        
    });
    
}

async function addPopups() {
    $(document).on('mouseenter', '.highlighted', function (event) {
        const element = $(this);
        element.data("isHovered", true);
        console.log("Mouse entered highlighted element:", element.text());

        const word = element.text();
        const low_word = word.toLowerCase();

        // Check if a popup already exists for this element
        if (element.data('shadowHost')) {
            console.log("Popup already exists for this element.");
            return; // Skip creating a new popup if one exists
        }

        // Create shadow host and attach to the body
        const shadowHost = $('<div></div>')
            .css({
                position: 'fixed',
                left: '0px',
                top: '0px',
                zIndex: '9999',
                pointerEvents: 'none',
                width: '0px',
                height: '0px',
            })
            .appendTo('body')[0];

        // Attach shadow DOM
        const shadowRoot = shadowHost.attachShadow({ mode: 'open' });

        // Create popup as a native DOM element
        const popup = document.createElement('div');
        popup.classList.add('popup');
        Object.assign(popup.style, {
            position: 'fixed',
            left: `${element[0].getBoundingClientRect().left - 50}px`,
            top: `${element[0].getBoundingClientRect().top + 18}px`,
            backgroundColor: 'rgba(255, 105, 180, 0.5)', // Updated to make it half transparent pink
            border: '1px solid black',
            padding: '10px',
            borderRadius: '5px',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
            pointerEvents: 'auto', // Allow interactions
        });
        popup.innerHTML = `
            <p style="font-weight: bold; color: lightgreen;">Word: <span style="background-color: white; color: black;">${low_word}</span></p>
            <button id="masterButton">Master</button>
            <button id="learnButton">Learn</button>
            <button id="passButton">Pass</button>
        `;
        shadowRoot.appendChild(popup);

        // Store shadowHost reference for later use
        element.data('shadowHost', shadowHost);
        element.data('isHovered', true);

        // Add hover detection to the popup
        popup.addEventListener('mouseenter', () => {
            console.log("Popup hovered!");
            element.data('isPopupHovered', true);
        });

        popup.addEventListener('mouseleave', () => {
            console.log("Popup left!");
            element.data('isPopupHovered', false);
            setTimeout(() => {
                if (!element.data('isHovered')) {
                    shadowHost.remove();
                    element.removeData('shadowHost'); // Remove data once the popup is removed
                }
            }, 100);
        });

        // Add button functionality
        popup.querySelector('#masterButton').addEventListener('click', () => {
            console.log("Master clicked for:", word);
            masterWord(word);
            shadowHost.remove();
            element.removeData('shadowHost');
        });
        popup.querySelector('#learnButton').addEventListener('click', () => {
            console.log("Learn clicked for:", word);
            learnWord(word);
            shadowHost.remove();
            element.removeData('shadowHost');
        });
        popup.querySelector('#passButton').addEventListener('click', () => {
            console.log("Pass clicked for:", word);
            passWord(word);
            shadowHost.remove();
            element.removeData('shadowHost');
        });
    });

    $(document).on('mouseleave', '.highlighted', function () {
        const element = $(this);
        console.log("Mouse left highlighted element:", element.text());
        element.data('isHovered', false);

        const shadowHost = element.data('shadowHost');
        setTimeout(() => {
            // Only remove the popup if it's not hovered and no longer needed
            if (!element.data('isPopupHovered') && shadowHost) {
                shadowHost.remove();
                element.removeData('shadowHost');
            }
        }, 100);
    });
}

function learnWord(word) {
    const low_word = word.toLowerCase();
    console.log(`Learning: ${word}`);
    
    // Store the word in sync storage
    // chrome.storage.sync.get(['learnedWords'], (result) => {
    //     const learnedWords = result.learnedWords || [];
    //     learnedWords.push(word);
    //     chrome.storage.sync.set({ learnedWords: learnedWords }, () => {
    //         console.log(`Word ${word} marked as learned.`);
    //     });
    // });

    dehighlightWord(word);
    
    const longmanUrl = `https://dictionary.cambridge.org/dictionary/english/${low_word}`;
    window.open(longmanUrl, '_blank'); // Open the Longman dictionary in a new tab
}

function masterWord(word) {
    const low_word = word.toLowerCase();
    console.log(`Mastering: ${low_word}`);
    
    // Store the word in sync storage
    chrome.storage.sync.get(['masteredWords'], (result) => {
        const masteredWords = result.masteredWords || [];
        masteredWords.push(low_word);
        chrome.storage.sync.set({ masteredWords: masteredWords }, () => {
            console.log(`Word ${low_word} marked as mastered.`);
        });
    });

    dehighlightWord(word);
}

function passWord(word) {
    dehighlightWord(word);
}

function dehighlightWord(word) {
    document.querySelectorAll('.highlighted').forEach(element => {
        if (element.innerText === word) {
            element.classList.remove('highlighted');
            element.style.backgroundColor = ''; // Remove the background color
        }
    });
}

function showLoader() {
    // Check if loader already exists
    if (document.getElementById('extension-loader')) return;

    // Create the loader element
    const loader = document.createElement('img');
    loader.id = 'extension-loader';
    loader.src = chrome.runtime.getURL('icons/icon48.png'); // Use chrome.runtime.getURL to get the image path
    console.log("Loader source set to:", loader.src); // Debugging line
    loader.style.position = 'fixed';
    loader.style.top = '10px';
    loader.style.left = '30px';
    loader.style.zIndex = '10000';
    loader.style.width = '48px';
    loader.style.height = '48px';
    loader.style.animation = 'spin 1s linear infinite'; // Keep the spinning animation
    //loader.style.border = '2px solid blue'; // Add a border for visibility
    //loader.style.backgroundColor = 'red'; // Temporary for testing
    loader.style.alignItems = 'center'; // Center vertically
    loader.style.justifyContent = 'center'; // Center horizontally


    // Append the loader to the body only after it loads

    loader.onerror = function() {
        console.error("Failed to load image:", loader.src); // Log error if image fails to load
    };
    
    const loaderText = document.createElement('div');
    loaderText.id = 'extension-loader-text';
    loaderText.textContent = 'Highlighting...';     

    // Add CSS to the loader text
    const style = document.createElement('style');
    style.textContent = `
        #extension-loader-text {
            position: fixed;
            top: 70px; /* Adjusted to position below the loader */
            left: 10px;
            font-size: 16px;
            color: #FF69B4; /* Highlighted in pink */
            z-index: 10000;
            font-weight: bold; /* Made text bold */
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;

    // Append the style and loader to the document
    document.body.appendChild(loader); 
    document.head.appendChild(style);
    document.body.appendChild(loaderText);
    console.log("Loader should now be visible.");
}

function hideLoader() {
    const loader = document.getElementById('extension-loader');
    const loaderText = document.getElementById('extension-loader-text');
    if (loader) {
        loader.remove();
    }

    if (loaderText) {
        loaderText.remove();
    }
}

// function handleClick(event) {
//     const word = event.target.dataset.word; // Get the word from the data attribute
//     if (event.target.id === "masterButton") {
//         masterWord(word);
//     } else if (event.target.id === "learnButton") {
//         learnWord(word);
//     }
// }