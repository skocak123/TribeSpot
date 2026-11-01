const chatNaam = document.querySelector(".chat-naam");
const berichtenVak = document.querySelector(".chat-berichten");
const invoerForm = document.querySelector(".chat-invoer");
const tekstInput = document.querySelector(".chat-tekst");
const verstuurKnop = document.querySelector(".chat-verstuur");
const onlineLijst = document.querySelector(".online-gebruikers");
const offlineLijst = document.querySelector(".offline-gebruikers");

// Berichten per gebruiker. Worden nog niet opgeslagen in de database.
const gesprekken = {};
let gekozenGebruiker = null;

function vulLijst(lijst, gebruikers) {
  lijst.innerHTML = "";
  for (const gebruiker of gebruikers) {
    const li = document.createElement("li");
    li.textContent = gebruiker.naam;
    if (gebruiker.naam === gekozenGebruiker) {
      li.classList.add("actief");
    }
    li.addEventListener("click", function () {
      kiesGebruiker(gebruiker.naam);
    });
    lijst.appendChild(li);
  }
}

function laadGebruikers() {
  fetch("/api/online")
    .then(function (res) {
      return res.json();
    })
    .then(function (data) {
      vulLijst(onlineLijst, data.online);
      vulLijst(offlineLijst, data.offline);
    })
    .catch(function (err) {
      console.log(err);
    });
}

function kiesGebruiker(naam) {
  gekozenGebruiker = naam;
  chatNaam.textContent = naam;
  tekstInput.disabled = false;
  verstuurKnop.disabled = false;
  tekstInput.focus();

  document.querySelectorAll(".gebruikers-lijst li").forEach(function (li) {
    li.classList.toggle("actief", li.textContent === naam);
  });

  toonBerichten();
}

function toonBerichten() {
  berichtenVak.innerHTML = "";
  const berichten = gesprekken[gekozenGebruiker] || [];

  if (berichten.length === 0) {
    const leeg = document.createElement("p");
    leeg.className = "chat-leeg";
    leeg.textContent = "Nog geen berichten met " + gekozenGebruiker + ". Zeg hallo!";
    berichtenVak.appendChild(leeg);
    return;
  }

  for (const bericht of berichten) {
    const div = document.createElement("div");
    div.className = "bericht";
    if (bericht.vanMij) {
      div.classList.add("van-mij");
    }
    div.textContent = bericht.tekst;

    const tijd = document.createElement("span");
    tijd.className = "tijd";
    tijd.textContent = bericht.tijd;
    div.appendChild(tijd);

    berichtenVak.appendChild(div);
  }
  berichtenVak.scrollTop = berichtenVak.scrollHeight;
}

invoerForm.addEventListener("submit", function (event) {
  event.preventDefault();
  const tekst = tekstInput.value.trim();
  if (!tekst || !gekozenGebruiker) {
    return;
  }

  if (!gesprekken[gekozenGebruiker]) {
    gesprekken[gekozenGebruiker] = [];
  }
  gesprekken[gekozenGebruiker].push({
    tekst: tekst,
    vanMij: true,
    tijd: new Date().toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" }),
  });

  tekstInput.value = "";
  toonBerichten();
});

laadGebruikers();
