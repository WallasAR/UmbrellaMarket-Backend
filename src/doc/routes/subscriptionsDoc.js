/**
 * @swagger
 * tags:
 *   name: Subscriptions
 *   description: Recurring medicine delivery subscriptions
 */

/**
 * @swagger
 * /subscriptions:
 *   get:
 *     summary: List user subscriptions
 *     tags: [Subscriptions]
 *     responses:
 *       200:
 *         description: Active and past subscriptions
 *       401:
 *         description: Missing or invalid token
 */

/**
 * @swagger
 * /subscriptions/medicine/{medicineId}:
 *   post:
 *     summary: Subscribe to a medicine
 *     tags: [Subscriptions]
 *     parameters:
 *       - in: path
 *         name: medicineId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               quantity:
 *                 type: integer
 *                 default: 1
 *     responses:
 *       200:
 *         description: Stripe checkout URL for subscription
 */

/**
 * @swagger
 * /subscriptions/{id}:
 *   delete:
 *     summary: Cancel a subscription
 *     tags: [Subscriptions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Subscription cancelled
 */
