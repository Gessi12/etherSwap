// import { tokens } from "./helpers"
const Token = artifacts.require("./Token")

require('chai').use(require('chai-as-promised')).should()

const EVM_REVERT = "VM Exception while processing transaction: revert"

const tokens = (n) =>{
    return new web3.utils.BN(
        web3.utils.toWei(n.toString(),'ether')
    )
}

contract('Token',([deployer, receiver, exchange]) => {
    const name = "DApp Token"
    const symbol = "DAPP"
    const decimals = '18'
    const totalSupply = tokens(1000000).toString()
    let token

    

    beforeEach(async () =>{
        token = await Token.new()
    })

    describe('deployment', () => {
        it('tracks the name', async () => {
            //Fetch token from blockchain
            //Read token name here
            const result = await token.name()
            result.should.equal(name)
            //The token name is 'My Name'
        });
        
        it('tracks the symbol', async() => {
            const result = await token.symbol()
            result.should.equal(symbol)
        });
        
        it('tracks the decimals', async() => {
            const result = await token.decimals()
            result.toString().should.equal(decimals)
        });

        it('tracks the total supply', async() => {
            const result = await token.totalSupply()
            result.toString().should.equal(totalSupply.toString())
        });

        it('assigns the total supply to the deployer', async() => {
            const result = await token.balanceOf(deployer)
            result.toString().should.equal(totalSupply.toString())
        });

    });
    
    describe("sending tokens", ()=> {
        let result
        let amount

        describe("success", async ()=>{
            beforeEach(async ()=>{
                amount = tokens(1000)
                result =  await token.transfer(receiver,amount,{from: deployer})
            })
    
            it('transfer token balances',async () => {
                let balanceOf
                //After transfer
                balanceOf = await token.balanceOf(deployer)
                balanceOf.toString().should.equal(tokens(999000).toString())
                balanceOf = await token.balanceOf(receiver)
                balanceOf.toString().should.equal(tokens(1000).toString())
            })
    
            it('emits a Tranfer event',async ()=>{
                
                const log = result.logs[0]
                log.event.should.eq('Transfer')
                const event = log.args
                event.from.toString().should.equal(deployer,"from is correct")
                event.to.toString().should.equal(receiver,"to is correct")
                event.value.toString().should.equal(amount.toString(),'value is correct')
    
            })
        })

        describe("failure", async ()=>{
            it('rejects insufficient balances', async ()=>{
                let invalidAmount
                invalidAmount = tokens(10000000) // 100 millon - greater than totall supply
                await token.transfer(receiver,invalidAmount,{ from: deployer }).should.be.rejectedWith(EVM_REVERT);

                //Attempt transfer tokens, when you have no tokens
                invalidAmount = tokens(10000000) // 100 millon - greater than totall supply
                await token.transfer(receiver,invalidAmount,{ from: receiver }).should.be.rejectedWith(EVM_REVERT);
            })

            it('reject invalid recipients', async () =>{
                
                await token.transfer(0x0000000000000000000000000000000000000000,amount, { from : deployer }).should.be.rejectedWith('invalid address (argument="address", value=0, code=INVALID_ARGUMENT, version=address/5.6.1) (argument="_to", value=0, code=INVALID_ARGUMENT, version=abi/5.6.4)');
            })
        })

        
    })


    describe("approving tokens", ()=>{
        let result
        let amount

        beforeEach(async ()=>{
            amount = tokens(100)
            result = await token.approve(exchange,amount,{ from:deployer })
        })

        describe('success', ()=>{
            it('allocates on allowance for delegated token spending on change',async ()=>{
                const allowance = await token.allowance(deployer,exchange )
                allowance.toString().should.equal(amount.toString())
            })

            it('emits a Approval event',async ()=>{
                const log = result.logs[0]
                log.event.should.eq('Approval')
                const event = log.args
                event.owner.toString().should.equal(deployer,"owner is correct")
                event.spender.toString().should.equal(exchange,"spender is correct")
                event.value.toString().should.equal(amount.toString(),'value is correct')
    
            })
        })

        describe('failure', ()=>{
            it('allocates on allowance for delegated token spending',async ()=>{
                
            })
        })
    })

    describe("delegated token transfers", ()=> {
        let result
        let amount

        beforeEach(async ()=>{
            amount = tokens(1000)
            await token.approve(exchange,amount, {from:deployer})
        })

        describe("success", async ()=>{
            beforeEach(async ()=>{
                result =  await token.transferFrom(deployer, receiver, amount,{from: exchange})
            })
    
            it('transferFrom token balances',async () => {
                let balanceOf
                //After transfer
                balanceOf = await token.balanceOf(deployer)
                balanceOf.toString().should.equal(tokens(999000).toString())
                balanceOf = await token.balanceOf(receiver)
                balanceOf.toString().should.equal(tokens(1000).toString())
            })
    

            it('resets the allowance',async ()=>{
                const allowance = await token.allowance(deployer,exchange )
                allowance.toString().should.equal('0')
            })

            it('emits a TranferFrom event',async ()=>{
                
                const log = result.logs[0]
                log.event.should.eq('Transfer')
                const event = log.args
                event.from.toString().should.equal(deployer,"from is correct")
                event.to.toString().should.equal(receiver,"to is correct")
                event.value.toString().should.equal(amount.toString(),'value is correct')
    
            })
        })

        describe("failure", async ()=>{
            it('rejects insufficient balances', async ()=>{
                let invalidAmount
                invalidAmount = tokens(10000000) // 100 millon - greater than totall supply
                await token.transferFrom(deployer,invalidAmount,{ from: exchange }).should.be.rejectedWith('invalid address (argument="address", value="10000000000000000000000000", code=INVALID_ARGUMENT, version=address/5.6.1) (argument="_to", value="10000000000000000000000000", code=INVALID_ARGUMENT, version=abi/5.6.4)');

                //Attempt transfer tokens, when you have no tokens
                // invalidAmount = tokens(10000000) // 100 millon - greater than totall supply
                // await token.transferFrom(deployer,invalidAmount,{ from: receiver }).should.be.rejectedWith(EVM_REVERT);
            })

            it('reject invalid recipients', async () =>{
                
                await token.transferFrom(deployer,0x0000000000000000000000000000000000000000,amount, { from : exchange }).should.be.rejectedWith('invalid address (argument="address", value=0, code=INVALID_ARGUMENT, version=address/5.6.1) (argument="_to", value=0, code=INVALID_ARGUMENT, version=abi/5.6.4)');
            })
        })

        
    })


})