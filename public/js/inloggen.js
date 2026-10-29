const formulier = document.getElementById('inlogformulier');
const foutmelding = document.getElementById('foutmelding');

formulier.addEventListener('submit', async (event) => {
  event.preventDefault();
  foutmelding.hidden = true;

  const email = document.getElementById('email').value;
  const wachtwoord = document.getElementById('wachtwoord').value;

  try {
    const antwoord = await fetch('/api/inloggen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, wachtwoord })
    });
    const data = await antwoord.json();

    if (antwoord.ok) {
      window.location.href = 'index.html';
    } else {
      foutmelding.textContent = data.fout;
      foutmelding.hidden = false;
    }
  } catch (fout) {
    foutmelding.textContent = 'De server reageert niet. Draait hij wel?';
    foutmelding.hidden = false;
  }
});