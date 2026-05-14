DROP TABLE IF EXISTS message_templates;
ALTER TABLE clients
  DROP CONSTRAINT IF EXISTS clients_phone_len,
  DROP CONSTRAINT IF EXISTS clients_whatsapp_len,
  DROP CONSTRAINT IF EXISTS clients_instagram_len;
ALTER TABLE clients
  DROP COLUMN IF EXISTS phone,
  DROP COLUMN IF EXISTS whatsapp,
  DROP COLUMN IF EXISTS instagram;
