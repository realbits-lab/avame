import type { AppProps } from "next/app";
import { RecoilRoot } from "recoil";
import { configureChains, createConfig, WagmiConfig } from "wagmi";
import { MetaMaskConnector } from "wagmi/connectors/metaMask";
import { alchemyProvider } from "wagmi/providers/alchemy";
import { publicProvider } from "wagmi/providers/public";
import { polygon, polygonMumbai, localhost } from "wagmi/chains";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material";
import { CacheProvider, EmotionCache } from "@emotion/react";
import { getChainName } from "@/components/RealBitsUtil";
import { theme } from "@/utils/theme";
import createEmotionCache from "@/utils/createEmotionCache";
import "@/styles/globals.css";

interface MyAppProps extends AppProps {
  emotionCache?: EmotionCache;
}

//* Add emotion cache.
const clientSideEmotionCache = createEmotionCache();

const MyApp: React.FunctionComponent<MyAppProps> = (props) => {
  const ALCHEMY_API_KEY = process.env.NEXT_PUBLIC_ALCHEMY_KEY!;
  const { Component, emotionCache = clientSideEmotionCache, pageProps } = props;

  let chains: any[] = [];
  if (
    getChainName({ chainId: process.env.NEXT_PUBLIC_BLOCKCHAIN_NETWORK }) ===
    "matic"
  ) {
    chains = [polygon];
  } else if (
    getChainName({ chainId: process.env.NEXT_PUBLIC_BLOCKCHAIN_NETWORK }) ===
    "maticmum"
  ) {
    chains = [polygonMumbai];
  } else if (
    getChainName({ chainId: process.env.NEXT_PUBLIC_BLOCKCHAIN_NETWORK }) ===
    "localhost"
  ) {
    chains = [localhost];
  } else {
    chains = [];
  }

  //* Wagmi client
  //* Use wallet connect configuration.
  const {
    publicClient: wagmiPublicClient,
    webSocketPublicClient: wagmiWebSocketPublicClient,
  } = configureChains(chains, [
    alchemyProvider({ apiKey: ALCHEMY_API_KEY }),
    publicProvider(),
  ]);
  //* Use alchemy configuration.
  const wagmiClient = createConfig({
    autoConnect: true,
    connectors: [new MetaMaskConnector({ chains })],
    publicClient: wagmiPublicClient,
    webSocketPublicClient: wagmiWebSocketPublicClient,
  });

  return (
    <CacheProvider value={emotionCache}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <WagmiConfig config={wagmiClient}>
          <RecoilRoot>
            <Component {...pageProps} />
          </RecoilRoot>
        </WagmiConfig>
      </ThemeProvider>
    </CacheProvider>
  );
};

export default MyApp;
