import Moralis from "moralis";

export const getTokenPrice = async() => {
  try {
    const response = await Moralis.EvmApi.token.getTokenPrice({
      chain: 369,
      address: import.meta.env.VITE_TOKEN_ADDRESS,
    });

    return response.raw;
  } catch (error) {
    console.error("Error fetching token price:", error);
    throw error;
  }
};

export const getTokenVolumeAndLiquidity = async () => {
  try {
    // Get PulseX LP data for MORE/PLS pair
    const response = await fetch(
      `https://deep-index.moralis.io/api/v2.2/pairs/${import.meta.env.VITE_PulseX_MORE_WPLS_LP_ADDRESS}/reserves?chain=pulse`,
      {
        headers: {
          accept: "application/json",
          "X-API-Key": import.meta.env.VITE_MORALIS_API_KEY,
        },
      }
    );
    
    const result = await response.json();
    
    // Get volume data
    const volumeResponse = await fetch(
      `https://deep-index.moralis.io/api/v2.2/pairs/${import.meta.env.VITE_PulseX_MORE_WPLS_LP_ADDRESS}/volume?chain=pulse`,
      {
        headers: {
          accept: "application/json",
          "X-API-Key": import.meta.env.VITE_MORALIS_API_KEY,
        },
      }
    );
    
    const volumeData = await volumeResponse.json();
    
    // Return array with [buyLiquidity, volume]
    return [
      result.reserve1, // PLS (buy-side) liquidity
      volumeData.volume24h || "0"
    ];
  } catch (error) {
    console.error("Error fetching token analytics:", error);
    throw error;
  }
};

export const getLiquidityChange = async () => {
  try {
    const options = {
      method: "GET",
      headers: {
        accept: "application/json",
        "X-API-Key": import.meta.env.VITE_MORALIS_API_KEY,
      },
    };
    
    // Get historical reserves data
    const now = Math.floor(Date.now() / 1000);
    const oneDayAgo = now - 86400;
    
    const response = await fetch(
      `https://deep-index.moralis.io/api/v2.2/pairs/${import.meta.env.VITE_PulseX_MORE_WPLS_LP_ADDRESS}/reserves/historic?chain=pulse&from_date=${oneDayAgo}&to_date=${now}`,
      options
    );
    
    const result = await response.json();
    
    if (result.length >= 2) {
      const oldReserve = parseFloat(result[0].reserve1);
      const newReserve = parseFloat(result[result.length - 1].reserve1);
      return ((newReserve - oldReserve) / oldReserve) * 100;
    }
    
    return 0;
  } catch (error) {
    console.error("Error fetching token liquidity change:", error);
    throw error;
  }
};

export const getMarketCap = async () => {
  try {
    const response = await Moralis.EvmApi.token.getTokenMetadata({
      chain: 369,
      addresses: [import.meta.env.VITE_TOKEN_ADDRESS],
    });
    return parseFloat(response.raw[0].market_cap);
  } catch (error) {
    console.error("Error fetching token metadata:", error);
    throw error;
  }
};

export const getRecentTransfers = async () => {
  try {
    const response = await Moralis.EvmApi.token.getTokenTransfers({
      chain: 369,
      limit: 5,
      order: "DESC",
      address: import.meta.env.VITE_TOKEN_ADDRESS,
    });

    return response.raw;
  } catch (error) {
    console.error("Error fetching token transfers:", error);
    throw error;
  }
};

export const getTokenHolders = async () => {
  try {
    const response = await Moralis.EvmApi.token.getTokenOwners({
      chain: 369,
      limit: 10,
      order: "DESC",
      tokenAddress: import.meta.env.VITE_TOKEN_ADDRESS,
    });
    return response.json.result;
  } catch (error) {
    console.error("Error fetching token holders:", error);
    throw error;
  }
};

export const getHoldersCount = async () => {
  try {
    const options = {
      method: 'GET',
      headers: {
        accept: 'application/json',
        'X-API-Key': import.meta.env.VITE_MORALIS_API_KEY
      },
    };
  
    const response = await fetch(`https://deep-index.moralis.io/api/v2.2/erc20/${import.meta.env.VITE_TOKEN_ADDRESS}/holders?chain=pulse`, options)
    const result = await response.json()
    return result.totalHolders
  } catch (error) {
    console.error("Error fetching token holders:", error);
    throw error;
  }
};

export const getBurnData = async () => {
  try {
    const response = await Moralis.EvmApi.token.getWalletTokenBalances({
      chain: 369,
      tokenAddresses: [import.meta.env.VITE_TOKEN_ADDRESS],
      address: import.meta.env.VITE_BURN_ADDRESS,
    });
    return response.raw[0];
  } catch (error) {
    console.error("Error fetching token burns:", error);
    throw error;
  }
};

export const getWpslPrice = async () => {
  try {
    const response = await Moralis.EvmApi.token.getTokenPrice({
      chain: 369,
      address: import.meta.env.VITE_WPSL_ADDRESS,
    });
 
    return response.raw.usdPrice;
  } catch (error) {
    console.error("Error fetching token price:", error);
    throw error;
  }
};

export const getBalance = async (address:string) => {
  try {
    try {
      await Moralis.start({
        apiKey: import.meta.env.VITE_MORALIS_API_KEY,
      });
    } catch (error) {
      console.log("")
    }
    const response = await Moralis.EvmApi.wallets.getWalletTokenBalancesPrice({
      chain: 369,
      address: address,
    });
    
    return response.result[0].balanceFormatted;
  } catch (error) {
    console.error("Error fetching token price:", error);
    throw error;
  }
};

export const getMoreBalance = async (address:string) => {
  try {
    try {
      await Moralis.start({
        apiKey: import.meta.env.VITE_MORALIS_API_KEY,
      });
    } catch {
      console.log("")
    }

    const response = await Moralis.EvmApi.token.getWalletTokenBalances({
      "chain": 369,
      "tokenAddresses": [
        import.meta.env.VITE_TOKEN_ADDRESS
      ],
      "address": address
    });

    return response.raw[0].balance;
  } catch (e) {
    console.error(e);
  }
};