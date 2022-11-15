const express = require("express");
const path = require("path")
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

app.post("/msg", async (req, res) => {
    const body = req.body

    if (!body || !body.imageName || !body.imagePhrase || !body.address ) {
        return res.status(500).json("Request was malformed")
    }

   await axios.post("https://api.openai.com/v1/images/generations", {
        "prompt" : body.imagePhrase,
        "n": 1,
        "size": "1024x1024"
    }, {
        headers : {
            "Content-Type" : "application/json",
            "Authorization" : `Bearer ${process.env.DALLE_KEY}`,
        }
    }).then(response => {
        console.log(response.data.data[0])

        res.status(200).json({
            "url" : response.data.data[0].url
        })
    });

//    res.status(200).json({ url : "https://oaidalleapiprodscus.blob.core.windows.net/private/org-7AQD1XyulZT8RpG1XuAYnGHe/user-z7qCChpkj92DmuY1xoVNXSuj/img-KFURWaZA87NQHC3WW3vQKk26.png?st=2022-11-15T02%3A06%3A03Z&se=2022-11-15T04%3A06%3A03Z&sp=r&sv=2021-08-06&sr=b&rscd=inline&rsct=image/png&skoid=6aaadede-4fb3-4698-a8f6-684d7786b067&sktid=a48cca56-e6da-484e-a814-9c849652bcb3&skt=2022-11-15T03%3A06%3A03Z&ske=2022-11-16T03%3A06%3A03Z&sks=b&skv=2021-08-06&sig=wi9aDP7%2B8TnIyM7YiazYjdmTWubc/jQxqN5UVeayJZI%3D"})
});

const server = http.createServer({}, app);
server.listen(port, () => console.log(`Example app listening on port ${port}!`));
