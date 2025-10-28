// ✅ เริ่มต้น Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ✅ สร้างแผนที่ธีมมืด (Dark Theme)
const map = L.map('map').setView([16.4419, 102.835], 13);

// ใช้ tile layer แบบ Dark จาก CartoDB
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; OpenStreetMap contributors &copy; CartoDB'
}).addTo(map);

// ✅ ฟังก์ชันส่งรายงานสถานะน้ำ
function sendReport(level) {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(position => {
      const report = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        level,
        timestamp: Date.now()
      };
      db.ref('reports').push(report);
      alert(`✅ ส่งรายงาน "${level}" แล้ว`);
    }, () => {
      alert('⚠️ ไม่สามารถระบุตำแหน่งได้');
    });
  } else {
    alert('⚠️ เบราว์เซอร์ของคุณไม่รองรับ GPS');
  }
}

// ✅ เมื่อผู้ใช้กดปุ่มระดับน้ำ ให้ส่งข้อมูลทันที
document.querySelectorAll('.report-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const level = btn.dataset.level;
    sendReport(level);
  });
});

// ✅ ฟังก์ชันแสดงหมุดจาก Firebase
db.ref('reports').on('value', snapshot => {
  const data = snapshot.val();
  if (!data) return;

  // ลบ marker เก่าออกก่อน
  map.eachLayer(layer => {
    if (layer instanceof L.CircleMarker) map.removeLayer(layer);
  });

  // วาด marker ใหม่ทั้งหมด
  Object.values(data).forEach(r => {
    const color =
      r.level === 'ท่วมขา' ? '#2196f3' :  // 🔵 ฟ้าแทนเหลือง
      r.level === 'ท่วมเอว' ? '#ff9800' :
      '#f44336';
    L.circleMarker([r.lat, r.lng], {
      radius: 8,
      color,
      fillColor: color,
      fillOpacity: 0.85
    }).addTo(map)
      .bindPopup(`ระดับน้ำ: ${r.level}`);
  });
});

// ✅ ฟังก์ชันลบรายงานเก่ากว่า 7 วัน (604800000 มิลลิวินาที)
function cleanupOldReports() {
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  db.ref('reports').once('value', snapshot => {
    const data = snapshot.val();
    if (!data) return;

    Object.entries(data).forEach(([key, report]) => {
      if (report.timestamp < sevenDaysAgo) {
        db.ref('reports/' + key).remove();
        console.log(`🗑️ ลบรายงานเก่ากว่า 7 วัน: ${key}`);
      }
    });
  });
}

// ✅ เรียกทำความสะอาดข้อมูลทุกครั้งที่มีคนเปิดเว็บ
cleanupOldReports();
