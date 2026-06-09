/**
 * @swagger
 * tags:
 *   name: Onboarding
 *   description: SaaS pharmacy registration and plan selection
 */

/**
 * @swagger
 * /onboarding/plans:
 *   get:
 *     summary: List available SaaS plans
 *     tags: [Onboarding]
 *     security: []
 *     responses:
 *       200:
 *         description: Plan tiers with pricing and limits
 */

/**
 * @swagger
 * /onboarding/status:
 *   get:
 *     summary: Get current user onboarding status
 *     tags: [Onboarding]
 *     responses:
 *       200:
 *         description: none, pending, approved or rejected
 *       401:
 *         description: Missing or invalid token
 */

/**
 * @swagger
 * /onboarding/register:
 *   post:
 *     summary: Submit pharmacy registration for review
 *     tags: [Onboarding]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, cnpj, address, city, state, cep, phone]
 *             properties:
 *               name:
 *                 type: string
 *               cnpj:
 *                 type: string
 *               address:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               cep:
 *                 type: string
 *               phone:
 *                 type: string
 *               plan_tier:
 *                 type: string
 *                 enum: [free, pro, enterprise]
 *     responses:
 *       201:
 *         description: Pharmacy submitted for approval
 *       400:
 *         description: Validation error
 */
