// 1. Inisialisasi Peta (Koordinat Tengah Muja Muju)
var map = L.map('map').setView([-7.8014, 110.3931], 15);

// 2. Definisi Basemaps
var osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
});

var googleSat = L.tileLayer('https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
    subdomains:['mt0','mt1','mt2','mt3'],
    attribution: '© Google Satellite'
});

osm.addTo(map); // Default basemap

// 3. Layer Groups untuk Kategorisasi
var layerBatasKampung = L.layerGroup().addTo(map);
var layerBatasRW = L.layerGroup().addTo(map);
var layerFasum = L.layerGroup().addTo(map);
var layerJalan = L.layerGroup().addTo(map);

// Array untuk menampung data pencarian
var searchData = [];

// 4. Fungsi Loading Data & Interaktivitas
function loadData(url, styleOptions, targetLayer, isPoint = false) {
    fetch(url)
        .then(res => res.json())
        .then(data => {
            L.geoJSON(data, {
                style: styleOptions,
                pointToLayer: function(feature, latlng) {
                    if(isPoint) return L.circleMarker(latlng, { radius: 6, fillOpacity: 0.8 });
                    return L.marker(latlng);
                },
                onEachFeature: function (feature, layer) {
                    // Ambil properti utama untuk popup (misal kolom 'nama' atau 'keterangan')
                    let namaObjek = feature.properties.nama || feature.properties.NAME || "Tanpa Nama";
                    
                    layer.bindPopup(`<strong>Info:</strong> ${namaObjek}`);

                    // Masukkan ke array pencarian
                    searchData.push({
                        name: namaObjek,
                        layer: layer
                    });
                }
            }).addTo(targetLayer);
        });
}

// 5. Eksekusi Load File (Sesuai list di gambar kamu)
loadData('data/batas_kampung.geojson', { color: 'green', weight: 2, fillOpacity: 0.1, dashArray: '5,5' }, layerBatasKampung);
loadData('data/batas_rw.geojson', { color: 'blue', weight: 1, fillOpacity: 0.1 }, layerBatasRW);
loadData('data/jalan.geojson', { color: 'orange', weight: 3 }, layerJalan);
loadData('data/fasum.geojson', { color: 'red' }, layerFasum, true);

// 6. Kontrol Layer (Legenda/Layer Switcher)
var baseMaps = {
    "OpenStreetMap": osm,
    "Google Satellite": googleSat
};

var overlayMaps = {
    "Batas Kampung": layerBatasKampung,
    "Batas RW": layerBatasRW,
    "Jalan Paving": layerJalan,
    "Fasilitas Umum": layerFasum
};

L.control.layers(baseMaps, overlayMaps, { collapsed: false }).addTo(map);

// 7. Logika Search Bar
document.getElementById('searchBar').addEventListener('input', function(e) {
    let query = e.target.value.toLowerCase();
    
    // Cari di array searchData
    let result = searchData.find(item => item.name.toLowerCase().includes(query));
    
    if (result && query.length > 2) {
        let layer = result.layer;
        
        // Jika point, langsung ke center. Jika line/poly, ke bounds.
        if (layer.getBounds) {
            map.fitBounds(layer.getBounds());
        } else if (layer.getLatLng) {
            map.setView(layer.getLatLng(), 18);
        }
        layer.openPopup();
    }
});