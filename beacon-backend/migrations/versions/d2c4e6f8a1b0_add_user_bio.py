"""Add bio to users

Revision ID: d2c4e6f8a1b0
Revises: 7f8391c6374a
Create Date: 2026-04-07 09:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'd2c4e6f8a1b0'
down_revision = '7f8391c6374a'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('users', sa.Column('bio', sa.String(length=280), nullable=True))
    op.add_column('users', sa.Column('bio_visibility', sa.String(length=20), nullable=False, server_default='public'))
    op.add_column('users', sa.Column('bio_moderation_status', sa.String(length=20), nullable=False, server_default='approved'))


def downgrade():
    op.drop_column('users', 'bio_moderation_status')
    op.drop_column('users', 'bio_visibility')
    op.drop_column('users', 'bio')
