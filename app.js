
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
    }

    async send(text) {
        const secret = Orbs.addressToBytes(sha256(text));

        const client = new Orbs.Client("http://localhost:8080", 42, Orbs.NetworkType.NETWORK_TYPE_TEST_NET);
        const [ tx, txid ] = client.createTransaction(this.employee.publicKey, this.employee.privateKey, this.contractName, "buyTicket", [Orbs.argBytes(Orbs.addressToBytes(this.address)), Orbs.argBytes(secret)]);
    
        const result = await client.sendTransaction(tx);
    
        console.log(result);
    
        const ticket = JSON.parse(result.outputArguments[0].value)
        this.tickets.push(ticket);
        this.renderTickets();

        // const messageId = await this.conversation.sendMessageToChannel(this.channel, text);
        console.log(`got a ticket!`, ticket);
        return false;
    }

    async renderTickets() {
        const container = document.getElementById("tickets");
        container.innerHTML = "";

        for (const t of this.tickets) {                
            const row = document.createElement("div");
            row.classList = ["row"];

            let button = t.Status == "purchased" ? `<button onclick='javascript:window.app.checkInButton(${t.ID})'>Check in!</button>` : ""

            row.innerHTML = `<div class="column column-20">${t.ID}</div><div class="column column-20"><strong>${t.Status}</strong></div>
            <div class="column column-20">${button}</div>`;

            container.appendChild(row, container.childNodes[0]);
        }
    }

    async checkInButton(ticketId) {
        const client = new Orbs.Client("http://localhost:8080", 42, Orbs.NetworkType.NETWORK_TYPE_TEST_NET);
        const [ tx, txid ] = client.createTransaction(this.publicKey, this.privateKey, this.contractName, "checkIn", [Orbs.argUint32(ticketId)]);

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
        const text = document.getElementById('message_content');
        this.send(text.value);
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
        this.setElementValue("channel", this.channel);
        this.setElementValue("contract_name", this.contractName);
    }

    setElementValue(id, value) {
        document.getElementById(id).innerHTML = value;
    }
}
