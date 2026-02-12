from sqlalchemy import Column, Integer, String, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from database import Base

class Category(Base):
    __tablename__ = "categories"
    id = Column(Integer, primary_key=True, index=True)
    # Было String, стало String(100) — это решит ошибку
    name = Column(String(100), unique=True, index=True)

class Room(Base):
    __tablename__ = "rooms"
    id = Column(Integer, primary_key=True, index=True)
    # Ограничиваем длину названия комнаты
    name = Column(String(100), unique=True, index=True)
    
    devices = relationship("Device", back_populates="room")

class Employee(Base):
    __tablename__ = "employees"
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(150), index=True)
    position = Column(String(100))
    
    devices = relationship("Device", back_populates="employee")

class Device(Base):
    __tablename__ = "devices"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200))
    type = Column(String(100))
    price = Column(String(50), default="0")
    status = Column(String(50), default="working")
    
    # ВАЖНО: Инвентарный номер должен быть уникальным, ограничиваем длину
    inventory_number = Column(String(100), unique=True, index=True)
    
    details = Column(String(500), default="")
    
    room_id = Column(Integer, ForeignKey("rooms.id"))
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=True)
    
    room = relationship("Room", back_populates="devices")
    employee = relationship("Employee", back_populates="devices")