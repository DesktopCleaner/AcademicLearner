window.onload = async function() {

    await highlightWords(); // Call your function here
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
    let highlighted_words = new Set();

    paragraphs.forEach(paragraph => {
        let text = paragraph.innerHTML;

        if (paragraph.tagName.toLowerCase() === 'style' || 
            paragraph.tagName.toLowerCase() === 'script' || 
            paragraph.classList.contains('highlighted') || 
            paragraph.hasAttribute('data-ved')) {
            return;
        }

        for (const word of Object.keys(academicWordsReference)) {
            if (word in highlighted_words) {
                continue;
            }
            let regex = new RegExp(`\\b${word}\\b(?![^<]*>)`, "i");
            if (regex.test(text)) {
                text = text.replace(regex, `<span class="highlighted" style="background-color: pink;">${word}</span>`);
                highlighted_words.add(word)
                break;
            }
        }

        paragraph.innerHTML = text; // Update only the paragraph's innerHTML
        console.log("highlighted!")
    });
}

async function addPopups() {
    const highlightedElements = $('.highlighted'); // Use jQuery to select highlighted elements
    if (highlightedElements.length === 0) {
        console.log("No highlighted elements found.");
        return;
    }

    highlightedElements.each(function() {
        const element = $(this);
        element.on('mouseenter', function(event) {
            console.log("Im in!!");
            const word = element.text();
            const popup = $('<div class="popup"></div>').css({
                position: 'absolute',
                left: `${event.pageX}px`,
                top: `${event.pageY - 30}px`,
                backgroundColor: 'white',
                border: '1px solid black',
                padding: '5px',
                zIndex: '1000'
            }).html(`
                <button id="masterButton">Master</button>
                <button id="learnButton">Learn</button>
            `);
            $('body').append(popup);
            element.data('popup', popup); // Store the popup in data

            $('#masterButton').on('click', function() {
                masterWord(word);
            });
            $('#learnButton').on('click', function() {
                learnWord(word);
            });

            popup.on('mouseenter', function() {
                element.data('isPopupHovered', true);
            });
            popup.on('mouseleave', function() {
                element.data('isPopupHovered', false);
                if (!element.data('isHovered')) {
                    popup.remove();
                    element.data('popup', null);
                }
            });
        });

        element.on('mouseleave', function() {
            console.log("im out!!");
            element.data('isHovered', false);
            setTimeout(() => {
                if (!element.data('isPopupHovered') && element.data('popup')) {
                    element.data('popup').remove();
                    element.data('popup', null);
                }
            }, 200);
        });

        element.on('mouseenter', function() {
            element.data('isHovered', true);
        });
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

// function ignoreWord(word) {
//     console.log(`Ignored: ${word}`);
// }
