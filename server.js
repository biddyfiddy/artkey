const express = require("express");
const sqs = require("./src/aws/sqs");
const s3 = require("./src/aws/s3");
const ddb = require("./src/aws/dynamo");
const path = require("path")
const bodyParser = require("body-parser")



const app = express();
const port = process.env.PORT || 3001;

app.use(bodyParser.text());

//app.use(express.json());
app.post('/complete', async function(req,res){
    console.log(req.body);
    console.log(req.body.Token);
    return res.status(200);
})



//app.use(express.static(path.join(__dirname, 'build')));
/*app.post("/complete", async (req, res) => {
    console.log(req.body);
    res.end();
})*/
/*app.post("/complete", async (req, res) => {
        console.log(req)
        console.log(JSON.parse(req.body));*/
/*

    const s3Object = body['Records'][0]['s3']
    const objectKey = s3Object['object']['key']
    const url = await s3.getObjectUrl(objectKey, "image.png");
    const split = objectKey.split("/")
    const walletAddress = split[1]

    wsServer.clients.forEach(function each(client) {

        if (client.id == walletAddress) {
            client.send(JSON.stringify({walletAddress: walletAddress, imageKey: url}))
        }
    });
*/

/*    res.status(200).send("Job Complete")
});*/

/*app.post("/situation/", async (req, res) => {
    let walletAddress = req.params.walletAddress;
    let getSituationPromise = ddb.getSituationFromWallet(walletAddress);
    let situation;

    await getSituationPromise.then(function (data) {
        if (data == null) {
            res.status(500).send("Unable to retrieve wallet addresses");
        } else {
            situation = data.Item;
        }
    });

    if (situation && situation.imageKey) {
        /!* Get yerl from s3 key *!/
        let url = await s3.getObjectUrl(situation.imageKey, "image.png");
        situation.imageKey = url;
    }
    res.send(situation);
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



    /!*
    let wallets;
    let getAllPromise = ddb.getWhiteListedWalletsPromise();
    await getAllPromise.then(function (data) {
      if (data == null) {
        res.status(500).send("Unable to retrieve wallet addresses");
      } else {
        wallets = data.Items.map((item) => {
          return item.walletAddress;
        });
      }
    });

    let walletAddress = req.body.accounts[0];
    // Wallet not whitelisted
    if (wallets.indexOf(walletAddress) == -1) {
      res.status(500).send();
    }

    let imagePhrase = req.body.imagePhrase;
    let imageName = req.body.imageName;

    let updatePromise = ddb.updateJob(walletAddress, imagePhrase, imageName);
    await updatePromise.then(function (data) {
      if (data == null) {
        res.status(500).send("Unable to update job");
      }
    });

    sqs.sendMsg(
      {
        imageName: imageName,
        imagePhrase: imagePhrase,
        walletAddress: walletAddress,
      },
      "https://sqs.us-east-1.amazonaws.com/810159986268/slime-queue"
    );
    res.send("");*!/
});*/

/*const wsServer = new ws.Server({server});
wsServer.on("connection", (socket, req) => {

    // Clean this shit up
    const url = req.url
    const split = url.split("?")
    const entry = split[1].split("=")
    // Give client the id of the wallet
    socket.id = entry[1]
});*/

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
