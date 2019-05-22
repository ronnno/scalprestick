
class App {
    constructor(Orbs, { endpoint, prismEndpoint, virtualChainId, contractName, channel, employee }, { publicKey, privateKey, address }) {
        this.channel = channel;

        this.publicKey = publicKey;
        this.privateKey = privateKey;
        this.address = address;
        this.virtualChainId = virtualChainId;
        this.prismEndpoint = prismEndpoint;
        this.contractName = contractName;
        this.employee = employee;

        this.tickets = [];

        this.secretStore = {};
    }

    generateSecret() {
        document.getElementById('one_time_secret').value = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    async buy(id, name, secret) {
        const ownerId = Orbs.addressToBytes(sha256(id+name));
        const secretHash = Orbs.addressToBytes(sha256(secret));


        const client = new Orbs.Client("http://localhost:8080", 42, Orbs.NetworkType.NETWORK_TYPE_TEST_NET);
        const [ tx, txid ] = client.createTransaction(this.employee.publicKey, this.employee.privateKey, this.contractName, "buyTicket", [Orbs.argBytes(ownerId), Orbs.argBytes(secretHash)]);

        const result = await client.sendTransaction(tx);

        console.log(result);

        try {
            const ticket = JSON.parse(result.outputArguments[0].value);
            this.secretStore[ticket.ID] = {
                id: id,
                name: name,
                secret: secret
            };

            this.tickets.push(ticket);
            this.renderTickets();

            // const messageId = await this.conversation.sendMessageToChannel(this.channel, text);
            console.log(`got a ticket!`, ticket);
            this.generateSecret()
        } catch (e) {
            alert(result.outputArguments[0].value)
        }

        return false;
    }

    async renderTickets() {
        const container = document.getElementById("tickets");
        container.innerHTML = "";
        
        for (const t of this.tickets) {                
            const row = document.createElement("div");
            row.classList = ["row"];
            
            let button = t.Status == "purchased" ? `<button onclick='javascript:window.app.checkInButton(${t.ID})'>Check in!</button><button onclick='javascript:window.app.checkInButton(${t.ID}, "wrong secret")'>wrong secret!</button>` : ""

            const id = this.secretStore[t.ID].id;
            const name = this.secretStore[t.ID].name;
            const secret = this.secretStore[t.ID].secret;
            let checkInLink = t.Status == "purchased" ? `<a href='http://localhost:4000/?ticketId=${t.ID}&id=${id}&name=${name}&secret=${secret}' target=_blank>Check in via link</a>` : "";

            row.innerHTML = `<div class="column column-20">${t.ID}</div><div class="column column-20"><strong>${t.Status}</strong></div>
            <div class="column column-20">${button}</div>
            <div class="column column-20">${checkInLink}</div>`;

            container.appendChild(row, container.childNodes[0]);
        }
    }

    async checkInButton(ticketId, secretOverride) {
        const elem = this.secretStore[ticketId];
        const ownerId = Orbs.addressToBytes(sha256(elem.id + elem.name));
        const secret = Orbs.addressToBytes(sha256(secretOverride || elem.secret));

        const client = new Orbs.Client("http://localhost:8080", 42, Orbs.NetworkType.NETWORK_TYPE_TEST_NET);
        const [ tx, txid ] = client.createTransaction(this.employee.publicKey, this.employee.privateKey, this.contractName, "checkIn", [Orbs.argBytes(ownerId), Orbs.argBytes(secret), Orbs.argUint32(ticketId)]);

        const result = await client.sendTransaction(tx);

        try {
            const ticket = JSON.parse(result.outputArguments[0].value);
            const t = _.find(this.tickets, { ID: ticket.ID });
            _.assignIn(t, ticket);

            this.renderTickets();
        } catch (e) {
            console.log(e)
            alert(result.outputArguments[0].value);
        }

        return false;
    }

    async submitForm() {
        const idInput = document.getElementById('id_number');
        const nameInput = document.getElementById('name');
        const secretInput = document.getElementById('one_time_secret');

        await this.buy(idInput.value, nameInput.value, secretInput.value);

        return false;
    }

    showInfo() {
        this.setElementValue("address", this.address);
        this.setElementValue("contract_name", this.contractName);
    }

    setElementValue(id, value) {
        document.getElementById(id).innerHTML = value;
    }
}
