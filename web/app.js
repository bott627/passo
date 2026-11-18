// The web app never touches the database. It only ever asks the API.
//
// That is the whole reason a mobile app can be added later without changing
// the server: point API_BASE at the same API from somewhere else and every
// call below still works. Empty string means "the server that served this
// page", which is what keeps the login cookie in Lab C simple.
const API_BASE = '';

const api = (path) => fetch(`${API_BASE}${path}`);

const from = document.getElementById('from');
const to = document.getElementById('to');
const form = document.getElementById('search');
const result = document.getElementById('result');

async function loadStops() {
  try {
    const response = await api('/api/stops');
    if (!response.ok) throw new Error(`stops: ${response.status}`);

    const stops = await response.json();
    for (const select of [from, to]) {
      select.innerHTML = '<option value="">Choose a stop</option>';
      for (const stop of stops) {
        const option = document.createElement('option');
        option.value = stop.id;
        option.textContent = `${stop.name} (${stop.region})`;
        select.append(option);
      }
    }
  } catch (error) {
    result.innerHTML = `<p class="error">Could not load stops. Is the server running?</p>`;
    console.error(error);
  }
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  result.innerHTML = '<p>Looking…</p>';

  const response = await api(`/api/fares?from=${from.value}&to=${to.value}`);
  const body = await response.json();

  if (!response.ok) {
    result.innerHTML = `<p class="error">${body.hint ?? body.error ?? 'Something went wrong.'}</p>`;
    return;
  }

  result.innerHTML = `
    <p class="fare">
      <strong>D${body.amountDalasi}</strong>
      <span class="status">${body.status}</span>
    </p>
    <p class="since">In effect since ${body.effectiveFrom?.slice(0, 10) ?? 'unknown'}.</p>
  `;
});

loadStops();
