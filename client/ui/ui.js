// UI updates (buttons, overlays, etc.)
export const planetTravelBtns = document.getElementById("planetTravelBtns");
export const stopTravelBtn = document.getElementById("stopTravelBtn");

export function updatePlanetTravelButtons(
  planets,
  isTraveling,
  selectedPlanet,
  travelHandlers
) {
  // Clear existing
  planetTravelBtns.innerHTML = "";
  if (!isTraveling) {
    planets.forEach((planet, idx) => {
      const btn = document.createElement("button");
      btn.textContent = `Travel to ${planet.name}`;
      btn.style.padding = "12px 20px";
      btn.style.fontSize = "20px";
      btn.style.background = planet.color;
      btn.style.color = "#fff";
      btn.style.border = "none";
      btn.style.borderRadius = "8px";
      btn.style.boxShadow = "0 2px 8px #0008";
      btn.style.cursor = "pointer";
      btn.id = `travelBtn_${planet.name}`;
      btn.onclick = () => travelHandlers.onTravel(planet);
      planetTravelBtns.appendChild(btn);
    });
    planetTravelBtns.style.display = "flex";
  } else {
    planetTravelBtns.style.display = "none";
  }
}
