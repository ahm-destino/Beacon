"""Add tutors and tutor reviews

Revision ID: e1f2g3h4i5j6
Revises: d4e5f6g7h8i9
Create Date: 2026-03-29 18:05:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'e1f2g3h4i5j6'
down_revision = 'd4e5f6g7h8i9'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'tutors',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('full_name', sa.String(length=100), nullable=False),
        sa.Column('profile_photo', sa.String(length=500), nullable=True),
        sa.Column('subjects', postgresql.ARRAY(sa.String()), nullable=True),
        sa.Column('bio', sa.Text(), nullable=True),
        sa.Column('location', sa.String(length=100), nullable=True),
        sa.Column('state', sa.String(length=50), nullable=True),
        sa.Column('mode', postgresql.ARRAY(sa.String()), nullable=True),
        sa.Column('hourly_rate', sa.Integer(), nullable=True),
        sa.Column('whatsapp', sa.String(length=20), nullable=True),
        sa.Column('phone', sa.String(length=20), nullable=True),
        sa.Column('verification_level', sa.String(length=20), nullable=True, server_default=sa.text("'basic'")),
        sa.Column('is_approved', sa.Boolean(), nullable=True, server_default=sa.text('false')),
        sa.Column('average_rating', sa.Float(), nullable=True, server_default=sa.text('0')),
        sa.Column('total_reviews', sa.Integer(), nullable=True, server_default=sa.text('0')),
        sa.Column('is_active', sa.Boolean(), nullable=True, server_default=sa.text('true')),
        sa.Column('created_at', sa.DateTime(), nullable=True),
    )

    op.create_table(
        'tutor_reviews',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('tutor_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('tutors.id'), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('rating', sa.Integer(), nullable=False),
        sa.Column('comment', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
    )


def downgrade():
    op.drop_table('tutor_reviews')
    op.drop_table('tutors')
