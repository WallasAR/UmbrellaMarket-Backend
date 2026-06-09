/**
 * @swagger
 * tags:
 *   name: Health
 *   description: Service health and uptime
 */

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check
 *     description: Returns service status for uptime monitors. Mounted at the API root (not under /api).
 *     tags: [Health]
 *     security: []
 *     servers:
 *       - url: http://localhost:4000
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 uptime:
 *                   type: number
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 version:
 *                   type: string
 */
