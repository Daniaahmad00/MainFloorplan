// UniversalChild.js
let selectedOutletKey = null;
let currentSvgIndex = 0;  
let svgViewer = document.getElementById("selectedOutlet");

let roomData = {};
const statusColors = {
  Available: "rgba(50, 185, 54, 0.85)", // Green
  Occupied: "rgba(235, 51, 38, 0.85)", // Red
};
const outlets = [
  { name: "8FA", id: "67ad665a9aa9ef620e693aa0", svg: "SVG-file/8FA.svg" },
  { name: "ITG", id: "65e56bd7a24b74cef513834f", svg: "SVG-file/ITG.svg" },
  { name: "UBP", id: "565748274a955c790d808c77", svg: "SVG-file/UBP.svg" },
  { name: "KLG", id: "5dac63c998e930010a595016", svg: "SVG-file/KLG.svg" },
  { name: "TTDI", id: "5db8fb7e35798d0010950a77", svg: ["SVG-file/TTDI-Level1.svg", "SVG-file/TTDI-Level3A.svg"] },
  { name: "STO", id: "5db8fb9798549f0010df15f3", svg: ["SVG-file/STO-Level11.svg", "SVG-file/STO-Level12.svg", "SVG-file/STO-Level14.svg"] },
  { name: "KLS", id: "62a9832b43c9f437e373e9dd", svg: ["SVG-file/KLS-L20.svg", "SVG-file/KLS-ByteDance.svg", "SVG-file/KLS-L21.svg", "SVG-file/KLS-L28.svg"] },
  { name: "MUB", id: "63f5de531f29f60007ca8209", svg: ["SVG-file/MUB-level9.svg", "SVG-file/MUB-level12.svg", "SVG-file/MUB-level17.svg"] },
  { name: "SPM", id: "6537957cc3653d2412ab4d7e", svg: "SVG-file/SPM.svg" },
  { name: "UBP3A", id: "66dfd21d5ec307e20a9b761c", svg: ["SVG-file/UBP-L13A.svg", "SVG-file/UBP-L13AAIRIT.svg"] },
  { name: "SV2", id: "671f3dbf0951c4dfbaaadd5d", svg: "SVG-file/SV2.svg" }
];

// Group statuses
  function GroupedStatus(status) {
  const available = ['available'];
  const occupied = ['available_soon', 'reserved', 'occupied', 'unavailable'];

  if (available.includes(status.toLowerCase())) return 'Available';
  if (occupied.includes(status.toLowerCase())) return 'Occupied';
  return 'Unknown';
}
// Load outlet info from parent
window.addEventListener("message", (event) => { 
  if (event.data?.selectedOutletKey) {
    selectedOutletKey = event.data.selectedOutletKey;
    currentSvgIndex = 0;

    // Load first floor by default
    const outlet = outletMap[selectedOutletKey];
    const svgFile = Array.isArray(outlet.svg) ? outlet.svg[0] : outlet.svg;
    svgViewer.setAttribute("data", svgFile); //triggers the floorplan to display

    // Populate level selector if available
    populateFloorSelector(selectedOutletKey);

    // Update room data
    fetch(`https://script.google.com/macros/s/AKfycbxq5mOtzhtRcU_e99UG2Q8rXhOkbroXvP8eKE87GC8aLvrwf05EYLsv9cTXieXix0g0/exec?outlet_id=${outlet.id}`)
    .then((r) => r.json())
    .then((data) => {
      data.forEach((item) => {
        roomData[item.id] = {
        id: item.id,
        name: item.name,
        status: GroupedStatus(item.status.toLowerCase()),
        type: item.type,
        capacity: item.capacity,
        area: item.area,
        price: item.price,
        deposit: item.deposit,
          };
        });
        console.log("Room data loaded:", roomData);
        setupSVG();
      });
  }
});

  // Convert square millimeters to square feet
  function convertSqmmToSqft(sqmm) {
  const sqft = parseFloat(sqmm) / 92903.04;
  return isNaN(sqft) ? '-' : sqft.toFixed(2) + ' sqft';
  }

  function setupSVG() {
    const svgObj = document.getElementById("selectedOutlet");
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
    <div style="font-family: 'Segoe UI'; font-size: 14px; color: #333;">
      <span onclick="closePopup()" style="cursor:pointer; float:right; font-weight:bold; font-size:18px; color:#888;"
        onmouseover="this.style.color='#f44336'" 
        onmouseout="this.style.color='#888'">&times;</span>
      <h3 style="margin:0 0 8px; font-size:16px; font-weight:600; color:#ff6b00;">
        ${info.name || "-"}
      </h3>
      <div style="border-top:1px solid #eee; padding-top:8px;">
        <p><strong>Status:</strong> 
          <span style="color:${statusColors[info.status] || "#555"}; font-weight:600;">
            ${info.status || "-"}
          </span>
        </p>
        <p><strong>Type:</strong> ${info.type || "-"}</p>
        <p><strong>Capacity:</strong> ${info.capacity || "-"}</p>
        <p><strong>Area:</strong> ${info.area ? info.area + " sqft" : "-"}</p>
        <p style="color:#28a745;"><strong>Price:</strong> ${info.price ? "RM " + info.price : "-"}</p>
        <p style="color:#007bff;"><strong>Deposit:</strong> ${info.deposit ? "RM " + info.deposit : "-"}</p>
      </div>
    </div>
  `;

  popup.style.left = `${x + 20}px`;
  popup.style.top = `${y - 30}px`;
  popup.style.display = "block";
  popup.style.zIndex = "9999";
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

// Optional: Floor dropdown support
function populateFloorSelector(outletKey) {
  const selector = document.getElementById("floorSelector");
  if (!selector) return;

  const outlet = outletMap[outletKey];
  const svgs = outlet.svg;
  selector.innerHTML = "";

  if (!Array.isArray(svgs)) {
    selector.style.display = "none";
    return;
  }

  svgs.forEach((svg, index) => {
    const opt = document.createElement("option");
    opt.value = index;
    opt.textContent = `Level ${index + 1}`;
    selector.appendChild(opt);
  });

  selector.style.display = "inline-block";
  selector.onchange = (e) => {
    currentSvgIndex = +e.target.value;
    svgViewer.setAttribute("data", outletMap[outletKey].svg[currentSvgIndex]);
  };
}

// Filter handling (unchanged)
window.addEventListener("message", (event) => {
  const {
    roomIds = [],
    statusFilter = "all",
    statusMap = {},
  } = event.data || {};
   console.log("Received message in child:", event.data);

  const svgDoc = svgViewer?.contentDocument;
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
      el.style.cursor = "pointer";
      el.replaceWith(el.cloneNode(true));
      const newEl = svgDoc.getElementById(id);
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

