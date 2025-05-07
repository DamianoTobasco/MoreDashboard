import React, { useEffect } from "react";
import { Users, BarChart3, DollarSign } from "lucide-react";
import GlassPanel from "./ui/GlassPanel";
import KpiCard from "./ui/KpiCard";
import PriceChart from "./PriceChart";
import TransfersTable from "./TransfersTable";
// import TokenInfo from "./TokenInfo";
import TokenHolders from "./TokenHolders";
import TradingModule from "./TradingModule";
import BurnInfo from "./BurnInfo";
import WalletConnect from "./WalletConnect";
import useDashboardData from "../hooks/useDataFetching";
import { formatCurrency, formatLargeNumber } from "../utils/formatters";
// import { ButtonColorful } from "./ui/button-colorful";
import { ShinyText } from "./ui/shiny-text";

const Dashboard: React.FC = () => {
  const { data, loading, refreshTimestamps, refreshData } = useDashboardData();
  useEffect(() => {
    handleRefresh();
  }, []);
  const handleRefresh = async () => {
    await refreshData();
  };

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
        <div className="flex items-center">
          <div>
            <h1 className="text-3xl font-bold mb-1 relative">
              <span className="relative">
                <ShinyText
                  text="MORE DASHBOARD"
                  color="#0DFF00"
                  speed={3}
                  className="font-bold text-3xl"
                />
                <span className="absolute inset-0 -z-10 bg-custom-green/10 blur-xl"></span>
              </span>
              <span className="absolute -inset-1 -z-20 rounded-lg bg-gradient-to-r from-custom-green/20 via-custom-green/5 to-custom-green/20 blur-xl opacity-50 animate-shimmer"></span>
            </h1>
            <p className="text-gray-400 text-sm">
              Real-time metrics and transactions on PulseChain
            </p>
          </div>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center gap-4">
          <WalletConnect />
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-custom-green/10 border border-custom-green/20 text-custom-green">
            <span className="animate-pulse mr-2 w-2 h-2 rounded-full bg-custom-green"></span>
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="refresh-button"
            >
              {loading ? "Refreshing..." : "Refresh Data"}
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 mb-6">
        <KpiCard
          title="Current Price"
          value={formatCurrency(data.price)}
          change={{ value: 2.4, isPositive: true }}
          updated={refreshTimestamps.price}
          isLoading={loading}
          icon={<DollarSign size={18} />}
        />
        <KpiCard
          title="Market Cap"
          value={formatCurrency(data.marketCap)}
          change={{ value: 3.2, isPositive: true }}
          updated={refreshTimestamps.supply}
          isLoading={loading}
          icon={<BarChart3 size={18} />}
        />
        <KpiCard
          title="Holders"
          value={formatLargeNumber(data.holders)}
          change={{ value: 0.8, isPositive: true }}
          updated={refreshTimestamps.holders}
          isLoading={loading}
          icon={<Users size={18} />}
        />
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {/* Chart and Trading Info */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-9">
            <GlassPanel title="24h Price Chart">
              <PriceChart data={data.candles} isLoading={false} />
            </GlassPanel>
          </div>

          <div className="lg:col-span-3">
            <GlassPanel
              title="Trade MORE Token"
              className="bg-black/80 hover:border-custom-green/40"
            >
              <TradingModule
                tokenSymbol="MORE"
                tokenAddress="0x88dF7BEdc5969371A2C9A74690cBB3668061E1E9"
                currentPrice={data.price}
                isLoading={loading}
              />
            </GlassPanel>
          </div>
        </div>

        {/* Burn Info */}
        <GlassPanel
          title="Token Burn Statistics"
          className="bg-gradient-to-br from-black/70 to-red-950/30 hover:border-red-500/30"
        >
          <BurnInfo
            burnAddress={data.burnAddress || ""}
            burnedAmount={data.burnedAmount || "0"}
            totalSupply={data.supply}
            isLoading={loading}
            burnPct={data.burnPct}
          />
        </GlassPanel>

        {/* Token Info and Market Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8">
            <GlassPanel title="Recent Transfers">
              <TransfersTable transfers={data.transfers} isLoading={loading} />
            </GlassPanel>
          </div>

          <div className="lg:col-span-4">
            <GlassPanel title="Market Activity" className="h-full">
              {loading ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-16 bg-black/40 rounded"></div>
                  <div className="h-20 bg-black/40 rounded"></div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="border-r border-gray-800 pr-4">
                      <h3 className="text-sm text-gray-400 mb-2">24h Volume</h3>
                      <div className="bg-gradient-to-r from-custom-green/20 to-transparent p-2 rounded-lg">
                        <p className="text-xl font-bold text-white">
                          {formatCurrency(4237.65)}
                        </p>
                        <div className="flex items-center mt-1">
                          <span className="text-xs bg-custom-green/20 text-custom-green px-2 py-0.5 rounded-full">
                            +12.4%
                          </span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm text-gray-400 mb-2">Liquidity</h3>
                      <div className="bg-gradient-to-r from-custom-green/20 to-transparent p-2 rounded-lg">
                        <p className="text-xl font-bold text-white">
                          {formatCurrency(35620.42)}
                        </p>
                        <div className="flex items-center mt-1">
                          <span className="text-xs bg-custom-green/20 text-custom-green px-2 py-0.5 rounded-full">
                            +0.8%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <h3 className="text-sm text-gray-400 mb-3 flex items-center">
                      <span className="inline-block w-1 h-4 bg-custom-green rounded mr-2"></span>
                      Price Statistics
                    </h3>
                    <div className="bg-black/30 p-3 rounded-lg border border-gray-800/30">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-gray-400 mb-1">
                            All-Time High
                          </p>
                          <p className="text-sm text-white font-semibold">
                            {formatCurrency(0.0000348)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 mb-1">
                            All-Time Low
                          </p>
                          <p className="text-sm text-white font-semibold">
                            {formatCurrency(0.0000168)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </GlassPanel>
          </div>
        </div>

        {/* Token Holders - Full Width */}
        <GlassPanel title="Top Token Holders">
          <TokenHolders isLoading={loading} tokenHolders={data.tokenHolders} />
        </GlassPanel>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-gray-500 text-xs">
        <p>
          Data provided by PulseChain and Moralis APIs. Updated in real-time.
        </p>
        <p className="mt-1">
          © 2025 MORE Token Dashboard. All prices shown in USD.
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
