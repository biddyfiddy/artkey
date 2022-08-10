const express = require("express");
const sqs = require("./src/aws/sqs");
const s3 = require("./src/aws/s3");
const ddb = require("./src/aws/dynamo");
const path = require("path")
const ws = require("ws")
const web3 = require("web3")
const axios = require("axios")
const crypto = require("crypto");
const app = express();
const port = process.env.PORT || 3001;
const http = require("http");
const contract = require("./src/assets/contract.json");
const bodyParser = require("body-parser")
const fs = require('fs');
const nftStorage = require('nft.storage')

app.use(express.static(path.join(__dirname, 'build')));
app.use(express.json());
app.use(bodyParser.text());

const web3Instance = new web3(process.env.MAINNET_RPC_URL);

const NFT_STORAGE_API_KEY = process.env.NFT_STORAGE_API_KEY
const WALLET_KEY = process.env.WALLET_KEY

const generateNonce = () => {
    return crypto.randomBytes(16).toString("hex");
};

const mintMsgHash = (recipient, tokenUri, newNonce, contract) => {
    return (
        web3Instance.utils.soliditySha3(
            { t: "address", v: recipient },
            { t: "string", v: tokenUri },
            { t: "string", v: newNonce },
            { t: "address", v: contract }
        ) || ""
    );
};

const signMessage = (msgHash, privateKey) => {
    return web3Instance.eth.accounts.sign(msgHash, privateKey);
};

const signing = (address, tokenUri) => {
    const newNonce = generateNonce();

    const hash = mintMsgHash(
        address,
        tokenUri,
        newNonce,
        contract.address
    );

    const signner = signMessage(hash, WALLET_KEY);

    return {
        tokenUri: tokenUri,
        nonce: newNonce,
        hash: signner.message,
        signature: signner.signature,
    };
}

app.post('/complete', async function(req,res){
    // TODO: verify signature
    // TODO: error check
    if (!req.body) {
        res.status(500).json({ message: "Could not read body"});
        return;
    }

    const body = JSON.parse(req.body);
    if (!body || !body["Message"]) {
        res.status(500).json({ message: "Could not read body"});
        return;
    }

    const message = JSON.parse(body["Message"]);
    // assume 1 record
    const record = message["Records"][0];
    const s3Object = record['s3']
    const objectKey = s3Object['object']['key']
    const url = await s3.getObjectUrl(objectKey, "image.png");
    const split = objectKey.split("/")
    const walletAddress = split[1]

    console.log(JSON.stringify({walletAddress: walletAddress, imageKey: url}))
    wsServer.clients.forEach(function each(client) {
        if (client.id === walletAddress) {
            client.send(JSON.stringify({walletAddress: walletAddress, imageKey: url}))
        }
    });
    res.status(200).send("Job Complete")
})

app.post("/mint", async (req, res) => {
    const body = req.body
    if (!body) {
        res.status(500).json({
            message: "No post body"
        })
        return;
    }

    if (!body.walletAddress || !body.uri || !body.imagePhrase) {
        return res.status(500).json("Request was malformed")
    }

    // push image
    const file = fs.createWriteStream("file.png");

    await axios.get(body.uri, { responseType: 'stream' }).then(response => {
        response.data.pipe(file);

        // after download completed close filestream
        file.on("finish", async () => {
            file.close();
            console.log("Download Completed");

            const nftstorage = new nftStorage.NFTStorage({ token: NFT_STORAGE_API_KEY })
            const content = await fs.promises.readFile("file.png")
            const image = new nftStorage.File([content], "image.png", { type : "image/jpeg" })
            const name = body.imagePhrase;
            const description = "ArtKey Generated NFT";

            let resp = await nftstorage.store({
                    image,
                    name,
                    description,
                    attributes: [ {
                        "trait_type": "Series",
                        "value": "Genesis"
                    }]
                }).catch(err => {console.log(err)});

            fs.unlinkSync("file.png")
            console.log(resp.url);
            let sign = signing(body.walletAddress.toLowerCase(), resp.url);
            res.status(200).json(sign);

        });
    }).catch(err => {
        console.log(err);
        res.status(500).json({ "message" : "failed to mint"})
    });
});

app.post("/msg/", async (req, res) => {
    const body = req.body

    if (!body || !body.imageName || !body.imagePhrase || !body.address ) {
        return res.status(500).json("Request was malformed")
    }

    let response = await sqs.sendMsg(
        {
            imageName: body.imageName,
            imagePhrase: body.imagePhrase,
            walletAddress: body.address,
        },
        "https://sqs.us-east-1.amazonaws.com/046096408513/slime-queue"
    ).then(response => {
        console.log(response);
    });

    console.log(response);
    res.send("");
});

const server = http.createServer({}, app);
const wsServer = new ws.Server({server});
wsServer.on("connection", (socket, req) => {
    console.log("Connection started")
    // Clean this shit up
    const url = req.url
    const split = url.split("?")
    const entry = split[1].split("=")
    // Give client the id of the wallet
    socket.id = entry[1]
    console.log(socket.id + " opened.")
});

server.listen(port, () => console.log(`Example app listening on port ${port}!`));
