// ── Load flight data from JSON ───────────────────────────
async function loadFlights() {
  try {
    const res = await fetch('../../Data/flights.json');
    return await res.json();
  } catch {
    console.warn('Could not load flights.json — using fallback data');
    return [];
  }
}

// ── Load airport data from JSON ──────────────────────────
async function loadAirports() {
  try {
    const res = await fetch('../../Data/airports.json');
    return await res.json();
  } catch {
    console.warn('Could not load airports.json — using empty list');
    return [];
  }
}

// ── Fallback Popular Airports ─────────────────────────────
const POPULAR_AIRPORTS = [
  { city: 'London', name: 'Heathrow Airport', iata: 'LHR', country: 'United Kingdom' },
  { city: 'New York', name: 'John F Kennedy International Airport', iata: 'JFK', country: 'United States' },
  { city: 'Tokyo', name: 'Haneda Airport', iata: 'HND', country: 'Japan' },
  { city: 'Dubai', name: 'Dubai International Airport', iata: 'DXB', country: 'United Arab Emirates' },
  { city: 'Singapore', name: 'Changi Airport', iata: 'SIN', country: 'Singapore' },
  { city: 'New Delhi', name: 'Indira Gandhi International Airport', iata: 'DEL', country: 'India' },
  { city: 'Mumbai', name: 'Chhatrapati Shivaji Maharaj International Airport', iata: 'BOM', country: 'India' },
  { city: 'Sydney', name: 'Sydney Airport', iata: 'SYD', country: 'Australia' }
];

// ── Helper to parse IATA code from autocomplete value ─────
function getAirportCodeOrTerm(value) {
  const match = value.match(/\(([^)]+)\)$/);
  if (match) {
    return match[1].toLowerCase().trim();
  }
  return value.toLowerCase().trim();
}

// ── Build one card's HTML ────────────────────────────────
function buildCard(f) {
  const statusKey = f.status.toLowerCase().replace(/\s+/g, '-');
  return `
    <article class="flight-card">
      <div class="card-top">
        <div>
          <p class="card-airline">${f.flightNumber} · ${f.airline}</p>
          <h3 class="card-route">${f.originCity} → ${f.destinationCity}</h3>
        </div>
        <div class="card-time">
          <strong>${f.departureTime} – ${f.arrivalTime}</strong>
          <span>${f.duration}</span>
        </div>
      </div>
      <div class="card-meta">
        <span class="pill">${f.fromAirportCode} → ${f.toAirportCode}</span>
        <span class="pill">${f.nonStop ? 'Non-stop' : '1 stop'}</span>
        <span class="pill ${statusKey}">${f.status}</span>
        <span class="card-price">${f.fare}</span>
      </div>
    </article>`;
}

// ── Render cards into the grid ───────────────────────────
function renderCards(flights) {
  const grid = document.getElementById('flightsGrid');
  const msg  = document.getElementById('resultsMsg');

  if (!flights.length) {
    grid.innerHTML = '<p style="color:rgba(255,255,255,.6)">No matching flights found.</p>';
    msg.textContent = 'No results.';
    return;
  }

  grid.innerHTML = flights.map(buildCard).join('');

  const live = flights.filter(f => f.status.toLowerCase() !== 'scheduled').length;
  msg.textContent = `${flights.length} flight${flights.length === 1 ? '' : 's'} found · ${live} live`;
}

// ── Update section heading based on active filters ───────
function updateHeading(hasFilter, count) {
  document.getElementById('flightsKicker').textContent = hasFilter ? 'Search Results'    : 'Available Flights';
  document.getElementById('flightsTitle').textContent  = hasFilter ? 'Matching Flights'  : 'All Flights';
  document.getElementById('flightsNote').textContent   = hasFilter
    ? `${count} match${count === 1 ? '' : 'es'} found.`
    : 'All available flights are shown below.';
}

// ── Filter flights from form inputs ─────────────────────
function applyFilters(allFlights) {
  const term       = document.getElementById('flightSearch').value.trim().toLowerCase();
  const fromRaw    = document.getElementById('departureFrom').value.trim();
  const toRaw      = document.getElementById('goingTo').value.trim();
  const nonStop    = document.getElementById('nonStop').checked;

  const from = getAirportCodeOrTerm(fromRaw);
  const to   = getAirportCodeOrTerm(toRaw);

  const results = allFlights.filter(f => {
    const searchText = [f.flightNumber, f.airline, f.originCity, f.destinationCity, f.fromAirportCode, f.toAirportCode, f.status]
      .join(' ').toLowerCase();

    const matchTerm  = !term    || searchText.includes(term);
    const matchFrom  = !from    || f.originCity.toLowerCase().includes(from)       || f.fromAirportCode.toLowerCase().includes(from);
    const matchTo    = !to      || f.destinationCity.toLowerCase().includes(to)    || f.toAirportCode.toLowerCase().includes(to);
    const matchStop  = !nonStop || f.nonStop;

    return matchTerm && matchFrom && matchTo && matchStop;
  });

  updateHeading(!!(term || from || to || nonStop), results.length);
  renderCards(results);
}

// ── Autocomplete Setup Helper ────────────────────────────
function setupAutocomplete(inputId, dropdownId, airports, allFlights) {
  const input = document.getElementById(inputId);
  const dropdown = document.getElementById(dropdownId);
  if (!input || !dropdown) return;

  let activeIndex = -1;
  let currentSuggestions = [];

  function renderSuggestions(query) {
    let filtered = [];
    if (!query) {
      filtered = POPULAR_AIRPORTS;
    } else {
      const q = query.toLowerCase();
      filtered = airports.filter(a => {
        return (a.city && a.city.toLowerCase().includes(q)) ||
               (a.name && a.name.toLowerCase().includes(q)) ||
               (a.iata && a.iata.toLowerCase().includes(q)) ||
               (a.country && a.country.toLowerCase().includes(q));
      });
      filtered = filtered.slice(0, 10);
    }

    currentSuggestions = filtered;
    activeIndex = -1;

    if (filtered.length === 0) {
      dropdown.innerHTML = '<div style="padding: 1.25rem 1rem; color: #49769f; font-size: 0.9rem; text-align: center; font-weight: 500;">No matching airports found</div>';
    } else {
      dropdown.innerHTML = filtered.map((airport, index) => {
        let cityHtml = airport.city || '';
        let airportHtml = airport.name || '';
        let iataHtml = airport.iata || '';
        let country = airport.country || '';

        if (query) {
          const escQuery = query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
          const regex = new RegExp(`(${escQuery})`, 'gi');
          cityHtml = cityHtml.replace(regex, '<span class="autocomplete-highlight">$1</span>');
          airportHtml = airportHtml.replace(regex, '<span class="autocomplete-highlight">$1</span>');
          iataHtml = iataHtml.replace(regex, '<span class="autocomplete-highlight">$1</span>');
        }

        return `
          <div class="autocomplete-option" data-index="${index}">
            <div class="autocomplete-option-icon">✈</div>
            <div class="autocomplete-option-info">
              <span class="autocomplete-option-city">${cityHtml}, ${country}</span>
              <span class="autocomplete-option-airport">${airportHtml}</span>
            </div>
            <span class="autocomplete-option-badge">${iataHtml}</span>
          </div>
        `;
      }).join('');
    }

    dropdown.classList.add('show');
  }

  function selectOption(index) {
    if (index >= 0 && index < currentSuggestions.length) {
      const selected = currentSuggestions[index];
      input.value = `${selected.city}, ${selected.country || ''} (${selected.iata})`;
      dropdown.classList.remove('show');
      applyFilters(allFlights);
    }
  }

  input.addEventListener('focus', () => {
    // Close all other dropdowns
    document.querySelectorAll('.autocomplete-dropdown').forEach(d => {
      if (d !== dropdown) d.classList.remove('show');
    });
    renderSuggestions(input.value.trim());
  });

  input.addEventListener('input', () => {
    renderSuggestions(input.value.trim());
  });

  dropdown.addEventListener('click', (e) => {
    const option = e.target.closest('.autocomplete-option');
    if (option) {
      const index = parseInt(option.getAttribute('data-index'), 10);
      selectOption(index);
    }
  });

  input.addEventListener('keydown', (e) => {
    if (!dropdown.classList.contains('show')) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        renderSuggestions(input.value.trim());
      }
      return;
    }

    const options = dropdown.querySelectorAll('.autocomplete-option');

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeIndex = (activeIndex + 1) % currentSuggestions.length;
      updateActiveOption(options);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeIndex = (activeIndex - 1 + currentSuggestions.length) % currentSuggestions.length;
      updateActiveOption(options);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < currentSuggestions.length) {
        selectOption(activeIndex);
      } else if (currentSuggestions.length > 0) {
        selectOption(0);
      }
    } else if (e.key === 'Escape') {
      dropdown.classList.remove('show');
      input.blur();
    }
  });

  function updateActiveOption(options) {
    options.forEach((opt, idx) => {
      if (idx === activeIndex) {
        opt.classList.add('active');
        opt.scrollIntoView({ block: 'nearest' });
      } else {
        opt.classList.remove('active');
      }
    });
  }
}

// ── Wire up all event listeners ──────────────────────────
function setupListeners(allFlights, allAirports) {
  // Search button → filter + scroll to results
  document.getElementById('searchBtn').addEventListener('click', () => {
    applyFilters(allFlights);
    document.getElementById('flights').scrollIntoView({ behavior: 'smooth' });
  });

  // Autocomplete bindings
  setupAutocomplete('departureFrom', 'departureFromDropdown', allAirports, allFlights);
  setupAutocomplete('goingTo', 'goingToDropdown', allAirports, allFlights);

  // Live filter on search keyword input
  document.getElementById('flightSearch').addEventListener('input', () => applyFilters(allFlights));

  // Non-stop checkbox
  document.getElementById('nonStop').addEventListener('change', () => applyFilters(allFlights));

  // Swap departure / destination
  document.getElementById('swapBtn').addEventListener('click', () => {
    const dep = document.getElementById('departureFrom');
    const dst = document.getElementById('goingTo');
    [dep.value, dst.value] = [dst.value, dep.value];
    
    // Close dropdowns
    document.querySelectorAll('.autocomplete-dropdown').forEach(d => d.classList.remove('show'));
    
    applyFilters(allFlights);
  });

  // Click outside listener to close dropdowns
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.flight-field')) {
      document.querySelectorAll('.autocomplete-dropdown').forEach(d => d.classList.remove('show'));
    }
  });

  // Nav active link highlight
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      document.getElementById('nav-toggle').checked = false; // close mobile menu
    });
  });
}

// ── Init ─────────────────────────────────────────────────
async function init() {
  const allFlights = await loadFlights();
  const allAirports = await loadAirports();
  renderCards(allFlights);
  setupListeners(allFlights, allAirports);
}

init();
