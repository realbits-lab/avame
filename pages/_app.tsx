import type { AppProps } from "next/app";
import { RecoilRoot } from "recoil";
import {
  EthereumClient,
  w3mConnectors,
  w3mProvider,
} from "@web3modal/ethereum";
import { Web3Modal } from "@web3modal/react";
import { configureChains, createClient, WagmiConfig } from "wagmi";
import { polygon, polygonMumbai, localhost } from "wagmi/chains";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material";
import { CacheProvider, EmotionCache } from "@emotion/react";
import { getChainName } from "../components/RealBitsUtil";
import { theme } from "../utils/theme";
import createEmotionCache from "../utils/createEmotionCache";
import "../styles/globals.css";

interface MyAppProps extends AppProps {
  emotionCache?: EmotionCache;
}

// Add emotion cache.
const clientSideEmotionCache = createEmotionCache();

// Add more properties.
const MyApp: React.FunctionComponent<MyAppProps> = (props) => {
  const { Component, emotionCache = clientSideEmotionCache, pageProps } = props;

  let wagmiBlockchainNetworks: any[] = [];
  if (
    getChainName({ chainId: process.env.NEXT_PUBLIC_BLOCKCHAIN_NETWORK }) ===
    "matic"
  ) {
    wagmiBlockchainNetworks = [polygon];
  } else if (
    getChainName({ chainId: process.env.NEXT_PUBLIC_BLOCKCHAIN_NETWORK }) ===
    "maticmum"
  ) {
    wagmiBlockchainNetworks = [polygonMumbai];
  } else if (
    getChainName({ chainId: process.env.NEXT_PUBLIC_BLOCKCHAIN_NETWORK }) ===
    "localhost"
  ) {
    wagmiBlockchainNetworks = [localhost];
  } else {
    wagmiBlockchainNetworks = [];
  }

  // * Wagmi client
  //* Use wallet connect configuration.
  const { chains, provider, webSocketProvider } = configureChains(
    wagmiBlockchainNetworks,
    [
      w3mProvider({
        projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID ?? "",
      }),
    ]
  );
  //* Use alchemy configuration.
  // const { chains, provider, webSocketProvider } = configureChains(
  //   wagmiBlockchainNetworks,
  //   [
  //     alchemyProvider({
  //       apiKey: process.env.NEXT_PUBLIC_ALCHEMY_KEY ?? "",
  //     }),
  //   ]
  // );
  const wagmiClient = createClient({
    autoConnect: true,
    connectors: w3mConnectors({
      projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID ?? "",
      version: 2,
      chains: wagmiBlockchainNetworks,
    }),
    provider,
    webSocketProvider,
  });

  // * Web3Modal Ethereum Client
  const ethereumClient = new EthereumClient(
    wagmiClient,
    wagmiBlockchainNetworks
  );

  return (
    <CacheProvider value={emotionCache}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <WagmiConfig client={wagmiClient}>
          <RecoilRoot>
            <Component {...pageProps} />
          </RecoilRoot>
        </WagmiConfig>

        <Web3Modal
          projectId={process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID!}
          ethereumClient={ethereumClient}
          themeVariables={{
            "--w3m-font-family": "Roboto, sans-serif",
            "--w3m-accent-color": "#F5841F",
            "--w3m-z-index": "20000",
          }}
        />
      </ThemeProvider>
    </CacheProvider>
  );
};

export default MyApp;
