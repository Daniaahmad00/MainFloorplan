let roomData = {};
const statusColors = {
  available: "rgba(50, 185, 54, 0.85)", // Green
  available_soon: "rgba(255, 215, 0, 0.85)", // Yellow
  occupied: "rgba(235, 51, 38, 0.85)", // Red
  reserved: "rgba(0, 123, 255, 0.85)", // Blue
  unavailable: "rgba(128, 128, 128, 0.85)", // Gray
};

fetch(
  "https://script.google.com/macros/s/AKfycbxq5mOtzhtRcU_e99UG2Q8rXhOkbroXvP8eKE87GC8aLvrwf05EYLsv9cTXieXix0g0/exec?outlet_id=67ad665a9aa9ef620e693aa0"
)
  .then((r) => r.json())
  .then((data) => {
    data.forEach((item) => {
      roomData[item.id] = {
        id: item.id,
        name: item.name,
        status: item.status.toLowerCase(),
        type: item.type,
        capacity: item.capacity,
        area: item.area,
        price: item.price,
        deposit: item.deposit,
      };
    });
    setupSVG();
  });

function setupSVG() {
  const svgObj = document.getElementById("8FAFloorplan");
  svgObj.addEventListener("load", () => {
    const svgDoc = svgObj.contentDocument;
    if (!svgDoc) return;

    // Attach click to each room
    Object.keys(roomData).forEach((id) => {
      const el = svgDoc.getElementById(id);
      if (el) {
        el.style.cursor = "pointer";
        el.addEventListener("click", (e) => { 
          showPopup(e, id);
        });
      }
    }); 

    window.parent.postMessage("ready", "*");
  });
}

// Show popup
function showPopup(x, y, roomId) {
  const info = roomData[roomId];
  if (!info) return;

  const popup = document.getElementById("popup");

  popup.innerHTML = `
    <div style="
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 14px;
      color: #333;
    ">
      <span onclick="closePopup()" 
        style="cursor:pointer; float:right; font-weight:bold; font-size:18px; color:#888;"
        onmouseover="this.style.color='#f44336'" 
        onmouseout="this.style.color='#888'">&times;</span>
      
      <h3 style="margin:0 0 8px; font-size:16px; font-weight:600; color:#ff6b00;">
        ${info.name || "-"}
      </h3>
      
      <div style="border-top:1px solid #eee; padding-top:8px;">
        <p style="margin:4px 0;"><strong>Status:</strong> 
          <span style="color:${
            statusColors[info.status] || "#555"
          }; font-weight:600;">
            ${info.status || "-"}
          </span>
        </p>
        <p style="margin:4px 0;"><strong>Type:</strong> ${info.type || "-"}</p>
        <p style="margin:4px 0;"><strong>Capacity:</strong> ${
          info.capacity || "-"
        }</p>
        <p style="margin:4px 0;"><strong>Area:</strong> ${
          info.area ? info.area + " sqft" : "-"
        }</p>
        <p style="margin:4px 0; color:#28a745;"><strong>Price:</strong> 
          ${info.price ? "RM " + info.price : "-"}
        </p>
        <p style="margin:4px 0; color:#007bff;"><strong>Deposit:</strong> 
          ${info.deposit ? "RM " + info.deposit : "-"}
        </p>
      </div>
    </div>
  `;

  // Position neatly near click
  popup.style.left = `${x + 20}px`;
  popup.style.top = `${y - 30}px`;
  popup.style.display = "block";
  popup.style.zIndex = "9999";

  // Add container styling
  popup.style.background = "#fff";
  popup.style.border = "1px solid #ddd";
  popup.style.borderRadius = "10px";
  popup.style.boxShadow = "0px 4px 12px rgba(0,0,0,0.15)";
  popup.style.padding = "15px";
  popup.style.width = "220px";
  popup.style.transition = "all 0.3s ease";
}

function closePopup() {
  document.getElementById("popup").style.display = "none";
}

// Handle filters from parent
window.addEventListener("message", (event) => {
  const {
    roomIds = [],
    statusFilter = "all",
    statusMap = {},
  } = event.data || {};
  const svgDoc = document.getElementById("8FAFloorplan").contentDocument;
  if (!svgDoc) return;

  svgDoc.querySelectorAll("[id]").forEach((el) => {
    el.style.fill = "#ccc";
    el.style.opacity = "0.9";
  });

  roomIds.forEach((id) => {
    const el = svgDoc.getElementById(id);
    if (!el) return;
 
    const roomStatus = statusMap[id] || roomData[id]?.status;

    if (statusFilter === "all" || roomStatus === statusFilter) {
      el.style.fill = statusColors[roomStatus] || "#ccc";
      el.style.opacity = "1";

      // Make clickable
      el.style.cursor = "pointer";

      // Remove old listener if any to prevent duplicates
      el.replaceWith(el.cloneNode(true));
      const newEl = svgDoc.getElementById(id);

      // Add click for popup
      newEl.addEventListener("click", (e) => {
        const rect = svgDoc.documentElement.getBoundingClientRect();
        const clickX = rect.left + e.clientX;
        const clickY = rect.top + e.clientY;

        showPopup(clickX, clickY, id);
      });
    }
  });

  window.parent.postMessage("applied", "*");
});
