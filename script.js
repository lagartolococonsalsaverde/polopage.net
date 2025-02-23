document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const askQuestionBtn = document.getElementById('askQuestionBtn');
    const questionForm = document.getElementById('questionForm');
    const newQuestionForm = document.getElementById('newQuestionForm');
    const cancelQuestionBtn = document.getElementById('cancelQuestion');
    const questionsList = document.getElementById('questionsList');
    const sortSelect = document.getElementById('sortSelect');

    // State
    let questions = JSON.parse(localStorage.getItem('questions')) || [];

    // Event Listeners
    askQuestionBtn.addEventListener('click', () => {
        questionForm.classList.remove('hidden');
    });

    cancelQuestionBtn.addEventListener('click', () => {
        questionForm.classList.add('hidden');
        newQuestionForm.reset();
    });

    newQuestionForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const title = document.getElementById('questionTitle').value;
        const content = document.getElementById('questionContent').value;
        
        const newQuestion = {
            id: Date.now(),
            title,
            content,
            votes: 0,
            timestamp: new Date().toISOString(),
            answers: []
        };

        questions.unshift(newQuestion);
        saveQuestions();
        renderQuestions();
        
        questionForm.classList.add('hidden');
        newQuestionForm.reset();
    });

    sortSelect.addEventListener('change', () => {
        renderQuestions();
    });

    // Functions
    function saveQuestions() {
        try {
            localStorage.setItem('questions', JSON.stringify(questions));
            console.log('Questions saved:', questions);
        } catch (error) {
            console.error('Error saving questions:', error);
        }
    }

    function formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
            const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
            if (diffHours === 0) {
                const diffMinutes = Math.floor(diffTime / (1000 * 60));
                return `${diffMinutes} minutes ago`;
            }
            return `${diffHours} hours ago`;
        }
        return `${diffDays} days ago`;
    }

    function renderAnswers(answers) {
        if (!answers || answers.length === 0) {
            return '<p class="no-answers">No answers yet. Be the first to answer!</p>';
        }
        return answers.map(answer => `
            <div class="answer">
                <p>${answer.content}</p>
                <div class="answer-metadata">
                    Posted ${formatTimestamp(answer.timestamp)}
                </div>
            </div>
        `).join('');
    }

    function renderQuestions() {
        const sortType = sortSelect.value;
        let sortedQuestions = [...questions];

        switch(sortType) {
            case 'popular':
                sortedQuestions.sort((a, b) => b.votes - a.votes);
                break;
            case 'newest':
                sortedQuestions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                break;
            case 'unanswered':
                sortedQuestions = sortedQuestions.filter(q => q.answers.length === 0);
                break;
        }

        questionsList.innerHTML = sortedQuestions.map(question => `
            <div class="question-card" data-id="${question.id}">
                <div class="vote-controls">
                    <button class="vote-button" onclick="handleVote(${question.id}, 1)">▲</button>
                    <span class="vote-count">${question.votes}</span>
                    <button class="vote-button" onclick="handleVote(${question.id}, -1)">▼</button>
                </div>
                <div class="question-content">
                    <h3 class="question-title">${question.title}</h3>
                    <p>${question.content}</p>
                    <div class="question-details">
                        Posted ${formatTimestamp(question.timestamp)} • 
                        ${question.answers.length} answers
                    </div>
                    <div class="answers-section">
                        <div class="answers-list">
                            ${renderAnswers(question.answers)}
                        </div>
                        <div class="answer-form">
                            <textarea placeholder="Write your answer..." id="answerContent-${question.id}" class="answer-input"></textarea>
                            <button onclick="submitAnswer(${question.id})" class="secondary-button">Submit Answer</button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Initialize
    renderQuestions();

    // Global functions (for onclick handlers)
    window.handleVote = function(questionId, voteValue) {
        const question = questions.find(q => q.id === questionId);
        if (question) {
            question.votes += voteValue;
            saveQuestions();
            renderQuestions();
        }
    };

    window.submitAnswer = function(questionId) {
        const answerInput = document.getElementById(`answerContent-${questionId}`);
        const content = answerInput.value.trim();
        
        if (!content) return;
        
        const question = questions.find(q => q.id === questionId);
        if (question) {
            const answer = {
                id: Date.now(),
                content,
                timestamp: new Date().toISOString()
            };
            
            question.answers.push(answer);
            saveQuestions();
            renderQuestions();
            answerInput.value = '';
        }
    };
});