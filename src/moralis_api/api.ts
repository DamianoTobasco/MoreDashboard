import Moralis from "moralis";


let moralisInitialized = false;

export const getTokenPrice = async() => {
  try {
    if (!moralisInitialized) {
      await Moralis.start({
        apiKey: import.meta.env.VITE_MORALIS_API_KEY,
      });
      moralisInitialized = true
    }
    const response = await Moralis.EvmApi.token.getTokenPrice({
      chain: 369,
      address: import.meta.env.VITE_TOKEN_ADDRESS,
    });
    // console.log(response.raw.usdPrice);
    return response.raw.usdPrice;
  } catch (error) {
    console.error("Error fetching token price:", error);
    throw error;
  }
  
};

export const getTokenVolumeAndLiquidity = async () => {
  try {
    const options = {
    method: "GET",
    headers: {
      accept: "application/json",
      "X-API-Key":
        import.meta.env.VITE_MORALIS_API_KEY,
    },
  };

  const response = await fetch(
    `https://deep-index.moralis.io/api/v2.2/tokens/0x88dF7BEdc5969371A2C9A74690cBB3668061E1E9/analytics?chain=pulse`,
    options
  );
  const result = await response.json();
  let volumeAndLiquidity = []
  volumeAndLiquidity.push(result?.totalLiquidityUsd)
  volumeAndLiquidity.push(result?.totalSellVolume["24h"] + result?.totalBuyVolume["24h"])
  return volumeAndLiquidity
  } catch (error) {
    console.error("Error fetching token analytics:", error);
    throw error;
  }
};

export const getMarketCap = async () => {
  try {
    if (!moralisInitialized) {
      await Moralis.start({
        apiKey: import.meta.env.VITE_MORALIS_API_KEY,
      });
      moralisInitialized = true
    }

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
    if (!moralisInitialized) {
      await Moralis.start({
        apiKey: import.meta.env.VITE_MORALIS_API_KEY,
      });
      moralisInitialized = true
    }

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
    if (!moralisInitialized) {
      await Moralis.start({
        apiKey: import.meta.env.VITE_MORALIS_API_KEY,
      });
      moralisInitialized = true
    }

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
}


export const getBurnData = async () => {
  try {
    if (!moralisInitialized) {
      await Moralis.start({
        apiKey: import.meta.env.VITE_MORALIS_API_KEY,
      });
      moralisInitialized = true
    }

    const response = await Moralis.EvmApi.token.getWalletTokenBalances({
      chain: 369,
      tokenAddresses: [import.meta.env.VITE_TOKEN_ADDRESS],
      address: import.meta.env.VITE_DEAD_ADDRESS,
    });
    return response.raw[0];
  } catch (error) {
    console.error("Error fetching token burns:", error);
    throw error;
  }
}
