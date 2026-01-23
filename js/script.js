// 1. Inisialisasi Peta (Koordinat Tengah Muja Muju)
var map = L.map('map').setView([-7.8014, 110.3931], 15);

// 2. Definisi Basemaps
var osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
});

var googleSat = L.tileLayer('https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    attribution: '© Google Satellite'
});

osm.addTo(map);

// 3. Layer Groups (Urutan definisinya menentukan urutan tumpukan awal)
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

// Array untuk menampung data pencarian
var searchData = [];

// 4. Fungsi Loading Data yang Dioptimalkan
function loadData(url, styleOptions, targetLayer, isPoint = false) {
    fetch(url)
        .then(res => res.json())
        .then(data => {
            var geojson = L.geoJSON(data, {
                style: styleOptions,
                
                // Menangani titik (Point) agar muncul sebagai CircleMarker
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
                    // Fitur Popup Tabel (Akomodir permintaan informasi detail)
                    if (feature.properties) {
                        let tabel = "<div style='overflow-x:auto;'><table class='table table-sm table-bordered' style='font-size:12px; margin-bottom:0;'>";
                        tabel += "<thead><tr><th colspan='2' class='text-center bg-light'>Informasi Objek</th></tr></thead><tbody>";
                        
                        for (let key in feature.properties) {
                            if (feature.properties[key] !== null && feature.properties[key] !== "") {
                                tabel += `<tr><td><strong>${key}</strong></td><td>${feature.properties[key]}</td></tr>`;
                            }
                        }
                        tabel += "</tbody></table></div>";
                        layer.bindPopup(tabel, { maxWidth: 300 });

                        // Mengisi Array Pencarian (Case-insensitive)
                        // Mengakomodir berbagai nama kolom (Nama, nama, REMARK, dsb)
                        let nama = feature.properties.Nama || feature.properties.nama || feature.properties.REMARK || feature.properties.rw || "Objek";
                        searchData.push({ name: String(nama), layer: layer });
                    }
                    
                    // Efek Hover Interaktif
                    layer.on({
                        mouseover: function(e) {
                            var l = e.target;
                            l.setStyle({ weight: 5, color: 'cyan', fillOpacity: 0.5 });
                            if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
                                l.bringToFront(); // Membawa objek ke depan saat hover
                            }
                        },
                        mouseout: function(e) {
                            geojson.resetStyle(e.target);
                        }
                    });
                }
            }).addTo(targetLayer);

            // Fokuskan peta jika memuat layer jalan (opsional)
            if (url.includes('jalan.geojson')) {
                // map.fitBounds(geojson.getBounds()); 
            }
        })
        .catch(err => console.error("Gagal memuat GeoJSON:", url, err));
}

// 5. Eksekusi Load File (Urutan pemanggilan memengaruhi tumpukan visual)
// Poligon paling bawah
loadData('data/batas_kampung.geojson', { color: 'green', weight: 3, fillOpacity: 0.1, dashArray: '5,5' }, layerBatasKampung);
loadData('data/batas_rw.geojson', { color: 'blue', weight: 2, fillOpacity: 0.1 }, layerBatasRW);
// Garis dan titik paling atas
loadData('data/jalan.geojson', { color: 'orange', weight: 4, opacity: 1 }, layerJalan);
loadData('data/fasum.geojson', { color: 'red' }, layerFasum, true);
loadData('data/budaya_point.geojson', { color: 'purple' }, layerBudaya, true);
loadData('data/banksampah_point.geojson', { color: 'darkgreen' }, layerBankSampah, true);
loadData('data/gapoktan_point.geojson', { color: 'brown' }, layerGapoktan, true);
loadData('data/paud_posyandu_point.geojson', { color: 'pink' }, layerPaudPosyandu, true);
loadData('data/cctv_point.geojson', { color: 'black' }, layerCCTV, true);
loadData('data/sah_line.geojson', { color: 'cyan', weight: 3 }, layerSAH);

// 6. Kontrol Layer
var baseMaps = { "OpenStreetMap": osm, "Google Satellite": googleSat };
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

L.control.layers(baseMaps, overlayMaps, { collapsed: true }).addTo(map);

// 7. Penambahan Legenda Visual
var legend = L.control({position: 'bottomright'});
legend.onAdd = function (map) {
    var div = L.DomUtil.create('div', 'legend-container');
    // Styling langsung di JS agar lebih konsisten
    div.style.backgroundColor = 'white';
    div.style.padding = '10px';
    div.style.border = '2px solid rgba(0,0,0,0.2)';
    div.style.borderRadius = '5px';
    div.style.lineHeight = '20px';

    div.innerHTML = '<h6 style="margin-bottom:8px; border-bottom: 1px solid #ccc; padding-bottom: 3px;">Legenda</h6>' +
        '<div><i style="background: green; width:12px; height:12px; display:inline-block; margin-right:8px; opacity:0.6;"></i> Batas Kampung</div>' +
        '<div><i style="background: blue; width:12px; height:12px; display:inline-block; margin-right:8px; opacity:0.6;"></i> Batas RW</div>' +
        '<div><i style="background: orange; width:18px; height:4px; display:inline-block; margin-right:5px; margin-bottom:3px;"></i> Jalan Paving</div>' +
        '<div><i style="background: red; width:12px; height:12px; display:inline-block; border-radius:50%; margin-right:8px;"></i> Fasilitas Umum</div>';
    return div;
};
legend.addTo(map);

// 8. Logika Search Bar
document.getElementById('searchBar').addEventListener('input', function(e) {
    let query = e.target.value.toLowerCase();
    if (query.length > 2) {
        // Mencari objek yang mengandung kata kunci
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