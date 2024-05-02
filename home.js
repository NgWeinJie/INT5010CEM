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

// Get a reference to the storage service, which is used to create references in your storage bucket
const storage = firebase.storage();

// Get a reference to Firestore database
const db = firebase.firestore();

async function fetchAndDisplayProductsByCategory() {
    const productList = document.getElementById('productList');

    // Clear any existing content
    productList.innerHTML = '';

    const itemCategories = [
        "Biscuits & Cakes",
        "Canned Food",
        "Cereals",
        "Snacks",
        "Commodities",
        "Jams, Spreads & Honey",
        "Pasta & Instant Food",
        "Sauce, Spice & Seasoning",
        "Sundry"
    ];

    // Iterate through each item category
    for (const category of itemCategories) {


        // Create a heading for the category
        const categoryHeading = document.createElement('h3');
        categoryHeading.id = category.replace(/\s+/g, '');
        categoryHeading.textContent = category;
        categoryHeading.style.marginBottom = '40px';
        productList.appendChild(categoryHeading);

        // Create a container for the products in this category
        const categoryProductsContainer = document.createElement('div');
        categoryProductsContainer.classList.add('row', 'mb-4');

        try {
            // Query Firestore for products in the current category
            const querySnapshot = await db.collection('products')
                .where('itemCategories', '==', category)
                .get();

            // Check if any products were found for the category
            if (!querySnapshot.empty) {
                querySnapshot.forEach((doc) => {
                    const product = doc.data();
                    // Create and append product card here
                    const productCard = createProductCard(product);
                    categoryProductsContainer.appendChild(productCard);
                });
            } else {
                // No products found for this category, display a message
                const noProductsMessage = document.createElement('p');
                noProductsMessage.textContent = 'No products found in this category.';
                categoryProductsContainer.appendChild(noProductsMessage);
            }

            // Append the category products container to the product list
            productList.appendChild(categoryProductsContainer);
        } catch (error) {
            console.error('Error fetching products for category:', category, error);
            alert('Failed to fetch products for category: ' + category + '. Please try again later.');
        }
    }
}

function createProductCard(product) {
    const productCard = document.createElement('div');
    productCard.classList.add('col-md-3', 'mb-4');

    const card = document.createElement('div');
    card.classList.add('card');
    card.style.height = '480px';

    const img = document.createElement('img');
    img.src = product.itemImageURL;
    img.classList.add('card-img-top');
    img.alt = product.itemName;
    img.style.height = '250px';

    const cardBody = document.createElement('div');
    cardBody.classList.add('card-body');

    const title = document.createElement('h5');
    title.classList.add('card-title');
    title.textContent = product.itemName;

    const price = document.createElement('p');
    price.classList.add('card-text');
    price.textContent = 'Price: RM' + product.itemPrice;

    const stock = document.createElement('p');
    stock.classList.add('card-text');
    stock.textContent = 'Stock: ' + product.itemStock;

    const addToCartButton = document.createElement('button');
    addToCartButton.classList.add('btn', 'btn-primary', 'add-to-cart');
    addToCartButton.textContent = 'Add to Cart';

    addToCartButton.addEventListener('click', function() {
        console.log('Item added to cart:', product.itemName);
    });

    cardBody.appendChild(title);
    cardBody.appendChild(price);
    cardBody.appendChild(stock);
    cardBody.appendChild(addToCartButton);

    card.appendChild(img);
    card.appendChild(cardBody);

    productCard.appendChild(card);

    return productCard;
}

// Add event listener to dropdown items
document.querySelectorAll('.dropdown-item').forEach(item => {
    item.addEventListener('click', scrollToCategory);
});

// Function to scroll to category
function scrollToCategory(event) {
    console.log('Dropdown item clicked.'); // Debug log
    event.preventDefault(); // Prevent default anchor behavior

    // Get the target section ID from the href attribute
    const targetId = this.getAttribute('href').substring(1);

    // Scroll to the target section
    const targetSection = document.getElementById(targetId);
    if (targetSection) {
        targetSection.scrollIntoView({
            behavior: 'smooth' // Optional: Use smooth scrolling
        });
    } else {
        console.log('Target section not found:', targetId); // Debug log
    }
}


// Call the function to fetch and display products by category when the page loads
document.addEventListener('DOMContentLoaded', fetchAndDisplayProductsByCategory);



function filterProductsByName(searchTerm) {
    const productList = document.getElementById('productList');
    const categoryProductsContainers = productList.getElementsByClassName('row mb-4');

    // Iterate through each category's products
    for (const container of categoryProductsContainers) {
        const products = container.getElementsByClassName('col-md-3 mb-4');
        // Iterate through each product in the category
        for (const product of products) {
            // Check if the product card contains a category heading
            const isCategoryHeading = product.tagName.toLowerCase() === 'h3';
            if (isCategoryHeading) {
                // Skip category headings
                continue;
            }
            const productName = product.querySelector('.card-title').textContent.toLowerCase();
            // Check if the product name includes the search term
            if (productName.includes(searchTerm.toLowerCase())) {
                // Show the product card
                product.style.display = 'block';
            } else {
                // Hide the product card if it doesn't match the search term
                product.style.display = 'none';
            }
        }
    }
}

// Event listener for the search input
document.getElementById('searchInput').addEventListener('input', function(event) {
    const searchTerm = event.target.value.trim();
    filterProductsByName(searchTerm);
});