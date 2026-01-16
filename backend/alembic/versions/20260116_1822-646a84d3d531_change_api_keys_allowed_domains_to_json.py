"""change api_keys allowed_domains to JSON

Revision ID: 646a84d3d531
Revises: d266aa0780a9
Create Date: 2026-01-16 18:22:11.758579

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '646a84d3d531'
down_revision: Union[str, None] = 'd266aa0780a9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Изменяем тип ARRAY на JSON для совместимости с SQLite в тестах
    # Сначала сохраняем данные
    op.execute("CREATE TEMPORARY TABLE api_keys_backup AS SELECT id, allowed_domains FROM api_keys")
    # Удаляем колонку
    op.drop_column('api_keys', 'allowed_domains')
    # Создаём новую колонку с типом JSON
    op.add_column('api_keys', sa.Column('allowed_domains', sa.JSON(), nullable=True))


def downgrade() -> None:
    # Возвращаем обратно на ARRAY
    op.drop_column('api_keys', 'allowed_domains')
    op.add_column('api_keys', sa.Column('allowed_domains', sa.ARRAY(sa.String()), nullable=True))
