/**
 * @swagger
 * tags:
 *   name: Pharmacy
 *   description: Pharmacy panel operations (pharmacist, operator or admin)
 */

/**
 * @swagger
 * /pharmacy/dashboard:
 *   get:
 *     summary: Pharmacy dashboard summary
 *     tags: [Pharmacy]
 *     responses:
 *       200:
 *         description: Product, batch and order counters
 */

/**
 * @swagger
 * /pharmacy/metrics:
 *   get:
 *     summary: Pharmacy conversion metrics
 *     tags: [Pharmacy]
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d]
 *     responses:
 *       200:
 *         description: Checkout conversion and dailyConversion trend
 */

/**
 * @swagger
 * /pharmacy/financial:
 *   get:
 *     summary: Pharmacy financial report
 *     tags: [Pharmacy]
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d, all]
 *     responses:
 *       200:
 *         description: Gross revenue, fees and daily breakdown
 */

/**
 * @swagger
 * /pharmacy/financial/export:
 *   get:
 *     summary: Export pharmacy financial CSV
 *     tags: [Pharmacy]
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d, all]
 *     responses:
 *       200:
 *         description: CSV attachment
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 */

/**
 * @swagger
 * /pharmacy/products:
 *   get:
 *     summary: List pharmacy products
 *     tags: [Pharmacy]
 *     responses:
 *       200:
 *         description: Product list
 *   post:
 *     summary: Create pharmacy product
 *     tags: [Pharmacy]
 *     responses:
 *       201:
 *         description: Product created
 */

/**
 * @swagger
 * /pharmacy/orders:
 *   get:
 *     summary: List pharmacy orders
 *     tags: [Pharmacy]
 *     responses:
 *       200:
 *         description: Order list
 */
