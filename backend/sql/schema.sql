CREATE DATABASE IF NOT EXISTS automarket_pro;
USE automarket_pro;

CREATE TABLE IF NOT EXISTS people (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  phone VARCHAR(20) NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vehicles (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  plate VARCHAR(10) NOT NULL UNIQUE,
  brand VARCHAR(50) NOT NULL,
  color VARCHAR(30) NOT NULL,
  vehicle_condition ENUM('Nuevo', 'Usado') NOT NULL,
  mileage INT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS purchases (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  vehicle_id BIGINT UNSIGNED NOT NULL UNIQUE,
  seller_id BIGINT UNSIGNED NOT NULL,
  purchase_date DATE NOT NULL,
  purchase_price DECIMAL(14, 2) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_purchase_price CHECK (purchase_price > 0),
  CONSTRAINT fk_purchases_vehicle FOREIGN KEY (vehicle_id)
    REFERENCES vehicles (id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT fk_purchases_seller FOREIGN KEY (seller_id)
    REFERENCES people (id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS sales (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  vehicle_id BIGINT UNSIGNED NOT NULL UNIQUE,
  buyer_id BIGINT UNSIGNED NOT NULL,
  sale_date DATE NOT NULL,
  sale_price DECIMAL(14, 2) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_sale_price CHECK (sale_price > 0),
  CONSTRAINT fk_sales_vehicle FOREIGN KEY (vehicle_id)
    REFERENCES vehicles (id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT fk_sales_buyer FOREIGN KEY (buyer_id)
    REFERENCES people (id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
);

DROP TRIGGER IF EXISTS trg_sales_requires_purchase;
DELIMITER //
CREATE TRIGGER trg_sales_requires_purchase
BEFORE INSERT ON sales
FOR EACH ROW
BEGIN
  IF NOT EXISTS (SELECT 1 FROM purchases WHERE vehicle_id = NEW.vehicle_id) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'No se puede registrar una venta sin compra previa';
  END IF;
END //
DELIMITER ;

CREATE OR REPLACE VIEW inventory_status AS
SELECT
  v.plate AS placa,
  v.brand AS marca,
  v.color,
  v.vehicle_condition AS estado_vehiculo,
  v.mileage AS kilometraje,
  p.purchase_date AS fecha_ingreso,
  p.purchase_price AS precio_compra,
  seller.full_name AS nombre_vendedor,
  seller.phone AS telefono_vendedor,
  s.sale_date AS fecha_venta,
  s.sale_price AS precio_venta,
  buyer.full_name AS nombre_comprador,
  buyer.phone AS telefono_comprador,
  CASE WHEN s.id IS NULL THEN 'Disponible' ELSE 'Vendido' END AS estado_operacion,
  CASE WHEN s.id IS NULL THEN NULL ELSE (s.sale_price - p.purchase_price) END AS ganancia
FROM vehicles v
LEFT JOIN purchases p ON p.vehicle_id = v.id
LEFT JOIN people seller ON seller.id = p.seller_id
LEFT JOIN sales s ON s.vehicle_id = v.id
LEFT JOIN people buyer ON buyer.id = s.buyer_id;
