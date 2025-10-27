// app.js (เวอร์ชันมืออาชีพ)
const map = L.map('map').setView([16.4419, 102.8358], 13);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

let heatLayer = L.layerGroup().addTo(map);
let markerLayer = L.layerGroup().addTo(map);

const overlays = {
  "Heatmap น้ำท่วม": heatLayer,
  "Marker รายงาน": markerLayer
};
L.control.layers(null, overlays, { collapsed: false }).addTo(map);

const ctx = document.getElementById('reportChart').getContext('2d');
const reportChart = new Chart(ctx, {
  type: 'bar',
  data: {
    labels: ["ท่วมขา", "ท่วมเอว", "ท่วมขัง"],
    datasets: [{
      label: 'จำนวนรายงาน',
      data: [0, 0, 0],
      backgroundColor: ["yellow", "orange", "red"]
    }]
  },
  options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, precision: 0 } } }
});

document.getElementById('sendReport').addEventListener('click', () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(position => {
      const level = document.getElementById('waterLevel').value;
      const report = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        level: level,
        timestamp: Date.now()
      };
      db.ref('reports').push(report);
      alert('ส่งรายงานเรียบร้อย!');
    });
  } else {
    alert('ไม่สามารถระบุตำแหน่งได้');
  }
});

db.ref('reports').on('value', snapshot => {
  const data = snapshot.val() || {};
  let counts = { "ท่วมขา": 0, "ท่วมเอว": 0, "ท่วมขัง": 0 };
  heatLayer.clearLayers();
  markerLayer.clearLayers();

  const gridSize = 0.001;
  const clusters = [];

  function findCluster(lat, lng) {
    for (let c of clusters) {
      if (Math.abs(c.lat - lat) < gridSize && Math.abs(c.lng - lng) < gridSize) return c;
    }
    return null;
  }

  for (let id in data) {
    const r = data[id];
    counts[r.level]++;
    let cluster = findCluster(r.lat, r.lng);
    if (cluster) cluster.reports.push(r);
    else clusters.push({ lat: r.lat, lng: r.lng, reports: [r] });
  }

  clusters.forEach(c => {
    let levelCount = { "ท่วมขา": 0, "ท่วมเอว": 0, "ท่วมขัง": 0 };
    c.reports.forEach(r => levelCount[r.level]++);
    let maxLevel = Object.keys(levelCount).reduce((a,b) => levelCount[a] >= levelCount[b] ? a : b);
    const colorMap = { "ท่วมขา": "yellow", "ท่วมเอว": "orange", "ท่วมขัง": "red" };

    for (let level in levelCount) {
      if (levelCount[level] > 0) {
        L.circle([c.lat, c.lng], {
          radius: 20 + levelCount[level]*5,
          color: colorMap[level],
          fillColor: colorMap[level],
          fillOpacity: 0.4,
          weight: 1
        }).addTo(heatLayer);
      }
    }

    let text = `ระดับน้ำสูงสุด: ${maxLevel}<br>จำนวนรายงาน:<br>`;
    for (let level in levelCount) {
      if (levelCount[level] > 0) text += `${level}: ${levelCount[level]}<br>`;
    }
    L.circleMarker([c.lat, c.lng], {
      radius: 8,
      fillColor: 'blue',
      color: '#000',
      fillOpacity: 0.6,
      weight: 1
    }).bindPopup(text).addTo(markerLayer);
  });

  reportChart.data.datasets[0].data = [counts["ท่วมขา"], counts["ท่วมเอว"], counts["ท่วมขัง"]];
  reportChart.update();
});
