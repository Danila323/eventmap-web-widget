"""change widget_configs allowed_domains to JSON

Revision ID: c6ac6f89783d
Revises: 646a84d3d531
Create Date: 2026-01-16 18:23:47.577805

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c6ac6f89783d'
down_revision: Union[str, None] = '646a84d3d531'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Изменяем тип ARRAY на JSON для совместимости с SQLite в тестах
    op.drop_column('widget_configs', 'allowed_domains')
    op.add_column('widget_configs', sa.Column('allowed_domains', sa.JSON(), nullable=True))


def downgrade() -> None:
    # Возвращаем обратно на ARRAY
    op.drop_column('widget_configs', 'allowed_domains')
    op.add_column('widget_configs', sa.Column('allowed_domains', sa.ARRAY(sa.String()), nullable=True))
