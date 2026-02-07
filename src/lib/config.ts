import { createConfig, http } from "wagmi";
import { arcTestnet } from "wagmi/chains";
import { circleConnector } from "./circle-connector";

export const config = createConfig({
  chains: [arcTestnet],
  connectors: [
    circleConnector({
      chains: [arcTestnet],
    }),
  ],
  transports: {
    [arcTestnet.id]: http(),
  },
});
