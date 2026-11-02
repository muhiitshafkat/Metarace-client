import { BigNumber, ethers } from "ethers";
import {
  contractABI,
  contractAddress,
  testNftCollectionABI,
  testNftCollectionAddress,
  testNftStakingContractABI,
  testNftStakingContractAddress,
  mrtTokenAddress,
  mrtTokenABI,
  rewardPoolAddress,
  rewardPoolABI,
  mrtStakingAddress,
  mrtStakingABI,
} from "../utils/constants";

// Safe accessor — never crashes on non-MetaMask browsers
const getEthereum = () => (typeof window !== "undefined" ? window.ethereum : null);

// If MetaMask is not installed, open the install page and return an error object
const noMetaMask = () => {
  window.open("https://metamask.io/download.html", "_blank", "noopener,noreferrer");
  return { status: "danger", msg: "MetaMask is not installed. Opening install page…" };
};

let ethStakingContractToGET,
  ethStakingContractToPOST,
  nftCollectionContractToGET,
  nftCollectionContractToPOST,
  nftStakingContractToGET,
  nftStakingContractToPOST;
let walletAddressETHToGET,
  walletAddressETHToPOST,
  walletAddressNFTCollectionToGET,
  // walletAddressNFTCollectionToPOST — set internally by initNftCollectionContractToPOST
  walletAddressNFTStakingToGET,
  walletAddressNFTStakingToPOST;

const polygonChainId    = 137;
const polygonChainIdHex = "0x89";

// ── Init helpers ──────────────────────────────────────────────────

export const initEthStakingContractToGET = async (address) => {
  walletAddressETHToGET = address;
  const provider = new ethers.providers.JsonRpcProvider(
    process.env.REACT_APP_RPC_URL
  );
  const signer = provider.getSigner(address);
  ethStakingContractToGET = new ethers.Contract(contractAddress, contractABI, signer);
};

export const initEthStakingContractToPOST = async (address) => {
  walletAddressETHToPOST = address;
  const provider = new ethers.providers.Web3Provider(getEthereum());
  await provider.send("eth_requestAccounts", []);
  const signer = provider.getSigner();
  ethStakingContractToPOST = new ethers.Contract(contractAddress, contractABI, signer);
};

export const initNftCollectionContractToGET = async (address) => {
  walletAddressNFTCollectionToGET = address;
  const provider = new ethers.providers.JsonRpcProvider(
    process.env.REACT_APP_RPC_URL
  );
  const signer = provider.getSigner(address);
  nftCollectionContractToGET = new ethers.Contract(
    testNftCollectionAddress,
    testNftCollectionABI,
    signer
  );
};

export const initNftCollectionContractToPOST = async (address) => { // eslint-disable-line no-unused-vars
  const provider = new ethers.providers.Web3Provider(getEthereum());
  await provider.send("eth_requestAccounts", []);
  const signer = provider.getSigner();
  nftCollectionContractToPOST = new ethers.Contract(
    testNftCollectionAddress,
    testNftCollectionABI,
    signer
  );
};

export const initNftStakingContractToGET = async (address) => {
  walletAddressNFTStakingToGET = address;
  const provider = new ethers.providers.JsonRpcProvider(
    process.env.REACT_APP_RPC_URL
  );
  const signer = provider.getSigner(address);
  nftStakingContractToGET = new ethers.Contract(
    testNftStakingContractAddress,
    testNftStakingContractABI,
    signer
  );
  return nftStakingContractToGET;
};

export const initNftStakingContractToPOST = async (address) => {
  walletAddressNFTStakingToPOST = address;
  const provider = new ethers.providers.Web3Provider(getEthereum());
  await provider.send("eth_requestAccounts", []);
  const signer = provider.getSigner();
  nftStakingContractToPOST = new ethers.Contract(
    testNftStakingContractAddress,
    testNftStakingContractABI,
    signer
  );
};

// ── ETH Staking reads ─────────────────────────────────────────────

export const getStakeBalance = async (address) => {
  if (!ethStakingContractToGET || address !== walletAddressETHToGET)
    await initEthStakingContractToGET(address);
  let balance = await ethStakingContractToGET.getStakeBalance(address);
  return parseFloat(BigNumber.from(balance).div(1e15)) / 1e3;
};

export const getWalletBalance = async (address) => {
  const provider = new ethers.providers.JsonRpcProvider(
    process.env.REACT_APP_RPC_URL
  );
  let balance = await provider.getBalance(address);
  return parseFloat(BigNumber.from(balance).div(1e15)) / 1e3;
};

export const getTotalStaked = async (address) => {
  if (!ethStakingContractToGET || address !== walletAddressETHToGET)
    await initEthStakingContractToGET(address);
  let balance = await ethStakingContractToGET.totalStaked();
  return parseFloat(BigNumber.from(balance).div(1e15)) / 1e3;
};

export const getRemainTimeToStake = async (address) => {
  if (!ethStakingContractToGET || address !== walletAddressETHToGET)
    await initEthStakingContractToGET(address);
  let remainTime = await ethStakingContractToGET.getRemainTimeToStake(address);
  return parseInt(BigNumber.from(remainTime).mul(1));
};

export const getAvailableStakeBalance = async (address) => {
  if (!ethStakingContractToGET || address !== walletAddressETHToGET)
    await initEthStakingContractToGET(address);
  let availableStakeBalance =
    await ethStakingContractToGET.getAvailableStakeBalance(address);
  return parseFloat(BigNumber.from(availableStakeBalance).div(1e15)) / 1e3;
};

export const getAccumulatedPoint = async (address) => {
  if (!ethStakingContractToGET || address !== walletAddressETHToGET)
    await initEthStakingContractToGET(address);
  let accumulatedPoint = await ethStakingContractToGET.getAccumulatedPoint(address);
  return parseFloat(BigNumber.from(accumulatedPoint).div(1e15)) / 1e3;
};

// ── ETH Staking writes ────────────────────────────────────────────

export const stake = async (mode, price, address) => {
  const eth = getEthereum();
  if (!eth) return noMetaMask();
  const chainId = await eth.request({ method: "eth_chainId" });
  if (parseInt(chainId, 16) !== polygonChainId) {
    try {
      await eth.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: polygonChainIdHex }],
      });
    } catch (error) {
      console.log("error", error);
    }
  }
  try {
    if (!ethStakingContractToPOST || address !== walletAddressETHToPOST)
      await initEthStakingContractToPOST(address);
    let tx = await ethStakingContractToPOST.stake(mode, {
      value: BigNumber.from(1e9).mul(price),
    });
    let res = await tx.wait();
    if (res.transactionHash) {
      return { status: "success", msg: "You have successfully staked." };
    } else {
      return { status: "danger", msg: "Failed Staking." };
    }
  } catch (err) {
    return {
      status: "danger",
      msg: err.error ? err.error.message : "User rejected the transaction.",
    };
  }
};

export const unstake = async (address) => {
  const eth = getEthereum();
  if (!eth) return noMetaMask();
  const chainId = await eth.request({ method: "eth_chainId" });
  if (parseInt(chainId, 16) !== polygonChainId) {
    try {
      await eth.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: polygonChainIdHex }],
      });
    } catch (error) {
      console.log("error", error);
    }
  }
  try {
    if (!ethStakingContractToPOST || address !== walletAddressETHToPOST)
      await initEthStakingContractToPOST(address);
    let tx = await ethStakingContractToPOST.unstake();
    let res = await tx.wait();
    if (res.transactionHash) {
      return { status: "success", msg: "You have successfully unstaked." };
    } else {
      return { status: "danger", msg: "Failed unStaking." };
    }
  } catch (err) {
    return {
      status: "danger",
      msg: err.error ? err.error.message : "User rejected the transaction.",
    };
  }
};

export const emergencyUnstake = async (address) => {
  const eth = getEthereum();
  if (!eth) return noMetaMask();
  const chainId = await eth.request({ method: "eth_chainId" });
  if (parseInt(chainId, 16) !== polygonChainId) {
    try {
      await eth.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: polygonChainIdHex }],
      });
    } catch (err) {
      return {
        status: "danger",
        msg: err.error ? err.error.message : "User rejected the transaction.",
      };
    }
  }
  try {
    if (!ethStakingContractToPOST || address !== walletAddressETHToPOST)
      await initEthStakingContractToPOST(address);
    let tx = await ethStakingContractToPOST.emergencyUnstake();
    let res = await tx.wait();
    if (res.transactionHash) {
      return { status: "success", msg: "You have successfully unstaked." };
    } else {
      return { status: "danger", msg: "Failed unStaking." };
    }
  } catch (err) {
    return {
      status: "danger",
      msg: err.error ? err.error.message : "User rejected the transaction.",
    };
  }
};

// ── NFT Collection reads ──────────────────────────────────────────

export const getNftOwnedTokenIds = async (address) => {
  if (!nftCollectionContractToGET || address !== walletAddressNFTCollectionToGET)
    await initNftCollectionContractToGET(address);
  let balance = await nftCollectionContractToGET.balanceOf(address);
  let tokenIds = [];
  for (let i = 0; i < balance; i++) {
    let tokenId = await nftCollectionContractToGET.tokenOfOwnerByIndex(address, i);
    tokenIds.push(parseInt(BigNumber.from(tokenId).mul(1)));
  }
  return tokenIds;
};

export const tokenURI = async (tokenId, address) => {
  if (tokenId < 0) return 0;
  if (!nftCollectionContractToGET || address !== walletAddressNFTCollectionToGET)
    await initNftCollectionContractToGET(address);
  let uri = await nftCollectionContractToGET.tokenURI(tokenId);
  let json = await fetch("https://gateway.pinata.cloud/ipfs/" + uri.substr(7));
  let nftMetaData = await json.json();
  return "https://gateway.pinata.cloud/ipfs/" + nftMetaData.image.substr(7);
};

// ── NFT Staking reads ─────────────────────────────────────────────

export const getNftTotalStaked = async (address) => {
  if (!nftStakingContractToGET || address !== walletAddressNFTStakingToGET)
    await initNftStakingContractToGET(address);
  let ownedTokens = await nftStakingContractToGET.getOwnedTokens(address);
  let stakedIds = [];
  for (let i = 0; i < ownedTokens.length; i++) {
    stakedIds[i] = parseInt(BigNumber.from(ownedTokens[i]).mul(1));
  }
  return stakedIds;
};

export const getNftTokenMunityMedals = async (address, tokenId) => {
  if (!nftStakingContractToGET || address !== walletAddressNFTStakingToGET)
    await initNftStakingContractToGET(address);
  let munityMedals = await nftStakingContractToGET.getTokenMunityMedals(
    BigNumber.from(tokenId).mul(1)
  );
  return parseInt(BigNumber.from(munityMedals).mul(1));
};

export const getDaysToUnstake = async (tokenId, address) => {
  if (!nftStakingContractToGET || address !== walletAddressNFTStakingToGET)
    await initNftStakingContractToGET(address);
  let daysToUnstake = await nftStakingContractToGET.getDaysToUnstake(tokenId);
  return parseInt(BigNumber.from(daysToUnstake).div(60 * 60 * 24));
};

// ── NFT Staking writes ────────────────────────────────────────────

export const nftStake = async (address, tokenId) => {
  const eth = getEthereum();
  if (!eth) return noMetaMask();
  const chainId = await eth.request({ method: "eth_chainId" });
  if (parseInt(chainId, 16) !== polygonChainId) {
    try {
      await eth.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: polygonChainIdHex }],
      });
    } catch (error) {
      console.log("error", error);
    }
  }
  try {
    if (!nftStakingContractToPOST || address !== walletAddressNFTStakingToPOST)
      await initNftStakingContractToPOST(address);
    if (!nftCollectionContractToPOST)
      await initNftCollectionContractToPOST(address);
    let apptx = await nftCollectionContractToPOST.approve(
      testNftStakingContractAddress,
      tokenId
    );
    let appres = await apptx.wait();
    if (appres.transactionHash) {
      let tx = await nftStakingContractToPOST.stake(tokenId);
      let res = await tx.wait();
      if (res.transactionHash) {
        return { status: "success", msg: "You have staked token." };
      } else {
        return { status: "danger", msg: "Failed Staking." };
      }
    }
  } catch (err) {
    return {
      status: "danger",
      msg: err.error ? err.error.message : "User rejected the transaction.",
    };
  }
};

export const nftUnstake = async (address, tokenId) => {
  const eth = getEthereum();
  if (!eth) return noMetaMask();
  const chainId = await eth.request({ method: "eth_chainId" });
  if (parseInt(chainId, 16) !== polygonChainId) {
    try {
      await eth.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: polygonChainIdHex }],
      });
    } catch (error) {
      return;
    }
  }
  try {
    if (!nftStakingContractToPOST || address !== walletAddressNFTStakingToPOST)
      await initNftStakingContractToPOST(address);
    let tx = await nftStakingContractToPOST.unstake(tokenId);
    let res = await tx.wait();
    if (res.transactionHash) {
      return { status: "success", msg: "You have successfully unstaked." };
    } else {
      return { status: "danger", msg: "Failed Unstaking." };
    }
  } catch (err) {
    return {
      status: "danger",
      msg: err.error ? err.error.message : "User rejected the transaction.",
    };
  }
};

export const nftClaimRewards = async (address) => {
  const eth = getEthereum();
  if (!eth) return noMetaMask();
  const chainId = await eth.request({ method: "eth_chainId" });
  if (parseInt(chainId, 16) !== polygonChainId) {
    try {
      await eth.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: polygonChainIdHex }],
      });
    } catch (error) {
      return;
    }
  }
  try {
    if (!nftStakingContractToPOST || address !== walletAddressNFTStakingToPOST)
      await initNftStakingContractToPOST(address);
    let tx = await nftStakingContractToPOST.claimMunityMedal(address);
    let res = await tx.wait();
    if (res.transactionHash) {
      return { status: "success", msg: "You have successfully claimed Race Medals." };
    } else {
      return { status: "danger", msg: "Failed Claim Rewards." };
    }
  } catch (err) {
    return { status: "danger", msg: "Failed Claim Rewards." };
  }
};

// ─────────────────────────────────────────────────────────────────
// MRT Token — Staking & Rewards (Polygon Mainnet)
// ─────────────────────────────────────────────────────────────────

const POLYGON_RPC      = process.env.REACT_APP_RPC_URL || "https://polygon-rpc.com";
const POLYGON_CHAIN_ID = 137;
const POLYGON_HEX      = "0x89";

function getMrtStakingRO() {
  const provider = new ethers.providers.JsonRpcProvider(POLYGON_RPC);
  return new ethers.Contract(mrtStakingAddress, mrtStakingABI, provider);
}

async function getMrtStakingRW() {
  const eth = getEthereum();
  if (!eth) return null;
  const provider = new ethers.providers.Web3Provider(eth);
  await provider.send("eth_requestAccounts", []);
  return new ethers.Contract(mrtStakingAddress, mrtStakingABI, provider.getSigner());
}

async function ensurePolygon(eth) {
  const chainId = await eth.request({ method: "eth_chainId" });
  if (parseInt(chainId, 16) === POLYGON_CHAIN_ID) return;
  try {
    await eth.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: POLYGON_HEX }],
    });
  } catch (err) {
    if (err.code === 4902) {
      await eth.request({
        method: "wallet_addEthereumChain",
        params: [{
          chainId: POLYGON_HEX,
          chainName: "Polygon Mainnet",
          nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
          rpcUrls: [POLYGON_RPC, "https://polygon-rpc.com"],
          blockExplorerUrls: ["https://polygonscan.com"],
        }],
      });
    } else throw err;
  }
}

// ── MRT reads ─────────────────────────────────────────────────────

export const getMrtBalance = async (address) => {
  const provider = new ethers.providers.JsonRpcProvider(POLYGON_RPC);
  const token = new ethers.Contract(mrtTokenAddress, mrtTokenABI, provider);
  const balance = await token.balanceOf(address);
  return parseFloat(ethers.utils.formatEther(balance));
};

export const getMrtStakeInfo = async (address) => {
  const contract = getMrtStakingRO();
  const info = await contract.getStakeInfo(address);
  return {
    amount:        parseFloat(ethers.utils.formatEther(info.amount)),
    stakedAt:      info.stakedAt.toNumber(),
    unlockAt:      info.unlockAt.toNumber(),
    tier:          info.tier,
    pending:       parseFloat(ethers.utils.formatEther(info.pending)),
    multiplier:    info.multiplier,
    daysRemaining: info.daysRemaining.toNumber(),
  };
};

export const getMrtTotalStaked = async () => {
  const contract = getMrtStakingRO();
  const total = await contract.totalStaked();
  return parseFloat(ethers.utils.formatEther(total));
};

export const getMrtRewardReserve = async () => {
  const contract = getMrtStakingRO();
  const reserve = await contract.rewardReserve();
  return parseFloat(ethers.utils.formatEther(reserve));
};

export const getDailyMrtRemaining = async (address) => {
  const provider = new ethers.providers.JsonRpcProvider(POLYGON_RPC);
  const contract = new ethers.Contract(rewardPoolAddress, rewardPoolABI, provider);
  const remaining = await contract.dailyRemaining(address);
  return parseFloat(ethers.utils.formatEther(remaining));
};

// ── MRT writes ────────────────────────────────────────────────────

export const approveMrtStaking = async (amount, address) => {
  const eth = getEthereum();
  if (!eth) return noMetaMask();
  try {
    await ensurePolygon(eth);
    const provider = new ethers.providers.Web3Provider(eth);
    await provider.send("eth_requestAccounts", []);
    const token = new ethers.Contract(mrtTokenAddress, mrtTokenABI, provider.getSigner());
    const tx = await token.approve(mrtStakingAddress, ethers.utils.parseEther(String(amount)));
    await tx.wait();
    return { status: "success", msg: "Approval successful." };
  } catch (err) {
    return { status: "danger", msg: err.error?.message || "User rejected." };
  }
};

export const stakeMrt = async (amount, tier, address) => {
  const eth = getEthereum();
  if (!eth) return noMetaMask();
  try {
    await ensurePolygon(eth);
    const contract = await getMrtStakingRW();
    const tx = await contract.stake(ethers.utils.parseEther(String(amount)), tier);
    await tx.wait();
    return { status: "success", msg: "MRT staked successfully." };
  } catch (err) {
    return { status: "danger", msg: err.error?.message || "User rejected." };
  }
};

export const unstakeMrt = async (address) => {
  const eth = getEthereum();
  if (!eth) return noMetaMask();
  try {
    await ensurePolygon(eth);
    const contract = await getMrtStakingRW();
    const tx = await contract.unstake();
    await tx.wait();
    return { status: "success", msg: "MRT unstaked successfully." };
  } catch (err) {
    return { status: "danger", msg: err.error?.message || "User rejected." };
  }
};

export const emergencyUnstakeMrt = async (address) => {
  const eth = getEthereum();
  if (!eth) return noMetaMask();
  try {
    await ensurePolygon(eth);
    const contract = await getMrtStakingRW();
    const tx = await contract.emergencyUnstake();
    await tx.wait();
    return { status: "success", msg: "Emergency unstake complete. 50% reward penalty applied." };
  } catch (err) {
    return { status: "danger", msg: err.error?.message || "User rejected." };
  }
};

export const claimMrtRewards = async (address) => {
  const eth = getEthereum();
  if (!eth) return noMetaMask();
  try {
    await ensurePolygon(eth);
    const contract = await getMrtStakingRW();
    const tx = await contract.claimRewards();
    await tx.wait();
    return { status: "success", msg: "MRT rewards claimed." };
  } catch (err) {
    return { status: "danger", msg: err.error?.message || "User rejected." };
  }
};
