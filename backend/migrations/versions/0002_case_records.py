"""Add user-owned research cases.

Revision ID: 0002_case_records
Revises: 0001_initial
"""
from alembic import op
import sqlalchemy as sa

revision = "0002_case_records"
down_revision = "0001_initial"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "case_record",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("case_id", sa.String(length=20), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("region", sa.String(length=120), nullable=False),
        sa.Column("module", sa.String(length=40), nullable=False),
        sa.Column("status", sa.String(length=24), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["user.id"]),
        sa.UniqueConstraint("case_id"),
    )
    op.create_index("ix_case_record_case_id", "case_record", ["case_id"])
    op.create_index("ix_case_record_user_id", "case_record", ["user_id"])


def downgrade():
    op.drop_index("ix_case_record_user_id", table_name="case_record")
    op.drop_index("ix_case_record_case_id", table_name="case_record")
    op.drop_table("case_record")
