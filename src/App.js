import React from "react";
import "./App.css";
import { TextField, Button } from "@mui/material";
import Box from "@mui/material/Box";
import CardMedia from "@mui/material/CardMedia";
import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import { Typography } from "@mui/material";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import InfoIcon from "@mui/icons-material/Info";
import ReactTooltip from "react-tooltip";
import {BigNumber, ethers} from "ethers"
import { w3cwebsocket as W3CWebSocket } from "websocket";

class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            accounts: undefined,
            imageName: "",
            imagePhrase: "",
            imageKey: "",
            imageStatus: "complete",
        };
        this.handleNameChange = this.handleNameChange.bind(this);
        this.handlePhraseChange = this.handlePhraseChange.bind(this);
    }

    async componentDidMount() {
        const {ethereum} = window
        if (ethereum) {
            const accounts = await ethereum.request({
                method: 'eth_accounts',
            }).catch((error) => {
                console.error(error);
            });

            this.setState({
                accounts: accounts,
            })


            const client = new W3CWebSocket("ws://artkey.onrender.com/?walletAddress=" + accounts[0]);
            client.onmessage = (message) => {
                console.log(message);
                const data = JSON.parse(message.data)
                this.setState({
                    imageKey: data.imageKey,
                    imageStatus: "complete"
                })
            };
        }
    }

    async submitJob() {
        const { accounts, imageName, imagePhrase } = this.state;

        if (!accounts || accounts.length === 0) {
            return;
        }

        this.setState({
            imageStatus: "pending",
        });


        await fetch(`msg/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                address: accounts[0],
                imageName: imageName,
                imagePhrase: imagePhrase,
            }),
        }).then(response => {

        }).catch(err => {

        });
    }

    async connectMetamask() {
        const {ethereum} = window
        let accounts = await ethereum.request({ method: 'eth_requestAccounts' });
        this.setState({
            accounts : accounts
        })
    }

    handleNameChange(event) {
        this.setState({ imageName: event.target.value });
    }

    handlePhraseChange(event) {
        this.setState({ imagePhrase: event.target.value });
    }

    render() {
        const { accounts } = this.state;

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
                    <Grid item xs={4}>
                        <Box className="controls">
                            <Typography variant="subtitle2" style={{ textAlign: "left" }}>
                                ArtKey allows users to generate art into NFTs with a simple
                                phrase. To use this service, enter an image name and a phrase
                                for the ArtKey AI artist.
                            </Typography>
                            <TextField
                                style={{ margin: "20px", display: "flex" }}
                                id="name"
                                label="Image Name"
                                variant="outlined"
                                value={this.state.imageName}
                                onChange={this.handleNameChange}
                                disabled={this.state.imageStatus != "complete"}
                            />
                            <TextField
                                style={{ margin: "20px", display: "flex" }}
                                id="phrase"
                                label="Image Phrase"
                                variant="outlined"
                                value={this.state.imagePhrase}
                                onChange={this.handlePhraseChange}
                                disabled={this.state.imageStatus != "complete"}
                            />
                            <Button
                                style={{ margin: "20px", display: "flex", float: "right" }}
                                id="submit"
                                variant="contained"
                                onClick={() => this.submitJob()}
                                disabled={this.state.imageStatus != "complete"}
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
                    <Grid item xs={8}>
                        <Box className="image">
                            { !this.state.imageStatus  || this.state.imageStatus == '' ?

                                <Card variant="outlined" sx={{ width: 250, height: 250, justifyContent: "center",  display: "flex",
                                    flexDirection: "column" }}><CardMedia>Your art will appear here</CardMedia></Card> :
                                this.state.imageStatus != "complete" ? (
                                    <CircularProgress
                                        style={{ height: 100, width: 100, padding: "50px" }}
                                    />
                                ) : (
                                    <Card variant="outlined" sx={{ width: 256 }}>
                                        <CardMedia
                                            component="img"
                                            height="256"
                                            image={this.state.imageKey}
                                        />
                                    </Card>
                                )

                            }


                        </Box>
                        <Box>
                            <Button
                                style={{ marginTop: "100px" }}
                                id="mint"
                                variant="contained"
                                disabled
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
            </Box>
        );
    }
}
export default App;
