/**
 * @swagger
 * tags:
 *   name: Medicine
 *   description: Operations related to medicine products
 */

/**
 * @swagger
 * /product/list:
 *   get:
 *     summary: "Get list of medicines"
 *     description: "Retrieve a list of all medicines. The list can be filtered by discount and stock."
 *     tags: [Medicine] 
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: discount
 *         description: "Filter for medicines with discount greater than 0."
 *         required: false
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: stock
 *         description: "Filter for medicines with stock greater than 0."
 *         required: false
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: "A list of medicines."
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     description: "ID of the medicine"
 *                   name:
 *                     type: string
 *                     description: "Name of the medicine"
 *                   price:
 *                     type: number
 *                     format: float
 *                     description: "Price of the medicine"
 *                   discount:
 *                     type: number
 *                     format: float
 *                     description: "Discount on the medicine"
 *                   stock:
 *                     type: integer
 *                     description: "Available stock of the medicine"
 *                   images:
 *                     type: object
 *                     properties:
 *                       thumb_img:
 *                         type: string
 *                         description: "Thumbnail image of the medicine"
 *       500:
 *         description: "Internal Server Error"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "Error message"
 */

/**
 * @swagger
 * /product/{id}:
 *   get:
 *     summary: "Get details of a specific medicine"
 *     description: "Retrieve detailed information for a specific medicine by its ID."
 *     tags: [Medicine]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         description: "ID of the medicine to be fetched"
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: "Details of the specific medicine."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   description: "ID of the medicine"
 *                 name:
 *                   type: string
 *                   description: "Name of the medicine"
 *                 price:
 *                   type: number
 *                   format: float
 *                   description: "Price of the medicine"
 *                 discount:
 *                   type: number
 *                   format: float
 *                   description: "Discount on the medicine"
 *                 stock:
 *                   type: integer
 *                   description: "Available stock of the medicine"
 *                 images:
 *                   type: object
 *                   properties:
 *                     thumb_img:
 *                       type: string
 *                       description: "Thumbnail image of the medicine"
 *                     primary_img:
 *                       type: string
 *                       description: "Primary image of the medicine"
 *                     secondary_img:
 *                       type: string
 *                       description: "Secondary image of the medicine"
 *                     tertiary_img:
 *                       type: string
 *                       description: "Tertiary image of the medicine"
 *       400:
 *         description: "Invalid ID"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "Error message"
 *       404:
 *         description: "Medicine not found"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "Error message"
 *       500:
 *         description: "Internal Server Error"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "Error message"
 */