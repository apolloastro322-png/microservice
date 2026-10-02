const productModel = require('../models/productModel');

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const BASE64_RE = /^[A-Za-z0-9+/]+={0,2}$/;
const MAGIC_BYTES = [
    [0x89, 0x50, 0x4e, 0x47], // PNG
    [0xff, 0xd8, 0xff],       // JPEG
    [0x47, 0x49, 0x46, 0x38]  // GIF
];

// Validasi image base64. Prefix data URI sengaja ditolak oleh regex.
// Return null jika valid, atau string pesan error.
function validateImage(image) {
    if (!image || typeof image !== 'string') {
        return 'Field image wajib diisi';
    }
    const value = image.trim();
    if (!value) {
        return 'Field image wajib diisi';
    }
    // Buffer.from(str, 'base64') tidak melempar error untuk string sampah,
    // jadi format dicek eksplisit lewat regex + kelipatan 4
    if (!BASE64_RE.test(value) || value.length % 4 !== 0) {
        return 'Field image harus berupa Base64 yang valid';
    }
    // batas 2MB berlaku untuk file asli, bukan panjang string base64
    if (Buffer.byteLength(value, 'base64') > MAX_IMAGE_BYTES) {
        return 'Ukuran image maksimal 2 MB';
    }
    const bytes = Buffer.from(value, 'base64');
    if (!MAGIC_BYTES.some((sig) => sig.every((b, i) => bytes[i] === b))) {
        return 'Format image tidak dikenali (hanya PNG, JPEG, GIF)';
    }
    return null;
}

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
        const { name, description, price, stock, image } = req.body;
        if (!name || price === undefined || stock === undefined) {
            return res.status(400).json({ message: 'Field name, price, dan stock wajib diisi' });
        }
        const imageError = validateImage(image);
        if (imageError) {
            return res.status(400).json({ message: imageError });
        }
        const product = await productModel.createProduct({ name, description: description || null, price, stock, image: image.trim() });
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
        const { name, description, price, stock, image } = req.body;
        if (!name || price === undefined || stock === undefined) {
            return res.status(400).json({ message: 'Field name, price, dan stock wajib diisi' });
        }
        const imageError = validateImage(image);
        if (imageError) {
            return res.status(400).json({ message: imageError });
        }
        const existing = await productModel.getProductById(id);
        if (!existing) {
            return res.status(404).json({ message: 'Produk tidak ditemukan' });
        }
        const product = await productModel.updateProduct(id, { name, description: description || null, price, stock, image: image.trim() });
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
