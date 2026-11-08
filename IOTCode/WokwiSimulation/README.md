# SeptiGuard Wokwi simulated sensor

This is a separate Wokwi sketch. It does not change the real-device firmware in `../IOTCode.ino`.

## Run in Wokwi

1. Create a new ESP32 Arduino project in Wokwi.
2. Replace its sketch with `WokwiSimulation.ino`, and copy `diagram.json` and `libraries.txt` into the project.
3. Start the simulation and open the serial monitor at 115200 baud. The diagram connects the virtual HC-SR04 to GPIO 27 (TRIG) and GPIO 26 (ECHO).
4. Copy the printed `TNK-...` device ID.
5. In the SeptiGuard admin portal, register that device ID. Approve the test resident account, then pair the device to it with the measured tank height.
6. Adjust the ultrasonic sensor's distance in Wokwi to produce different readings.

The sketch connects to Wokwi's `Wokwi-GUEST` network and publishes through the same public demo MQTT broker and topic prefix as the existing firmware. Messages are explicitly tagged `source: simulated`, so forecasts based on them are identified as simulated. Use only a separate test device ID and resident account; do not pair the real device to this account.

The forecast needs readings from at least three separate days spanning two or more days, an increasing fill trend, and a latest reading less than 48 hours old. A quick Wokwi session can verify simulated readings reach the test account, but it will not immediately produce a forecast.
