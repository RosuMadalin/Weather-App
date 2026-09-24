// declaram o constanta cu endpoint.ul url, unde face request.ul pentru a prelua coordonatele
const API_GEOLOCATION_URL = "https://geocoding-api.open-meteo.com/v1/search"
const API_FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
//preluam formularul pe baza id.ului
const cityForm = document.querySelector('#cityForm');

const locationBtn = document.querySelector('#locationBtn');
//adaugam un eveniment de trimitere
cityForm.addEventListener('submit', onCityFormSubmit);
locationBtn.addEventListener('click', onLocationBtnClick);


//definim functia de mai sus onCityFormSubmit, cu un parametru event
async function onCityFormSubmit(event) {
    // pentru a preveni browserul sa ne 'restarteze' pagina
     event.preventDefault();

     clearContent();

    // preluom inputul pentru numele orasului
    const cityInput = cityForm.querySelector('#city');
    //din acest Input trebuie preluata valoarea, trim elimina spatiile de la inceputul si finalul cuvantului
    const cityName = cityInput.value.trim();

    // validare "required" pentru sugerare text
    if (!cityName) {
        displayError("Introduceti numele unui oras");
        return;
    }

    displayLoading();

    try {
        const cityCoordinates = await getCityCoordinates(cityName);
    // verificam daca aceste coordonate au valoarea null
        if(cityCoordinates === null) {
            hideLoading();
            displayError(`Nu s.au putut prelua coordonatele orasului ${cityName}`);
            return;
        }

        const weatherResponse = await getWeather(cityCoordinates.lat, cityCoordinates.long);
        
        const weatherData = parseApiData(weatherResponse);
        console.log(weatherData);

        hideLoading();

        displayWeather(cityName, weatherData);

        cityInput.value = ""; // stergere valoare din Input dupa accesare
    } catch (error) {
        hideLoading();
        displayError(`A aparut o eroare ${error}`);
    }
} 

function onLocationBtnClick() {
    clearContent();

    if(navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async position => {
            displayLoading();

            try {
                const weatherResponse = await getWeather(position.coords.latitude, position.coords.longitude);
                
                const weatherData = parseApiData(weatherResponse);
                console.log(weatherData);
                hideLoading();
        
                displayWeather("locatia ta", weatherData);
        
            } catch (error) {
                hideLoading();
                displayError(`A aparut o eroare ${error}`);
            }
        })
    } else {
        displayError("API.ul pentru geolocation nu este disponibil");
    }
}
//definim o functie pentru a face request.ul pt linia 2 si sa preia coordonatele
async function getCityCoordinates(cityName) {
    const apiUrl = new URL(API_GEOLOCATION_URL);
    // trebuiesc adaugati acei querry paramiters
    apiUrl.searchParams.append("name", cityName);
    apiUrl.searchParams.append("count", 1);

    console.log(apiUrl.toString());

    const response = await fetch(apiUrl.toString());
    //daca avem acest raspuns din "fetch" trebuie sa returnam datele 
    const data = await response.json();

    if(!data || !data.hasOwnProperty("results")) {
        return null;
    }

    const result = data.results[0];
    return { lat: result.latitude, long: result.longitude};
}

async function getWeather(lat, long) {
    const apiUrl = new URL(API_FORECAST_URL);
    apiUrl.searchParams.append("latitude", lat);
    apiUrl.searchParams.append("longitude", long);
    apiUrl.searchParams.append("timezone", "auto");
    apiUrl.searchParams.append("hourly","temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m");

    const response = await fetch(apiUrl.toString())
    const data = await response.json();
    return data;
}

function parseApiData(data) {
    const numberOfItems = data.hourly.time.length;
    let currentWeather = null;
    const forecasts = [];

    const currentDatetime = new Date();

    for (let i = 0; i < numberOfItems; i++) {
        const itemDatetime = new Date(data.hourly.time[i]);

        const isToday = currentDatetime.toDateString() === itemDatetime.toDateString();
    
        const isCurrentHour = currentDatetime.getHours() === itemDatetime.getHours();
    
        if(isToday && isCurrentHour) {
            currentWeather = {
                date: data.hourly.time[i],
                temp: data.hourly.temperature_2m[i],
                wind: data.hourly.wind_speed_10m[i],
                humidity: data.hourly.relative_humidity_2m[i],
                code: data.hourly.weather_code[i],
            };
        } else if (isCurrentHour) {
            forecasts.push({
                date: data.hourly.time[i],
                temp: data.hourly.temperature_2m[i],
                wind: data.hourly.wind_speed_10m[i],
                humidity: data.hourly.relative_humidity_2m[i],
                code: data.hourly.weather_code[i],
            });
        }
    }

    return {
        current: currentWeather,
        forecasts: forecasts,
    }
}
 // afisarea in pagina a datelor (ziua ora temperatura vant umiditate)
 function displayWeather(cityName, weather) {
    // o sa preluom div.ul cu clasa :page-content"
    const pageContent = document.querySelector('.page-content');

    pageContent.append(createTodayWeatherSection(cityName, weather.current));
    pageContent.append(createForecastWeatherSection(cityName, weather.forecasts));

}
 // crearea celor 2 functii , today/forecastweather, de mai sus
 function createTodayWeatherSection(cityName, currentWeather) {
    const todaySection = document.createElement('div');

    const title = document.createElement('h2');
    title.classList.add('section-title');
    title.innerText = `Vremea in ${cityName} astazi`;

    todaySection.append(title);

    const weatherPanel = createWeatherPanel(currentWeather, true);
    todaySection.append(weatherPanel);

    return todaySection;
 }

 function createForecastWeatherSection(cityName, forecasts) {
    const forecastSection = document.createElement('div');

    const title = document.createElement('h2');
    title.classList.add('section-title');
    title.innerText = `Vremea in ${cityName} urmatoarele zile`;
    forecastSection.append(title);

    const weatherItems = document.createElement('div');
    weatherItems.classList.add('weather-items');
    forecastSection.append(weatherItems);

    // facem un for pentru elementele din forecast de unde apelam
    // "createWeatherPanel" pe care il adaugam in weather-items
    for (let i = 0; i < forecasts.length ; i++) {
        const weatherPanel = createWeatherPanel(forecasts[i], false);
        weatherItems.append(weatherPanel);
    }

    return forecastSection;
}

 function createWeatherPanel(weather, isToday) {
// trebuie sa afisam daca este astazi sau forecast
    const weatherPanel = document.createElement('div');
    // daca isToday este TRUE, daca nu, o sa punem forecast
    const panelClass = isToday ? 'today' : 'forecast';

    // trebuie adaugat isToday ? la weatherPanel
    weatherPanel.classList.add('weather-panel', panelClass);

    const weatherDetails = document.createElement('div');
    weatherDetails.classList.add('weather-details');
    weatherPanel.append(weatherDetails);

    // trebuie sa aflam daca este zi sau noapte
    const currentHour = new Date().getHours();
    const isNight = currentHour >= 20 || currentHour <= 6;

    const weatherIcon = getIcon(weather.code, isNight);

    // crearea div.ului pentru iconita
    const imageContainer = document.createElement('div');
    // crearea tagului IMG
    const icon = document.createElement('img');
    // pt acest IMG trebuie sa adaugam o sursa, adica imaginea
    icon.src = weatherIcon;

    // adaugam aceasta imagine in "imageContainer"
    imageContainer.append(icon);
    // acest "imageContainer" trebuie adaugat in weather panel
    weatherPanel.append(imageContainer);



    const date = document.createElement('p');
    date.classList.add('date');
    // vrem sa inlocuim T.ul din formatul initial din consola cu , 
    date.innerText = weather.date.replace('T', ', ');

    const temp = document.createElement('p');
    temp.innerText = `Temperatura: ${weather.temp}°C`;

    const wind = document.createElement('p');
    wind.innerText = `Vant: ${weather.wind} km/h`;

    const humidity = document.createElement('p');
    humidity.innerText = `Umiditate: ${weather.humidity} %`;

    weatherDetails.append(date, temp, wind, humidity);

    return weatherPanel;
 }

function getIcon(code, isNight) {
    switch (code) {
        case 0:
          return isNight ? 'weather-icons/night.svg' : 'weather-icons/sunny.svg';
        case 1:
        case 2:
        case 3:
          return isNight
            ? 'weather-icons/cloudy-night.svg'
            : 'weather-icons/cloudy-day.svg';
        case 45:
        case 48:
        case 51:
        case 53:
        case 55:
        case 56:
        case 57:
          return 'weather-icons/cloudy.svg';
        case 61:
        case 63:
        case 65:
        case 66:
        case 67:
        case 80:
        case 81:
        case 82:
          return 'weather-icons/rainy.svg';
        case 71:
        case 73:
        case 75:
        case 77:
        case 85:
        case 86:
          return 'weather-icons/snowy.svg';
        case 95:
        case 96:
        case 99:
          return 'weather-icons/thunder.svg';
        default:
          return isNight ? 'weather-icons/night.svg' : 'weather-icons/sunny.svg';
      }
}

// facem CLEAR la datele pe care le.am pos pe formular cu "page-content"
function clearContent() {
    const pageContent = document.querySelector('.page-content');
    pageContent.innerHTML = "";
}

function displayLoading() {
    const pageContent = document.querySelector('.page-content');
    const loading = document.createElement('p');
    loading.setAttribute('id', 'loading'); // setare id
    loading.innerText = 'Se incarca datele despre vreme';
    pageContent.append(loading); // adaugare in div.ul "page-content"
}

function hideLoading() {
    const loading = document.querySelector("#loading");
    if (loading) {
        loading.remove();
    }
}

function displayError(message) {
    const pageContent = document.querySelector(".page-content");
    const alert = document.createElement("div");
    alert.classList.add("alert-error");
    alert.innerText = message;
    pageContent.append(alert);
}

