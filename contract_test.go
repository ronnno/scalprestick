package main

import (
	. "github.com/orbs-network/orbs-contract-sdk/go/testing/unit"
	"github.com/stretchr/testify/require"
	"testing"
)

func Test_Init(t *testing.T) {
	caller := AnAddress()

	InServiceScope(nil, caller, func(m Mockery) {
		_init()

		require.EqualValues(t, totalSupply(), 10000)
	})
}

func Test_BuyAndCheckIn(t *testing.T) {
	owner := AnAddress()
	employee := AnAddress()
	patron := AnAddress()

	InServiceScope(nil, owner, func(m Mockery) {
		_init()
		addEmployee(employee)
	})

	InServiceScope(nil, employee, func(mockery Mockery) {
		secret := hash([]byte("tz 123, Kirill"))
		_ := buyTicket(employee, secret, patron)

	})

	//for _, d := range diffs {
	//	fmt.Println(string(d.Key), d.Value)
	//}
}
