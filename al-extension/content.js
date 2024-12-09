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

    paragraphs.forEach(paragraph => {
        if (shouldBreak) return;

        if (number_of_highlights >= 40) {
            shouldBreak = true; // Set the flag to true to indicate we should stop
            return; // Exit the current iteration
        }

        let text = paragraph.innerHTML;

        if (paragraph.tagName.toLowerCase() === 'style' || 
            paragraph.tagName.toLowerCase() === 'script' || 
            paragraph.classList.contains('highlighted') || 
            paragraph.hasAttribute('data-ved')) {
            return;
        }

        for (const word of Object.keys(academicWordsReference)) {
            if (highlighted_words.has(word)) {
                //console.log("yeah-");
                continue;
            }

            let regex = new RegExp(`\\b${word}\\b(?![^<]*>)`, "i");
            if (regex.test(text)) {
                // Replace only the first occurrence for this word
                number_of_highlights += 1;
                text = text.replace(regex, (match) => {
                    highlighted_words.add(word); // Mark the word as highlighted
                    return `<span class="highlighted" style="background-color: pink;">${match}</span>`;
                });
                //break; // Stop the loop after the first replacement
            }
        }
        paragraph.innerHTML = text; // Update only the paragraph's innerHTML
        console.log("highlighted paragraph!")
    });
    console.log("number of words highlgihted: ", number_of_highlights)
}

async function addPopups() {
    $(document).on('mouseenter', '.highlighted', function (event) {
        const element = $(this);
        element.data("isHovered", true);
        console.log("Mouse entered highlighted element:", element.text());

        const word = element.text();

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
            left: `${event.clientX}px`,
            top: `${event.clientY - 30}px`,
            backgroundColor: 'white',
            border: '1px solid black',
            padding: '10px',
            borderRadius: '5px',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
            pointerEvents: 'auto', // Allow interactions
        });
        popup.innerHTML = `
            <p>Word: ${word}</p>
            <button id="masterButton">Master</button>
            <button id="learnButton">Learn</button>
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
        });
        popup.querySelector('#learnButton').addEventListener('click', () => {
            console.log("Learn clicked for:", word);
            learnWord(word);
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

function handleClick(event) {
    const word = event.target.dataset.word; // Get the word from the data attribute
    if (event.target.id === "masterButton") {
        masterWord(word);
    } else if (event.target.id === "learnButton") {
        learnWord(word);
    }
}

function learnWord(word) {
    console.log(`Learning: ${word}`);
    

    document.querySelectorAll('.highlighted').forEach(element => {
        if (element.innerText === word) {
            // Remove the popup if it exists
            if (element.popup) {
                document.body.removeChild(element.popup);
                element.popup = null;
            }
            // Remove event listeners
            //element.removeEventListener('mouseenter', handleClick);
            $(element).off();
            console.log("Removed:", word);
        }
    });

    dehighlightWord(word);
    
    const longmanUrl = `https://www.ldoceonline.com/dictionary/${word}`;
    window.open(longmanUrl, '_blank'); // Open the Longman dictionary in a new tab
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
    const loader = document.createElement('div');
    loader.id = 'extension-loader';

    const loaderText = document.createElement('div');
    loaderText.id = 'extension-loader-text';
    loaderText.textContent = 'Highlighting...';     

    // Add CSS to the loader
    const style = document.createElement('style');
    style.textContent = `
        #extension-loader {
            position: fixed;
            top: 10px;
            left: 30px;
            width: 30px;
            height: 30px;
            border: 6px solid rgba(0, 0, 0, 0.2);
            border-top: 4px solid #000;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            z-index: 10000;
        }
        #extension-loader-text {
            position: fixed;
            top: 45px; /* Adjusted to position below the loader */
            left: 10px;1
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
    document.head.appendChild(style);
    document.body.appendChild(loader);
    document.body.appendChild(loaderText);
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
