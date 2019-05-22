const Orbs = require("orbs-client-sdk")
const sha256 = require("sha256")

async function checkIn(contractName, employee, ownerId, secret, ticketId) {
    const client = new Orbs.Client("http://localhost:8080", 42, Orbs.NetworkType.NETWORK_TYPE_TEST_NET);
    const [ tx, txid ] = client.createTransaction(employee.publicKey, employee.privateKey, contractName, "checkIn", [Orbs.argBytes(ownerId), Orbs.argBytes(secret), Orbs.argUint32(ticketId)]);

    const result = await client.sendTransaction(tx);

    console.log(result);

    return result.outputArguments[0].value
}

console.log(process.argv)
const contractName = process.argv[2];
const employee = {
    publicKey: Orbs.addressToBytes(process.argv[3]),
    privateKey: Orbs.addressToBytes(process.argv[4]),
}

const express = require('express')
const app = express()
const port = 4000

app.use(express.urlencoded());

app.get('/', async (req, res) => {
    const { id, name, plainSecret, ticketId } = req.query;
    const ownerId = sha256(id+name);
    const secret = sha256(plainSecret);

    const status = await checkIn(contractName, employee, Orbs.addressToBytes(ownerId), Orbs.addressToBytes(secret), ticketId);
    res.send(status);
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`))

