import React from 'react';
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
  const generateChartData = () => {
    const data = [];
    const currentLiquidity = parseFloat(liquidity);
    const startLiquidity = currentLiquidity / (1 + (liquidityChange / 100));
    
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const progressionFactor = (7 - i) / 7;
      const dailyLiquidity = startLiquidity + ((currentLiquidity - startLiquidity) * progressionFactor);
      
      data.push({
        date: format(date, 'MMM dd'),
        liquidity: dailyLiquidity,
      });
    }
    return data;
  };

  const chartData = generateChartData();

  const data = {
    labels: chartData.map(d => d.date),
    datasets: [
      {
        fill: true,
        label: 'Buy-Side PLS Liquidity',
        data: chartData.map(d => d.liquidity),
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
            return `Buy-Side Liquidity: ${formatCurrency(context.parsed.y)}`;
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
          callback: (value: number) => formatCurrency(value),
        },
      },
    },
  };

  if (isLoading) {
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