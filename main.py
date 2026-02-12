from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Body
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
import models
from database import SessionLocal, engine
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import io
from io import BytesIO
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.units import mm
from reportlab.lib.utils import ImageReader
import qrcode
import traceback
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://10.0.2.183:5173")

# Создаем таблицы
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# --- CORS ---
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    FRONTEND_URL,
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Схемы данных ---
class RoomCreate(BaseModel):
    name: str

class CategoryCreate(BaseModel):
    name: str

class DeviceCreate(BaseModel):
    name: str
    type: str          
    room_id: int
    price: str = ""    
    status: str = "working"
    inventory_number: str = ""
    details: str = ""
    employee_id: Optional[int] = None

class EmployeeCreate(BaseModel):
    full_name: str
    position: str

class QRExportRequest(BaseModel):
    device_ids: List[int]

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- LOGIN ---
class LoginRequest(BaseModel):
    username: str
    password: str

@app.post("/login")
def login(credentials: LoginRequest):
    """Simple login endpoint - hardcoded credentials"""
    print(f"LOGIN ATTEMPT: username='{credentials.username}', password='{credentials.password}'")
    
    # Hardcoded users: user/user123, admin/admin123
    if credentials.username == "user" and credentials.password == "user123":
        return {"success": True, "role": "user"}
    elif credentials.username == "admin" and credentials.password == "admin123":
        return {"success": True, "role": "admin"}
    else:
        print(f"FAILED LOGIN: '{credentials.username}' with password '{credentials.password}'")
        raise HTTPException(status_code=401, detail="Invalid credentials")

# --- API CRUD ---

# CATEGORIES
@app.post("/categories/")
def create_category(cat: CategoryCreate, db: Session = Depends(get_db)):
    existing = db.query(models.Category).filter(models.Category.name == cat.name).first()
    if existing: return existing
    new_cat = models.Category(name=cat.name)
    db.add(new_cat)
    db.commit()
    db.refresh(new_cat)
    return new_cat

@app.get("/categories/")
def get_categories(db: Session = Depends(get_db)):
    return db.query(models.Category).all()

@app.put("/categories/{cat_id}")
def update_category(cat_id: int, cat: CategoryCreate, db: Session = Depends(get_db)):
    c = db.query(models.Category).filter(models.Category.id == cat_id).first()
    if c:
        c.name = cat.name
        db.commit()
        db.refresh(c)
    return c

@app.delete("/categories/{cat_id}")
def delete_category(cat_id: int, db: Session = Depends(get_db)):
    db.query(models.Category).filter(models.Category.id == cat_id).delete()
    db.commit()
    return {"message": "deleted"}

# ROOMS
@app.post("/rooms/")
def create_room(room: RoomCreate, db: Session = Depends(get_db)):
    new_room = models.Room(name=room.name)
    db.add(new_room)
    db.commit()
    db.refresh(new_room)
    return new_room

# !!! ДОБАВЛЕН НЕДОСТАЮЩИЙ МЕТОД !!!
@app.get("/rooms/")
def get_rooms(db: Session = Depends(get_db)):
    return db.query(models.Room).all()

@app.put("/rooms/{room_id}")
def update_room(room_id: int, room: RoomCreate, db: Session = Depends(get_db)):
    r = db.query(models.Room).filter(models.Room.id == room_id).first()
    if r:
        r.name = room.name
        db.commit()
        db.refresh(r)
    return r

@app.delete("/rooms/{room_id}")
def delete_room(room_id: int, db: Session = Depends(get_db)):
    room = db.query(models.Room).filter(models.Room.id == room_id).first()
    if room:
        for d in room.devices: db.delete(d)
        db.delete(room)
        db.commit()
    return {"message": "deleted"}

# EMPLOYEES
@app.post("/employees/")
def create_employee(emp: EmployeeCreate, db: Session = Depends(get_db)):
    new_emp = models.Employee(full_name=emp.full_name, position=emp.position)
    db.add(new_emp)
    db.commit()
    db.refresh(new_emp)
    return new_emp

@app.put("/employees/{emp_id}")
def update_employee(emp_id: int, emp: EmployeeCreate, db: Session = Depends(get_db)):
    e = db.query(models.Employee).filter(models.Employee.id == emp_id).first()
    if e:
        e.full_name = emp.full_name
        e.position = emp.position
        db.commit()
        db.refresh(e)
    return e

@app.delete("/employees/{emp_id}")
def delete_employee(emp_id: int, db: Session = Depends(get_db)):
    db.query(models.Employee).filter(models.Employee.id == emp_id).delete()
    db.commit()
    return {"message": "deleted"}

# DEVICES
@app.post("/devices/")
def create_device(dev: DeviceCreate, db: Session = Depends(get_db)):
    new_dev = models.Device(
        name=dev.name, type=dev.type, room_id=dev.room_id, price=dev.price,
        status=dev.status, inventory_number=dev.inventory_number, details=dev.details, employee_id=dev.employee_id
    )
    db.add(new_dev)
    db.commit()
    db.refresh(new_dev)
    return new_dev

@app.put("/devices/{device_id}")
def update_device(device_id: int, dev: DeviceCreate, db: Session = Depends(get_db)):
    d = db.query(models.Device).filter(models.Device.id == device_id).first()
    if d:
        d.name = dev.name
        d.type = dev.type
        d.room_id = dev.room_id
        d.price = dev.price 
        d.status = dev.status
        d.inventory_number = dev.inventory_number
        d.details = dev.details
        d.employee_id = dev.employee_id
        db.commit()
        db.refresh(d)
    return d

@app.delete("/devices/{device_id}")
def delete_device(device_id: int, db: Session = Depends(get_db)):
    db.query(models.Device).filter(models.Device.id == device_id).delete()
    db.commit()
    return {"message": "deleted"}

# REPORT (ИСПРАВЛЕНО ИМЯ КОМНАТЫ)
@app.get("/report")
def get_full_report(db: Session = Depends(get_db)):
    rooms = db.query(models.Room).all()
    employees = db.query(models.Employee).all()
    categories = db.query(models.Category).all()
    
    rooms_data = []
    for r in rooms:
        d_list = []
        for d in r.devices:
            owner_name = d.employee.full_name if d.employee else None
            d_list.append({
                "id": d.id, "name": d.name, "type": d.type, "price": d.price, 
                "status": d.status, "inventory_number": d.inventory_number, "details": d.details, 
                "room_name": r.name, "employee_id": d.employee_id, "owner_name": owner_name
            })
        
        # !!! ИСПРАВЛЕНИЕ: Добавлено поле 'name', так как frontend ждет именно его в таблице настроек
        rooms_data.append({
            "id": r.id, 
            "name": r.name,       # Для таблицы настроек
            "room_name": r.name,  # Для совместимости
            "devices_count": len(r.devices), 
            "devices": d_list
        })

    employees_data = []
    for e in employees:
        my_devices = [f"{d.name} (#{d.inventory_number})" for d in e.devices]
        employees_data.append({
            "id": e.id, "full_name": e.full_name, "position": e.position,
            "devices_list": my_devices
        })

    return {"rooms": rooms_data, "employees": employees_data, "categories": categories}

# --- EXCEL EXPORT (С ПЕРЕВОДОМ) ---
@app.get("/export_excel")
def export_excel(lang: str = "ru", db: Session = Depends(get_db)):
    devices = db.query(models.Device).all()
    
    headers_map = {
        "ru": {
            "ID": "ID", "Inv": "Инв. номер", "Name": "Название", "Cat": "Категория",
            "Price": "Прайс", "Status": "Статус", "Room": "Комната", "Owner": "Владелец", "Details": "Детали"
        },
        "uz": {
            "ID": "ID", "Inv": "Inv. raqam", "Name": "Nomi", "Cat": "Toifa",
            "Price": "Narxi", "Status": "Holati", "Room": "Xona", "Owner": "Egasining ismi", "Details": "Tafsilotlar"
        }
    }
    
    h = headers_map.get(lang, headers_map["ru"])

    data = []
    for d in devices:
        room_name = d.room.name if d.room else "-"
        owner = d.employee.full_name if d.employee else "-"
        
        status_val = d.status
        if lang == "uz":
            if d.status == "working": status_val = "Ishlayapti"
            elif d.status == "in_stock": status_val = "Omborda"
            elif d.status == "repair": status_val = "Ta'mirda"
            elif d.status == "broken": status_val = "Buzilgan"
            elif d.status == "decommissioned": status_val = "Hisobdan chiqarilgan"
        else:
            if d.status == "working": status_val = "В работе"
            elif d.status == "in_stock": status_val = "На складе"
            elif d.status == "repair": status_val = "В ремонте"
            elif d.status == "broken": status_val = "Сломано"
            elif d.status == "decommissioned": status_val = "Списано"

        data.append({
            h["ID"]: d.id,
            h["Inv"]: d.inventory_number,
            h["Name"]: d.name,
            h["Cat"]: d.type,
            h["Price"]: d.price,
            h["Status"]: status_val,
            h["Room"]: room_name,
            h["Owner"]: owner,
            h["Details"]: d.details
        })
    
    df = pd.DataFrame(data)
    filename = f"inventory_{lang}_{datetime.now().strftime('%Y%m%d_%H%M')}.xlsx"
    df.to_excel(filename, index=False)
    return FileResponse(path=filename, filename=filename, media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')

# --- EXCEL IMPORT ---
@app.post("/import_excel")
async def import_excel(file: UploadFile = File(...), db: Session = Depends(get_db)):
    contents = await file.read()
    df = pd.read_excel(io.BytesIO(contents))
    
    count = 0
    for index, row in df.iterrows():
        r_name = row.get("Комната") or row.get("Xona") or row.get("Room") or ""
        r_name = str(r_name)
        room = db.query(models.Room).filter(models.Room.name == r_name).first()
        room_id = room.id if room else 1 
        
        inv = row.get("Инв. номер") or row.get("Inv. raqam") or row.get("Inv") or ""
        inv = str(inv)
        
        if db.query(models.Device).filter(models.Device.inventory_number == inv).first():
            continue 

        name = row.get("Название") or row.get("Nomi") or "Device"
        cat = row.get("Категория") or row.get("Toifa") or "General"
        price = row.get("Прайс") or row.get("Narxi") or "0"
        st = row.get("Статус") or row.get("Holati") or "in_stock"
        
        if st in ["В работе", "Ishlayapti"]: st = "working"
        elif st in ["На складе", "Omborda"]: st = "in_stock"
        elif st in ["В ремонте", "Ta'mirda"]: st = "repair"
        elif st in ["Сломано", "Buzilgan"]: st = "broken"
        elif st in ["Списано", "Hisobdan chiqarilgan"]: st = "decommissioned"
        
        new_dev = models.Device(
            name=str(name), type=str(cat), price=str(price),
            inventory_number=inv, status=str(st), details="",
            room_id=room_id, employee_id=None 
        )
        db.add(new_dev)
        count += 1
    
    db.commit()
    return {"message": f"Imported {count} items"}

@app.get("/fix_database")
def fix_database(db: Session = Depends(get_db)):
    room = db.query(models.Room).filter(models.Room.id == 1).first()
    if not room:
        room = models.Room(id=1, name="Главный Склад (Восстановлено)")
        db.add(room)
        db.commit()
        print("Создана комната ID=1")
    
    devices = db.query(models.Device).all()
    count = 0
    for d in devices:
        if d.room_id is None or d.room_id == 0:
            d.room_id = 1
            count += 1
    
    db.commit()
    return {"message": f"База восстановлена! Комната ID=1 создана. Перенесено устройств: {count}"}
    
@app.get("/backup_database")
def backup_database():
    import shutil
    from datetime import datetime
    backup_name = f"backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.db"
    shutil.copy2("inventory.db", f"backups/{backup_name}")
    return {"message": f"Backup created: {backup_name}"}

# --- МАССОВАЯ ПЕЧАТЬ QR-КОДОВ (ФИНАЛЬНАЯ ВЕРСИЯ 52x22мм) ---
@app.post("/export_qr_pdf")
async def export_qr_pdf(request: dict = Body(...), db: Session = Depends(get_db)):
    """
    Генерация PDF (Макет 52x22мм)
    """
    try:
        device_ids = request.get("device_ids", [])
        if not device_ids:
            raise HTTPException(status_code=400, detail="No device IDs provided")
        
        devices = db.query(models.Device).filter(models.Device.id.in_(device_ids)).all()
        if not devices:
            raise HTTPException(status_code=404, detail="No devices found")
        
        buffer = BytesIO()
        pdf = canvas.Canvas(buffer, pagesize=A4)
        width, height = A4
        
        cols = 3 
        rows = 11 
        
        label_width = 48 * mm 
        label_height = 22 * mm
        
        margin_left = 10 * mm
        margin_top = 10 * mm
        
        spacing_x = 5 * mm
        spacing_y = 3 * mm
        
        device_count = 0
        
        for device in devices:
            if device_count > 0 and device_count % (cols * rows) == 0:
                pdf.showPage()
            
            page_position = device_count % (cols * rows)
            col = page_position % cols
            row = page_position // cols
            
            x = margin_left + col * (label_width + spacing_x)
            y = height - margin_top - (row + 1) * label_height - row * spacing_y
            
            # 1. РАМКА
            pdf.setLineWidth(0.5)
            pdf.setStrokeColorRGB(0.7, 0.7, 0.7) 
            pdf.setFillColorRGB(1, 1, 1) 
            pdf.roundRect(x, y, label_width, label_height, 2*mm, fill=1, stroke=1)
            
            # 2. QR КОД
            qr_size = 16 * mm 
            qr_padding_left = 2 * mm 
            
            qr = qrcode.QRCode(version=1, box_size=10, border=0)
            qr_url = f"{FRONTEND_URL}/?qr_id={device.id}"
            qr.add_data(qr_url)
            qr.make(fit=True)
            qr_img = qr.make_image(fill_color="black", back_color="white")
            
            qr_buffer = BytesIO()
            qr_img.save(qr_buffer, format='PNG')
            qr_buffer.seek(0)
            
            qr_y_pos = y + (label_height - qr_size) / 2
            pdf.drawImage(ImageReader(qr_buffer), x + qr_padding_left, qr_y_pos, width=qr_size, height=qr_size)
            
            # 3. ЛОГОТИП И НОМЕР
            content_left_x = x + qr_padding_left + qr_size + 2 * mm
            import os
            logo_path = os.path.join(os.path.dirname(__file__), "logo.png")
            logo_w = 22 * mm 
            logo_h = 9 * mm
            logo_y_pos = y + label_height - logo_h - 3 * mm 
            
            try:
                if os.path.exists(logo_path):
                    pdf.drawImage(logo_path, content_left_x, logo_y_pos, width=logo_w, height=logo_h, preserveAspectRatio=True, mask='auto')
                else:
                    pdf.setFont("Helvetica-Bold", 8)
                    pdf.setFillColorRGB(0, 0, 0)
                    pdf.drawString(content_left_x, logo_y_pos + 4*mm, "INNO")
            except Exception:
                pass

            inv_text = device.inventory_number if device.inventory_number else f"{device.id}"
            pdf.setFillColorRGB(0.12, 0.18, 0.38)
            font_size = 13
            if len(str(inv_text)) > 10: font_size = 11 
            pdf.setFont("Helvetica-Bold", font_size)
            text_y_pos = y + 4 * mm 
            pdf.drawString(content_left_x, text_y_pos, str(inv_text))
            
            device_count += 1
        
        pdf.save()
        buffer.seek(0)
        return StreamingResponse(
            buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=qr_labels_{len(devices)}.pdf"}
        )
    except Exception as e:
        print("ERROR:", traceback.format_exc())
        return {"error": str(e)}