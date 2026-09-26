# Weather App

A simple weather app. Search for a city or use your current location to see today's weather and an hourly forecast, with icons that reflect the actual conditions and time of day.

🔗 **Live demo:** https://rosumadalin.github.io/Weather-App/ — no login required, works immediately.

## Features

- **Search by city** — resolves the city name to coordinates before fetching the forecast
- **Use current location** — via the browser's Geolocation API
- **Today's weather + hourly forecast** — temperature, wind speed, humidity
- **Weather icons** — vary by condition (sunny, cloudy, rainy, snowy, thunder) and by day/night

## Tech Stack

- Vanilla JavaScript, HTML, CSS (no build step, no framework)
- [Open-Meteo](https://open-meteo.com/) — geocoding and forecast API, no API key required
- Hosted on GitHub Pages

## Running Locally

This is a static site with no build step — clone the repo and open `index.html` directly in a browser, or serve the folder with any static file server, for example:

```bash
npx serve .
```
