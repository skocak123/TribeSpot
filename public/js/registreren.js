const formulier = document.getElementById('registreerformulier');
const foutmelding = document.getElementById('foutmelding');

formulier.addEventListener('submit', async (event) => {
  event.preventDefault();
  foutmelding.hidden = true;

  const gegevens = {
    naam: document.getElementById('naam').value,
    gebruikersnaam: document.getElementById('gebruikersnaam').value,
    email: document.getElementById('email').value,
    wachtwoord: document.getElementById('wachtwoord').value,
    studiejaar: document.getElementById('studiejaar').value,
    tribe: formulier.querySelector('input[name="tribe"]:checked').value,
    interesses: Array.from(
      formulier.querySelectorAll('input[name="interesses"]:checked')
    ).map((vakje) => vakje.value),
    helpen: document.getElementById('helpen').value
  };

  try {
    const antwoord = await fetch('/api/registreren', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(gegevens)
    });
    const data = await antwoord.json();

    if (antwoord.ok) {
      window.location.href = 'inloggen.html';
    } else {
      foutmelding.textContent = data.fout;
      foutmelding.hidden = false;
    }
  } catch (fout) {
    foutmelding.textContent = 'De server reageert niet. Draait hij wel?';
    foutmelding.hidden = false;
  }
});