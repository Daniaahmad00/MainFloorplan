let roomData = {};
const floorplanObject = document.getElementById('floorplan');
const outletID = '63f5de531f29f60007ca8209';
const apiUrl = `https://script.google.com/macros/s/AKfycbxq5mOtzhtRcU_e99UG2Q8rXhOkbroXvP8eKE87GC8aLvrwf05EYLsv9cTXieXix0g0/exec?outlet_id=${outletID}`;

// Convert mm² to ft²
function convertSqmmToSqft(sqmm) {
  const sqft = parseFloat(sqmm) / 92903.04;
  return isNaN(sqft) ? '-' : sqft.toFixed(2) + ' sqft';
}

// Fetch room data from API
fetch(apiUrl)
  .then(response => response.json())
  .then(data => {
    data.forEach(item => {
      const id = item.id?.trim();
      if (!id) return;
      roomData[id] = {
        id: item.id,
        name: item.name || '-',
        type: item.type || '-',
        status: item.status || '-',
        price: item.price || '-',
        deposit: item.deposit || '-',
        capacity: item.capacity || '-',
        area: item.area || '-'
      };
    });

    // Load the first (default) floor when data is ready
    setupSVGListeners();
  });

// Detect SVG load and bind listeners
function setupSVGListeners() {
  if (floorplanObject.contentDocument?.readyState === 'complete') {
    updateRooms(floorplanObject.contentDocument);
  } else {
    floorplanObject.addEventListener('load', () => {
      updateRooms(floorplanObject.contentDocument);
    });
  }
}

// Floor level icon click handler
document.querySelectorAll('.floor-icon').forEach(icon => {
  icon.addEventListener('click', () => {
    document.querySelectorAll('.floor-icon').forEach(i => i.classList.remove('active'));
    icon.classList.add('active');

    const level = icon.dataset.level;
    floorplanObject.setAttribute('data', `MUB-level${level}.svg`);

    // Wait for the new SVG to load before updating room elements
    floorplanObject.addEventListener('load', () => {
      updateRooms(floorplanObject.contentDocument);
    }, { once: true }); // ensure it triggers once only per level change
  });
});

// Paint and bind each room
function updateRooms(svgDoc) {
  if (!svgDoc) return;

  Object.keys(roomData).forEach(id => {
    const room = svgDoc.getElementById(id);
    if (room) {
      const status = roomData[id].status?.toLowerCase();
      const fillColor = status === 'available' ? 'rgba(50, 185, 54, 0.85)' : 'rgba(235, 51, 38, 0.85)';

      room.setAttribute('fill', fillColor);
      room.setAttribute('stroke', '#333');
      room.setAttribute('stroke-width', '1');
      room.style.cursor = 'pointer';

      room.addEventListener('click', (e) => showPopup(e, id));
      room.addEventListener('mouseover', () => room.setAttribute('fill-opacity', '1'));
      room.addEventListener('mouseout', () => room.setAttribute('fill-opacity', '0.85'));
    }
  });
}

// Show popup near clicked room
function showPopup(event, roomId) {
  const info = roomData[roomId];
  if (!info) return;

  // Fill in the popup details
  document.getElementById('popupRoomName').innerText = info.name;
  document.getElementById('popupRoomType').innerText = info.type;
  document.getElementById('popupStatus').innerText = info.status;
  document.getElementById('popupPrice').innerText = info.price ? `RM ${Number(info.price).toLocaleString('en-MY', { minimumFractionDigits: 2 })}` : '-';
  document.getElementById('popupDeposit').innerText = info.deposit ? `RM ${info.deposit}` : '-';
  document.getElementById('popupCapacity').innerText = info.capacity;
  document.getElementById('popupArea').innerText = info.area ? convertSqmmToSqft(info.area) : '-';

  // Get position of room inside the SVG
  const roomElement = event.target;
  const roomBox = roomElement.getBoundingClientRect();
  const svgBox = floorplanObject.getBoundingClientRect();

  // Calculate absolute position on the screen
  const left = svgBox.left + (roomBox.left + roomBox.width / 2 - svgBox.left);
  const top = svgBox.top + (roomBox.top + roomBox.height / 2 - svgBox.top);

  // Set popup position (add scroll offset if needed)
  const popup = document.getElementById('popup');
  popup.style.left = `${left + window.scrollX + 10}px`;  // small offset
  popup.style.top = `${top + window.scrollY - 10}px`;
  popup.style.display = 'block';
}


function closePopup() {
  document.getElementById('popup').style.display = 'none';
}
