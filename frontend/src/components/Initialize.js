import { ethers } from "ethers";

import TheForge from "../contracts/TheForge.json";
import Anvil from "../contracts/AnvilTheForge.json";

const CONTRACT_ADDRESS_THEFORGE = "0xA66Dcb378A568491d3484D30BB50e90678676565";
const CONTRACT_ADDRESS_ANVIL = "0xa5eE245663390E0Acf3F89e3cAFc0a56ba8Bb1b7";


const POLYGON_ID = '137';

const initialize = async (stateManagement) => {
  const { setAccount, setNetworkError, resetState } = stateManagement;

  try {

    const [selectedAddress] = await window.ethereum.enable();

    if (window.ethereum.networkVersion !== POLYGON_ID) {
      setNetworkError("Please connect Metamask to Polygon network")

      return;
    }


    _initialize(selectedAddress, stateManagement);

    window.ethereum.on("accountsChanged", ([newAddress]) => {
      // `accountsChanged` event can be triggered with an undefined newAddress.
      // This happens when the user removes the Dapp from the "Connected
      // list of sites allowed access to your addresses" (Metamask > Settings > Connections)
      // To avoid errors, we reset the dapp state 
      if (newAddress === undefined) {
        return resetState();
      }
      
      _initialize(newAddress, stateManagement);
    });
    
    // We reset the dapp state if the network is changed
    window.ethereum.on("networkChanged", ([networkId]) => {
      resetState();
    });

    setAccount(selectedAddress);

  } catch (error) {
    console.log(error);
  }
}


const _initialize = (selectedAddress, stateManagement) => {
  const { setAccount } = stateManagement;

  setAccount(selectedAddress);

  _intializeEthers(selectedAddress, stateManagement);
}

const _intializeEthers = async (selectedAddress, stateManagement) => {
  const { setHasHammer, setTheForgeSC, setHasAnvil, setHasInvite } = stateManagement;
  try {

    // We initialize ethers by creating a provider using window.ethereum
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const theForgeContract = new ethers.Contract(CONTRACT_ADDRESS_THEFORGE, TheForge.abi, signer);
    const anvilContract = new ethers.Contract(CONTRACT_ADDRESS_ANVIL, Anvil.abi, signer);

    const balanceHammer = await theForgeContract.balanceOf(selectedAddress, 0);
    const balanceAnvil = await anvilContract.balanceOf(selectedAddress);
    const balanceInvite = await theForgeContract.hasInvite(selectedAddress);

    let numberInvite = 0;
      
    if (balanceInvite._hex !== undefined ) {
      const bigNumInstance = ethers.BigNumber.from(balanceInvite);
      numberInvite = bigNumInstance.toNumber();
    }

    setTheForgeSC(theForgeContract);
    setHasInvite(numberInvite);

    if (balanceHammer > 0) setHasHammer(true);

    if (balanceAnvil > 0) setHasAnvil(true);

  } catch(error) {
    console.log(error);
  }
}

export default initialize;
