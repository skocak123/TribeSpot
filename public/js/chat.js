const chatNaam = document.querySelector(".chat-naam");
const berichtenVak = document.querySelector(".chat-berichten");
const invoerForm = document.querySelector(".chat-invoer");
const tekstInput = document.querySelector(".chat-tekst");
const verstuurKnop = document.querySelector(".chat-verstuur");
const onlineLijst = document.querySelector(".online-gebruikers");
const offlineLijst = document.querySelector(".offline-gebruikers");

// Wordt ingevuld met de gebruikersnaam van wie er ingelogd is (via /api/ik).
// We werken met gebruikersnamen omdat die uniek zijn; twee mensen kunnen dezelfde naam hebben.
let mijnGebruikersnaam = null;

let gekozenGebruiker = null; // gebruikersnaam van met wie je chat

function vulLijst(lijst, gebruikers) {
  lijst.innerHTML = "";
  for (const gebruiker of gebruikers) {
    if (gebruiker.gebruikersnaam === mijnGebruikersnaam) {
      continue;
    }
    const li = document.createElement("li");
    li.dataset.gebruikersnaam = gebruiker.gebruikersnaam;
    li.textContent = gebruiker.naam;

    const handle = document.createElement("small");
    handle.textContent = " @" + gebruiker.gebruikersnaam;
    li.appendChild(handle);

    if (gebruiker.gebruikersnaam === gekozenGebruiker) {
      li.classList.add("actief");
    }
    li.addEventListener("click", function () {
      kiesGebruiker(gebruiker);
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

function kiesGebruiker(gebruiker) {
  gekozenGebruiker = gebruiker.gebruikersnaam;
  chatNaam.textContent = gebruiker.naam;
  tekstInput.disabled = false;
  verstuurKnop.disabled = false;
  tekstInput.focus();

  document.querySelectorAll(".gebruikers-lijst li").forEach(function (li) {
    li.classList.toggle("actief", li.dataset.gebruikersnaam === gekozenGebruiker);
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
    leeg.textContent = "Nog geen berichten met " + chatNaam.textContent + ". Zeg hallo!";
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

// Eerst ophalen wie er ingelogd is, dan pas de lijst vullen (anders sta je zelf in de lijst).
fetch("/api/ik")
  .then(function (res) {
    if (res.status === 401) {
      window.location.href = "/inloggen.html";
      return null;
    }
    return res.json();
  })
  .then(function (ik) {
    if (ik) {
      mijnGebruikersnaam = ik.gebruikersnaam;
    }
    laadGebruikers();
  })
  .catch(function (err) {
    console.log(err);
    laadGebruikers();
  });

// Elke 3 seconden kijken of er nieuwe berichten zijn.
setInterval(laadBerichten, 3000);
