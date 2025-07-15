let isProcessing = false; // Prevents multiple executions
let subject = null;
let GEMINI_API_KEY = null; // Global variable
// Fetch and store the key on script load
chrome.storage.local.get('apiKey', ({ apiKey }) => {
    GEMINI_API_KEY = apiKey;
});


async function callGemini(questionText,guidance) {
    if (!GEMINI_API_KEY){
        alert("Please click on extension icon and setup API key. ")
    }
    const res = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=" + GEMINI_API_KEY,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                contents: [{ parts: [{ text: subject + " answer the given question for bscs degree. attempt without wishes, greetings and acknowledgement. Just the answer ready to write in exam. Here is the question:" + questionText+" "+ guidance}] }],
            }),
        }

    );
    console.log(subject + " answer the given question for bscs degree. attempt without wishes, greetings and acknowledgement. Just the answer ready to write in exam. Here is the question:" + questionText+" "+ guidance)
    const data = await res.json();
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response";
    console.log(reply)

    return reply;
}

async function getStoredAnswer(questionText) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get([questionText], (result) => {
            if (result[questionText]) {
                resolve(result[questionText]);
            } else {
                resolve(null);  // explicitly resolve null if not found
            }
        });
    });
}

async function getNewAnswer(questionText,guidance) {
    const response = await callGemini(questionText,guidance);

    let obj = {};
    obj[questionText] = response;
    chrome.storage.local.set(obj, () => {
        console.log("Saved question and reply");
    });

    return response; // return fresh answer

}


// async function getAnswer(questionText) {
//     return new Promise((resolve, reject) => {
//       chrome.storage.local.get([questionText], async (result) => {
//         if (result[questionText]) {
//           // Return cached answer if found
//           resolve(result[questionText]);
//         } else {
//           // Not found, call Gemini API
//           const response = await callGemini(questionText);

//           // Save to chrome.storage.local with questionText as key
//           let obj = {};
//           obj[questionText] = response;
//           chrome.storage.local.set(obj, () => {
//             resolve(response);
//           });
//         }
//       });
//     });
//   }


const observer = new MutationObserver((mutationsList) => {
    subject = document.querySelector('.modal-title').textContent;
    const questionTrigger = document.querySelector('.modal-content-title p') ||
        document.querySelector('.modal-content-title span');
    const questionContainer = document.querySelector('.modal-content-title');
    const solutionContent = document.querySelector('.modal-content-content');
    if (!questionTrigger || !questionContainer || !solutionContent) return;

    const questionText = questionContainer.innerText.trim() || 'No question found';

    if (questionTrigger.dataset.injected !== "true") {
        console.log('Injecting answer UI for:', questionText);

        // Inject two divs: one for guidance+button, one for answer output
        solutionContent.innerHTML = `
            <div id="generateAnswerDiv" style="margin-bottom: 10px; display: flex; gap: 8px; align-items: center;">
            <input id="guidance" type="text" placeholder="Add instruction (optional)" style="flex: 1; padding: 6px 8px; border-radius: 5px; border: 1px solidrgb(11, 75, 30); font-size: 14px;"/>
            <button id="fetchAnswerBtn" style="padding: 6px 12px; border-radius: 5px; border: none; background-color:#80cf95;cursor: pointer;">🔍 Generate Answer </button>
            </div>
            <div id="answerDiv"></div>`;

        const fetchBtn = document.getElementById('fetchAnswerBtn');
        const answerDiv = document.getElementById('answerDiv');
        const guidanceInput = document.getElementById('guidance');

        getStoredAnswer(questionText).then(storedAnswer => {
            if (storedAnswer) {
                const html = marked.parse(storedAnswer);
                answerDiv.innerHTML = html;
            }
        });

        fetchBtn.addEventListener('click', async () => {
            fetchBtn.disabled = true;
            fetchBtn.textContent = "Generating...";
            const guidance = guidanceInput.value.trim();
            try {
                const response = await getNewAnswer(questionText, guidance);
                const html = marked.parse(response);
                answerDiv.innerHTML = html;
            } catch (e) {
                answerDiv.textContent = "Error fetching answer. Try again.";
                console.error(e);
            }

            fetchBtn.disabled = false;
            fetchBtn.textContent = "🔍 Generate Answer";
        });

        questionTrigger.dataset.injected = "true";
    }
});

//delete solution banner
const deleteContent = document.querySelector('.modal-content-solution');
if (deleteContent) {
    deleteContent.remove();
}

const modal = document.querySelector('.modal-dialog');
const modalBody = modal?.querySelector('.modal-body');

if (modalBody) {
    observer.observe(modalBody, {
        childList: true,
        subtree: true,
        characterData: true
    });
}