/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: In-app and browser push notifications
 */

/**
 * @swagger
 * /notifications/vapid-public-key:
 *   get:
 *     summary: Get VAPID public key
 *     description: Returns the public key used to subscribe to browser push notifications.
 *     tags: [Notifications]
 *     security: []
 *     responses:
 *       200:
 *         description: VAPID public key (null when not configured)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 publicKey:
 *                   type: string
 *                   nullable: true
 */

/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: List user notifications
 *     tags: [Notifications]
 *     responses:
 *       200:
 *         description: Notification list
 */

/**
 * @swagger
 * /notifications/push-subscribe:
 *   post:
 *     summary: Save browser push subscription
 *     tags: [Notifications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [endpoint, keys]
 *             properties:
 *               endpoint:
 *                 type: string
 *                 format: uri
 *               keys:
 *                 type: object
 *                 properties:
 *                   p256dh:
 *                     type: string
 *                   auth:
 *                     type: string
 *     responses:
 *       200:
 *         description: Subscription saved
 */
