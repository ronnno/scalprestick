
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
    async buy(id, name, plainSecret) {
        const ownerId = Orbs.addressToBytes(sha256(id+name));
        const secret = Orbs.addressToBytes(sha256(plainSecret));


        const client = new Orbs.Client("http://localhost:8080", 42, Orbs.NetworkType.NETWORK_TYPE_TEST_NET);
        const [ tx, txid ] = client.createTransaction(this.employee.publicKey, this.employee.privateKey, this.contractName, "buyTicket", [Orbs.argBytes(ownerId), Orbs.argBytes(secret)]);

        const result = await client.sendTransaction(tx);

        console.log(result);

        try {
            const ticket = JSON.parse(result.outputArguments[0].value);
            this.secretStore[ticket.ID] = {
                id: id,
                name: name,
                plainSecret: plainSecret,
                secret: secret,
                ownerId: ownerId
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
            const plainSecret = this.secretStore[t.ID].plainSecret;
            let checkInLink = t.Status == "purchased" ? `<a href='http://localhost:4000/?ticketId=${t.ID}&id=${id}&name=${name}&plainSecret=${plainSecret}' target=_blank>Check in via link</a>` : "";

            row.innerHTML = `<div class="column column-20">${t.ID}</div><div class="column column-20"><strong>${t.Status}</strong></div>
            <div class="column column-20">${button}</div>
            <div class="column column-20">${checkInLink}</div>`;

            container.appendChild(row, container.childNodes[0]);
        }
    }

    async checkInButton(ticketId, secretOverride) {
        
        const ownerId = Orbs.addressToBytes(sha256(this.secretStore[ticketId].id + this.secretStore[ticketId].name));
        const secret = Orbs.addressToBytes(sha256(secretOverride || this.secretStore[ticketId].plainSecret));

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

    submitForm() {
        const id = document.getElementById('id_number');
        const name = document.getElementById('name');
        const plainSecret = document.getElementById('one_time_secret');

        this.buy(id.value, name.value, plainSecret.value);

        text.value = "";
        return false;
    }

    submitOnEnter(e) {
        if(e.which == 10 || e.which == 13) {
            e.preventDefault();
            this.submitForm();
        }
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
