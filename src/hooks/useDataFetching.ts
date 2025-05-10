import { useState, useEffect, useCallback } from 'react';
import { DashboardData, DataSourceTimestamps} from '../types';
import { getMarketCap, getTokenPrice, getRecentTransfers, getTokenHolders, getHoldersCount, getBurnData, getTokenVolumeAndLiquidity, getWpslPrice, getLiquidityChange, getBalance, getMoreBalance } from '../moralis_api/api';

import Moralis from 'moralis';

// RPC configurations
// const PULSECHAIN_RPC = 'https://rpc.pulsechain.com';
// const TOKEN_ADDRESS = '0x88dF7BEdc5969371A2C9A74690cBB3668061E1E9';
// const BURN_ADDRESS = '0x000000000000000000000000000000000000dEaD';

// // Polling intervals (in milliseconds)
// const INTERVALS = {
//   PRICE: 10000,       // 1 minute
//   MARKET_DATA: 10000, // 1 minute
//   TRANSFERS: 60000,   // 1 minute
//   HOLDERS: 300000,    // 5 minutes
//   BURN_INFO: 300000,  // 5 minutes
//   META: 3600000       // 1 hour
// };

const useDashboardData = () => {
  const [data, setData] = useState<DashboardData>({
    meta: null,
    supply: "0",
    price: 0,
    holders: 0,
    transfers: [],
    candles: [],
    marketCap: 0,
    tokenHolders: [],
    burnAddress: "",
    burnedAmount: "0",
    burnPct: "0",
    volume: "0",
    liquidity: "0",
    plsPrice: 0,
    liquidityChange: 0
  });

  const [balanceData, setBalanceData] = useState({
    balance: "0",
    moreBalance: "0"
  });
  const[moralisInitialized, setMoralisInitialized] = useState<boolean>(false);
  useEffect(() => {
    handleMoralisStart();
  }, [])
  
  const handleMoralisStart = async () => {
    if (!moralisInitialized) {
      try { 
        await Moralis.start({
          apiKey: import.meta.env.VITE_MORALIS_API_KEY,
        });
        setMoralisInitialized(true)
      } catch{
        // return
      }
    }
  }
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTimestamps, setRefreshTimestamps] = useState<DataSourceTimestamps>({
    meta: 0,
    supply: 0,
    price: 0,
    holders: 0,
    transfers: 0,
    candles: 0,
    tokenHolders: 0,
    burnInfo: 0,
    volume: 0,
    liquidity: 0,
    plsPrice: 0
  });

  const refreshBalanceData = useCallback(async (address:string) => {
    setLoading(true);
    try {
      const [balance, moreBalance] = await Promise.all([getBalance(address), getMoreBalance(address)])
      setBalanceData({
        balance: balance,
        moreBalance: moreBalance || "0" 
      })
      
    } catch (error) {
      console.error('Error refreshing balance data:', error);
    }
    finally{
      setLoading(false);
    }
    
  }, []);
  const refreshAllData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel, excluding candles data
      const [
        priceData,
        marketCapData,
        transfersData,
        holdersData,
        holdersCountData,
        burnData,
        volumeAndLiquidityData,
        plsPriceData,
        liquidityChange
      ] = await Promise.all([
        getTokenPrice(),
        getMarketCap(),
        getRecentTransfers(),
        getTokenHolders(),
        getHoldersCount(),
        getBurnData(),
        getTokenVolumeAndLiquidity(),
        getWpslPrice(),
        getLiquidityChange()
      ]);

      // Transform transfers data
      const formattedTransfers = transfersData.result.map(transfer => ({
        blockNumber: transfer.block_number,
        timeStamp: `${Math.floor(new Date(transfer.block_timestamp).getTime() / 1000)}`,
        hash: transfer.transaction_hash,
        from: transfer.from_address,
        to: transfer.to_address,
        value: transfer.value,
        tokenName: transfer.token_name,
        tokenSymbol: transfer.token_symbol,
        tokenDecimal: transfer.token_decimals,
        contractAddress: import.meta.env.VITE_TOKEN_ADDRESS
      }));

      // Format holders data
      const formattedHolders = holdersData.map(holder => ({
        address: holder.owner_address,
        balance: holder.balance_formatted,
        percentage: holder.percentage_relative_to_total_supply,
        tag: ""
      }));

      // Calculate burn percentage
      // const burnPct = ((parseInt(burnData.balance, 16) / parseInt(burnData.total_supply, 16)) * 100).toFixed(1);
      const burnPct = (burnData.balance / burnData.total_supply) * 100;
   
      // Update all data at once, preserving existing candles data
      setData(prev => ({
        ...prev,
        price: priceData,
        marketCap: marketCapData,
        transfers: formattedTransfers,
        holders: holdersCountData,
        tokenHolders: formattedHolders,
        burnedAmount: burnData.balance,
        supply:burnData.total_supply,
        burnPct,
        volume: volumeAndLiquidityData[1],
        liquidity: volumeAndLiquidityData[0],
        plsPrice: plsPriceData,
        liquidityChange: liquidityChange
      }));

      // Update timestamps except for candles
      const now = Date.now();
      setRefreshTimestamps(prev => ({
        ...prev,
        price: now,
        market: now,
        transfers: now,
        holders: now,
        burnInfo: now,
        // candles: prev.candles  // Keep existing candles timestamp
      }));

    } catch (error) {
      console.error('Error refreshing data:', error);
      setError('Failed to refresh data');
    } finally {
      setLoading(false);
    }
  }, []);

  // // Initialize data and set up polling
  useEffect(() => {
    const initializeData = async () => {
      try {   
        const now = Date.now();
        setRefreshTimestamps({
          meta: now,
          supply: now,
          price: now,
          holders: now,
          transfers: now,
          candles: now,
          tokenHolders: now,
          burnInfo: now
        });
        
        setLoading(false);
      } catch (error) {
        console.error('Error initializing data:', error);
        setLoading(false);
      }
    };

    initializeData();
  }, [refreshAllData, refreshBalanceData]);

  return {
    data,
    loading,
    error,
    balanceData,
    refreshTimestamps,
    refreshBalanceData,
    refreshData: refreshAllData
  };
};

export default useDashboardData;