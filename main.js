//declare and mapping of outlet names
const outletMap = {
  '65e56bd7a24b74cef513834f': 'ITG',
  '67ad665a9aa9ef620e693aa0': '8FA',
  '565748274a955c790d808c77': 'UBP',
  '5dac63c998e930010a595016': 'KLG',
  '5db8fb7e35798d0010950a77': 'TTDI',
  '5db8fb9798549f0010df15f3': 'STO',
  '62a9832b43c9f437e373e9dd': 'KLS',
  '63f5de531f29f60007ca8209': 'MUB',
  '6537957cc3653d2412ab4d7e': 'SPM',
  '66dfd21d5ec307e20a9b761c': 'UBP3A',
  '671f3dbf0951c4dfbaaadd5d': 'SV2'
};
//link to outlet files
const outletfile = {
  '8FA': './8FA/index.html',
};
//load meta
let roomData = [];
//fetching data from google sheet via API
async function fetchData() {
  const res = await fetch('https://script.google.com/macros/s/AKfycbxKhih7njEt3fiRMvbJnHOTYUCeHlENVMK7i5EosmE65lZE_K7esXdNJ7tAjIHRNwEg/exec');
  const data = await res.json();
  //select used
  roomData = data.map(item => ({
    id: item.id || '-',
    name: item.name || '-',
    type: item.type || '-',
    status: GroupedStatus(item.status || '-'),
    price: item.price || '-',
    deposit: item.deposit || '-',
    capacity: String(item.capacity || '-'),
    area: item.area || '-',
    outlet: outletMap[item.outlet_id],
    outlet_id: item.outlet_id
  }));
  //declare of key functions
  populateFilters();
  updateSuiteOptions(roomData);
  updateMetrics();
  updateRoomTable();
  updatePaxOptions(roomData);
}
//populating dropdown function to ALL
function updateFloorplanFrame() {
  const selectedOutlet = document.getElementById('filter-outlet').value;
  const frame = document.getElementById('floor-img');
  if (outletfile[selectedOutlet]) {
    frame.src = outletfile[selectedOutlet];
  }
}
// Populate filters for the dropdowns
function populateFilters() {
  const outletSet = new Set(), statusSet = new Set(), paxSet = new Set(), suiteSet = new Set();  //create unique sets for each filter type
  roomData.forEach(r => {    //loop through roomData to populate the sets
    outletSet.add(r.outlet);
    statusSet.add(r.status);
    paxSet.add(r.capacity);
    suiteSet.add(r.name);
  });
  // Create a mapping of filter IDs to their respective sets
  const filterMap = {
    'filter-outlet': outletSet,
    'filter-status': statusSet,
    'filter-pax': paxSet,
    'filter-suite' : suiteSet
  };
  // Populate each filter dropdown with options
  for (const [id, set] of Object.entries(filterMap)) {
    const select = document.getElementById(id);
    select.innerHTML = '<option value="">All</option>' +
    [...set].sort().map(val => `<option value="${val}">${val}</option>`).join('');  //dropdown reset inside the loop
  }}
  // Status grouping where the status is grouped into Available and Occupied
  function GroupedStatus(status) {
    const available = ['available'];
    const occupied = ['available_soon', 'reserved', 'occupied', 'unavailable'];
  
    if (available.includes(status.toLowerCase())) return 'Available';
    if (occupied.includes(status.toLowerCase())) return 'Occupied';
    return 'Unknown';
  }
  //dropdown function for pax size
function updatePaxOptions(filteredOutletData) {
  const paxDropdown = document.getElementById('filter-pax');       
  const currentValue = paxDropdown.value;  
  const uniquePax = [...new Set(filteredOutletData.map(i => Number(i.capacity)))].sort((a, b) => a - b); //extract unique pax sizes only for current outlet  //sort ascending

  paxDropdown.innerHTML = '<option value="">All</option>'; 
  uniquePax.forEach(p => {
    paxDropdown.innerHTML += `<option value="${p}">${p}</option>`;
  });

  if ([...paxDropdown.options].some(o => o.value === currentValue)) {
    paxDropdown.value = currentValue;
  }
}
//dropdown funtion for suite
function updateSuiteOptions(filteredData) {
  const suiteDropdown = document.getElementById('filter-suite');
  const selected = suiteDropdown.value;

  const roomNames = [...new Set(filteredData.map(r => r.name))].sort();

suiteDropdown.innerHTML = '<option value="">All</option>';
roomNames.forEach(name => {
  suiteDropdown.innerHTML += `<option value="${name}">${name}</option>`;
});

  if (roomNames.includes(selected)){
    suiteDropdown.value =selected;
  } else {
    suiteDropdown.value = '';
  }
}
function updateMetrics() {
  const selectedOutlet = document.getElementById('filter-outlet').value;
  const selectedStatus = document.getElementById('filter-status').value;
  const selectedPax = document.getElementById('filter-pax').value;
  const metricsContainer = document.getElementById('metrics-summary');

  if (!selectedOutlet) {
    metricsContainer.innerHTML = `
      <tr><td>Occupied</td><td>0</td></tr>
      <tr><td>Available</td><td>0</td></tr>
    `;
    return;
  }

  // Filter by outlet and status (if any)
  const filtered = roomData.filter(r => {
    const outletMatch = r.outlet === selectedOutlet;
    const statusMatch = selectedStatus ? GroupedStatus(r.status) === selectedStatus : true;
    return outletMatch && statusMatch;
  });

  // If Pax Size filter is selected: show breakdown per pax size
  if (selectedPax) {
    const paxMap = {};

    filtered.forEach(r => {
      const pax = r.capacity;
      const status = GroupedStatus(r.status);
      if (!paxMap[pax]) paxMap[pax] = { Available: 0, Occupied: 0 };
      if (status === 'Available' || status === 'Occupied') {
        paxMap[pax][status]++;
      }
    });

    const rows = Object.entries(paxMap)
      .sort((a, b) => a[0] - b[0])
      .map(([pax, counts]) => `
        <tr>
          <td>Pax ${pax}</td>
          <td>${counts.Available}</td>
          <td>${counts.Occupied}</td>
        </tr>
      `).join('');

    metricsContainer.innerHTML = `
      <tr><th>Pax Size</th><th>Available</th><th>Occupied</th></tr>
      ${rows}
    `;
  } else {
    // Default view: just total available & occupied
    const occupied = filtered.filter(r => GroupedStatus(r.status) === 'Occupied').length;
    const available = filtered.filter(r => GroupedStatus(r.status) === 'Available').length;

    metricsContainer.innerHTML = `
      <tr><td>Occupied</td><td>${occupied}</td></tr>
      <tr><td>Available</td><td>${available}</td></tr>
    `;
  }
}
// Function to update the room table based on selected filters
function updateRoomTable() {  
  const selectedOutlet = document.getElementById('filter-outlet').value;
  const selectedStatus = document.getElementById('filter-status').value;        
  const selectedPax = document.getElementById('filter-pax').value;
  const selectedSuite = document.getElementById('filter-suite').value;

  // Filter the room data based on selected criteria
  const filteredRooms = roomData.filter(room => {
    return (selectedOutlet ? room.outlet === selectedOutlet : true) &&
           (selectedStatus ? GroupedStatus(room.status) === selectedStatus : true) &&
           (selectedPax ? room.capacity === Number(selectedPax) : true) &&
           (selectedSuite ? room.name === selectedSuite : true);
  });

  // Update the room table with filtered data
  const roomTableBody = document.getElementById('room-table-body');
  roomTableBody.innerHTML = ''; // Clear existing rows

  filteredRooms.forEach(room => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${room.name}</td>
      <td>${room.outlet}</td>
      <td>${room.capacity}</td>
      <td>${room.status}</td>
    `;
    roomTableBody.appendChild(row);
  });
}