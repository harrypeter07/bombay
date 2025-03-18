document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    // Check if URL has a parameter to show registration form
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('register') === 'true') {
        document.getElementById('flip').checked = true;
    }
    
    // Login form submission
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const errorElement = document.getElementById('loginError');
        
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: loginForm.username.value,
                    password: loginForm.password.value
                })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                window.location.href = '/dashboard';
            } else {
                errorElement.textContent = data.error;
            }
        } catch (error) {
            errorElement.textContent = 'An error occurred. Please try again.';
        }
    });

    // Register form submission
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const errorElement = document.getElementById('registerError');
        
        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: registerForm.username.value,
                    email: registerForm.email.value,
                    password: registerForm.password.value
                })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                window.location.href = '/dashboard';
            } else {
                errorElement.textContent = data.error || 'Registration failed';
            }
        } catch (error) {
            errorElement.textContent = 'An error occurred. Please try again.';
        }
    });
});