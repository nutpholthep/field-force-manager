/* eslint-disable */
// Auto-generated strongly typed seed data

export const aIAgentData = [
  {
    "id": "69de8dcea6c32cea802a01a2",
    "name": "Base44",
    "model": "base44/auto",
    "llm_provider": "base44",
    "llm_model": "auto",
    "sla_warning_hours": 2,
    "check_interval_minutes": 30,
    "data_skills": [
      "work_orders",
      "technicians",
      "notifications"
    ],
    "can_send_email": false,
    "last_run_at": "2026-04-14T18:58:28.156Z",
    "last_run_summary": "1 actions executed: Reassigned the 'ซ่อม Inverter ขัดข้อง อาคาร A' work order to สมศักดิ์ อินทร์เพชร to mitigate SLA risk.",
    "system_prompt": "You are an intelligent field service dispatch agent. Your job is to monitor work orders in your assigned zone, ensure SLA deadlines are not breached, follow up with technicians, and alert supervisors when intervention is needed.",
    "config": {
      "llm_provider": "base44",
      "last_run_at": "2026-04-14T18:58:28.156Z",
      "last_run_summary": "1 actions executed: Reassigned the 'ซ่อม Inverter ขัดข้อง อาคาร A' work order to สมศักดิ์ อินทร์เพชร to mitigate SLA risk.",
      "check_interval_minutes": 30,
      "sla_warning_hours": 2,
      "data_skills": [
        "work_orders",
        "technicians",
        "notifications"
      ],
      "can_send_email": false
    },
    "assigned_zone_ids": [
      "69d553778aaf17270d9b10f7",
      "69d553778aaf17270d9b10f8",
      "69d553778aaf17270d9b10f9",
      "69d524fda0afa5d7b87774c6"
    ],
    "assigned_zone_names": [
      "Central",
      "East",
      "South",
      "North"
    ],
    "is_active": true
  }
];

export const zoneData = [
  {
    "id": "69d553778aaf17270d9b10f7",
    "name": "Central",
    "code": "Central",
    "description": "ภาคกลาง",
    "color": "#3b82f6",
    "polygon": [],
    "provinces": [],
    "technician_count": 0,
    "avg_daily_jobs": 0,
    "center_latitude": 14,
    "center_longitude": 100.5,
    "agent_id": "69de8dcea6c32cea802a01a2",
    "is_active": true
  },
  {
    "id": "69d553778aaf17270d9b10f8",
    "name": "East",
    "code": "East",
    "description": "ภาคตะวันออก",
    "color": "#f97316",
    "polygon": [],
    "provinces": [],
    "technician_count": 0,
    "avg_daily_jobs": 0,
    "center_latitude": 13,
    "center_longitude": 101.5,
    "agent_id": "69de8dcea6c32cea802a01a2",
    "is_active": true
  },
  {
    "id": "69d553778aaf17270d9b10f9",
    "name": "South",
    "code": "South",
    "description": "ภาคใต้",
    "color": "#10b981",
    "polygon": [],
    "provinces": [],
    "technician_count": 0,
    "avg_daily_jobs": 0,
    "center_latitude": 8,
    "center_longitude": 100,
    "agent_id": "69de8dcea6c32cea802a01a2",
    "is_active": true
  },
  {
    "id": "69d524fda0afa5d7b87774c6",
    "name": "North",
    "code": "North",
    "description": "North",
    "color": "#3b82f6",
    "polygon": [
      [
        17.476488399970084,
        99.8592082652564
      ],
      [
        18.323454298942,
        100.87472798431038
      ],
      [
        18.77141194637304,
        101.14919277324388
      ],
      [
        19.560232666257246,
        101.18212854791592
      ],
      [
        19.637870767697773,
        100.38069136423006
      ],
      [
        20.231840542892847,
        100.52890235025417
      ],
      [
        20.3915695665012,
        100.15563023730462
      ],
      [
        19.725815250306788,
        98.59118094038362
      ],
      [
        19.813711358285484,
        98.00382629206594
      ],
      [
        17.7697231146534,
        97.63604347489505
      ],
      [
        17.15128392321719,
        98.28926967255677
      ],
      [
        17.497449514018037,
        98.84368854620244
      ],
      [
        17.214271556299817,
        99.34321446206143
      ]
    ],
    "provinces": [],
    "technician_count": 0,
    "avg_daily_jobs": 0,
    "agent_id": "69de8dcea6c32cea802a01a2",
    "is_active": true
  }
];

export const teamRoleData = [
  {
    "id": "69d553908aaf17270d9b1108",
    "name": "Supervisor",
    "code": "supervisor",
    "color": "#3b82f6",
    "description": "หัวหน้าทีมงาน",
    "is_active": true
  },
  {
    "id": "69d553908aaf17270d9b1109",
    "name": "Engineer",
    "code": "engineer",
    "color": "#8b5cf6",
    "description": "วิศวกร / ช่างเทคนิค",
    "is_active": true
  },
  {
    "id": "69d553908aaf17270d9b110a",
    "name": "Technician",
    "code": "technician",
    "color": "#10b981",
    "description": "ช่างปฏิบัติงาน",
    "is_active": true
  },
  {
    "id": "69d553908aaf17270d9b110b",
    "name": "Helper",
    "code": "helper",
    "color": "#f59e0b",
    "description": "ผู้ช่วยช่าง",
    "is_active": true
  }
];

export const teamData = [
  {
    "id": "69d553a48aaf17270d9b1112",
    "name": "ทีม A - เหนือ",
    "code": "TEAM-A",
    "description": "ทีมปฏิบัติงานภาคเหนือ",
    "zone_id": "69d524fda0afa5d7b87774c6",
    "zone_name": "North",
    "is_active": true
  },
  {
    "id": "69d553a48aaf17270d9b1113",
    "name": "ทีม B - กลาง",
    "code": "TEAM-B",
    "description": "ทีมปฏิบัติงานภาคกลาง",
    "zone_id": "69d553778aaf17270d9b10f7",
    "zone_name": "Central",
    "is_active": true
  },
  {
    "id": "69d553a48aaf17270d9b1114",
    "name": "ทีม C - ตะวันออก",
    "code": "TEAM-C",
    "description": "ทีมปฏิบัติงานภาคตะวันออก",
    "zone_id": "69d553778aaf17270d9b10f8",
    "zone_name": "East",
    "is_active": true
  }
];

export const customerData = [
  {
    "id": "69d553908aaf17270d9b1104",
    "name": "บริษัท สุริยะ เอนเเอร์จี จำกัด",
    "contact_person": "คุณสมชาย วงศ์ศรี",
    "email": "somchai@suriya-energy.co.th",
    "phone": "02-123-4567",
    "address": "99/1 ถนนพระราม 9 กรุงเทพฟ 10400",
    "total_work_orders": 0,
    "latitude": 13.75,
    "longitude": 100.53,
    "type": "commercial",
    "created_date": "2026-04-07T11:57:20.703Z",
    "updated_date": "2026-04-07T11:57:20.703Z"
  },
  {
    "id": "69d553908aaf17270d9b1105",
    "name": "ห้าง อินนอเวชั่น เทค จำกัด",
    "contact_person": "คุณวิมล บุญมี",
    "email": "wimon@innovatech.com",
    "phone": "02-456-7890",
    "address": "55 นิคมอุตสาหกรรม อยุธยา",
    "total_work_orders": 0,
    "latitude": 14.37,
    "longitude": 100.55,
    "type": "industrial",
    "created_date": "2026-04-07T11:57:20.703Z",
    "updated_date": "2026-04-07T11:57:20.703Z"
  },
  {
    "id": "69d553908aaf17270d9b1106",
    "name": "โรงเรียน สุวรรณภูมิวิทยาลัย",
    "contact_person": "อาจารย์ปรีดา ดีใจดี",
    "email": "prida@suwan-school.ac.th",
    "phone": "038-123-456",
    "address": "1 ถนนสุขุมวิท ชลบุรี 20000",
    "total_work_orders": 0,
    "latitude": 13.36,
    "longitude": 101.02,
    "type": "government",
    "created_date": "2026-04-07T11:57:20.703Z",
    "updated_date": "2026-04-07T11:57:20.703Z"
  },
  {
    "id": "69d553908aaf17270d9b1107",
    "name": "อสังหาริมทรัพย์ The Green Residences",
    "contact_person": "คุณเพรึง สุขใจ",
    "email": "plerng@green-res.com",
    "phone": "02-789-0123",
    "address": "200 ถนนรามคำแหง เจริญนคร กรุงเทพฯ 10110",
    "total_work_orders": 0,
    "latitude": 13.8,
    "longitude": 100.55,
    "type": "residential",
    "created_date": "2026-04-07T11:57:20.703Z",
    "updated_date": "2026-04-07T11:57:20.703Z"
  }
];

export const siteData = [
  {
    "id": "69d553a48aaf17270d9b1115",
    "name": "โรงงานสุริยะ อยุธยา",
    "customer_name": "บริษัท สุริยะ เอนเแอร์จี จำกัด",
    "address": "นิคมอุตสาหกรรม อยุธยา",
    "zone_id": "69d553778aaf17270d9b10f7",
    "zone_name": "Central",
    "site_type": "factory",
    "equipment": [],
    "status": "active",
    "latitude": 14.32,
    "longitude": 100.6,
    "created_date": "2026-04-07T11:57:40.953Z",
    "updated_date": "2026-04-07T11:57:40.953Z"
  },
  {
    "id": "69d553a48aaf17270d9b1116",
    "name": "อาคารสำนักงานใหญ่ สีลม",
    "customer_name": "ห้าง อินนอเวชั่น เทค จำกัด",
    "address": "นิคมอุตสาหกรรม สีลม",
    "zone_id": "69d553778aaf17270d9b10f8",
    "zone_name": "East",
    "site_type": "office",
    "equipment": [],
    "status": "active",
    "latitude": 13.45,
    "longitude": 100.93,
    "created_date": "2026-04-07T11:57:40.953Z",
    "updated_date": "2026-04-07T11:57:40.953Z"
  },
  {
    "id": "69d553a48aaf17270d9b1117",
    "name": "โรงเรียนสุวรรณภูมิวิทยาลัย สาขา A",
    "customer_name": "โรงเรียน สุวรรณภูมิวิทยาลัย",
    "address": "ชลบุรี",
    "zone_id": "69d553778aaf17270d9b10f8",
    "zone_name": "East",
    "site_type": "office",
    "equipment": [],
    "status": "active",
    "latitude": 13.36,
    "longitude": 101.02,
    "created_date": "2026-04-07T11:57:40.953Z",
    "updated_date": "2026-04-07T11:57:40.953Z"
  },
  {
    "id": "69d553a48aaf17270d9b1118",
    "name": "The Green Residences - Tower 1",
    "customer_name": "อสังหาริมทรัพย์ The Green Residences",
    "address": "เจริญนคร กรุงเทพฯ",
    "zone_id": "69d553778aaf17270d9b10f7",
    "zone_name": "Central",
    "site_type": "residential",
    "equipment": [],
    "status": "active",
    "latitude": 13.8,
    "longitude": 100.55,
    "created_date": "2026-04-07T11:57:40.953Z",
    "updated_date": "2026-04-07T11:57:40.953Z"
  }
];

export const skillData = [
  {
    "id": "69d553778aaf17270d9b10e6",
    "name": "ไฟฟ้ากำลัง",
    "category": "Electrical",
    "description": "ติดตั้งและซ่อมระบบไฟฟ้ากำลัง",
    "created_date": "2026-04-07T11:56:55.288Z",
    "updated_date": "2026-04-07T11:56:55.288Z"
  },
  {
    "id": "69d553778aaf17270d9b10e7",
    "name": "Solar PV",
    "category": "Electrical",
    "description": "ติดตั้งและบำรุงรักษาแผงโซลาร์เซลล์",
    "created_date": "2026-04-07T11:56:55.288Z",
    "updated_date": "2026-04-07T11:56:55.288Z"
  },
  {
    "id": "69d553778aaf17270d9b10e8",
    "name": "ระบบ Inverter",
    "category": "Electrical",
    "description": "ตรวจสอบและซ่อมอินเวอร์เตอร์",
    "created_date": "2026-04-07T11:56:55.288Z",
    "updated_date": "2026-04-07T11:56:55.288Z"
  },
  {
    "id": "69d553778aaf17270d9b10e9",
    "name": "เชื่อมโลหะ",
    "category": "Mechanical",
    "description": "งานเชื่อมโครงสร้างและท่อ",
    "created_date": "2026-04-07T11:56:55.288Z",
    "updated_date": "2026-04-07T11:56:55.288Z"
  },
  {
    "id": "69d553778aaf17270d9b10ea",
    "name": "ระบบท่อ (Plumbing)",
    "category": "Mechanical",
    "description": "ติดตั้งและซ่อมระบบท่อ",
    "created_date": "2026-04-07T11:56:55.288Z",
    "updated_date": "2026-04-07T11:56:55.288Z"
  },
  {
    "id": "69d553778aaf17270d9b10eb",
    "name": "ระบบปรับอากาศ HVAC",
    "category": "Mechanical",
    "description": "ติดตั้งและซ่อมแอร์และระบบระบายอากาศ",
    "created_date": "2026-04-07T11:56:55.288Z",
    "updated_date": "2026-04-07T11:56:55.288Z"
  },
  {
    "id": "69d553778aaf17270d9b10ec",
    "name": "Network & CCTV",
    "category": "IT",
    "description": "ติดตั้งกล้องและระบบ Network",
    "created_date": "2026-04-07T11:56:55.288Z",
    "updated_date": "2026-04-07T11:56:55.288Z"
  },
  {
    "id": "69d553778aaf17270d9b10ed",
    "name": "ขับรถกระเช้า",
    "category": "Safety",
    "description": "ใบอนุญาตขับรถกระเช้าสูง",
    "created_date": "2026-04-07T11:56:55.288Z",
    "updated_date": "2026-04-07T11:56:55.288Z"
  },
  {
    "id": "69d553778aaf17270d9b10ee",
    "name": "งานสูง (Work at Height)",
    "category": "Safety",
    "description": "ปฏิบัติงานบนที่สูงเกิน 2 เมตร",
    "created_date": "2026-04-07T11:56:55.288Z",
    "updated_date": "2026-04-07T11:56:55.288Z"
  }
];

export const priorityMasterData = [
  {
    "id": "69d553778aaf17270d9b10f3",
    "name": "Critical",
    "code": "critical",
    "color": "#ef4444",
    "duration_value": 4,
    "duration_unit": "hours",
    "description": "งานฉุกเฉิน ต้องดำเนินการทันที",
    "is_active": true,
    "created_date": "2026-04-07T11:56:55.298Z",
    "updated_date": "2026-04-07T11:56:55.298Z"
  },
  {
    "id": "69d553778aaf17270d9b10f4",
    "name": "High",
    "code": "high",
    "color": "#f97316",
    "duration_value": 24,
    "duration_unit": "hours",
    "description": "งานสำคัญ ดำเนินการภายใน 24 ชั่วโมง",
    "is_active": true,
    "created_date": "2026-04-07T11:56:55.298Z",
    "updated_date": "2026-04-07T11:56:55.298Z"
  },
  {
    "id": "69d553778aaf17270d9b10f5",
    "name": "Medium",
    "code": "medium",
    "color": "#f59e0b",
    "duration_value": 3,
    "duration_unit": "days",
    "description": "งานปกติ ดำเนินการภายใน 3 วัน",
    "is_active": true,
    "created_date": "2026-04-07T11:56:55.298Z",
    "updated_date": "2026-04-07T11:56:55.298Z"
  },
  {
    "id": "69d553778aaf17270d9b10f6",
    "name": "Low",
    "code": "low",
    "color": "#10b981",
    "duration_value": 7,
    "duration_unit": "days",
    "description": "งานตามแผน ดำเนินการภายใน 7 วัน",
    "is_active": true,
    "created_date": "2026-04-07T11:56:55.298Z",
    "updated_date": "2026-04-07T11:56:55.298Z"
  },
  {
    "id": "69d51e1c3bb82a70c2f3f863",
    "name": "SA1",
    "code": "sa1",
    "color": "#3b82f6",
    "duration_value": 4,
    "duration_unit": "hours",
    "is_active": true,
    "created_date": "2026-04-07T08:09:16.499Z",
    "updated_date": "2026-04-07T08:09:16.499Z"
  }
];

export const stuckReasonData = [
  {
    "id": "69dda20730cac73745216b49",
    "name": "รออะไหล่/วัสดุ",
    "code": "waiting_parts",
    "category": "parts",
    "description": "อะไหล่หรือวัสดุที่ต้องการยังไม่มาถึง",
    "color": "#f97316",
    "is_active": true,
    "created_date": "2026-04-13T19:10:15.460Z",
    "updated_date": "2026-04-13T19:10:15.460Z"
  },
  {
    "id": "69dda20730cac73745216b4a",
    "name": "อะไหล่ผิดสเปค",
    "code": "wrong_parts",
    "category": "parts",
    "description": "อะไหล่ที่ได้รับไม่ตรงกับสเปคที่ต้องการ",
    "color": "#ea580c",
    "is_active": true,
    "created_date": "2026-04-13T19:10:15.460Z",
    "updated_date": "2026-04-13T19:10:15.460Z"
  },
  {
    "id": "69dda20730cac73745216b4b",
    "name": "ไม่สามารถเข้าพื้นที่ได้",
    "code": "no_access",
    "category": "access",
    "description": "ไม่ได้รับอนุญาตหรือไม่มีกุญแจเข้าพื้นที่",
    "color": "#ca8a04",
    "is_active": true,
    "created_date": "2026-04-13T19:10:15.460Z",
    "updated_date": "2026-04-13T19:10:15.460Z"
  },
  {
    "id": "69dda20730cac73745216b4c",
    "name": "ลูกค้าไม่อยู่",
    "code": "customer_absent",
    "category": "customer",
    "description": "ลูกค้าหรือผู้ประสานงานไม่อยู่ที่สถานที่",
    "color": "#2563eb",
    "is_active": true,
    "created_date": "2026-04-13T19:10:15.460Z",
    "updated_date": "2026-04-13T19:10:15.460Z"
  },
  {
    "id": "69dda20730cac73745216b4d",
    "name": "รอการอนุมัติจากลูกค้า",
    "code": "waiting_customer_approval",
    "category": "customer",
    "description": "ต้องรอลูกค้าอนุมัติก่อนดำเนินการต่อ",
    "color": "#1d4ed8",
    "is_active": true,
    "created_date": "2026-04-13T19:10:15.460Z",
    "updated_date": "2026-04-13T19:10:15.460Z"
  },
  {
    "id": "69dda20730cac73745216b4e",
    "name": "ปัญหาเทคนิคที่ซับซ้อน",
    "code": "complex_technical",
    "category": "technical",
    "description": "พบปัญหาทางเทคนิคที่ต้องการผู้เชี่ยวชาญเพิ่มเติม",
    "color": "#dc2626",
    "is_active": true,
    "created_date": "2026-04-13T19:10:15.460Z",
    "updated_date": "2026-04-13T19:10:15.460Z"
  },
  {
    "id": "69dda20730cac73745216b4f",
    "name": "ต้องการเครื่องมือพิเศษ",
    "code": "need_special_tools",
    "category": "technical",
    "description": "งานต้องใช้เครื่องมือที่ไม่ได้นำมา",
    "color": "#b91c1c",
    "is_active": true,
    "created_date": "2026-04-13T19:10:15.460Z",
    "updated_date": "2026-04-13T19:10:15.460Z"
  },
  {
    "id": "69dda20730cac73745216b50",
    "name": "รอ Vendor/ผู้รับเหมาช่วง",
    "code": "waiting_vendor",
    "category": "technical",
    "description": "ต้องรอผู้เชี่ยวชาญหรือ vendor จากภายนอก",
    "color": "#7c3aed",
    "is_active": true,
    "created_date": "2026-04-13T19:10:15.460Z",
    "updated_date": "2026-04-13T19:10:15.460Z"
  },
  {
    "id": "69dda20730cac73745216b51",
    "name": "สภาพอากาศไม่เอื้ออำนวย",
    "code": "bad_weather",
    "category": "weather",
    "description": "สภาพอากาศ เช่น ฝนตก พายุ ทำให้ไม่สามารถทำงานได้",
    "color": "#0284c7",
    "is_active": true,
    "created_date": "2026-04-13T19:10:15.460Z",
    "updated_date": "2026-04-13T19:10:15.460Z"
  },
  {
    "id": "69dda20730cac73745216b52",
    "name": "อื่นๆ",
    "code": "other",
    "category": "other",
    "description": "สาเหตุอื่นๆ ที่ไม่อยู่ในหมวดหมู่ข้างต้น",
    "color": "#64748b",
    "is_active": true,
    "created_date": "2026-04-13T19:10:15.460Z",
    "updated_date": "2026-04-13T19:10:15.460Z"
  }
];

export const materialCategoryData = [
  {
    "id": "69d553778aaf17270d9b10ef",
    "name": "อะไหล่ไฟฟ้า",
    "code": "electrical",
    "description": "สายไฟ ตัดต่อ เบรคเกอร์ ฯลฯ",
    "color": "#f59e0b",
    "is_active": true,
    "created_date": "2026-04-07T11:56:55.292Z",
    "updated_date": "2026-04-07T11:56:55.292Z"
  },
  {
    "id": "69d553778aaf17270d9b10f0",
    "name": "อะไหล่เครื่องกล",
    "code": "mechanical",
    "description": "สกรู แบริ่ง ปั๊ม ฯลฯ",
    "color": "#64748b",
    "is_active": true,
    "created_date": "2026-04-07T11:56:55.292Z",
    "updated_date": "2026-04-07T11:56:55.292Z"
  },
  {
    "id": "69d553778aaf17270d9b10f1",
    "name": "วัสดุสิ้นเปลือง",
    "code": "consumable",
    "description": "น้ำมัน กาว เทป ฯลฯ",
    "color": "#8b5cf6",
    "is_active": true,
    "created_date": "2026-04-07T11:56:55.292Z",
    "updated_date": "2026-04-07T11:56:55.292Z"
  },
  {
    "id": "69d553778aaf17270d9b10f2",
    "name": "อุปกรณ์ป้องกัน (PPE)",
    "code": "ppe",
    "description": "หมวก ถุงมือ สายรัด ฯลฯ",
    "color": "#10b981",
    "is_active": true,
    "created_date": "2026-04-07T11:56:55.292Z",
    "updated_date": "2026-04-07T11:56:55.292Z"
  },
  {
    "id": "69d51d76cd5c3ed3a3f7fc2f",
    "name": "PV Model",
    "code": "pv",
    "color": "#3b82f6",
    "is_active": true,
    "created_date": "2026-04-07T08:06:30.765Z",
    "updated_date": "2026-04-07T08:06:30.765Z"
  }
];

export const materialData = [
  {
    "id": "69d553d48aaf17270d9b112b",
    "item_number": "PV-001",
    "item_name": "แผง Solar 550W Mono",
    "description": "แผงโซลาร์มอนโอ 550W",
    "category_name": "PV Model",
    "item_group": "FG",
    "item_type": "item",
    "unit": "EA",
    "stock_qty": 120,
    "min_stock_qty": 20,
    "cost_price": 4500,
    "keywords": [],
    "is_active": true,
    "created_date": "2026-04-07T11:58:28.912Z",
    "updated_date": "2026-04-07T11:58:28.912Z"
  },
  {
    "id": "69d553d48aaf17270d9b112c",
    "item_number": "PV-002",
    "item_name": "แผง Solar 400W Poly",
    "description": "แผงโชลาร์พอลี 400W",
    "category_id": "69d51d76cd5c3ed3a3f7fc2f",
    "category_name": "PV Model",
    "item_group": "FG",
    "item_type": "item",
    "unit": "EA",
    "stock_qty": 8,
    "min_stock_qty": 20,
    "cost_price": 3200,
    "keywords": [],
    "is_active": true,
    "created_date": "2026-04-07T11:58:28.912Z",
    "updated_date": "2026-04-07T12:39:42.400Z"
  },
  {
    "id": "69d553d48aaf17270d9b112d",
    "item_number": "INV-001",
    "item_name": "Inverter 5kW",
    "description": "Inverter ระบบไฟฟ้าสำรอง 5kW",
    "category_name": "PV Model",
    "item_group": "FG",
    "item_type": "item",
    "unit": "EA",
    "stock_qty": 15,
    "min_stock_qty": 5,
    "cost_price": 28000,
    "keywords": [],
    "is_active": true,
    "created_date": "2026-04-07T11:58:28.912Z",
    "updated_date": "2026-04-07T11:58:28.912Z"
  },
  {
    "id": "69d553d48aaf17270d9b112e",
    "item_number": "INV-002",
    "item_name": "Inverter 10kW",
    "description": "Inverter ระบบไฟฟ้าสำรอง 10kW",
    "category_name": "PV Model",
    "item_group": "FG",
    "item_type": "item",
    "unit": "EA",
    "stock_qty": 6,
    "min_stock_qty": 3,
    "cost_price": 52000,
    "keywords": [],
    "is_active": true,
    "created_date": "2026-04-07T11:58:28.912Z",
    "updated_date": "2026-04-07T11:58:28.912Z"
  },
  {
    "id": "69d553d48aaf17270d9b112f",
    "item_number": "EL-001",
    "item_name": "สายไฟ DC 4mm²",
    "description": "สายไฟ DC สำหรับ Solar ขนาด 4mm²",
    "category_name": "อะไหล่ไฟฟ้า",
    "item_group": "RM",
    "item_type": "item",
    "unit": "M",
    "stock_qty": 500,
    "min_stock_qty": 100,
    "cost_price": 45,
    "keywords": [],
    "is_active": true,
    "created_date": "2026-04-07T11:58:28.912Z",
    "updated_date": "2026-04-07T11:58:28.912Z"
  },
  {
    "id": "69d553d48aaf17270d9b1130",
    "item_number": "EL-002",
    "item_name": "ตัดต่อ DC 32A",
    "description": "ตัดต่อ DC 32A",
    "category_name": "อะไหล่ไฟฟ้า",
    "item_group": "CP",
    "item_type": "item",
    "unit": "EA",
    "stock_qty": 40,
    "min_stock_qty": 10,
    "cost_price": 850,
    "keywords": [],
    "is_active": true,
    "created_date": "2026-04-07T11:58:28.912Z",
    "updated_date": "2026-04-07T11:58:28.912Z"
  },
  {
    "id": "69d553d48aaf17270d9b1131",
    "item_number": "MC-001",
    "item_name": "เหล็ก L-bracket",
    "description": "เหล็กยึดแผง Solar",
    "category_name": "อะไหล่เครื่องกล",
    "item_group": "CP",
    "item_type": "item",
    "unit": "SET",
    "stock_qty": 80,
    "min_stock_qty": 20,
    "cost_price": 320,
    "keywords": [],
    "is_active": true,
    "created_date": "2026-04-07T11:58:28.912Z",
    "updated_date": "2026-04-07T11:58:28.912Z"
  },
  {
    "id": "69d553d48aaf17270d9b1132",
    "item_number": "CN-001",
    "item_name": "น้ำยาทำความสะอาดแผง",
    "description": "น้ำยาสำหรับทำความสะอาดผิวแผง",
    "category_id": "69d553778aaf17270d9b10f1",
    "category_name": "วัสดุสิ้นเปลือง",
    "item_group": "RM",
    "item_type": "item",
    "unit": "BTL",
    "stock_qty": 3,
    "min_stock_qty": 10,
    "cost_price": 250,
    "keywords": [],
    "is_active": true,
    "created_date": "2026-04-07T11:58:28.912Z",
    "updated_date": "2026-04-07T12:39:54.672Z"
  },
  {
    "id": "69d553d48aaf17270d9b1133",
    "item_number": "SVC-001",
    "item_name": "ค่าแรงงานติดตั้ง",
    "description": "ค่าแรงงานช่างติดตั้งต่อชั่วโมง",
    "category_name": "วัสดุสิ้นเปลือง",
    "item_group": "FG",
    "item_type": "service",
    "unit": "HR",
    "stock_qty": 0,
    "min_stock_qty": 0,
    "cost_price": 400,
    "keywords": [],
    "is_active": true,
    "created_date": "2026-04-07T11:58:28.912Z",
    "updated_date": "2026-04-07T11:58:28.912Z"
  }
];

export const serviceTypeData = [
  {
    "id": "69d5540c8aaf17270d9b1149",
    "name": "ติดตั้ง Solar PV",
    "code": "solar_install",
    "description": "ติดตั้งแผงโชลาร์พร้อมอินเวอร์เตอร์",
    "required_skill_ids": [],
    "allowed_priority_ids": [],
    "default_priority": "medium",
    "default_duration_hrs": 6,
    "steps": [],
    "causes": [],
    "is_active": true,
    "created_date": "2026-04-07T11:59:24.565Z",
    "updated_date": "2026-04-07T11:59:24.565Z"
  },
  {
    "id": "69d5540c8aaf17270d9b114a",
    "name": "บำรุงรักษาประจำ (PM)",
    "code": "pm_solar",
    "description": "ประจำปีตรวจและทำความสะอาดระบบโชลาร์",
    "required_skill_ids": [],
    "allowed_priority_ids": [],
    "default_priority": "medium",
    "default_duration_hrs": 3,
    "steps": [],
    "causes": [],
    "is_active": true,
    "created_date": "2026-04-07T11:59:24.565Z",
    "updated_date": "2026-04-07T11:59:24.565Z"
  }
];

export const workflowData = [
  {
    "id": "69d51ea3c5c917b065c7592a",
    "name": "TEST",
    "nodes": [
      {
        "id": "node_1775574692825",
        "type": "start",
        "label": "Start",
        "x": -34.04049301147461,
        "y": -42.74884009361267,
        "service_type_id": null,
        "service_type_name": null,
        "assignee_mode": "manual",
        "allowed_technician_ids": [],
        "allowed_zone_ids": [],
        "auto_assign": false
      },
      {
        "id": "node_1775574851840",
        "type": "end",
        "label": "End",
        "x": 521.1991271972656,
        "y": -48.37451720237732,
        "service_type_id": null,
        "service_type_name": null,
        "assignee_mode": "manual",
        "allowed_technician_ids": [],
        "allowed_zone_ids": [],
        "auto_assign": false
      },
      {
        "id": "node_1775797750616",
        "type": "service",
        "label": "ติดตั้ง Solar PV",
        "x": 220.66061401367188,
        "y": -46.97966694831848,
        "service_type_id": "69d5540c8aaf17270d9b1149",
        "service_type_name": "ติดตั้ง Solar PV",
        "assignee_mode": "manual",
        "allowed_technician_ids": [],
        "allowed_zone_ids": [],
        "auto_assign": false
      }
    ],
    "edges": [
      {
        "id": "edge_1776191359265",
        "source": "node_1775574692825",
        "target": "node_1775797750616"
      },
      {
        "id": "edge_1776191363731",
        "source": "node_1775797750616",
        "target": "node_1775574851840"
      }
    ],
    "version": "1.0",
    "is_active": true,
    "created_date": "2026-04-07T08:11:31.078Z",
    "updated_date": "2026-04-14T11:29:26.184Z"
  }
];

export const technicianData = [
  {
    "id": "69d553d48aaf17270d9b1134",
    "technician_code": "TEC-001",
    "full_name": "สมศักดิ์ อินทร์เพชร",
    "email": "somsak@example.com",
    "phone": "081-234-5678",
    "linked_user_id": "69cb5e583e03661a786ea79c",
    "linked_user_email": "otshi44@gmail.com",
    "status": "active",
    "team_role": "engineer",
    "team_role_name": "Engineer",
    "team_id": "69d553a48aaf17270d9b1112",
    "team_name": "ทีม A - เหนือ",
    "home_latitude": 13.7563,
    "home_longitude": 100.5018,
    "current_latitude": 13.7563,
    "current_longitude": 100.5018,
    "zone_id": "69d524fda0afa5d7b87774c6",
    "zone_name": "North",
    "skills": [
      "Solar PV",
      "ไฟฟ้ากำลัง",
      "งานสูง (Work at Height)"
    ],
    "certifications": [],
    "max_daily_jobs": 5,
    "current_daily_jobs": 2,
    "sla_compliance_rate": 92,
    "customer_rating": 4.7,
    "jobs_completed_total": 42,
    "availability": "busy",
    "working_hours_start": "08:00",
    "working_hours_end": "17:00",
    "hourly_rate": 350,
    "created_date": "2026-04-07T11:58:28.937Z",
    "updated_date": "2026-04-14T12:05:52.264Z"
  },
  {
    "id": "69d553d48aaf17270d9b1135",
    "technician_code": "TEC-002",
    "full_name": "วิชัย พะเยาว์นาง",
    "email": "wichai@example.com",
    "phone": "082-345-6789",
    "status": "active",
    "team_role": "technician",
    "team_role_name": "Technician",
    "team_id": "69d553a48aaf17270d9b1112",
    "team_name": "ทีม A - เหนือ",
    "home_latitude": 13.88,
    "home_longitude": 100.52,
    "current_latitude": 13.8621,
    "current_longitude": 100.5152,
    "zone_id": "69d524fda0afa5d7b87774c6",
    "zone_name": "North",
    "skills": [
      "Solar PV",
      "ระบบ Inverter"
    ],
    "certifications": [],
    "max_daily_jobs": 4,
    "current_daily_jobs": 2,
    "sla_compliance_rate": 88,
    "customer_rating": 4.5,
    "jobs_completed_total": 28,
    "availability": "busy",
    "working_hours_start": "08:00",
    "working_hours_end": "17:00",
    "hourly_rate": 280,
    "created_date": "2026-04-07T11:58:28.937Z",
    "updated_date": "2026-04-14T12:05:52.299Z"
  },
  {
    "id": "69d553d48aaf17270d9b1136",
    "technician_code": "TEC-003",
    "full_name": "ปรีชา สุขเกษม",
    "email": "precha@example.com",
    "phone": "083-456-7890",
    "status": "active",
    "team_role": "supervisor",
    "team_role_name": "Supervisor",
    "team_id": "69d553a48aaf17270d9b1113",
    "team_name": "ทีม B - กลาง",
    "home_latitude": 13.72,
    "home_longitude": 100.51,
    "current_latitude": 13.7308,
    "current_longitude": 100.5233,
    "zone_id": "69d553778aaf17270d9b10f7",
    "zone_name": "Central",
    "skills": [
      "ไฟฟ้ากำลัง",
      "เชื่อมโลหะ",
      "ระบบ Inverter"
    ],
    "certifications": [],
    "max_daily_jobs": 6,
    "current_daily_jobs": 1,
    "sla_compliance_rate": 97,
    "customer_rating": 4.9,
    "jobs_completed_total": 115,
    "availability": "busy",
    "working_hours_start": "07:30",
    "working_hours_end": "16:30",
    "hourly_rate": 450,
    "created_date": "2026-04-07T11:58:28.937Z",
    "updated_date": "2026-04-14T12:05:52.313Z"
  },
  {
    "id": "69d553d48aaf17270d9b1137",
    "technician_code": "TEC-004",
    "full_name": "นาถนู ม้วงอ้วน",
    "email": "natnu@example.com",
    "phone": "084-567-8901",
    "status": "active",
    "team_role": "technician",
    "team_role_name": "Technician",
    "team_id": "69d553a48aaf17270d9b1113",
    "team_name": "ทีม B - กลาง",
    "home_latitude": 13.75,
    "home_longitude": 100.54,
    "current_latitude": 13.7456,
    "current_longitude": 100.5391,
    "zone_id": "69d553778aaf17270d9b10f7",
    "zone_name": "Central",
    "skills": [
      "ระบบปรับอากาศ HVAC",
      "ระบบท่อ (Plumbing)"
    ],
    "certifications": [],
    "max_daily_jobs": 4,
    "current_daily_jobs": 0,
    "sla_compliance_rate": 80,
    "customer_rating": 4.2,
    "jobs_completed_total": 19,
    "availability": "offline",
    "working_hours_start": "08:00",
    "working_hours_end": "17:00",
    "hourly_rate": 260,
    "created_date": "2026-04-07T11:58:28.937Z",
    "updated_date": "2026-04-14T12:05:52.330Z"
  },
  {
    "id": "69d553d48aaf17270d9b1138",
    "technician_code": "TEC-005",
    "full_name": "อนุชา อิ่มอิ่ม",
    "email": "anucha@example.com",
    "phone": "085-678-9012",
    "status": "active",
    "team_role": "engineer",
    "team_role_name": "Engineer",
    "team_id": "69d553a48aaf17270d9b1114",
    "team_name": "ทีม C - ตะวันออก",
    "home_latitude": 13.69,
    "home_longitude": 100.6,
    "current_latitude": 13.6971,
    "current_longitude": 100.6071,
    "zone_id": "69d553778aaf17270d9b10f8",
    "zone_name": "East",
    "skills": [
      "Solar PV",
      "Network & CCTV",
      "งานสูง (Work at Height)"
    ],
    "certifications": [],
    "max_daily_jobs": 5,
    "current_daily_jobs": 4,
    "sla_compliance_rate": 94,
    "customer_rating": 4.8,
    "jobs_completed_total": 67,
    "availability": "busy",
    "working_hours_start": "08:00",
    "working_hours_end": "17:00",
    "hourly_rate": 380,
    "created_date": "2026-04-07T11:58:28.937Z",
    "updated_date": "2026-04-14T12:05:52.344Z"
  },
  {
    "id": "69d553d48aaf17270d9b1139",
    "technician_code": "TEC-006",
    "full_name": "พงศ์คูณ ทองคำ",
    "email": "pongkun@example.com",
    "phone": "086-789-0123",
    "status": "active",
    "team_role": "helper",
    "team_role_name": "Helper",
    "team_id": "69d553a48aaf17270d9b1114",
    "team_name": "ทีม C - ตะวันออก",
    "home_latitude": 13.71,
    "home_longitude": 100.63,
    "current_latitude": 13.715,
    "current_longitude": 100.635,
    "zone_id": "69d553778aaf17270d9b10f8",
    "zone_name": "East",
    "skills": [
      "เชื่อมโลหะ"
    ],
    "certifications": [],
    "max_daily_jobs": 3,
    "current_daily_jobs": 1,
    "sla_compliance_rate": 75,
    "customer_rating": 4,
    "jobs_completed_total": 8,
    "availability": "break",
    "working_hours_start": "08:00",
    "working_hours_end": "17:00",
    "hourly_rate": 200,
    "created_date": "2026-04-07T11:58:28.937Z",
    "updated_date": "2026-04-14T12:05:52.366Z"
  }
];

export const projectData = [
  {
    "id": "69de892133abcfd6bbfa172a",
    "project_number": "PRJ-777090",
    "name": "The Green Residences - Tower 1 - TEST",
    "customer_name": "อสังหาริมทรัพย์ The Green Residences",
    "site_id": "69d553a48aaf17270d9b1118",
    "site_name": "The Green Residences - Tower 1",
    "workflow_id": "69d51ea3c5c917b065c7592a",
    "workflow_name": "TEST",
    "status": "completed",
    "priority": "medium",
    "start_date": "2026-04-15T00:00:00.000Z",
    "completed_date": "2026-04-15T00:00:00.000Z",
    "completed_steps": [
      "node_1775797750616"
    ],
    "step_history": [
      {
        "step_id": "node_1775797750616",
        "step_name": "ติดตั้ง Solar PV",
        "completed_at": "2026-04-14T18:36:24.732Z",
        "notes": ""
      }
    ],
    "tags": [],
    "created_date": "2026-04-14T11:36:17.374Z",
    "updated_date": "2026-04-14T11:36:25.022Z"
  }
];

export const workOrderData = [
  {
    "id": "69de89213bfe93be61d095fe",
    "order_number": "PRJ-777090-01",
    "title": "ติดตั้ง Solar PV — The Green Residences - Tower 1",
    "status": "created",
    "priority": "medium",
    "service_type": "maintenance",
    "required_skills": [],
    "customer_name": "อสังหาริมทรัพย์ The Green Residences",
    "site_name": "The Green Residences - Tower 1",
    "site_id": "69d553a48aaf17270d9b1118",
    "site_latitude": 13.8,
    "site_longitude": 100.55,
    "sla_risk": "low",
    "estimated_duration_hrs": 2,
    "notes": "Project: PRJ-777090 | Step 1: ติดตั้ง Solar PV",
    "attachments": [],
    "project_id": "69de892133abcfd6bbfa172a",
    "project_step_id": "node_1775797750616",
    "created_date": "2026-04-14T11:36:17.671Z",
    "updated_date": "2026-04-14T11:36:17.671Z"
  },
  {
    "id": "69d5540c8aaf17270d9b1143",
    "order_number": "WO-2026-0001",
    "title": "ติดตั้งแผง Solar 20kW สำนักงานใหญ่",
    "description": "ติดตั้งแผงโชลาร์พร้อมอินเวอร์เตอร์และระบบควบคุม",
    "status": "working",
    "stuck_reason_id": "69dda20730cac73745216b4e",
    "stuck_reason_name": "ปัญหาเทคนิคที่ซับซ้อน",
    "priority": "high",
    "service_type": "installation",
    "required_skills": [
      "Solar PV",
      "งานสูง (Work at Height)"
    ],
    "customer_name": "ห้าง อินนอเวชั่น เทค จำกัด",
    "site_name": "อาคารสำนักงานใหญ่ สีลม",
    "site_latitude": 13.7244,
    "site_longitude": 100.5294,
    "zone_name": "East",
    "assigned_technician_name": "อนุชา อิ่มอิ่ม",
    "sla_due": "2026-04-09T10:00:00.000Z",
    "sla_risk": "low",
    "scheduled_date": "2026-04-08T00:00:00.000Z",
    "scheduled_time": "09:00",
    "estimated_duration_hrs": 4,
    "started_at": "2026-04-14T18:16:30.152Z",
    "completed_at": "2026-04-13T14:08:30.415Z",
    "labor_cost": 1520,
    "equipment_cost": 32000,
    "total_cost": 33520,
    "attachments": [],
    "created_date": "2026-04-07T11:59:24.540Z",
    "updated_date": "2026-04-14T12:05:52.388Z"
  },
  {
    "id": "69d5540c8aaf17270d9b1144",
    "order_number": "WO-2026-0002",
    "title": "บำรุงรักษาประจำปี Solar Farm",
    "description": "ตรวจสอบแผง อินเวอร์เตอร์ และทำความสะอาดโครงสร้าง",
    "status": "traveling",
    "priority": "medium",
    "service_type": "repair",
    "required_skills": [
      "Solar PV",
      "ระบบ Inverter"
    ],
    "customer_name": "บริษัท สุริยะ เอนเแอร์จี จำกัด",
    "site_name": "โรงงานสุริยะ อยุธยา",
    "site_latitude": 14.3528,
    "site_longitude": 100.5737,
    "zone_name": "Central",
    "assigned_technician_id": "69d553d48aaf17270d9b1135",
    "assigned_technician_name": "สมศักดิ์ อินทร์เพชร",
    "sla_due": "2026-04-07T09:00:00.000Z",
    "sla_risk": "high",
    "scheduled_date": "2026-04-07T00:00:00.000Z",
    "scheduled_time": "08:00",
    "estimated_duration_hrs": 4,
    "labor_cost": 1050,
    "equipment_cost": 0,
    "total_cost": 2300,
    "attachments": [],
    "created_date": "2026-04-07T11:59:24.540Z",
    "updated_date": "2026-04-14T12:05:52.406Z"
  },
  {
    "id": "69d5540c8aaf17270d9b1145",
    "order_number": "WO-2026-0003",
    "title": "ซ่อม Inverter ขัดข้อง อาคาร A",
    "description": "Inverter อ่านค่าไม่ได้ ต้องตรวจสอบด่วน",
    "status": "on_site",
    "priority": "critical",
    "service_type": "repair",
    "required_skills": [
      "ระบบ Inverter"
    ],
    "customer_name": "ห้าง อินนอเวชั่น เทค จำกัด",
    "site_name": "อาคารสำนักงานใหญ่ สีลม",
    "site_latitude": 13.7244,
    "site_longitude": 100.5294,
    "zone_name": "East",
    "assigned_technician_id": "69d553d48aaf17270d9b1134",
    "assigned_technician_name": "สมศักดิ์ อินทร์เพชร",
    "sla_due": "2026-04-07T10:00:00.000Z",
    "sla_risk": "high",
    "scheduled_date": "2026-04-07T00:00:00.000Z",
    "scheduled_time": "13:00",
    "estimated_duration_hrs": 2,
    "started_at": "2026-04-14T18:35:06.054Z",
    "labor_cost": 560,
    "equipment_cost": 52000,
    "total_cost": 52560,
    "attachments": [],
    "created_date": "2026-04-07T11:59:24.540Z",
    "updated_date": "2026-04-14T12:05:52.435Z"
  },
  {
    "id": "69d5540c8aaf17270d9b1146",
    "order_number": "WO-2026-0004",
    "title": "ตรวจสอบระบบ โรงเรียนสุวรรณภูมิ",
    "description": "ตรวจสอบระบบไฟฟ้าและแผง Solar ประจำปี",
    "status": "working",
    "priority": "low",
    "service_type": "inspection",
    "required_skills": [
      "Solar PV"
    ],
    "customer_name": "โรงเรียน สุวรรณภูมิวิทยาลัย",
    "site_name": "โรงเรียนสุวรรณภูมิวิทยาลัย สาขา A",
    "site_latitude": 13.5991,
    "site_longitude": 100.6069,
    "zone_name": "East",
    "assigned_technician_id": "69d553d48aaf17270d9b1136",
    "assigned_technician_name": "ปรีชา สุขเกษม",
    "sla_due": "2026-04-20T10:00:00.000Z",
    "sla_risk": "low",
    "scheduled_date": "2026-04-14T00:00:00.000Z",
    "scheduled_time": "10:00",
    "estimated_duration_hrs": 2,
    "labor_cost": 0,
    "equipment_cost": 0,
    "total_cost": 0,
    "attachments": [],
    "dispatch_score": 15,
    "created_date": "2026-04-07T11:59:24.540Z",
    "updated_date": "2026-04-14T12:05:52.461Z"
  },
  {
    "id": "69d5540c8aaf17270d9b1147",
    "order_number": "WO-2026-0005",
    "title": "ติดตั้งระบบแอร์ Tower 1",
    "description": "ติดตั้งเครื่องปรับอากาศ ชั้น 5-8",
    "status": "working",
    "priority": "medium",
    "service_type": "installation",
    "required_skills": [
      "ระบบปรับอากาศ HVAC"
    ],
    "customer_name": "อสังหาริมทรัพย์ The Green Residences",
    "site_name": "The Green Residences - Tower 1",
    "site_latitude": 13.7308,
    "site_longitude": 100.5233,
    "zone_name": "Central",
    "assigned_technician_id": "69d553d48aaf17270d9b1136",
    "assigned_technician_name": "ปรีชา สุขเกษม",
    "sla_due": "2026-04-12T10:00:00.000Z",
    "sla_risk": "low",
    "scheduled_date": "2026-04-09T00:00:00.000Z",
    "scheduled_time": "08:30",
    "estimated_duration_hrs": 6,
    "labor_cost": 2700,
    "equipment_cost": 85000,
    "total_cost": 87700,
    "attachments": [],
    "created_date": "2026-04-07T11:59:24.540Z",
    "updated_date": "2026-04-14T12:05:52.478Z"
  },
  {
    "id": "69d5540c8aaf17270d9b1148",
    "order_number": "WO-2026-0006",
    "title": "ซ่อมไฟฟ้าสายหลักขัดแผงโชลาร์",
    "description": "สายไฟหลักขัด จำเป็นต้องเปลียนใหม่",
    "status": "completed",
    "priority": "high",
    "service_type": "repair",
    "required_skills": [
      "ไฟฟ้ากำลัง",
      "Solar PV"
    ],
    "customer_name": "บริษัท สุริยะ เอนเแอร์จี จำกัด",
    "site_name": "โรงงานสุริยะ อยุธยา",
    "zone_name": "Central",
    "assigned_technician_name": "สมศักดิ์ อินทร์เพชร",
    "sla_due": "2026-04-06T10:00:00.000Z",
    "sla_risk": "low",
    "scheduled_date": "2026-04-05T00:00:00.000Z",
    "scheduled_time": "09:00",
    "estimated_duration_hrs": 3,
    "actual_duration_hrs": 2.5,
    "labor_cost": 875,
    "equipment_cost": 3600,
    "total_cost": 4475,
    "customer_rating": 5,
    "attachments": [],
    "created_date": "2026-04-07T11:59:24.540Z",
    "updated_date": "2026-04-07T11:59:24.540Z"
  },
  {
    "id": "69d528d771d9ea277e046af5",
    "order_number": "WO-MNOSVR01",
    "title": "TRACT",
    "description": "TEST",
    "status": "accepted",
    "priority": "medium",
    "service_type": "maintenance",
    "required_skills": [],
    "site_name": "TEST",
    "zone_name": "North",
    "sla_due": "2026-04-08T15:54:00.000Z",
    "sla_risk": "low",
    "scheduled_date": "2026-04-07T00:00:00.000Z",
    "scheduled_time": "02:58",
    "estimated_duration_hrs": 2,
    "equipment_cost": 0,
    "attachments": [],
    "created_date": "2026-04-07T08:55:03.148Z",
    "updated_date": "2026-04-13T07:28:06.506Z"
  },
  {
    "id": "69cc91601205f1094c5396a5",
    "order_number": "WO-MNFHND7K",
    "title": "test",
    "description": "test",
    "status": "assigned",
    "priority": "medium",
    "service_type": "installation",
    "required_skills": [],
    "assigned_technician_id": "69d553d48aaf17270d9b1134",
    "assigned_technician_name": "สมศักดิ์ อินทร์เพชร",
    "sla_risk": "low",
    "estimated_duration_hrs": 2,
    "attachments": [],
    "dispatch_score": 0,
    "created_date": "2026-03-31T20:30:40.459Z",
    "updated_date": "2026-04-07T12:29:40.243Z"
  }
];

export const workOrderStepDataData = [
  {
    "id": "69dcf6bec6f27c89a7c0a28c",
    "work_order_id": "69d528d771d9ea277e046af5",
    "work_order_number": "WO-MNOSVR01",
    "step_id": "step_ai_1776088633843_0",
    "step_name": "1. ข้อมูลทั่วไป (General Information)",
    "task_id": "task_ai_1776088633843_0_1",
    "task_label": "ที่อยู่สถานที่ติดตั้ง",
    "task_type": "text",
    "value_text": ",jblj",
    "value_materials": [],
    "created_date": "2026-04-13T06:59:26.150Z",
    "updated_date": "2026-04-13T06:59:26.150Z"
  },
  {
    "id": "69dcf6bebbb14134eb3828d4",
    "work_order_id": "69d528d771d9ea277e046af5",
    "work_order_number": "WO-MNOSVR01",
    "step_id": "step_ai_1776088633843_0",
    "step_name": "1. ข้อมูลทั่วไป (General Information)",
    "task_id": "task_ai_1776088633843_0_9",
    "task_label": "ต้องการขายไฟฟ้า",
    "task_type": "checkbox",
    "value_boolean": true,
    "value_materials": [],
    "created_date": "2026-04-13T06:59:26.122Z",
    "updated_date": "2026-04-13T06:59:26.122Z"
  },
  {
    "id": "69dcf6beef4b8c746df5ec9f",
    "work_order_id": "69d528d771d9ea277e046af5",
    "work_order_number": "WO-MNOSVR01",
    "step_id": "step_ai_1776088633843_0",
    "step_name": "1. ข้อมูลทั่วไป (General Information)",
    "task_id": "task_ai_1776088633843_0_0",
    "task_label": "ชื่อ-นามสกุลลูกค้า",
    "task_type": "text",
    "value_text": "jhjvjvh",
    "value_materials": [],
    "created_date": "2026-04-13T06:59:26.121Z",
    "updated_date": "2026-04-13T06:59:26.121Z"
  }
];

export const notificationData = [
  {
    "id": "69d554218aaf17270d9b1155",
    "title": "งานเสี่ยงเกิน SLA - WO-2026-0002",
    "message": "งาน 'บำรุงรักษาประจำปี Solar Farm' กำลังทำงานเกินกำหนด SLA สําหรับ สมศักดิ์ อินทร์เพชร",
    "type": "warning",
    "is_read": false,
    "category": "sla",
    "meta": {
      "category": "sla"
    },
    "created_date": "2026-04-07T11:59:45.568Z",
    "updated_date": "2026-04-07T11:59:45.568Z"
  },
  {
    "id": "69d554218aaf17270d9b1156",
    "title": "มอบหมายงานใหม่ - WO-2026-0003",
    "message": "คุณวิชัย พะเยาว์นาง ได้รับมอบหมายงาน 'ซ่อม Inverter ขัดข้อง' แล้ว",
    "type": "info",
    "is_read": false,
    "category": "dispatch",
    "meta": {
      "category": "dispatch"
    },
    "created_date": "2026-04-07T11:59:45.568Z",
    "updated_date": "2026-04-07T11:59:45.568Z"
  },
  {
    "id": "69d554218aaf17270d9b1157",
    "title": "สต็อคต่ำกว่าขั้นต่ำสุด",
    "message": "วัสดุ 'น้ำยาทำความสะอาดแผง' (สต็อค: 3 BTL) ต่ำกว่าขั้นต่ำที่กำหนด กรุณาสั่งซื้อเพิ่มเติม",
    "type": "warning",
    "is_read": false,
    "category": "system",
    "meta": {
      "category": "system"
    },
    "created_date": "2026-04-07T11:59:45.568Z",
    "updated_date": "2026-04-07T11:59:45.568Z"
  },
  {
    "id": "69d554218aaf17270d9b1158",
    "title": "งานเสร็จแล้ว - WO-2026-0006",
    "message": "สมศักดิ์ อินทร์เพชร เสร็จงาน 'ซ่อมไฟฟ้าสายหลัก' เรียบร้อยแล้ว ลูกค้าให้  5 ดาว",
    "type": "success",
    "is_read": true,
    "category": "schedule",
    "meta": {
      "category": "schedule"
    },
    "created_date": "2026-04-07T11:59:45.568Z",
    "updated_date": "2026-04-07T11:59:45.568Z"
  }
];

