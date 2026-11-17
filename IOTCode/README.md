# SeptiGuard ESP32 firmware

## Simulated readings

The firmware starts in simulation mode, so it can publish test readings without
an ultrasonic sensor connected. It still needs Wi-Fi and MQTT connectivity.
Open the Arduino Serial Monitor at `115200` baud and enter `D=<distance_cm>` to
set the simulated sensor-to-water distance; for example, `D=20`. Each update
publishes immediately, and later readings continue every five seconds.

With the default 25 cm tank height and no full-distance offset, `D=25` represents
empty and `D=0` represents full. Actual ultrasonic sensors have a minimum
measurable distance, so they may not reliably detect water all the way to 0 cm.
To return to live sensor readings, set
`SIMULATION_MODE` to `false` in `IOTCode.ino`, then upload the firmware again.

## Wi-Fi and OTA setup

1. Copy `secrets.example.h` to `secrets.h` in this folder. The local `secrets.h` is ignored by Git.
2. Set `WIFI_SSID`, `WIFI_PASSWORD`, and `OTA_PASSWORD` in `secrets.h`. Use a unique, long OTA password; do not reuse your Wi-Fi password.
3. Connect the ESP32 to power and upload the sketch once over USB.
4. Keep the computer used for later updates on the same local Wi-Fi network as the ESP32. The device advertises itself for ArduinoOTA using its `TNK-XXXXXXXX` device ID.
5. In Arduino IDE, select the device's network port and upload a new sketch over Wi-Fi.

The device must be powered, connected to Wi-Fi, and reachable on the same local network for OTA. Guest Wi-Fi, client isolation, or firewall rules may prevent discovery or updates. If its network port is not available, use USB.

OTA is intended for a trusted local network. Do not configure router port forwarding or otherwise expose the ESP32 OTA port to the public internet. The first upload must be done over USB, and changing the OTA password also requires uploading the updated sketch to the device.
