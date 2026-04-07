"""Add streak break fields

Revision ID: 1b2c3d4e5f6g
Revises: c9a3a8f9c1b2
Create Date: 2026-03-28 12:30:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '1b2c3d4e5f6g'
down_revision = 'c9a3a8f9c1b2'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('streaks', sa.Column('previous_streak', sa.Integer(), nullable=True))
    op.add_column('streaks', sa.Column('streak_broken_date', sa.Date(), nullable=True))


def downgrade():
    op.drop_column('streaks', 'streak_broken_date')
    op.drop_column('streaks', 'previous_streak')
