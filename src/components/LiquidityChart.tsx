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
import { formatCurrency } from '../utils/formatters';

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

interface LiquidityChartProps {
  isLoading: boolean;
  liquidity: string;
  liquidityChange: number;
}

const LiquidityChart: React.FC<LiquidityChartProps> = ({ 
  isLoading, 
  liquidity,
  liquidityChange 
}) => {
  const [historicalData, setHistoricalData] = useState<any[]>([]);

  useEffect(() => {
    const fetchHistoricalData = async () => {
      try {
        const now = Math.floor(Date.now() / 1000);
        const sevenDaysAgo = now - (7 * 86400);
        
        const response = await fetch(
          `https://deep-index.moralis.io/api/v2.2/pairs/${import.meta.env.VITE_PulseX_MORE_WPLS_LP_ADDRESS}/reserves/historic?chain=pulse&from_date=${sevenDaysAgo}&to_date=${now}`,
          {
            headers: {
              accept: "application/json",
              "X-API-Key": import.meta.env.VITE_MORALIS_API_KEY,
            },
          }
        );
        
        const result = await response.json();
        setHistoricalData(result);
      } catch (error) {
        console.error("Error fetching historical liquidity:", error);
      }
    };

    fetchHistoricalData();
  }, []);

  const data = {
    labels: historicalData.map(d => format(new Date(d.timestamp), 'MMM dd')),
    datasets: [
      {
        fill: true,
        label: 'Buy-Side PLS Liquidity',
        data: historicalData.map(d => parseFloat(d.reserve1)),
        borderColor: '#0DFF00',
        backgroundColor: 'rgba(13, 255, 0, 0.1)',
        tension: 0.4,
        pointRadius: 2,
        pointBackgroundColor: '#0DFF00',
        pointBorderColor: '#0DFF00',
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        padding: 12,
        displayColors: false,
        callbacks: {
          label: (context: any) => {
            return `Buy-Side PLS: ${context.parsed.y.toLocaleString()} PLS`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
          drawBorder: false,
        },
        ticks: {
          color: '#666',
          font: {
            size: 10,
          },
        },
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
          drawBorder: false,
        },
        ticks: {
          color: '#666',
          font: {
            size: 10,
          },
          callback: (value: number) => `${value.toLocaleString()} PLS`,
        },
      },
    },
  };

  if (isLoading || historicalData.length === 0) {
    return (
      <div className="h-[200px] animate-pulse bg-black/40 rounded-lg"></div>
    );
  }

  return (
    <div className="h-[200px] w-full">
      <Line data={data} options={options} />
    </div>
  );
};

export default LiquidityChart;