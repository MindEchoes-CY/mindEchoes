const questions = [
    {
        question: "What are your journalling goals",
        choices: ["Improve my mental health", "Understand myself better", "To express my current thoughts", "To grow as a person"]
    },
   
    {
        question: "Are you struggling with anything right now",
        choices: ["Sleep", "Lonliness", "Anger", "Grief","Depression"]
    },
     {
        question: "Your Preferred communication style",
        choices: ["Reflection Guide", "Tough Love Coach", "Fun Friend", "MindFul Mentor"]
    },
    
    
    // Add more questions as needed
];

let currentQuestion = 0;
let selectedChoices = [];

const questionElement = document.getElementById("question");
const choicesForm = document.getElementById("mcq-choices");

function displayQuestion() {
    const current = questions[currentQuestion];
    questionElement.textContent = current.question;

    choicesForm.innerHTML = "";
    current.choices.forEach((choice, index) => {
        const p = document.createElement('p');
        p.innerText = "Select all that apply:"
        const input = document.createElement("input");
        input.type = "checkbox";
        input.value = index;
        input.id = "choice" + index;

        const label = document.createElement("label");
        label.htmlFor = "choice" + index;
        label.textContent = choice;
        

    
        const option = document.createElement("div");
        option.classList.add("option");
        option.appendChild(input);
        option.appendChild(label);
        
        choicesForm.appendChild(option);
        choicesForm.appendChild(option);
        choicesForm.appendChild(document.createElement("br"));
    });

    if (currentQuestion === 0) {
        // First question
        document.getElementById("next-btn").style.display = "block";
        document.getElementById("back-btn").style.display = "none";
        document.getElementById("submit-btn").style.display = "none";
    } else if (currentQuestion < questions.length - 1) {
        // Intermediate questions
        document.getElementById("back-btn").style.display = "block";
        document.getElementById("submit-btn").style.display = "none";
    } else {
        // Last question
        document.getElementById("next-btn").style.display = "none";
        document.getElementById("back-btn").style.display = "block";
        document.getElementById("submit-btn").style.display = "block";
    }
}


function getNextQuestion() {
    const selected = Array.from(choicesForm.querySelectorAll("input:checked")).map(input => ({
        index: input.value,
        text: input.nextElementSibling.textContent.trim()
    }));
    selectedChoices.push(selected);
    currentQuestion++;

    if (currentQuestion < questions.length) {
        displayQuestion();
    } else {
        // Submit form data
        submitFormData();
    }
}

function submitFormData() {
    const selected = Array.from(choicesForm.querySelectorAll("input:checked")).map(input => ({
        index: input.value,
        text: input.nextElementSibling.textContent.trim()
    }));
    selectedChoices.push(selected);

    fetch('/onBoarding', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(selectedChoices)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to submit answers');
        }
        return response.json();
    })
    .then(data => {
        console.log(data); // Handle the response from the backend
        // Redirect to another page
        window.location.href = '/aiChat';
    })
    .catch(error => {
        console.error(error);
    });
}

function goBack() {
    if (currentQuestion > 0) {
        currentQuestion--;
        displayQuestion();
    }
}

document.getElementById("next-btn").addEventListener("click", getNextQuestion);
document.getElementById("back-btn").addEventListener("click", goBack);
document.getElementById("submit-btn").addEventListener("click", submitFormData);


displayQuestion();