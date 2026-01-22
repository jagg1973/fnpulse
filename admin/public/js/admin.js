// Admin Dashboard JavaScript

// Utility function for API calls
async function apiCall(url, options = {}) {
    try {
        const response = await fetch(url, options);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
}

// Show notification
function showNotification(message, type = 'info') {
    // Simple alert for now - can be enhanced with toast notifications
    alert(message);
}

// Confirm action
function confirmAction(message) {
    return confirm(message);
}

// Format date
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    console.log('FNPulse Admin Dashboard initialized');

    // Add any global event listeners here
    setupGlobalHandlers();
});

function setupGlobalHandlers() {
    // Handle forms with data-ajax attribute
    document.querySelectorAll('form[data-ajax]').forEach(form => {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const data = Object.fromEntries(formData);

            try {
                const result = await apiCall(form.action, {
                    method: form.method || 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                if (result.success) {
                    showNotification('Operation successful!', 'success');
                    if (form.dataset.redirect) {
                        window.location.href = form.dataset.redirect;
                    }
                } else {
                    showNotification('Error: ' + result.error, 'error');
                }
            } catch (error) {
                showNotification('Error: ' + error.message, 'error');
            }
        });
    });
}

// Export functions for use in inline scripts
window.adminUtils = {
    apiCall,
    showNotification,
    confirmAction,
    formatDate
};
