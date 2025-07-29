// Mapping outlet IDs to names and URLs
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

const outletUrls = {
  'ITG': 'https://itgfloorplan.netlify.app/',
  '8FA': 'https://8fafloorplan.netlify.app/'
};

// Status grouping
function GroupedStatus(status) {
  const available = ['available'];
  const occupied = ['available_soon', 'reserved', 'occupied', 'unavailable'];

  if (available.includes(status.toLowerCase())) return 'Available';
  if (occupied.includes(status.toLowerCase())) return 'Occupied';
  return 'Unknown';
}
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
function populateFilters() {
  const outletSet = new Set(), statusSet = new Set(), paxSet = new Set(), suiteSet = new Set();
  roomData.forEach(r => {
    outletSet.add(r.outlet);
    statusSet.add(r.status);
    paxSet.add(r.capacity);
    suiteSet.add(r.name);
  });

  const filterMap = {
    'filter-outlet': outletSet,
    'filter-status': statusSet,
    'filter-pax': paxSet,
    'filter-suite' : suiteSet
  };

  for (const [id, set] of Object.entries(filterMap)) {
    const select = document.getElementById(id);
    select.innerHTML = '<option value="">All</option>' +
      [...set].sort().map(val => `<option value="${val}">${val}</option>`).join('');  //dropdown reset inside the loop
  }
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

  if (!selectedOutlet) {
    document.getElementById('metrics-summary').innerHTML = `
      <tr><td>Occupied</td><td>0</td></tr>
      <tr><td>Available</td><td>0</td></tr>
    `;
    return;
  }

  const filtered = roomData.filter(r => r.outlet === selectedOutlet);
  const occupied = filtered.filter(r => r.status === 'Occupied').length;
  const available = filtered.filter(r => r.status === 'Available').length;

  document.getElementById('metrics-summary').innerHTML = `
    <tr><td>Occupied</td><td>${occupied}</td></tr>
    <tr><td>Available</td><td>${available}</td></tr>
  `;
}

function updateRoomTable() {
  const outlet = document.getElementById('filter-outlet').value;
  const status = document.getElementById('filter-status').value;
  const pax = document.getElementById('filter-pax').value;
  const suite = document.getElementById('filter-suite')?.value;

  const filtered = roomData.filter(r =>
    (!outlet || r.outlet === outlet) &&
    (!status || r.status === status) &&
    (!pax || r.capacity === pax) &&
    (!suite || r.name === suite)
  );

  // Update floorplan iframe
  const iframe = document.getElementById('floor-img');
  iframe.src = outletUrls[outlet] || '';
  console.log('🖼️ Floorplan iframe URL set to:', iframe.src);

// Zoom to suite [debug]
if (suite && outletUrls[outlet]) {
  console.log('🔍 Zooming to suite:', suite);
  setTimeout(() => {
    iframe.contentWindow?.postMessage({ type: 'zoomToRoom', roomName: suite }, '*');
    console.log('📩 postMessage sent:', { type: 'zoomToRoom', roomName: suite });
  }, 500);
} else {
  console.log('ℹ️ No suite selected or outlet URL missing for zoom.');
}
  const tableBody = document.getElementById('details-body');
  if (filtered.length === 0) {
    tableBody.innerHTML = '<p class="p-4 text-gray-500">No rooms match your selected filters.</p>';
    return;
  }

  tableBody.innerHTML = `
    <table class="w-full text-sm text-left border border-gray-300">
      <tbody>
        ${filtered.map(r => `
          <tr class="hover:bg-gray-50">
            <td class="p-2 border font-semibold">${r.name}</td>
            <td class="p-2 border">
              Type: ${r.type} <br>
              Status: ${r.status} <br>
              Pax: ${r.capacity} <br>
              Area: ${r.area} sqft <br>
              Price: RM ${r.price} <br>
              Deposit: RM ${r.deposit}
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

// Setup event listeners
document.addEventListener('DOMContentLoaded', () => {
  fetchData();

  ['filter-outlet', 'filter-status', 'filter-pax', 'filter-suite'].forEach(id => {
    document.getElementById(id)?.addEventListener('change', () => {
      const selectedOutlet = document.getElementById('filter-outlet').value;
      const selectedStatus = document.getElementById('filter-status').value;
      const selectedPax = document.getElementById('filter-pax').value;

      //pax slicer - filter based on outlet and status
        const filteredForPax = roomData.filter(r =>
        (!selectedOutlet || r.outlet === selectedOutlet) &&
        (!selectedStatus || r.status === selectedStatus)
      );
      updatePaxOptions(filteredForPax);

      //suite slicer & table
      const filteredData = roomData.filter(r =>
        (!selectedOutlet || r.outlet === selectedOutlet) &&
        (!selectedStatus || r.status === selectedStatus) &&
        (!selectedPax || r.capacity === selectedPax)
      );
     console.log(selectedOutlet)
     console.log(selectedPax)
      updateSuiteOptions(filteredData);
      updateMetrics();
      updateRoomTable();
    });
  });
});
