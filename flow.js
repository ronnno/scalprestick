const Orbs = require("orbs-client-sdk")

async function deploy(owner, code) {
    const contractName = `T${new Date().getTime()}`;

    const client = new Orbs.Client("http://localhost:8080", 42, Orbs.NetworkType.NETWORK_TYPE_TEST_NET);
    const [ tx, txid ] = client.createTransaction(owner.publicKey, owner.privateKey, "_Deployments", "deployService", [Orbs.argString(contractName), Orbs.argUint32(1), Orbs.argBytes(code)])
    const result = await client.sendTransaction(tx);

    console.log(result);

    return contractName;
}

async function addEmployee(contractName, owner, employee) {
    const client = new Orbs.Client("http://localhost:8080", 42, Orbs.NetworkType.NETWORK_TYPE_TEST_NET);
    const [ tx, txid ] = client.createTransaction(owner.publicKey, owner.privateKey, contractName, "addEmployee", [Orbs.argBytes(Orbs.addressToBytes(employee.address))]);

    const result = await client.sendTransaction(tx);

    console.log(result);
}

async function buyTicket(contractName, employee, patron, secret) {
    const client = new Orbs.Client("http://localhost:8080", 42, Orbs.NetworkType.NETWORK_TYPE_TEST_NET);
    const [ tx, txid ] = client.createTransaction(employee.publicKey, employee.privateKey, contractName, "buyTicket", [Orbs.argBytes(Orbs.addressToBytes(patron.address)), Orbs.argBytes(secret)]);

    const result = await client.sendTransaction(tx);

    console.log(result);

    return result.outputArguments[0].value
}

async function checkIn(contractName, patron, ticketId) {
    const client = new Orbs.Client("http://localhost:8080", 42, Orbs.NetworkType.NETWORK_TYPE_TEST_NET);
    const [ tx, txid ] = client.createTransaction(patron.publicKey, patron.privateKey, contractName, "checkIn", [Orbs.argUint32(ticketId)]);

    const result = await client.sendTransaction(tx);

    console.log(result);

    return result.outputArguments[0].value
}


(async () => {
    const code = require("fs").readFileSync("./contract.go");

    const owner = Orbs.createAccount();
    const contractName = await deploy(owner, code);

    console.log("deployed contract", contractName);

    const employee = Orbs.createAccount();
    await addEmployee(contractName, owner, employee);

    const patron = Orbs.createAccount();
    const secret = new Uint8Array(0, [])
    const ticketId = await buyTicket(contractName, employee, patron, secret);

    console.log("GOT A TICKET", ticketId)

    const status = await checkIn(contractName, patron, ticketId);

    console.log(status);

    const error = await checkIn(contractName, patron, ticketId);
    console.log(error);
})();
