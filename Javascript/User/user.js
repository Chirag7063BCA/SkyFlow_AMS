const FLIGHTS_DATA_URL = '../../Data/flights.json';
const AIRPORTS_DATA_URL = '../../Data/airports.json';

const FALLBACK_FLIGHTS = [
	{
		flightNumber: 'SF 241',
		airline: 'SkyFlow Airways',
		originCity: 'New Delhi',
		destinationCity: 'Mumbai',
		fromAirportCode: 'DEL',
		toAirportCode: 'BOM',
		departureTime: '07:30',
		arrivalTime: '09:55',
		duration: '2h 25m',
		fare: '₹5,490',
		nonStop: true,
		status: 'On Time'
	},
	{
		flightNumber: 'SF 118',
		airline: 'SkyFlow Express',
		originCity: 'Bengaluru',
		destinationCity: 'Dubai',
		fromAirportCode: 'BLR',
		toAirportCode: 'DXB',
		departureTime: '12:15',
		arrivalTime: '15:05',
		duration: '4h 20m',
		fare: '₹12,880',
		nonStop: true,
		status: 'Boarding'
	},
	{
		flightNumber: 'SF 506',
		airline: 'SkyFlow Connect',
		originCity: 'Hyderabad',
		destinationCity: 'Singapore',
		fromAirportCode: 'HYD',
		toAirportCode: 'SIN',
		departureTime: '18:40',
		arrivalTime: '01:10',
		duration: '4h 00m',
		fare: '₹15,240',
		nonStop: false,
		status: 'Scheduled'
	},
	{
		flightNumber: 'SF 872',
		airline: 'SkyFlow Prime',
		originCity: 'Chennai',
		destinationCity: 'London',
		fromAirportCode: 'MAA',
		toAirportCode: 'LHR',
		departureTime: '22:05',
		arrivalTime: '06:20',
		duration: '9h 45m',
		fare: '₹41,900',
		nonStop: false,
		status: 'Limited Seats'
	}
];

function normalizeValue(value) {
	return String(value || '').trim().toLowerCase();
}

function isLiveFlight(flight) {
	return normalizeValue(flight.status) !== 'scheduled';
}

function matchesSearchTerm(flight, term) {
	if (!term) {
		return true;
	}

	const searchableFields = [
		flight.flightNumber,
		flight.airline,
		flight.originCity,
		flight.destinationCity,
		flight.fromAirportCode,
		flight.toAirportCode,
		flight.status,
		flight.departureTime,
		flight.arrivalTime
	];

	return searchableFields.some((field) => normalizeValue(field).includes(term));
}

function uniqueValues(values) {
	return [...new Set(values.filter(Boolean))];
}
function escapeHtml(value) {
	return String(value || '')
		.replaceAll('&', '&amp;')
		.replaceAll('"', '&quot;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;');
}

function airportDisplayLabel(airport) {
	return [airport.city, airport.country, airport.name, airport.iata].filter(Boolean).join(' · ');
}

function airportSummary(airport) {
	return `${airport.iata || airport.icao || ''}${airport.name ? `, ${airport.name}` : ''}`.trim();
}

function airportTerms(airport) {
	return [airport.city, airport.country, airport.name, airport.iata, airport.icao].filter(Boolean);
}

function buildAirportSuggestions(airports) {
	return airports.map((airport) => `<option value="${escapeHtml(airportDisplayLabel(airport))}"></option>`).join('');
}

function buildFlightSearchSuggestions(flights, airports) {
	const flightSuggestions = flights.flatMap((flight) => [
		flight.flightNumber,
		flight.airline,
		flight.originCity,
		flight.destinationCity,
		flight.fromAirportCode,
		flight.toAirportCode,
		flight.status
	]);

	const airportSuggestions = airports.flatMap((airport) => airportTerms(airport));

	return uniqueValues([...flightSuggestions, ...airportSuggestions]);
}

async function loadAirportsData() {
	try {
		const response = await fetch(AIRPORTS_DATA_URL, { cache: 'no-store' });

		if (!response.ok) {
			throw new Error(`Failed to load ${AIRPORTS_DATA_URL}`);
		}

		const airports = await response.json();
		return Array.isArray(airports) ? airports : [];
	} catch (error) {
		console.warn('Using empty airport suggestions:', error);
		return [];
	}
}

function airportSubvalue(airport) {
	return airportSummary(airport);
}

function findAirport(airports, value) {
	const normalizedValue = normalizeValue(value);

	if (!normalizedValue) {
		return null;
	}

	const exactMatch = airports.find((airport) => airportTerms(airport).some((term) => normalizeValue(term) === normalizedValue));
	if (exactMatch) {
		return exactMatch;
	}

	return airports.find((airport) => airportTerms(airport).some((term) => normalizeValue(term).includes(normalizedValue)));
}

function syncAirportHelperText(inputElement, helperElement, airports) {
	if (!inputElement || !helperElement) {
		return;
	}

	const airport = findAirport(airports, inputElement.value);
	helperElement.textContent = airport ? airportSubvalue(airport) : 'Select from all airports';
}

function matchesAirportSelection(flight, departureAirport, destinationAirport) {
	const matchesAirport = (airport, routeFields) => {
		if (!airport) {
			return true;
		}

		return airportTerms(airport).some((term) => {
			const normalizedTerm = normalizeValue(term);
			return routeFields.some((field) => {
				const normalizedField = normalizeValue(field);
				return normalizedField.includes(normalizedTerm) || normalizedTerm.includes(normalizedField);
			});
		});
	};

	return matchesAirport(departureAirport, [flight.originCity, flight.fromAirportCode]) && matchesAirport(destinationAirport, [flight.destinationCity, flight.toAirportCode]);
}

function renderFlightCards(flights, flightGrid, flightMessage) {
	if (!flights.length) {
		flightGrid.innerHTML = '';
		flightMessage.textContent = 'No matching live flight found in the dummy dataset.';
		return;
	}

	const liveFlights = flights.filter(isLiveFlight);
	const liveCount = liveFlights.length;

	flightMessage.textContent = `${flights.length} flight${flights.length === 1 ? '' : 's'} found. ${liveCount} live flight${liveCount === 1 ? '' : 's'} available.`;

	flightGrid.innerHTML = flights.map((flight) => {
		const route = `${flight.fromAirportCode} to ${flight.toAirportCode}`;
		const liveBadge = isLiveFlight(flight) ? flight.status : 'Scheduled';
		const statusClass = normalizeValue(liveBadge).replace(/\s+/g, '-');

		return `
			<article class="flight-data-card">
				<div class="flight-data-card-top">
					<div>
						<p class="flight-data-airline">${flight.flightNumber} · ${flight.airline}</p>
						<h3 class="flight-data-route">${flight.originCity} to ${flight.destinationCity}</h3>
					</div>
					<div class="flight-data-time">
						<strong>${flight.departureTime} - ${flight.arrivalTime}</strong>
						<span>${flight.duration}</span>
					</div>
				</div>

				<div class="flight-data-meta">
					<span class="flight-data-pill">${route}</span>
					<span class="flight-data-pill">${flight.nonStop ? 'Non-stop' : '1 stop'}</span>
					<span class="flight-data-pill status-${statusClass}">${liveBadge}</span>
					<span class="flight-data-price">${flight.fare}</span>
				</div>
			</article>
		`;
	}).join('');
}

async function loadFlightsData() {
	try {
		const response = await fetch(FLIGHTS_DATA_URL, { cache: 'no-store' });

		if (!response.ok) {
			throw new Error(`Failed to load ${FLIGHTS_DATA_URL}`);
		}

		const flights = await response.json();
		return Array.isArray(flights) ? flights : FALLBACK_FLIGHTS;
	} catch (error) {
		console.warn('Using fallback flight data:', error);
		return FALLBACK_FLIGHTS;
	}
}

async function loadFlightSection(sectionHost) {
	if (!sectionHost) {
		return null;
	}

	if (!sectionHost.dataset.loaded) {
		try {
			const response = await fetch('Landingcomp/flights.html', { cache: 'no-store' });
			if (!response.ok) {
				throw new Error('Failed to load flight section');
			}
			sectionHost.innerHTML = await response.text();
			sectionHost.dataset.loaded = 'true';
		} catch (error) {
			console.warn('Using inline flight section fallback:', error);
			sectionHost.innerHTML = `
<section class="hero-dummy-data flights-section" aria-labelledby="featured-flights-heading" data-flight-results-section>
  <div class="hero-dummy-data-header flights-section-header">
    <div>
      <p class="hero-dummy-data-eyebrow flights-section-eyebrow" data-flight-results-kicker>Available flights</p>
      <h2 class="hero-dummy-data-title flights-section-title" id="featured-flights-heading" data-flight-results-title>Mixed flights from flights.json</h2>
    </div>
    <p class="hero-dummy-data-note flights-section-note" data-flight-results-note>All available dummy flights are shown below.</p>
  </div>
  <div class="hero-dummy-data-grid flights-section-grid" data-flight-grid></div>
</section>`;
			sectionHost.dataset.loaded = 'true';
		}
	}

	return sectionHost.querySelector('[data-flight-results-section]');
}

async function renderHeroDummyData() {
	const flightGrid = document.querySelector('[data-flight-grid]');
	const flightMessage = document.querySelector('[data-flight-message]');
	const flightSearchForm = document.querySelector('[data-flight-search-form]');
	const flightSuggestions = document.querySelector('#flightSearchSuggestions');
	const airportSuggestions = document.querySelector('#airportSuggestions');
	const sectionHost = document.querySelector('[data-flight-section-host]');

	if (!flightMessage || !flightSearchForm || !flightSuggestions || !airportSuggestions || !sectionHost) {
		return;
	}

	const flightSearchInput = flightSearchForm.querySelector('#flightSearch');
	const departureSelect = flightSearchForm.querySelector('#departureFrom');
	const destinationSelect = flightSearchForm.querySelector('#goingTo');
	const nonStopCheckbox = flightSearchForm.querySelector('input[name="nonStop"]');
	const departureHelper = flightSearchForm.querySelector('[data-departure-helper]');
	const destinationHelper = flightSearchForm.querySelector('[data-destination-helper]');
	const swapButton = flightSearchForm.querySelector('.flight-swap-btn');

	const [flights, airports] = await Promise.all([loadFlightsData(), loadAirportsData()]);
	const flightSection = await loadFlightSection(sectionHost);
	const flightResultsTitle = flightSection?.querySelector('[data-flight-results-title]');
	const flightResultsNote = flightSection?.querySelector('[data-flight-results-note]');
	const flightResultsKicker = flightSection?.querySelector('[data-flight-results-kicker]');
	const resultGrid = flightSection?.querySelector('[data-flight-grid]');
	const searchSuggestions = buildFlightSearchSuggestions(flights, airports);
	flightSuggestions.innerHTML = searchSuggestions.map((value) => `<option value="${escapeHtml(value)}"></option>`).join('');
	airportSuggestions.innerHTML = buildAirportSuggestions(airports);
	renderFlightCards(flights, resultGrid, flightMessage);
	flightResultsKicker.textContent = 'Available flights';
	flightResultsTitle.textContent = 'Mixed flights from flights.json';
	flightResultsNote.textContent = 'All available dummy flights are shown below.';

	function applyFilters() {
		const searchTerm = normalizeValue(flightSearchInput?.value);
		const departureAirport = findAirport(airports, departureSelect?.value);
		const destinationAirport = findAirport(airports, destinationSelect?.value);
		const requireNonStop = Boolean(nonStopCheckbox?.checked);

		const filteredFlights = flights.filter((flight) => {
			const keywordMatches = matchesSearchTerm(flight, searchTerm);
			const routeMatches = matchesAirportSelection(flight, departureAirport, destinationAirport);
			const nonStopMatches = !requireNonStop || Boolean(flight.nonStop);

			return routeMatches && keywordMatches && nonStopMatches;
		});

		const hasFilters = Boolean(searchTerm || departureAirport || destinationAirport || requireNonStop);
		flightResultsKicker.textContent = hasFilters ? 'Search results' : 'Available flights';
		flightResultsTitle.textContent = hasFilters ? 'Matching flights from flights.json' : 'Mixed flights from flights.json';
		flightResultsNote.textContent = hasFilters
			? 'Live matches from the dummy dataset are shown below.'
			: 'All available dummy flights are shown below.';
		renderFlightCards(filteredFlights, resultGrid, flightMessage);
		syncAirportHelperText(departureSelect, departureHelper, airports);
		syncAirportHelperText(destinationSelect, destinationHelper, airports);
	}

	flightMessage.textContent = `${flights.length} flight${flights.length === 1 ? '' : 's'} loaded from the dummy dataset. Search or choose airports to narrow them down.`;

	flightSearchForm.addEventListener('submit', (event) => {
		event.preventDefault();
		applyFilters();
	});

	flightSearchInput?.addEventListener('input', () => {
		applyFilters();
	});
	departureSelect?.addEventListener('input', () => {
		syncAirportHelperText(departureSelect, departureHelper, airportIndex);
		applyFilters();
	});
	destinationSelect?.addEventListener('input', () => {
		syncAirportHelperText(destinationSelect, destinationHelper, airports);
		applyFilters();
	});
	nonStopCheckbox?.addEventListener('change', applyFilters);
	swapButton?.addEventListener('click', () => {
		const currentDeparture = departureSelect?.value || '';
		const currentDestination = destinationSelect?.value || '';

		if (departureSelect) {
			departureSelect.value = currentDestination;
			syncAirportHelperText(departureSelect, departureHelper, airports);
		}

		if (destinationSelect) {
			destinationSelect.value = currentDeparture;
			syncAirportHelperText(destinationSelect, destinationHelper, airports);
		}

		applyFilters();
	});

	applyFilters();
}

window.renderHeroDummyData = renderHeroDummyData;

document.addEventListener('DOMContentLoaded', () => {
	renderHeroDummyData();
});
