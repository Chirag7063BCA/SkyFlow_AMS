// Simple JS for Track Flight page - beginner-friendly and clear

async function loadComponent(url, containerId) {
  try {
    const res = await fetch(url);
    if (!res.ok) return;
    const html = await res.text();
    document.getElementById(containerId).innerHTML = html;
  } catch (e) {
    console.error('loadComponent error', e);
  }
}

function patchNavLinks() {
  var links = document.querySelectorAll('.nav-link[data-route]');
  for (var i = 0; i < links.length; i++) {
    var route = links[i].dataset.route;
    if (route === 'home') links[i].href = '../index.html';
    if (route === 'flights') links[i].href = '../index.html#flights';
    if (route === 'track') links[i].href = 'trackFlight.html';
    if (route === 'bookings') links[i].href = '../mybookings/bookings.html';
  }
}

function activateNav(route) {
  var el = document.querySelector('.nav-link[data-route="' + route + '"]');
  if (el) el.classList.add('active');
}

function renderStatusCard(flight) {
  var statusClass = String(flight.status || '').toLowerCase().replace(/\s+/g, '-');
  return (
    '<article class="flight-card">' +
      '<div class="card-top">' +
        '<div>' +
          '<p class="card-airline">' + (flight.airline || '') + '</p>' +
          '<p class="card-route">' + (flight.originCity || '') + ' (' + (flight.fromAirportCode || '') + ') → ' + (flight.destinationCity || '') + ' (' + (flight.toAirportCode || '') + ')</p>' +
        '</div>' +
        '<div class="card-time">' +
          '<strong>' + (flight.departureTime || '') + ' → ' + (flight.arrivalTime || '') + '</strong>' +
          '<span>' + (flight.duration || '') + '</span>' +
        '</div>' +
      '</div>' +
      '<div class="card-meta">' +
        '<span class="pill ' + statusClass + '">' + (flight.status || '') + '</span>' +
        '<span class="pill">Flight ' + (flight.flightNumber || '') + '</span>' +
        '<span class="pill">' + ((flight.nonStop) ? 'Non-stop' : '1 stop') + '</span>' +
        '<span class="pill">' + (flight.fare || '') + '</span>' +
      '</div>' +
    '</article>'
  );
}

async function fetchFlightDataSimple() {
  try {
    var res = await fetch('../../../Data/flights.json');
    if (!res.ok) return [];
    return await res.json();
  } catch (e) {
    console.error('fetchFlightDataSimple error', e);
    return [];
  }
}

async function initTrackPage() {
  // load common components
  await loadComponent('../globalcomp/navbar.html', 'navbar-container');
  patchNavLinks();
  activateNav('track');
  await loadComponent('../globalcomp/footer.html', 'footer-container');

  // place the main content (already rendered by HTML file template)
  // fetch flights data
  var flights = await fetchFlightDataSimple();

  // elements
  var trackBtn = document.getElementById('trackBtn');
  var trackFlightNumber = document.getElementById('trackFlightNumber');
  var trackFrom = document.getElementById('trackFrom');
  var trackTo = document.getElementById('trackTo');
  var trackDate = document.getElementById('trackDate');
  var trackResult = document.getElementById('trackResult');
  var statusGrid = document.getElementById('statusGrid');

  function searchFlight() {
    var flightNumber = (trackFlightNumber && trackFlightNumber.value || '').trim().toUpperCase();
    var fromValue = (trackFrom && trackFrom.value || '').trim().toLowerCase();
    var toValue = (trackTo && trackTo.value || '').trim().toLowerCase();

    if (!flightNumber && !fromValue && !toValue) {
      if (trackResult) trackResult.textContent = 'Please enter a flight number or departure/arrival city to track.';
      if (statusGrid) statusGrid.innerHTML = '';
      return;
    }

    var matched = flights.filter(function(f) {
      var fromMatch = fromValue ? ( (f.originCity || '').toLowerCase().includes(fromValue) || (f.fromAirportCode || '').toLowerCase().includes(fromValue) ) : true;
      var toMatch = toValue ? ( (f.destinationCity || '').toLowerCase().includes(toValue) || (f.toAirportCode || '').toLowerCase().includes(toValue) ) : true;
      var flightMatch = flightNumber ? ( (f.flightNumber || '').toUpperCase().indexOf(flightNumber) !== -1 ) : true;
      return fromMatch && toMatch && flightMatch;
    });

    if (!matched.length) {
      if (trackResult) trackResult.innerHTML = '<p class="results-msg">No flight found. Try another number or route.</p>';
      if (statusGrid) statusGrid.innerHTML = '';
      return;
    }

    if (trackResult) trackResult.innerHTML = '<p class="results-msg">Showing ' + matched.length + ' matching flight' + (matched.length > 1 ? 's' : '') + '.</p>';
    if (statusGrid) statusGrid.innerHTML = matched.map(renderStatusCard).join('');
  }

  if (trackBtn) trackBtn.addEventListener('click', searchFlight);
  [trackFlightNumber, trackFrom, trackTo, trackDate].forEach(function(el) {
    if (!el) return;
    el.addEventListener('keydown', function(e) { if (e.key === 'Enter') searchFlight(); });
  });

  // Fade the hero overlay from blue to white while scrolling
  var heroEl = document.querySelector('.track-hero');
  if (heroEl) {
    var heroHeight = heroEl.offsetHeight;
    var updateHeroFade = function() {
      var sc = window.scrollY || document.documentElement.scrollTop;
      var ratio = Math.min(sc / (heroHeight * 0.7), 1);
      document.documentElement.style.setProperty('--hero-fade', String(1 - ratio));
    };
    updateHeroFade();
    window.addEventListener('scroll', updateHeroFade, { passive: true });
    window.addEventListener('resize', function() { heroHeight = heroEl.offsetHeight; updateHeroFade(); });
  }
}

// start when page is ready
window.addEventListener('DOMContentLoaded', initTrackPage);
