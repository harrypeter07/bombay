document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const tabBtns = document.querySelectorAll('.tab-btn');
    
    // Tab switching
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            if (btn.dataset.tab === 'login') {
                loginForm.classList.remove('hidden');
                registerForm.classList.add('hidden');
            } else {
                loginForm.classList.add('hidden');
                registerForm.classList.remove('hidden');
            }
        });
    });

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
                window.location.href = '/';
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
                    password: registerForm.password.value
                })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                window.location.href = '/';
            } else {
                errorElement.textContent = data.error;
            }
        } catch (error) {
            errorElement.textContent = 'An error occurred. Please try again.';
        }
    });
});
