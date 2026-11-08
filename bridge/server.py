from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from PIL import Image
import serial
import serial.tools.list_ports
import io
import time

app = FastAPI(title="Rover Bridge")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

esp = None

class Connection(BaseModel):
    port: str = "COM3"

class Expression(BaseModel):
    expression: str

class Mode(BaseModel):
    mode: str

class Message(BaseModel):
    message: str

def send(command):
    if esp is None or not esp.is_open:
        raise HTTPException(503, "ESP32 desconectado")

    esp.write((command + "\n").encode("utf-8"))
    esp.flush()

@app.get("/status")
def status():
    return {
        "connected": esp is not None and esp.is_open,
        "port": esp.port if esp and esp.is_open else None
    }

@app.get("/ports")
def ports():
    return {
        "ports": [
            {"device": p.device, "description": p.description}
            for p in serial.tools.list_ports.comports()
        ]
    }

@app.post("/connect")
def connect(data: Connection):
    global esp

    try:
        if esp and esp.is_open:
            esp.close()

        esp = serial.Serial(
            data.port,
            115200,
            timeout=2,
            write_timeout=3
        )

        time.sleep(2)
        esp.reset_input_buffer()

        return {"success": True, "port": data.port}

    except Exception as error:
        esp = None
        raise HTTPException(500, str(error))

@app.post("/expression")
def expression(data: Expression):
    allowed = ["happy", "sad", "angry", "sleep", "love", "surprise"]

    if data.expression not in allowed:
        raise HTTPException(400, "Expressão inválida")

    send("EXPR:" + data.expression)
    return {"success": True}

@app.post("/mode")
def mode(data: Mode):
    if data.mode not in ["face", "photos"]:
        raise HTTPException(400, "Modo inválido")

    send("MODE:" + data.mode)
    return {"success": True}

@app.post("/power")
def power():
    send("POWER")
    return {"success": True}

@app.post("/message")
def message(data: Message):
    send("MSG:" + data.message[:100])
    return {"success": True}

@app.post("/photo")
async def photo(file: UploadFile = File(...)):
    if esp is None or not esp.is_open:
        raise HTTPException(503, "ESP32 desconectado")

    try:
        content = await file.read()

        image = Image.open(io.BytesIO(content)).convert("RGB")
        image = image.resize((160, 128))

        pixels = bytearray()

        for y in range(128):
            for x in range(160):
                r, g, b = image.getpixel((x, y))

                value = (
                    ((r >> 3) << 11) |
                    ((g >> 2) << 5) |
                    (b >> 3)
                )

                pixels.append((value >> 8) & 0xFF)
                pixels.append(value & 0xFF)

        esp.write(f"PHOTO:{len(pixels)}\n".encode())
        esp.flush()

        time.sleep(0.1)

        esp.write(pixels)
        esp.flush()

        return {"success": True, "width": 160, "height": 128}

    except Exception as error:
        raise HTTPException(500, str(error))
