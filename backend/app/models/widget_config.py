"""
Модель конфигурации виджета.
"""
from datetime import datetime
from sqlalchemy import Column, String, Boolean, Integer, Float, DateTime, ForeignKey, Text, ARRAY
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid

from app.db.base import Base


class WidgetConfig(Base):
    """Модель конфигурации виджета."""

    __tablename__ = "widget_configs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    api_key_id = Column(UUID(as_uuid=True), ForeignKey("api_keys.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    width = Column(String(50), default="100%", nullable=False)
    height = Column(String(50), default="400px", nullable=False)
    primary_color = Column(String(7), default="#007bff", nullable=False)
    marker_color = Column(String(7), default="#ff0000", nullable=False)
    default_period = Column(String(20), default="all", nullable=False)  # today, tomorrow, week, all
    show_search = Column(Boolean, default=True, nullable=False)
    show_filters = Column(Boolean, default=True, nullable=False)
    show_categories = Column(Boolean, default=True, nullable=False)
    auto_refresh = Column(Boolean, default=False, nullable=False)
    zoom_level = Column(Integer, default=10, nullable=False)
    center_lat = Column(Float, nullable=True)
    center_lon = Column(Float, nullable=True)
    allowed_domains = Column(ARRAY(String), nullable=True)  # Белый список доменов
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Отношения
    user = relationship("User", back_populates="widget_configs")
    api_key = relationship("ApiKey", back_populates="widget_configs")
    events = relationship("Event", secondary="event_widgets", back_populates="widgets")

    def __repr__(self):
        return f"<WidgetConfig {self.title}>"
