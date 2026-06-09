/**
 * @swagger
 * tags:
 *   name: Webhooks
 *   description: External payment provider callbacks
 */

/**
 * @swagger
 * /webhooks/stripe:
 *   post:
 *     summary: Stripe webhook endpoint
 *     description: Receives Stripe events (checkout completed, subscription changes, invoice failures). Mounted at `/api/webhooks/stripe` with raw body parsing.
 *     tags: [Webhooks]
 *     security: []
 *     parameters:
 *       - in: header
 *         name: stripe-signature
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Event processed
 *       400:
 *         description: Invalid signature or payload
 */
