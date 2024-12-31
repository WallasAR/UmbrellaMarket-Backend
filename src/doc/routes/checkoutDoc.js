/**
 * @swagger
 * tags:
 *   name: Checkout
 *   description: Operations related to cart and item checkout process
 */

/**
 * @swagger
 * /checkout/cart:
 *   post:
 *     summary: "Cart Checkout"
 *     description: "Initiate the checkout process for all items in the user's cart and generate a Stripe checkout session URL."
 *     tags: [Checkout]
 *     responses:
 *       200:
 *         description: "Cart checkout successful. Redirect URL for Stripe payment session."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 *                   description: "URL for Stripe checkout session"
 *                   example: "https://checkout.stripe.com/pay/cs_test_12345"
 *       400:
 *         description: "Cart is empty or user is not authenticated"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "Error message"
 *                   example: "Cart is empty"
 *       500:
 *         description: "Internal server error, could not create checkout session"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "Error message"
 *                   example: "An error occurred while creating the session"
 */

/**
 * @swagger
 * /checkout/item/{id}:
 *   post:
 *     summary: "Item Checkout"
 *     description: "Initiate the checkout process for a specific item in the user's cart and generate a Stripe checkout session URL."
 *     tags: [Checkout]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: "ID of the product to checkout"
 *         schema:
 *           type: integer
 *           example: 123
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               quantity:
 *                 type: integer
 *                 description: "Quantity of the item to purchase"
 *                 example: 2
 *     responses:
 *       200:
 *         description: "Item checkout successful. Redirect URL for Stripe payment session."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 *                   description: "URL for Stripe checkout session"
 *                   example: "https://checkout.stripe.com/pay/cs_test_67890"
 *       400:
 *         description: "Invalid product ID, cart is empty, or user is not authenticated"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "Error message"
 *                   example: "Invalid product ID or cart is empty"
 *       500:
 *         description: "Internal server error, could not create checkout session"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "Error message"
 *                   example: "An error occurred while creating the session"
 */

/**
 * @swagger
 * /checkout/success:
 *   get:
 *     summary: "Payment Success"
 *     description: "Handles the callback after a successful payment to update payment status."
 *     tags: [Checkout]
 *     parameters:
 *       - in: query
 *         name: sessionId
 *         required: true
 *         description: "Session ID from the payment gateway to retrieve payment status"
 *         schema:
 *           type: string
 *           example: "cs_test_12345"
 *     responses:
 *       200:
 *         description: "Payment status updated successfully"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   description: "Payment status"
 *                   example: "paid"
 *       400:
 *         description: "Session ID not provided or invalid"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "Error message"
 *                   example: "Session ID not provided"
 *       500:
 *         description: "Internal server error, could not update payment status"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "Error message"
 *                   example: "An error occurred while updating payment status"
 */
