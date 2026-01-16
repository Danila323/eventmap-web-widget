"""
Модель связи многие-ко-многим между событиями и виджетами."""
from sqlalchemy import Column, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid

from app.db.base import Base


class EventWidget(Base):
    """Промежуточная таблица для связи событий и виджетов."""

    __tablename__ = "event_widgets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    event_id = Column(UUID(as_uuid=True), ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    widget_id = Column(UUID(as_uuid=True), ForeignKey("widget_configs.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<EventWidget event={self.event_id} widget={self.widget_id}>"
