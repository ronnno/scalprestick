const Orbs = require("orbs-client-sdk");

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

async function buyTicket(contractName, employee, ownerId, secret) {
    const client = new Orbs.Client("http://localhost:8080", 42, Orbs.NetworkType.NETWORK_TYPE_TEST_NET);
    const [ tx, txid ] = client.createTransaction(employee.publicKey, employee.privateKey, contractName, "buyTicket", [Orbs.argBytes(ownerId), Orbs.argBytes(secret)]);

    const result = await client.sendTransaction(tx);

    console.log(result);

    return result.outputArguments[0].value
}

async function checkIn(contractName, employee, ownerId, secret, ticketId) {
    const client = new Orbs.Client("http://localhost:8080", 42, Orbs.NetworkType.NETWORK_TYPE_TEST_NET);
    const [ tx, txid ] = client.createTransaction(employee.publicKey, employee.privateKey, contractName, "checkIn", [Orbs.argBytes(ownerId), Orbs.argBytes(secret), Orbs.argUint32(ticketId)]);

    const result = await client.sendTransaction(tx);

    console.log(result);

    return result.outputArguments[0].value
}


function writeDeploymentFiles(contractName, employee) {
    const dc = "\n" +
        "const contractName = '" + contractName + "';\n" +
        "const employeePublicKey = Orbs.addressToBytes(\"" + Orbs.bytesToAddress(employee.publicKey) + "\");\n" +
        "const employeePrivateKey = Orbs.addressToBytes(\"" + Orbs.bytesToAddress(employee.privateKey) + "\");";
    require("fs").writeFileSync("./dc.js", dc);

    const gate_sh = `#!/usr/bin/env bash\nnode gate.js ${contractName} ${Orbs.bytesToAddress(employee.publicKey)} ${Orbs.bytesToAddress(employee.privateKey)}`
    require("fs").writeFileSync("./gate.sh", gate_sh, {mode: "700"});
}

(async () => {
    const code = require("fs").readFileSync("./contract.go");

    const owner = Orbs.createAccount();
    const contractName = await deploy(owner, code);

    console.log("deployed contract", contractName);

    const employee = Orbs.createAccount();
    console.log({
        contractName: contractName,
        employee: {
            publicKey: `Orbs.addressToBytes("${Orbs.bytesToAddress(employee.publicKey)}")`,
            privateKey: `Orbs.addressToBytes("${Orbs.bytesToAddress(employee.privateKey)}")`,
        }
    });
    await addEmployee(contractName, owner, employee);

    writeDeploymentFiles(contractName, employee);

    var enc = new TextEncoder(); // always utf-8

    const ownerId = enc.encode("id, name");
    const secret = enc.encode("One time secret");
    const ticket = JSON.parse(await buyTicket(contractName, employee, ownerId, secret));

    console.log("GOT A TICKET", ticket);

    const status = await checkIn(contractName, employee, ownerId, secret, ticket.ID);

    console.log(status);

    const error = await checkIn(contractName, employee, ownerId, secret, ticket.ID);
    console.log(error);
})();
