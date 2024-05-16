// Assuming you already have Firebase initialized and user authenticated
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

// Get a reference to Firestore database
const db = firebase.firestore();

// Function to fetch cart items instead of payment items
function fetchCartItems(currentUser) {
    if (!currentUser) {
        alert('Please log in to proceed with payment.');
        return;
    }

    const paymentItemsContainer = document.getElementById('paymentItems');
    paymentItemsContainer.innerHTML = '';

    db.collection('cart').where('userId', '==', currentUser.uid).get()
        .then(querySnapshot => {
            let totalAmount = 0;
            querySnapshot.forEach(doc => {
                const cartItem = doc.data();
                const itemElement = document.createElement('div');
                itemElement.classList.add('payment-item');
                itemElement.innerHTML = `
                    <p>Product Name: ${cartItem.productName}</p>
                    <p>Product Price: RM ${cartItem.productPrice.toFixed(2)}</p>
                    <p>Quantity: ${cartItem.productQuantity}</p>
                    <br>
                `;
                paymentItemsContainer.appendChild(itemElement);
                totalAmount += cartItem.productPrice * cartItem.productQuantity;
            });
            document.getElementById('totalAmount').textContent = `Total Amount: RM ${totalAmount.toFixed(2)}`;
        })
        .catch(error => {
            console.error('Error fetching cart items:', error);
            alert('Failed to fetch cart items. Please try again later.');
        });
}

// Function to handle back button click event
function navigateBackToCart() {
    // Redirect to the cart page
    window.location.href = 'cart.html';
}

// Function to delete cart items for the current user
async function deleteCartItems(currentUser) {
    if (!currentUser) {
        alert('Please log in to proceed with payment.');
        return;
    }

    const querySnapshot = await db.collection('cart').where('userId', '==', currentUser.uid).get();

    // Array to store deletion promises
    const deletionPromises = [];

    querySnapshot.forEach(doc => {
        // Delete each cart item document
        const deletionPromise = doc.ref.delete();
        deletionPromises.push(deletionPromise);
    });

    try {
        // Wait for all deletion promises to resolve
        await Promise.all(deletionPromises);
        console.log('All cart items deleted successfully');
    } catch (error) {
        console.error('Error deleting cart items:', error);
        alert('Failed to delete cart items. Please try again later.');
    }
}

// Add event listener to the back button and done button
document.addEventListener('DOMContentLoaded', function() {
    const backToCartBtn = document.getElementById('backToCartBtn');
    backToCartBtn.addEventListener('click', navigateBackToCart);

    const doneBtn = document.getElementById('doneBtn'); // Event listener for Done button
    doneBtn.addEventListener('click', function() {
        window.location.href = 'home.html'; // Redirect to home page after clicking Done
    });
});

// Listen for changes in user authentication state
firebase.auth().onAuthStateChanged(user => {
    if (user) {
        fetchCartItems(user);
    } else {
        alert('Please log in to proceed with payment.');
    }
});

// Call the function to fetch and display cart items when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const user = firebase.auth().currentUser;
    if (user) {
        fetchCartItems(user);
    }
});

