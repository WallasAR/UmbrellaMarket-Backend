/**
 * @swagger
 * tags:
 *   name: Coupons
 *   description: Discount coupon validation
 */

/**
 * @swagger
 * /coupons/validate:
 *   post:
 *     summary: Validate a coupon code
 *     tags: [Coupons]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code]
 *             properties:
 *               code:
 *                 type: string
 *                 example: UMBRELLA10
 *               subtotal:
 *                 type: number
 *                 example: 150.0
 *     responses:
 *       200:
 *         description: Coupon is valid
 *       400:
 *         description: Invalid or expired coupon
 *       401:
 *         description: Missing or invalid token
 */
