"""add_question_option_explanations

Revision ID: f3a9c1d4e5f6
Revises: b26a18d60ad7
Create Date: 2026-04-08 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'f3a9c1d4e5f6'
down_revision = 'b26a18d60ad7'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'question_option_explanations',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('question_id', sa.UUID(), nullable=False),
        sa.Column('selected_option', sa.String(length=1), nullable=False),
        sa.Column('correct_option', sa.String(length=1), nullable=False),
        sa.Column('option_text', sa.Text(), nullable=True),
        sa.Column('explanation_text', sa.Text(), nullable=False),
        sa.Column('options_hash', sa.String(length=64), nullable=False),
        sa.Column('model_name', sa.String(length=100), nullable=True),
        sa.Column('created_by', sa.String(length=20), nullable=True),
        sa.Column('use_count', sa.Integer(), nullable=True),
        sa.Column('last_used_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['question_id'], ['questions.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('question_id', 'selected_option', 'options_hash', name='uq_question_option_explanations'),
    )
    op.create_index(
        'ix_question_option_explanations_question_id',
        'question_option_explanations',
        ['question_id'],
        unique=False,
    )
    op.create_index(
        'ix_question_option_explanations_selected_option',
        'question_option_explanations',
        ['selected_option'],
        unique=False,
    )


def downgrade():
    op.drop_index('ix_question_option_explanations_selected_option', table_name='question_option_explanations')
    op.drop_index('ix_question_option_explanations_question_id', table_name='question_option_explanations')
    op.drop_table('question_option_explanations')
