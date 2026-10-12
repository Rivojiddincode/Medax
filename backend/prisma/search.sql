CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS product_name_trgm ON "Product" USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS product_sku_trgm ON "Product" USING gin (sku gin_trgm_ops);
