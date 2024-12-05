window.onload = function() {
    loadAcademicWords();
    highlightWords(); // Call your function here
};

async function loadAcademicWords() {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ action: "getAcademicWords" }, (response) => {
            if (response.data) {
                console.log("Dict loaded!!!");
                console.log(response.data["access"]);
                resolve(response.data); // Resolve the promise with the data
            } else {
                console.error(response.error);
                reject(new Error(response.error)); // Reject the promise on error
            }
        });
    });
}

async function highlightWords() {
    const academicWords = await loadAcademicWords();
    const paragraphs = document.querySelectorAll('p'); // Targeting only paragraph elements

    paragraphs.forEach(paragraph => {
        let text = paragraph.innerHTML;

        if (paragraph.tagName.toLowerCase() === 'style' || 
            paragraph.tagName.toLowerCase() === 'script' || 
            paragraph.classList.contains('highlighted') || 
            paragraph.hasAttribute('data-ved')) {
            return;
        }

        Object.keys(academicWords).forEach((key) => {
            academicWords[key].forEach((word) => {
                let regex = new RegExp(`\\b${word}\\b(?![^<]*>)`, "i"); // Updated regex
                if (regex.test(text)) {
                    text = text.replace(regex, `<span class="highlighted" style="background-color: pink;">${word}</span>`);
                }
            });
        });
        paragraph.innerHTML = text; // Update only the paragraph's innerHTML
        console.log("highlighted!")
    });

    document.querySelectorAll('.highlighted').forEach(element => {
        element.addEventListener('mouseenter', (event) => {
            console.log("Im in!!");
            const word = element.innerText;
            const popup = document.createElement('div');
            popup.classList.add('popup');
            popup.style.position = 'absolute';
            popup.style.left = `${event.pageX}px`;
            popup.style.top = `${event.pageY - 30}px`; // Positioning the popup just above the word
            popup.style.backgroundColor = 'white';
            popup.style.border = '1px solid black';
            popup.style.padding = '5px';
            popup.style.zIndex = '1000';
            popup.innerHTML = `
                <button onclick="masterWord('${word}')">Master</button>
                <button onclick="learnWord('${word}')">Learn</button>
            `;
            document.body.appendChild(popup);
            element.popup = popup; // Store reference to the popup

            // Add event listeners to the popup to prevent it from closing
            popup.addEventListener('mouseenter', () => {
                element.isPopupHovered = true;
            });
            popup.addEventListener('mouseleave', () => {
                element.isPopupHovered = false;
                if (!element.isHovered) {
                    document.body.removeChild(popup);
                    element.popup = null;
                }
            });
        });

        element.addEventListener('mouseleave', () => {
            console.log("im out!!");
            element.isHovered = false;
            setTimeout(() => {
                if (!element.isPopupHovered && element.popup) {
                    document.body.removeChild(element.popup);
                    element.popup = null;
                }
            }, 100); // Small delay to allow mouse to move to popup
        });

        element.addEventListener('mouseenter', () => {
            element.isHovered = true;
        });
    });
}



//highlightWords();
// Run highlightWords after the DOM is fully loaded
console.log("here");





// document.addEventListener('dblclick', (event) => {
//     const target = event.target;
//     if (target.classList.contains('highlighted')) {
//         const word = target.innerText;
//         showMeaning(word, event.pageX, event.pageY);
//     }
// });

// function showMeaning(word, x, y) {
//     const meaning = "Meaning of " + word; // Replace with actual meaning lookup
//     const link = "https://www.dictionary.com/browse/" + word; // Example link
//     const messageBox = document.createElement('div');
//     messageBox.style.position = 'absolute';
//     messageBox.style.left = `${x}px`;
//     messageBox.style.top = `${y}px`;
//     messageBox.style.backgroundColor = 'white';
//     messageBox.style.border = '1px solid black';
//     messageBox.style.padding = '10px';
//     messageBox.style.zIndex = '1000';
//     messageBox.innerHTML = `
//         <div>${meaning}</div>
//         <a href="${link}" target="_blank">More details</a>
//         <div>
//             <button onclick="masterWord('${word}')">Master</button>
//             <button onclick="learnWord('${word}')">Learn</button>
//             <button onclick="ignoreWord('${word}')">Ignore</button>
//         </div>
//     `;
//     document.body.appendChild(messageBox);
// }

// // Placeholder functions for button actions
// function masterWord(word) {
//     console.log(`Mastered: ${word}`);
// }

function learnWord(word) {
    console.log(`Learning: ${word}`);
    const longmanUrl = `https://www.ldoceonline.com/dictionary/${word}`;
    window.open(longmanUrl, '_blank'); // Open the Longman dictionary in a new tab
}

// function ignoreWord(word) {
//     console.log(`Ignored: ${word}`);
// }
