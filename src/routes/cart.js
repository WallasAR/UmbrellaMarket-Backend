const express = require("express");
const fs = require("fs");
const path = require("path");
const stripe = require("stripe")(process.env.STRIPE_KEY);

const router = express.Router();

const cartFilePath = path.join(__dirname, "../db/cart.json");

router.post("/checkout", async (req, res) => {
  try {
    const cartContent = fs.readFileSync(cartFilePath, "utf8");
    const cartItems = JSON.parse(cartContent);

    const lineItems = cartItems.map(( item ) => ({
      price_data: {
        currency: "brl",
        product_data: {
          name: item.nome
        },
        unit_amount: item.preco * 100, // value incents
      },
      quantity: item.quantidade,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: "http://127.0.0.1:5501/index.html",
      cancel_url: "http://127.0.0.1:5501/html/cart.html",
    });

    res.json({ url: session.url });
  } catch (error) {
    res.status(500).json({ error: error.message })
  } 
});

// Rota dedicada para "Comprar Agora" com um único item
router.post("/checkout/single-item", async (req, res) => {
  try {
    const { id, nome, quantidade, preco, imagem } = req.body;

    if (!id || !nome || !quantidade || !preco) {
      return res.status(400).json({ error: "Dados insuficientes para compra direta." });
    }

    const lineItems = [{
      price_data: {
        currency: "brl",
        product_data: { name: nome },
        unit_amount: preco * 100, // Valor em centavos
      },
      quantity: quantidade,
    }];

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: "http://127.0.0.1:5501/index.html",
      cancel_url: "http://127.0.0.1:5501/html/cart.html",
    });

    res.json({ url: session.url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


module.exports = router;