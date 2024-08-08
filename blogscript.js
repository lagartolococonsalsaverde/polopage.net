const API_URL = 'http://localhost:3000';

let questions = [];
let expandedQuestions = new Set();

async function fetchQuestions() {
    try {
        const response = await fetch(`${API_URL}/api/questions`);
        questions = await response.json();
        renderQuestions();
    } catch (error) {
        console.error('Error fetching questions:', error);
    }
}

async function submitQuestion(event) {
    event.preventDefault();
    const questionInput = document.getElementById('questionInput');
    const question = questionInput.value.trim();
    
    if (question) {
        try {
            const response = await fetch(`${API_URL}/api/questions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: question }),
            });
            const result = await response.json();
            console.log('Question submitted:', result);
            questionInput.value = '';
            await fetchQuestions();
        } catch (error) {
            console.error('Error submitting question:', error);
        }
    }
}

async function submitReply(questionId) {
    const replyInput = document.getElementById(`replyInput-${questionId}`);
    const replyText = replyInput.value.trim();
    
    if (replyText) {
        try {
            const response = await fetch(`${API_URL}/api/questions/${questionId}/replies`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: replyText }),
            });
            const result = await response.json();
            console.log('Reply submitted:', result);
            replyInput.value = '';
            expandedQuestions.add(questionId);
            await fetchQuestions();
        } catch (error) {
            console.error('Error submitting reply:', error);
        }
    }
}

async function approveQuestion(id) {
    try {
        const response = await fetch(`${API_URL}/api/questions/${id}/approve`, {
            method: 'PUT',
        });
        const result = await response.json();
        console.log('Question approved:', result);
        await fetchQuestions();
    } catch (error) {
        console.error('Error approving question:', error);
    }
}

async function deleteQuestion(id) {
    if (confirm('Are you sure you want to delete this question?')) {
        try {
            const response = await fetch(`${API_URL}/api/questions/${id}`, {
                method: 'DELETE',
            });
            const result = await response.json();
            console.log('Question deleted:', result);
            expandedQuestions.delete(id);
            await fetchQuestions();
        } catch (error) {
            console.error('Error deleting question:', error);
        }
    }
}

function toggleReplies(questionId) {
    const repliesDiv = document.getElementById(`replies-${questionId}`);
    const toggleButton = document.getElementById(`toggleButton-${questionId}`);
    const question = questions.find(q => q._id === questionId);
    
    if (repliesDiv.style.display === 'none') {
        repliesDiv.style.display = 'block';
        toggleButton.textContent = `Hide Replies (${question.replies.length})`;
        expandedQuestions.add(questionId);
    } else {
        repliesDiv.style.display = 'none';
        toggleButton.textContent = `Show Replies (${question.replies.length})`;
        expandedQuestions.delete(questionId);
    }
}

function renderQuestions() {
    const questionList = document.getElementById('questionList');
    questionList.innerHTML = '';

    questions.forEach((question) => {
        const questionDiv = document.createElement('div');
        questionDiv.className = 'question';
        
        const isExpanded = expandedQuestions.has(question._id);
        
        let questionHTML = `
            <p>${question.approved ? '' : '[Pending] '}${question.text}</p>
            ${question.approved ? '' : `<button onclick="approveQuestion('${question._id}')">Approve</button>`}
            <button onclick="deleteQuestion('${question._id}')">Delete</button>
            <button id="toggleButton-${question._id}" onclick="toggleReplies('${question._id}')">
                ${isExpanded ? 'Hide' : 'Show'} Replies (${question.replies.length})
            </button>
            <div id="replies-${question._id}" style="display: ${isExpanded ? 'block' : 'none'};">
                ${question.replies.map(reply => `<p class="reply">${reply.text}</p>`).join('')}
                <div class="reply-form">
                    <input type="text" id="replyInput-${question._id}" placeholder="Write a reply...">
                    <button onclick="submitReply('${question._id}')">Reply</button>
                </div>
            </div>
        `;
        
        questionDiv.innerHTML = questionHTML;
        questionList.appendChild(questionDiv);
    });
}

document.addEventListener('DOMContentLoaded', function() {
    const questionForm = document.getElementById('questionForm');
    if (questionForm) {
        questionForm.addEventListener('submit', submitQuestion);
    }
    fetchQuestions();
});