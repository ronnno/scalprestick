
class App {
    constructor(Orbs, { endpoint, prismEndpoint, virtualChainId, contractName, channel, employee }, { publicKey, privateKey, address }) {
        this.channel = channel;
        // this.conversation = new Conversation(Orbs, {
        //     endpoint,
        //     virtualChainId,
        //     contractName
        // }, {
        //     publicKey,
        //     privateKey
        // });

        this.address = address;
        this.virtualChainId = virtualChainId;
        this.prismEndpoint = prismEndpoint;
        this.contractName = contractName;
        this.employee = employee;
    }

    async send(text) {
        const secret = Orbs.addressToBytes(sha256(text));

        const client = new Orbs.Client("http://localhost:8080", 42, Orbs.NetworkType.NETWORK_TYPE_TEST_NET);
        const [ tx, txid ] = client.createTransaction(this.employee.publicKey, this.employee.privateKey, this.contractName, "buyTicket", [Orbs.argBytes(Orbs.addressToBytes(this.address)), Orbs.argBytes(secret)]);
    
        const result = await client.sendTransaction(tx);
    
        console.log(result);
    
        const tickedId = result.outputArguments[0].value

        console.log(tickedId);
        // const messageId = await this.conversation.sendMessageToChannel(this.channel, text);
        console.log(`got a ticket! ${tickedId}`);
        return false;
    }

    async run() {
        this.conversation.scroll(this.channel, 1, (messages) => {
            for (const m of messages) {
                const container = document.getElementById("messages");
                const date = (new Date(m.Timestamp/1000000).toISOString()).substr(11, 12);
                const author = m.Author.substr(0, 6);
                const prismLink = `${this.prismEndpoint}/vchains/${this.virtualChainId}/block/${m.BlockHeight}`;
                const row = document.createElement("div");
                row.classList = ["row"];
                row.innerHTML = `<div class="column column-20"><a href="${prismLink}" target="_blank">${date}</a> <strong title="0x${m.Author}">${author}</strong>:</div><div class="column column-90">${m.Message}</div>`;

                container.appendChild(row, container.childNodes[0]);
            }
        });
    }

    submitForm() {
        const text = document.getElementById('message_content');
        this.send(text.value);
        text.value = "";
        window.scrollTo(0,document.body.scrollHeight);
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
