ALTER TABLE companies ALTER COLUMN payment_terms_days TYPE text USING NULL;
ALTER TABLE companies ADD COLUMN notes text;
