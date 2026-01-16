"""
Модель события.
"""
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Float, ForeignKey, Text, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid

from app.db.base import Base


class Event(Base):
    """Модель события."""

    __tablename__ = "events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    event_datetime = Column(DateTime, nullable=False, index=True)
    longitude = Column(Float, nullable=False)
    latitude = Column(Float, nullable=False)
    category = Column(String(100), nullable=True, index=True)
    venue_name = Column(String(255), nullable=True)
    venue_address = Column(String(500), nullable=True)
    image_url = Column(String(1000), nullable=True)
    ticket_url = Column(String(1000), nullable=True)
    is_published = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Отношения
    user = relationship("User", back_populates="events")
    widgets = relationship("WidgetConfig", secondary="event_widgets", back_populates="events")

    # Индексы для оптимизации запросов
    __table_args__ = (
        Index('ix_events_user_event_datetime', 'user_id', 'event_datetime'),
    )

    def __repr__(self):
        return f"<Event {self.title}>"
