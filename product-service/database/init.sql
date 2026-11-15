CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    description TEXT,
    stock INT NOT NULL DEFAULT 0,
    image MEDIUMTEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Data Contoh
-- image memakai PNG 1x1 piksel (70 byte) supaya init.sql tetap ringan dibaca
INSERT INTO products (name, description, price, stock, image) VALUES
('ELECFOX PolarStar 64 HE', 'Performa magnetic switch yang responsif, layout compact 64 keys, dan konstruksi full aluminum CNC dalam satu keyboard gaming dari ELECFOX.', 900240, 10, 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='),
('Logitech PRO X2 SUPERSTRIKE LIGHTSPEED', 'Logitech PRO X2 SUPERSTRIKE LIGHTSPEED Mouse Gaming Nirkabel, Kinerja Ultra-Fast, Ultra Ringan (61 g), Haptik Klik yang Dapat Disesuaikan, Pengisian USB-C, untuk PC/Mac/Laptop', 3074000, 20, 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='),
('Logitech G733 LIGHTSPEED Wireless 7.1 Surround Gaming Headset', 'Teknologi wireless LIGHTSPEED memberikan daya tahan baterai selama 29+ jam dan kebebasan wireless yang andal hingga maksimal 20 meter. Daya tahan baterai berdasarkan volume headset yang ditetapkan ke 50% dan pencahayaan dimatikan Relaks dan buai dirimu dalam game, musik, film, atau apa pun hobimu. Bebas dan mainkan sesuai keinginanmu.', 1764560, 10, 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==');
