const productModel = require('../models/productModel');

// GET ambil semua products
async function index(req, res) {
    try {
        const products = await productModel.getAllProducts();
        res.status(200).json({
            message: 'Berhasil mengambil data produk',
            data: products
        });
    } catch (error) {
        res.status(500).json({ 
            message: 'Gagal mengambil data produk',
            error: error.message 
        });
    }
}

// GET ambil produk berdasarkan ID
async function show(req, res) {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ message: 'ID produk tidak valid' });
        }
        const product = await productModel.getProductById(id);
        if (!product) {
            return res.status(404).json({ message: 'Produk tidak ditemukan' });
        }
        res.status(200).json({
            message: 'Berhasil mengambil detail produk',
            data: product
        });
    } catch (error) {
        res.status(500).json({
            message: 'Gagal mengambil detail produk',
            error: error.message
        });
    }
}

// POST tambah produk (full: name, price, stock wajib)
async function createProduct(req, res) {
    try {
        const { name, description, price, stock } = req.body;
        if (!name || price === undefined || stock === undefined) {
            return res.status(400).json({ message: 'Field name, price, dan stock wajib diisi' });
        }
        const product = await productModel.createProduct({ name, description: description || null, price, stock });
        res.status(201).json({
            message: 'Berhasil menambah data produk',
            data: product
        });
    } catch (error) {
        res.status(500).json({ 
            message: 'Gagal menambah data produk',
            error: error.message 
        });
    }
}

// PUT update produk (full: name, price, stock wajib)
async function updateProduct(req, res) {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ message: 'ID produk tidak valid' });
        }
        const { name, description, price, stock } = req.body;
        if (!name || price === undefined || stock === undefined) {
            return res.status(400).json({ message: 'Field name, price, dan stock wajib diisi' });
        }
        const existing = await productModel.getProductById(id);
        if (!existing) {
            return res.status(404).json({ message: 'Produk tidak ditemukan' });
        }
        const product = await productModel.updateProduct(id, { name, description: description || null, price, stock });
        res.status(200).json({
            message: 'Berhasil memperbarui data produk',
            data: product
        });
    } catch (error) {
        res.status(500).json({
            message: 'Gagal memperbarui data produk',
            error: error.message
        });
    }
}

// DELETE hapus produk
async function destroy(req, res) {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ message: 'ID produk tidak valid' });
        }
        const deleted = await productModel.deleteProduct(id);
        if (!deleted) {
            return res.status(404).json({ message: 'Produk tidak ditemukan' });
        }
        res.status(200).json({ message: 'Berhasil menghapus data produk' });
    } catch (error) {
        res.status(500).json({
            message: 'Gagal menghapus data produk',
            error: error.message
        });
    }
}

module.exports = {
    index,
    show,
    createProduct,
    updateProduct,
    destroy
};
