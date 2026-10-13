// WEB GIS LAB 05
// LIVE ENVIRONMENTAL MONITORING (Weather + Air Quality)

// 1. Create Map
const map = L.map("map").setView([30.3753, 69.3451], 5);

// 2. Base Maps
const osm = L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    { attribution: "© OpenStreetMap contributors", maxZoom: 19 }
).addTo(map); // default basemap

const satellite = L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    { attribution: "Tiles © Esri", maxZoom: 19 }
);

L.control.layers({
    "OpenStreetMap": osm,
    "Satellite": satellite
}).addTo(map);

// 3. Environmental Layer
const weatherLayer = L.layerGroup().addTo(map);

// 4. Locations (10 areas)
const locations = [
    { name: "Islamabad", latitude: 33.6844, longitude: 73.0479 },
    { name: "Rawalpindi", latitude: 33.5651, longitude: 73.0169 },
    { name: "Lahore", latitude: 31.5204, longitude: 74.3587 },
    { name: "Faisalabad", latitude: 31.4504, longitude: 73.1350 },
    { name: "Multan", latitude: 30.1575, longitude: 71.5249 },
    { name: "Peshawar", latitude: 34.0151, longitude: 71.5785 },
    { name: "Quetta", latitude: 30.1798, longitude: 66.9750 },
    { name: "Karachi", latitude: 24.8607, longitude: 67.0011 },
    { name: "Gilgit", latitude: 35.9208, longitude: 74.3080 },
    { name: "Gwadar", latitude: 25.1216, longitude: 62.3254 }
];

// App state
let currentMode = "temperature"; // "temperature" or "aqi"
let cityData = [];               // [{ location, weather, air }]
const markers = {};              // marker for each city name

// 5. Get Weather Data from API
async function getWeather(location) {
    const url =
        `https://api.open-meteo.com/v1/forecast` +
        `?latitude=${location.latitude}` +
        `&longitude=${location.longitude}` +
        `&current=temperature_2m,relative_humidity_2m,apparent_temperature,` +
        `precipitation,rain,weather_code,cloud_cover,pressure_msl,` +
        `wind_speed_10m,wind_direction_10m,wind_gusts_10m` +
        `&timezone=auto`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        return data.current ? data : null;
    } catch (error) {
        console.error("Error retrieving weather data.", error);
        return null;
    }
}

// 5b. Get Air Quality Data from API
async function getAirQuality(location) {
    const url =
        `https://air-quality-api.open-meteo.com/v1/air-quality` +
        `?latitude=${location.latitude}` +
        `&longitude=${location.longitude}` +
        `&current=us_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,` +
        `sulphur_dioxide,ozone` +
        `&timezone=auto`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        return data.current ? data : null;
    } catch (error) {
        console.error("Error retrieving air quality data.", error);
        return null;
    }
}

// 6. Helper functions
function getTemperatureRadius(t) {
    if (t >= 35) return 16;
    if (t >= 30) return 12;
    if (t >= 25) return 9;
    return 6;
}

// Palette: deep red > coral > amber > teal > blue
function getTemperatureColor(t) {
    if (t >= 35) return "#ff4d6d";
    if (t >= 30) return "#ff9248";
    if (t >= 25) return "#ffd166";
    if (t >= 15) return "#4fd1a5";
    return "#5ab8ff";
}

function getAqiInfo(aqi) {
    if (aqi === null || aqi === undefined) return { label: "No data", color: "#8aa3b4" };
    if (aqi <= 50) return { label: "Good", color: "#3ddc97" };
    if (aqi <= 100) return { label: "Moderate", color: "#ffd23f" };
    if (aqi <= 150) return { label: "Unhealthy for Sensitive", color: "#ff9248" };
    if (aqi <= 200) return { label: "Unhealthy", color: "#ff4d6d" };
    if (aqi <= 300) return { label: "Very Unhealthy", color: "#b66bff" };
    return { label: "Hazardous", color: "#9b1d46" };
}

function getAqiRadius(aqi) {
    if (aqi === null || aqi === undefined) return 6;
    return Math.max(7, Math.min(20, 7 + aqi / 15));
}

function getWeatherDescription(code) {
    const map = {
        0: ["Clear sky", "☀️"], 1: ["Mainly clear", "🌤️"], 2: ["Partly cloudy", "⛅"],
        3: ["Overcast", "☁️"], 45: ["Fog", "🌫️"], 48: ["Rime fog", "🌫️"],
        51: ["Light drizzle", "🌦️"], 53: ["Drizzle", "🌦️"], 55: ["Dense drizzle", "🌦️"],
        56: ["Freezing drizzle", "🌧️"], 57: ["Freezing drizzle", "🌧️"],
        61: ["Light rain", "🌧️"], 63: ["Rain", "🌧️"], 65: ["Heavy rain", "🌧️"],
        66: ["Freezing rain", "🌧️"], 67: ["Freezing rain", "🌧️"],
        71: ["Light snow", "🌨️"], 73: ["Snow", "🌨️"], 75: ["Heavy snow", "❄️"],
        77: ["Snow grains", "❄️"], 80: ["Rain showers", "🌦️"], 81: ["Rain showers", "🌧️"],
        82: ["Violent showers", "⛈️"], 85: ["Snow showers", "🌨️"],
        86: ["Heavy snow showers", "❄️"], 95: ["Thunderstorm", "⛈️"],
        96: ["Thunderstorm with hail", "⛈️"], 99: ["Thunderstorm with hail", "⛈️"]
    };
    const item = map[code] || ["Unknown", "❔"];
    return { text: item[0], icon: item[1] };
}

function getWindDirection(degrees) {
    const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    return dirs[Math.round(degrees / 45) % 8];
}

function fmt(value, decimals = 1) {
    if (value === null || value === undefined) return "--";
    return Number(value).toFixed(decimals);
}

function setStatus(type, message) {
    const status = document.getElementById("status");
    status.className = type;
    status.innerHTML = message;
}

// ----------------------
// 7. Display Weather
// ----------------------
function displayWeather(location, weatherData, airData) {
    const w = weatherData.current;
    const a = airData ? airData.current : null;

    const temperature = w.temperature_2m;
    const aqi = a ? a.us_aqi : null;
    const aqiInfo = getAqiInfo(aqi);
    const desc = getWeatherDescription(w.weather_code);

    let radius, fillColor;
    if (currentMode === "aqi") {
        radius = getAqiRadius(aqi);
        fillColor = aqiInfo.color;
    } else {
        radius = getTemperatureRadius(temperature);
        fillColor = getTemperatureColor(temperature);
    }

    const size = Math.round(radius * 2 + 20);
    const label = currentMode === "aqi"
        ? (aqi !== null ? aqi : "--")
        : Math.round(temperature) + "°";
    const marker = L.marker([location.latitude, location.longitude], {
        icon: L.divIcon({
            className: "pin-wrap",
            html: `<div class="pin" style="width:${size}px;height:${size}px;background:${fillColor};font-size:${Math.round(size * 0.34)}px"><span>${label}</span></div>`,
            iconSize: [size, size],
            iconAnchor: [size / 2, size / 2],
            popupAnchor: [0, -size / 2]
        })
    });

    marker.bindTooltip(
        `${location.name}: ${fmt(temperature)} °C | AQI ${aqi !== null ? aqi : "--"}`
    );

    marker.bindPopup(`
        <div class="popup" style="--c:${fillColor}">
            <h3>${location.name}</h3>
            <div class="popup-desc">${desc.icon} ${desc.text}</div>

            <h4>Weather</h4>
            <table>
                <tr><td>Temperature</td><td>${fmt(temperature)} °C</td></tr>
                <tr><td>Feels like</td><td>${fmt(w.apparent_temperature)} °C</td></tr>
                <tr><td>Relative humidity</td><td>${w.relative_humidity_2m} %</td></tr>
                <tr><td>Cloud cover</td><td>${w.cloud_cover} %</td></tr>
                <tr><td>Precipitation</td><td>${w.precipitation} mm</td></tr>
                <tr><td>Rain</td><td>${w.rain} mm</td></tr>
                <tr><td>Pressure</td><td>${fmt(w.pressure_msl, 0)} hPa</td></tr>
                <tr><td>Wind speed</td><td>${fmt(w.wind_speed_10m)} km/h</td></tr>
                <tr><td>Wind direction</td><td>${w.wind_direction_10m}° (${getWindDirection(w.wind_direction_10m)})</td></tr>
                <tr><td>Wind gusts</td><td>${fmt(w.wind_gusts_10m)} km/h</td></tr>
            </table>

            <h4>Air Quality</h4>
            ${a ? `
            <table>
                <tr>
                    <td>US AQI</td>
                    <td><span class="aqi-badge" style="background:${aqiInfo.color}">${aqi} - ${aqiInfo.label}</span></td>
                </tr>
                <tr><td>PM2.5</td><td>${fmt(a.pm2_5)} µg/m³</td></tr>
                <tr><td>PM10</td><td>${fmt(a.pm10)} µg/m³</td></tr>
                <tr><td>Carbon monoxide (CO)</td><td>${fmt(a.carbon_monoxide, 0)} µg/m³</td></tr>
                <tr><td>Nitrogen dioxide (NO₂)</td><td>${fmt(a.nitrogen_dioxide)} µg/m³</td></tr>
                <tr><td>Sulphur dioxide (SO₂)</td><td>${fmt(a.sulphur_dioxide)} µg/m³</td></tr>
                <tr><td>Ozone (O₃)</td><td>${fmt(a.ozone)} µg/m³</td></tr>
            </table>
            ` : `<div>Air quality data not available.</div>`}

            <div class="popup-time">Observation time: ${w.time}</div>
        </div>
    `);

    marker.addTo(weatherLayer);
    markers[location.name] = marker;
}

// Draw all markers again (on load and when the mode changes)
function drawAllMarkers() {
    weatherLayer.clearLayers();
    cityData.forEach(function (item) {
        displayWeather(item.location, item.weather, item.air);
    });
    legend.update();
}

// Sidebar list of cities
function renderCityList() {
    const list = document.getElementById("cityList");
    list.innerHTML = "";

    cityData.forEach(function (item) {
        const w = item.weather.current;
        const aqi = item.air ? item.air.current.us_aqi : null;
        const aqiInfo = getAqiInfo(aqi);
        const desc = getWeatherDescription(w.weather_code);

        const card = document.createElement("div");
        card.className = "city-card";
        card.style.borderLeftColor =
            currentMode === "aqi" ? aqiInfo.color : getTemperatureColor(w.temperature_2m);

        card.innerHTML = `
            <div class="city-top">
                <span class="city-name">${item.location.name}</span>
                <span class="city-temp">${fmt(w.temperature_2m)} °C</span>
            </div>
            <div class="city-desc">${desc.icon} ${desc.text}</div>
            <div class="city-bottom">
                <span>💧 ${w.relative_humidity_2m}% &nbsp; 💨 ${fmt(w.wind_speed_10m)} km/h</span>
                <span class="aqi-badge" style="background:${aqiInfo.color}">
                    AQI ${aqi !== null ? aqi : "--"}
                </span>
            </div>
        `;

        card.addEventListener("click", function () {
            map.flyTo([item.location.latitude, item.location.longitude], 9);
            markers[item.location.name].openPopup();
        });

        list.appendChild(card);
    });
}

// Summary cards at the top
function renderStats() {
    const stats = document.getElementById("stats");
    if (cityData.length === 0) {
        stats.innerHTML = "";
        return;
    }

    const byTemp = cityData.slice().sort(function (a, b) {
        return b.weather.current.temperature_2m - a.weather.current.temperature_2m;
    });
    const hottest = byTemp[0];
    const coldest = byTemp[byTemp.length - 1];

    const withAqi = cityData.filter(function (c) {
        return c.air && c.air.current.us_aqi !== null;
    });
    withAqi.sort(function (a, b) {
        return b.air.current.us_aqi - a.air.current.us_aqi;
    });

    const avgHumidity =
        cityData.reduce(function (sum, c) {
            return sum + c.weather.current.relative_humidity_2m;
        }, 0) / cityData.length;

    let cards = `
        <div class="stat-card" style="border-top-color:#ff4d6d">
            <div class="stat-icon">🔥</div>
            <div class="stat-title">Hottest city</div>
            <div class="stat-value">${hottest.location.name}</div>
            <div class="stat-sub">${fmt(hottest.weather.current.temperature_2m)} °C</div>
        </div>
        <div class="stat-card" style="border-top-color:#5ab8ff">
            <div class="stat-icon">❄️</div>
            <div class="stat-title">Coolest city</div>
            <div class="stat-value">${coldest.location.name}</div>
            <div class="stat-sub">${fmt(coldest.weather.current.temperature_2m)} °C</div>
        </div>
    `;

    if (withAqi.length > 0) {
        const worst = withAqi[0];
        const best = withAqi[withAqi.length - 1];
        const worstInfo = getAqiInfo(worst.air.current.us_aqi);
        const bestInfo = getAqiInfo(best.air.current.us_aqi);

        cards += `
        <div class="stat-card" style="border-top-color:${worstInfo.color}">
            <div class="stat-icon">😷</div>
            <div class="stat-title">Worst air quality</div>
            <div class="stat-value">${worst.location.name}</div>
            <div class="stat-sub">AQI ${worst.air.current.us_aqi} (${worstInfo.label})</div>
        </div>
        <div class="stat-card" style="border-top-color:${bestInfo.color}">
            <div class="stat-icon">🌿</div>
            <div class="stat-title">Best air quality</div>
            <div class="stat-value">${best.location.name}</div>
            <div class="stat-sub">AQI ${best.air.current.us_aqi} (${bestInfo.label})</div>
        </div>
        `;
    }

    cards += `
        <div class="stat-card">
            <div class="stat-icon">💧</div>
            <div class="stat-title">Average humidity</div>
            <div class="stat-value">${fmt(avgHumidity, 0)} %</div>
            <div class="stat-sub">${cityData.length} locations</div>
        </div>
    `;

    stats.innerHTML = cards;
}

// ----------------------
// 8. Load Environmental Data
// ----------------------
async function loadEnvironmentalData() {
    setStatus("loading", "⏳ Retrieving environmental data...");

    const results = await Promise.all(
        locations.map(async function (location) {
            const r = await Promise.all([
                getWeather(location),
                getAirQuality(location)
            ]);
            return { location: location, weather: r[0], air: r[1] };
        })
    );

    cityData = results.filter(function (item) {
        return item.weather !== null;
    });

    if (cityData.length === 0) {
        setStatus("error", "❌ Could not retrieve data from the API. Check your internet connection.");
        return;
    }

    drawAllMarkers();
    renderCityList();
    renderStats();

    document.getElementById("lastUpdated").innerHTML =
        "Last update: " + new Date().toLocaleTimeString();

    if (cityData.length < locations.length) {
        setStatus("success", `✅ Data retrieved for ${cityData.length} of ${locations.length} locations.`);
    } else {
        setStatus("success", "✅ Environmental data successfully retrieved from API.");
    }
}

// ----------------------
// 9. Legend (changes with the selected mode)
// ----------------------
const legend = L.control({ position: "bottomright" });

legend.onAdd = function () {
    this._div = L.DomUtil.create("div", "legend");
    this.update();
    return this._div;
};

legend.update = function () {
    if (!this._div) return;

    if (currentMode === "aqi") {
        this._div.innerHTML = `
            <b>US AQI</b>
            <span class="legend-dot" style="background:#3ddc97"></span>0–50 Good<br>
            <span class="legend-dot" style="background:#ffd23f"></span>51–100 Moderate<br>
            <span class="legend-dot" style="background:#ff9248"></span>101–150 Sensitive<br>
            <span class="legend-dot" style="background:#ff4d6d"></span>151–200 Unhealthy<br>
            <span class="legend-dot" style="background:#b66bff"></span>201–300 Very Unhealthy<br>
            <span class="legend-dot" style="background:#9b1d46"></span>301+ Hazardous
        `;
    } else {
        this._div.innerHTML = `
            <b>Temperature</b>
            <span class="legend-dot" style="background:#ff4d6d"></span>≥ 35 °C<br>
            <span class="legend-dot" style="background:#ff9248"></span>30–34 °C<br>
            <span class="legend-dot" style="background:#ffd166"></span>25–29 °C<br>
            <span class="legend-dot" style="background:#4fd1a5"></span>15–24 °C<br>
            <span class="legend-dot" style="background:#5ab8ff"></span>&lt; 15 °C
        `;
    }
};

legend.addTo(map);

// ----------------------
// Buttons: mode switch and refresh
// ----------------------
document.querySelectorAll(".mode-btn").forEach(function (button) {
    button.addEventListener("click", function () {
        currentMode = button.getAttribute("data-mode");

        document.querySelectorAll(".mode-btn").forEach(function (b) {
            b.classList.remove("active");
        });
        button.classList.add("active");

        drawAllMarkers();
        renderCityList();
    });
});

document.getElementById("refreshBtn").addEventListener("click", loadEnvironmentalData);

// ----------------------
// 10. Initial Data Load
// ----------------------
loadEnvironmentalData();

// ----------------------
// 11. Automatic Update (every 10 minutes)
// ----------------------
setInterval(loadEnvironmentalData, 10 * 60 * 1000);
