document.addEventListener('DOMContentLoaded', (event) => {
    const newLockerBtn = document.getElementById('newLockerBtn');

    
    newLockerBtn.addEventListener('click', () => {
        let lockerName = prompt("Enter the name of the new locker");
        let lockerDescription = prompt("Enter the description of the new locker");

        if (lockerName && lockerDescription) {
            fetch('/create-locker/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                body: JSON.stringify({ name: lockerName, description: lockerDescription })
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok ' + response.statusText);
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    alert(`New Locker '${lockerName}' created!`);

                    const lockerList = document.getElementById('lockerList');
                    const newLocker = document.createElement('div');
                    newLocker.classList.add('locker-box');
                    newLocker.innerHTML = `
                        <h4>${data.name}</h4>
                        <p>Description: ${data.description}</p>
                        <a href="{% url 'sharing-page' %}" class="openBtn btn btn-secondary">Open</a>
                    `;
                    lockerList.appendChild(newLocker);

                    // Attach event listener to the new "Open" button
                    const openBtn = newLocker.querySelector('.openBtn');
                    openBtn.addEventListener('click', redirectToEducation);
                } else {
                    alert('Error creating locker: ' + data.error);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Error creating locker');
            });
        } else {
            alert('Locker name and description are required.');
        }
    });

    
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    function redirectToEducation() {
        window.location.href = '../Page2/sharingpage.html';
    }
});
