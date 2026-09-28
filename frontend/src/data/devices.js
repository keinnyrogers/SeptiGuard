// Placeholder rows shaped like: septic_systems joined with resident (users/resident_profiles).
// Single identifier per device: device_id (septic_systems.device_id) — there is no separate tank ID.
// NOTE: signal, battery, firmware, and last_reading_at are NOT in the current MySQL schema yet.
// They will need new columns on septic_systems (or a device-telemetry table) before real wiring.
const ago = (min) => new Date(Date.now() - min * 60000).toISOString();

export const SAMPLE_DEVICES = [
  { id: 1, device_id: "TNK-001", resident: "Christofer O.", block_lot: "Blk 12 Lot 4", status: "online", signal: "strong", battery: 92, last_reading_at: ago(3), firmware: "v2.4.1" },
  { id: 2, device_id: "TNK-002", resident: "Kein T.", block_lot: "Blk 7 Lot 22", status: "online", signal: "strong", battery: 87, last_reading_at: ago(6), firmware: "v2.4.1" },
  { id: 3, device_id: "TNK-003", resident: "Niel P.", block_lot: "Blk 4 Lot 9", status: "online", signal: "moderate", battery: 74, last_reading_at: ago(11), firmware: "v2.4.0" },
  { id: 4, device_id: "TNK-004", resident: "Jessa A.", block_lot: "Blk 9 Lot 12", status: "online", signal: "moderate", battery: 68, last_reading_at: ago(18), firmware: "v2.4.1" },
  { id: 5, device_id: "TNK-005", resident: "Jhanna P.", block_lot: "Blk 2 Lot 5", status: "offline", signal: null, battery: null, last_reading_at: ago(1560), firmware: "v2.3.2" },
  { id: 6, device_id: "TNK-006", resident: "Marco L.", block_lot: "Blk 5 Lot 15", status: "online", signal: "strong", battery: 95, last_reading_at: ago(4), firmware: "v2.4.1" },
  { id: 7, device_id: "TNK-007", resident: "Ana R.", block_lot: "Blk 11 Lot 3", status: "online", signal: "weak", battery: 22, last_reading_at: ago(25), firmware: "v2.4.0" },
  { id: 8, device_id: "TNK-008", resident: "Paolo D.", block_lot: "Blk 8 Lot 28", status: "offline", signal: null, battery: null, last_reading_at: ago(20160), firmware: "v2.2.0" },
  { id: 9, device_id: "TNK-009", resident: "Liza M.", block_lot: "Blk 3 Lot 17", status: "online", signal: "moderate", battery: 59, last_reading_at: ago(9), firmware: "v2.4.1" },
  { id: 10, device_id: "TNK-010", resident: "Ramon V.", block_lot: "Blk 6 Lot 2", status: "online", signal: "strong", battery: 81, last_reading_at: ago(7), firmware: "v2.4.1" },
  { id: 11, device_id: "TNK-011", resident: "Grace S.", block_lot: "Blk 10 Lot 8", status: "online", signal: "moderate", battery: 63, last_reading_at: ago(14), firmware: "v2.4.0" },
];

export const LOW_BATTERY_THRESHOLD = 25;

export const SIGNAL_ORDER = { strong: 3, moderate: 2, weak: 1 };
