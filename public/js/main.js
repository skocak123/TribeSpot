const floorMenu = document.querySelector(".floor-select");

const roomTitles = document.querySelectorAll(".map .room h2");

const groundFloorNames = [
  "Kantine",
  "Vergaderruimte",
  "Lokaal 0.03",
  "Lokaal 0.04",
  "Lokaal 0.05",
  "Lokaal 0.06",
];
function showFloor(floor) {
  for (let i = 0; i < roomTitles.length; i++) {
    if (floor === 0) {
      roomTitles[i].textContent = groundFloorNames[i];
    } else {
      roomTitles[i].textContent = "Lokaal " + floor + ".0" + (i + 1);
    }
  }
}
floorMenu.addEventListener("change", function () {
  showFloor(Number(floorMenu.value));
  loadStatuses();
});
showFloor(Number(floorMenu.value));

const statusNames = { green: "Aanschuiven", yellow: "Vragen", red: "Focus" };
const statusWords = { green: "aanschuiven", yellow: "vragen", red: "focus" };
const statusColors = { aanschuiven: "green", vragen: "yellow", focus: "red" };

const card = document.querySelector("#student-card");
const joinButton = document.querySelector(".join-button");
const rooms = document.querySelectorAll(".map .room");
const allSeats = document.querySelectorAll(".seat");
const onlineCount = document.querySelector(".online-count");

const roomInput = document.querySelector(".my-room");
const workInput = document.querySelector(".my-work");
const timeSelect = document.querySelector(".my-time");
const statusButtons = document.querySelectorAll(".status-button");
const statusBox = document.querySelector(".status-buttons");
const roomBox = roomInput.closest(".field-box");
const workBox = workInput.closest(".field-box");
const timeBox = timeSelect.closest(".field-box");
const shareButton = document.querySelector(".share-button");
const leaveButton = document.querySelector(".leave-button");

const myName = "selim";

let chosenStatus = "";
let chosenSeat = null;
let cardSeat = null;

function clearChosenSeat() {
  if (chosenSeat !== null) {
    chosenSeat.classList.remove("chosen-seat");
  }
  chosenSeat = null;
  roomInput.value = "";
  lockStatus(false);
}

function tableHasJoiner(seat) {
  const tableSeats = seat.closest(".desk-row, .group, .pc-row").querySelectorAll(".seat");
  for (let i = 0; i < tableSeats.length; i++) {
    if (tableSeats[i].classList.contains("green") && tableSeats[i].dataset.name !== myName) {
      return true;
    }
  }
  return false;
}

function lockStatus(locked) {
  for (let i = 0; i < statusButtons.length; i++) {
    const isGreen = statusButtons[i].dataset.status === "green";
    statusButtons[i].disabled = locked && !isGreen;

    if (locked) {
      statusButtons[i].classList.toggle("chosen", isGreen);
    }
  }
  if (locked) {
    chosenStatus = "green";
    clearError(statusBox);
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

for (let i = 0; i < allSeats.length; i++) {
  allSeats[i].addEventListener("click", function () {
    const seat = allSeats[i];

    if (seat.dataset.name) {
      showCard(seat);
      return;
    }

    clearChosenSeat();
    seat.classList.add("chosen-seat");
    chosenSeat = seat;
    roomInput.value = seat.closest(".room").querySelector("h2").textContent;
    clearError(roomBox);
    lockStatus(tableHasJoiner(seat));
  });
}

function emptyAllSeats() {
  for (let i = 0; i < allSeats.length; i++) {
    allSeats[i].className = "seat";
    delete allSeats[i].dataset.name;
    delete allSeats[i].dataset.work;
    delete allSeats[i].dataset.until;
  }
}

function loadStatuses() {
  fetch("/api/statussen")
    .then(function (response) {
      return response.json();
    })
    .then(function (statuses) {
      clearChosenSeat();
      emptyAllSeats();

      for (let i = 0; i < statuses.length; i++) {
        const status = statuses[i];
        if (status.verdieping !== Number(floorMenu.value)) continue;

        for (let j = 0; j < rooms.length; j++) {
          if (rooms[j].querySelector("h2").textContent !== status.lokaal) continue;

          const seat = rooms[j].querySelectorAll(".seat")[status.plek - 1];
          if (!seat) continue;

          seat.className = "seat " + statusColors[status.beschikbaarheid];
          seat.dataset.name = status.naam;
          seat.dataset.work = status.werkt_aan;
          seat.dataset.until = status.tot;
        }
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

loadStatuses();
loadOnline();

for (let i = 0; i < statusButtons.length; i++) {
  statusButtons[i].addEventListener("click", function () {
    for (let j = 0; j < statusButtons.length; j++) {
      statusButtons[j].classList.remove("chosen");
    }
    statusButtons[i].classList.add("chosen");
    chosenStatus = statusButtons[i].dataset.status;
    clearError(statusBox);
  });
}

function sendStatus(seat, status, time) {
  const room = seat.closest(".room");
  const roomSeats = Array.from(room.querySelectorAll(".seat"));

  fetch("/api/statussen", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      lokaal: room.querySelector("h2").textContent,
      plek: roomSeats.indexOf(seat) + 1,
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
      }
      loadStatuses();
      loadOnline();
    });
}

function checkSeat() {
  if (chosenSeat === null) {
    showError(roomBox, "Klik eerst op een lege stoel.");
    return false;
  }
  clearError(roomBox);
  return true;
}

function checkWork() {
  if (workInput.value.trim() === "") {
    showError(workBox, "Vul in waar je aan werkt.");
    return false;
  }
  return checkLength(workInput, workBox, "omschrijving", 2, 100);
}

function checkStatus() {
  if (chosenStatus === "") {
    showError(statusBox, "Kies een status.");
    return false;
  }
  clearError(statusBox);
  return true;
}

function checkTime() {
  if (timeSelect.selectedIndex === 0) {
    showError(timeBox, "Kies een tijd.");
    return false;
  }

  const parts = timeSelect.value.split(":");
  const until = new Date();
  until.setHours(Number(parts[0]), Number(parts[1]), 0, 0);
  if (until <= new Date()) {
    showError(timeBox, "Deze tijd is al voorbij.");
    return false;
  }
  clearError(timeBox);
  return true;
}

watchField(workInput, workBox, checkWork);
timeSelect.addEventListener("change", checkTime);

shareButton.addEventListener("click", function () {
  const seatOk = checkSeat();
  const workOk = checkWork();
  const statusOk = checkStatus();
  const timeOk = checkTime();

  if (seatOk && workOk && statusOk && timeOk) {
    sendStatus(chosenSeat, chosenStatus, timeSelect.value);
  }
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

  const table = cardSeat.closest(".desk-row, .group, .pc-row");
  let freeSeat = findFreeSeat(table.querySelectorAll(".seat"), cardSeat);
  if (freeSeat === null) {
    freeSeat = findFreeSeat(cardSeat.closest(".room").querySelectorAll(".seat"), cardSeat);
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
