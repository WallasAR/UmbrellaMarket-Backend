/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Operations related to user authentication
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: "User Login"
 *     description: "Authenticate a user and generate a JWT token for access."
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: "Email of the user"
 *                 example: "user@example.com"
 *               pass:
 *                 type: string
 *                 description: "Password of the user"
 *                 example: "password123"
 *     responses:
 *       200:
 *         description: "Login successful. JWT token returned."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "Response message"
 *                   example: "Login Successfully"
 *                 token:
 *                   type: string
 *                   description: "JWT token for user authentication"
 *       400:
 *         description: "Bad request, missing email or password"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "Error message"
 *                   example: "Email and password are required"
 *       401:
 *         description: "Invalid credentials"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "Error message"
 *                   example: "Invalid credentials"
 *       500:
 *         description: "Internal Server Error"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "Error message"
 *                   example: "An error occurred"
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: "User Registration"
 *     description: "Register a new user and generate a JWT token for access."
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: "Email of the user"
 *                 example: "newuser@example.com"
 *               pass:
 *                 type: string
 *                 description: "Password of the user"
 *                 example: "password123"
 *     responses:
 *       201:
 *         description: "Registration successful. JWT token returned."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "Response message"
 *                   example: "Successful registration"
 *                 token:
 *                   type: string
 *                   description: "JWT token for user authentication"
 *       400:
 *         description: "Bad request, missing email or password"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "Error message"
 *                   example: "Email and password are required"
 *       409:
 *         description: "Conflict, email already registered"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "Error message"
 *                   example: "Email is already registered"
 *       500:
 *         description: "Internal Server Error"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "Error message"
 *                   example: "An error occurred"
 */