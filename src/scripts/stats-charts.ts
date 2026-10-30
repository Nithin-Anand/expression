import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  DoughnutController,
  ArcElement,
  Filler,
  Legend,
  Tooltip,
} from "chart.js";

Chart.register(
  LineController,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  DoughnutController,
  ArcElement,
  Filler,
  Legend,
  Tooltip,
);
Chart.defaults.font.family = "'Poppins', sans-serif";

export function initStatsCharts(): void {
  for (const canvas of document.querySelectorAll<HTMLCanvasElement>("canvas[data-chart]")) {
    const { labels, values }: { labels: string[]; values: number[] } = JSON.parse(
      canvas.dataset.stats!,
    );
    if (canvas.dataset.chart === "line") {
      new Chart(canvas, {
        type: "line",
        data: {
          labels,
          datasets: [
            {
              label: "Total Images",
              data: values,
              borderColor: "#3498db",
              backgroundColor: "rgba(52, 152, 219, 0.1)",
              borderWidth: 2,
              fill: true,
              tension: 0,
              pointRadius: 3,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: {
              ticks: { maxRotation: 45, minRotation: 45, maxTicksLimit: 10 },
              grid: { display: false },
            },
            y: { beginAtZero: true },
          },
        },
      });
    } else {
      new Chart(canvas, {
        type: "doughnut",
        data: {
          labels,
          datasets: [
            {
              label: "Images",
              data: values,
              backgroundColor: [
                "#ff6384",
                "#36a2eb",
                "#ffce56",
                "#4bc0c0",
                "#9966ff",
                "#ff9f40",
                "#e74c3c",
                "#3498db",
                "#2ecc71",
                "#f39c12",
              ],
              borderColor: "#fff",
              borderWidth: 1,
              hoverOffset: 4,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: "60%",
          plugins: { legend: { position: "bottom", labels: { padding: 20, usePointStyle: true } } },
        },
      });
    }
  }
}
