const outletMap = {
  "8FA" : {id: '67ad665a9aa9ef620e693aa0', svg: '8FA.svg'},
  "ITG" : {id: '65e56bd7a24b74cef513834f', svg: 'ITG.svg'},
  "UBP" : {id: '565748274a955c790d808c77', svg: 'UBP.svg'},
  "KLG" : {id: '5dac63c998e930010a595016', svg: 'KLG.svg'},
  "TTDI" : {id: '5db8fb7e35798d0010950a77', svg: ['TTDI-Level1.svg', 'TTDI-Level3A.svg']},
  "STO" : {id: '5db8fb9798549f0010df15f3', svg: ['STO-Level11.svg', 'STO-Level12.svg', 'STO-Level14.svg']},
  "KLS" : {id: '62a9832b43c9f437e373e9dd', svg: ['KLS-L20.svg', 'KLS-ByteDance.svg', 'KLS-L21.svg', 'KLS-L28.svg']},
  "MUB" : {id: '63f5de531f29f60007ca8209', svg: ['MUB-level9.svg', 'MUB-level12.svg', 'MUB-level17.svg']},
  "SPM" : {id: '6537957cc3653d2412ab4d7e', svg: "SPM.svg"},
  "UBP3A" : {id: '66dfd21d5ec307e20a9b761c', svg: ['UBP-L13A.svg', 'UBP-L13AAIRIT.svg']},
  "SV2" : {id: '671f3dbf0951c4dfbaaadd5d', svg: "SV2.svg "},
}

let roomData = [];

// Show spinner
function showSpinner() {
  document.getElementById("loading-spinner").classList.remove("hidden");
}
// Hide spinner
function hideSpinner() {
  document.getElementById("loading-spinner").classList.add("hidden");
}

// Fetch room data
async function fetchData() {
  showSpinner();
  const res = await fetch(
    "https://script.google.com/macros/s/AKfycbxKhih7njEt3fiRMvbJnHOTYUCeHlENVMK7i5EosmE65lZE_K7esXdNJ7tAjIHRNwEg/exec"
  );
  const data = await res.json();
  roomData = data.map((item) => ({
    id: item.id,
    name: item.name,
    status: item.status.toLowerCase(),
    outlet: outletMap[item.outlet_id],
    capacity: item.capacity,
  }));
  populateFilters();
  sendFiltersToChild();
}

// Populate dropdowns
function populateFilters() {
  const outletSet = new Set(),
    statusSet = new Set(),
    paxSet = new Set(),
    suiteSet = new Set();

  roomData.forEach((r) => {
    outletSet.add(r.outlet);
    statusSet.add(r.status);
    paxSet.add(r.capacity);
    suiteSet.add(r.name);
  });

  const filterMap = {
    "filter-outlet": {
      set: outletSet,
      sortFn: (a, b) => a.localeCompare(b), // Alphabetical
    },
    "filter-status": {
      set: statusSet,
      sortFn: (a, b) => a.localeCompare(b), // Alphabetical
    },
    "filter-pax": {
      set: paxSet,
      sortFn: (a, b) => a - b, // Numeric
    },
    "filter-suite": {
      set: suiteSet,
      sortFn: (a, b) => a.localeCompare(b), // Alphabetical
    },
  };

  for (const [id, { set, sortFn }] of Object.entries(filterMap)) {
    const select = document.getElementById(id);
    select.innerHTML =
      '<option value="all">All</option>' +
      [...set]
        .sort(sortFn)
        .map((v) => `<option value="${v}">${v}</option>`)
        .join("");
    select.addEventListener("change", sendFiltersToChild);
  }
}

// Send filters to child iframe
function sendFiltersToChild() {
  showSpinner();
  const frame = document.getElementById("floor-img");
  if (!frame || !frame.contentWindow) return;

  const selectedOutlet = document.getElementById("filter-outlet").value;
  const selectedStatus = (
    document.getElementById("filter-status").value || "all"
  ).toLowerCase();
  const selectedPax = document.getElementById("filter-pax").value;
  const selectedSuite = document.getElementById("filter-suite").value;

  const filteredRooms = roomData.filter((room) => {
    return (
      (selectedOutlet === "all" || room.outlet === selectedOutlet) &&
      (selectedPax === "all" || room.capacity == selectedPax) &&
      (selectedSuite === "all" || room.name === selectedSuite)
    );
  });

  const roomIds = filteredRooms.map((r) => r.id);
  const statusMap = {};
  filteredRooms.forEach((r) => (statusMap[r.id] = r.status));

  frame.contentWindow.postMessage(
    { roomIds, statusFilter: selectedStatus, statusMap },
    "*"
  );
}

// Listen for child ready or update
window.addEventListener("message", (event) => {
  if (event.data === "ready" || event.data === "applied") {
    hideSpinner();
  }
});

fetchData();
