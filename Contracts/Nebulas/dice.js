/**
 * Dice Nebulas Version
 * @author: MinakoKojima <lychees67@gmail.com>
 * @version: 1.0
 */

"use strict"

const BigNumberStorageDescriptor = {
    parse(value) {
        return new BigNumber(value);
    },
    stringify(o) {
        return o.toString(10);
    }
}

class OwnerableContract {
    constructor() {
        LocalContractStorage.defineProperties(this, {
            owner: null
        })
        LocalContractStorage.defineMapProperties(this, {
            "admins": null
        })
    }

    init() {
        const {
            from
        } = Blockchain.transaction
        this.admins.set(from, "true")
        this.owner = from
    }

    onlyAdmins() {
        const {
            from
        } = Blockchain.transaction
        if (!this.admins.get(from)) {
            throw new Error("Sorry, You don't have the permission as admins.")
        }
    }

    onlyContractOwner() {
        const {
            from
        } = Blockchain.transaction
        if (this.owner !== from) {
            throw new Error("Sorry, But you don't have the permission as owner.")
        }
    }

    getContractOwner() {
        return this.owner
    }

    getAdmins() {
        return this.admins
    }

    setAdmins(address) {
        this.onlyContractOwner()
        this.admins.set(address, "true")
    }

    withdraw(value) {
        // Admins can ONLY REQUEST, Owner will GOT THE MONEY ANYWAY
        this.onlyAdmins()
        // Only the owner can have the withdrawed fund, so be careful
        return Blockchain.transfer(this.owner, new BigNumber(value))
    }

    getBalance() {
        var balance = new BigNumber(Blockchain.getAccountState(this.myAddress).balance);
        return balance
    }

    withdrawAll() {
        this.withdraw(this.getBalance())
    }
}

class DiceContract extends OwnerableContract {
    constructor() {
        super()
        LocalContractStorage.defineProperties(this, {
            referCut: BigNumberStorageDescriptor,
        })
        LocalContractStorage.defineMapProperties(this, {
        })
    }

    _sendCommissionTo(referer, actualCost) {
        const {
            referCut
        } = this
        if (referer !== "") {
            const withoutCut = new BigNumber(100).dividedToIntegerBy(referCut)
            const cut = actualCost.dividedToIntegerBy(withoutCut)
            Blockchain.transfer(referer, cut)
        }
    }

    _event(name, indexes) {
        var k = {};
        k[name] = indexes;
        Event.Trigger("Dice", k);
    }

    // referer by default is empty
    bet(referer = "", bet_number = 50, is_under = true) {
        var {
            from,
            value
        } = Blockchain.transaction

        this._sendCommissionTo(referer, value)

        var roll_number = Math.floor(Math.random() * 100);
        if (is_under) {
            if (bet_number < roll_number) {
                Blockchain.transfer(from, new BigNumber(value).times(96).dividedToIntegerBy(bet_number))
            }
        } else {
            if (bet_number > roll_number) {
                Blockchain.transfer(from, new BigNumber(value).times(96).dividedToIntegerBy(99 - bet_number))
            }
        }
        this._event("Bet", { number: roll_number });
    }



    init() {
        super.init()
        const {
            from
        } = Blockchain.transaction
        this.referCut = new BigNumber(1)
        this.admins.set(from, "true")
        this.owner = from
    }
}

module.exports = DiceContract