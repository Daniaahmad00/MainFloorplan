let roomData = {};
const object = document.getElementById('8FAFloorplan');
const outletID = '67ad665a9aa9ef620e693aa0';
const apiUrl = `https://script.google.com/macros/s/AKfycbyWrIrwH9WftJhKqv9l27lAgmZst85SBFtvJkjFqx-jblu2t1wNnc8fiVFt40Ju8Wv4/exec?outlet_id=67ad665a9aa9ef620e693aa0`;
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
    console.error("SVG object not found");
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
      const fillColor = status === 'available'
        ? 'rgba(50, 185, 54, 0.85)'
        : 'rgba(235, 51, 38, 0.85)';

      // ✅ Set attributes required for postMessage selectors
      room.setAttribute('fill', fillColor);
      room.setAttribute('data-room-id', id);
      console.log(` Set SVG attributes for ${id}:`, roomData[id].name);
      room.setAttribute('data-room-name', roomData[id].name || '');
      room.setAttribute('stroke', '#333');
      room.setAttribute('stroke-width', '2');

      room.addEventListener('click', (e) => showPopup(e, id));
      room.addEventListener('mouseover', () => room.setAttribute('fill-opacity', '1'));
      room.addEventListener('mouseout', () => room.setAttribute('fill-opacity', '0.85'));
    } else {
      console.warn(`⚠️ Room ID not found in SVG: ${id}`);
    }
  });
  // Notify parent that we're ready to receive filters
  window.parent.postMessage("ready", "*");
}



// Receive filter commands from parent
window.addEventListener('message', (event) => {
  const data = event.data;
  console.log("Received message from parent:", event.data);
  
  const { roomIds, statusMap, paxSizeMap, suiteName } = data;

  allRooms.forEach(room => {
    const roomId = room.id;
    const status = statusMap[roomId];
    const pax = paxSizeMap[roomId];

    // Always reset display and fill
    room.style.display = 'none';
    room.removeAttribute('fill');

    // Zoom to suite only
    if (suiteName && roomId === suiteName) {
      room.style.display = 'block';
      room.setAttribute('stroke', 'blue');
      room.setAttribute('stroke-width', '3');
      zoomToRoom(suiteName); // call your zoom function
      return;
    }

    if (roomIds.includes(roomId)) {
      room.style.display = 'block';

      // Apply color based on status
      if (status === "Available") {
        room.setAttribute('fill', 'green');
      } else if (status === "Occupied") {
        room.setAttribute('fill', 'red');
      }
    }
  });
});



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
