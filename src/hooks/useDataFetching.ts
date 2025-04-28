import { useState, useEffect, useCallback } from 'react';
import { DashboardData, DataSourceTimestamps, TokenHolder } from '../types';
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

// RPC configurations
const PULSECHAIN_RPC = 'https://rpc.pulsechain.com';
const TOKEN_ADDRESS = '0x88dF7BEdc5969371A2C9A74690cBB3668061E1E9';
const BURN_ADDRESS = '0x000000000000000000000000000000000000dEaD';

// Polling intervals (in milliseconds)
const INTERVALS = {
  PRICE: 60000,       // 1 minute
  MARKET_DATA: 60000, // 1 minute
  TRANSFERS: 60000,   // 1 minute
  HOLDERS: 300000,    // 5 minutes
  BURN_INFO: 300000,  // 5 minutes
  META: 3600000       // 1 hour
};

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

  // Fetch burn data from blockchain
  const fetchBurnData = useCallback(async () => {
    try {
      const burnedRawParams = {
        to: TOKEN_ADDRESS,
        data: `0x70a08231000000000000000000000000${BURN_ADDRESS.substring(2).padStart(40, '0')}`
      };
      
      const supplyRawParams = {
        to: TOKEN_ADDRESS,
        data: "0x18160ddd"
      };
      
      // Simulate RPC calls with mock data
      const burnedRawResponse = { 
        result: '0x' + BigInt(mockBurnedAmount).toString(16)
      };
      const supplyRawResponse = { 
        result: '0x' + BigInt(mockSupply).toString(16) 
      };
      
      const burnedRaw = burnedRawResponse.result;
      const supplyRaw = supplyRawResponse.result;
      
      const burnPct = ((parseInt(burnedRaw, 16) / parseInt(supplyRaw, 16)) * 100).toFixed(1);
      const burnedAmount = parseInt(burnedRaw, 16).toString();
      const totalSupply = parseInt(supplyRaw, 16).toString();
      
      return { 
        burnAddress: BURN_ADDRESS,
        burnedAmount,
        totalSupply,
        burnPct
      };
    } catch (error) {
      console.error('Error fetching burn data:', error);
      return { 
        burnAddress: mockBurnAddress,
        burnedAmount: mockBurnedAmount,
        burnPct: "90.0"
      };
    }
  }, []);

  // Fetch price data
  const fetchPriceData = useCallback(async () => {
    try {
      // Simulate price variations
      const variation = (Math.random() - 0.5) * 0.0000001;
      const updatedPrice = mockPrice + variation;
      
      // Calculate market cap
      const totalTokens = parseFloat(data.supply) / 10 ** 18;
      const marketCap = totalTokens * updatedPrice;
      
      setData(prev => ({ 
        ...prev, 
        price: updatedPrice,
        marketCap
      }));
      setRefreshTimestamps(prev => ({ ...prev, price: Date.now() }));
    } catch (error) {
      console.error('Error fetching price:', error);
    }
  }, [data.supply]);

  // Fetch market data
  const fetchMarketData = useCallback(async () => {
    try {
      const now = Date.now();
      setRefreshTimestamps(prev => ({ 
        ...prev, 
        holders: now,
        transfers: now
      }));
      
      // Update holders count with small random increases
      const holderIncrease = Math.floor(Math.random() * 3);
      setData(prev => ({ 
        ...prev,
        holders: prev.holders + holderIncrease,
        transfers: mockTransfers
      }));
    } catch (error) {
      console.error('Error fetching market data:', error);
    }
  }, []);

  // Initialize data and set up polling
  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);
        const burnData = await fetchBurnData();
        const totalTokens = parseFloat(mockSupply) / 10 ** 18;
        const initialMarketCap = totalTokens * mockPrice;
        
        setData({
          meta: mockMeta,
          supply: mockSupply,
          price: mockPrice,
          holders: mockHolders,
          transfers: mockTransfers,
          candles: mockCandles,
          marketCap: initialMarketCap,
          tokenHolders: [],
          burnAddress: burnData.burnAddress,
          burnedAmount: burnData.burnedAmount,
          burnPct: burnData.burnPct
        });
        
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
    const priceInterval = setInterval(fetchPriceData, INTERVALS.PRICE);
    const marketDataInterval = setInterval(fetchMarketData, INTERVALS.MARKET_DATA);
    const burnInfoInterval = setInterval(fetchBurnData, INTERVALS.BURN_INFO);

    return () => {
      clearInterval(priceInterval);
      clearInterval(marketDataInterval);
      clearInterval(burnInfoInterval);
    };
  }, [fetchBurnData, fetchPriceData, fetchMarketData]);

  return {
    data,
    loading,
    error,
    refreshTimestamps,
    refreshData: fetchPriceData
  };
};

export default useDashboardData;