const chatNaam = document.querySelector(".chat-naam");
const berichtenVak = document.querySelector(".chat-berichten");
const invoerForm = document.querySelector(".chat-invoer");
const tekstInput = document.querySelector(".chat-tekst");
const verstuurKnop = document.querySelector(".chat-verstuur");
const onlineLijst = document.querySelector(".online-gebruikers");
const offlineLijst = document.querySelector(".offline-gebruikers");

// Er is nog geen inlogsysteem, dus net als in main.js zijn we altijd selim.
const mijnNaam = "selim";

let gekozenGebruiker = null;

function vulLijst(lijst, gebruikers) {
  lijst.innerHTML = "";
  for (const gebruiker of gebruikers) {
    if (gebruiker.naam === mijnNaam) {
      continue;
    }
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

  berichtenVak.innerHTML = "";
  laadBerichten();
}

function laadBerichten() {
  if (!gekozenGebruiker) {
    return;
  }
  const naam = gekozenGebruiker;
  fetch("/api/berichten/" + encodeURIComponent(naam))
    .then(function (res) {
      return res.json();
    })
    .then(function (berichten) {
      // Ondertussen kan er al iemand anders gekozen zijn.
      if (naam === gekozenGebruiker) {
        toonBerichten(berichten);
      }
    })
    .catch(function (err) {
      console.log(err);
    });
}

function toonBerichten(berichten) {
  const wasOnderaan =
    berichtenVak.scrollHeight - berichtenVak.scrollTop - berichtenVak.clientHeight < 50;
  berichtenVak.innerHTML = "";

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
    if (bericht.van_mij) {
      div.classList.add("van-mij");
    }
    div.textContent = bericht.tekst;

    const tijd = document.createElement("span");
    tijd.className = "tijd";
    tijd.textContent = bericht.tijd;
    div.appendChild(tijd);

    berichtenVak.appendChild(div);
  }
  if (wasOnderaan) {
    berichtenVak.scrollTop = berichtenVak.scrollHeight;
  }
}

invoerForm.addEventListener("submit", function (event) {
  event.preventDefault();
  const tekst = tekstInput.value.trim();
  if (!tekst || !gekozenGebruiker) {
    return;
  }

  fetch("/api/berichten", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ naar: gekozenGebruiker, tekst: tekst }),
  })
    .then(function (res) {
      if (!res.ok) {
        throw new Error("Versturen mislukt");
      }
      tekstInput.value = "";
      berichtenVak.scrollTop = berichtenVak.scrollHeight;
      laadBerichten();
    })
    .catch(function (err) {
      console.log(err);
      alert("Het bericht kon niet worden verstuurd.");
    });
});

laadGebruikers();

// Elke 3 seconden kijken of er nieuwe berichten zijn.
setInterval(laadBerichten, 3000);
