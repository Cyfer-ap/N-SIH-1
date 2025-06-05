document.addEventListener("DOMContentLoaded", function () {
  const latInput = document.getElementById("lat-input");
  const lonInput = document.getElementById("lon-input");

  const map = L.map("map").setView([20, 0], 2);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  let marker;

  map.on("click", function (e) {
    const { lat, lng } = e.latlng;
    latInput.value = lat.toFixed(6);
    lonInput.value = lng.toFixed(6);

    if (marker) {
      marker.setLatLng(e.latlng);
    } else {
      marker = L.marker(e.latlng).addTo(map);
    }
  });
});
