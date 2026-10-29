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

function buildPhotoSeats(lokaal) {
  const foto = lokaal.foto;
  const photo = document.createElement("div");
  photo.className = "room-photo";
  photo.style.aspectRatio = foto.breedte + " / " + foto.hoogte;

  const image = document.createElement("img");
  image.src = "assets/images/plattegrond/" + foto.bestand;
  image.alt = "";
  image.style.width = (fotoBreedte / foto.breedte) * 100 + "%";
  image.style.left = (-foto.x / foto.breedte) * 100 + "%";
  image.style.top = (-foto.y / foto.hoogte) * 100 + "%";
  photo.appendChild(image);

  for (let i = 0; i < lokaal.stoelen.length; i++) {
    const stoel = lokaal.stoelen[i];
    const seat = makeSeat(stoel[2], i + 1);
    seat.style.left = ((stoel[0] - foto.x) / foto.breedte) * 100 + "%";
    seat.style.top = ((stoel[1] - foto.y) / foto.hoogte) * 100 + "%";
    photo.appendChild(seat);
  }
  seatsBox.appendChild(photo);

  const free = roomPanel.clientHeight - roomPanel.querySelector(".room-header").offsetHeight - 72;
  photo.style.maxWidth = Math.max(240, free * (foto.breedte / foto.hoogte)) + "px";
}

function openRoomPanel(lokaal, from) {
  openRoom = lokaal;
  openedFrom = from;
  roomPanel.parentElement.scrollLeft = 0;
  roomTitle.textContent = lokaal.naam;

  seatsBox.innerHTML = "";
  seatsBox.className = "room-seats " + (lokaal.foto ? "photo" : lokaal.soort);
  roomPanel.hidden = false;

  if (lokaal.foto) {
    buildPhotoSeats(lokaal);
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

let myName = "";

fetch("/api/ik")
  .then(function (response) {
    if (!response.ok) {
      window.location.href = "inloggen.html";
    }
    return response.json();
  })
  .then(function (me) {
    myName = me.naam;
  });

let chosenStatus = "";
let chosenSeat = null;
let cardSeat = null;

function clearChosenSeat() {
  if (chosenSeat !== null) {
    chosenSeat.classList.remove("chosen-seat");
    chosenSeat.removeAttribute("aria-pressed");
  }
  chosenSeat = null;
  roomInput.value = "";
  lockStatus(null);
}

function tableSeats(seat) {
  return seatsBox.querySelectorAll('.seat[data-table="' + seat.dataset.table + '"]');
}

function tableHasJoiner(seat) {
  const seats = tableSeats(seat);
  for (let i = 0; i < seats.length; i++) {
    if (seats[i].classList.contains("green") && seats[i].dataset.name !== myName) {
      return true;
    }
  }
  return false;
}

function lockStatus(forced) {
  for (let i = 0; i < statusButtons.length; i++) {
    const isForced = statusButtons[i].dataset.status === forced;
    statusButtons[i].disabled = forced !== null && !isForced;

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
  joinButton.hidden = color !== "green" || seat.dataset.name === myName;
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
  }

  roomInfo.textContent = statuses.length + " van " + seats.length + " plekken bezet · kies een lege stoel";
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
    })
    .catch(function () {
      alert("Kan de statussen niet ophalen. Draait de server?");
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

shareButton.addEventListener("click", function () {
  if (chosenSeat === null || chosenStatus === "" || timeSelect.selectedIndex === 0) {
    alert("Klik op een lege stoel, kies een status en een tijd.");
    return;
  }
  sendStatus(chosenSeat, chosenStatus, timeSelect.value);
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
  card.hidePopover();

  let freeSeat = findFreeSeat(tableSeats(cardSeat), cardSeat);
  if (freeSeat === null) {
    freeSeat = findFreeSeat(seatsBox.querySelectorAll(".seat"), cardSeat);
  }
  if (freeSeat === null) {
    alert("Er is geen plek meer vrij bij " + cardSeat.dataset.name + ".");
    return;
  }

  let time = timeSelect.value;
  if (timeSelect.selectedIndex === 0) {
    time = cardSeat.dataset.until;
  }

  sendStatus(freeSeat, "green", time);
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
