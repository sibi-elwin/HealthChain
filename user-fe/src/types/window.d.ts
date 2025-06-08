interface Window {
  ethereum?: {
    isMetaMask?: boolean;
    request: (args: { method: string; params?: any[] }) => Promise<any>;
    on: (event: string, callback: (accounts: string[]) => void) => void;
    removeListener: (event: string, callback: () => void) => void;
    autoRefreshOnNetworkChange?: boolean;
    networkVersion?: string;
    selectedAddress?: string | null;
    chainId?: string;
    isConnected?: () => boolean;
    enable?: () => Promise<string[]>;
    send?: (method: string, params?: any[]) => Promise<any>;
    sendAsync?: (request: any, callback: (error: any, response: any) => void) => void;
  };
} 