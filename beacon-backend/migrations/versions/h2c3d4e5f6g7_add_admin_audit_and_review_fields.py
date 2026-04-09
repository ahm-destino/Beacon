"""add admin audit log and review fields

Revision ID: h2c3d4e5f6g7
Revises: g1a2b3c4d5e6
Create Date: 2026-04-09
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = 'h2c3d4e5f6g7'
down_revision = 'g1a2b3c4d5e6'
branch_labels = None
depends_on = None


def upgrade():
    # question_reports review fields
    op.add_column('question_reports', sa.Column('resolved_by', postgresql.UUID(as_uuid=True), nullable=True))
    op.add_column('question_reports', sa.Column('resolved_at', sa.DateTime(), nullable=True))
    op.add_column('question_reports', sa.Column('resolution_note', sa.Text(), nullable=True))
    op.create_foreign_key(
        'fk_question_reports_resolved_by',
        'question_reports',
        'users',
        ['resolved_by'],
        ['id']
    )

    # question_answer_verifications review fields
    op.add_column('question_answer_verifications', sa.Column('review_status', sa.String(length=20), nullable=True))
    op.add_column('question_answer_verifications', sa.Column('reviewed_by', postgresql.UUID(as_uuid=True), nullable=True))
    op.add_column('question_answer_verifications', sa.Column('reviewed_at', sa.DateTime(), nullable=True))
    op.add_column('question_answer_verifications', sa.Column('review_note', sa.Text(), nullable=True))
    op.create_foreign_key(
        'fk_question_answer_verifications_reviewed_by',
        'question_answer_verifications',
        'users',
        ['reviewed_by'],
        ['id']
    )
    op.execute("UPDATE question_answer_verifications SET review_status = 'pending' WHERE review_status IS NULL")

    # admin audit logs
    op.create_table(
        'admin_audit_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('admin_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('action', sa.String(length=100), nullable=False),
        sa.Column('target_type', sa.String(length=50), nullable=True),
        sa.Column('target_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('event_metadata', sa.JSON(), nullable=True),
        sa.Column('ip_address', sa.String(length=100), nullable=True),
        sa.Column('user_agent', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['admin_id'], ['users.id']),
    )
    op.create_index('ix_admin_audit_logs_admin_id', 'admin_audit_logs', ['admin_id'])
    op.create_index('ix_admin_audit_logs_action', 'admin_audit_logs', ['action'])
    op.create_index('ix_admin_audit_logs_created_at', 'admin_audit_logs', ['created_at'])


def downgrade():
    op.drop_index('ix_admin_audit_logs_created_at', table_name='admin_audit_logs')
    op.drop_index('ix_admin_audit_logs_action', table_name='admin_audit_logs')
    op.drop_index('ix_admin_audit_logs_admin_id', table_name='admin_audit_logs')
    op.drop_table('admin_audit_logs')

    op.drop_constraint('fk_question_answer_verifications_reviewed_by', 'question_answer_verifications', type_='foreignkey')
    op.drop_column('question_answer_verifications', 'review_note')
    op.drop_column('question_answer_verifications', 'reviewed_at')
    op.drop_column('question_answer_verifications', 'reviewed_by')
    op.drop_column('question_answer_verifications', 'review_status')

    op.drop_constraint('fk_question_reports_resolved_by', 'question_reports', type_='foreignkey')
    op.drop_column('question_reports', 'resolution_note')
    op.drop_column('question_reports', 'resolved_at')
    op.drop_column('question_reports', 'resolved_by')
