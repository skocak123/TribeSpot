const verdiepingen = [
  {
    nummer: 0,
    naam: "Begane grond",
    plaatje: "hl15-0.svg",
    lokalen: [
      {
        naam: "Werkplek 0.A", x: 26.3, y: 68.1, soort: "werkplek",
        foto: { bestand: "hl15-0.jpg", x: 338, y: 494, breedte: 214, hoogte: 138 },
        stoelen: [[360, 527, 1], [382, 527, 1], [360, 543, 1], [382, 543, 1], [408, 527, 2], [430, 527, 2], [408, 543, 2], [430, 543, 2], [456, 527, 3], [478, 527, 3], [456, 543, 3], [478, 543, 3], [504, 527, 4], [526, 527, 4], [504, 543, 4], [526, 543, 4], [360, 582, 5], [382, 582, 5], [360, 598, 5], [382, 598, 5], [408, 582, 6], [430, 582, 6], [408, 598, 6], [430, 598, 6], [456, 582, 7], [478, 582, 7], [456, 598, 7], [478, 598, 7], [504, 582, 8], [526, 582, 8], [504, 598, 8], [526, 598, 8]],
      },
      {
        naam: "Werkplek 0.B", x: 45.9, y: 68.3, soort: "werkplek",
        foto: { bestand: "hl15-0.jpg", x: 676, y: 494, breedte: 148, hoogte: 140 },
        stoelen: [[705, 520, 1], [736, 520, 1], [723, 549, 1], [751, 554, 2], [777, 571, 2], [753, 588, 2], [722, 583, 3], [710, 611, 3], [740, 615, 3], [799, 533, 4], [790, 524, 4], [790, 542, 4], [801, 573, 5], [792, 564, 5], [792, 582, 5], [801, 610, 6], [792, 601, 6], [792, 619, 6]],
      },
      {
        naam: "Werkplek 0.C", x: 58.6, y: 68.3, soort: "werkplek",
        foto: { bestand: "hl15-0.jpg", x: 820, y: 494, breedte: 260, hoogte: 140 },
        stoelen: [[975, 520, 1], [1008, 521, 1], [995, 549, 1], [1023, 554, 2], [1050, 570, 2], [1024, 587, 2], [993, 584, 3], [980, 611, 3], [1012, 612, 3], [866, 531, 4], [884, 531, 4], [875, 522, 4], [875, 540, 4], [923, 531, 5], [941, 531, 5], [932, 522, 5], [932, 540, 5], [841, 570, 6], [859, 570, 6], [850, 561, 6], [850, 579, 6], [889, 570, 7], [907, 570, 7], [898, 561, 7], [898, 579, 7], [939, 570, 8], [957, 570, 8], [948, 561, 8], [948, 579, 8], [871, 602, 9], [889, 602, 9], [880, 593, 9], [880, 611, 9], [923, 602, 10], [941, 602, 10], [932, 593, 10], [932, 611, 10]],
      },
      {
        naam: "Science café", x: 92.6, y: 23.2, soort: "werkplek",
        foto: { bestand: "hl15-0.jpg", x: 1362, y: 162, breedte: 228, hoogte: 308 },
        stoelen: [[1383, 200, 1], [1397, 200, 1], [1383, 260, 2], [1397, 260, 2], [1383, 320, 3], [1397, 320, 3], [1383, 380, 4], [1397, 380, 4], [1383, 440, 5], [1397, 440, 5], [1553, 200, 6], [1567, 200, 6], [1553, 260, 7], [1567, 260, 7], [1553, 330, 8], [1567, 330, 8], [1553, 400, 9], [1567, 400, 9], [1553, 445, 10], [1567, 445, 10], [1438, 200, 11], [1452, 200, 11], [1493, 200, 12], [1507, 200, 12], [1443, 448, 13], [1457, 448, 13], [1498, 448, 14], [1512, 448, 14]],
      },
      { naam: "Werkplek 0.D", x: 18.9, y: 56.4, soort: "werkplek" },
      { naam: "Werkplek 0.E", x: 74.2, y: 58.3, soort: "werkplek" },
      { naam: "Werkplek 0.F", x: 3.0, y: 84.4, soort: "werkplek" },
      { naam: "Werkplek 0.G", x: 84.0, y: 88.1, soort: "werkplek" },
      { naam: "Food court", x: 55.5, y: 89.0, soort: "werkplek" },
    ],
  },
  {
    nummer: 1,
    naam: "Verdieping 1",
    plaatje: "hl15-1.svg",
    lokalen: [
      { naam: "Werkplek 1.A", x: 4.2, y: 45.5, soort: "werkplek" },
      { naam: "Werkplek 1.B", x: 18.8, y: 47.6, soort: "werkplek" },
      { naam: "Werkplek 1.C", x: 35.4, y: 72.7, soort: "werkplek" },
      { naam: "HL15-1.059", x: 44.6, y: 72.9, soort: "stilte" },
      { naam: "Werkplek 1.D", x: 54.3, y: 73.1, soort: "werkplek" },
      { naam: "HL15-1.053", x: 62.8, y: 72.9, soort: "stilte" },
      { naam: "Werkplek 1.E", x: 73.0, y: 47.3, soort: "werkplek" },
      { naam: "Werkplek 1.F", x: 83.3, y: 46.5, soort: "werkplek" },
    ],
  },
  {
    nummer: 2,
    naam: "Verdieping 2",
    plaatje: "hl15-2.svg",
    lokalen: [
      { naam: "Werkplek 2.A", x: 34.5, y: 48.0, soort: "werkplek" },
      { naam: "Werkplek 2.B", x: 32.7, y: 73.3, soort: "werkplek" },
      { naam: "Werkplek 2.C", x: 59.7, y: 48.0, soort: "werkplek" },
      { naam: "HL15-2.127", x: 68.0, y: 47.8, soort: "stilte" },
      { naam: "HL15-2.045", x: 64.4, y: 73.2, soort: "stilte" },
      { naam: "Werkplek 2.D", x: 71.3, y: 69.8, soort: "werkplek" },
      { naam: "HL15-2.140", x: 84.9, y: 36.1, soort: "stilte" },
    ],
  },
  {
    nummer: 3,
    naam: "Verdieping 3",
    plaatje: "hl15-3.svg",
    lokalen: [
      { naam: "Werkplek 3.A", x: 17.4, y: 26.9, soort: "werkplek" },
      { naam: "HL15-3.047", x: 34.9, y: 73.7, soort: "stilte" },
      { naam: "Werkplek 3.B", x: 39.0, y: 47.7, soort: "werkplek" },
      { naam: "HL15-3.091", x: 48.2, y: 47.7, soort: "stilte" },
      { naam: "HL15-3.097", x: 55.4, y: 48.3, soort: "stilte" },
      { naam: "Werkplek 3.C", x: 65.8, y: 47.9, soort: "werkplek" },
      { naam: "Werkplek 3.D", x: 67.2, y: 73.2, soort: "werkplek" },
    ],
  },
  {
    nummer: 4,
    naam: "Verdieping 4",
    plaatje: "hl15-4.svg",
    lokalen: [
      { naam: "Werkplek 4.A", x: 11.1, y: 62.1, soort: "werkplek" },
      { naam: "HL15-4.090", x: 28.2, y: 11.0, soort: "stilte" },
      { naam: "HL15-4.091", x: 32.7, y: 34.3, soort: "stilte" },
      { naam: "Werkplek 4.B", x: 41.6, y: 34.3, soort: "werkplek" },
      { naam: "Werkplek 4.C", x: 37.5, y: 70.5, soort: "werkplek" },
      { naam: "Werkplek 4.D", x: 51.4, y: 70.3, soort: "werkplek" },
      { naam: "Werkplek 4.E", x: 54.7, y: 31.4, soort: "werkplek" },
      { naam: "HL15-4.101", x: 61.7, y: 31.4, soort: "stilte" },
      { naam: "HL15-4.037", x: 64.0, y: 68.4, soort: "stilte" },
    ],
  },
  {
    nummer: 5,
    naam: "Verdieping 5",
    plaatje: "hl15-5.svg",
    lokalen: [
      { naam: "Werkplek 5.A", x: 6.0, y: 30.0, soort: "werkplek" },
      { naam: "Werkplek 5.B", x: 34.5, y: 33.0, soort: "werkplek" },
      { naam: "Werkplek 5.C", x: 46.0, y: 33.8, soort: "werkplek" },
      { naam: "HL15-5.087", x: 51.2, y: 33.2, soort: "stilte" },
      { naam: "Werkplek 5.D", x: 65.5, y: 31.3, soort: "werkplek" },
      { naam: "Werkplek 5.E", x: 39.4, y: 68.0, soort: "werkplek" },
      { naam: "HL15-5.033", x: 54.2, y: 67.2, soort: "stilte" },
      { naam: "Werkplek 5.F", x: 63.0, y: 67.2, soort: "werkplek" },
    ],
  },
  {
    nummer: 6,
    naam: "Verdieping 6",
    plaatje: "hl15-6.svg",
    lokalen: [
      { naam: "Werkplek 6.A", x: 10.3, y: 65.6, soort: "werkplek" },
      { naam: "Werkplek 6.B", x: 39.5, y: 31.0, soort: "werkplek" },
      { naam: "HL15-6.035", x: 38.8, y: 65.3, soort: "stilte" },
      { naam: "HL15-6.031", x: 46.5, y: 65.3, soort: "stilte" },
      { naam: "HL15-6.032", kort: "D", x: 50.4, y: 80.7, soort: "werkplek" },
      { naam: "HL15-6.025", x: 62.2, y: 64.8, soort: "stilte" },
      { naam: "Werkplek 6.C", x: 70.5, y: 63.9, soort: "werkplek" },
    ],
  },
  {
    nummer: 7,
    naam: "Verdieping 7",
    plaatje: "hl15-7.svg",
    lokalen: [
      { naam: "HL15-7.047", kort: "C", x: 12.4, y: 45.5, soort: "werkplek" },
      { naam: "HL15-7.035", x: 35.0, y: 51.2, soort: "stilte" },
      { naam: "Werkplek 7.A", x: 42.0, y: 52.6, soort: "werkplek" },
      { naam: "HL15-7.027", x: 48.5, y: 51.2, soort: "stilte" },
      { naam: "Werkplek 7.B", x: 60.2, y: 51.2, soort: "werkplek" },
      { naam: "HL15-7.019", x: 67.3, y: 51.2, soort: "stilte" },
    ],
  },
];

const fotoBreedte = 1600;
const fotoHoogte = 824;

if (typeof module !== "undefined") {
  module.exports = verdiepingen;
}
