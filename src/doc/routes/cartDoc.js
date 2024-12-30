/**
 * @swagger
 * tags:
 *   name: Cart
 *   description: Operations related to the user's shopping cart
 */

/**
 * @swagger
 * /cart/list:
 *   get:
 *     summary: "List Cart"
 *     description: "Retrieve all items in the user's shopping cart."
 *     tags: [Cart]
 *     responses:
 *       200:
 *         description: "Successful retrieval of the cart."
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   user_id:
 *                     type: integer
 *                     description: "The user ID"
 *                   medicine_id:
 *                     type: integer
 *                     description: "The product ID in the cart"
 *                   quantity:
 *                     type: integer
 *                     description: "The quantity of the product in the cart"
 *               example:
 *                 - user_id: 1
 *                   medicine_id: 101
 *                   quantity: 2
 *       400:
 *         description: "Bad request, user not specified."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User Required"
 *       500:
 *         description: "Internal server error"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "An error occurred"
 */

/**
 * @swagger
 * /cart/add:
 *   post:
 *     summary: "Add Product to Cart"
 *     description: "Add a product to the user's shopping cart."
 *     tags: [Cart]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               medicine_id:
 *                 type: integer
 *                 description: "Product ID to be added"
 *                 example: 101
 *               quantity:
 *                 type: integer
 *                 description: "Quantity of the product"
 *                 example: 2
 *     responses:
 *       201:
 *         description: "Product successfully added to the cart."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Product added successfully"
 *       400:
 *         description: "Bad request, missing product ID or quantity."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User, product and quantity must be specified"
 *       500:
 *         description: "Internal server error"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "An error occurred"
 */

/**
 * @swagger
 * /cart/update:
 *   put:
 *     summary: "Update Product Quantity in Cart"
 *     description: "Update the quantity of a product in the user's shopping cart."
 *     tags: [Cart]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               medicine_id:
 *                 type: integer
 *                 description: "Product ID to be updated"
 *                 example: 101
 *               quantity:
 *                 type: integer
 *                 description: "New quantity of the product"
 *                 example: 3
 *     responses:
 *       200:
 *         description: "Cart updated successfully."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Cart updated successfully"
 *       400:
 *         description: "Bad request, missing product ID or quantity."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Product identifier and quantity must be integers"
 *       404:
 *         description: "Product not found in the cart."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Product not found in the cart"
 *       500:
 *         description: "Internal server error"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "An error occurred"
 */

/**
 * @swagger
 * /cart/delete/{id}:
 *   delete:
 *     summary: "Remove Product from Cart"
 *     description: "Remove a specific product from the user's shopping cart."
 *     tags: [Cart]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: "Product ID to be removed from the cart"
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: "Product successfully removed from the cart."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Product removed successfully"
 *       400:
 *         description: "Bad request, product ID or user not specified."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User and product must be specified"
 *       404:
 *         description: "Product not found in the cart."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Product not found in the cart"
 *       500:
 *         description: "Internal server error"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "An error occurred"
 */
