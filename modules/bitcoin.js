import { config } from "../core/config.js";
import { $ } from "../core/dom.js";
import { markUpdated } from "../core/status.js";

const euro = new Intl.NumberFormat("nl-NL", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0
});

function drawChart(prices) {
  if (!prices.length) return;

  const width = 500;
  const height = 130;
  const padding = 6;
  const values = prices.map(point => point[1]);
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const range = maximum - minimum || 1;

  const points = values.map((value, index) => {
    const x =
      padding +
      index * ((width - padding * 2) / Math.max(values.length - 1, 1));
    const y =
      padding +
      ((maximum - value) / range) * (height - padding * 2);
    return [x, y];
  });

  const line = points
    .map((point, index) =>
      `${index ? "L" : "M"} ${point[0].toFixed(2)} ${point[1].toFixed(2)}`
    )
    .join(" ");

  const area =
    `${line} L ${points.at(-1)[0].toFixed(2)} ${height}` +
    ` L ${points[0][0].toFixed(2)} ${height} Z`;

  $("chartLine").setAttribute("d", line);
  $("chartArea").setAttribute("d", area);
  $("bitcoinLow").textContent = `LOW ${euro.format(minimum)}`;
  $("bitcoinHigh").textContent = `HIGH ${euro.format(maximum)}`;
}

export async function loadBitcoin() {
  const currency = config.bitcoin?.currency || "eur";

  try {
    const [priceResponse, chartResponse] = await Promise.all([
      fetch(
        `https://api.coingecko.com/api/v3/simple/price` +
        `?ids=bitcoin&vs_currencies=${currency}` +
        `&include_24hr_change=true&include_last_updated_at=true`
      ),
      fetch(
        `https://api.coingecko.com/api/v3/coins/bitcoin/market_chart` +
        `?vs_currency=${currency}&days=1`
      )
    ]);

    if (!priceResponse.ok || !chartResponse.ok) {
      throw new Error("Bitcoin API unavailable");
    }

    const priceData = await priceResponse.json();
    const chartData = await chartResponse.json();
    const info = priceData.bitcoin;
    const price = info[currency];
    const change = info[`${currency}_24h_change`];

    $("bitcoinPrice").textContent = euro.format(price);

    const changeElement = $("bitcoinChange");
    changeElement.textContent =
      `${change >= 0 ? "▲" : "▼"} ${Math.abs(change).toFixed(2)}% today`;
    changeElement.className =
      `bitcoin-change ${change >= 0 ? "up" : "down"}`;

    drawChart(chartData.prices || []);

    $("bitcoinUpdated").textContent =
      `UPDATED ${new Intl.DateTimeFormat("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      }).format(new Date())}`;

    $("bitcoinStatus").textContent = "LIVE";
    markUpdated();
  } catch (error) {
    $("bitcoinChange").textContent = "Market data unavailable";
    $("bitcoinStatus").textContent = "OFFLINE";
    console.error("[Bitcoin]", error);
  }
}

export function initBitcoin() {
  loadBitcoin();
  setInterval(
    loadBitcoin,
    Math.max(2, config.bitcoin?.refreshMinutes || 5) * 60000
  );
}
