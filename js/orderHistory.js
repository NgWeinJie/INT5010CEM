document.addEventListener('DOMContentLoaded', () => {
    // Firebase configuration
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
    firebase.initializeApp(firebaseConfig);

    // Initialize Firestore
    const db = firebase.firestore();

    // Function to fetch product image URL by item name
    const fetchProductImage = (itemName) => {
        return db.collection('products').where('itemName', '==', itemName).get()
            .then(querySnapshot => {
                if (!querySnapshot.empty) {
                    const productDoc = querySnapshot.docs[0];
                    return productDoc.data().itemImageURL;
                } else {
                    return 'https://via.placeholder.com/50';  // Fallback image URL if product not found
                }
            })
            .catch(error => {
                console.error('Error fetching product image:', error);
                return 'https://via.placeholder.com/50';  // Fallback image URL in case of error
            });
    };

    // Function to fetch and display order history
    const fetchOrderHistory = (userId) => {
        db.collection('orders').where('userId', '==', userId).orderBy('timestamp', 'desc').get()
            .then(querySnapshot => {
                const orderHistoryContainer = document.getElementById('orderHistory');
                orderHistoryContainer.innerHTML = '';

                querySnapshot.forEach(doc => {
                    const order = doc.data();
                    const orderCard = document.createElement('div');
                    orderCard.classList.add('card', 'order-card');
                    orderCard.innerHTML = `
                        <div class="card-body">
                            <h5 class="card-title">Order ID: ${doc.id}</h5>
                            <p class="card-text"><strong>Name:</strong> ${order.userName}</p>
                            <p class="card-text"><strong>Phone:</strong> ${order.userPhone}</p>
                            <p class="card-text"><strong>Address:</strong> ${order.userAddress}, ${order.userCity}, ${order.userState}, ${order.userPostcode}</p>
                            <p class="card-text"><strong>Remark:</strong> ${order.userRemark}</p>
                            <p class="card-text"><strong>Date:</strong> ${order.timestamp.toDate().toLocaleString()}</p>
                            <h6 class="mt-3"><strong>Cart Items:</strong></h6>
                            <div id="cart-items-${doc.id}" class="cart-items-container table-responsive">
                                <table class="table">
                                    <thead>
                                        <tr>
                                            <th>Image</th>
                                            <th>Product</th>
                                            <th>Quantity</th>
                                            <th>Price</th>
                                            <th>Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                    </tbody>
                                </table>
                                <p class="card-text text-right"><strong>Total Amount:</strong> RM ${order.totalAmount.toFixed(2)}</p>

                            </div>
                        </div>
                    `;
                    orderHistoryContainer.appendChild(orderCard);

                    const cartItemsTableBody = document.querySelector(`#cart-items-${doc.id} tbody`);
                    order.cartItems.forEach(async (item) => {
                        const productImageUrl = await fetchProductImage(item.productName);
                        const cartItemRow = document.createElement('tr');
                        cartItemRow.innerHTML = `
                            <td><img src="${productImageUrl}" alt="${item.productName}" class="product-image img-fluid"></td>
                            <td>${item.productName}</td>
                            <td>${item.productQuantity}</td>
                            <td>RM ${item.productPrice.toFixed(2)}</td>
                            <td>RM ${(item.productPrice * item.productQuantity).toFixed(2)}</td>
                        `;
                        cartItemsTableBody.appendChild(cartItemRow);
                    });
                });
            })
            .catch(error => {
                console.error('Error fetching order history:', error);
                if (error.code === 'failed-precondition' && error.message.includes('requires an index')) {
                    const url = error.message.match(/https:\/\/console\.firebase\.google\.com\/[^\s]+/)[0];
                    alert(`The query requires an index. You can create it here: ${url}`);
                } else {
                    alert('Failed to fetch order history. Please try again later.');
                }
            });
    };

    // Listen for changes in user authentication state
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            fetchOrderHistory(user.uid);
        } else {
            alert('Please log in to view your order history.');
            window.location.href = 'login.html';  // Redirect to login page if not logged in
        }
    });
});
