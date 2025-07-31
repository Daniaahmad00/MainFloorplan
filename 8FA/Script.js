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
      };
    });
    setupSVG();
  });

function setupSVG() {
  const svgObj = document.getElementById("8FAFloorplan");
  if (svgObj.contentDocument) {
    window.parent.postMessage("ready", "*");
  } else {
    svgObj.addEventListener("load", () => {
      window.parent.postMessage("ready", "*");
    });
  }
}

window.addEventListener("message", (event) => {
  const {
    roomIds = [],
    statusFilter = "all",
    statusMap = {},
  } = event.data || {};
  const svgDoc = document.getElementById("8FAFloorplan").contentDocument;
  if (!svgDoc) return;

  // fade all
  svgDoc.querySelectorAll("[id]").forEach((el) => {
    el.style.fill = "#ccc";
    el.style.opacity = "0.2";
  });

  // Highlight filtered rooms with specific colors
  roomIds.forEach((id) => {
    const el = svgDoc.getElementById(id);
    if (!el) return;
    const roomStatus = statusMap[id] || roomData[id]?.status;

    if (statusFilter === "all" || roomStatus === statusFilter) {
      const fillColor = statusColors[roomStatus] || "#ccc";
      el.style.fill = fillColor;
      el.style.opacity = "0.2"; // 👈 stand out strongly
      el.style.stroke = "#333"; // 👈 optional: add border for contrast
      el.style.strokeWidth = "1";
    }

    if (statusFilter === "all" || roomStatus === statusFilter) {
      el.style.fill = statusColors[roomStatus] || "#999";
      el.style.opacity = "1";
    }
  });
  // notify parent that filtering applied
  window.parent.postMessage("applied", "*");
});

function closePopup() {
  document.getElementById("popup").style.display = "none";
}
