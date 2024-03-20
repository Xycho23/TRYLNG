document.addEventListener('DOMContentLoaded', function () {
    let currentUser = null;

    checkSignIn();

    function checkSignIn() {
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
            currentUser = storedUser;
            showNoteInput();
        } else {
            showSignIn();
        }
    }

    function showSignIn() {
        const signInContainer = document.getElementById('signInContainer');
        const noteInputContainer = document.getElementById('noteInputContainer');
        signInContainer.style.display = 'block';
        noteInputContainer.style.display = 'none';
    }

    function showNoteInput() {
        const signInContainer = document.getElementById('signInContainer');
        const noteInputContainer = document.getElementById('noteInputContainer');
        signInContainer.style.display = 'none';
        noteInputContainer.style.display = 'block';
    }

    function signIn(username) {
        currentUser = username;
        localStorage.setItem('currentUser', username);
        alert(`Welcome, ${username}! You are now signed in.`);
        showNoteInput();
    }

    function signOut() {
        currentUser = null;
        localStorage.removeItem('currentUser');
        alert('You have been signed out.');
        location.reload(); // Reload the page to reflect sign out
    }

    const signInBtn = document.getElementById('signInBtn');
    if (signInBtn) {
        signInBtn.addEventListener('click', function () {
            const usernameInput = document.getElementById('username');
            const username = usernameInput.value.trim();
            if (username === '') {
                alert('Please enter your username.');
                return;
            }
            signIn(username);
        });
    }

    const signOutBtn = document.getElementById('signOutBtn');
    if (signOutBtn) {
        signOutBtn.addEventListener('click', function () {
            signOut();
        });
    }

    const noteForm = document.getElementById('noteForm');
    const notesContainer = document.getElementById('notesContainer');

    noteForm.addEventListener('submit', function (e) {
        e.preventDefault();

        if (!currentUser) {
            alert('Please sign in to add notes.');
            return;
        }

        const name = currentUser;
        const noteText = document.getElementById('note').value;

        if (noteText.trim() === '') {
            alert('Please enter your note!');
            return;
        }

        const note = {
            name: name,
            text: noteText,
            timestamp: new Date().getTime(),
            replies: []
        };

        addNoteToUI(note);
        saveNoteToCSV(note);

        noteForm.reset();
    });

    function saveNoteToCSV(note) {
        const csvRow = `${note.name},${note.text},${note.timestamp},${JSON.stringify(note.replies)}\n`;
        // Write to notes.csv (assuming the file is located in the same directory)
        fetch('notes.csv', {
            method: 'POST',
            headers: {
                'Content-Type': 'text/csv'
            },
            body: csvRow
        }).then(response => {
            if (response.ok) {
                console.log('Note saved to CSV.');
            } else {
                console.error('Failed to save note to CSV.');
            }
        }).catch(error => {
            console.error('Error:', error);
        });
    }

    function readNotesFromCSV() {
        // Read notes from notes.csv (assuming the file is located in the same directory)
        fetch('notes.csv')
            .then(response => response.text())
            .then(csv => {
                const rows = csv.trim().split('\n');
                rows.forEach(row => {
                    const [name, text, timestamp, replies] = row.split(',');
                    const note = {
                        name: name,
                        text: text,
                        timestamp: parseInt(timestamp),
                        replies: JSON.parse(replies)
                    };
                    addNoteToUI(note);
                });
            })
            .catch(error => console.error('Error:', error));
    }

    readNotesFromCSV(); // Load notes when the page loads
});

function addNoteToUI(note) {
    const noteElement = document.createElement('div');
    noteElement.className = 'note';
    noteElement.innerHTML = `
        <strong>${note.name}</strong>: ${note.text}
        <button class="reply-btn">Reply</button>
    `;
    notesContainer.appendChild(noteElement);

    const replyButton = noteElement.querySelector('.reply-btn');
    replyButton.addEventListener('click', function () {
        const replyText = prompt('Enter your reply:');
        if (replyText !== null && replyText.trim() !== '') {
            const reply = {
                name: currentUser,
                text: replyText,
                timestamp: new Date().getTime()
            };
            note.replies.push(reply);
            updateNoteUI(noteElement, note);
            saveNoteToCSV(note); // Update CSV file with the new reply
        }
    });

    note.replies.forEach(reply => {
        const replyElement = document.createElement('div');
        replyElement.className = 'reply';
        replyElement.innerHTML = `
            <strong>${reply.name}</strong>: ${reply.text}
        `;
        noteElement.appendChild(replyElement);
    });

    setTimeout(() => {
        noteElement.remove();
        // Do not remove from CSV here since it should persist for 7 days
    }, 7 * 24 * 60 * 60 * 1000);
}

function updateNoteUI(noteElement, note) {
    noteElement.querySelectorAll('.reply').forEach(replyElement => {
        replyElement.remove();
    });

    note.replies.forEach(reply => {
        const replyElement = document.createElement('div');
        replyElement.className = 'reply';
        replyElement.innerHTML = `
            <strong>${reply.name}</strong>: ${reply.text}
        `;
        noteElement.appendChild(replyElement);
    });
}
