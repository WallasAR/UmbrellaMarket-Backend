// server.js
const express = require("express"); // express module
const cors = require("cors"); 
const app = express(); // instance of express
const PORT = 999; // Port localhost

// File Manipulation
const fs = require("fs");
const path = require("path");

// Importation Middleware
const { router: authRoutes, autenticateToken } = require("./auth"); // Importa `router` e `autenticateToken`

// Add jsons (retire this wallinhas!, make requests in routes)
const products = require("../db/products.json");
const cartProducts = require("../db/cart.json");

app.use(cors());
app.use(express.json());

app.use("/api", authRoutes);

// Search Products
app.get("/api/products", (req, res) => {
    // Read files JSON of products
    const productsFilePath = path.join(__dirname, "../db/products.json");
    const products = JSON.parse(fs.readFileSync(productsFilePath, "utf8"));

    // Get query parameters
    const { desconto, estoque } = req.query;
    
    // Aplicar filtros, se presentes
    let filteredProducts = products;
    if (desconto) {
        filteredProducts = filteredProducts.filter(product => product.desconto > 0);
    }
    if (estoque) {
        filteredProducts = filteredProducts.filter(product => product.estoque > 0);
    }

    // Retornar produtos filtrados ou todos os produtos
    res.json(filteredProducts);
});


// Add to cart
app.post("/api/cart", autenticateToken, (req, res) => {
    const id = Number(req.body.id);
    const amount = Number(req.body.quantidade);
    
    // Checar se o produto existe no arquivo de produtos
    const productsFilePath = path.join(__dirname, "../db/products.json"); // Certifique-se de que o caminho está correto
    const products = JSON.parse(fs.readFileSync(productsFilePath, "utf8"));
    const product = products.find(product => product.id === id);

    if (!product) {
        return res.status(404).json({ message: "Produto não encontrado" });
    }

    // Ler arquivo JSON do carrinho
    const cartFilePath = path.join(__dirname, "../db/cart.json");
    let cartProducts = JSON.parse(fs.readFileSync(cartFilePath, "utf8"));

    // Verificar se o produto já está no carrinho
    const cartProduct = cartProducts.find(cartProduct => cartProduct.id === id);

    if (cartProduct) {
        cartProduct.quantidade += amount;
    } else {
        cartProducts.push({
            id: product.id,
            nome: product.nome,
            quantidade: amount,
            preco: product.desconto ? Number((product.preco * (1 - product.desconto / 100)).toFixed(2)) : product.preco, // Isso não deve estar aqui - regra de negocio na api? -, mas ta funcionando! Quebra-galho
            imagem: product.imagem
        });
    }

    // Escrever o arquivo JSON do carrinho
    fs.writeFileSync(cartFilePath, JSON.stringify(cartProducts, null, 2));

    res.status(201).json({ message: "Produto adicionado ao carrinho" });
});

// Rota para atualizar a quantidade de vários produtos no carrinho
app.put("/api/cart", (req, res) => {
    const updates = req.body; // Espera-se que o corpo contenha um array de objetos com id e quantidade

    // Ler arquivo JSON do carrinho
    const cartFilePath = path.join(__dirname, "../db/cart.json");
    let cartProducts = JSON.parse(fs.readFileSync(cartFilePath, "utf8"));

    updates.forEach(update => {
        const cartProduct = cartProducts.find(cartProduct => cartProduct.id === update.id);

        if (cartProduct) {
            // Atualiza apenas a quantidade do produto existente
            cartProduct.quantidade = update.quantidade;
        } 
    });

    // Escrever o arquivo JSON do carrinho
    fs.writeFileSync(cartFilePath, JSON.stringify(cartProducts, null, 2));

    res.status(200).json({ message: "Quantidades atualizadas com sucesso" });
});


// Rota para listar carrinho
app.get("/api/cart", (req, res) => {
    res.json(cartProducts);
    res.status(200).json({message: "OK"});
});

// Rota para remover um produto do carrinho
app.delete("/api/cart/:id", (req, res) => {
    // Obter o id do produto a ser removido
    const id = Number(req.params.id);

    // Ler JSON do carrinho
    const cartFilePath = path.join(__dirname, "../db/cart.json");
    let cartProducts = JSON.parse(fs.readFileSync(cartFilePath, "utf8"));

    // Remover o produto do carrinho
    cartProducts = cartProducts.filter(cartProduct => cartProduct.id !== id);
    if (cartProducts) {
        // Escrever o arquivo JSON do carrinho
        fs.writeFileSync(cartFilePath, JSON.stringify(cartProducts, null, 2));
    };
    res.status(200).json({message: "OK"});
});

app.listen(PORT, "localhost", () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
