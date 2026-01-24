// 1. Inisialisasi Peta
var map = L.map('map').setView([-7.8014, 110.3931], 15);

// FITUR: Tombol Lokasi Saya (Poin 3)
L.control.locate({
    position: 'topleft',
    strings: { title: "Tunjukkan lokasi saya" },
    locateOptions: { enableHighAccuracy: true, maxZoom: 18 },
    flyTo: true
}).addTo(map);

// 2. Definisi Basemaps
var osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' });
var googleSat = L.tileLayer('https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    attribution: '© Google Satellite'
});
osm.addTo(map);

// 3. Layer Groups
var layerBatasKampung = L.layerGroup(); 
var layerBatasRW = L.layerGroup().addTo(map);
var layerJalan = L.layerGroup().addTo(map);
var layerFasum = L.layerGroup().addTo(map);
var layerBudaya = L.layerGroup();
var layerBankSampah = L.layerGroup();
var layerGapoktan = L.layerGroup();
var layerPaudPosyandu = L.layerGroup();
var layerCCTV = L.layerGroup();
var layerSAH = L.layerGroup();

var searchData = [];

// 4. Fungsi Loading Data
function loadData(url, styleOptions, targetLayer, isPoint = false) {
    fetch(url)
        .then(res => res.json())
        .then(data => {
            var geojson = L.geoJSON(data, {
                style: styleOptions,
                pointToLayer: function(feature, latlng) {
                    if (isPoint) {
                        return L.circleMarker(latlng, {
                            radius: 7,
                            fillColor: styleOptions.color || 'red',
                            color: "#000", weight: 1, opacity: 1, fillOpacity: 0.8
                        });
                    }
                },
                onEachFeature: function (feature, layer) {
                    if (feature.properties) {
                        let isiPopup = "<div style='max-width:250px;'>";
                        
                        // FITUR: Foto Otomatis
                        let foto = feature.properties.Gambar || feature.properties.foto || feature.properties.Foto;
                        if (foto) {
                            isiPopup += `<img src="img/${foto}" class="img-fluid rounded mb-2" style="width:100%; height:150px; object-fit:cover;" onerror="this.style.display='none'">`;
                        }

                        // Tabel Data
                        isiPopup += "<div style='overflow-x:auto;'><table class='table table-sm table-bordered' style='font-size:12px; margin-bottom:0;'><tbody>";
                        for (let key in feature.properties) {
                            if (feature.properties[key] && key !== 'Gambar' && key !== 'foto' && key !== 'Foto') {
                                isiPopup += `<tr><td><strong>${key}</strong></td><td>${feature.properties[key]}</td></tr>`;
                            }
                        }
                        isiPopup += "</tbody></table></div></div>";
                        layer.bindPopup(isiPopup, { maxWidth: 280 });

                        // Daftarkan ke Search Data
                        let nama = feature.properties.Nama || feature.properties.nama || feature.properties.REMARK || feature.properties.rw || "Objek";
                        searchData.push({ name: String(nama), layer: layer });
                    }
                }
            }).addTo(targetLayer);

            // MEMASTIKAN TUMPUKAN: Batas wilayah selalu di belakang (Poin 5)
            if (url.includes('batas')) { geojson.bringToBack(); }
        })
        .catch(err => console.error("Error load:", url));
}

// 5. Eksekusi Load File
loadData('data/batas_kampung.geojson', { color: 'green', weight: 3, fillOpacity: 0.1, dashArray: '5,5' }, layerBatasKampung);
loadData('data/batas_rw.geojson', { color: 'blue', weight: 2, fillOpacity: 0.1 }, layerBatasRW);
loadData('data/jalan.geojson', { color: 'orange', weight: 4 }, layerJalan);
loadData('data/fasum.geojson', { color: 'red' }, layerFasum, true);
loadData('data/budaya_point.geojson', { color: 'purple' }, layerBudaya, true);
loadData('data/banksampah_point.geojson', { color: 'darkgreen' }, layerBankSampah, true);
loadData('data/gapoktan_point.geojson', { color: 'brown' }, layerGapoktan, true);
loadData('data/paud_posyandu_point.geojson', { color: 'pink' }, layerPaudPosyandu, true);
loadData('data/cctv_point.geojson', { color: 'black' }, layerCCTV, true);
loadData('data/sah_line.geojson', { color: 'cyan', weight: 3 }, layerSAH);

// 6. Kontrol Layer
var overlayMaps = {
    "Batas Wilayah": { "Batas Kampung": layerBatasKampung, "Batas RW": layerBatasRW },
    "Sosial": { "Budaya": layerBudaya, "Bank Sampah": layerBankSampah, "PAUD": layerPaudPosyandu },
    "Infrastruktur": { "Jalan": layerJalan, "Fasum": layerFasum, "CCTV": layerCCTV, "SAH": layerSAH }
};
L.control.layers({ "OSM": osm, "Satelit": googleSat }, overlayMaps, { collapsed: true }).addTo(map);

// 7. Legenda
var legend = L.control({position: 'bottomright'});
legend.onAdd = function (map) {
    var div = L.DomUtil.create('div', 'legend-container');
    div.innerHTML = '<h6 style="border-bottom:1px solid #ccc; padding-bottom:3px;">Legenda</h6>' +
        '<div><i style="background:green; width:10px; height:10px; display:inline-block;"></i> Kampung</div>' +
        '<div><i style="background:blue; width:10px; height:10px; display:inline-block;"></i> Batas RW</div>' +
        '<div><i style="background:orange; width:15px; height:3px; display:inline-block;"></i> Jalan</div>' +
        '<div><i style="background:red; width:10px; height:10px; display:inline-block; border-radius:50%;"></i> Fasum</div>';
    return div;
};
legend.addTo(map);

// 8. Search Bar (Auto-complete)
document.getElementById('searchBar').addEventListener('input', function(e) {
    let query = e.target.value.toLowerCase();
    if (query.length > 2) {
        let result = searchData.find(item => item.name.toLowerCase().includes(query));
        if (result) {
            let layer = result.layer;
            if (layer.getBounds) { map.fitBounds(layer.getBounds()); } 
            else if (layer.getLatLng) { map.setView(layer.getLatLng(), 19); }
            layer.openPopup();
        }
    }
});