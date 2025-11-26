// Function to open the upload form modal
function openUploadForm() {
    document.getElementById('uploadModal').style.display = 'block';
}

// Function to close the upload form modal
function closeUploadForm() {
    document.getElementById('uploadModal').style.display = 'none';
}

// Close the modal if the user clicks outside of it
window.onclick = function(event) {
    const modal = document.getElementById('uploadModal');
    if (event.target == modal) {
        closeUploadForm();
    }
};

// Event listener for the upload button
document.addEventListener('DOMContentLoaded', function() {
    const uploadButton = document.getElementById('uploadButton');
    if (uploadButton) {
        uploadButton.addEventListener('click', openUploadForm);
    }

    const uploadForm = document.getElementById('uploadResourceForm');
    if (uploadForm) {
        uploadForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const formData = new FormData(uploadForm);
            fetch(uploadForm.action, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                },
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const resourcesList = document.getElementById('resources-list');
                    const newResource = document.createElement('div');
                    newResource.innerHTML = `<span id="documents"><a href="${data.resource_url}" target="_blank">${data.document_name}</a></span>
                                             <span class="public-private">${data.type}</span><br><br>`;
                    resourcesList.appendChild(newResource);
                    closeUploadForm();
                } else {
                    alert(data.error);
                }
            })
            .catch(error => console.error('Error:', error));
        });
    }
});
