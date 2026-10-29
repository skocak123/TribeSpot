
async function laadProfiel() {
  const antwoord = await fetch('/api/profiel');
  const profiel = await antwoord.json();

  document.querySelector('#naam').textContent = profiel.naam;
  document.querySelector('#tribe').textContent = 'Tribe ' + profiel.tribe + ' · jaar ' + profiel.studiejaar;
  document.querySelector('#avatar').textContent = profiel.naam[0];
  
  const interesses = profiel.interesses.split(',');
  interesses.forEach((interesse) => {
    const knopje = document.createElement('span');
    knopje.className = 'label';
    knopje.textContent = interesse;
    document.querySelector('#interesses').appendChild(knopje);
  });

  document.querySelector('#helpen').innerHTML = '<span class="label">' + profiel.helpen + '</span>';

}

laadProfiel();
const bewerkKnop = document.querySelector('#bewerk-knop');
const formulier = document.querySelector('#bewerk-formulier');
const melding = document.querySelector('#bewerk-melding');

bewerkKnop.addEventListener('click', async () => {
    formulier.hidden = !formulier.hidden;
  document.querySelector('#kaart-logo').hidden = !formulier.hidden;

  const antwoord = await fetch('/api/profiel');
  const profiel = await antwoord.json();

  document.querySelector('#invoer-naam').value = profiel.naam;
  document.querySelector('#invoer-studiejaar').value = profiel.studiejaar;
  document.querySelector('#invoer-tribe').value = profiel.tribe;
  document.querySelector('#invoer-helpen').value = profiel.helpen;

  const mijnInteresses = profiel.interesses.split(',');
  document.querySelectorAll('input[name="interesse"]').forEach((vakje) => {
    vakje.checked = mijnInteresses.includes(vakje.value);
  });
});

// Klik op "Opslaan": gegevens naar de server sturen
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
      helpen: document.querySelector('#invoer-helpen').value
    })
  });
  const resultaat = await antwoord.json();

  if (antwoord.ok) {
    location.reload();
  } else {
    melding.textContent = resultaat.fout;
  }
});

