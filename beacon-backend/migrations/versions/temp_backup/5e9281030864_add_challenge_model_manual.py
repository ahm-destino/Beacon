"""add challenge model manual

Revision ID: 5e9281030864
Revises: 
Create Date: 2026-03-20 23:34:43.332122

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = '5e9281030864'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'challenges',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('challenger_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('opponent_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('subject', sa.String(length=50), nullable=False),
        sa.Column('exam_type', sa.String(length=20), nullable=True),
        sa.Column('question_count', sa.Integer(), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=True),
        sa.Column('question_ids', postgresql.ARRAY(postgresql.UUID(as_uuid=True)), nullable=True),
        sa.Column('challenger_answers', sa.JSON(), nullable=True),
        sa.Column('opponent_answers', sa.JSON(), nullable=True),
        sa.Column('challenger_score', sa.Float(), nullable=True),
        sa.Column('opponent_score', sa.Float(), nullable=True),
        sa.Column('challenger_completed_at', sa.DateTime(), nullable=True),
        sa.Column('opponent_completed_at', sa.DateTime(), nullable=True),
        sa.Column('winner_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['challenger_id'], ['users.id']),
        sa.ForeignKeyConstraint(['opponent_id'], ['users.id']),
        sa.ForeignKeyConstraint(['winner_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )


def downgrade():
    op.drop_table('challenges')
