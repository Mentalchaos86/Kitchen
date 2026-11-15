// Household lists (boodschappen, huishoudtaken, onderhoud).
// v1.9: stored per device in localStorage. A shared store (Google Sheet or
// Home Assistant to-do lists) can replace this later without changing the UI.

import { config } from "../core/config.js";

const KEY = "homehub-household-v1";
export const LISTS = {
  shopping: { label: "Boodschappen", empty: "Niets op de lijst" },
  chores: { label: "Huishoudtaken", empty: "Geen open taken" },
  maintenance: { label: "Onderhoud", empty: "Niets gepland" }
};

function seed() {
  const shopping = (config.defaultShoppingItems || []).map(text => item(text));
  return { shopping, chores: [], maintenance: [] };
}

function item(text) {
  return {
    id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`,
    text: String(text).trim().slice(0, 80)
  };
}

function read() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "null");
    if (!raw || typeof raw !== "object") return seed();
    const data = {};
    for (const list of Object.keys(LISTS)) {
      data[list] = Array.isArray(raw[list])
        ? raw[list].filter(entry => entry && typeof entry.text === "string")
        : [];
    }
    return data;
  } catch {
    return seed();
  }
}

let data = read();

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {}
  window.dispatchEvent(new CustomEvent("homehub:household-change", { detail: data }));
}

export function getHousehold() {
  return data;
}

export function addHouseholdItem(list, text) {
  if (!LISTS[list] || !String(text || "").trim()) return;
  data[list] = [...data[list], item(text)];
  save();
}

export function removeHouseholdItem(list, id) {
  if (!LISTS[list]) return;
  data[list] = data[list].filter(entry => entry.id !== id);
  save();
}
