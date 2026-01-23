// 1. Inisialisasi Peta (Koordinat Tengah Muja Muju)
var map = L.map('map').setView([-7.8014, 110.3931], 15);

// FITUR: Lokasi Saya (Geolocation)
L.control.locate({
    position: 'topleft',
    strings: { title: "Tunjukkan lokasi saya" },
    locateOptions: { enableHighAccuracy: true, maxZoom: 18 },
    flyTo: true,
    showPopup: false
}).addTo(map);

// 2. Definisi Basemaps
var osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
});

var googleSat = L.tileLayer('https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    attribution: '© Google Satellite'
});

osm.addTo(map);

// 3. Layer Groups
var layerJalan = L.layerGroup().addTo(map);
var layerFasum = L.layerGroup().addTo(map);
var layerBudaya = L.layerGroup();
var layerBankSampah = L.layerGroup();
var layerGapoktan = L.layerGroup();
var layerPaudPosyandu = L.layerGroup();
var layerCCTV = L.layerGroup();
var layerSAH = L.layerGroup();
var layerBatasRW = L.layerGroup().addTo(map);
var layerBatasKampung = L.layerGroup();

var searchData = [];

// 4. Fungsi Loading Data Utama
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
                            color: "#000",
                            weight: 1,
                            opacity: 1,
                            fillOpacity: 0.8
                        });
                    }
                },
                onEachFeature: function (feature, layer) {
                    if (feature.properties) {
                        let isiPopup = "<div style='max-width:250px;'>";

                        // FITUR: Foto Otomatis (Cari kolom 'Gambar' atau 'foto')
                        let foto = feature.properties.Gambar || feature.properties.foto || feature.properties.Foto;
                        if (foto) {
                            isiPopup += `<img src="img/${foto}" class="img-fluid rounded mb-2" style="width:100%; height:150px; object-fit:cover;" onerror="this.style.display='none'">`;
                        }

                        // Fitur Popup Tabel
                        isiPopup += "<div style='overflow-x:auto;'><table class='table table-sm table-bordered' style='font-size:12px; margin-bottom:0;'><tbody>";
                        for (let key in feature.properties) {
                            if (feature.properties[key] !== null && feature.properties[key] !== "" && key !== 'Gambar' && key !== 'foto' && key !== 'Foto') {
                                isiPopup += `<tr><td><strong>${key}</strong></td><td>${feature.properties[key]}</td></tr>`;
                            }
                        }
                        isiPopup += "</tbody></table></div></div>";
                        layer.bindPopup(isiPopup, { maxWidth: 280 });

                        // Daftarkan ke Search Data
                        let nama = feature.properties.Nama || feature.properties.nama || feature.properties.REMARK || feature.properties.rw || "Objek";
                        searchData.push({ name: String(nama), layer: layer });
                    }
                    
                    // Efek Hover
                    layer.on({
                        mouseover: function(e) {
                            var l = e.target;
                            l.setStyle({ weight: 5, color: 'cyan', fillOpacity: 0.5 });
                            if (l.bringToFront) l.bringToFront();
                        },
                        mouseout: function(e) {
                            geojson.resetStyle(e.target);
                        }
                    });
                }
            }).addTo(targetLayer);

            // FITUR: Menaruh batas wilayah di paling bawah agar tidak menghalangi klik
            if (url.includes('batas')) {
                geojson.bringToBack();
            }
        })
        .catch(err => console.error("Gagal memuat GeoJSON:", url, err));
}

// 5. Eksekusi Load File
loadData('data/batas_kampung.geojson', { color: 'green', weight: 3, fillOpacity: 0.1, dashArray: '5,5' }, layerBatasKampung);
loadData('data/batas_rw.geojson', { color: 'blue', weight: 2, fillOpacity: 0.1 }, layerBatasRW);
loadData('data/jalan.geojson', { color: 'orange', weight: 4, opacity: 1 }, layerJalan);
loadData('data/fasum.geojson', { color: 'red' }, layerFasum, true);
loadData('data/budaya_point.geojson', { color: 'purple' }, layerBudaya, true);
loadData('data/banksampah_point.geojson', { color: 'darkgreen' }, layerBankSampah, true);
loadData('data/gapoktan_point.geojson', { color: 'brown' }, layerGapoktan, true);
loadData('data/paud_posyandu_point.geojson', { color: 'pink' }, layerPaudPosyandu, true);
loadData('data/cctv_point.geojson', { color: 'black' }, layerCCTV, true);
loadData('data/sah_line.geojson', { color: 'cyan', weight: 3 }, layerSAH);

// 6. Kontrol Layer
var overlayMaps = {
    "Batas Wilayah": {
        "Batas Kampung": layerBatasKampung,
        "Batas RW": layerBatasRW
    },
    "Kelompok Masyarakat": {
        "Budaya": layerBudaya,
        "Bank Sampah": layerBankSampah,
        "Gapoktan": layerGapoktan,
        "PAUD & Posyandu": layerPaudPosyandu
    },
    "Infrastruktur": {
        "CCTV": layerCCTV,
        "Saluran Air Hujan (SAH)": layerSAH,
        "Jalan Lingkungan": layerJalan,
        "Fasilitas Umum": layerFasum,
    }
};

L.control.layers({ "OpenStreetMap": osm, "Google Satellite": googleSat }, overlayMaps, { collapsed: true }).addTo(map);

// 7. Penambahan Legenda Visual
var legend = L.control({position: 'bottomright'});
legend.onAdd = function (map) {
    var div = L.DomUtil.create('div', 'legend-container');
    div.style.backgroundColor = 'white';
    div.style.padding = '10px';
    div.style.border = '2px solid rgba(0,0,0,0.2)';
    div.style.borderRadius = '5px';
    div.style.lineHeight = '20px';

    div.innerHTML = '<h6 style="margin-bottom:8px; border-bottom: 1px solid #ccc; padding-bottom: 3px;">Legenda</h6>' +
        '<div><i style="background: green; width:12px; height:12px; display:inline-block; margin-right:8px; opacity:0.6;"></i> Batas Kampung</div>' +
        '<div><i style="background: blue; width:12px; height:12px; display:inline-block; margin-right:8px; opacity:0.6;"></i> Batas RW</div>' +
        '<div><i style="background: orange; width:18px; height:4px; display:inline-block; margin-right:5px; margin-bottom:3px;"></i> Jalan Paving</div>' +
        '<div><i style="background: cyan; width:18px; height:4px; display:inline-block; margin-right:5px; margin-bottom:3px;"></i> Saluran (SAH)</div>' +
        '<div><i style="background: red; width:10px; height:10px; display:inline-block; border-radius:50%; margin-right:8px;"></i> Fasilitas Umum</div>';
    return div;
};
legend.addTo(map);

// 8. Logika Search Bar
document.getElementById('searchBar').addEventListener('input', function(e) {
    let query = e.target.value.toLowerCase();
    if (query.length > 2) {
        let result = searchData.find(item => item.name.toLowerCase().includes(query));
        if (result) {
            let layer = result.layer;
            if (layer.getBounds) {
                map.fitBounds(layer.getBounds());
            } else if (layer.getLatLng) {
                map.setView(layer.getLatLng(), 19);
            }
            layer.openPopup();
        }
    }
});