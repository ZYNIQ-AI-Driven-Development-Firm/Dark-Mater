-- pgvector setup and chat tables
-- Migration: 20251005_pgvector.sql
-- Purpose: Enable pgvector extension and create chat/memory tables

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create company_chat_threads table
CREATE TABLE IF NOT EXISTS company_chat_threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create company_chat_messages table
CREATE TABLE IF NOT EXISTS company_chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID NOT NULL REFERENCES company_chat_threads(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    model_used VARCHAR(100),
    token_count INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create company_memory_chunks table for RAG
CREATE TABLE IF NOT EXISTS company_memory_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    source VARCHAR(500) NOT NULL,
    source_type VARCHAR(50) NOT NULL DEFAULT 'document',
    text TEXT NOT NULL,
    embedding vector(768), -- 768-dimensional embeddings
    chunk_index INTEGER NOT NULL DEFAULT 0,
    metadata TEXT, -- JSON metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_messages_thread_created ON company_chat_messages(thread_id, created_at);
CREATE INDEX IF NOT EXISTS idx_chunks_source ON company_memory_chunks(source);
CREATE INDEX IF NOT EXISTS idx_chunks_source_type ON company_memory_chunks(source_type);

-- Create vector similarity index for fast cosine similarity search
CREATE INDEX IF NOT EXISTS idx_chunks_embedding_hnsw ON company_memory_chunks 
USING hnsw (embedding vector_cosine_ops);

-- Create IVFFlat index as alternative (better for exact search)
-- CREATE INDEX IF NOT EXISTS idx_chunks_embedding_ivfflat ON company_memory_chunks 
-- USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for auto-updating updated_at
CREATE TRIGGER update_company_chat_threads_updated_at BEFORE UPDATE ON company_chat_threads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_memory_chunks_updated_at BEFORE UPDATE ON company_memory_chunks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();