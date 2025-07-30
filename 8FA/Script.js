let roomData = {};
const object = document.getElementById('8FAFloorplan');
const outletID = '67ad665a9aa9ef620e693aa0';
const apiUrl = `https://script.google.com/macros/s/AKfycbxq5mOtzhtRcU_e99UG2Q8rXhOkbroXvP8eKE87GC8aLvrwf05EYLsv9cTXieXix0g0/exec?outlet_id=67ad665a9aa9ef620e693aa0`;
function convertSqmmToSqft(sqmm) {
const sqft = parseFloat(sqmm) / 92903.04;
return isNaN(sqft) ? '-' : sqft.toFixed(2) + ' sqft';
}

//Fetch from API
fetch(apiUrl)
  .then(response => response.json())
  .then(data => {
    data.forEach(item => {
      const id = item.id.trim();

      if (!id) return
      
      roomData[id] = {
        id: item.id || '-',
        name: item.name || '-',
        type: item.type || '-',
        status: item.status || '-',
        price: item.price || '-',
        deposit: item.deposit || '-',
        capacity: item.capacity || '-',
        area: item.area || '-'
      };

    });
    setupSVG();
})
//  Setup SVG interactions
function setupSVG() {
  const svgObject = document.getElementById('8FAFloorplan');

  if (!svgObject) {
    console.warn('⚠️ SVG object not found.');
    return;
  }

  if (svgObject.contentDocument && svgObject.contentDocument.documentElement) {
    // SVG already loaded
    updateRooms(svgObject.contentDocument);
  } else {
    // Wait for it to load
    svgObject.addEventListener('load', () => {
      updateRooms(svgObject.contentDocument);
    });
  }
}

function updateRooms(svgDoc) {
  const roomIds = Object.keys(roomData);

  roomIds.forEach(id => {
    const room = svgDoc.getElementById(id);
    if (room) {
      const status = roomData[id].status?.toLowerCase();
      const fillColor = (status === 'available')
       ? 'rgba(50, 185, 54, 0.85)' // Green
      : 'rgba(235, 51, 38, 0.85)'; // Red for all others
      room.setAttribute('fill', fillColor);
      room.setAttribute('stroke', '#333');
      room.setAttribute('stroke-width', '1');

      room.addEventListener('click', (e) => showPopup(e, id));
      room.addEventListener('mouseover', () => room.setAttribute('fill-opacity', '1'));
      room.addEventListener('mouseout', () => room.setAttribute('fill-opacity', '0.85'));
    } else {
      console.warn(`⚠️ Room ID not found in SVG: ${id}`);
    }
  });
}
// Receive filter commands from parent
window.addEventListener('message', (event) => {
  const { roomIds, statusMap, zoomTo } = event.data || {};
  if (!roomIds || !statusMap) return;

  const svgDoc = document.getElementById('8FAFloorplan')?.contentDocument;
  if (!svgDoc) return;

  // Loop all rooms
  Object.keys(roomData).forEach(id => {
    const room = svgDoc.getElementById(id);
    if (!room) return;
    if (!room) return;

    if (roomIds.includes(id)) {
      const status = statusMap[id];
      const fill = status === 'Available'
        ? 'rgba(50,185,54,0.85)'    // green
        : 'rgba(235,51,38,0.85)';   // red

      room.setAttribute('fill', fill);
      room.style.opacity = '1';
    } else {
      room.setAttribute('fill', '#ccc');  // grey
      room.style.opacity = '0.15';        // dim
    }
  });

  // Optional: Zoom to selected suite
  if (zoomTo) {
    const targetRoom = svgDoc.getElementById(zoomTo);
    if (targetRoom && typeof targetRoom.scrollIntoView === 'function') {
      targetRoom.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    }
  }
});
;

//Show Popup Info
function showPopup(event, roomId) {
  const info = roomData[roomId];
  if (!info) return;
  
  document.getElementById('popupRoomName').innerText = info.name || '-';
  document.getElementById('popupRoomType').innerText = info.type || '-';
  document.getElementById('popupStatus').innerText = info.status || '-';
  document.getElementById('popupPrice').innerText = info.price ? `RM ${Number(info.price).toLocaleString('en-MY', { minimumFractionDigits: 2 })}` : '-';
  document.getElementById('popupDeposit').innerText = info.deposit ? `RM ${info.deposit}` : '-';
  document.getElementById('popupCapacity').innerText = info.capacity || '-';
  document.getElementById('popupArea').innerText = info.area ? `${convertSqmmToSqft(info.area)}` : '-';
  
  const popup = document.getElementById('popup');
  
  // Get mouse click position instead of relying on bounding box
  const left = event.pageX + 15;  // 15px to the right of click
  const top = event.pageY - 30;   // 30px above click

  popup.style.left = `${left}px`;
  popup.style.top = `${top}px`;
  popup.style.display = 'block';
}
function closePopup() {
  document.getElementById('popup').style.display = 'none';
}
