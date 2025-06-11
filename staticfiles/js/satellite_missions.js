function showModal(mission) {
  document.getElementById("modal-title").textContent = mission.title;
  document.getElementById("modal-image").src = mission.image;
  document.getElementById("modal-desc").textContent = mission.desc;
  document.getElementById("modal-app").textContent = mission.application;
  document.getElementById("modal-benefit").textContent = mission.benefit;
  document.getElementById("modal-trl").textContent = mission.trl;
  document.getElementById("modal-center").textContent = mission.center;
  document.getElementById("modal-url").href = mission.url;

  document.getElementById("mission-modal").classList.remove("hidden");
}

function hideModal() {
  document.getElementById("mission-modal").classList.add("hidden");
}
