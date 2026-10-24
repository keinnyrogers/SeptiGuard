/*
 * SeptiGuard ESP32 Device
 *
 * Hardware:
 * - ESP32
 * - JSN-SR04T ultrasonic sensor
 * - 128x64 SH1106 I2C OLED
 *
 * Device:
 * - One ESP32 monitors one tank
 * - Device ID: generated automatically as TNK-XXXXXXXX from the ESP32's factory chip ID
 *
 * MQTT:
 * - broker.hivemq.com:1883
 * - Public, unencrypted broker is for demo use only.
 *
 * IMPORTANT:
 * - Use a voltage divider from JSN-SR04T ECHO to ESP32 GPIO35.
 * - Do not connect a possible 5V ECHO signal directly to the ESP32.
 */

#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SH110X.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <ctype.h>
#include <math.h>
#include <stdlib.h>
#include <string.h>

// --------------------------------------------------
// Wi-Fi configuration
// --------------------------------------------------

const char* WIFI_SSID = "Redmi Turbo 3";
const char* WIFI_PASSWORD = "supanigga";

// --------------------------------------------------
// MQTT configuration
// --------------------------------------------------

const char* MQTT_HOST = "broker.hivemq.com";
const int MQTT_PORT = 1883;

const char* TOPIC_PREFIX = "septiguard-test-aggin";
String DEVICE_ID;
const char* FIRMWARE_VERSION = "1.0.0";

// --------------------------------------------------
// Tank configuration
// --------------------------------------------------

// Updated from the retained MQTT config after the resident pairs the device.
float tankHeightCm = 400.0;
const bool SIMULATION_MODE = true;

// Change this number to simulate a different tank level.
float SIMULATED_DISTANCE_CM = 100.0;
bool publishReadingNow = false;

// SeptiGuard thresholds
const float WARNING_THRESHOLD = 70.0;
const float CRITICAL_THRESHOLD = 80.0;

// Publish one reading every five seconds.
const unsigned long PUBLISH_INTERVAL_MS = 5000;

// --------------------------------------------------
// JSN-SR04T pins
// --------------------------------------------------

const int TRIG_PIN = 32;
const int ECHO_PIN = 35;

// JSN-SR04T usually has a larger blind zone than HC-SR04.
const float MIN_VALID_DISTANCE_CM = 25.0;
const float MAX_VALID_DISTANCE_CM = 600.0;

// --------------------------------------------------
// SH1106 OLED configuration
// --------------------------------------------------

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1
#define SCREEN_ADDRESS 0x3C

// ESP32 default I2C pins
const int OLED_SDA_PIN = 21;
const int OLED_SCL_PIN = 22;

Adafruit_SH1106G display(
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
  &Wire,
  OLED_RESET
);

// --------------------------------------------------
// Network clients
// --------------------------------------------------

WiFiClient wifiClient;
PubSubClient mqttClient(wifiClient);

String mqttTopic;
String mqttConfigTopic;

unsigned long lastPublishTime = 0;
unsigned long lastWiFiAttempt = 0;
unsigned long lastMqttAttempt = 0;
unsigned long wifiConnectStartedAt = 0;
bool wifiConnectInProgress = false;
bool wifiWasConnected = false;

const unsigned long WIFI_RETRY_INTERVAL_MS = 5000;
const unsigned long WIFI_CONNECT_TIMEOUT_MS = 20000;

void processSerialCommand(char* command) {
  if (strcmp(command, "help") == 0 || strcmp(command, "HELP") == 0) {
    Serial.println("Simulation distance command: D=<distance_cm> (example: D=120)");
    Serial.println("Allowed distance: 0 to 1000 cm. The updated reading publishes immediately.");
    return;
  }

  if ((command[0] != 'D' && command[0] != 'd') || command[1] != '=') {
    if (command[0] != '\0') {
      Serial.println("Unknown command. Enter D=<distance_cm> or help.");
    }
    return;
  }

  if (!SIMULATION_MODE) {
    Serial.println("Distance commands are only available when SIMULATION_MODE is enabled.");
    return;
  }

  char* valueStart = command + 2;
  char* valueEnd = nullptr;
  const float distanceCM = strtof(valueStart, &valueEnd);

  while (valueEnd != nullptr && isspace(static_cast<unsigned char>(*valueEnd))) {
    valueEnd++;
  }

  if (
    valueEnd == valueStart ||
    valueEnd == nullptr ||
    *valueEnd != '\0' ||
    !isfinite(distanceCM) ||
    distanceCM < 0.0 ||
    distanceCM > 1000.0
  ) {
    Serial.println("Invalid distance. Enter a number from 0 to 1000 cm, for example D=120.");
    return;
  }

  SIMULATED_DISTANCE_CM = distanceCM;
  publishReadingNow = true;
  Serial.print("Simulated distance set to ");
  Serial.print(SIMULATED_DISTANCE_CM, 1);
  Serial.println(" cm. Publishing updated reading.");
}

void readSerialCommands() {
  static char command[32];
  static size_t commandLength = 0;
  static unsigned long lastCharacterAt = 0;

  while (Serial.available() > 0) {
    const char character = static_cast<char>(Serial.read());

    if (character == '\r') {
      command[commandLength] = '\0';
      processSerialCommand(command);
      commandLength = 0;
      command[0] = '\0';
      lastCharacterAt = millis();
      continue;
    }

    if (character == '\n') {
      command[commandLength] = '\0';
      processSerialCommand(command);
      commandLength = 0;
      command[0] = '\0';
      lastCharacterAt = millis();
    } else {
      if (commandLength < sizeof(command) - 1) {
        command[commandLength++] = character;
        lastCharacterAt = millis();
      } else {
        commandLength = 0;
        lastCharacterAt = 0;
        Serial.println("Command too long. Enter D=<distance_cm>, for example D=120.");
      }
    }
  }

  if (commandLength > 0 && millis() - lastCharacterAt >= 100) {
    command[commandLength] = '\0';
    processSerialCommand(command);
    commandLength = 0;
    command[0] = '\0';
    lastCharacterAt = 0;
  }
}

// --------------------------------------------------
// OLED helpers
// --------------------------------------------------

void showDisplay(const String& lineOne, const String& lineTwo) {
  display.clearDisplay();
  display.setTextColor(SH110X_WHITE);
  display.setTextSize(1);

  display.setCursor(0, 0);
  display.println(lineOne.substring(0, 21));

  display.setCursor(0, 18);
  display.println(lineTwo.substring(0, 21));

  display.display();
}

void initializeDeviceId() {
  const uint64_t chipId = ESP.getEfuseMac();
  char formattedId[20];
  snprintf(
    formattedId,
    sizeof(formattedId),
    "TNK-%08X",
    static_cast<uint32_t>(chipId)
  );
  DEVICE_ID = formattedId;
}

void showReading(float distanceCM, float fillPercentage, const char* status) {
  display.clearDisplay();
  display.setTextColor(SH110X_WHITE);

  display.setTextSize(1);
  display.setCursor(0, 0);
  display.print("Device: ");
  display.println(DEVICE_ID);

  display.drawLine(0, 11, 128, 11, SH110X_WHITE);

  display.setTextSize(2);
  display.setCursor(0, 18);
  display.print(fillPercentage, 1);
  display.println("%");

  display.setTextSize(1);
  display.setCursor(0, 43);
  display.print("Dist: ");
  display.print(distanceCM, 1);
  display.println(" cm");

  display.setCursor(0, 55);
  display.print("Status: ");
  display.println(status);

  display.display();
}

// --------------------------------------------------
// Sensor reading
// --------------------------------------------------

float readRawDistanceCM() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);

  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);

  digitalWrite(TRIG_PIN, LOW);

  // JSN-SR04T can need a longer timeout than HC-SR04.
  unsigned long duration = pulseIn(ECHO_PIN, HIGH, 40000);

  if (duration == 0) {
    return -1.0;
  }

  return (duration * 0.0343) / 2.0;
}

float readFilteredDistanceCM() {
  const int sampleCount = 5;

  float total = 0.0;
  int validSamples = 0;

  for (int i = 0; i < sampleCount; i++) {
    float distance = readRawDistanceCM();

    if (
      distance >= MIN_VALID_DISTANCE_CM &&
      distance <= MAX_VALID_DISTANCE_CM
    ) {
      total += distance;
      validSamples++;
    }

    delay(60);
  }

  if (validSamples == 0) {
    return -1.0;
  }

  return total / validSamples;
}

float calculateFillPercentage(float distanceCM) {
  float fillPercentage =
    ((tankHeightCm - distanceCM) / tankHeightCm) * 100.0;

  if (fillPercentage < 0.0) {
    fillPercentage = 0.0;
  }

  if (fillPercentage > 100.0) {
    fillPercentage = 100.0;
  }

  return fillPercentage;
}

void handleMqttMessage(char* topic, byte* payload, unsigned int length) {
  if (String(topic) != mqttConfigTopic) {
    return;
  }

  StaticJsonDocument<256> document;
  if (deserializeJson(document, payload, length)) {
    Serial.println("Ignoring invalid MQTT configuration.");
    return;
  }

  const char* configuredDeviceId = document["device_id"] | "";
  const JsonVariant heightValue = document["tank_height_cm"];
  if (
    DEVICE_ID != configuredDeviceId ||
    (!heightValue.is<int>() && !heightValue.is<float>())
  ) {
    Serial.println("Ignoring MQTT configuration for another device or invalid height.");
    return;
  }

  const float configuredHeight = heightValue.as<float>();
  if (configuredHeight < 25.0 || configuredHeight > 1000.0) {
    Serial.println("Ignoring MQTT tank height outside the allowed range.");
    return;
  }

  tankHeightCm = configuredHeight;
  Serial.print("Tank height updated from pairing: ");
  Serial.print(tankHeightCm, 1);
  Serial.println(" cm");
}

const char* calculateStatus(float fillPercentage) {
  if (fillPercentage >= CRITICAL_THRESHOLD) {
    return "critical";
  }

  if (fillPercentage >= WARNING_THRESHOLD) {
    return "warning";
  }

  return "normal";
}

// --------------------------------------------------
// Wi-Fi connection
// --------------------------------------------------

void connectWiFi() {
  const unsigned long now = millis();
  const bool isConnected = WiFi.status() == WL_CONNECTED;

  if (isConnected) {
    if (!wifiWasConnected) {
      Serial.println("Wi-Fi connected.");
      Serial.print("IP address: ");
      Serial.println(WiFi.localIP());
      showDisplay("Wi-Fi connected", DEVICE_ID);
    }

    wifiWasConnected = true;
    wifiConnectInProgress = false;
    return;
  }

  if (wifiWasConnected) {
    Serial.println("Wi-Fi connection lost.");
    showDisplay("Wi-Fi disconnected", "Retrying...");
    wifiWasConnected = false;
  }

  if (wifiConnectInProgress) {
    if (now - wifiConnectStartedAt < WIFI_CONNECT_TIMEOUT_MS) {
      return;
    }

    Serial.println("Wi-Fi connection timed out. Resetting attempt.");
    WiFi.disconnect(false, false);
    wifiConnectInProgress = false;
    lastWiFiAttempt = now;
    showDisplay("Wi-Fi unavailable", "Retrying...");
    return;
  }

  if (now - lastWiFiAttempt < WIFI_RETRY_INTERVAL_MS) {
    return;
  }

  lastWiFiAttempt = now;

  Serial.println("Connecting to Wi-Fi...");
  showDisplay("Connecting Wi-Fi", "...");

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  wifiConnectInProgress = true;
  wifiConnectStartedAt = now;
}

// --------------------------------------------------
// MQTT connection
// --------------------------------------------------

void connectMQTT() {
  if (WiFi.status() != WL_CONNECTED) {
    return;
  }

  if (mqttClient.connected()) {
    return;
  }

  if (millis() - lastMqttAttempt < 5000) {
    return;
  }

  lastMqttAttempt = millis();

  Serial.print("Connecting to MQTT...");
  showDisplay("Connecting MQTT", "...");

  String clientId =
    "septiguard-" +
    String(DEVICE_ID) +
    "-" +
    String((uint32_t)ESP.getEfuseMac(), HEX);

  if (mqttClient.connect(clientId.c_str())) {
    Serial.println(" connected.");

    if (!mqttClient.subscribe(mqttConfigTopic.c_str(), 1)) {
      Serial.println("Failed to subscribe to device configuration.");
    }

    showDisplay("MQTT connected", DEVICE_ID);
    delay(1000);
  } else {
    Serial.print(" failed. MQTT state: ");
    Serial.println(mqttClient.state());

    showDisplay("MQTT failed", "Retrying...");
    delay(1000);
  }
}

// --------------------------------------------------
// MQTT publishing
// --------------------------------------------------

void publishReading(
  float distanceCM,
  float fillPercentage,
  const char* status
) {
  if (!mqttClient.connected()) {
    Serial.println("MQTT is disconnected. Reading not published.");
    return;
  }

  StaticJsonDocument<256> document;

  document["device_id"] = DEVICE_ID;
  document["distance_cm"] = round(distanceCM * 10.0) / 10.0;
  document["fill_level_percentage"] =
    round(fillPercentage * 10.0) / 10.0;
  document["status"] = status;
  document["source"] = SIMULATION_MODE ? "simulated" : "sensor";
  document["wifi_rssi_dbm"] = WiFi.RSSI();
  document["firmware_version"] = FIRMWARE_VERSION;

  char payload[256];
  serializeJson(document, payload, sizeof(payload));

  bool published = mqttClient.publish(
    mqttTopic.c_str(),
    payload
  );

  if (published) {
    Serial.print("Publish OK: ");
    Serial.println(payload);
  } else {
    Serial.println("Publish FAILED.");
  }
}

// --------------------------------------------------
// Arduino setup
// --------------------------------------------------

void setup() {
  initializeDeviceId();
  Serial.begin(115200);
  delay(1000);
  Serial.println("Simulation control: enter D=<distance_cm>, for example D=120.");

  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);

  digitalWrite(TRIG_PIN, LOW);

  Wire.begin(OLED_SDA_PIN, OLED_SCL_PIN);

  if (!display.begin(SCREEN_ADDRESS, true)) {
    Serial.println("SH1106 OLED not detected.");
    while (true) {
      delay(1000);
    }
  }

  display.clearDisplay();
  display.setTextColor(SH110X_WHITE);
  display.setTextSize(1);

  mqttTopic =
    String(TOPIC_PREFIX) +
    "/tanks/" +
    String(DEVICE_ID) +
    "/readings";

  mqttConfigTopic =
    String(TOPIC_PREFIX) +
    "/tanks/" +
    String(DEVICE_ID) +
    "/config";

  mqttClient.setCallback(handleMqttMessage);
  mqttClient.setServer(MQTT_HOST, MQTT_PORT);

  Serial.println();
  Serial.println("================================");
  Serial.println("SeptiGuard ESP32 Sensor Device");
  Serial.println("================================");

  Serial.print("Device ID: ");
  Serial.println(DEVICE_ID);

  Serial.print("Tank height: ");
  Serial.print(tankHeightCm);
  Serial.println(" cm");

  Serial.print("MQTT topic: ");
  Serial.println(mqttTopic);

  showDisplay("SeptiGuard", "Starting...");
  delay(1500);

  connectWiFi();
  connectMQTT();

  showDisplay("Device ready", DEVICE_ID);
}

// --------------------------------------------------
// Arduino loop
// --------------------------------------------------

void loop() {
  readSerialCommands();
  connectWiFi();
  connectMQTT();

  if (mqttClient.connected()) {
    mqttClient.loop();
  }

  if (!publishReadingNow && millis() - lastPublishTime < PUBLISH_INTERVAL_MS) {
    delay(10);
    return;
  }

  lastPublishTime = millis();
  publishReadingNow = false;

  float distanceCM;

  if (SIMULATION_MODE) {
    distanceCM = SIMULATED_DISTANCE_CM;
  } else {
    distanceCM = readFilteredDistanceCM();
  }

  float fillPercentage =
    calculateFillPercentage(distanceCM);

  const char* status =
    calculateStatus(fillPercentage);

  Serial.print("Distance: ");
  Serial.print(distanceCM, 1);

  Serial.print(" cm | Fill: ");
  Serial.print(fillPercentage, 1);

  Serial.print("% | Status: ");
  Serial.println(status);

  showReading(
    distanceCM,
    fillPercentage,
    status
  );

  publishReading(
    distanceCM,
    fillPercentage,
    status
  );
}