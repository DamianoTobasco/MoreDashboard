import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { subDays, format } from 'date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
);

interface HistoricalEntry {
  timestamp: number; // milliseconds
  reserve1: number;  // value already converted to PLS
}

interface LiquidityChartProps {
  isLoading: boolean;
  liquidity: string;
  liquidityChange: number;
}

const DAYS_BACK = 7; // how many days of history we want on the chart

const LiquidityChart: React.FC<LiquidityChartProps> = ({
  isLoading,
  liquidity,
  liquidityChange,
}) => {
  const [historical, setHistorical] = useState<HistoricalEntry[]>([]);

  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      try {
        const today = new Date();

        /**
         * Moralis doesn’t yet expose a bulk‐historic–reserves endpoint, so
         * we fire one lightweight request per day and stitch the results
         * together. Each call returns the reserves **at the closing block**
         * of that date, which is perfect for a daily chart.
         */
        const requests = Array.from({ length: DAYS_BACK }, (_, i) => {
          const day = subDays(today, DAYS_BACK - i - 1);
          const url = `https://deep-index.moralis.io/api/v2.2/pairs/${
            import.meta.env.VITE_PulseX_MORE_WPLS_LP_ADDRESS
          }/reserves?chain=pulse&to_date=${day.toISOString()}`;

          return fetch(url, {
            headers: {
              accept: 'application/json',
              'X-API-Key': import.meta.env.VITE_MORALIS_API_KEY,
            },
            signal: controller.signal,
          }).then((r) => r.json());
        });

        const raw = await Promise.all(requests);

        const cleaned: HistoricalEntry[] = raw
          .filter((d) => d && d.reserve1) // ignore failed responses
          .map((d, idx) => ({
            timestamp: subDays(today, DAYS_BACK - idx - 1).getTime(),
            // Moralis returns reserves in wei, so convert to whole‐unit PLS
            reserve1: parseFloat(d.reserve1) / 1e18,
          }));

        setHistorical(cleaned);
      } catch (err) {
        if ((err as any)?.name !== 'AbortError') {
          console.error('Error fetching historical liquidity', err);
        }
      }

      // eslint-disable-next-line react-hooks/exhaustive-deps
    })();

    return () => controller.abort();
  }, []);

  if (isLoading || !historical.length) {
    return <div className="h-[200px] animate-pulse bg-black/40 rounded-lg" />;
  }

  const chartData = {
    labels: historical.map((p) => format(p.timestamp, 'MMM dd')),
    datasets: [
      {
        label: 'Buy‑Side PLS Liquidity',
        data: historical.map((p) => p.reserve1),
        fill: true,
        borderColor: '#00FF7F',
        backgroundColor: 'rgba(0,255,127,0.10)',
        tension: 0.4,
        pointRadius: 2,
        pointBackgroundColor: '#00FF7F',
        pointBorderColor: '#00FF7F',
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        padding: 12,
        displayColors: false,
        callbacks: {
          label: (ctx: any) =>
            `Buy‑Side PLS: ${ctx.parsed.y.toLocaleString()} PLS`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false, drawBorder: false },
        ticks: { color: '#AAA', font: { size: 10 } },
      },
      y: {
        grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false },
        ticks: {
          color: '#AAA',
          font: { size: 10 },
          callback: (v: number) => `${v.toLocaleString()} PLS`,
        },
      },
    },
  } as const;

  return (
    <div className="h-[200px] w-full">
      <Line data={chartData} options={options} />
    </div>
  );
};

export default LiquidityChart;
