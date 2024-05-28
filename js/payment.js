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

// Function to extract parameters from URL
function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    var results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

// Display promo discount if available
const promoDiscountElement = document.getElementById('promoDiscount');
const discount = parseFloat(getUrlParameter('discount'));
if (discount > 0) {
    promoDiscountElement.textContent = `Promo Discount: RM ${discount.toFixed(2)}`;
}

// Function to fetch user data from Firestore
const fetchUserDetails = (userId) => {
    firebase.firestore().collection('users').doc(userId).get()
    .then((doc) => {
        if (doc.exists) {
            const userData = doc.data();
            // Display user data in the user details form
            displayUserDetails(userData);
        } else {
            console.log('No such document!');
        }
    })
    .catch((error) => {
        console.error('Error getting user data:', error);
    });
};

// Function to display user data in the user details form
const displayUserDetails = (userData) => {
    document.getElementById('userName').value = `${userData.firstName} ${userData.lastName}`;
    document.getElementById('userPhone').value = userData.phoneNumber;
    document.getElementById('userAddress').value = userData.address;
    document.getElementById('userPostcode').value = userData.postcode;
    document.getElementById('userCity').value = userData.city;
    document.getElementById('userState').value = userData.state;
};

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
            const shippingFee = 10.00; // Define the shipping fee
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

            // Check if there is a promo discount
            const promoDiscount = parseFloat(getUrlParameter('discount'));
            if (promoDiscount > 0) {
                // Apply promo discount if available
                totalAmount -= promoDiscount;
            }

            // Display the shipping fee
            document.getElementById('shippingFee').textContent = `Shipping Fee: RM ${shippingFee.toFixed(2)}`;

            // Add the shipping fee to the total amount and display it
            const finalAmount = totalAmount + shippingFee;
            document.getElementById('totalAmount').textContent = `Total Amount: RM ${finalAmount.toFixed(2)}`;
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

// Function to save order details to Firestore
function saveOrder(currentUser) {
    if (!currentUser) {
        alert('Please log in to proceed with payment.');
        return;
    }

    // Get user details
    const userName = document.getElementById('userName').value;
    const userPhone = document.getElementById('userPhone').value;
    const userAddress = document.getElementById('userAddress').value;
    const userPostcode = document.getElementById('userPostcode').value;
    const userCity = document.getElementById('userCity').value;
    const userState = document.getElementById('userState').value;
    const userRemark = document.getElementById('userRemark').value;

    // Get cart items
    const cartItems = [];
    const paymentItemsContainer = document.getElementById('paymentItems');
    paymentItemsContainer.querySelectorAll('.payment-item').forEach(item => {
        const productName = item.querySelector('p:nth-child(1)').textContent.split(':')[1].trim();
        const productPrice = parseFloat(item.querySelector('p:nth-child(2)').textContent.split(':')[1].trim().replace('RM ', ''));
        const productQuantity = parseInt(item.querySelector('p:nth-child(3)').textContent.split(':')[1].trim());
        cartItems.push({ productName, productPrice, productQuantity });
    });

    // Calculate total amount
    let totalAmount = 0;
    cartItems.forEach(item => {
        totalAmount += item.productPrice * item.productQuantity;
    });

    // Define the shipping fee
    const shippingFee = 10.00;

    // Get promo discount from URL parameters
    const promoDiscount = parseFloat(getUrlParameter('discount')) || 0;

    // Apply promo discount and add shipping fee to the total amount
    totalAmount = totalAmount + shippingFee - promoDiscount;

    // Ensure totalAmount has only two decimal places
    totalAmount = parseFloat(totalAmount.toFixed(2));

    // Get current timestamp
    const timestamp = firebase.firestore.Timestamp.now();

    // Construct the order object
    const order = {
        userId: currentUser.uid,
        userName,
        userPhone,
        userAddress,
        userPostcode,
        userCity,
        userState,
        userRemark,
        cartItems,
        totalAmount,
        timestamp
    };

    // Save the order to Firestore
    db.collection('orders').add(order)
        .then(() => {
            console.log('Order saved successfully!');
            alert('Order has been saved');
            // Redirect to home page after saving the order
            window.location.href = 'home.html';
        })
        .catch(error => {
            console.error('Error saving order:', error);
            alert('Failed to save order. Please try again later.');
        });
}

// Add event listener to the back button and done button
document.addEventListener('DOMContentLoaded', function() {
    const backToCartBtn = document.getElementById('backToCartBtn');
    backToCartBtn.addEventListener('click', navigateBackToCart);

    const doneBtn = document.getElementById('doneBtn');
    doneBtn.addEventListener('click', function() {
        const user = firebase.auth().currentUser;
        if (user) {
            saveOrder(user);
            deleteCartItems(user);
        } else {
            alert('Please log in to proceed with payment.');
        }
    });
});

// Listen for changes in user authentication state
firebase.auth().onAuthStateChanged(user => {
    if (user) {
        fetchCartItems(user);
        fetchUserDetails(user.uid);  // Fetch and display user details
    } else {
        alert('Please log in to proceed with payment.');
    }
});

// Call the function to fetch and display cart items when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const user = firebase.auth().currentUser;
    if (user) {
        fetchCartItems(user);
        fetchUserDetails(user.uid);
    }
});

