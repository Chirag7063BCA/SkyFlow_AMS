// ── Load data ───────────────────────────
const fetchJson = async (url, fallback) => fetch(url).then(r => r.json()).catch(() => fallback);
const loadFlights = () => fetchJson('../../Data/flights.json', []);
const loadAirports = () => fetchJson('../../Data/airports.json', []);

const POPULAR_AIRPORTS = [
  { city: 'London', name: 'Heathrow Airport', iata: 'LHR', country: 'United Kingdom' },
  { city: 'New York', name: 'John F Kennedy Intl', iata: 'JFK', country: 'United States' },
  { city: 'Tokyo', name: 'Haneda Airport', iata: 'HND', country: 'Japan' },
  { city: 'Dubai', name: 'Dubai Intl', iata: 'DXB', country: 'United Arab Emirates' },
  { city: 'Singapore', name: 'Changi Airport', iata: 'SIN', country: 'Singapore' },
  { city: 'New Delhi', name: 'Indira Gandhi Intl', iata: 'DEL', country: 'India' },
  { city: 'Mumbai', name: 'Chhatrapati Shivaji Intl', iata: 'BOM', country: 'India' },
  { city: 'Sydney', name: 'Sydney Airport', iata: 'SYD', country: 'Australia' }
];

const getCode = (val) => (val.match(/\(([^)]+)\)$/)?.[1] || val).toLowerCase().trim();
const getVal = (id) => document.getElementById(id)?.value.trim() || '';

// ── UI Helpers ────────────────────────────────
const buildCard = (f, i) => `
  <article class="flight-card" style="animation-delay: ${i * 0.08}s">
    <div class="card-top">
      <div><p class="card-airline">${f.flightNumber} · ${f.airline}</p>
      <h3 class="card-route">${f.originCity} → ${f.destinationCity}</h3></div>
      <div class="card-time"><strong>${f.departureTime} – ${f.arrivalTime}</strong><span>${f.duration}</span></div>
    </div>
    <div class="card-meta">
      <span class="pill">${f.fromAirportCode} → ${f.toAirportCode}</span>
      <span class="pill">${f.nonStop ? 'Non-stop' : '1 stop'}</span>
      <span class="pill ${f.status.toLowerCase().replace(/\s+/g, '-')}">${f.status}</span>
      <span class="card-price">${f.fare}</span>
    </div>
  </article>`;

function renderCards(flights) {
  const grid = document.getElementById('flightsGrid'), msg = document.getElementById('resultsMsg');
  if (!flights.length) {
    grid.innerHTML = '<p style="color:rgba(255,255,255,.6)">No matching flights found.</p>';
    if (msg) msg.textContent = 'No results.';
    return;
  }
  grid.innerHTML = flights.map(buildCard).join('');
  if (msg) msg.textContent = `${flights.length} flight${flights.length > 1 ? 's' : ''} found · ${flights.filter(f => f.status.toLowerCase() !== 'scheduled').length} live`;
}

// ── Core Filtering ─────────────────────
function applyFilters(allFlights) {
  const isFV = document.getElementById('flights-view')?.style.display === 'block';
  const term = getVal('flightSearch').toLowerCase();
  const from = getCode(getVal(isFV && document.getElementById('fsbFrom') ? 'fsbFrom' : 'departureFrom'));
  const to = getCode(getVal(isFV && document.getElementById('fsbTo') ? 'fsbTo' : 'goingTo'));
  const nonStop = document.getElementById('nonStop')?.checked;
  const maxPrice = parseInt(getVal('priceRange') || '5000', 10);
  const getChecked = (cls) => Array.from(document.querySelectorAll(cls)).map(el => el.value);
  const stops = getChecked('.stop-filter:checked').map(Number);
  const airlines = getChecked('.airline-filter:checked');

  const results = allFlights.filter(f => {
    const txt = `${f.flightNumber} ${f.airline} ${f.originCity} ${f.destinationCity} ${f.fromAirportCode} ${f.toAirportCode} ${f.status}`.toLowerCase();
    const stp = f.nonStop ? 0 : 1;
    const fare = parseInt(f.fare.replace(/[^0-9]/g, ''), 10) || 0;
    
    return (!term || txt.includes(term)) &&
           (!from || f.originCity.toLowerCase().includes(from) || f.fromAirportCode.toLowerCase().includes(from)) &&
           (!to || f.destinationCity.toLowerCase().includes(to) || f.toAirportCode.toLowerCase().includes(to)) &&
           (!nonStop || f.nonStop) && (fare <= maxPrice) &&
           (!stops.length || stops.includes(stp) || (stp > 1 && stops.includes(2))) &&
           (!airlines.length || airlines.includes(f.airline));
  });

  const hasFilter = term || from || to || nonStop || stops.length || airlines.length || maxPrice < 5000;
  const titleEl = document.getElementById('flightsTitle');
  if (titleEl) {
    titleEl.innerHTML = hasFilter 
      ? 'MATCHING <span class="flights-title-accent">FLIGHTS</span>' 
      : 'AVAILABLE <span class="flights-title-accent">FLIGHTS</span>';
  }
  const noteEl = document.getElementById('flightsNote');
  if (noteEl) {
    noteEl.innerHTML = hasFilter 
      ? `${results.length} match${results.length === 1 ? '' : 'es'} found.` 
      : `<span class="animated-note-wrapper"><span class="animated-note">All available flights are shown below.</span><span class="animated-note delay">Discover top deals on domestic & international routes.</span></span>`;
  }
  renderCards(results);
}

// ── Autocomplete ────────────────────────────
function setupAutocomplete(inputId, dropdownId, airports, allFlights) {
  const input = document.getElementById(inputId), dropdown = document.getElementById(dropdownId);
  if (!input || !dropdown) return;
  let activeIndex = -1, suggestions = [];

  const render = (query) => {
    const q = query.toLowerCase();
    suggestions = query ? airports.filter(a => `${a.city} ${a.name} ${a.iata} ${a.country}`.toLowerCase().includes(q)).slice(0, 10) : POPULAR_AIRPORTS;
    activeIndex = -1;
    dropdown.innerHTML = suggestions.length ? suggestions.map((a, i) => {
      const hl = str => query ? str.replace(new RegExp(`(${query.replace(/[-\/\\^$*+?.()|[\\]{}]/g, '\\\\$&')})`, 'gi'), '<span class="autocomplete-highlight">$1</span>') : str;
      return `<div class="autocomplete-option" data-index="${i}"><div class="autocomplete-option-icon">✈</div>
        <div class="autocomplete-option-info"><span class="autocomplete-option-city">${hl(a.city||'')}, ${a.country||''}</span><span class="autocomplete-option-airport">${hl(a.name||'')}</span></div>
        <span class="autocomplete-option-badge">${hl(a.iata||'')}</span></div>`;
    }).join('') : '<div style="padding: 1rem; color: #49769f; text-align: center;">No matches</div>';
    dropdown.classList.add('show');
  };

  const select = (idx) => {
    if (suggestions[idx]) {
      input.value = `${suggestions[idx].city}, ${suggestions[idx].country || ''} (${suggestions[idx].iata})`;
      dropdown.classList.remove('show');
      applyFilters(allFlights);
    }
  };

  input.addEventListener('focus', () => { document.querySelectorAll('.autocomplete-dropdown').forEach(d => d !== dropdown && d.classList.remove('show')); render(input.value.trim()); });
  input.addEventListener('input', () => render(input.value.trim()));
  dropdown.addEventListener('click', e => select(e.target.closest('.autocomplete-option')?.dataset.index));
  
  input.addEventListener('keydown', e => {
    if (!dropdown.classList.contains('show')) return ['ArrowDown', 'ArrowUp'].includes(e.key) && render(input.value.trim());
    if (e.key === 'Escape') return dropdown.classList.remove('show'), input.blur();
    if (e.key === 'Enter') return e.preventDefault(), select(Math.max(0, activeIndex));
    if (['ArrowDown', 'ArrowUp'].includes(e.key)) {
      e.preventDefault();
      activeIndex = (activeIndex + (e.key === 'ArrowDown' ? 1 : -1) + suggestions.length) % suggestions.length;
      dropdown.querySelectorAll('.autocomplete-option').forEach((opt, idx) => {
        opt.classList.toggle('active', idx === activeIndex);
        if (idx === activeIndex) opt.scrollIntoView({ block: 'nearest' });
      });
    }
  });
}

// ── Init & Events ──────────────────────────
async function init() {
  const [allFlights, allAirports] = await Promise.all([loadFlights(), loadAirports()]);
  
  const af = document.getElementById('airlineFilters');
  if (af) af.innerHTML = [...new Set(allFlights.map(f => f.airline))].sort().map(a => `<label class="checkbox-label"><input type="checkbox" class="airline-filter" value="${a}"> ${a}</label>`).join('');

  renderCards(allFlights);
  ['departureFrom', 'goingTo', 'fsbFrom', 'fsbTo'].forEach(id => setupAutocomplete(id, id+'Dropdown', allAirports, allFlights));
  
  document.getElementById('searchBtn')?.addEventListener('click', () => {
    ['From', 'To'].forEach(f => {
      const fsb = document.getElementById('fsb'+f), hero = document.getElementById(f === 'From' ? 'departureFrom' : 'goingTo');
      if (fsb && hero) fsb.value = hero.value;
    });
    applyFilters(allFlights);
    if (document.getElementById('hero-view')) document.getElementById('hero-view').style.display = 'none';
    if (document.getElementById('flights-view')) document.getElementById('flights-view').style.display = 'block';
    document.querySelectorAll('.nav-link').forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#flights'));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  document.getElementById('fsbSearchBtn')?.addEventListener('click', () => applyFilters(allFlights));
  document.getElementById('flightSearch')?.addEventListener('input', () => applyFilters(allFlights));
  document.getElementById('nonStop')?.addEventListener('change', () => applyFilters(allFlights));
  document.addEventListener('click', e => !e.target.closest('.flight-field') && document.querySelectorAll('.autocomplete-dropdown').forEach(d => d.classList.remove('show')));

  const swap = (fid, tid) => { const a=document.getElementById(fid), b=document.getElementById(tid); if(a&&b) [a.value, b.value] = [b.value, a.value]; applyFilters(allFlights); };
  document.getElementById('swapBtn')?.addEventListener('click', () => swap('departureFrom', 'goingTo'));
  document.getElementById('fsbSwap')?.addEventListener('click', () => swap('fsbFrom', 'fsbTo'));

  document.getElementById('priceRange')?.addEventListener('input', e => { const pv = document.getElementById('priceValue'); if(pv) pv.textContent = `$${e.target.value}`; applyFilters(allFlights); });
  document.addEventListener('change', e => (e.target.matches('.stop-filter, .airline-filter')) && applyFilters(allFlights));

  document.querySelectorAll('.nav-link').forEach(link => link.addEventListener('click', e => {
    const href = link.getAttribute('href');
    if (['#hero', '#flights'].includes(href)) {
      e.preventDefault();
      document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      if (document.getElementById('nav-toggle')) document.getElementById('nav-toggle').checked = false;
      const isHero = href === '#hero';
      if (document.getElementById('hero-view')) document.getElementById('hero-view').style.display = isHero ? 'block' : 'none';
      if (document.getElementById('flights-view')) {
        document.getElementById('flights-view').style.display = isHero ? 'none' : 'block';
        if (!isHero && !getVal('flightSearch') && !getVal('departureFrom') && !getVal('goingTo')) applyFilters(allFlights);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (!href.startsWith('#')) {
      document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
      link.classList.add('active');
    }
  }));
}

init();
