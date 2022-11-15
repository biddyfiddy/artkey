import React from "react";
import "./App.css";
import { TextField, Button } from "@mui/material";
import Box from "@mui/material/Box";
import CardMedia from "@mui/material/CardMedia";
import Card from "@mui/material/Card";
import Modal from '@mui/material/Modal';
import Grid from "@mui/material/Grid";
import { Typography } from "@mui/material";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import InfoIcon from "@mui/icons-material/Info";
import ReactTooltip from "react-tooltip";
import {BigNumber, ethers} from "ethers"
import { abi, address, bytecode }  from  "../src/assets/contract.json"
import CloseIcon from '@mui/icons-material/Close';
import LinearProgress from '@mui/material/LinearProgress';

const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '500px',
    height: '200px',
    textAlign: "center",
    outline: 0,
    borderRadius: "10px",
    boxShadow: "lightgray 0px 0px 20px 0px",
    backgroundColor: 'white',
    color: 'black'
};

class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            accounts: undefined,
            imagePhrase: "",
            imageKey: "",
            imageStatus: "complete",
            minting: false,
            hashes: undefined,
            mintModalOpen: false,
        };
        this.handlePhraseChange = this.handlePhraseChange.bind(this);
        this.mint = this.mint.bind(this);
        this.handleClose = this.handleClose.bind(this);
    }

    async componentDidMount() {
        const {ethereum} = window
        if (ethereum) {
            const accounts = await ethereum.request({
                method: 'eth_accounts',
            }).catch((error) => {
                console.error(error);
            });

            if (!accounts || accounts.length === 0) {
                return;
            }

            this.setState({
                accounts: accounts,
            })
        }
    }

    handleClose() {
        this.setState({
            mintModalOpen: false,
            minting: false,
            imagePhrase: "",
            imageKey: "",
            imageStatus: "complete",
        });
    }

    handleOpen() {
        this.setState({
            mintModalOpen: true
        });
    }

    async submitJob() {
        const { accounts, imagePhrase } = this.state;

        if (!accounts || accounts.length === 0) {
            return;
        }

        this.setState({
            imageStatus: "pending",
        });

        fetch(`msg/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                address: accounts[0],
                imageName: accounts[0] + "_" + Date.now().toString(),
                imagePhrase: imagePhrase,
            }),
        }).then(async response => {
            const json = await response.json()
            this.setState({
                imageKey : json.url,
                imageStatus: "complete"
            });
        }).catch(err => {

        });
    }

    async mint() {
        const { accounts, imageKey, imagePhrase } = this.state;

        if (!accounts || accounts.length === 0) {
            return;
        }

        this.setState({
          minting: true
        });

        let response = await fetch(`mint`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                walletAddress: accounts[0],
                uri: imageKey,
                imagePhrase: imagePhrase,
            }),
        }).catch(err => {

        });

        if (!response || response.status !== 200) {
            let reason = await response.json();
            this.setState({
                minting: false
            });
            return;
        }

        const ethersProvider = new ethers.providers.Web3Provider(window.ethereum, 'any');
        const signer = ethersProvider.getSigner();

        let json = await response.json();
        let rshoePcontractFactory = new ethers.ContractFactory(
            abi,
            bytecode,
            signer,
        );

        let contractInstance = rshoePcontractFactory.attach(address);

        let rawTxn = await contractInstance.populateTransaction.publicMint(json.tokenUri, json.nonce, json.hash, json.signature, {
            value: BigNumber.from("200000000000000")
        }).catch(err => {

        });

        if (!rawTxn) {
            this.setState({
                minting: false
            });
            return;
        }

        let signedTxn = await signer.sendTransaction(rawTxn).catch(err => {

        });

        if (!signedTxn) {
            this.setState({
                minting: false
            });
            return;
        }

        let hashes = await signedTxn.wait().then(reciept => {
            if (reciept) {
                return 'https://etherscan.io/tx/' + signedTxn.hash;
            } else {


            }
        }).catch(err => {


        });

        this.setState({
            minting: false,
            hashes: hashes
        });
        this.handleOpen();
        return;
    }

    async connectMetamask() {
        const {ethereum} = window
        let accounts = await ethereum.request({ method: 'eth_requestAccounts' });
        this.setState({
            accounts : accounts
        })
    }

    handlePhraseChange(event) {
        this.setState({ imagePhrase: event.target.value });
    }

    render() {
        const { accounts, imageKey, imageStatus, imagePhrase, minting, mintModalOpen, hashes } = this.state;

        if (!accounts || accounts.length === 0) {
            return <Button variant="contained" onClick={() => this.connectMetamask()} style={{ margin: 100 }}>Connect MetaMask</Button>
        }

        return (
            <Box>
                <Typography variant="h2" style={{ textAlign: "center" }}>
                    <span className="bold">Art</span>Key
                </Typography>
                <Typography
                    variant="h6"
                    style={{ textAlign: "center", marginBottom: 100 }}
                >
                    A text-to-art generation tool
                </Typography>
                <Grid container spacing={2} style={{ textAlign: "center" }}>
                    <Grid item xs={5} justify="flex-end">
                        <Box className="controls">
                            <Typography variant="subtitle2" style={{ textAlign: "left" }}>
                                ArtKey allows users to generate art into NFTs with a simple
                                phrase. To use this service, enter an image name and a phrase
                                for the ArtKey AI artist.
                            </Typography>
                            <TextField
                                style={{ margin: "20px", display: "flex" }}
                                id="phrase"
                                label="Image Phrase"
                                variant="outlined"
                                value={imagePhrase}
                                onChange={this.handlePhraseChange}
                                disabled={imageStatus !== "complete"}
                            />
                            <Button
                                style={{ margin: "20px", display: "flex", float: "right" }}
                                id="submit"
                                variant="contained"
                                onClick={() => this.submitJob()}
                                disabled={imageStatus !== "complete"}
                            >
                                Submit
                            </Button>
                        </Box>
                    </Grid>
                    <Divider
                        orientation="vertical"
                        flexItem
                        style={{ marginRight: "-1px" }}
                    />
                    <Grid item xs={7}>
                        <Box className="image">
                            { !imageStatus  || imageStatus === '' ?

                                <Card variant="outlined" sx={{ width: 250, height: 250, justifyContent: "center",  display: "flex",
                                    flexDirection: "column" }}><CardMedia>Your art will appear here</CardMedia></Card> :
                                imageStatus !== "complete" ? (
                                        <Card variant="outlined" sx={{ width: 512, height: 512, justifyContent: "center",  display: "flex",
                                            flexDirection: "column" }}>
                                    <CircularProgress
                                        style={{ height: 100, width: 100, margin: "auto" }}
                                    />
                                        </Card>
                                ) : (
                                    <Card variant="outlined" sx={{ height: 512, width: 512}}>
                                        <CardMedia
                                            className={`${minting ? "blur" : ""}`}
                                            component="img"
                                            height="512"
                                            image={imageKey}
                                        >
                                        </CardMedia>
                                    </Card>
                                )
                            }
                        </Box>
                        {minting ? <Box sx={{ display: "inline-block", textAlign: "center", width: 512}}> <LinearProgress/> </Box>: <Box/>}
                        {!this.state.imageKey ?
                            <Box style={{ marginTop: "10px"}}>Your art will appear here</Box> : <Box />
                        }
                        <Box>
                            <Button
                                style={{ marginTop: "10px" }}
                                id="mint"
                                variant="contained"
                                disabled={minting}
                                onClick={() => this.mint()}
                            >
                                Mint
                            </Button>
                        </Box>
                        <Box style={{ marginTop: "10px" }}>
                            <InfoIcon sx={{ fontSize: 20 }} data-tip data-for="tooltip" />
                            <Typography variant="subtitle2" sx={{ display: "inline" }}>
                                What does this mean?{" "}
                            </Typography>
                            <ReactTooltip id="tooltip" aria-haspopup="true">
                                Mint this image into an NFT
                            </ReactTooltip>
                        </Box>
                    </Grid>
                </Grid>
                <Modal
                    open={mintModalOpen}
                    onClose={this.handleClose}
                    aria-labelledby="modal-modal-title"
                    aria-describedby="modal-modal-description"
                >
                    <Box style={modalStyle}>
                        <div style={{padding: '20px'}}>
                            <Typography style={{fontFamily: 'Montserrat', display: 'inline'}} id="modal-modal-title"
                                        variant="h6" component="h2">
                                <p>You have successfully generated an ArtKey NFT</p>
                                <a href={hashes}>View on Etherscan</a>
                            </Typography>
                            <CloseIcon style={{float: 'right'}} onClick={this.handleClose}></CloseIcon>
                        </div>
                    </Box>
                </Modal>
            </Box>
        );
    }
}
export default App;
