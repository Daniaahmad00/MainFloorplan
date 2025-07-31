let roomData = {};
const object = document.getElementById('ITGFloorplan');
const outletID = '65e56bd7a24b74cef513834f'; 
const apiUrl = 'https://script.google.com/macros/s/AKfycbxq5mOtzhtRcU_e99UG2Q8rXhOkbroXvP8eKE87GC8aLvrwf05EYLsv9cTXieXix0g0/exec?outlet_id=65e56bd7a24b74cef513834f'; 
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
  const svgDoc = object.contentDocument;

  if (svgDoc) {
    updateRooms(svgDoc);
  } else {
  
    object.addEventListener('load', () => {
      updateRooms(object.contentDocument);
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
