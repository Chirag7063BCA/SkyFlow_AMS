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
  const term    = document.getElementById('flightSearch').value.trim().toLowerCase();
  const from    = document.getElementById('departureFrom').value.trim().toLowerCase();
  const to      = document.getElementById('goingTo').value.trim().toLowerCase();
  const nonStop = document.getElementById('nonStop').checked;

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

// ── Wire up all event listeners ──────────────────────────
function setupListeners(allFlights) {
  // Search button → filter + scroll to results
  document.getElementById('searchBtn').addEventListener('click', () => {
    applyFilters(allFlights);
    document.getElementById('flights').scrollIntoView({ behavior: 'smooth' });
  });

  // Live filter on typing
  ['flightSearch', 'departureFrom', 'goingTo'].forEach(id => {
    document.getElementById(id).addEventListener('input', () => applyFilters(allFlights));
  });

  // Non-stop checkbox
  document.getElementById('nonStop').addEventListener('change', () => applyFilters(allFlights));

  // Swap departure / destination
  document.getElementById('swapBtn').addEventListener('click', () => {
    const dep = document.getElementById('departureFrom');
    const dst = document.getElementById('goingTo');
    [dep.value, dst.value] = [dst.value, dep.value];
    applyFilters(allFlights);
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
  renderCards(allFlights);
  setupListeners(allFlights);
}

init();
