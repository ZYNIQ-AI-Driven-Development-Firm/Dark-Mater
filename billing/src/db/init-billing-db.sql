-- Initialize billing database
CREATE DATABASE darkmatter_billing;

-- Switch to billing database and run schema
\c darkmatter_billing;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Import the main schema
\i /docker-entrypoint-initdb.d/02-billing-schema.sql