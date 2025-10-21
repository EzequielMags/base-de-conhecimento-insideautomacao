-- Adicionar novas categorias Tablet e Extras ao enum
ALTER TYPE card_category ADD VALUE IF NOT EXISTS 'Tablet';
ALTER TYPE card_category ADD VALUE IF NOT EXISTS 'Extras';