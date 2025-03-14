document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const tabBtns = document.querySelectorAll('.tab-btn');

    // ✅ Ensure loginForm and registerForm exist before using them
    if (!loginForm || !registerForm) {
        console.error("Forms not found. Check HTML structure.");
        return;
    }

    // ✅ Tab switching logic
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

    // ✅ Login Form Submission
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const errorElement = document.getElementById('loginError');
        if (errorElement) errorElement.textContent = ''; // Clear previous errors

        const email = loginForm.email.value.trim();
        const password = loginForm.password.value.trim();

        if (!email || !password) {
            if (errorElement) errorElement.textContent = "Please fill in all fields.";
            return;
        }

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                window.location.href = '/dashboard'; // ✅ Redirect to dashboard
            } else {
                if (errorElement) errorElement.textContent = data.error || "Invalid login.";
            }
        } catch (error) {
            console.error("Login Error:", error);
            if (errorElement) errorElement.textContent = "An error occurred. Please try again.";
        }
    });

    // ✅ Register Form Submission
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const errorElement = document.getElementById('registerError');
        if (errorElement) errorElement.textContent = ''; // Clear previous errors
        const username = registerForm.username.value.trim();
        const email = registerForm.email.value.trim();
        const password = registerForm.password.value.trim();

        if (!username || !email || !password) {
            if (errorElement) errorElement.textContent = "Please fill in all fields.";
            return;
        }

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({username , email, password })
            });

            const data = await response.json();
            if (response.ok) {
                window.location.href = '/dashboard'; // ✅ Redirect after registration
            } else {
                if (errorElement) errorElement.textContent = data.error || "Registration failed.";
            }
        } catch (error) {
            console.error("Registration Error:", error);
            if (errorElement) errorElement.textContent = "An error occurred. Please try again.";
        }
    });
});