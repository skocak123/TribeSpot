const chatNaam = document.querySelector(".chat-naam");
const berichtenVak = document.querySelector(".chat-berichten");
const invoerForm = document.querySelector(".chat-invoer");
const tekstInput = document.querySelector(".chat-tekst");
const verstuurKnop = document.querySelector(".chat-verstuur");
const onlineLijst = document.querySelector(".online-gebruikers");
const offlineLijst = document.querySelector(".offline-gebruikers");
const inboxLijst = document.querySelector(".inbox-lijst");
const inboxLeeg = document.querySelector(".inbox-leeg");

let mijnGebruikersnaam = null;

let gekozenGebruiker = null;

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

let inboxBezig = false;

function laadInbox() {
  if (inboxBezig) return;
  inboxBezig = true;
  fetch("/api/inbox")
    .then(function (res) {
      return res.ok ? res.json() : [];
    })
    .then(toonInbox)
    .catch(function (err) {
      console.log(err);
    })
    .finally(function () {
      inboxBezig = false;
    });
}

function toonInbox(gesprekken) {
  inboxLijst.innerHTML = "";
  inboxLeeg.hidden = gesprekken.length > 0;

  for (const gesprek of gesprekken) {
    const ongelezen = gesprek.gebruikersnaam === gekozenGebruiker ? 0 : gesprek.ongelezen;

    const li = document.createElement("li");
    li.dataset.gebruikersnaam = gesprek.gebruikersnaam;
    li.classList.toggle("ongelezen", ongelezen > 0);
    li.classList.toggle("actief", gesprek.gebruikersnaam === gekozenGebruiker);

    const avatar = document.createElement("span");
    avatar.className = "inbox-avatar";
    avatar.textContent = gesprek.naam.charAt(0).toUpperCase();

    const midden = document.createElement("span");
    midden.className = "inbox-midden";
    const naam = document.createElement("strong");
    naam.className = "inbox-naam";
    naam.textContent = gesprek.naam;
    const laatste = document.createElement("span");
    laatste.className = "inbox-laatste";
    laatste.textContent = (gesprek.van_mij ? "Jij: " : "") + gesprek.laatste;
    midden.append(naam, laatste);

    const rechts = document.createElement("span");
    rechts.className = "inbox-rechts";
    const tijd = document.createElement("span");
    tijd.className = "inbox-tijd";
    tijd.textContent = gesprek.tijd;
    rechts.appendChild(tijd);
    if (ongelezen > 0) {
      const badge = document.createElement("span");
      badge.className = "inbox-badge";
      badge.textContent = ongelezen > 99 ? "99+" : ongelezen;
      badge.setAttribute("aria-label", ongelezen + " ongelezen");
      rechts.appendChild(badge);
    }

    li.append(avatar, midden, rechts);
    li.addEventListener("click", function () {
      kiesGebruiker(gesprek);
    });
    inboxLijst.appendChild(li);
  }
}

function kiesGebruiker(gebruiker) {
  gekozenGebruiker = gebruiker.gebruikersnaam;
  window.huidigeChat = gekozenGebruiker;
  chatNaam.textContent = gebruiker.naam;
  tekstInput.disabled = false;
  verstuurKnop.disabled = false;
  tekstInput.focus();

  document.querySelectorAll(".gebruikers-lijst li, .inbox-lijst li").forEach(function (li) {
    li.classList.toggle("actief", li.dataset.gebruikersnaam === gekozenGebruiker);
  });
  const open = inboxLijst.querySelector('li[data-gebruikersnaam="' + CSS.escape(gekozenGebruiker) + '"]');
  if (open) {
    open.classList.remove("ongelezen");
    const badge = open.querySelector(".inbox-badge");
    if (badge) badge.remove();
  }

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
      if (naam === gekozenGebruiker) {
        toonBerichten(berichten);
      }
      if (typeof window.verversOngelezen === "function") {
        window.verversOngelezen();
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
      laadInbox();
    })
    .catch(function (err) {
      console.log(err);
      alert("Het bericht kon niet worden verstuurd.");
    });
});

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
    laadInbox();
    openGesprekUitLink();
  })
  .catch(function (err) {
    console.log(err);
    laadGebruikers();
  });

function openGesprekUitLink() {
  const met = new URLSearchParams(window.location.search).get("met");
  if (!met) return;

  fetch("/api/online")
    .then(function (res) {
      return res.json();
    })
    .then(function (data) {
      const iedereen = data.online.concat(data.offline);
      const gebruiker = iedereen.find(function (g) {
        return g.gebruikersnaam === met;
      });
      if (gebruiker) {
        kiesGebruiker(gebruiker);
        laadInbox();
      }
    })
    .catch(function (err) {
      console.log(err);
    });
}

setInterval(laadBerichten, 3000);
setInterval(laadInbox, 5000);
