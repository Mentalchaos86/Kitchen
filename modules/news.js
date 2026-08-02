import { config } from "../core/config.js";
import { $, escapeHtml, stripHtml } from "../core/dom.js";
import { markUpdated } from "../core/status.js";

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "short"
      }).format(date);
}

export async function loadNews() {
  try {
    const response = await fetch(
      config.rssProxyUrl + encodeURIComponent(config.rssFeedUrl)
    );

    if (!response.ok) throw new Error("RSS unavailable");

    const data = await response.json();
    if (data.status && data.status !== "ok") {
      throw new Error(data.message || "RSS error");
    }

    const items = (data.items || []).slice(0, 3);
    if (!items.length) throw new Error("No stories");

    $("newsList").innerHTML = items.map(item => {
      const snippet =
        stripHtml(item.description || item.content || "").slice(0, 125);

      return `
        <a class="news-item"
           href="${item.link}"
           target="_blank"
           rel="noopener">
          <div>
            <div class="news-kicker">LATEST ARTICLE</div>
            <div class="news-title">${escapeHtml(item.title)}</div>
            ${snippet
              ? `<div class="news-snippet">${escapeHtml(snippet)}${
                  snippet.length >= 125 ? "…" : ""
                }</div>`
              : ""}
          </div>
          <div class="news-meta">
            ${formatDate(item.pubDate)} · THAT’S GAMING
          </div>
        </a>`;
    }).join("");

    $("newsStatus").textContent = "LIVE";
    markUpdated();
  } catch (error) {
    $("newsList").innerHTML =
      `<div class="empty-state">Headlines could not load.</div>`;
    $("newsStatus").textContent = "OFFLINE";
    console.error("[News]", error);
  }
}

export function initNews() {
  loadNews();
  setInterval(
    loadNews,
    Math.max(5, config.refreshMinutes || 15) * 60000
  );
}
