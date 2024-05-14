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

// Define tableBody as a global variable
let tableBody;

// Function to fetch cart items from Firestore
function fetchCartItems(currentUser) {
    // Check if currentUser is defined
    if (!currentUser) {
        console.error('Current user is not defined.');
        alert('Please log in to view your cart.');
        return;
    }

    // Get the container to display cart items
    const cartItemsContainer = document.getElementById('cartItems');

    // Clear any existing content
    cartItemsContainer.innerHTML = '';

    
        // Create a table element
        const table = document.createElement('table');
        table.classList.add('table', 'table-bordered');

        // Create table header
        const tableHeader = document.createElement('thead');
        tableHeader.innerHTML = `
            <tr>
                <th>No</th>
                <th>Name</th>
                <th>Price</th>
                <th>Quantity</th>
            </tr>
        `;
        table.appendChild(tableHeader);

        // Create table body
        tableBody = document.createElement('tbody'); // Define tableBody here

        // Initialize total price
        let totalPrice = 0;

        // Query Firestore for cart items associated with the current user
        db.collection('cart').where('userId', '==', currentUser.uid).get()
            .then((querySnapshot) => {
                // Counter for numbering items
                let counter = 1;
                querySnapshot.forEach((doc) => {
                    // Get cart item data
                    const cartItem = doc.data();

                    // Create table row for each cart item
                    const row = document.createElement('tr');

                    // Add number column
                    const numberCell = document.createElement('td');
                    numberCell.textContent = counter++;
                    row.appendChild(numberCell);

                    // Add name column
                    const nameCell = document.createElement('td');
                    nameCell.textContent = cartItem.productName;
                    row.appendChild(nameCell);

                    // Add price column
                    const priceCell = document.createElement('td');
                    const productPrice = cartItem.productPrice ? cartItem.productPrice : 0;
                    const formattedPrice = 'RM ' + productPrice.toFixed(2);
                    priceCell.textContent = formattedPrice;
                    row.appendChild(priceCell);

                    // Add quantity column
                    const quantityCell = document.createElement('td');
                    const minusButton = document.createElement('button');
                    minusButton.textContent = '-';
                    minusButton.classList.add('btn', 'btn-danger', 'mr-1');
                    const quantityInput = document.createElement('input');
                    quantityInput.type = 'number';
                    quantityInput.value = cartItem.productQuantity; 
                    quantityInput.classList.add('form-control', 'd-inline-block', 'w-25', 'text-center');
                    quantityInput.setAttribute('max', cartItem.productStock); // Set maximum value to stock quantity
                    const plusButton = document.createElement('button');
                    plusButton.textContent = '+';
                    plusButton.classList.add('btn', 'btn-success', 'ml-1');

                    // Event listener for input field
                    quantityInput.addEventListener('input', () => {
                        let enteredValue = parseInt(quantityInput.value);
                        if (enteredValue < 0) {
                            quantityInput.value = 0; // Set input value to minimum allowed quantity
                        }
                        if (enteredValue > cartItem.productStock) {
                            quantityInput.value = cartItem.productStock; // Set input value to maximum allowed quantity
                        }
                        updateTotalPrice(); // Update total price when quantity changes
                        updateCartItemQuantity(doc.id, quantityInput.value); // Update quantity in Firestore
                    });

                    // Event listener for minus button
                    minusButton.addEventListener('click', () => {
                        if (parseInt(quantityInput.value) > 0) {
                            quantityInput.value = parseInt(quantityInput.value) - 1;
                            updateTotalPrice(); // Update total price when quantity changes
                        }
                    });

                    // Event listener for plus button
                    plusButton.addEventListener('click', () => {
                        if (parseInt(quantityInput.value) < cartItem.productStock) {
                            quantityInput.value = parseInt(quantityInput.value) + 1;
                            updateTotalPrice(); // Update total price when quantity changes
                            updateCartItemQuantity(doc.id, quantityInput.value); // Update quantity in Firestore
                        }
                    });

                    quantityCell.appendChild(minusButton);
                    quantityCell.appendChild(quantityInput);
                    quantityCell.appendChild(plusButton);
                    row.appendChild(quantityCell);

                    // Calculate and update total price
                    totalPrice += productPrice * parseInt(quantityInput.value);

                    // Add delete button column
                    const deleteCell = document.createElement('td');
                    const deleteButton = document.createElement('button');
                    deleteButton.textContent = 'Delete';
                    deleteButton.classList.add('btn', 'btn-danger');
                    // Add an event listener to delete the item when the button is clicked
                    deleteButton.addEventListener('click', () => {
                        // Delete the item from Firestore
                        db.collection('cart').doc(doc.id).delete()
                            .then(() => {
                                // Remove the row from the table
                                row.remove();
                                alert('Item deleted successfully!');
                                console.log('Document successfully deleted!');
                                // Update total price after deletion
                                updateTotalPrice();
                                // Renumber the products after deletion
                                renumberProducts();
                            })
                            .catch((error) => {
                                alert('Failed to delete item. Please try again later.');
                                console.error('Error removing document: ', error);
                            });
                    });
                    deleteCell.appendChild(deleteButton);
                    row.appendChild(deleteCell);

                    // Add row to table body
                    tableBody.appendChild(row);
                });

                // Append table body to table
                table.appendChild(tableBody);

                // Append table to container
                cartItemsContainer.appendChild(table);

                // Update total price display
                updateTotalPrice();

                // Add event listener to the "Proceed to Payment" button
                const proceedToPaymentBtn = document.getElementById('proceedToPaymentBtn');
                proceedToPaymentBtn.addEventListener('click', function() {
                    // Save cart items to the "payment" collection
                    saveCartToPayment(currentUser).then(() => {
                        // Redirect to payment.html
                        window.location.href = 'payment.html';
                    }).catch((error) => {
                        console.error('Error saving cart items to payment collection:', error);
                        alert('Failed to proceed to payment. Please try again later.');
                    });
                });
            })
            .catch((error) => {
                console.error('Error fetching cart items:', error);
                alert('Failed to fetch cart items. Please try again later.');
            });
    } 

// Function to update the quantity of a cart item in Firestore
function updateCartItemQuantity(cartItemId, newQuantity) {
    db.collection('cart').doc(cartItemId).update({
        productQuantity: newQuantity
    })
    .then(() => {
        console.log('Cart item quantity updated successfully!');
    })
    .catch((error) => {
        console.error('Error updating cart item quantity: ', error);
    });
}


// Listen for changes in user authentication state
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        // User is signed in
        fetchCartItems(user);
    } else {
        // User is signed out
        alert('Please log in to view your cart.');
    }
});

// Function to update total price
function updateTotalPrice() {
    // Reset total price
    totalPrice = 0;

    // Get all rows in the table body
    const rows = tableBody.querySelectorAll('tr');

    // Loop through each row
    rows.forEach(row => {
        // Get the product price and quantity from the row
        const productPrice = parseFloat(row.querySelector('td:nth-child(3)').textContent.replace('RM ', ''));
        const quantity = parseInt(row.querySelector('td:nth-child(4) input').value);

        // Update total price based on product price and quantity
        totalPrice += productPrice * quantity;
    });

    // Update the total price display
    const totalPriceElement = document.getElementById('totalPrice');
    totalPriceElement.textContent = 'RM ' + totalPrice.toFixed(2);
}

// Function to renumber the products after deletion
function renumberProducts() {
    const rows = tableBody.querySelectorAll('tr');
    let counter = 1;
    rows.forEach(row => {
        row.querySelector('td:nth-child(1)').textContent = counter++;
    });
}

// Function to save cart items to the "payment" collection
function saveCartToPayment(currentUser) {
    // Navigate to the payment page directly without saving to Firestore
    window.location.href = 'payment.html';
}


// Call the function to fetch and display cart items when the page loads
document.addEventListener('DOMContentLoaded', fetchCartItems);

