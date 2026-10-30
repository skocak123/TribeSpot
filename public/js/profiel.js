
function toonAvatar(element, naam, foto) {
  if (foto) {
    element.style.backgroundImage = 'url("' + foto + '")';
    element.textContent = '';
  } else {
    element.style.backgroundImage = '';
    element.textContent = naam ? naam[0].toUpperCase() : '';
  }
}

async function laadProfiel() {
  const antwoord = await fetch('/api/profiel');
  const profiel = await antwoord.json();

  document.querySelector('#naam').textContent = profiel.naam;
  document.querySelector('#tribe').textContent = 'Tribe ' + profiel.tribe + ' · jaar ' + profiel.studiejaar;
  toonAvatar(document.querySelector('#avatar'), profiel.naam, profiel.foto);

  const interesses = profiel.interesses.split(',').filter((interesse) => interesse !== '');
  interesses.forEach((interesse) => {
    const knopje = document.createElement('span');
    knopje.className = 'label';
    knopje.textContent = interesse;
    document.querySelector('#interesses').appendChild(knopje);
  });

  if (profiel.helpen) {
    const helpenKnopje = document.createElement('span');
    helpenKnopje.className = 'label';
    helpenKnopje.textContent = profiel.helpen;
    document.querySelector('#helpen').appendChild(helpenKnopje);
  }
}

laadProfiel();

if (sessionStorage.getItem('profielBijgewerkt')) {
  sessionStorage.removeItem('profielBijgewerkt');

  const bijgewerkt = document.createElement('div');
  bijgewerkt.className = 'opgeslagen-melding';
  bijgewerkt.textContent = '✓ Profiel bijgewerkt';
  document.body.appendChild(bijgewerkt);

  setTimeout(() => bijgewerkt.classList.add('weg'), 2500);
  setTimeout(() => bijgewerkt.remove(), 3000);
}

const bewerkKnop = document.querySelector('#bewerk-knop');
const formulier = document.querySelector('#bewerk-formulier');
const melding = document.querySelector('#bewerk-melding');
const kaartLogo = document.querySelector('#kaart-logo');
const fotoVoorbeeld = document.querySelector('#foto-voorbeeld');
const fotoInvoer = document.querySelector('#invoer-foto');

let nieuweFoto;
let huidigeNaam = '';

function toonFotoKnoppen(heeftFoto) {
  document.querySelector('#foto-kies').textContent = heeftFoto ? 'Foto wijzigen' : 'Foto uploaden';
  document.querySelector('#foto-verwijderen').hidden = !heeftFoto;
}

function sluitFormulier() {
  formulier.hidden = true;
  kaartLogo.hidden = false;
  melding.textContent = '';
  nieuweFoto = undefined;
  fotoInvoer.value = '';
}

bewerkKnop.addEventListener('click', async () => {
  if (!formulier.hidden) {
    sluitFormulier();
    return;
  }

  const antwoord = await fetch('/api/profiel');
  const profiel = await antwoord.json();

  huidigeNaam = profiel.naam;
  document.querySelector('#invoer-naam').value = profiel.naam;
  document.querySelector('#invoer-studiejaar').value = profiel.studiejaar;
  document.querySelector('#invoer-tribe').value = profiel.tribe;
  document.querySelector('#invoer-helpen').value = profiel.helpen;
  toonAvatar(fotoVoorbeeld, profiel.naam, profiel.foto);
  toonFotoKnoppen(Boolean(profiel.foto));

  const mijnInteresses = profiel.interesses.split(',');
  document.querySelectorAll('input[name="interesse"]').forEach((vakje) => {
    vakje.checked = mijnInteresses.includes(vakje.value);
  });

  nieuweFoto = undefined;
  formulier.hidden = false;
  kaartLogo.hidden = true;
});

function verkleinFoto(bestand) {
  return new Promise((klaar, mislukt) => {
    const plaatje = new Image();
    plaatje.onload = () => {
      const zijde = Math.min(plaatje.width, plaatje.height);
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      canvas.getContext('2d').drawImage(
        plaatje,
        (plaatje.width - zijde) / 2, (plaatje.height - zijde) / 2, zijde, zijde,
        0, 0, 256, 256
      );
      URL.revokeObjectURL(plaatje.src);
      klaar(canvas.toDataURL('image/jpeg', 0.85));
    };
    plaatje.onerror = mislukt;
    plaatje.src = URL.createObjectURL(bestand);
  });
}

fotoInvoer.addEventListener('change', async () => {
  const bestand = fotoInvoer.files[0];
  if (!bestand) return;

  try {
    nieuweFoto = await verkleinFoto(bestand);
    toonAvatar(fotoVoorbeeld, huidigeNaam, nieuweFoto);
    toonFotoKnoppen(true);
    melding.textContent = '';
  } catch {
    melding.textContent = 'Dit bestand is geen foto die we kunnen gebruiken.';
  }
});

document.querySelector('#foto-verwijderen').addEventListener('click', () => {
  nieuweFoto = null;
  fotoInvoer.value = '';
  toonAvatar(fotoVoorbeeld, huidigeNaam, null);
  toonFotoKnoppen(false);
});

document.querySelector('#annuleren-knop').addEventListener('click', sluitFormulier);

formulier.addEventListener('submit', async (event) => {
  event.preventDefault();

  const aangevinkt = [];
  document.querySelectorAll('input[name="interesse"]:checked').forEach((vakje) => {
    aangevinkt.push(vakje.value);
  });

  const antwoord = await fetch('/api/profiel', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      naam: document.querySelector('#invoer-naam').value,
      studiejaar: document.querySelector('#invoer-studiejaar').value,
      tribe: document.querySelector('#invoer-tribe').value,
      interesses: aangevinkt,
      helpen: document.querySelector('#invoer-helpen').value,
      foto: nieuweFoto
    })
  });
  const resultaat = await antwoord.json();

  if (antwoord.ok) {
    sessionStorage.setItem('profielBijgewerkt', 'ja');
    location.reload();
  } else {
    melding.textContent = resultaat.fout;
  }
});
