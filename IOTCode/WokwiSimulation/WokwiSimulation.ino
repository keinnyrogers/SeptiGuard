#include <ArduinoJson.h>
#include <PubSubClient.h>
#include <WiFi.h>
#include <math.h>
#include <stdio.h>
#include <stdint.h>

const char* WIFI_SSID = "Wokwi-GUEST";
const char* WIFI_PASSWORD = "";

const char* MQTT_HOST = "broker.hivemq.com";
const int MQTT_PORT = 1883;
const char* TOPIC_PREFIX = "septiguard-test-aggin";
const char* FIRMWARE_VERSION = "wokwi-sim-1.0.0";

const int TRIG_PIN = 27;
const int ECHO_PIN = 26;
const float MIN_VALID_DISTANCE_CM = 1.0;
const float MAX_VALID_DISTANCE_CM = 600.0;
const unsigned long PUBLISH_INTERVAL_MS = 5000;

WiFiClient wifiClient;
PubSubClient mqttClient(wifiClient);

String deviceId;
String mqttTopic;
unsigned long lastPublishTime = 0;
unsigned long lastMqttAttempt = 0;

void initializeDeviceId() {
  char formattedId[20];
  snprintf(
    formattedId,
    sizeof(formattedId),
    "TNK-%08X",
    static_cast<uint32_t>(ESP.getEfuseMac())
  );
  deviceId = formattedId;
}

float readRawDistanceCm() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  const unsigned long duration = pulseIn(ECHO_PIN, HIGH, 40000);
  if (duration == 0) return -1.0;

  return (duration * 0.0343) / 2.0;
}

float readFilteredDistanceCm() {
  const int sampleCount = 5;
  const int minimumValidSamples = 3;
  float total = 0.0;
  int validSamples = 0;

  for (int i = 0; i < sampleCount; i++) {
    const float distance = readRawDistanceCm();
    if (
      distance >= MIN_VALID_DISTANCE_CM &&
      distance <= MAX_VALID_DISTANCE_CM
    ) {
      total += distance;
      validSamples++;
    }
    delay(60);
  }

  return validSamples >= minimumValidSamples
    ? total / validSamples
    : -1.0;
}

void connectMqttIfNeeded() {
  if (mqttClient.connected() || millis() - lastMqttAttempt < 2000) return;
  lastMqttAttempt = millis();

  const String clientId = "septiguard-wokwi-" + deviceId;
  Serial.print("Connecting to MQTT...");
  if (mqttClient.connect(clientId.c_str())) {
    Serial.println(" connected.");
  } else {
    Serial.print(" failed. MQTT state: ");
    Serial.println(mqttClient.state());
  }
}

void publishSimulatedReading(float distanceCm) {
  StaticJsonDocument<256> document;
  document["device_id"] = deviceId;
  document["distance_cm"] = round(distanceCm * 10.0) / 10.0;
  document["source"] = "simulated";
  document["wifi_rssi_dbm"] = WiFi.RSSI();
  document["firmware_version"] = FIRMWARE_VERSION;

  char payload[256];
  serializeJson(document, payload, sizeof(payload));

  if (mqttClient.publish(mqttTopic.c_str(), payload)) {
    Serial.print("Simulated reading published: ");
    Serial.println(payload);
  } else {
    Serial.println("Simulated reading publish failed.");
  }
}

void setup() {
  Serial.begin(115200);
  delay(500);

  initializeDeviceId();
  mqttTopic = String(TOPIC_PREFIX) + "/tanks/" + deviceId + "/readings";

  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT_PULLDOWN);
  digitalWrite(TRIG_PIN, LOW);

  Serial.println();
  Serial.println("SeptiGuard Wokwi simulated sensor");
  Serial.print("Device ID: ");
  Serial.println(deviceId);
  Serial.print("MQTT topic: ");
  Serial.println(mqttTopic);
  Serial.println("Readings are tagged simulated; use a separate test account.");

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD, 6);
  Serial.print("Connecting to Wokwi-GUEST Wi-Fi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println(" connected.");

  mqttClient.setServer(MQTT_HOST, MQTT_PORT);
  mqttClient.setBufferSize(512);
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Wokwi-GUEST Wi-Fi disconnected; reconnecting.");
    WiFi.disconnect();
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD, 6);
    delay(1000);
    return;
  }

  connectMqttIfNeeded();
  if (!mqttClient.connected()) {
    delay(10);
    return;
  }
  mqttClient.loop();

  if (millis() - lastPublishTime < PUBLISH_INTERVAL_MS) return;
  lastPublishTime = millis();

  const float distanceCm = readFilteredDistanceCm();
  if (
    distanceCm < MIN_VALID_DISTANCE_CM ||
    distanceCm > MAX_VALID_DISTANCE_CM
  ) {
    Serial.println("No consistent ultrasonic echo; no reading published.");
    return;
  }

  Serial.print("Distance: ");
  Serial.print(distanceCm, 1);
  Serial.println(" cm (simulated)");
  publishSimulatedReading(distanceCm);
}
