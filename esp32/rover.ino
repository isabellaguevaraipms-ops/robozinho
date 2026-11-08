#include <SPI.h>
#include <Adafruit_GFX.h>
#include <Adafruit_ST7735.h>

#define TFT_CS   5
#define TFT_DC   2
#define TFT_RST  4
#define TFT_SCLK 18
#define TFT_MOSI 23

Adafruit_ST7735 tela = Adafruit_ST7735(TFT_CS, TFT_DC, TFT_RST);

String expression = "happy";
String mode = "face";
bool powered = true;

void drawFace() {
  tela.fillScreen(ST77XX_BLACK);

  tela.fillRoundRect(5, 5, 150, 118, 18, 0x212F);

  uint16_t eyeColor = ST77XX_CYAN;

  if (expression == "angry") eyeColor = ST77XX_RED;
  if (expression == "love") eyeColor = ST77XX_MAGENTA;

  if (expression == "sleep") {
    tela.drawLine(35, 52, 65, 52, eyeColor);
    tela.drawLine(95, 52, 125, 52, eyeColor);
  } else {
    tela.fillRoundRect(30, 35, 28, 35, 12, eyeColor);
    tela.fillRoundRect(102, 35, 28, 35, 12, eyeColor);
  }

  if (expression == "sad") {
    tela.drawLine(55, 95, 80, 105, ST77XX_WHITE);
    tela.drawLine(80, 105, 105, 95, ST77XX_WHITE);
  } 
  else if (expression == "surprise") {
    tela.drawCircle(80, 96, 9, ST77XX_WHITE);
  }
  else if (expression == "sleep") {
    tela.drawRoundRect(72, 90, 16, 8, 4, ST77XX_WHITE);
  }
  else if (expression == "angry") {
    tela.drawLine(65, 98, 95, 98, ST77XX_WHITE);
  }
  else {
    tela.drawLine(65, 95, 80, 103, ST77XX_WHITE);
    tela.drawLine(80, 103, 95, 95, ST77XX_WHITE);
  }

  if (expression == "love") {
    tela.setTextColor(ST77XX_MAGENTA);
    tela.setTextSize(1);
    tela.setCursor(73, 112);
    tela.print("<3");
  }
}

void showMessage(String msg) {
  tela.fillScreen(ST77XX_BLACK);
  tela.setTextColor(ST77XX_WHITE);
  tela.setTextSize(1);
  tela.setCursor(5, 10);
  tela.println("ROVER:");
  tela.setCursor(5, 35);
  tela.setTextWrap(true);
  tela.println(msg);
}

void receivePhoto(int length) {
  if (length != 40960) return;

  tela.fillScreen(ST77XX_BLACK);

  for (int y = 0; y < 128; y++) {
    for (int x = 0; x < 160; x++) {

      unsigned long start = millis();

      while (Serial.available() < 2) {
        if (millis() - start > 10000) return;
      }

      uint8_t highByte = Serial.read();
      uint8_t lowByte = Serial.read();

      uint16_t color = (highByte << 8) | lowByte;

      tela.drawPixel(x, y, color);
    }
  }
}

void setup() {
  Serial.begin(115200);

  SPI.begin(TFT_SCLK, -1, TFT_MOSI, TFT_CS);

  tela.initR(INITR_BLACKTAB);
  tela.setRotation(1);
  tela.fillScreen(ST77XX_BLACK);

  drawFace();
}

void loop() {
  if (!Serial.available()) return;

  String command = Serial.readStringUntil('\n');
  command.trim();

  if (command.startsWith("EXPR:")) {
    expression = command.substring(5);
    mode = "face";
    powered = true;
    drawFace();
  }

  else if (command.startsWith("MODE:")) {
    mode = command.substring(5);

    if (mode == "face") {
      powered = true;
      drawFace();
    }
  }

  else if (command == "POWER") {
    powered = !powered;

    if (powered) {
      drawFace();
    } else {
      tela.fillScreen(ST77XX_BLACK);
    }
  }

  else if (command.startsWith("MSG:")) {
    powered = true;
    showMessage(command.substring(4));
  }

  else if (command.startsWith("PHOTO:")) {
    int length = command.substring(6).toInt();
    powered = true;
    mode = "photos";
    receivePhoto(length);
  }
}
