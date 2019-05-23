package main

import (
	"encoding/json"
	"fmt"
	"github.com/orbs-network/contract-library-experiment/collections"
	"github.com/orbs-network/orbs-contract-sdk/go/sdk/v1"
	"github.com/orbs-network/orbs-contract-sdk/go/sdk/v1/address"
	"github.com/orbs-network/orbs-contract-sdk/go/sdk/v1/env"
)

var PUBLIC = sdk.Export(addEvent, getEvents)
var SYSTEM = sdk.Export(_init)

type LoggingEvent struct {
	CallerContractAddress []byte
	Timestamp             uint64

	EventType string
	OwnerId   []byte
}

func _init() {

}

func addEvent(eventString string) string {
	event := &LoggingEvent{}
	if err := json.Unmarshal([]byte(eventString), event); err != nil {
		panic(fmt.Sprintf("failed to unmarshal: %s", err))
	}

	event.Timestamp = env.GetBlockTimestamp()
	event.CallerContractAddress = address.GetCallerAddress()

	serializedEvent, _ := json.Marshal(event)

	events := collections.NewStringList("events")
	events.Add(string(serializedEvent))

	return string(serializedEvent)
}

func getEvents() string {
	var allEvents []LoggingEvent
	events := collections.NewStringList("events")
	events.Iterate(func(id uint64, item interface{}) bool {
		e := LoggingEvent{}
		json.Unmarshal([]byte(item.(string)), &e)
		allEvents = append(allEvents, e)
		return true
	})

	data, _ := json.Marshal(allEvents)
	return string(data)
}
