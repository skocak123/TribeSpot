const floorMenu = document.querySelector(".floor-select");
const mapImage = document.querySelector(".map-image");
const mapRooms = document.querySelector(".map-rooms");
const roomPanel = document.querySelector(".room-panel");
const roomTitle = document.querySelector("#room-title");
const roomInfo = document.querySelector(".room-info");
const seatsBox = roomPanel.querySelector(".room-seats");
const roomClose = document.querySelector(".room-close");
const spotList = document.querySelector(".spot-list");
const announcer = document.querySelector("[aria-live]");

const layouts = {
  lokaal: { table: "desk-row", tables: 3, seats: 6 },
  project: { table: "group", tables: 4, seats: 4 },
  pc: { table: "pc-row", tables: 2, seats: 6 },
  gang: { table: "desk-row", tables: 2, seats: 5 },
  werkplek: { table: "group", tables: 4, seats: 4 },
  stilte: { table: "desk-row", tables: 2, seats: 3 },
};

let allStatuses = [];
let floorStatuses = [];
let openRoom = null;
let openedFrom = null;

function currentFloor() {
  return verdiepingen[Number(floorMenu.value)];
}

function statusesIn(naam) {
  return floorStatuses.filter(function (status) {
    return status.lokaal === naam;
  });
}

function peopleText(count) {
  if (count === 0) return "niemand";
  if (count === 1) return "1 persoon";
  return count + " personen";
}

function describeSpot(lokaal) {
  const statuses = statusesIn(lokaal.naam);
  const soort = lokaal.soort === "stilte" ? "stilteplek, alleen focus" : "werkplek";
  let text = lokaal.naam + ", " + soort + ", " + peopleText(statuses.length);
  if (statuses.length > 0) {
    text += ": " + statuses.map(function (status) {
      return status.naam + " " + status.beschikbaarheid;
    }).join(", ");
  }
  return text;
}

function shortLabel(lokaal) {
  if (lokaal.kort) return lokaal.kort;
  if (lokaal.naam.startsWith("Werkplek ")) return lokaal.naam.slice(-1);
  if (lokaal.soort === "stilte") {
    const stilte = currentFloor().lokalen.filter(function (plek) {
      return plek.soort === "stilte";
    });
    return "S" + (stilte.indexOf(lokaal) + 1);
  }
  return lokaal.naam.split(" ").map(function (woord) {
    return woord[0].toUpperCase();
  }).join("");
}

function spotContent(element, lokaal, withName) {
  const statuses = statusesIn(lokaal.naam);
  element.textContent = "";

  const label = document.createElement("span");
  label.className = "spot-label";
  label.textContent = shortLabel(lokaal);
  element.appendChild(label);

  if (withName) {
    const name = document.createElement("span");
    name.className = "spot-name";
    name.textContent = lokaal.naam;
    element.appendChild(name);
  } else {
    element.title = lokaal.naam;
  }

  if (statuses.length > 0) {
    const dots = document.createElement("span");
    dots.className = "marker-dots";
    dots.setAttribute("aria-hidden", "true");
    for (let i = 0; i < statuses.length; i++) {
      const dot = document.createElement("span");
      dot.className = "status-dot " + statusColors[statuses[i].beschikbaarheid];
      dots.appendChild(dot);
    }
    const count = document.createElement("span");
    count.className = "marker-count";
    count.textContent = statuses.length;
    dots.appendChild(count);
    element.appendChild(dots);
  }
  element.setAttribute("aria-label", describeSpot(lokaal));
}

function showFloor() {
  const floor = currentFloor();
  mapImage.src = "assets/images/plattegrond/" + floor.plaatje;
  roomPanel.parentElement.style.setProperty("--verhouding", floor.verhouding);
  mapImage.alt = "Plattegrond " + floor.naam + ". De plekken staan ook in de lijst onder de plattegrond.";
  closeRoom();

  mapRooms.innerHTML = "";
  for (let i = 0; i < floor.lokalen.length; i++) {
    const lokaal = floor.lokalen[i];
    const marker = document.createElement("button");
    marker.className = "room-marker " + (lokaal.soort === "stilte" ? "stilte" : "werkplek");
    marker.style.left = "clamp(var(--marker-half), " + lokaal.x + "%, calc(100% - var(--marker-half)))";
    marker.style.top = "clamp(14px, " + lokaal.y + "%, calc(100% - 14px))";
    marker.dataset.room = lokaal.naam;
    marker.addEventListener("click", function () {
      openRoomPanel(lokaal, marker);
    });
    mapRooms.appendChild(marker);
  }
  showSpots();
}

function showSpots() {
  const floor = currentFloor();
  const markers = mapRooms.querySelectorAll(".room-marker");
  for (let i = 0; i < markers.length; i++) {
    spotContent(markers[i], floor.lokalen[i], false);
  }

  spotList.innerHTML = "";
  for (let i = 0; i < floor.lokalen.length; i++) {
    const lokaal = floor.lokalen[i];
    const item = document.createElement("li");
    const button = document.createElement("button");
    button.className = "spot-button " + (lokaal.soort === "stilte" ? "stilte" : "werkplek");
    spotContent(button, lokaal, true);
    button.addEventListener("click", function () {
      openRoomPanel(lokaal, button);
    });
    item.appendChild(button);
    spotList.appendChild(item);
  }

  for (let i = 0; i < floorMenu.options.length; i++) {
    const option = floorMenu.options[i];
    const count = allStatuses.filter(function (status) {
      return status.verdieping === Number(option.value);
    }).length;
    option.textContent = verdiepingen[i].naam + (count > 0 ? " (" + count + ")" : "");
  }
}

function makeSeat(table, number) {
  const seat = document.createElement("button");
  seat.className = "seat";
  seat.dataset.table = table;
  seat.dataset.number = number;
  seat.textContent = number;
  seat.addEventListener("click", function () {
    clickSeat(seat);
  });
  return seat;
}

function buildDrawnSeats(lokaal) {
  const layout = layouts[lokaal.soort];
  if (lokaal.soort === "lokaal") {
    const board = document.createElement("div");
    board.className = "board";
    seatsBox.appendChild(board);
  }

  let number = 1;
  for (let i = 0; i < layout.tables; i++) {
    const table = document.createElement("div");
    table.className = layout.table;
    table.dataset.table = i + 1;
    for (let j = 0; j < layout.seats; j++) {
      const seat = makeSeat(i + 1, number++);
      if (lokaal.soort === "pc") {
        const pc = document.createElement("span");
        pc.className = "pc";
        pc.appendChild(seat);
        table.appendChild(pc);
      } else {
        table.appendChild(seat);
      }
    }
    seatsBox.appendChild(table);
  }
}

function cropAround(area, ratio) {
  const unitW = area.b * ratio;
  const unitH = area.h;
  const margin = Math.max(10, 0.5 * Math.max(unitW, unitH));
  let width = Math.max(unitW + 2 * margin, 35 * ratio);
  let height = unitH + 2 * margin;
  if (width < height * 2) width = height * 2;
  if (width > height * 3.2) height = width / 3.2;

  const crop = {
    b: Math.min(100, width / ratio),
    h: Math.min(100, height),
  };
  crop.x = Math.min(Math.max(0, area.x + area.b / 2 - crop.b / 2), 100 - crop.b);
  crop.y = Math.min(Math.max(0, area.y + area.h / 2 - crop.h / 2), 100 - crop.h);
  return crop;
}

function offset(percent, pixels) {
  return "calc(" + percent + "% " + (pixels < 0 ? "- " : "+ ") + Math.abs(pixels) + "px)";
}

function buildMapSeats(lokaal) {
  const floor = currentFloor();
  const area = lokaal.gebied;
  const crop = cropAround(area, floor.verhouding);

  const map = document.createElement("div");
  map.className = "room-photo room-map";
  map.style.aspectRatio = crop.b * floor.verhouding + " / " + crop.h;

  const image = document.createElement("img");
  image.src = "assets/images/plattegrond/" + floor.plaatje;
  image.alt = "";
  image.style.width = (100 / crop.b) * 100 + "%";
  image.style.left = (-crop.x / crop.b) * 100 + "%";
  image.style.top = (-crop.y / crop.h) * 100 + "%";
  map.appendChild(image);

  const highlight = document.createElement("div");
  highlight.className = "map-area";
  highlight.style.left = ((area.x - crop.x) / crop.b) * 100 + "%";
  highlight.style.top = ((area.y - crop.y) / crop.h) * 100 + "%";
  highlight.style.width = (area.b / crop.b) * 100 + "%";
  highlight.style.height = (area.h / crop.h) * 100 + "%";
  map.appendChild(highlight);

  seatsBox.appendChild(map);
  const free = roomPanel.clientHeight - roomPanel.querySelector(".room-header").offsetHeight - 72;
  map.style.maxWidth = Math.max(240, free * ((crop.b * floor.verhouding) / crop.h)) + "px";

  const count = lokaal.tafels;
  const box = highlight.getBoundingClientRect();
  let cols = 1;
  let best = 0;
  for (let c = 1; c <= count; c++) {
    const r = Math.ceil(count / c);
    const fit = Math.min(box.width / c / 62, box.height / r / 62);
    if (fit > best) {
      best = fit;
      cols = c;
    }
  }
  const rows = Math.ceil(count / cols);
  const scale = Math.max(0.6, Math.min(1, best));
  map.style.setProperty("--stoel-schaal", scale);
  const chairs = [[-13, -19], [13, -19], [-13, 19], [13, 19]];

  let number = 1;
  for (let i = 0; i < count; i++) {
    const x = ((area.x - crop.x + (area.b * ((i % cols) + 0.5)) / cols) / crop.b) * 100;
    const y = ((area.y - crop.y + (area.h * (Math.floor(i / cols) + 0.5)) / rows) / crop.h) * 100;

    const table = document.createElement("span");
    table.className = "map-table";
    table.dataset.table = i + 1;
    table.style.left = x + "%";
    table.style.top = y + "%";
    map.appendChild(table);

    for (let j = 0; j < chairs.length; j++) {
      const seat = makeSeat(i + 1, number++);
      seat.style.left = offset(x, chairs[j][0] * scale);
      seat.style.top = offset(y, chairs[j][1] * scale);
      map.appendChild(seat);
    }
  }
}

function openRoomPanel(lokaal, from) {
  openRoom = lokaal;
  openedFrom = from;
  roomPanel.parentElement.scrollLeft = 0;
  roomTitle.textContent = lokaal.naam;

  seatsBox.innerHTML = "";
  seatsBox.className = "room-seats " + (lokaal.gebied ? "photo" : lokaal.soort);
  roomPanel.hidden = false;

  if (lokaal.gebied) {
    buildMapSeats(lokaal);
  } else {
    buildDrawnSeats(lokaal);
  }

  fillSeats();
  roomTitle.focus();
}

function closeRoom() {
  if (openRoom === null) return;
  clearChosenSeat();
  openRoom = null;
  roomPanel.hidden = true;
  seatsBox.innerHTML = "";
  if (openedFrom !== null && document.contains(openedFrom)) {
    openedFrom.focus();
  }
  openedFrom = null;
}

roomClose.addEventListener("click", closeRoom);

document.addEventListener("keydown", function (event) {
  if (event.key === "Escape" && openRoom !== null && !card.matches(":popover-open")) {
    closeRoom();
  }
});

floorMenu.addEventListener("change", function () {
  showFloor();
  loadStatuses();
});

const statusNames = { green: "Aanschuiven", yellow: "Vragen", red: "Focus" };
const statusWords = { green: "aanschuiven", yellow: "vragen", red: "focus" };
const statusColors = { aanschuiven: "green", vragen: "yellow", focus: "red" };

const card = document.querySelector("#student-card");
const joinButton = document.querySelector(".join-button");
const onlineCount = document.querySelector(".online-count");

const roomInput = document.querySelector(".my-room");
const workInput = document.querySelector(".my-work");
const timeSelect = document.querySelector(".my-time");
const statusButtons = document.querySelectorAll(".status-button");
const shareButton = document.querySelector(".share-button");
const leaveButton = document.querySelector(".leave-button");

fetch("/api/ik").then(function (response) {
  if (!response.ok) {
    window.location.href = "inloggen.html";
  }
});

function isMijnStoel(seat) {
  return seat.dataset.ik === "true";
}

let chosenStatus = "";
let chosenSeat = null;
let cardSeat = null;

function clearChosenSeat() {
  if (chosenSeat !== null) {
    chosenSeat.classList.remove("chosen-seat");
    chosenSeat.removeAttribute("aria-pressed");
  }
  chosenSeat = null;
  if (!zitAl) {
    roomInput.value = "";
  }
  lockStatus(null);
}

function tableSeats(seat) {
  return seatsBox.querySelectorAll('.seat[data-table="' + seat.dataset.table + '"]');
}

function tableIsFull(seat) {
  const seats = tableSeats(seat);
  for (let i = 0; i < seats.length; i++) {
    if (!seats[i].dataset.name) {
      return false;
    }
  }
  return true;
}

function markFullTables() {
  const tables = seatsBox.querySelectorAll(":not(.seat)[data-table]");
  for (let i = 0; i < tables.length; i++) {
    const firstSeat = seatsBox.querySelector('.seat[data-table="' + tables[i].dataset.table + '"]');
    const full = firstSeat !== null && tableIsFull(firstSeat);
    tables[i].classList.toggle("tafel-vol", full);
    tables[i].title = full ? "Deze tafel is vol" : "";
  }
}

function tableHasJoiner(seat) {
  const seats = tableSeats(seat);
  for (let i = 0; i < seats.length; i++) {
    if (seats[i].classList.contains("green") && !isMijnStoel(seats[i])) {
      return true;
    }
  }
  return false;
}

function lockStatus(forced) {
  for (let i = 0; i < statusButtons.length; i++) {
    const isForced = statusButtons[i].dataset.status === forced;
    statusButtons[i].disabled = zitAl || (forced !== null && !isForced);

    if (forced !== null) {
      statusButtons[i].classList.toggle("chosen", isForced);
    }
  }
  if (forced !== null) {
    chosenStatus = forced;
  }
}

function showCard(seat) {
  const color = seat.classList[1];

  card.querySelector(".card-name").textContent = seat.dataset.name;
  card.querySelector(".card-dot").className = "status-dot card-dot " + color;
  card.querySelector(".card-status").textContent = statusNames[color];
  card.querySelector(".card-work").textContent = seat.dataset.work;
  card.querySelector(".card-until").textContent = seat.dataset.until;
  const full = tableIsFull(seat);
  joinButton.hidden = color !== "green" || isMijnStoel(seat) || (full && !zitAl);
  card.querySelector(".card-vol").hidden = !full || isMijnStoel(seat) || zitAl;
  joinButton.classList.toggle("locked", zitAl);
  joinButton.setAttribute("aria-disabled", zitAl ? "true" : "false");
  if (zitAl) {
    joinButton.dataset.tip = "Je zit er al. Klik eerst op \"Ik ga weg\" om bij iemand anders aan te schuiven.";
  } else {
    delete joinButton.dataset.tip;
  }
  cardSeat = seat;

  const seatBox = seat.getBoundingClientRect();
  card.style.left = seatBox.left + seatBox.width / 2 + "px";
  card.style.top = seatBox.top + "px";

  card.showPopover();
}

function clickSeat(seat) {
  if (seat.dataset.name) {
    showCard(seat);
    return;
  }
  if (zitAl) {
    announcer.textContent = zitAlTekst;
    return;
  }

  clearChosenSeat();
  seat.classList.add("chosen-seat");
  seat.setAttribute("aria-pressed", "true");
  chosenSeat = seat;
  roomInput.value = openRoom.naam + ", stoel " + seat.dataset.number;

  let message = " Kies nu je status en tijd.";
  let forced = null;
  if (openRoom.soort === "stilte") {
    forced = "red";
    message = " Dit is een stilteplek, dus je status is Focus.";
  } else if (tableHasJoiner(seat)) {
    forced = "green";
    message = " Aan deze tafel zit iemand die je laat aanschuiven, dus je status is Aanschuiven.";
  }
  lockStatus(forced);
  announcer.textContent = "Stoel " + seat.dataset.number + " gekozen." + message;
}

function fillSeats() {
  const seats = seatsBox.querySelectorAll(".seat");
  for (let i = 0; i < seats.length; i++) {
    seats[i].className = "seat";
    seats[i].removeAttribute("aria-pressed");
    seats[i].setAttribute("aria-label", "Stoel " + seats[i].dataset.number + ", vrij");
    delete seats[i].dataset.name;
    delete seats[i].dataset.work;
    delete seats[i].dataset.until;
    delete seats[i].dataset.ik;
  }

  const statuses = statusesIn(openRoom.naam);
  for (let i = 0; i < statuses.length; i++) {
    const status = statuses[i];
    const seat = seats[status.plek - 1];
    if (!seat) continue;

    const color = statusColors[status.beschikbaarheid];
    seat.className = "seat " + color;
    seat.setAttribute("aria-label", "Stoel " + seat.dataset.number + ", " + status.naam + ", " + statusNames[color]);
    seat.dataset.name = status.naam;
    seat.dataset.work = status.werkt_aan;
    seat.dataset.until = status.tot;
    if (status.ik) {
      seat.dataset.ik = "true";
    }
  }

  markFullTables();
  for (let i = 0; i < seats.length; i++) {
    if (seats[i].dataset.name && tableIsFull(seats[i])) {
      seats[i].setAttribute("aria-label", seats[i].getAttribute("aria-label") + ", tafel vol");
    }
  }

  const tables = new Set(Array.from(seats, function (seat) {
    return seat.dataset.table;
  })).size;
  roomInfo.textContent = currentFloor().naam + " · " + tables + (tables === 1 ? " tafel" : " tafels") +
    (openRoom.tafelsGeteld ? "" : " (geschat)") + " · " + statuses.length + " van " + seats.length + " plekken bezet";
}

function loadStatuses() {
  fetch("/api/statussen")
    .then(function (response) {
      return response.json();
    })
    .then(function (statuses) {
      clearChosenSeat();
      allStatuses = statuses;
      floorStatuses = statuses.filter(function (status) {
        return status.verdieping === currentFloor().nummer;
      });
      showSpots();
      if (openRoom !== null) {
        fillSeats();
      }
      updateShareLock();
    })
    .catch(function () {
      alert("Kan de statussen niet ophalen. Draait de server?");
    });
}

let zitAl = false;
const tijdVak = timeSelect.closest(".field-box");
const werkVak = workInput.closest(".field-box");
const statusVak = document.querySelector(".status-buttons");
const tijdTekst = "Je zit er al. Je tijd kun je pas weer kiezen als je op \"Ik ga weg\" hebt geklikt.";
const werkTekst = "Je zit er al. Wat je doet kun je pas weer aanpassen als je op \"Ik ga weg\" hebt geklikt.";
const statusTekst = "Je zit er al. Je status kun je pas weer kiezen als je op \"Ik ga weg\" hebt geklikt.";

function lockVak(vak, opSlot, tekst) {
  vak.classList.toggle("locked", opSlot);
  if (opSlot) {
    vak.dataset.tip = tekst;
  } else {
    delete vak.dataset.tip;
  }
}

function lockTijd(status, wasAlGezeten) {
  const opSlot = status !== null;
  const tot = opSlot ? status.tot : null;
  if (opSlot) {
    roomInput.value = status.lokaal + ", stoel " + status.plek;
  } else if (wasAlGezeten) {
    roomInput.value = "";
  }
  workInput.disabled = opSlot;
  lockVak(werkVak, opSlot, werkTekst);
  for (let i = 0; i < statusButtons.length; i++) {
    statusButtons[i].disabled = opSlot;
  }
  lockVak(statusVak, opSlot, statusTekst);

  timeSelect.disabled = opSlot;
  tijdVak.classList.toggle("locked", opSlot);
  if (opSlot) {
    tijdVak.dataset.tip = tijdTekst;
    let optie = Array.from(timeSelect.options).find(function (o) {
      return o.value === tot;
    });
    if (!optie) {
      optie = new Option(tot, tot);
      optie.dataset.tijdelijk = "true";
      timeSelect.add(optie);
    }
    timeSelect.value = tot;
  } else {
    delete tijdVak.dataset.tip;
    timeSelect.querySelectorAll('option[data-tijdelijk="true"]').forEach(function (o) {
      o.remove();
    });
    if (wasAlGezeten) {
      timeSelect.selectedIndex = 0;
    }
  }
}
const zitAlTekst = "Je zit er al. Klik eerst op \"Ik ga weg\" om ergens anders te gaan zitten.";

function updateShareLock() {
  fetch("/api/mijn-status")
    .then(function (response) {
      return response.ok ? response.json() : null;
    })
    .then(function (status) {
      const wasAlGezeten = zitAl;
      zitAl = status !== null;
      shareButton.classList.toggle("locked", zitAl);
      shareButton.setAttribute("aria-disabled", zitAl ? "true" : "false");
      if (zitAl) {
        shareButton.dataset.tip = zitAlTekst;
      } else {
        delete shareButton.dataset.tip;
      }
      lockTijd(zitAl ? status : null, wasAlGezeten);
    })
    .catch(function (err) {
      console.log(err);
    });
}

function fillList(list, users) {
  list.innerHTML = "";
  for (let i = 0; i < users.length; i++) {
    const li = document.createElement("li");
    li.textContent = users[i].naam;
    list.appendChild(li);
  }
}

function loadOnline() {
  fetch("/api/online")
    .then(function (response) {
      return response.json();
    })
    .then(function (data) {
      onlineCount.textContent = data.online.length;
      fillList(document.querySelector(".online-list"), data.online);
      fillList(document.querySelector(".offline-list"), data.offline);
    });
}

showFloor();
loadStatuses();
loadOnline();

for (let i = 0; i < statusButtons.length; i++) {
  statusButtons[i].addEventListener("click", function () {
    for (let j = 0; j < statusButtons.length; j++) {
      statusButtons[j].classList.remove("chosen");
    }
    statusButtons[i].classList.add("chosen");
    chosenStatus = statusButtons[i].dataset.status;
  });
}

function sendStatus(seat, status, time) {
  fetch("/api/statussen", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      lokaal: openRoom.naam,
      plek: Number(seat.dataset.number),
      werkt_aan: workInput.value,
      beschikbaarheid: statusWords[status],
      tot: time,
      tafel: Number(seat.dataset.table),
    }),
  })
    .then(function (response) {
      return response.json();
    })
    .then(function (result) {
      if (result.fout) {
        alert(result.fout);
      } else {
        announcer.textContent = "Je status is gedeeld.";
      }
      loadStatuses();
      loadOnline();
    });
}

const werkVenster = document.querySelector("#werk-venster");
const werkForm = werkVenster.querySelector(".werk-form");
const werkInvoer = werkVenster.querySelector(".werk-invoer");
const werkFout = werkVenster.querySelector(".werk-fout");
const werkOk = werkVenster.querySelector(".werk-ok");
const werkTitel = werkVenster.querySelector("#werk-titel");
const werkDeel = werkVenster.querySelector(".werk-deel");
const tijdDeel = werkVenster.querySelector(".tijd-deel");
const tijdKeuze = werkVenster.querySelector(".tijd-keuze");
let naWerk = null;
let werkNodig = false;
let tijdNodig = false;

function tijdVanNuHHMM() {
  const nu = new Date();
  return String(nu.getHours()).padStart(2, "0") + ":" + String(nu.getMinutes()).padStart(2, "0");
}

function tijdenVanafNu() {
  const nu = tijdVanNuHHMM();
  return Array.from(timeSelect.options).slice(1).map(function (o) {
    return o.value;
  }).filter(function (t) {
    return t > nu;
  });
}

function vraagGegevens(knopTekst, voorstelTijd, doorgaan) {
  werkNodig = !workInput.value.trim();
  tijdNodig = timeSelect.selectedIndex === 0;
  if (!werkNodig && !tijdNodig) {
    doorgaan(timeSelect.value);
    return;
  }

  naWerk = doorgaan;
  werkOk.textContent = knopTekst;
  werkFout.hidden = true;
  werkDeel.hidden = !werkNodig;
  tijdDeel.hidden = !tijdNodig;
  werkTitel.textContent = werkNodig && tijdNodig ? "Nog even invullen"
    : werkNodig ? "Waar werk je aan?" : "Tot hoe laat blijf je?";

  werkInvoer.value = "";
  tijdKeuze.innerHTML = "";
  tijdKeuze.add(new Option("Kies een tijd", ""));
  const tijden = tijdenVanafNu();
  if (voorstelTijd && voorstelTijd > tijdVanNuHHMM() && !tijden.includes(voorstelTijd)) {
    tijden.push(voorstelTijd);
    tijden.sort();
  }
  tijden.forEach(function (t) {
    tijdKeuze.add(new Option(t, t));
  });
  if (voorstelTijd && tijden.includes(voorstelTijd)) {
    tijdKeuze.value = voorstelTijd;
  }

  werkVenster.showModal();
  if (werkNodig) {
    werkInvoer.focus();
  } else {
    tijdKeuze.focus();
  }
}

function toonWerkFout(tekst, veld) {
  werkFout.textContent = tekst;
  werkFout.hidden = false;
  veld.focus();
}

werkForm.addEventListener("submit", function (event) {
  event.preventDefault();
  const werk = werkInvoer.value.trim();
  const tijd = tijdKeuze.value;

  if (werkNodig && !werk) {
    toonWerkFout("Vul in waar je aan werkt.", werkInvoer);
    return;
  }
  if (tijdNodig && !tijd) {
    toonWerkFout(tijdKeuze.options.length > 1 ? "Kies tot hoe laat je blijft." : "Er zijn vandaag geen tijden meer om te kiezen.", tijdKeuze);
    return;
  }

  if (werkNodig) {
    workInput.value = werk;
  }
  if (tijdNodig) {
    if (!Array.from(timeSelect.options).some(function (o) { return o.value === tijd; })) {
      const optie = new Option(tijd, tijd);
      optie.dataset.tijdelijk = "true";
      timeSelect.add(optie);
    }
    timeSelect.value = tijd;
  }

  const doorgaan = naWerk;
  naWerk = null;
  werkVenster.close();
  if (doorgaan) doorgaan(timeSelect.value);
});

werkVenster.querySelector(".werk-annuleer").addEventListener("click", function () {
  naWerk = null;
  werkVenster.close();
});

werkVenster.addEventListener("close", function () {
  naWerk = null;
});

shareButton.addEventListener("click", function () {
  if (zitAl) {
    announcer.textContent = zitAlTekst;
    return;
  }
  if (chosenSeat === null || chosenStatus === "") {
    alert("Klik op een lege stoel en kies een status.");
    return;
  }
  const seat = chosenSeat;
  const status = chosenStatus;
  vraagGegevens("Deel mijn status", null, function (time) {
    sendStatus(seat, status, time);
  });
});

function findFreeSeat(seats, seat) {
  const list = Array.from(seats);
  const index = list.indexOf(seat);
  let best = null;
  let bestDistance = 0;

  for (let i = 0; i < list.length; i++) {
    if (list[i].dataset.name) continue;

    const distance = Math.abs(i - index);
    if (best === null || distance < bestDistance) {
      best = list[i];
      bestDistance = distance;
    }
  }
  return best;
}

joinButton.addEventListener("click", function () {
  if (zitAl) {
    announcer.textContent = zitAlTekst;
    return;
  }
  card.hidePopover();

  const freeSeat = findFreeSeat(tableSeats(cardSeat), cardSeat);
  if (freeSeat === null) {
    announcer.textContent = "De tafel van " + cardSeat.dataset.name + " is vol.";
    alert("De tafel van " + cardSeat.dataset.name + " is vol. Je kunt hier niet aanschuiven.");
    return;
  }

  vraagGegevens("Aanschuiven", cardSeat.dataset.until, function (time) {
    sendStatus(freeSeat, "green", time);
  });
});

leaveButton.addEventListener("click", function () {
  fetch("/api/statussen", { method: "DELETE" }).then(function () {
    loadStatuses();
    loadOnline();
  });
});

setInterval(function () {
  if (chosenSeat === null) {
    loadStatuses();
    loadOnline();
  }
}, 60000);
