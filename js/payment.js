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
const promoCode = getUrlParameter('promoCode');
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

// Function to generate a tracking number
function generateTrackingNumber() {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let trackingNumber = '';
    for (let i = 0; i < 10; i++) {
        const randomIndex = Math.floor(Math.random() * charset.length);
        trackingNumber += charset[randomIndex];
    }
    return trackingNumber;
}

// Function to update product stock in Firestore
async function updateProductStock(cartItems) {
    const updatePromises = cartItems.map(async item => {
        const productDocRef = db.collection('products').where('itemName', '==', item.productName).limit(1);
        const productSnapshot = await productDocRef.get();
        if (!productSnapshot.empty) {
            const productDoc = productSnapshot.docs[0];
            const productData = productDoc.data();
            const newStock = productData.itemStock - item.productQuantity;
            return productDoc.ref.update({ itemStock: newStock });
        } else {
            console.log(`No product found with name: ${item.productName}`);
        }
    });
    try {
        await Promise.all(updatePromises);
        console.log('Product stock updated successfully');
    } catch (error) {
        console.error('Error updating product stock:', error);
        throw new Error('Failed to update product stock. Please try again later.');
    }
}

// Function to save order details to Firestore
async function saveOrder(currentUser, promoCode) {
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

    // Generate tracking number
    const trackingNumber = generateTrackingNumber();

    // Create order object
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
        totalAmount: parseFloat(document.getElementById('totalAmount').textContent.split('RM ')[1].trim()),
        shippingFee: 10.00, // Fixed shipping fee
        status: "Order Received",
        trackingNumber,
        promoCode: promoCode || '',
        discount: discount || 0, 
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
        // Save order to Firestore
        await db.collection('orders').add(order);

        // Update product stock
        await updateProductStock(cartItems);

        // Delete cart items
        await deleteCartItems(currentUser);

        // Alert payment successful with tracking number
        alert(`Payment successful. Your tracking number is: ${trackingNumber}`);

        // Redirect to order confirmation page
        window.location.href = 'home.html';
    } catch (error) {
        console.error('Error saving order:', error);
        alert('Failed to place order. Please try again later.');
    }
}

// Event listeners for buttons
document.getElementById('backToCartBtn').addEventListener('click', navigateBackToCart);
document.getElementById('doneBtn').addEventListener('click', () => {
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            const promoCode = getUrlParameter('promoCode'); // Get promo code from URL
            saveOrder(user, promoCode); // Pass promo code to saveOrder function
        } else {
            alert('Please log in to proceed with payment.');
        }
    });
});

// Fetch cart items and user details on page load
firebase.auth().onAuthStateChanged(user => {
    if (user) {
        fetchCartItems(user);
        fetchUserDetails(user.uid);
    } else {
        alert('Please log in to proceed with payment.');
        window.location.href = 'login.html';
    }
});
