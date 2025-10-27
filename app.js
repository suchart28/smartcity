// Firebase เริ่มต้น
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// สร้างแผนที่ Leaflet
const map = L.map('map').setView([16.4419, 102.835], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

// ฟังก์ชันส่งข้อมูล
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
      alert(`ส่งรายงาน \"${level}\" แล้ว ✅`);
    }, () => {
      alert('⚠️ ไม่สามารถระบุตำแหน่งได้');
    });
  } else {
    alert('⚠️ เบราว์เซอร์ของคุณไม่รองรับ GPS');
  }
}

// เมื่อคลิกปุ่มระดับน้ำ
document.querySelectorAll('.report-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const level = btn.dataset.level;
    sendReport(level);
  });
});

// แสดงหมุดจาก Firebase
db.ref('reports').on('value', snapshot => {
  const data = snapshot.val();
  if (!data) return;
  map.eachLayer(layer => {
    if (layer instanceof L.CircleMarker) map.removeLayer(layer);
  });
  Object.values(data).forEach(r => {
    const color = r.level === 'ท่วมขา' ? '#fbc02d'
                : r.level === 'ท่วมเอว' ? '#ff9800'
                : '#f44336';
    L.circleMarker([r.lat, r.lng], {
      radius: 8,
      color,
      fillColor: color,
      fillOpacity: 0.7
    }).addTo(map).bindPopup(`ระดับน้ำ: ${r.level}`);
  });
});