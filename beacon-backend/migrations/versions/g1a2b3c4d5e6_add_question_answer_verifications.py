"""add question answer verifications

Revision ID: g1a2b3c4d5e6
Revises: f3a9c1d4e5f6
Create Date: 2026-04-09
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = 'g1a2b3c4d5e6'
down_revision = 'f3a9c1d4e5f6'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'question_answer_verifications',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('question_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('options_hash', sa.String(length=64), nullable=False),
        sa.Column('ai_correct_answer', sa.String(length=1), nullable=False),
        sa.Column('confidence', sa.Float(), nullable=True),
        sa.Column('explanation_text', sa.Text(), nullable=True),
        sa.Column('model_name', sa.String(length=100), nullable=True),
        sa.Column('created_by', sa.String(length=20), nullable=True),
        sa.Column('use_count', sa.Integer(), nullable=True),
        sa.Column('last_used_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['question_id'], ['questions.id']),
        sa.UniqueConstraint('question_id', 'options_hash', name='uq_question_answer_verifications'),
    )
    op.create_index(
        'ix_question_answer_verifications_question_id',
        'question_answer_verifications',
        ['question_id']
    )
    op.create_index(
        'ix_question_answer_verifications_options_hash',
        'question_answer_verifications',
        ['options_hash']
    )


def downgrade():
    op.drop_index('ix_question_answer_verifications_options_hash', table_name='question_answer_verifications')
    op.drop_index('ix_question_answer_verifications_question_id', table_name='question_answer_verifications')
    op.drop_table('question_answer_verifications')
