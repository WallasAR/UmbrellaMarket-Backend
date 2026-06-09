/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Platform administration (admin or operator role)
 */

/**
 * @swagger
 * /admin/dashboard:
 *   get:
 *     summary: Admin dashboard counters
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Summary stats
 *       403:
 *         description: Access denied
 */

/**
 * @swagger
 * /admin/metrics:
 *   get:
 *     summary: Platform conversion and revenue metrics
 *     tags: [Admin]
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d]
 *           default: 30d
 *     responses:
 *       200:
 *         description: Metrics including dailyConversion trend
 */

/**
 * @swagger
 * /admin/financial:
 *   get:
 *     summary: Platform financial summary
 *     tags: [Admin]
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d, all]
 *           default: 30d
 *     responses:
 *       200:
 *         description: GMV, commissions and daily revenue
 */

/**
 * @swagger
 * /admin/financial/export:
 *   get:
 *     summary: Export platform financial CSV
 *     tags: [Admin]
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d, all]
 *     responses:
 *       200:
 *         description: CSV file
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 */
