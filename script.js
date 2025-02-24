const url = 'highest_grossing_films.json';
let data_init = [];

async function fetchData() {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Network response was not ok: ' + response.statusText);
        }
        data_init = await response.json();
        displayMovies(data_init);
        sortByBoxTop(data_init);
        renderChart(data_init);
    } catch (error) {
        console.error('There has been a problem with your fetch operation:', error);
    }
}

function displayMovies(movies) {
    const movieTableBody = document.querySelector('#topall');
    movieTableBody.innerHTML = '';

    movies.forEach(movie => {
        const row = document.createElement('tr');

        const formattedAmount = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(movie.box_office);
        const formattedAmountBudget = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(movie.budget);

        row.innerHTML = `
            <td>${movie.release_year}</td>
            <td>${movie.title}</td>
            <td>${movie.director.split("\n").map(d => d.trim()).filter(d => d !== "").join(", ")}</td>
            <td>${formattedAmountBudget}</td>
            <td>${formattedAmount}</td>
            <td>${movie.country.split("\n").join(", ")}</td>
        `;
        
        movieTableBody.appendChild(row);
    });
}

function filterMovies() {
    const filterValue = document.getElementById('titleFilter').value.toLowerCase();

    const filteredMovies = data_init.filter(movie =>
        movie.title.toLowerCase().includes(filterValue) ||
        movie.director.toLowerCase().includes(filterValue) ||
        movie.country.toLowerCase().includes(filterValue)
    );

    displayMovies(filteredMovies);
}

function sortByBoxTop(movies) {
    const data_sorted = [...movies];

    data_sorted.sort((a, b) => {
        const boxOfficeA = a.box_office;
        const boxOfficeB = b.box_office;
        return boxOfficeB - boxOfficeA;
    });

    const overlays = document.querySelectorAll('.overlay');
    for (let i = 0; i < overlays.length; i++) {
        const movie = data_sorted[i];
        overlays[i].innerHTML = `${movie.title} (${movie.release_year})<br>${new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(movie.box_office)}\nDirected by ${movie.director.split('\n').join(', ')}`;
    }
}

function sortMovies() {
    const sortOption = document.getElementById('sortOptions').value;
    let sortedMovies;

    switch (sortOption) {
        case 'year-asc':
            sortedMovies = [...data_init].sort((a, b) => a.release_year - b.release_year);
            break;
        case 'year-desc':
            sortedMovies = [...data_init].sort((a, b) => b.release_year - a.release_year);
            break;
        case 'budget-asc':
            sortedMovies = [...data_init].sort((a, b) => a.budget - b.budget);
            break;
        case 'budget-desc':
            sortedMovies = [...data_init].sort((a, b) => b.budget - a.budget);
            break;
        case 'box-office-asc':
            sortedMovies = [...data_init].sort((a, b) => a.box_office - b.box_office);
            break;
        case 'box-office-desc':
            sortedMovies = [...data_init].sort((a, b) => b.box_office - a.box_office);
            break;
        case 'title-asc':
            sortedMovies = [...data_init].sort((a, b) => a.title.localeCompare(b.title));
            break;
        case 'director-asc':
            sortedMovies = [...data_init].sort((a, b) => a.director.localeCompare(b.director));
            break;
        case 'country-asc':
            sortedMovies = [...data_init].sort((a, b) => a.country.localeCompare(b.country));
            break;
        default:
            sortedMovies = data_init;
    }
    displayMovies(sortedMovies);
}

function renderChart(movies) {
    const countryStats = {};
    const directorStats = {};
    const filmData = [];

    movies.forEach(film => {
        const countries = film.country.split('\n').map(country => country.trim());
        countries.forEach(country => {
            if (!countryStats[country]) {
                countryStats[country] = {
                    count: 0,
                    totalBoxOffice: 0,
                    totalBudget: 0
                };
            }
            countryStats[country].count++;
            countryStats[country].totalBoxOffice += film.box_office;
            countryStats[country].totalBudget += film.budget;
        });

        const directors = film.director.split('\n').map(d => d.trim()).filter(d => d !== "");
        directors.forEach(director => {
            if (!directorStats[director]) {
                directorStats[director] = {
                    count: 0,
                    totalBoxOffice: 0,
                    totalBudget: 0
                };
            }
            directorStats[director].count++;
            directorStats[director].totalBoxOffice += film.box_office;
            directorStats[director].totalBudget += film.budget; 
        });

        filmData.push({
            title: film.title, 
            budget: film.budget,
            boxOffice: film.box_office,
            release_year: film.release_year
        });
    });

    const countries = Object.keys(countryStats);
    const countryCounts = countries.map(country => countryStats[country].count);
    const totalBoxOffices = countries.map(country => countryStats[country].totalBoxOffice);
    const totalBudget = countries.map(country => countryStats[country].totalBudget);

    const ctxCount = document.getElementById('countryChart').getContext('2d');
    const countryChart = new Chart(ctxCount, {
        type: 'bar',
        data: {
            labels: countries,
            datasets: [{
                label: 'Number of films made by the country',
                data: countryCounts,
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                borderColor: 'rgba(255, 255, 255, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255, 255, 255, 0.4)' },
                    ticks: { color: 'white' }
                },
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.4)' },
                    ticks: { color: 'white' }
                }
            },
            plugins: {
                legend: { labels: { color: 'white' } }
            }
        }
    });

    const directors = Object.keys(directorStats);
    const directorCounts = directors.map(director => directorStats[director].count);
    const directorBoxOffices = directors.map(director => directorStats[director].totalBoxOffice);
    const directorBudget = directors.map(director => directorStats[director].totalBudget);

    const ctxDirector = document.getElementById('directorChart').getContext('2d');
    const directorChart = new Chart(ctxDirector, {
        type: 'bar',
        data: {
            labels: directors,
            datasets: [{
                label: 'Number of films made by the director',
                data: directorCounts,
                backgroundColor: 'rgba(75, 192, 192, 0.9)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255, 255, 255, 0.4)' },
                    ticks: { color: 'white' }
                },
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.4)' },
                    ticks: { color: 'white' }
                }
            },
            plugins: {
                legend: { labels: { color: 'white' } }
            }
        }
    });

    const filmTitles = filmData.map(film => `${film.title} (${film.release_year})`);
    const filmBudgets = filmData.map(film => film.budget);
    const filmBoxOffices = filmData.map(film => film.boxOffice);

    const ctxBudgetBoxOffice = document.getElementById('budgetBoxOfficeChart').getContext('2d');
    const budgetBoxOfficeChart = new Chart(ctxBudgetBoxOffice, {
        type: 'bar',
        data: {
            labels: filmTitles,
            datasets: [
                {
                    label: 'Box office of the film ($)',
                    data: filmBoxOffices,
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    borderColor: 'rgba(255, 255, 255, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Budget of the film ($)',
                    data: filmBudgets,
                    backgroundColor: 'rgba(75, 192, 192, 0.9)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255, 255, 255, 0.4)' },
                    ticks: { color: 'white' }
                },
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.4)' },
                    ticks: { color: 'white' }
                }
            },
            plugins: {
                legend: { labels: { color: 'white' } }
            }
        }
    });

    const ctxRevenue = document.getElementById('revenueChart').getContext('2d');
    const revenueChart = new Chart(ctxRevenue, {
        type: 'bar',
        data: {
            labels: countries,
            datasets: [
            {
                label: 'Total box office for the country ($)',
                data: totalBoxOffices,
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                borderColor: 'rgba(255, 255, 255, 1)',
                borderWidth: 1
            },
            {
                label: 'Total budget for the country ($)',
                data: totalBudget,
                backgroundColor: 'rgba(75, 192, 192, 0.9)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            },
        ]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255, 255, 255, 0.4)' },
                    ticks: { color: 'white' }
                },
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.4)' },
                    ticks: { color: 'white' }
                }
            },
            plugins: {
                legend: { labels: { color: 'white' } }
            }
        }
    });

    const ctxProfit = document.getElementById('dirProfitChart').getContext('2d');
    const dirProfitChart = new Chart(ctxProfit, {
        type: 'bar',
        data: {
            labels: directors,
            datasets: [
            {
                label: 'Total box office for the director ($)',
                data: directorBoxOffices,
                backgroundColor: 'rgba(255,255, 255, 0.9)',
                borderColor: 'rgba(255, 255, 255, 1)',
                borderWidth: 1
            },
            {
                label: 'Total budget for the director ($)',
                data: directorBudget,
                backgroundColor: 'rgba(75, 192, 192, 0.9)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            },
        ]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255, 255, 255, 0.4)' },
                    ticks: { color: 'white' }
                },
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.4)' },
                    ticks: { color: 'white' }
                }
            },
            plugins: {
                legend: { labels: { color: 'white' } }
            }
        }
    });
}

fetchData();
document.getElementById('titleFilter').addEventListener('input', filterMovies);