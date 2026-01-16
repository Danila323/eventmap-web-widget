"""remove_is_active_from_api_keys

Revision ID: d266aa0780a9
Revises: 18ee50a155ea
Create Date: 2026-01-16 06:41:46.690966

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd266aa0780a9'
down_revision: Union[str, None] = '18ee50a155ea'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Удаляем колонку is_active из таблицы api_keys
    op.drop_column('api_keys', 'is_active')


def downgrade() -> None:
    # Возвращаем колонку is_active обратно
    op.add_column('api_keys', sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'))
