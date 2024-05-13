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
const db = firebase.firestore();

// Get the product ID from the URL
const productId = window.location.hash.substring(1);
console.log("Hash:", window.location.hash);
console.log("Product ID:", productId);

// Get references to HTML elements
const productNameElement = document.getElementById('productName');
const productImageElement = document.getElementById('productImage');
const productPriceElement = document.getElementById('productPrice');
const productStockElement = document.getElementById('productStock');
const productDetailsElement = document.getElementById('productDetails');

// Function to fetch product details from Firestore
async function fetchProductDetails(productId) {
    try {
        const doc = await db.collection('products').doc(productId).get();
        if (doc.exists) {
            const productData = doc.data();
            // Populate HTML elements with product details
            productNameElement.textContent = productData.itemName;
            productImageElement.src = productData.itemImageURL;
            productPriceElement.textContent = `Price: RM ${productData.itemPrice}`;
            productStockElement.textContent = `Stock: ${productData.itemStock}`;
            productDetailsElement.textContent = productData.itemDetails;
        } else {
            console.error('No such product!');
        }
    } catch (error) {
        console.error('Error getting product details:', error);
    }
}


// Call the function to fetch and display product details
fetchProductDetails(productId);

// Function to handle quantity increase
document.getElementById('increaseQuantity').addEventListener('click', function() {
    const quantityInput = document.getElementById('quantity');
    let quantity = parseInt(quantityInput.value);
    quantity = isNaN(quantity) ? 0 : quantity;
    quantityInput.value = quantity + 1;
});

// Function to handle quantity decrease
document.getElementById('decreaseQuantity').addEventListener('click', function() {
    const quantityInput = document.getElementById('quantity');
    let quantity = parseInt(quantityInput.value);
    quantity = isNaN(quantity) ? 0 : quantity;
    if (quantity > 1) {
        quantityInput.value = quantity - 1;
    }
});

// Function to add product to cart
document.getElementById('addToCart').addEventListener('click', function() {
    const productId = window.location.hash.substring(1);
    const quantity = parseInt(document.getElementById('quantity').value);
    console.log("Add to Cart - Product ID:", productId, "Quantity:", quantity);
});
