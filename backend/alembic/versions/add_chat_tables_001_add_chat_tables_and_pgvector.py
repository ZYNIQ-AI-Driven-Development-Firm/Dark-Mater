"""add_chat_tables_and_pgvector

Revision ID: add_chat_tables_001
Revises: 013fcae77be0
Create Date: 2025-10-05 13:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from uuid import uuid4
import pgvector.sqlalchemy

# revision identifiers, used by Alembic.
revision = 'add_chat_tables_001'
down_revision = '013fcae77be0'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Enable pgvector extension
    op.execute('CREATE EXTENSION IF NOT EXISTS vector')
    
    # Create company_chat_threads table
    op.create_table('company_chat_threads',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False, default=uuid4),
        sa.Column('title', sa.String(length=200), nullable=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create company_chat_messages table
    op.create_table('company_chat_messages',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False, default=uuid4),
        sa.Column('thread_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('role', sa.String(length=20), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('model_used', sa.String(length=100), nullable=True),
        sa.Column('token_count', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['thread_id'], ['company_chat_threads.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create company_memory_chunks table  
    op.create_table('company_memory_chunks',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False, default=uuid4),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('source', sa.String(length=500), nullable=False),
        sa.Column('source_type', sa.String(length=50), nullable=False, server_default='document'),
        sa.Column('text', sa.Text(), nullable=False),
        sa.Column('embedding', pgvector.sqlalchemy.Vector(768), nullable=True),
        sa.Column('chunk_index', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('meta_data', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes
    op.create_index('idx_messages_thread_created', 'company_chat_messages', ['thread_id', 'created_at'])
    op.create_index('idx_chunks_source', 'company_memory_chunks', ['source'])
    op.create_index('idx_chunks_source_type', 'company_memory_chunks', ['source_type'])
    
    # Create vector similarity index (HNSW for fast approximate search)
    op.execute('CREATE INDEX idx_chunks_embedding_hnsw ON company_memory_chunks USING hnsw (embedding vector_cosine_ops)')


def downgrade() -> None:
    # Drop indexes first
    op.execute('DROP INDEX IF EXISTS idx_chunks_embedding_hnsw')
    op.drop_index('idx_chunks_source_type', table_name='company_memory_chunks')
    op.drop_index('idx_chunks_source', table_name='company_memory_chunks')
    op.drop_index('idx_messages_thread_created', table_name='company_chat_messages')
    
    # Drop tables
    op.drop_table('company_memory_chunks')
    op.drop_table('company_chat_messages')
    op.drop_table('company_chat_threads')