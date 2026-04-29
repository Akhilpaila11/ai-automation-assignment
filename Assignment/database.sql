-- Dealership Creative Automation Tool
-- Database: dealership_db
-- Run: psql -U postgres -d dealership_db -f database.sql

CREATE EXTENSION IF NOT EXISTS "pgcrypto";


CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS dealerships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(255),
    logo_url VARCHAR(500),
    panel_url VARCHAR(500),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    asset_type VARCHAR(50) NOT NULL CHECK (asset_type IN ('background', 'panel', 'logo')),
    file_path VARCHAR(500) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'done', 'failed')),
    output_format VARCHAR(50) DEFAULT 'post_square',
    zip_path VARCHAR(500),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS job_dealerships (
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    dealership_id UUID NOT NULL REFERENCES dealerships(id) ON DELETE CASCADE,
    PRIMARY KEY (job_id, dealership_id)
);

CREATE TABLE IF NOT EXISTS job_assets (
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    PRIMARY KEY (job_id, asset_id)
);

CREATE TABLE IF NOT EXISTS job_outputs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    dealership_id UUID NOT NULL REFERENCES dealerships(id) ON DELETE CASCADE,
    file_path VARCHAR(500) NOT NULL
);


-- Seed: default admin user
-- Password: admin123
INSERT INTO users (id, email, hashed_password) VALUES
  ('00000000-0000-0000-0000-000000000001',
   'admin@dealership.com',
   '$2b$12$/xBKO4homNwsPWckO10tDeALTYCnJRE0wq.YDF/Z2dyYqzw8wC9Ie')
ON CONFLICT (email) DO NOTHING;

-- Seed: brand accounts
INSERT INTO accounts (id, name, owner_id) VALUES
  ('10000000-0000-0000-0000-000000000001', 'Tata',       '00000000-0000-0000-0000-000000000001'),
  ('10000000-0000-0000-0000-000000000002', 'Kia',        '00000000-0000-0000-0000-000000000001'),
  ('10000000-0000-0000-0000-000000000003', 'Volkswagen', '00000000-0000-0000-0000-000000000001')
ON CONFLICT DO NOTHING;

-- Seed: dealerships
INSERT INTO dealerships (id, name, brand, account_id) VALUES
  ('20000000-0000-0000-0000-000000000001', 'Bellad Tata',  'Tata',        '10000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000002', 'VW-Autobhan',  'Volkswagen',  '10000000-0000-0000-0000-000000000003'),
  ('20000000-0000-0000-0000-000000000003', 'VW-Hubli',     'Volkswagen',  '10000000-0000-0000-0000-000000000003'),
  ('20000000-0000-0000-0000-000000000004', 'Kia Downtown', 'Kia',         '10000000-0000-0000-0000-000000000002')
ON CONFLICT DO NOTHING;
