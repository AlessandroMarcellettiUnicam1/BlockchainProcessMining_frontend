import Web3 from "web3";
import { Interface } from "ethers";

const web3 = new Web3();

export const numberToHex = (num) => {
    if (num === undefined || num === null || num === "")
        return undefined;
    return web3.utils.numberToHex(num);
}

export const gweiToHex = (gwei) => {
    if (!gwei || gwei === "" ) 
        return undefined;

    try {
        const wei = web3.utils.toWei(gwei.toString(), "gwei");
        return web3.utils.numberToHex(wei);
    } catch (e) {
        console.error("Errore di conversione Gwei:", e);
        return undefined;
    }
}

export const ethToHex = (eth) => {
    if (!eth || eth === "0" || eth === "") 
        return "0x0";

    try {
        const wei = web3.utils.toWei(eth.toString(), "ether");
        return web3.utils.numberToHex(wei);
    } catch (e) {
        console.error("Errore di conversione ETH:", e);
        return "0x0";
    }
}

export const formatBlockInput = (input) => {
    if (!input) 
        return "latest";
    
    const lowerInput = input.toString().toLowerCase().trim();

    if (["latest", "pending", "earliest", "safe", "finalized"].includes(lowerInput)) {
        return lowerInput;
    }
    if (lowerInput.startsWith("0x")) {
        return lowerInput;
    }
    return web3.utils.numberToHex(input);
}

export const formatData = (dataString) => {
    if (!dataString || dataString.trim() === "") 
        return "0x";
    
    const trimmed = dataString.trim();
    return trimmed.startsWith("0x") ? trimmed : `0x${trimmed}`;
};

export const formatAccessList = (accessListString) => {
    if (!accessListString || accessListString.trim() === "") 
        return undefined;

    try {
        return JSON.parse(accessListString);
    } catch (e) {
        console.error("Errore nel parsing dell'Access List JSON:", e);
        throw new Error("L'Access List deve essere un JSON valido.");
    }
};

export const encodeABI = (signature, args) => {
    if (!signature || signature.trim() === "") 
        return "0x";

    try {
        const iface = new Interface([`function ${signature}`]);
        
        const funcName = signature.split('(')[0].trim();
        
        return iface.encodeFunctionData(funcName, args);
    } catch (error) {
        console.error("Errore di codifica ABI:", error);
        throw new Error("Codifica fallita: verifica che la firma e i parametri siano corretti.");
    }
}