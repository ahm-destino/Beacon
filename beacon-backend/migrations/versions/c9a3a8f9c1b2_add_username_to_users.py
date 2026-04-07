"""Add username to users

Revision ID: c9a3a8f9c1b2
Revises: b5317470ed73
Create Date: 2026-03-28 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'c9a3a8f9c1b2'
down_revision = 'b5317470ed73'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('users', sa.Column('username', sa.String(length=50), nullable=True))
    op.create_unique_constraint('uq_users_username', 'users', ['username'])


def downgrade():
    op.drop_constraint('uq_users_username', 'users', type_='unique')
    op.drop_column('users', 'username')
