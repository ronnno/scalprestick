package main

import (
	"bytes"
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"github.com/orbs-network/orbs-contract-sdk/go/sdk/v1"
	"github.com/orbs-network/orbs-contract-sdk/go/sdk/v1/address"
	"github.com/orbs-network/orbs-contract-sdk/go/sdk/v1/state"
	"strconv"
)

var PUBLIC = sdk.Export(totalSupply, addEmployee, buyTicket, checkIn)
var SYSTEM = sdk.Export(_init)

type Ticket struct {
	ID uint32
	OwnerId   []byte
	Secret []byte
	Status    string
	Timestamp uint64
}

const TOTAL_SUPPLY = 10000
const MAX_TICKETS_PER_ID = 5

func _init() {
	state.WriteUint32(totalSupplyKey(), TOTAL_SUPPLY)
	state.WriteBytes([]byte("OWNER"), address.GetSignerAddress())
}

func decreaseTotalSupplyBy(difference uint32) {
	state.WriteUint32(totalSupplyKey(), totalSupply() - difference)
}

func totalSupplyKey()[]byte {
	return []byte("total_supply")
}

func totalSupply() uint32 {
	return state.ReadUint32(totalSupplyKey())
}

func ticketIdKey(id uint32) string {
	return strconv.FormatUint(uint64(id), 10)
}

func saveTicket(id string, t Ticket) {
	state.WriteUint32([]byte(id + "_id"), t.ID)
	state.WriteBytes([]byte(id + "_ownerId"), t.OwnerId)
	state.WriteBytes([]byte(id + "_secret"), t.Secret)
	state.WriteString([]byte(id + "_status"), t.Status)
}

func getTicket(id string) Ticket {
	return Ticket{
		ID: state.ReadUint32([]byte(id + "_id")),
		OwnerId: state.ReadBytes([]byte(id + "_ownerId")),
		Secret: state.ReadBytes([]byte(id + "_secret")),
		Status:  state.ReadString([]byte(id + "_status")),
	}
}

func checkIn(ownerId []byte, secret []byte, id uint32, confirmation string) string {
	key := ticketIdKey(id)
	ticket := getTicket(key)

	if !("CONFIRMED" == confirmation) {
		panic(fmt.Sprintf("not confirmed: %s", confirmation))
	}

	if !bytes.Equal(state.ReadBytes([]byte("EMPLOYEE")), address.GetSignerAddress()) {
		panic("not authorized!")
	}

	if !bytes.Equal(ownerId, ticket.OwnerId) {
		// log invalid access to ticket
		panic("invalid owner!")
	}

	if !bytes.Equal(secret, ticket.Secret) {
		// log invalid access to ticket
		panic("invalid secret!")
	}

	if ticket.Status != "purchased" {
		// log invalid access to ticket
		panic("invalid ticket status!")
	}

	ticket.Status = "checked in"

	saveTicket(key, ticket)

	data, _ := json.Marshal(ticket)
	return string(data)
}

func buyTicket(ownerId []byte, secret []byte) string {
	if !bytes.Equal(state.ReadBytes([]byte("EMPLOYEE")), address.GetSignerAddress()) {
		panic("not authorized!")
	}

	if state.ReadUint32(getOwnerCounterStateKey(ownerId)) >= MAX_TICKETS_PER_ID {
		panic("max allowance per owner reached!")
	}

	supply := totalSupply()
	ticketId := supply - 1

	decreaseTotalSupplyBy(1)

	ticket := Ticket{
		ID: ticketId,
		OwnerId: ownerId,
		Secret: secret,
		Status:  "purchased",
	}
	saveTicket(ticketIdKey(ticketId), ticket)
	incrementUserCounter(ownerId)

	data, _ := json.Marshal(ticket)
	return string(data)
}

func incrementUserCounter(ownerId []byte) {
	stateKeyOwnerCounter := getOwnerCounterStateKey(ownerId)
	counter := state.ReadUint32(stateKeyOwnerCounter)
	counter++
	state.WriteUint32(stateKeyOwnerCounter, counter)
}

func getOwnerCounterStateKey(ownerId []byte) []byte {
	return append([]byte("OWNER_COUNTER_"), ownerId...)
}

func addEmployee(employee []byte) {
	if !bytes.Equal(state.ReadBytes([]byte("OWNER")), address.GetSignerAddress()) {
		panic("not allowed!")
	}

	state.WriteBytes([]byte("EMPLOYEE"), employee)
}

func hash(payload []byte) []byte {
	return sha256.New().Sum(payload)
}