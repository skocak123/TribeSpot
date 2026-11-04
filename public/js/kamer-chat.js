(function () {
  const box = document.getElementById('chat');
  if (!box) return;

  const kamer = box.dataset.kamer;
  let laatsteId = 0;
  let bezig = false;

  box.innerHTML = `
    <div class="chat-berichten"></div>
    <form class="chat-form">
      <input type="text" maxlength="500" placeholder="Typ een bericht..." required>
      <button type="submit">Verstuur</button>
    </form>
  `;
  const lijst = box.querySelector('.chat-berichten');
  const form = box.querySelector('.chat-form');
  const invoer = form.querySelector('input');

  function voegToe(b) {
    const rij = document.createElement('div');
    rij.className = 'chat-bericht' + (b.ik ? ' chat-ik' : '');

    const naam = document.createElement('span');
    naam.className = 'chat-naam';
    naam.textContent = b.ik ? 'Jij' : b.gebruikersnaam;

    const tijd = document.createElement('span');
    tijd.className = 'chat-tijd';
    tijd.textContent = b.tijd; // de server geeft de tijd al als "13:05"

    const tekst = document.createElement('p');
    tekst.textContent = b.bericht; // textContent = veilig

    rij.append(naam, tijd, tekst);
    lijst.appendChild(rij);
  }

  async function haalOp() {
    // niet twee keer tegelijk ophalen, anders komen berichten dubbel in beeld
    if (bezig) return;
    bezig = true;
    try {
      const res = await fetch(`/api/kamers/${kamer}/berichten?na=${laatsteId}`);
      if (res.status === 401) {
        window.location.href = '/inloggen.html';
        return;
      }
      const nieuw = await res.json();
      if (!Array.isArray(nieuw) || nieuw.length === 0) return;

      const onderaan = lijst.scrollHeight - lijst.scrollTop - lijst.clientHeight < 60;
      const eerste = laatsteId === 0;
      nieuw.forEach((b) => {
        voegToe(b);
        laatsteId = b.id;
      });
      if (onderaan || eerste) {
        lijst.scrollTop = lijst.scrollHeight;
      }
    } catch (err) {
      console.log('Berichten ophalen mislukt', err);
    } finally {
      bezig = false;
    }
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const tekst = invoer.value.trim();
    if (!tekst) return;

    try {
      const res = await fetch(`/api/kamers/${kamer}/berichten`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bericht: tekst })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.fout || 'Het bericht kon niet worden verstuurd.');
        return;
      }
      invoer.value = '';
    } catch (err) {
      alert('Het bericht kon niet worden verstuurd.');
      return;
    }
    await haalOp();
    lijst.scrollTop = lijst.scrollHeight;
  });

  haalOp();
  setInterval(haalOp, 3000); // elke 3 seconden nieuwe berichten
})();
