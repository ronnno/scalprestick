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

async function setAuditContract(contractName, owner, auditContractName) {
    const client = new Orbs.Client("http://localhost:8080", 42, Orbs.NetworkType.NETWORK_TYPE_TEST_NET);
    const [ tx, txid ] = client.createTransaction(owner.publicKey, owner.privateKey, contractName, "setAuditContract", [Orbs.argString(auditContractName)]);

    const result = await client.sendTransaction(tx);

    console.log(result);
}

async function buyTicket(contractName, employee, ownerId, secret, ownerOrbsAddr) {
    const client = new Orbs.Client("http://localhost:8080", 42, Orbs.NetworkType.NETWORK_TYPE_TEST_NET);
    const [ tx, txid ] = client.createTransaction(employee.publicKey, employee.privateKey, contractName, "buyTicket", [Orbs.argBytes(ownerId), Orbs.argBytes(secret), Orbs.argAddress(ownerOrbsAddr)]);

    const result = await client.sendTransaction(tx);

    console.log(result);

    return result.outputArguments[0].value
}

async function checkIn(contractName, employee, ownerId, secret, ticketId, confirmation) {
    const client = new Orbs.Client("http://localhost:8080", 42, Orbs.NetworkType.NETWORK_TYPE_TEST_NET);
    const [ tx, txid ] = client.createTransaction(employee.publicKey, employee.privateKey, contractName, "checkIn", [Orbs.argBytes(ownerId), Orbs.argBytes(secret), Orbs.argUint32(ticketId), Orbs.argString(confirmation)]);

    const result = await client.sendTransaction(tx);

    console.log(result);

    return result.outputArguments[0].value
}


function writeDeploymentFiles(contractName, employee, auditContractName) {
    const dc = "\n" +
        "const contractName = '" + contractName + "';\n" +
        "const employeePublicKey = Orbs.addressToBytes(\"" + Orbs.bytesToAddress(employee.publicKey) + "\");\n" +
        "const employeePrivateKey = Orbs.addressToBytes(\"" + Orbs.bytesToAddress(employee.privateKey) + "\");\n" +
        "const auditContractName = '" + auditContractName + "';";
    require("fs").writeFileSync("./dc.js", dc);

    const gate_sh = `#!/usr/bin/env bash\nnode gate.js ${contractName} ${Orbs.bytesToAddress(employee.publicKey)} ${Orbs.bytesToAddress(employee.privateKey)} ${auditContractName}`
    require("fs").writeFileSync("./gate.sh", gate_sh, {mode: "700"});
}

(async () => {
    const code = require("fs").readFileSync("./contract.go");
    const auditCode = require("fs").readFileSync("./audit/contract.go");

    const audit = require("./audit/flow");

    const owner = Orbs.createAccount();
    const user = Orbs.createAccount();
    const contractName = await deploy(owner, code);
    const auditContractName = await audit.deploy(owner, auditCode);

    console.log("deployed contract", contractName);
    console.log("deployed contract", auditContractName);

    const employee = Orbs.createAccount();
    await addEmployee(contractName, owner, employee);

    await setAuditContract(contractName, owner, auditContractName);

    console.log("ALL EVENTS", await audit.getEvents(auditContractName, employee))

    writeDeploymentFiles(contractName, employee, auditContractName);

    var enc = new TextEncoder(); // always utf-8

    const ownerId = enc.encode("id, name");
    const secret = enc.encode("One time secret");
    const ticket = JSON.parse(await buyTicket(contractName, employee, ownerId, secret, user.address));

    console.log("GOT A TICKET", ticket);

    console.log("ALL EVENTS", await audit.getEvents(auditContractName, employee))

    const status = await checkIn(contractName, employee, ownerId, secret, ticket.ID, "CONFIRMED");

    console.log(status);

    console.log("ALL EVENTS", await audit.getEvents(auditContractName, employee))

    const error = await checkIn(contractName, employee, ownerId, secret, ticket.ID, "CONFIRMED");
    console.log(error);
})();
