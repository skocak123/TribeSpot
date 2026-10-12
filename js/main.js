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
});
showFloor(Number(floorMenu.value));

const statusNames = { green: "Aanschuiven", yellow: "Vragen", red: "Focus" };

const card = document.querySelector("#student-card");
const allSeats = document.querySelectorAll(".seat");

for (let i = 0; i < allSeats.length; i++) {
  allSeats[i].addEventListener("click", function () {
    const seat = allSeats[i];
    if (!seat.dataset.name) return; // lege stoel

    const color = seat.classList[1];

    card.querySelector(".card-name").textContent = seat.dataset.name;
    card.querySelector(".card-dot").className = "status-dot card-dot " + color;
    card.querySelector(".card-status").textContent = statusNames[color];
    card.querySelector(".card-work").textContent = seat.dataset.work;
    card.querySelector(".card-until").textContent = seat.dataset.until;

    const seatBox = seat.getBoundingClientRect();
    card.style.left = seatBox.left + seatBox.width / 2 + "px";
    card.style.top = seatBox.top + "px";

    card.showPopover();
  });
}

const roomInput = document.querySelector(".my-room");
const workInput = document.querySelector(".my-work");
const timeSelect = document.querySelector(".my-time");
const statusButtons = document.querySelectorAll(".status-button");
const shareButton = document.querySelector(".share-button");

let chosenStatus = "";
let mySeat = null;

for (let i = 0; i < statusButtons.length; i++) {
  statusButtons[i].addEventListener("click", function () {
    for (let j = 0; j < statusButtons.length; j++) {
      statusButtons[j].classList.remove("chosen");
    }
    statusButtons[i].classList.add("chosen");
    chosenStatus = statusButtons[i].dataset.status;
  });
}

shareButton.addEventListener("click", function () {
  if (roomInput.value === "" || chosenStatus === "" || timeSelect.selectedIndex === 0) {
    alert("Vul je lokaal in, kies een status en een tijd.");
    return;
  }

  const rooms = document.querySelectorAll(".map .room");
  let room = null;
  for (let i = 0; i < rooms.length; i++) {
    const name = rooms[i].querySelector("h2").textContent.toLowerCase();
    if (name.includes(roomInput.value.toLowerCase())) {
      room = rooms[i];
    }
  }

  if (room === null) {
    alert("Dat lokaal staat niet op deze verdieping.");
    return;
  }

  if (mySeat !== null) {
    mySeat.className = "seat";
    delete mySeat.dataset.name;
  }

  const freeSeat = room.querySelector(".seat:not(.green):not(.yellow):not(.red)");
  if (freeSeat === null) {
    alert("Dit lokaal zit vol.");
    return;
  }

  freeSeat.className = "seat " + chosenStatus;
  freeSeat.dataset.name = "Jij";
  freeSeat.dataset.work = workInput.value;
  freeSeat.dataset.until = timeSelect.value;
  mySeat = freeSeat;
});
