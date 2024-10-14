async function loadAcademicWords() {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ action: "getAcademicWords" }, (response) => {
            if (response.data) {
                console.log("Dict loaded!!!");
                console.log(response.data["analyse"]);
                resolve(response.data); // Resolve the promise with the data
            } else {
                console.error(response.error);
                reject(new Error(response.error)); // Reject the promise on error
            }
        });
    });
}

async function highlightWords() {
    const academic_words_dict = await loadAcademicWords();
    // const z = academic_words_dict["analyse"];
    // console.log(z);
    // console.log(typeof z);
    const bodyText = document.body.innerHTML;
    let highlightedText = bodyText;
    Object.keys(academic_words_dict).forEach(category => {
        academic_words_dict[category].forEach(word => {
            const regex = new RegExp(`\\b${word}\\b(?![^<]*>)`, 'gi'); // Avoid highlighting links
            highlightedText = highlightedText.replace(regex, `<span class="highlighted" style="background-color: pink;">${word}</span>`);
            console.log("highlighted")
        });
    });
    document.body.innerHTML = highlightedText.replace(/<select.*?<\/select>/g, function(match) {
        return match.replace(/<span.*?<\/span>/g, '');
    });
}

highlightWords();


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

// function learnWord(word) {
//     console.log(`Learning: ${word}`);
// }

// function ignoreWord(word) {
//     console.log(`Ignored: ${word}`);
// }
