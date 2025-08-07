const outletMap = {
  "8FA": [
   { id: '67ad665a9aa9ef620e693aa0', 
    svg: 'SVG-file/8FA.svg' }
  ],
  "ITG": [
     { id: '65e56bd7a24b74cef513834f', 
     svg: 'SVG-file/ITG.svg' }
  ],
  "UBP": [{
    id: '565748274a955c790d808c77',
    svg: 'SVG-file/UBP.svg'
  }],
  "KLG": [{
    id: '5dac63c998e930010a595016',
    svg: 'SVG-file/KLG.svg'
  }],
  "TTDI": [{
    id: '5db8fb7e35798d0010950a77',
    svg: ['SVG-file/TTDI-Level1.svg', 'SVG-file/TTDI-Level3A.svg']
  }],
  "STO": [{
    id: '5db8fb9798549f0010df15f3',
    svg: ['SVG-file/STO-Level11.svg', 'SVG-file/STO-Level12.svg', 'SVG-file/STO-Level14.svg']
  }],
  "KLS": [{
    id: '62a9832b43c9f437e373e9dd',
    svg: ['SVG-file/KLS-L20.svg', 'SVG-file/KLS-ByteDance.svg', 'SVG-file/KLS-L21.svg', 'SVG-file/KLS-L28.svg']
  }],
  "MUB": [{
    id: '63f5de531f29f60007ca8209',
    svg: ['SVG-file/MUB-level9.svg', 'SVG-file/MUB-level12.svg', 'SVG-file/MUB-level17.svg']
  }],
  "SPM": [{
    id: '6537957cc3653d2412ab4d7e',
    svg: 'SVG-file/SPM.svg'
  }],
  "UBP3A": [{
    id: '66dfd21d5ec307e20a9b761c',
    svg: ['SVG-file/UBP-L13A.svg', 'SVG-file/UBP-L13AAIRIT.svg']
  }],
  "SV2": [{
    id: '671f3dbf0951c4dfbaaadd5d',
    svg: 'SVG-file/SV2.svg'
  }],
};

// Utility: show/hide spinner
function showSpinner() {
  const el = document.getElementById("loading-spinner");
  if (el) el.classList.remove("hidden");
}
function hideSpinner() {
  const el = document.getElementById("loading-spinner");
  if (el) el.classList.add("hidden");
}

// Group statuses
function GroupedStatus(status) {
  const available = ['available'];
  const occupied = ['available_soon', 'reserved', 'occupied', 'unavailable'];

  if (available.includes(status.toLowerCase())) return 'Available';
  if (occupied.includes(status.toLowerCase())) return 'Occupied';
  return 'Unknown';
}

// Fetch and prepare data
let roomData = [];
async function fetchData() {
  showSpinner();
  const res = await fetch(
    "https://script.google.com/macros/s/AKfycbxKhih7njEt3fiRMvbJnHOTYUCeHlENVMK7i5EosmE65lZE_K7esXdNJ7tAjIHRNwEg/exec"
  );

  const data = await res.json();
  roomData = data.map((item) => ({
    id: item.id,
    name: item.name,
    type: item.type,
    status: GroupedStatus(item.status),
    price: item.price,
    deposit: item.deposit,
    area: item.area,
    capacity: item.capacity,
    outlet: item.outlet_id,  // keep the code instead of mapped object
  }));
console.log("Fetched room data:", roomData);
  populateFilters();
  sendFiltersToChild();
  hideSpinner();
}

// Populate dropdowns dynamically
function populateFilters() {
  const outletSet = new Set(),
    statusSet = new Set(),
    paxSet = new Set(),
    suiteSet = new Set();

  roomData.forEach((r) => {
  const outletName = Object.entries(outletMap).find(
    ([key, val]) => val[0].id === r.outlet
  )?.[0];
  if (outletName) outletSet.add(outletName);
  statusSet.add(r.status);
  paxSet.add(r.capacity);
  suiteSet.add(r.name);
});

  console.log(outletSet,"outletSet")
 

  const filterMap = {
    "filter-outlet": {
      set: outletSet,
      sortFn: (a, b) => a.localeCompare(b),
    },
    "filter-status": {
      set: statusSet,
      sortFn: (a, b) => a.localeCompare(b),
    },
    "filter-pax": {
      set: paxSet,
      sortFn: (a, b) => a - b,
    }, //pax dropdown show blank and 0
    "filter-suite": {
      set: suiteSet,
      sortFn: (a, b) => a.localeCompare(b),
    },
  };
for (const [id, { set, sortFn }] of Object.entries(filterMap)) {
  const select = document.getElementById(id);
  if (!select) continue;

  select.innerHTML = [...set]
    .sort(sortFn)
    .map((val) => `<option value="${val}">${val}</option>`)
    .join('');
}
}

// Send filtered data to child iframe
function sendFiltersToChild() {
  showSpinner();
  const frame = document.getElementById("floor-img");
  if (!frame || !frame.contentWindow) return;

  const selectedOutlet = document.getElementById("filter-outlet")?.value || "all";

  console.log("selectedOutlet",selectedOutlet)
  const selectedStatus = document.getElementById("filter-status")?.value.toLowerCase() || "all";
  const selectedPax = document.getElementById("filter-pax")?.value || "all";
  const selectedSuite = document.getElementById("filter-suite")?.value || "all";

  const filteredRooms = roomData.filter((room) => {
    console.log(`Filtering room: ${room.name}, Outlet: ${room.outlet}, Status: ${room.status}, Pax: ${room.capacity}`);
    return (
      (selectedOutlet === "all" || room.outlet === selectedOutlet) &&
      (selectedStatus === "all" || room.status.toLowerCase() === selectedStatus) &&
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
  console.log("Message sent to child:", {
  roomIds,
  statusFilter: selectedStatus,
  statusMap,
  selectedOutlet
});
}

// Receive message from iframe
window.addEventListener("message", (event) => {
  if (event.data === "ready" || event.data === "applied") {
    hideSpinner();

  }
  
});

// Start
fetchData();
