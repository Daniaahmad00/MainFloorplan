const outletMap = { "67ad665a9aa9ef620e693aa0": "8FA" };
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
    "filter-outlet": outletSet,
    "filter-status": statusSet,
    "filter-pax": paxSet,
    "filter-suite": suiteSet,
  };
  for (const [id, set] of Object.entries(filterMap)) {
    const select = document.getElementById(id);
    select.innerHTML =
      '<option value="all">All</option>' +
      [...set]
        .sort()
        .map((v) => `<option value="${v}">${v}</option>`)
        .join("");
    select.addEventListener("change", sendFiltersToChild);
  }
}

function updateFloorplanFrame() {
  const selectedOutlet = document.getElementById("filter-outlet").value;
  const frame = document.getElementById("floor-img");
  if (outletfile[selectedOutlet]) frame.src = outletfile[selectedOutlet];
}
// // Send filters to child iframe
// function sendFiltersToChild() {
//   showSpinner();
//   const frame = document.getElementById("floor-img");
//   if (!frame || !frame.contentWindow) return;

//   const selectedOutlet = document.getElementById("filter-outlet").value;
//   const selectedStatus = (
//     document.getElementById("filter-status").value || "all"
//   ).toLowerCase();
//   const selectedPax = document.getElementById("filter-pax").value;
//   const selectedSuite = document.getElementById("filter-suite").value;

//   const filteredRooms = roomData.filter((room) => {
//     return (
//       (selectedOutlet === "all" || room.outlet === selectedOutlet) &&
//       (selectedPax === "all" || room.capacity == selectedPax) &&
//       (selectedSuite === "all" || room.name === selectedSuite)
//     );
//   });

//   const roomIds = filteredRooms.map((r) => r.id);
//   const statusMap = {};
//   filteredRooms.forEach((r) => (statusMap[r.id] = r.status));

//   frame.contentWindow.postMessage(
//     { roomIds, statusFilter: selectedStatus, statusMap },
//     "*"
//   );
// }

// Listen for child ready or update
window.addEventListener("message", (event) => {
  if (event.data === "ready" || event.data === "applied") {
    hideSpinner();
  }
});

fetchData();
