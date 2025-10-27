// Firebase เริ่มต้น
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// สร้างแผนที่ Leaflet
const map = L.map('map').setView([16.4419, 102.835], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

// เก็บระดับน้ำที่เลือก
let selectedLevel = null;

const buttons = document.querySelectorAll('.report-btn');
buttons.forEach(btn => {
  btn.addEventListener('click', () => {
    buttons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedLevel = btn.dataset.level;
  });
});

// ปุ่มส่งรายงาน
document.getElementById('sendReport').addEventListener('click', () => {
  if (!selectedLevel) {
    alert('กรุณาเลือกระดับน้ำก่อนส่งรายงาน');
    return;
  }

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(position => {
      const report = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        level: selectedLevel,
        timestamp: Date.now()
      };
      db.ref('reports').push(report);
      alert('ส่งรายงานเรียบร้อย!');
    });
  } else {
    alert('ไม่สามารถระบุตำแหน่งได้');
  }
});

// ดึงข้อมูลรายงานทั้งหมดมาแสดงบนแผนที่
db.ref('reports').on('value', snapshot => {
  const data = snapshot.val();
  if (!data) return;
  map.eachLayer(layer => {
    if (layer instanceof L.CircleMarker) map.removeLayer(layer);
  });
  Object.values(data).forEach(r => {
    let color = r.level === 'ท่วมขา' ? '#fbc02d' :
                r.level === 'ท่วมเอว' ? '#ff9800' :
                '#f44336';
    L.circleMarker([r.lat, r.lng], {
      radius: 8,
      color,
      fillColor: color,
      fillOpacity: 0.7
    }).addTo(map).bindPopup(`ระดับน้ำ: ${r.level}`);
  });
});