import { useState, useEffect, useCallback } from 'react';
import { DashboardData, DataSourceTimestamps, TokenHolder } from '../types';
import { getMarketCap, getTokenPrice, getRecentTransfers, getTokenHolders, getHoldersCount, getBurnData } from '../moralis_api/api';


import { 
  mockMeta, 
  mockSupply, 
  mockPrice, 
  mockHolders, 
  mockTransfers, 
  mockCandles, 
  mockMarketCap,
  mockBurnAddress,
  mockBurnedAmount
} from '../utils/mockData';
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
    burnPct: "0"
  });
  const[moralisInitialized, setMoralisInitialized] = useState<boolean>(false);
  useEffect(() => {
    handleMoralisStart();
  }, [])
  
  const handleMoralisStart = async () => {
    if (!moralisInitialized) {
    await Moralis.start({
      apiKey: import.meta.env.VITE_MORALIS_API_KEY,
    });
    setMoralisInitialized(true)
  }}
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
    burnInfo: 0
  });

//   // Fetch burn data from blockchain
//   const fetchBurnData = useCallback(async () => {
//     try {
//       // const burnedRawParams = {
//       //   to: TOKEN_ADDRESS,
//       //   data: `0x70a08231000000000000000000000000${BURN_ADDRESS.substring(2).padStart(40, '0')}`
//       // };
      
//       // const supplyRawParams = {
//       //   to: TOKEN_ADDRESS,
//       //   data: "0x18160ddd"
//       // };
      
//       // Simulate RPC calls with mock data
//       const burnData = await getBurnData();
//       const burnedRawResponse = { 
//         result: '0x' + BigInt(burnData.balance).toString(16)
//       };
//       const supplyRawResponse = { 
//         result: '0x' + BigInt(burnData.total_supply).toString(16) 
//       };
      
//       const burnedRaw = burnedRawResponse.result;
//       const supplyRaw = supplyRawResponse.result;
      
//       const burnPct = ((parseInt(burnedRaw, 16) / parseInt(supplyRaw, 16)) * 100).toFixed(1);
//       const burnedAmount = parseInt(burnedRaw, 16).toString();
//       const totalSupply = parseInt(supplyRaw, 16).toString();
      
//       return { 
//         burnAddress: BURN_ADDRESS,
//         burnedAmount,
//         totalSupply,
//         burnPct
//       };
//     } catch (error) {
//       console.error('Error fetching burn data:', error);
//       return { 
//         burnAddress: mockBurnAddress,
//         burnedAmount: mockBurnedAmount,
//         burnPct: "90.0"
//       };
//     }
//   }, []);

//   // Fetch price data
//   const fetchPriceData = useCallback(async () => {
//     try {
//       const updatedPrice = await getTokenPrice();
//       const marketCap = await getMarketCap();
//       const recentTransfers = await getRecentTransfers();
      
//       // Transform the Moralis transfer data to match TokenTransfer type
//       const formattedTransfers = recentTransfers.result.map(transfer => ({
//         blockNumber: transfer.block_number,
//         timeStamp: `${Math.floor(new Date(transfer.block_timestamp).getTime() / 1000)}`,
//         hash: transfer.transaction_hash,
//         from: transfer.from_address,
//         to: transfer.to_address,
//         value: transfer.value,
//         tokenName: transfer.token_name,
//         tokenSymbol: transfer.token_symbol,
//         tokenDecimal: transfer.token_decimals,
//         contractAddress: TOKEN_ADDRESS // Add missing required field
//       }));

//       setData(prev => ({ 
//         ...prev, 
//         price: updatedPrice,
//         marketCap,
//         transfers: formattedTransfers,
//       }));
//       setRefreshTimestamps(prev => ({ ...prev, price: Date.now() }));
//     } catch (error) {
//       console.error('Error fetching price:', error);
//     }
//   }, [data.supply]);

//   // Fetch market data
//   const fetchMarketData = useCallback(async () => {
//     try {
//       const now = Date.now();
//       setRefreshTimestamps(prev => ({ 
//         ...prev, 
//         holders: now,
//         // transfers: now
//       }));
      
//       // Update holders count with small random increases
//       // const holderIncrease = Math.floor(Math.random() * 3);

//       const topTokenHolders = await getTokenHolders();
//       const formattedHolders = topTokenHolders.map(holder => ({
//         address: holder.owner_address,
//         balance: holder.balance_formatted,
//         percentage: holder.percentage_relative_to_total_supply,
//         tag: "testing"
//       }));

//       const holdersCount = await getHoldersCount();

      
//       setData(prev => ({ 
//         ...prev,
//         holders: holdersCount,
//         tokenHolders: formattedHolders,
        
//       }));
//     } catch (error) {
//       console.error('Error fetching market data:', error);
//     }
//   }, []);

  // Combine all fetch functions into one refresh function
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
        burnData
      ] = await Promise.all([
        getTokenPrice(),
        getMarketCap(),
        getRecentTransfers(),
        getTokenHolders(),
        getHoldersCount(),
        getBurnData()
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
        // candles: prev.candles  // Keep existing candles data
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
      //   setLoading(true);
      //   const burnData = await fetchBurnData();
      //   const totalTokens = parseFloat(mockSupply) / 10 ** 18;
      //   const initialMarketCap = totalTokens * mockPrice;
        
      //   setData({
      //     meta: mockMeta,
      //     supply: mockSupply,
      //     price: mockPrice,
      //     holders: mockHolders,
      //     transfers: mockTransfers,
      //     candles: mockCandles,
      //     marketCap: initialMarketCap,
      //     tokenHolders: [],
      //     burnAddress: burnData.burnAddress,
      //     burnedAmount: burnData.burnedAmount,
      //     burnPct: burnData.burnPct
      //   });
        
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

    // Set up polling intervals
    // const priceInterval = setInterval(fetchPriceData, INTERVALS.PRICE);
    // const marketDataInterval = setInterval(fetchMarketData, INTERVALS.MARKET_DATA);
    // const burnInfoInterval = setInterval(fetchBurnData, INTERVALS.BURN_INFO);

  //   return () => {
  //     clearInterval(priceInterval);
  //     clearInterval(marketDataInterval);
  //     clearInterval(burnInfoInterval);
  //   };
  }, [refreshAllData]);

  return {
    data,
    loading,
    error,
    refreshTimestamps,
    refreshData: refreshAllData
  };
};

export default useDashboardData;