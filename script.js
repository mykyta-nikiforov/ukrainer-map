const bounds = [
    [21.164, 44.095], // Southwest coordinates
    [41.749, 52.547]  // Northeast coordinates
];

mapboxgl.accessToken = 'pk.eyJ1IjoibmlraWZvcm92cGl6emEiLCJhIjoiY2o5ajE2dDVmMHpqOTJxcDd4MHJ5YW5rbSJ9.mIuGjdr5w1vXbyTshvHcww';
var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/nikiforovpizza/ck3bo9ydk264r1cpunsmnvo19',
    center: [32, 48.5],
    zoom: 5,
    maxBounds: bounds
});
map.addControl(new mapboxgl.NavigationControl());


map.on('load', function () {
    map.addSource('places', {
        type: 'geojson',
        data: 'https://raw.githubusercontent.com/nikita-nikiforov/flickr-photomap/develop/photos.json',
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50
    });
    map.addLayer({
        id: "clusters",
        type: "circle",
        source: "photos",
        filter: ["has", "point_count"],
        paint: {
            "circle-color": [
                "step",
                ["get", "point_count"],
                "#51bbd6",
                20,
                "#f1f075",
                50,
                "#f28cb1"
            ],
            "circle-radius": [
                "step",
                ["get", "point_count"],
                20,
                100,
                30,
                750,
                40
            ]
        }
    });
    map.addLayer({
        id: "unclustered-point",
        type: "circle",
        source: "photos",
        filter: ["!", ["has", "point_count"]],
        paint: {
            "circle-color": "#11b4da",
            "circle-radius": 10,
            "circle-stroke-width": 1,
            "circle-stroke-color": "#fff"
        }
    });
    map.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: "photos",
        filter: ["has", "point_count"],
        layout: {
            "text-field": "{point_count_abbreviated}",
            "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
            "text-size": 12
        }
    });
    map.on('click', 'clusters', function (e) {
        var features = map.queryRenderedFeatures(e.point, {layers: ['clusters']});
        var clusterId = features[0].properties.cluster_id,
            point_count = features[0].properties.point_count,
            clusterSource = map.getSource('photos');
        clusterSource.getClusterLeaves(clusterId, point_count, 0, function (err, features) {
            console.log("Clustered features:", features);
            var coordinates = features[0].geometry.coordinates.slice();
            // Ensure that if the map is zoomed out such that multiple
            // copies of the feature are visible, the popup appears
            // over the copy being pointed to.
            while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
            }
            var popup = new mapboxgl.Popup()
                .setLngLat(coordinates)
                .setHTML(buildPopupInnerCarouselHtml(features))
                .setMaxWidth(290)
                .addTo(map);
        });
    });
    map.on('zoom', function (e) {
        var elements = document.getElementsByClassName('mapboxgl-popup');
        Array.from(elements).forEach((element) => {
            element.style.display = 'none';
        })
    })
});

function buildPopupInnerCarouselHtml(features) {
    console.log("features: ", features);
    var html = "<div id=\"photoCarousel\" class=\"carousel\" data-ride=\"carousel\">\n" +
        "  <div class=\"carousel-inner\">";
    features.slice(0, 1).forEach((feature) => {
        html = html + "<div class=\"carousel-item active\" style=''>\n" +
            "<a href='" + feature.properties.url + "' target=\"_blank\">" +
            "      <img class=\"photo-image d-block w-100\" src=\"" + feature.properties.photoUrl + "\">\n" +
            "</a>" +
            "    </div>";
    });
    features.slice(1).forEach((feature) => {
        html = html + "<div class=\"carousel-item\" style=''>\n" +
            "<a href='" + feature.properties.url + "' target=\"_blank\">" +
            "      <img class=\"photo-image d-block w-100\" src=\"" + feature.properties.photoUrl + "\">\n" +
            "</a>" +
            "    </div>";
    });
    html = html + "</div>" + "<a class=\"carousel-control-prev\" href=\"#photoCarousel\" role=\"button\" data-slide=\"prev\">\n" +
        "    <span class=\"carousel-control-prev-icon\" aria-hidden=\"true\"></span>\n" +
        "    <span class=\"sr-only\">Previous</span>\n" +
        "  </a>\n" +
        "  <a class=\"carousel-control-next\" href=\"#photoCarousel\" role=\"button\" data-slide=\"next\">\n" +
        "    <span class=\"carousel-control-next-icon\" aria-hidden=\"true\"></span>\n" +
        "    <span class=\"sr-only\">Next</span>\n" +
        "  </a>" +
        "</div>";
    return html;
}

function buildPopupInnerHtml(feature) {
    var html = "<div id=\"photoCarousel\" class=\"carousel\" data-ride=\"carousel\">\n" +
        "  <div class=\"carousel-inner\">";
    html = html + "<div class=\"carousel-item active\" style=''>\n" +
        "<a href='" + feature.properties.url + "' target=\"_blank\">" +
        "      <img class=\"photo-image d-block w-100\" src=\"" + feature.properties.photoUrl + "\">\n" +
        "</a>" +
        "    </div>";
    html = html + "</div></div>";
    return html;
}

map.on('click', 'unclustered-point', function (e) {
    var coordinates = e.features[0].geometry.coordinates.slice();
    while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
    }
    var popup = new mapboxgl.Popup()
        .setLngLat(coordinates)
        .setHTML(buildPopupInnerHtml(e.features[0]))
        .setMaxWidth(400)
        .addTo(map);
});
