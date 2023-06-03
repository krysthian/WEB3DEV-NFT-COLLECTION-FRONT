import React, { useEffect, useState } from "react"
import "./styles/App.css"
import LoadingSpinner from "./LoadingSpinner";
import twitterLogo from "./assets/twitter-logo.svg"
import linkedinLogo from "./assets/LinkedIn.svg"

import { ethers } from "ethers"
import myEpicNft from "./utils/MyEpicNFT.json"

// Constants
const LINKEDIN_HANDLE = "krysthianmartins"
const LINKEDIN_LINK = `https://www.linkedin.com/in/${LINKEDIN_HANDLE}`
const OPENSEA_LINK = "https://testnets.opensea.io/collection/chavesnft-37"
const TOTAL_MINT_COUNT = 50

// Eu movi o endereço do contrato para cima para ficar fácil acessar
const CONTRACT_ADDRESS = "0xad7bA01A06ab3Ce88De21c990428f3bB5e50292F"
//0x54cB31eA47aC2d987e207f64d821872EA2aBdFa6

const App = () => {

  //hook e também criei uma variável que mostra o total mintado na tela
  let totalMinted = 0;
  const [mintTotal, setMintTotal] = useState(totalMinted)

  /*
   * Só uma variável de estado que usamos pra armazenar nossa carteira pública. Não esqueça de importar o useState.
   */
  const [isLoading, setIsLoading] = useState(false);

  const [currentAccount, setCurrentAccount] = useState("")

  //função em js que captura o resultando da minha função escrita em solidity que contabiliza o current
  const getTotalNFTsMintedSoFar = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const connectedContract = new ethers.Contract(
      CONTRACT_ADDRESS,
      myEpicNft.abi,
      provider
    );
    let count = await connectedContract.getTotalNFTsMintedSoFar();
    const total = parseInt(count._hex.substring(2), 16);
    console.log("minted", total);
    setMintTotal(total);
  };

  const checkIfWalletIsConnected = async () => {
    /*
     * Primeiro tenha certeza que temos acesso a window.ethereum
     */
    const { ethereum } = window
    if (!ethereum) {
      console.log("Certifique-se que você tem metamask instalado!")
      return
    } else {
      console.log("Temos o objeto ethereum!", ethereum)
    }
    /*
     * Checa se estamos na rede goerli.
     */
    let chainId = await ethereum.request({ method: 'eth_chainId' });
    console.log("Conectado à rede " + chainId);
    // String, hex code of the chainId of the Rinkebey test network
    const goerliChainId = "0x5";
    if (chainId !== goerliChainId) {
      alert("Você não está conectado a rede Goerli de teste!");
    }
    /*
     * Checa se estamos autorizados a carteira do usuário.
     */
    const accounts = await ethereum.request({ method: "eth_accounts" })
    /*
     * Usuário pode ter múltiplas carteiras autorizadas, nós podemos pegar a primeira que está lá!
     */
    if (accounts.length !== 0) {
      const account = accounts[0]
      console.log("Encontrou uma conta autorizada:", account)
      setCurrentAccount(account)

      // Setup listener! Isso é para quando o usuário vem no site
      // e já tem a carteira conectada e autorizada
      setupEventListener()
    } else {
      console.log("Nenhuma conta autorizada foi encontrada")
    }
  }
  const connectWallet = async () => {
    try {
      const { ethereum } = window
      if (!ethereum) {
        alert("Baixe o Metamask!")
        return
      }
      /*
       * Método chique para pedir acesso a conta.
       */
      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      })
      /*
       * Boom! Isso deve escrever o endereço público uma vez que autorizar o Metamask.
       */
      console.log("Conectado", accounts[0])
      setCurrentAccount(accounts[0])

      // Setup listener! Para quando o usuário vem para o site
      // e conecta a carteira pela primeira vez
      setupEventListener()
    } catch (error) {
      console.log(error)
    }
  }

  // Setup do listener.
  const setupEventListener = async () => {
    // é bem parecido com a função
    try {
      const { ethereum } = window

      if (ethereum) {
        // mesma coisa de novo
        const provider = new ethers.providers.Web3Provider(ethereum)
        const signer = provider.getSigner()
        const connectedContract = new ethers.Contract(CONTRACT_ADDRESS, myEpicNft.abi, signer)

        // Aqui está o tempero mágico.
        // Isso essencialmente captura nosso evento quando o contrato lança
        // Se você está familiar com webhooks, é bem parecido!
        connectedContract.on("NewEpicNFTMinted", (from, tokenId) => {
          console.log(from, tokenId.toNumber())
          alert(
            `Olá pessoal! Já cunhamos seu NFT. Pode ser que esteja branco agora. Demora no máximo 10 minutos para aparecer no OpenSea. Aqui está o link: <https://testnets.opensea.io/assets/${CONTRACT_ADDRESS}/${tokenId.toNumber()}>`
          )
        })

        console.log("Setup event listener!")
      } else {
        console.log("Objeto ethereum não existe!")
      }
    } catch (error) {
      console.log(error)
    }
  }

  const askContractToMintNft = async () => {
    try {
      const { ethereum } = window
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum)
        const signer = provider.getSigner()
        const connectedContract = new ethers.Contract(CONTRACT_ADDRESS, myEpicNft.abi, signer)

        console.log("Vai abrir a carteira agora para pagar o gás...")
        let nftTxn = await connectedContract.makeAnEpicNFT()
        console.log("Cunhando...espere por favor.")

        console.log("nftTxn: ", nftTxn)

        setIsLoading(true);
        await nftTxn.wait()
        console.log(`Cunhado, veja a transação: https://rinkeby.etherscan.io/tx/${nftTxn.hash}`)

        setIsLoading(false);


        getTotalNFTsMintedSoFar();

      } else {
        console.log("Objeto ethereum não existe!")
      }
    } catch (error) {
      console.log(error)
    }
  }

  // Métodos para Renderizar
  const renderNotConnectedContainer = () => (
    <button onClick={connectWallet} className="cta-button connect-wallet-button">
      Conectar Carteira
    </button>
  )
  /*
   * Isso roda nossa função quando a página carrega.
   */
  useEffect(() => {
    checkIfWalletIsConnected()
    getTotalNFTsMintedSoFar()
  }, [])

  return (
    <div className="App">
      <div className="container">
        <div className="header-container">
          {isLoading ? <LoadingSpinner /> : null}
          <p className="header gradient-text">Minha Coleção de NFT</p>
          <p className="sub-text">Exclusivos! Maravilhosos! Únicos! Descubra seu NFT hoje.</p>
          {currentAccount === "" ? (
            renderNotConnectedContainer()
          ) : (
            <button onClick={askContractToMintNft} className="cta-button connect-wallet-button" disabled={isLoading}>
              Cunhar NFT
            </button>
          )}

          <br />
          <br />

          <div className="sub-text benefit_2">
            <div style={{ fontSize: "1.5em" }}>
              {mintTotal}/{TOTAL_MINT_COUNT}
            </div>
            NFTs mintados
          </div>

          <br />
          <br />

          <a
            className="footer-text"
            href={OPENSEA_LINK}
            target="_blank"
            rel="noreferrer"
          >{`🌊 Exibir coleção no OpenSea`}</a>

        </div>
        <div className="footer-container">
          <img alt="Linkedin Logo" className="linkedin-logo" src={linkedinLogo} />
          <a
            className="footer-text"
            href={LINKEDIN_LINK}
            target="_blank"
            rel="noreferrer"
          >{`feito com ❤️ por @${LINKEDIN_HANDLE}`}</a>
        </div>
      </div>
    </div>
  )
}

export default App