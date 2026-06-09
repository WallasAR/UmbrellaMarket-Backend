/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Customer order history
 */

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: List authenticated user orders
 *     tags: [Orders]
 *     responses:
 *       200:
 *         description: Order list grouped by checkout session
 *       401:
 *         description: Missing or invalid token
 */

/**
 * @swagger
 * /orders/{sessionId}:
 *   get:
 *     summary: Get order details by Stripe session id
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order details with line items
 *       404:
 *         description: Order not found
 */
