![Img](https://lh3.googleusercontent.com/pw/AP1GczPOBheu7DpbvY8uGOXMCpz8MS09PEFSPfY434VDHPyS-3UWemaxGZ1Z7m6Uy7qX8A5t7i2kNj3KAkgR52vuSocVg-TdqRn54umKFh7Bjg7QYnRxSBuAkkj4Ow9KQ5dI-Ls4S3hlhlN3aeDrs-L-l6pl=w1920-h480-s-no-gm?authuser=0)

This repository contains the Back-End of the **Umbrella Marketplace** application, an e-commerce platform for selling medicines. The API was developed to offer authenticated and well-structured routes to manage users, products and the shopping cart.

---

## Folder Structure

The API was organized in a modular way, with each functionality in dedicated files to facilitate project maintenance and scalability. Below is the visual structure of the Back-End folders:

```plaintext
UmbrellaMarket-Backend/
├── src/
│   ├── routes/                    # API routes
│   │   ├── index.js               # Import all routes
│   │   ├── auth.js                # User auth routes
│   │   ├── cart.js                # Cart routes
│   │   ├── checkout.js            # Payment routes
│   │   ├── medicine.js            # Product routes
│   │   └── user.js                # User profile routes
│   │
│   ├── controllers/               # Route control logic
│   │   ├── authController.js      # User auth controller
│   │   ├── cartController.js      # Cart controller
│   │   ├── checkoutController.js  # Payment/checkout controller
│   │   ├── medicineController.js  # Product controller
│   │   └── userController.js      # User profile controller
│   │
│   ├── services/                  # Services for business rules and integration (e.g., Supabase)
│   │   ├── database.js            # Connection to Supabase
│   │   ├── authService.js         # Auth services
│   │   ├── cartService.js         # Cart services
│   │   ├── checkoutService.js     # Payment/checkout services
│   │   ├── medicineService.js     # Product services
│   │   └── userService.js         # User profile services
│   │
│   ├── middlewares/               # Middlewares
│   │   ├── authMiddleware.js      # Authentication middleware
│   │   └── errorMiddleware.js     # Error handling middleware
│   │
│   ├── public/                    # Static files
│   │   ├── swaggerJs.js           # Swagger UI javascript
│   │   └── assets/                # Swagger UI assets (images, icons, ...)
│   │
│   ├── config/					           # Settings (Swagger documentation)
│   │   ├── swagger.js             # Swagger parameter config
│   │   └── swaggerUI.css          # Swagger UI stylesheet
│   │
│   ├── doc/			                 # Endpoints documentation
│   │   ├── index.js               # Swagger init
│   │   └── routes/                # All documented routes
│   │
│   └── app.js                     # Express config
│
├── .env                           # Environment variables
├── package.json                   # Project dependencies
└── README.md                      # Project documentation
```

### Description of Folders

- **`src/routes/`**: Contains all application route files.

  - **`auth.js`**: Authentication-related routes (login, registration, etc.).
  - **`cart.js`**: Routes to manage the shopping cart (add, remove, list items).
  - **`server.js`**: Core server settings such as generic endpoints and initialization.

- **`src/controllers/`**: Place to organize route logic (if necessary).

- **`src/models/`**: Models for interacting with the database.

- **`src/middlewares/`**: Middleware for request validation and user authentication.

---

## API Resources

### 🔑 **Authentication**

- [JWT authentication system](https://pt.wikipedia.org/wiki/JSON_Web_Token) to protect routes.
- Middleware to validate tokens and ensure authenticated access.

---

## Technologies Used

- **Node.js**: Main platform for server development.
- **Express.js**: Framework for creating routes and middleware.
- **JWT**: For secure user authentication.
- **Supabase**: Database.

---

## How to Run the API

1. **Clone the Repository**

   ```bash
   git clone https://github.com/WalllasAR/UmbrellaMarket-Backend.git
   cd UmbrellaMarket-Backend
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Configure Environment Variables**\
   Create a `.env` file and enter the necessary settings such as the JWT key and database link.

   **Example of `.env`:**

   ```
   JWT_SECRET=your_secret_key
   SUPABASE_URL=https://your-supabase-instance.supabase.co
   SUPABASE_KEY=your_supabase_anon_key
   ```

4. **Start the Server**

   ```bash
   npm start
   ```

   The server will be running on `http://localhost:3000` (or another configured port).

---

## Contribution

Feel free to open issues or make pull requests for project improvements!
