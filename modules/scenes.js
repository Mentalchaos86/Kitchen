import { config } from "../core/config.js";
import { $ } from "../core/dom.js";

const storageKey = "homehub-scene-choice-v1";

export function automaticScene() {
  const hour = new Date().getHours();
  const scenes = config.scenes || {};

  const morning = scenes.autoMorningStart ?? 5;
  const work = scenes.autoWorkStart ?? 11;
  const evening = scenes.autoEveningStart ?? 17;
  const night = scenes.autoNightStart ?? 23;

  if (hour >= morning && hour < work) return "morning";
  if (hour >= work && hour < evening) return "work";
  if (hour >= evening && hour < night) return "evening";
  return "evening";
}

export function storedSceneChoice() {
  return localStorage.getItem(storageKey) || config.scenes?.default || "auto";
}

export function applyScene(choice, persist = false) {
  const valid = ["auto", "morning", "work", "evening", "vacation"];
  const selected = valid.includes(choice) ? choice : "auto";
  const active = selected === "auto" ? automaticScene() : selected;

  document.body.dataset.scene = active;
  document.body.dataset.sceneChoice = selected;

  document.querySelectorAll("[data-scene-choice]").forEach(button => {
    button.classList.toggle("active", button.dataset.sceneChoice === selected);
  });

  const labels = {
    morning: "MORNING SCENE",
    work: "WORK SCENE",
    evening: "EVENING SCENE",
    vacation: "VACATION SCENE"
  };

  const status = $("activeSceneLabel");
  if (status) {
    status.textContent =
      selected === "auto" ? `AUTO · ${labels[active]}` : labels[active];
  }

  if (persist) localStorage.setItem(storageKey, selected);

  window.dispatchEvent(new CustomEvent("homehub:scene-change", {
    detail: { selected, active }
  }));
}

export function initScenes() {
  document.querySelectorAll("[data-scene-choice]").forEach(button => {
    button.addEventListener("click", () => {
      applyScene(button.dataset.sceneChoice, true);
    });
  });

  applyScene(storedSceneChoice());

  setInterval(() => {
    if (storedSceneChoice() === "auto") applyScene("auto");
  }, 60000);
}
