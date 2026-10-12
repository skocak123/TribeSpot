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
