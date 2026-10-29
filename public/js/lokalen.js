const verdiepingen = [
  {
    nummer: 0,
    naam: "Begane grond",
    plaatje: "hl15-0.svg",
    lokalen: [
      {
        naam: "Studieplek 0.A", x: 26.3, y: 68.1, soort: "project",
        foto: { bestand: "hl15-0.jpg", x: 338, y: 494, breedte: 214, hoogte: 138 },
        stoelen: [[360, 527, 1], [382, 527, 1], [360, 543, 1], [382, 543, 1], [408, 527, 2], [430, 527, 2], [408, 543, 2], [430, 543, 2], [456, 527, 3], [478, 527, 3], [456, 543, 3], [478, 543, 3], [504, 527, 4], [526, 527, 4], [504, 543, 4], [526, 543, 4], [360, 582, 5], [382, 582, 5], [360, 598, 5], [382, 598, 5], [408, 582, 6], [430, 582, 6], [408, 598, 6], [430, 598, 6], [456, 582, 7], [478, 582, 7], [456, 598, 7], [478, 598, 7], [504, 582, 8], [526, 582, 8], [504, 598, 8], [526, 598, 8]],
      },
      {
        naam: "Studieplek 0.B", x: 45.9, y: 68.4, soort: "project",
        foto: { bestand: "hl15-0.jpg", x: 676, y: 494, breedte: 148, hoogte: 140 },
        stoelen: [[705, 520, 1], [736, 520, 1], [723, 549, 1], [751, 554, 2], [777, 571, 2], [753, 588, 2], [722, 583, 3], [710, 611, 3], [740, 615, 3], [799, 533, 4], [790, 524, 4], [790, 542, 4], [801, 573, 5], [792, 564, 5], [792, 582, 5], [801, 610, 6], [792, 601, 6], [792, 619, 6]],
      },
      {
        naam: "Studieplek 0.C", x: 58.6, y: 68.4, soort: "project",
        foto: { bestand: "hl15-0.jpg", x: 820, y: 494, breedte: 260, hoogte: 140 },
        stoelen: [[975, 520, 1], [1008, 521, 1], [995, 549, 1], [1023, 554, 2], [1050, 570, 2], [1024, 587, 2], [993, 584, 3], [980, 611, 3], [1012, 612, 3], [866, 531, 4], [884, 531, 4], [875, 522, 4], [875, 540, 4], [923, 531, 5], [941, 531, 5], [932, 522, 5], [932, 540, 5], [841, 570, 6], [859, 570, 6], [850, 561, 6], [850, 579, 6], [889, 570, 7], [907, 570, 7], [898, 561, 7], [898, 579, 7], [939, 570, 8], [957, 570, 8], [948, 561, 8], [948, 579, 8], [871, 602, 9], [889, 602, 9], [880, 593, 9], [880, 611, 9], [923, 602, 10], [941, 602, 10], [932, 593, 10], [932, 611, 10]],
      },
      {
        naam: "Kantine", x: 92.6, y: 23.2, soort: "project",
        foto: { bestand: "hl15-0.jpg", x: 1362, y: 162, breedte: 228, hoogte: 308 },
        stoelen: [[1383, 200, 1], [1397, 200, 1], [1383, 260, 2], [1397, 260, 2], [1383, 320, 3], [1397, 320, 3], [1383, 380, 4], [1397, 380, 4], [1383, 440, 5], [1397, 440, 5], [1553, 200, 6], [1567, 200, 6], [1553, 260, 7], [1567, 260, 7], [1553, 330, 8], [1567, 330, 8], [1553, 400, 9], [1567, 400, 9], [1553, 445, 10], [1567, 445, 10], [1438, 200, 11], [1452, 200, 11], [1493, 200, 12], [1507, 200, 12], [1443, 448, 13], [1457, 448, 13], [1498, 448, 14], [1512, 448, 14]],
      },
      { naam: "Gang 0 west", x: 9.4, y: 64.8, soort: "gang" },
      { naam: "Gang 0 oost", x: 78, y: 71.8, soort: "gang" },
    ],
  },
  {
    nummer: 1,
    naam: "Verdieping 1",
    plaatje: "hl15-1.svg",
    lokalen: [
      { naam: "Atrium 1 ZW", x: 44, y: 74.5, soort: "project" },
      { naam: "Atrium 1 ZO", x: 62, y: 74.5, soort: "project" },
      { naam: "Gang 1 west", x: 11.8, y: 62, soort: "gang" },
      { naam: "Gang 1 oost", x: 88, y: 62, soort: "gang" },
      { naam: "Gang 1 noord", x: 20, y: 46, soort: "gang" },
      { naam: "Gang 1 zuid", x: 30, y: 79.5, soort: "gang" },
    ],
  },
  {
    nummer: 2,
    naam: "Verdieping 2",
    plaatje: "hl15-2.svg",
    lokalen: [
      { naam: "Atrium 2 NW", x: 33, y: 48.5, soort: "project" },
      { naam: "Atrium 2 NO", x: 63, y: 48.5, soort: "project" },
      { naam: "Atrium 2 ZW", x: 31, y: 75, soort: "project" },
      { naam: "Atrium 2 ZO", x: 66, y: 75, soort: "project" },
      { naam: "Gang 2 west", x: 12, y: 62, soort: "gang" },
      { naam: "Gang 2 oost", x: 88, y: 62, soort: "gang" },
    ],
  },
  {
    nummer: 3,
    naam: "Verdieping 3",
    plaatje: "hl15-3.svg",
    lokalen: [
      { naam: "Atrium 3 NW", x: 33, y: 48.5, soort: "project" },
      { naam: "Atrium 3 NO", x: 63, y: 48.5, soort: "project" },
      { naam: "Atrium 3 ZW", x: 31, y: 75, soort: "project" },
      { naam: "Atrium 3 ZO", x: 66, y: 75, soort: "project" },
      { naam: "Gang 3 west", x: 12, y: 62, soort: "gang" },
      { naam: "Gang 3 oost", x: 88, y: 62, soort: "gang" },
    ],
  },
  {
    nummer: 4,
    naam: "Verdieping 4",
    plaatje: "hl15-4.svg",
    lokalen: [
      { naam: "Atrium 4 NW", x: 33, y: 33, soort: "project" },
      { naam: "Atrium 4 NO", x: 62, y: 33, soort: "project" },
      { naam: "Atrium 4 ZW", x: 38, y: 67, soort: "project" },
      { naam: "Atrium 4 ZO", x: 68, y: 67, soort: "project" },
      { naam: "Gang 4 west", x: 12, y: 50, soort: "gang" },
      { naam: "Gang 4 oost", x: 88, y: 50, soort: "gang" },
    ],
  },
  {
    nummer: 5,
    naam: "Verdieping 5",
    plaatje: "hl15-5.svg",
    lokalen: [
      { naam: "Atrium 5 NW", x: 36, y: 33, soort: "project" },
      { naam: "Atrium 5 NO", x: 52, y: 33, soort: "project" },
      { naam: "Atrium 5 ZW", x: 36, y: 67, soort: "project" },
      { naam: "Atrium 5 ZO", x: 64, y: 67, soort: "project" },
      { naam: "Gang 5 west", x: 12.5, y: 50, soort: "gang" },
      { naam: "Gang 5 oost", x: 75.8, y: 50, soort: "gang" },
    ],
  },
  {
    nummer: 6,
    naam: "Verdieping 6",
    plaatje: "hl15-6.svg",
    lokalen: [
      { naam: "Atrium 6 west", x: 37, y: 67, soort: "project" },
      { naam: "Atrium 6 oost", x: 66, y: 67, soort: "project" },
      { naam: "Gang 6 west", x: 24, y: 50, soort: "gang" },
      { naam: "Gang 6 midden", x: 48.5, y: 50, soort: "gang" },
      { naam: "Gang 6 zuidwest", x: 15, y: 73, soort: "gang" },
      { naam: "Gang 6 zuidoost", x: 80, y: 73, soort: "gang" },
    ],
  },
  {
    nummer: 7,
    naam: "Verdieping 7",
    plaatje: "hl15-7.svg",
    lokalen: [
      { naam: "Atrium 7 ZW", x: 40, y: 51, soort: "project" },
      { naam: "Atrium 7 ZO", x: 66, y: 51, soort: "project" },
      { naam: "Gang 7 west", x: 24, y: 30, soort: "gang" },
      { naam: "Gang 7 oost", x: 75, y: 30, soort: "gang" },
      { naam: "Gang 7 zuidwest", x: 15, y: 60, soort: "gang" },
      { naam: "Gang 7 zuidoost", x: 55, y: 60, soort: "gang" },
    ],
  },
];

const fotoBreedte = 1600;
const fotoHoogte = 824;

if (typeof module !== "undefined") {
  module.exports = verdiepingen;
}
