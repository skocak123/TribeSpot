async function laadNavProfiel() {
  const antwoord = await fetch('/api/ik');
  if (!antwoord.ok) return; // niet ingelogd: niets tonen

  const ik = await antwoord.json();

  const blok = document.createElement('div');
  blok.className = 'nav-profiel';
    blok.innerHTML = `
    <button id="nav-avatar"></button>
    <div id="nav-menu" hidden>
      <div class="nav-info">
        <strong id="nav-naam"></strong>
        <span id="nav-email"></span>
      </div>
      <hr>
      <a href="profiel.html">Mijn profiel</a>
      <a href="regelspagina.html">Regels</a>
      <button id="afmelden">Afmelden</button>
    </div>
  `;

  document.querySelector('nav').appendChild(blok);

  const navAvatar = document.querySelector('#nav-avatar');
  const navMenu = document.querySelector('#nav-menu');

  navAvatar.textContent = ik.naam[0].toUpperCase();
    document.querySelector('#nav-naam').textContent = ik.naam;
  document.querySelector('#nav-email').textContent = ik.email;


  navAvatar.addEventListener('click', () => {
    navMenu.hidden = !navMenu.hidden;
  });

  document.querySelector('#afmelden').addEventListener('click', async () => {
    await fetch('/api/uitloggen', { method: 'POST' });
    location.href = 'inloggen.html';
  });
}

laadNavProfiel();

// ---- Vertrektijd: 15 minuten van tevoren waarschuwen, om de tijd is je plek weg ----

let mijnTot = null;
let gewaarschuwdVoor = null;

const vertrekVenster = document.createElement('dialog');
vertrekVenster.id = 'vertrek-venster';
document.body.appendChild(vertrekVenster);

function minutenTot(tijd) {
  const [uur, minuut] = tijd.split(':').map(Number);
  const nu = new Date();
  return uur * 60 + minuut - (nu.getHours() * 60 + nu.getMinutes());
}

function tijdPlus(tijd, minuten) {
  const [uur, minuut] = tijd.split(':').map(Number);
  const totaal = uur * 60 + minuut + minuten;
  return String(Math.floor(totaal / 60)).padStart(2, '0') + ':' + String(totaal % 60).padStart(2, '0');
}

function verversPlattegrond() {
  // Alleen op de plattegrond bestaan deze functies (uit main.js)
  if (typeof loadStatuses === 'function') loadStatuses();
  if (typeof loadOnline === 'function') loadOnline();
}

function toonVerlengVenster(tot, over) {
  vertrekVenster.innerHTML = `
    <h2>Je plek verloopt bijna</h2>
    <p class="vertrek-tekst"></p>
    <label>Blijf tot
      <select class="vertrek-keuze"></select>
    </label>
    <p class="vertrek-fout"></p>
    <div class="vertrek-knoppen">
      <button class="vertrek-verlengen">Verlengen</button>
      <button class="vertrek-sluiten">Nee, ik ga weg</button>
    </div>
  `;

  vertrekVenster.querySelector('.vertrek-tekst').textContent =
    'Je plek verloopt om ' + tot + ' (over ' + over + ' min). Wil je langer blijven?';

  const keuze = vertrekVenster.querySelector('.vertrek-keuze');
  for (let erbij = 15; erbij <= 180; erbij += 15) {
    const nieuweTijd = tijdPlus(tot, erbij);
    if (nieuweTijd > '23:59') break;
    const optie = document.createElement('option');
    optie.value = nieuweTijd;
    optie.textContent = nieuweTijd;
    keuze.appendChild(optie);
  }
  keuze.value = tijdPlus(tot, 30);

  vertrekVenster.querySelector('.vertrek-verlengen').addEventListener('click', async () => {
    const antwoord = await fetch('/api/statussen', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tot: keuze.value })
    });
    const resultaat = await antwoord.json();

    if (!antwoord.ok) {
      vertrekVenster.querySelector('.vertrek-fout').textContent = resultaat.fout;
      return;
    }
    mijnTot = keuze.value;
    vertrekVenster.close();
    verversPlattegrond();
  });

  vertrekVenster.querySelector('.vertrek-sluiten').addEventListener('click', () => {
    vertrekVenster.close();
  });

  if (!vertrekVenster.open) vertrekVenster.showModal();
}

function toonVerlopenMelding(tot) {
  vertrekVenster.innerHTML = `
    <h2>Je tijd is om</h2>
    <p class="vertrek-tekst"></p>
    <div class="vertrek-knoppen">
      <button class="vertrek-sluiten">Oké</button>
    </div>
  `;
  vertrekVenster.querySelector('.vertrek-tekst').textContent =
    'Het is ' + tot + ', je plek is vrijgegeven.';
  vertrekVenster.querySelector('.vertrek-sluiten').addEventListener('click', () => {
    vertrekVenster.close();
  });

  if (!vertrekVenster.open) vertrekVenster.showModal();
  verversPlattegrond();
}

async function controleerVertrektijd() {
  const antwoord = await fetch('/api/mijn-status');
  if (!antwoord.ok) return; // niet ingelogd

  const status = await antwoord.json();

  if (status === null) {
    // Plek is weg. Kwam dat doordat de tijd om is (en niet door "Ik ga weg")?
    if (mijnTot !== null && minutenTot(mijnTot) <= 0) {
      if (vertrekVenster.open) vertrekVenster.close();
      toonVerlopenMelding(mijnTot);
    }
    mijnTot = null;
    return;
  }

  mijnTot = status.tot;
  const over = minutenTot(status.tot);

  if (over > 0 && over <= 15 && gewaarschuwdVoor !== status.tot) {
    gewaarschuwdVoor = status.tot;
    toonVerlengVenster(status.tot, over);
  }
}

controleerVertrektijd();
setInterval(controleerVertrektijd, 30000);
