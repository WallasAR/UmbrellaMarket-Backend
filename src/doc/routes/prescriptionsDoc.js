/**
 * @swagger
 * tags:
 *   name: Prescriptions
 *   description: Prescription upload and pharmacist review
 */

/**
 * @swagger
 * /prescriptions:
 *   get:
 *     summary: List user prescriptions
 *     tags: [Prescriptions]
 *     responses:
 *       200:
 *         description: Prescription list with status
 *   post:
 *     summary: Upload a prescription for a medicine
 *     tags: [Prescriptions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [medicine_id, file_data]
 *             properties:
 *               medicine_id:
 *                 type: integer
 *               file_name:
 *                 type: string
 *               file_data:
 *                 type: string
 *                 description: Base64-encoded file content
 *     responses:
 *       201:
 *         description: Prescription submitted for review
 */

/**
 * @swagger
 * /prescriptions/pending:
 *   get:
 *     summary: List prescriptions awaiting review
 *     tags: [Prescriptions]
 *     responses:
 *       200:
 *         description: Pending prescriptions (admin/pharmacist)
 *       403:
 *         description: Access denied
 */

/**
 * @swagger
 * /prescriptions/{id}/review:
 *   patch:
 *     summary: Approve or reject a prescription
 *     tags: [Prescriptions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [approved, rejected]
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Prescription reviewed
 */
