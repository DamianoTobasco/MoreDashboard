import React, { useState, useEffect, useCallback } from 'react';
import { useAccount, useBalance, usePublicClient, useSwitchChain, useWriteContract } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { ExternalLink, ArrowDownUp, Info, Settings, ChevronDown, AlertCircle, Check, Wallet, RefreshCw } from 'lucide-react';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { pulsechain } from 'viem/chains';
import { PULSEX_ROUTER, ROUTER_ABI, WPLS_ADDRESS } from '../lib/contracts';

interface TradingModuleProps {
  tokenSymbol: string;
  tokenAddress: string;
  currentPrice: number;
  isLoading: boolean;
}

const TradingModule: React.FC<TradingModuleProps> = ({ 
  tokenSymbol, 
  tokenAddress, 
  currentPrice,
  isLoading 
}) => {
  const [fromAmount, setFromAmount] = useState<string>('');
  const [toAmount, setToAmount] = useState<string>('');
  const [slippage, setSlippage] = useState<string>('0.5');
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [swapStatus, setSwapStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const { address, isConnected, chain } = useAccount();
  const { data: ethBalance, isLoading: balanceLoading } = useBalance({
    address,
    watch: true,
  });
  const { open } = useWeb3Modal();
  const publicClient = usePublicClient();
  const { switchChain } = useSwitchChain();
  const { writeContractAsync, isPending } = useWriteContract();
  
  const isPulseChain = chain?.id === pulsechain.id;

  // Reset swap status when amounts change
  useEffect(() => {
    if (swapStatus !== 'idle') {
      setSwapStatus('idle');
      setErrorMessage(null);
      setTxHash(null);
    }
  }, [fromAmount, toAmount]);

  // Calculate the conversion
  const handleFromAmountChange = (value: string) => {
    setFromAmount(value);
    if (value && !isNaN(parseFloat(value))) {
      // Estimated conversion
      const estimatedOutput = parseFloat(value) / currentPrice;
      setToAmount(estimatedOutput.toLocaleString(undefined, { maximumFractionDigits: 2 }));
    } else {
      setToAmount('');
    }
  };

  const handleToAmountChange = (value: string) => {
    setToAmount(value);
    if (value && !isNaN(parseFloat(value))) {
      // Estimated conversion
      const estimatedInput = parseFloat(value) * currentPrice;
      setFromAmount(estimatedInput.toLocaleString(undefined, { maximumFractionDigits: 6 }));
    } else {
      setFromAmount('');
    }
  };

  // Swap the tokens
  const handleSwap = () => {
    const fromTemp = fromAmount;
    const toTemp = toAmount;
    setFromAmount(toTemp);
    setToAmount(fromTemp);
  };

  // Initiate the swap on PulseX
  const initiateSwap = async () => {
    // Clear previous error
    setErrorMessage(null);
    setTxHash(null);
    
    // If not connected, open wallet modal
    if (!isConnected) {
      open();
      return;
    }
    
    // If connected but not on PulseChain, prompt to switch
    if (!isPulseChain) {
      try {
        setSwapStatus('pending');
        await switchChain({ chainId: pulsechain.id });
        setSwapStatus('idle');
      } catch (error) {
        setSwapStatus('error');
        setErrorMessage('Failed to switch to PulseChain network');
        return;
      }
      return;
    }
    
    // Validation
    if (!fromAmount || parseFloat(fromAmount) <= 0) {
      setSwapStatus('error');
      setErrorMessage('Please enter a valid amount');
      return;
    }

    if (!address) {
      setSwapStatus('error');
      setErrorMessage('Wallet address not found');
      return;
    }
    
    setSwapStatus('pending');
    
    try {
      // Calculate minimum output amount with slippage
      const slippagePercent = parseFloat(slippage) / 100;
      const amountIn = parseFloat(fromAmount);
      const expectedOut = amountIn / currentPrice;
      
      // Fix: Convert to string after truncating decimals to avoid scientific notation issues
      const minAmountOutValue = Math.floor(expectedOut * (1 - slippagePercent) * 1e18);
      const minAmountOut = minAmountOutValue.toString();
      
      // Set deadline to 20 minutes from now
      const deadline = Math.floor(Date.now() / 1000) + 20 * 60;
      
      // Execute swap
      const hash = await writeContractAsync({
        address: PULSEX_ROUTER,
        abi: ROUTER_ABI,
        functionName: 'swapExactETHForTokens',
        args: [
          BigInt(minAmountOut),
          [WPLS_ADDRESS, tokenAddress],
          address,
          BigInt(deadline)
        ],
        value: parseEther(fromAmount)
      });
      
      setTxHash(hash);
      setSwapStatus('success');
      
      // Clear form after successful swap
      setTimeout(() => {
        setFromAmount('');
        setToAmount('');
      }, 3000);
      
    } catch (error: any) {
      console.error('Swap error:', error);
      setSwapStatus('error');
      setErrorMessage(error.message?.includes('user rejected') 
        ? 'Transaction was rejected' 
        : 'Failed to execute swap. Try again or use PulseX directly.');
    }
  };

  useEffect(() => {
    // Close settings dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showSettings && !target.closest('.settings-panel')) {
        setShowSettings(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSettings]);

  return (
    <div className="p-1 relative">
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-white font-medium flex items-center">
          Quick Swap
          <span className="inline-flex items-center ml-2 px-2 py-0.5 rounded text-xs bg-green-500/20 text-green-400">
            via PulseX
          </span>
        </h3>
        <button 
          onClick={() => setShowSettings(!showSettings)} 
          className="p-1.5 rounded-lg hover:bg-black/50 transition settings-panel"
        >
          <Settings size={16} className="text-gray-400" />
        </button>
      </div>

      {showSettings && (
        <div className="absolute right-1 top-11 z-10 bg-black border border-gray-700 rounded-lg shadow-xl p-3 w-60 animate-fadeIn settings-panel">
          <div className="mb-4">
            <h4 className="text-sm text-gray-300 mb-2">Slippage Tolerance</h4>
            <div className="flex gap-2">
              {['0.1', '0.5', '1.0'].map((value) => (
                <button
                  key={value}
                  onClick={() => setSlippage(value)}
                  className={`px-3 py-1 text-xs rounded-md ${
                    slippage === value 
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                      : 'bg-black border border-gray-600 text-gray-300'
                  }`}
                >
                  {value}%
                </button>
              ))}
              <div className="relative flex-1">
                <input
                  type="text"
                  value={slippage}
                  onChange={(e) => setSlippage(e.target.value)}
                  className="w-full px-2 py-1 text-xs rounded-md bg-black border border-gray-600 text-gray-300 focus:outline-none focus:ring-1 focus:ring-green-500"
                />
                <span className="absolute right-2 top-1 text-xs text-gray-400">%</span>
              </div>
            </div>
          </div>
          <div className="text-xs text-gray-400 flex items-start">
            <Info size={12} className="mr-1 mt-0.5" />
            <span>Higher slippage increases success chance but may result in worse rates</span>
          </div>
        </div>
      )}
      
      <div className="bg-black/30 rounded-lg border border-gray-800/50 p-3 mb-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-gray-400">From</span>
          <span className="text-xs text-gray-400">
            {isConnected ? (
              balanceLoading ? (
                <span className="flex items-center">
                  <RefreshCw size={10} className="animate-spin mr-1" /> Loading...
                </span>
              ) : (
                `Balance: ${ethBalance ? parseFloat(ethBalance.formatted).toFixed(4) : '0.00'}`
              )
            ) : (
              'Balance: -'
            )}
          </span>
        </div>
        <div className="flex items-center justify-between bg-black rounded-lg p-3 mb-2">
          <input
            type="text"
            value={fromAmount}
            onChange={(e) => handleFromAmountChange(e.target.value)}
            placeholder="0.0"
            className="bg-transparent border-none text-white text-lg font-medium w-2/3 focus:outline-none"
          />
          <div className="flex items-center bg-black/70 rounded-lg px-3 py-1.5">
            <img 
              src="https://cryptologos.cc/logos/pulse-chain-pls-logo.png?v=026" 
              alt="PLS" 
              className="w-5 h-5 mr-1.5" 
            />
            <span className="text-white font-medium">PLS</span>
            <ChevronDown size={14} className="ml-1 text-gray-400" />
          </div>
        </div>
        
        <div className="flex justify-center -my-2 relative z-10">
          <button 
            onClick={handleSwap}
            className="bg-black border border-gray-700 rounded-full p-1.5 hover:bg-black/70 transition-colors"
          >
            <ArrowDownUp size={14} className="text-green-400" />
          </button>
        </div>
        
        <div className="flex justify-between items-center mb-1 mt-3">
          <span className="text-xs text-gray-400">To (estimated)</span>
          <span className="text-xs text-gray-400">
            {isConnected ? 'Balance: 0.00' : 'Balance: -'}
          </span>
        </div>
        <div className="flex items-center justify-between bg-black rounded-lg p-3">
          <input
            type="text"
            value={toAmount}
            onChange={(e) => handleToAmountChange(e.target.value)}
            placeholder="0.0"
            className="bg-transparent border-none text-white text-lg font-medium w-2/3 focus:outline-none"
          />
          <div className="flex items-center bg-black/70 rounded-lg px-3 py-1.5">
            <div className="w-5 h-5 mr-1.5 flex items-center justify-center bg-green-500/20 rounded-full">
              <span className="text-green-400 text-xs font-bold">M</span>
            </div>
            <span className="text-white font-medium">MORE</span>
            <ChevronDown size={14} className="ml-1 text-gray-400" />
          </div>
        </div>
      </div>
      
      <div className="bg-black/30 rounded-lg border border-gray-800/50 p-3 mb-3">
        <div className="flex justify-between mb-2">
          <span className="text-sm text-gray-400">Rate</span>
          <span className="text-sm text-white font-mono">1 PLS ≈ {(1 / currentPrice).toLocaleString()} MORE</span>
        </div>
        <div className="flex justify-between mb-2">
          <span className="text-sm text-gray-400">Slippage</span>
          <span className="text-sm text-white">{slippage}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-400">Fee</span>
          <span className="text-sm text-white">0.3%</span>
        </div>
      </div>
      
      {!isConnected && (
        <div className="text-xs text-gray-500 bg-blue-500/10 border border-blue-500/20 rounded-lg p-2 mb-3 flex items-start">
          <Info size={14} className="text-blue-400 mr-1.5 mt-0.5 flex-shrink-0" />
          <span>Connect your wallet to trade instantly</span>
        </div>
      )}
      
      {isConnected && !isPulseChain && (
        <div className="text-xs text-gray-500 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-2 mb-3 flex items-start">
          <AlertCircle size={14} className="text-yellow-400 mr-1.5 mt-0.5 flex-shrink-0" />
          <span>Please switch to PulseChain network to trade MORE tokens</span>
        </div>
      )}
      
      {errorMessage && (
        <div className="text-xs text-gray-500 bg-red-500/10 border border-red-500/20 rounded-lg p-2 mb-3 flex items-start">
          <AlertCircle size={14} className="text-red-400 mr-1.5 mt-0.5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
      
      {txHash && (
        <div className="text-xs text-gray-500 bg-green-500/10 border border-green-500/20 rounded-lg p-2 mb-3 flex items-start">
          <Check size={14} className="text-green-400 mr-1.5 mt-0.5 flex-shrink-0" />
          <div>
            <span>Transaction submitted! </span>
            <a 
              href={`https://scan.pulsechain.com/tx/${txHash}`}
              target="_blank"
              rel="noreferrer"
              className="text-green-400 hover:underline"
            >
              View on explorer
            </a>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 gap-3">
        <button
          onClick={initiateSwap}
          disabled={swapStatus === 'pending'}
          className={`flex justify-center items-center gap-1 ${
            swapStatus === 'pending'
              ? 'bg-gray-500/20 text-gray-400 cursor-not-allowed'
              : swapStatus === 'success'
              ? 'bg-green-500/40 hover:bg-green-500/50 text-white'
              : swapStatus === 'error'
              ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400'
              : 'bg-green-500/20 hover:bg-green-500/30 text-green-400'
          } font-medium py-3 px-4 rounded-lg transition-colors`}
        >
          {swapStatus === 'pending' ? (
            <>
              <RefreshCw size={16} className="animate-spin mr-1" />
              Confirming Transaction...
            </>
          ) : swapStatus === 'success' ? (
            <>
              <Check size={16} />
              Swap Successful
            </>
          ) : swapStatus === 'error' ? (
            'Try Again'
          ) : isConnected ? (
            isPulseChain ? 'Swap Now' : 'Switch to PulseChain'
          ) : (
            <>
              <Wallet size={16} />
              Connect Wallet to Swap
            </>
          )}
        </button>
        
        <div className="flex gap-3">
          <a
            href={`https://app.pulsex.com/swap?outputCurrency=${tokenAddress}`}
            target="_blank"
            rel="noreferrer"
            className="flex-1 flex justify-center items-center gap-1 bg-black/50 hover:bg-black/80 text-gray-300 font-medium py-2 px-3 rounded-lg transition-colors text-sm"
          >
            Advanced
            <ExternalLink size={14} />
          </a>
          <a
            href={`https://scan.pulsechain.com/token/${tokenAddress}`}
            target="_blank"
            rel="noreferrer"
            className="flex-1 flex justify-center items-center gap-1 bg-black/50 hover:bg-black/80 text-gray-300 font-medium py-2 px-3 rounded-lg transition-colors text-sm"
          >
            Contract
            <ExternalLink size={14} />
          </a>
        </div>
      </div>
    </div>
  );
};

export default TradingModule;