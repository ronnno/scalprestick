const Orbs = require("orbs-client-sdk");

async function deploy(owner, code) {
    const contractName = `A${new Date().getTime()}`;

    const client = new Orbs.Client("http://localhost:8080", 42, Orbs.NetworkType.NETWORK_TYPE_TEST_NET);
    const [ tx, txid ] = client.createTransaction(owner.publicKey, owner.privateKey, "_Deployments", "deployService", [Orbs.argString(contractName), Orbs.argUint32(1), Orbs.argBytes(code)])
    const result = await client.sendTransaction(tx);

    console.log(result);

    return contractName;
}

async function addEvent(contractName, owner, auditEvent) {
    const client = new Orbs.Client("http://localhost:8080", 42, Orbs.NetworkType.NETWORK_TYPE_TEST_NET);
    const [ tx, txid ] = client.createTransaction(owner.publicKey, owner.privateKey, contractName, "addEvent", [Orbs.argString(JSON.stringify(auditEvent))]);

    const result = await client.sendTransaction(tx);

    console.log(result);
    return JSON.parse(result.outputArguments[0].value)
}

async function getEvents(contractName, owner) {
    const client = new Orbs.Client("http://localhost:8080", 42, Orbs.NetworkType.NETWORK_TYPE_TEST_NET);
    const query  = client.createQuery(owner.publicKey, contractName, "getEvents", []);

    const result = await client.sendQuery(query);

    console.log(result);
    return JSON.parse(result.outputArguments[0].value)
}

if (!module.parent) {
    (async () => {
        const code = require("fs").readFileSync(`${__dirname}/contract.go`);

        const owner = Orbs.createAccount();
        const contractName = await deploy(owner, code);

        console.log("deployed contract", contractName);

        const savedEvent = await addEvent(contractName, owner, {
            EventType: "purchase",
            // OwnerID: new Uint8Array([1, 2, 3]),
        });

        console.log("Saved event", savedEvent)

        const allEvents = await getEvents(contractName, owner);
        console.log("All events", allEvents)
    })();
}

