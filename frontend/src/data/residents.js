// Placeholder rows shaped like: users (role=resident) + resident_profiles + septic_systems + latest tank_readings.
// status: users.status (pending | approved | rejected); is_active: account active flag.
// tank_status: latest tank_readings.status (normal | warning | critical); null when no sensor linked yet.
const ago = (min) => new Date(Date.now() - min * 60000).toISOString();

export const SAMPLE_RESIDENTS = [
  { id: 1, name: "Christofer O.", email: "christofer@example.com", phone: "0917 111 2041", role: "Homeowner", block_lot: "Blk 12 Lot 4", tank_id: "TNK-042", fill_level: 96, tank_status: "critical", status: "approved", is_active: true, last_activity: ago(2) },
  { id: 2, name: "Kein T.", email: "kein@example.com", phone: "0917 222 1180", role: "Homeowner", block_lot: "Blk 7 Lot 22", tank_id: "TNK-018", fill_level: 92, tank_status: "critical", status: "approved", is_active: true, last_activity: ago(12) },
  { id: 3, name: "Niel P.", email: "niel@example.com", phone: "0918 333 3101", role: "Homeowner", block_lot: "Blk 4 Lot 9", tank_id: "TNK-031", fill_level: 87, tank_status: "critical", status: "approved", is_active: true, last_activity: ago(60) },
  { id: 4, name: "Jessa A.", email: "jessa@example.com", phone: "0919 444 2402", role: "Homeowner", block_lot: "Blk 9 Lot 12", tank_id: "TNK-024", fill_level: 78, tank_status: "warning", status: "approved", is_active: true, last_activity: ago(180) },
  { id: 5, name: "Jhanna P.", email: "jhanna@example.com", phone: "0920 555 0707", role: "Homeowner", block_lot: "Blk 2 Lot 5", tank_id: "TNK-007", fill_level: 72, tank_status: "warning", status: "approved", is_active: true, last_activity: ago(360) },
  { id: 6, name: "Marco L.", email: "marco@example.com", phone: "0921 666 1515", role: "Tenant", block_lot: "Blk 5 Lot 15", tank_id: "TNK-015", fill_level: 54, tank_status: "normal", status: "approved", is_active: true, last_activity: ago(900) },
  { id: 7, name: "Ana R.", email: "ana@example.com", phone: "0922 777 3303", role: "Homeowner", block_lot: "Blk 11 Lot 3", tank_id: "TNK-033", fill_level: 41, tank_status: "normal", status: "approved", is_active: true, last_activity: ago(1500) },
  { id: 8, name: "Paolo D.", email: "paolo@example.com", phone: "0923 888 2828", role: "Homeowner", block_lot: "Blk 8 Lot 28", tank_id: "TNK-028", fill_level: 33, tank_status: "normal", status: "approved", is_active: false, last_activity: ago(20160) },
  { id: 9, name: "Liza M.", email: "liza@example.com", phone: "0924 999 4545", role: "Homeowner", block_lot: "Blk 3 Lot 17", tank_id: "TNK-045", fill_level: 25, tank_status: "normal", status: "pending", is_active: true, last_activity: ago(240) },
  { id: 10, name: "Ramon V.", email: "ramon@example.com", phone: "0925 101 4646", role: "Tenant", block_lot: "Blk 6 Lot 2", tank_id: "TNK-046", fill_level: 18, tank_status: "normal", status: "pending", is_active: true, last_activity: ago(420) },
  { id: 11, name: "Grace S.", email: "grace@example.com", phone: "0926 202 5050", role: "Homeowner", block_lot: "Blk 10 Lot 8", tank_id: "TNK-050", fill_level: 12, tank_status: "normal", status: "rejected", is_active: true, last_activity: ago(4320) },
  { id: 12, name: "Leo B.", email: "leo@example.com", phone: "0927 303 5151", role: "Homeowner", block_lot: "Blk 1 Lot 11", tank_id: "TNK-051", fill_level: null, tank_status: null, status: "pending", is_active: true, last_activity: ago(30) },
];
