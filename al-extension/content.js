window.onload = function() {
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
    highlighted = document.body.innerHTML;
    Object.keys(academicWords).forEach(category => {
        academicWords[category].forEach(word => {
            console.log("i");
            const regex = new RegExp(`\\b${word}\\b(?![^<]*>)`, "i");
            highlighted = highlighted.replace(regex, `<span class="highlighted" style="background-color: pink;">${word}</span>`);

        });
    });
    document.body.innerHTML = highlighted;
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

// function learnWord(word) {
//     console.log(`Learning: ${word}`);
// }

// function ignoreWord(word) {
//     console.log(`Ignored: ${word}`);
// }
