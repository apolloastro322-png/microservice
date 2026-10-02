const express = require('express');
const cors = require('cors');
const productRoutes = require('./routes/productRoutes');

const app = express()

app.use(cors());
// limit 10mb: image 2MB jadi string base64 sekitar 2.7MB, default express hanya 100kb
app.use(express.json({ limit: '10mb' }));

app.get('/health', (req, res) => {
    res.json({
        status: "ok",
        service: "product-service"
    });
});

app.use("/products", productRoutes)

app.use((req, res) => {
    res.status(404).json({
        message: "Endpoint tidak dikenal"
    })
})

module.exports = app;