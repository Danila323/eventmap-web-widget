"""
Модель API ключа.
"""
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, ARRAY
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid

from app.db.base import Base


class ApiKey(Base):
    """Модель API ключа для виджета."""

    __tablename__ = "api_keys"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    key = Column(String(255), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False, default="API Key")  # Имя для удобства
    allowed_domains = Column(ARRAY(String), nullable=True)  # Белый список доменов
    usage_count = Column(Integer, default=0, nullable=False)  # Количество использований
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    last_used_at = Column(DateTime, nullable=True)

    # Отношения
    user = relationship("User", back_populates="api_keys")
    widget_configs = relationship("WidgetConfig", back_populates="api_key", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<ApiKey {self.key}>"
