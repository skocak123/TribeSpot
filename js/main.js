const floorMenu = document.querySelector(".floor-select");

const rooms = document.querySelectorAll(".map .room");

const groundFloorNames = [
  "Kantine",
  "Vergaderruimte",
  "Lokaal 0.03",
  "Lokaal 0.04",
  "Lokaal 0.05",
  "Lokaal 0.06",
];

// per verdieping: welk soort lokaal op welke plek staat
const floorLayouts = [
  ["project", "project", "klas", "computer", "klas", "computer"],
  ["klas", "klas", "computer", "project", "project", "computer"],
  ["klas", "project", "computer", "project", "klas", "computer"],
  ["computer", "computer", "klas", "project", "computer", "klas"],
  ["project", "klas", "project", "computer", "klas", "project"],
];

// een stoel: meestal leeg, soms een student met een status
function seat() {
  const kans = Math.random();
  if (kans < 0.1) return '<span class="seat green" title="Aanschuiven"></span>';
  if (kans < 0.2) return '<span class="seat yellow" title="Vragen"></span>';
  if (kans < 0.3) return '<span class="seat red" title="Focus"></span>';
  return '<span class="seat"></span>';
}

function seats(amount) {
  let html = "";
  for (let i = 0; i < amount; i++) {
    html += seat();
  }
  return html;
}

function pcs(amount) {
  let html = "";
  for (let i = 0; i < amount; i++) {
    html += '<span class="pc">' + seat() + "</span>";
  }
  return html;
}

// brede lokalen (5 en 6) krijgen meer stoelen per rij
function roomLayout(type, wide) {
  const perRow = wide ? 6 : 3;

  if (type === "klas") {
    return '<div class="board"></div>' +
      '<div class="desk-row">' + seats(perRow) + "</div>" +
      '<div class="desk-row">' + seats(perRow) + "</div>";
  }

  if (type === "project") {
    let html = "";
    const groups = wide ? 3 : 2;
    for (let i = 0; i < groups; i++) {
      html += '<div class="group">' + seats(4) + "</div>";
    }
    return html;
  }

  return '<div class="pc-row">' + pcs(perRow) + "</div>" +
    '<div class="pc-row">' + pcs(perRow) + "</div>";
}

function showFloor(floor) {
  for (let i = 0; i < rooms.length; i++) {
    let title = "Lokaal " + floor + ".0" + (i + 1);
    if (floor === 0) {
      title = groundFloorNames[i];
    }

    const type = floorLayouts[floor][i];
    const wide = i >= 4;

    rooms[i].classList.toggle("project", type === "project");
    rooms[i].innerHTML = "<h2>" + title + "</h2>" + roomLayout(type, wide);
  }
}

floorMenu.addEventListener("change", function () {
  showFloor(Number(floorMenu.value));
});
showFloor(Number(floorMenu.value));
