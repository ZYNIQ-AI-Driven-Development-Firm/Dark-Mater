"""Add deletion grace period to user model

Revision ID: add_user_deletion_grace_period
Revises: 013fcae77be0
Create Date: 2025-10-06 06:20:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_user_deletion_grace_period'
down_revision = '013fcae77be0'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add deletion_grace_period column to users table."""
    op.add_column('users', sa.Column('deletion_grace_period', sa.DateTime(), nullable=True))


def downgrade() -> None:
    """Remove deletion_grace_period column from users table."""
    op.drop_column('users', 'deletion_grace_period')