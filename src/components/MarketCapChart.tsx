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
import { format, parseISO } from 'date-fns';
import { formatCurrency } from '../utils/formatters';
import { MarketCapData } from '../types';

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

interface MarketCapChartProps {
  isLoading: boolean;
  marketCap: number;
  marketCapHistory: MarketCapData[];
}

const MarketCapChart: React.FC<MarketCapChartProps> = ({ 
  isLoading, 
  marketCap,
  marketCapHistory = []
}) => {
  // If no historical data, generate mock data based on current market cap
  const chartData = marketCapHistory.length > 0 
    ? marketCapHistory 
    : generateMockData(marketCap);

  const data = {
    labels: chartData.map(d => format(parseISO(d.date), 'MMM dd')),
    datasets: [
      {
        fill: true,
        label: 'Market Cap',
        data: chartData.map(d => d.value),
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
            return `Market Cap: ${formatCurrency(context.parsed.y)}`;
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

  // Function to generate mock data if real data isn't available
  function generateMockData(currentMarketCap: number): MarketCapData[] {
    const data: MarketCapData[] = [];
    const baseMarketCap = currentMarketCap * 0.9; // Start with 90% of current market cap
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dailyMarketCap = baseMarketCap + (currentMarketCap - baseMarketCap) * ((7 - i) / 7);
      
      data.push({
        date: date.toISOString().split('T')[0],
        value: dailyMarketCap,
      });
    }
    
    return data;
  }

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

export default MarketCapChart;