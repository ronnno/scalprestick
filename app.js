
class App {
    constructor(Orbs, { endpoint, prismEndpoint, virtualChainId, contractName, channel, employee }, { publicKey, privateKey, address }, { friendPublicKey, friendPrivateKey, friendAddress }) {
        this.channel = channel;

        this.publicKey = publicKey;
        this.privateKey = privateKey;
        this.address = address;
        this.friendPublicKey = friendPublicKey;
        this.friendPrivateKey = friendPrivateKey;
        this.friendAddress = friendAddress;
        this.friendId = "12344123435644";
        this.friendName = "Hogeg";
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
    async buy(id, name, secret, orbsAddr) {
        const ownerId = Orbs.addressToBytes(sha256(id+name));
        const secretHash = Orbs.addressToBytes(sha256(secret));


        const client = new Orbs.Client("http://localhost:8080", 42, Orbs.NetworkType.NETWORK_TYPE_TEST_NET);
        const [ tx, txid ] = client.createTransaction(this.employee.publicKey, this.employee.privateKey, this.contractName, "buyTicket", [Orbs.argBytes(ownerId), Orbs.argBytes(secretHash), Orbs.argAddress(orbsAddr)]);

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
        container.innerHTML = "<div class=\"row\" style=\"margin-bottom: 10px;background: azure;\"><div class=\"column column-10\">Ticket ID</div>" +
            "<div class=\"column column-20\">Ticket Status</div> <div class=\"column column-20\">Check in </div> " +
            "<div class=\"column column-20\">Wrong info check in</div> <div class=\"column column-20\"> Allow a friend</div><div class=\"column column-20\"> Friend check in</div>" ;

        for (const t of this.tickets) {                
            const row = document.createElement("div");
            row.classList = ["row"];
            
            let buttonAddFriend = `<button onclick='javascript:window.app.allowFriendButton(${t.ID})'>Add Friend!</button>`;

            const id = this.secretStore[t.ID].id;
            const name = this.secretStore[t.ID].name;
            const secret = this.secretStore[t.ID].secret;
            const wrongSecret = "Wrong secret"
            let checkInLink = t.Status == "purchased" ? `<a href='http://localhost:4000/checkin?ticketId=${t.ID}&id=${id}&name=${name}&secret=${secret}' target=_blank>Check in link</a>` : "";
            let checkInViaLinkWrongInfo = t.Status == "purchased" ? `<a href='http://localhost:4000/checkin?ticketId=${t.ID}&id=${id}&name=${name}&secret=${wrongSecret}' target=_blank>Check in link</a>` : "";
            let checkAsFriend = t.Status == "purchased" ? `<a href='http://localhost:4000/checkin?ticketId=${t.ID}&id=${this.friendId}&name=${this.friendName}&secret=${secret}' target=_blank>Check in </a>` : "";

            row.innerHTML = `<div class="column column-10">${t.ID}</div><div class="column column-20"><strong>${t.Status}</strong></div>
            <div class="column column-20">${checkInLink}</div>
            <div class="column column-20">${checkInViaLinkWrongInfo}</div>
            <div class="column column-20">${buttonAddFriend}</div>
            <div class="column column-20">${checkAsFriend}</div>`
            container.appendChild(row, container.childNodes[0]);
        }
    }

    async allowFriendButton(ticketId, secretOverride) {
        const elem = this.secretStore[ticketId];
        const friendId = Orbs.addressToBytes(sha256(this.friendId + this.friendName));
        const secret = Orbs.addressToBytes(sha256(secretOverride || elem.secret));

        const client = new Orbs.Client("http://localhost:8080", 42, Orbs.NetworkType.NETWORK_TYPE_TEST_NET);
        const [ tx, txid ] = client.createTransaction(this.publicKey, this.privateKey, this.contractName, "addOwner", [Orbs.argUint32(ticketId), Orbs.argBytes(friendId), Orbs.argBytes(this.friendAddress)]);

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

        await this.buy(idInput.value, nameInput.value, secretInput.value, this.address);

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
