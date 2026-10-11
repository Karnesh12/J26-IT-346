"""Add fracture review metadata and findings.

Revision ID: 0003_fracture_review
Revises: 0002_case_records
"""
from alembic import op
import sqlalchemy as sa

revision = "0003_fracture_review"
down_revision = "0002_case_records"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("case_record", sa.Column("side", sa.String(length=12), nullable=False, server_default="Right"))
    op.add_column("case_record", sa.Column("view", sa.String(length=12), nullable=False, server_default="AP"))
    op.add_column("case_record", sa.Column("study_date", sa.Date(), nullable=True))
    op.add_column(
        "case_record",
        sa.Column("validation_status", sa.String(length=32), nullable=False, server_default="Validation passed"),
    )
    op.add_column("case_record", sa.Column("image_url", sa.String(length=255), nullable=True))
    op.create_table(
        "case_finding",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("case_record_id", sa.Integer(), nullable=False),
        sa.Column("bone", sa.String(length=40), nullable=False),
        sa.Column("location", sa.String(length=40), nullable=False),
        sa.Column("pattern", sa.String(length=40), nullable=False),
        sa.Column("confidence", sa.Integer(), nullable=False),
        sa.Column(
            "review_status",
            sa.String(length=40),
            nullable=False,
            server_default="Pending clinician review",
        ),
        sa.Column("notes", sa.String(length=500), nullable=False, server_default=""),
        sa.ForeignKeyConstraint(["case_record_id"], ["case_record.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_case_finding_case_record_id", "case_finding", ["case_record_id"])


def downgrade():
    op.drop_index("ix_case_finding_case_record_id", table_name="case_finding")
    op.drop_table("case_finding")
    op.drop_column("case_record", "image_url")
    op.drop_column("case_record", "validation_status")
    op.drop_column("case_record", "study_date")
    op.drop_column("case_record", "view")
    op.drop_column("case_record", "side")
