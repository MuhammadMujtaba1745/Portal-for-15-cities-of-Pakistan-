# Pakistan Environmental Watch

A Web GIS application that displays live temperature and air quality for 10 major cities in Pakistan on an interactive map. Built with Leaflet and the free Open-Meteo APIs, with no backend or API key required.

## Features

- **Live data** for 10 cities: Islamabad, Rawalpindi, Lahore, Faisalabad, Multan, Peshawar, Quetta, Karachi, Gilgit and Gwadar
- **Two map modes**: color the markers by temperature or by US AQI
- **Detailed popups** with weather (temperature, feels-like, humidity, cloud cover, precipitation, pressure, wind) and air quality (PM2.5, PM10, CO, NO₂, SO₂, O₃)
- **Summary cards** showing the hottest, coolest, best-air and worst-air cities, plus average humidity
- **City sidebar**: click a city card to fly to it on the map and open its popup
- **Dynamic legend** that updates with the selected mode
- **Basemap switcher**: OpenStreetMap and Esri Satellite
- **Auto-refresh** every 10 minutes, plus a manual refresh button
- **Responsive layout** for desktop and mobile

## Tech Stack

- HTML5, CSS3, vanilla JavaScript
- [Leaflet 1.9.4](https://leafletjs.com/) for mapping
- [Open-Meteo Weather API](https://open-meteo.com/en/docs)
- [Open-Meteo Air Quality API](https://open-meteo.com/en/docs/air-quality-api)
- Google Fonts (Sora)

## Project Structure

```
├── index.html   # Page structure
├── style.css    # Dark theme, layout, map symbology
├── script.js    # Map setup, API calls, rendering logic
└── README.md
```

## Getting Started

No build step or dependencies are needed.

1. Clone the repository
```bash
   git clone https://github.com/<your-username>/<your-repo>.git
   cd <your-repo>
```
2. Open `index.html` in your browser, or serve it locally:
```bash
   python -m http.server 8000
```
   Then visit `http://localhost:8000`.

An internet connection is required to load map tiles and API data.

## Deployment (GitHub Pages)

1. Push the project to GitHub
2. Go to **Settings → Pages**
3. Under **Source**, choose the `main` branch and the `/ (root)` folder
4. Your site will be live at `https://<your-username>.github.io/<your-repo>/`

## Data Sources & Credits

- Weather and air quality data: [Open-Meteo](https://open-meteo.com/) (free for non-commercial use)
- Map tiles: © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors, Tiles © Esri
- Mapping library: [Leaflet](https://leafletjs.com/)

## Customization

To add or change cities, edit the `locations` array in `script.js`:

```javascript
{ name: "CityName", latitude: 00.0000, longitude: 00.0000 }
```

## Course

Web GIS Applications | BS Remote Sensing and GIS

## License

This project is for educational purposes. Add a license of your choice (e.g. MIT) if you plan to share it publicly.
