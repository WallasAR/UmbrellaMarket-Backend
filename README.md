![Img](https://lh3.googleusercontent.com/pw/AP1GczPOBheu7DpbvY8uGOXMCpz8MS09PEFSPfY434VDHPyS-3UWemaxGZ1Z7m6Uy7qX8A5t7i2kNj3KAkgR52vuSocVg-TdqRn54umKFh7Bjg7QYnRxSBuAkkj4Ow9KQ5dI-Ls4S3hlhlN3aeDrs-L-l6pl=w1920-h480-s-no-gm?authuser=0)

Welcome to the **Umbrella Marketplace** backend repository! This API powers the e-commerce platform for selling medicines, offering secure and scalable features for user management, product listings, and shopping cart functionalities.

---

## 📑 Summary

1. [Features](#-features)
2. [Folder Structure](#-folder-structure)
   - [Description of Folders](#description-of-folders)
     - [`src/routes/`](#srcroutes)
     - [`src/controllers/`](#srccontrollers)
     - [`src/services/`](#srcservices)
     - [`src/middlewares/`](#srcmiddlewares)
     - [`src/public/`](#srcpublic)
     - [`src/config/`](#srcconfig)
     - [`src/doc/`](#srcdoc)
3. [API Documentation](#-api-documentation)
4. [Getting Started](#-getting-started)
5. [Technologies Used](#%EF%B8%8F-technologies-used)
6. [Contribution](#-contribution)

---

## 🚀 Features

- Modular structure for maintainability and scalability.
- JWT-based authentication for secure access.
- Real-time database interaction with **Supabase**.
- Comprehensive documentation using Swagger.

---

## 📂 Folder Structure

Here is the organized folder structure of the backend:

```plaintext
UmbrellaMarket-Backend/
├── src/
│   ├── routes/                    # API routes
│   ├── controllers/               # Route control logic
│   ├── services/                  # Business logic and integration
│   ├── middlewares/               # Middleware utilities
│   ├── public/                    # Static files
│   ├── config/                    # Configuration files
│   ├── doc/                       # API Documentation
│   └── app.js                     # Main application setup
│
├── .env                           # Environment variables
├── package.json                   # Project dependencies
└── README.md                      # Project documentation
```

### Description of Folders

#### `src/routes/`

Contains all application route files.

- **`auth.js`**: Authentication-related routes (login, registration, etc.).
- **`cart.js`**: Routes to manage the shopping cart (add, remove, list items).
- **`checkout.js`**: Handles payment and checkout-related routes.
- **`medicine.js`**: Product-related routes (add, update, delete, view products).
- **`user.js`**: User profile management routes (view, edit user data).

#### `src/controllers/`

Contains the logic for handling requests and responses for each route.

- **`authController.js`**: Handles authentication processes like login and registration.
- **`cartController.js`**: Logic for managing cart operations.
- **`checkoutController.js`**: Handles the checkout process.
- **`medicineController.js`**: Manages product-related operations.
- **`userController.js`**: Handles user profile operations.

#### `src/services/`

Business logic and integration with external services (e.g., database).

- **`database.js`**: Establishes and manages database connections.
- **`authService.js`**: Provides authentication-related utilities and functions.
- **`cartService.js`**: Logic for cart operations, like adding or removing items.
- **`checkoutService.js`**: Handles payment and checkout-related business rules.
- **`medicineService.js`**: Provides product-related utilities and database operations.
- **`userService.js`**: Functions for user-related operations.

#### `src/middlewares/`

Middleware utilities for request validation and error handling.

- **`authMiddleware.js`**: Verifies authentication tokens for protected routes.
- **`errorMiddleware.js`**: Centralized error handling for API requests.

#### `src/public/`

Static files for serving the Swagger UI and other assets.

- **`swaggerJs.js`**: Core Swagger UI JavaScript file.
- **`assets/`**: Contains images, icons, and other static resources.

#### `src/config/`

Configuration files for the project.

- **`swagger.js`**: Contains Swagger API documentation setup.
- **`swaggerUI.css`**: Custom styling for Swagger UI.

#### `src/doc/`

Centralized documentation for all API endpoints.

- **`index.js`**: Initializes Swagger documentation.
- **`routes/`**: Documentation for individual API routes.

---

## 📜 API Documentation

The API documentation is available with Swagger. You can access it at the following locations:

- **Render Deployment:**
  
  > https://umbrellacorp-api.onrender.com/docs


- **Local Environment:**
  ```
  http://localhost:3000/api-docs
  ```

---

## 💻 Getting Started

Follow these steps to run the project locally:

### 1. Clone the Repository

```bash
git clone https://github.com/WalllasAR/UmbrellaMarket-Backend.git
cd UmbrellaMarket-Backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file and configure it as follows:

```env
JWT_SECRET=your_secret_key
SUPABASE_URL=https://your-supabase-instance.supabase.co
SUPABASE_KEY=your_supabase_anon_key
```

### 4. Start the Server

```bash
npm start
```

The server will run on `http://localhost:3000` by default.

---

## 🛠️ Technologies Used

- **Node.js**: JavaScript runtime for server development.
- **Express.js**: Framework for routing and middleware.
- **JWT**: Secure user authentication.
- **Supabase**: Real-time database and authentication.
- **Swagger**: API documentation.

---

## 🤝 Contribution

Contributions are welcome! If you have suggestions or find issues, feel free to open a pull request or create an issue.

---
