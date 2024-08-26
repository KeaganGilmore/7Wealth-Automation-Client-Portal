var BASE_URL = 'https://7a4a-41-114-29-118.ngrok-free.app';

document.addEventListener('DOMContentLoaded', function () {
    if (checkAuth()) {
        console.log('Authentication successful, fetching users');
        fetchUsers();
    } else {
        console.log('Authentication failed, not fetching users');
    }

    document.getElementById('userInfoForm').addEventListener('submit', function (e) {
        e.preventDefault();

        const advisorId = localStorage.getItem('advisorId');
        if (!advisorId) {
            console.error('Advisor ID not found');
            alert('Error: Advisor ID not found. Please log in again.');
            return;
        }

        const formData = {
            surname: getValue('surname'),
            given_name: getValue('givenName'),
            preferred_name: getValue('preferredName'),
            dob: getValue('dob'),
            sex: getValue('sex'),
            email: getValue('email'),
            phone_number: getValue('phone_number'),
            notes: getValue('notes'),
            advisor_id: advisorId,
            welcome: document.getElementById('welcome').checked ? 1 : 0,
            myprosperity_intro: document.getElementById('myprosperity').checked ? 1 : 0,
            post_meeting_next_steps: document.getElementById('postMeeting').checked ? 1 : 0
        };

        fetch(`${BASE_URL}/add_user`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(error => { throw new Error(error.error); });
            }
            return response.json();
        })
        .then(data => {
            alert(data.message);
            console.log('Success:', data);
            fetchUsers();
            document.getElementById('userInfoForm').reset();
        })
        .catch((error) => {
            alert('Error submitting data: ' + error.message);
            console.error('Error:', error);
        });
    });

    document.getElementById('logoutButton').addEventListener('click', logout);
});

function markUnknown(fieldId) {
    const field = document.getElementById(fieldId);
    field.value = 'unknown';
}

function getValue(fieldId) {
    const value = document.getElementById(fieldId).value;
    return value === '' ? 'unknown' : value;
}

function logout() {
    localStorage.removeItem('advisorToken');
    localStorage.removeItem('advisorId');
    window.location.href = 'login.html';
}

function checkAuth() {
    const advisorId = localStorage.getItem('advisorId');
    const advisorToken = localStorage.getItem('advisorToken');
    
    console.log('Checking auth - advisorId:', advisorId, 'advisorToken:', advisorToken);

    if (!advisorId || !advisorToken) {
        console.log('Auth check failed, redirecting to login');
        window.location.href = 'login.html';
        return false;
    }
    
    console.log('Auth check passed');
    return true;
}

function fetchUsers() {
    const advisorId = localStorage.getItem('advisorId');
    console.log('Retrieved advisorId from localStorage:', advisorId);

    if (!advisorId) {
        console.error('Advisor ID not found. Redirecting to login page.');
        window.location.href = 'login.html';
        return;
    }

    // Construct the body of the POST request
    const requestBody = {
        advisor_id: advisorId
    };

    console.log('Prepared request body for POST request:', JSON.stringify(requestBody, null, 2));

    fetch(`${BASE_URL}/users`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    })
    .then(response => {
        console.log('Received response status:', response.status);
        if (!response.ok) {
            throw new Error(`Failed to fetch users. Status: ${response.status} ${response.statusText}`);
        }
        return response.json();
    })
    .then(users => {
        console.log('Parsed response JSON:', JSON.stringify(users, null, 2));
        displayUsers(users);
    })
    .catch(error => {
        console.error('Error occurred during fetch operation:', error);
    });
}



function displayUsers(users) {
    const userList = document.getElementById('userList');
    userList.innerHTML = '';
    
    users.forEach(user => {
        const li = document.createElement('li');
        li.className = 'user-item';
        
        let bookingsHtml = '<h4>Bookings:</h4>';
        if (user.meeting_bookings && user.meeting_bookings.length > 0) {
            bookingsHtml += '<ul class="bookings-list">';
            user.meeting_bookings.forEach(booking => {
                const bookingDate = new Date(booking.booking_date).toLocaleString();
                bookingsHtml += `
                    <li>
                        <strong>${booking.meeting_type}</strong> - 
                        Date: ${bookingDate} - 
                        Status: ${booking.completed ? 'Completed' : 'Scheduled'}
                    </li>`;
            });
            bookingsHtml += '</ul>';
        } else {
            bookingsHtml += '<p>No bookings</p>';
        }

        li.innerHTML = `
            <strong>${user.PreferredName || `${user.GivenName} ${user.Surname}`}</strong>
            <div class="user-details">
                <p>Given Name: ${user.GivenName}</p>
                <p>Surname: ${user.Surname}</p>
                <p>Preferred Name: ${user.PreferredName}</p>
                <p>Date of Birth: ${user.DOB}</p>
                <p>Sex: ${user.Sex}</p>
                <p>Email: ${user.email}</p>
                <p>Phone: ${user.phone_number || 'N/A'}</p>
                <p>Notes: ${user.notes || 'N/A'}</p>
                <h4>Emails Sent:</h4>
                <p>Welcome: ${user.WELCOME ? 'Sent' : 'Not Sent'}</p>
                <p>MyProsperity Intro: ${user.MYPROSPERITY_INTRO ? 'Sent' : 'Not Sent'}</p>
                <p>Post Meeting Next Steps: ${user.POST_MEETING_NEXT_STEPS ? 'Sent' : 'Not Sent'}</p>
                <p>Next Step: ${user.next_step}</p>
                ${bookingsHtml}
                <button class="next-step-btn" data-user-id="${user.id}" data-next-step="${user.next_step}">Mark as Completed</button>
            </div>
        `;
        li.addEventListener('click', function() {
            this.querySelector('.user-details').classList.toggle('active');
        });
        userList.appendChild(li);
    });

    document.querySelectorAll('.next-step-btn').forEach(button => {
        button.addEventListener('click', function() {
            const userId = this.getAttribute('data-user-id');
            const actionCompleted = this.getAttribute('data-next-step');
            updateProgress(userId, actionCompleted);
        });
    });
}

function updateProgress(userId, actionCompleted) {
    fetch(`${BASE_URL}/update_progress`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            user_id: userId,
            action_completed: actionCompleted
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        alert(data.message);
        console.log('Success:', data);
        fetchUsers();
    })
    .catch((error) => {
        alert('Error updating progress: ' + error.message);
        console.error('Error:', error);
    });
}
