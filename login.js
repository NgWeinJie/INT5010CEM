const firebaseConfig = {
    apiKey: "AIzaSyDCdP64LQYeS4vu3lFH7XtUHOPVJOYCbO8",
    authDomain: "enterprise-project-3448b.firebaseapp.com",
    databaseURL: "https://enterprise-project-3448b-default-rtdb.firebaseio.com",
    projectId: "enterprise-project-3448b",
    storageBucket: "enterprise-project-3448b.appspot.com",
    messagingSenderId: "1042464271522",
    appId: "1:1042464271522:web:1d1a3ffadf6830b5767bfb",
    measurementId: "G-3S19G51X7T"
};

// Initialize Firebase app
firebase.initializeApp(firebaseConfig);

function validation() {
    // Get the input field values
    const email = document.getElementById('user_email').value.trim();
    const password = document.getElementById('user_password').value.trim();

    // Regular expression for email validation
    const isEmailValid = (email) => email.includes('@') && email.includes('.');

    // Error messages
    const errorMessages = {
        user_email: 'Email must be valid.',
        user_password: 'Password must not be empty.'
    };

    // Function to validate each field
    function validateField(fieldId, isValid, errorMessage) {
        const value = document.getElementById(fieldId).value.trim();
        const errorField = document.getElementById(fieldId + 'E');
        if (!isValid(value)) {
            errorField.textContent = errorMessage;
            errorField.classList.remove('d-none');
            return false;
        } else {
            errorField.textContent = '';
            errorField.classList.add('d-none');
            return true;
        }
    }

    // Check each field for validation
    const isValidEmail = validateField('user_email', isEmailValid, errorMessages.user_email);
    const isValidPassword = validateField('user_password', (password) => !!password, errorMessages.user_password); // Validation for non-empty password

    // Log error status and return true if all fields pass validation, otherwise false
    const isValidForm = isValidEmail && isValidPassword;
    return isValidForm;
}

function loginUser() {
    const email = document.getElementById('user_email').value;
    const password = document.getElementById('user_password').value;

    firebase.auth().signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            // Check if the user's email is verified
            if (user.emailVerified) {
                // Redirect to home or home page after successful login
                window.location.href = 'home.html';
            } else {
                alert('Please verify your email before logging in.');
            }
        })
        .catch((error) => {
            alert('Failed to login: ' + error.message);
        });
}

// Get the Login button element
const loginBtn = document.getElementById('loginBtn');

// Attach an event listener to the Login button
loginBtn.addEventListener('click', function(event) {
    // Prevent the default form submission behavior
    event.preventDefault();

    // Trigger validation for each field
    if (validation()) {
        // If validation passes, proceed with user login
        loginUser();
    } else {
        // If validation fails, add Bootstrap's was-validated class to the form
        const form = document.getElementById('loginForm');
        form.classList.add('was-validated');
    }
});

// Toggle password visibility
const togglePasswordBtn = document.getElementById('togglePassword');
const passwordField = document.getElementById('user_password');

togglePasswordBtn.addEventListener('click', function() {
    const type = passwordField.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordField.setAttribute('type', type);
    this.classList.toggle('fa-eye-slash'); // Toggle the eye icon
});
