/**
 * @swagger
 * tags:
 *   name: User
 *   description: Operations related to user profiles
 */

/**
 * @swagger
 * /user/profile:
 *   get:
 *     summary: "Get User Profile"
 *     description: "Retrieve the profile information of the authenticated user."
 *     tags: [User]
 *     responses:
 *       200:
 *         description: "Profile retrieved successfully."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 avatar:
 *                   type: string
 *                   description: "URL of the user's avatar"
 *                   example: "https://example.com/avatar.jpg"
 *                 name:
 *                   type: string
 *                   description: "Name of the user"
 *                   example: "John Doe"
 *                 email:
 *                   type: string
 *                   description: "Email of the user"
 *                   example: "john.doe@example.com"
 *                 phone:
 *                   type: string
 *                   description: "Phone number of the user"
 *                   example: "+55 11 98765-4321"
 *                 cep:
 *                   type: string
 *                   description: "CEP (Postal Code) of the user's address"
 *                   example: "12345-678"
 *                 address:
 *                   type: string
 *                   description: "Full address of the user"
 *                   example: "123 Main St, Apartment 456, City, State, Country"
 *       401:
 *         description: "Unauthorized. User token is invalid or missing."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "Error message"
 *                   example: "User not found"
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
 * /user/edit:
 *   put:
 *     summary: "Update User Profile"
 *     description: "Update the profile information of the authenticated user."
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 description: "New URL of the user's avatar"
 *                 example: "https://example.com/new-avatar.jpg"
 *               name:
 *                 type: string
 *                 description: "New name for the user"
 *                 example: "Jane Doe"
 *               email:
 *                 type: string
 *                 description: "New email for the user"
 *                 example: "jane.doe@example.com"
 *               phone:
 *                 type: string
 *                 description: "New phone number for the user"
 *                 example: "+55 11 91234-5678"
 *               cep:
 *                 type: string
 *                 description: "New CEP (Postal Code) of the user's address"
 *                 example: "87654-321"
 *               address:
 *                 type: string
 *                 description: "New full address for the user"
 *                 example: "456 Another St, House 789, City, State, Country"
 *     responses:
 *       200:
 *         description: "Profile updated successfully."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "Response message"
 *                   example: "Profile updated"
 *       400:
 *         description: "Bad Request. Missing or invalid profile data."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "Error message"
 *                   example: "Profile data is required"
 *       401:
 *         description: "Unauthorized. User token is invalid or missing."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "Error message"
 *                   example: "User not found"
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