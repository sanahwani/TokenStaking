const Token=artifacts.require('Token')
const EthSwap=artifacts.require('EthSwap')

require('chai')
	.use(require('chai-as-promised'))
	.should()

//helper fn to cnvrt ether to wei(smallest subdivsion)
function tokens(n){
	return web3.utils.toWei(n,'ether');
}	

//using 2 users in this case. fetching accounts individualy. deployer-frst account who deploys cntrct. investor- who will call buy tokens fn
//contract('EthSwap',(accounts)=>{ or
contract('EthSwap',([deployer, investor])=>{	
	let token, ethSwap

	//putting common code here
	before(async()=>{
	token =await Token.new()
	ethSwap=await EthSwap.new(token.address)
	 //transfer all tokens to ethswap (1 milliom)
   await token.transfer(ethSwap.address, tokens('1000000')) //usng tokens helper fn, wl cnvrt 1M ether into 1M wei
	})


	describe('Token deployment', async()=>{
		it('contract has a name', async()=>{
			const name=await token.name()
			assert.equal(name,'UG Token')
		})
	})
	describe('EthSwap deployment', async()=>{
		it('contract has a name', async()=>{
			const name=await ethSwap.name()
			assert.equal(name,'EthSwap Instant Exchange')
		})
		it('contract has tokens', async()=>{
		
			let balance=await token.balanceOf(ethSwap.address)
			assert.equal(balance.toString(),tokens('1000000'))
		})
	})

	describe('buyTokens()', async()=>{
		let result

		before (async()=>{
			//purchase tokens before each example
			result=await ethSwap.buyTokens({from : investor, value:web3.utils.toWei('1', 'ether')})
		})
		it('allows user to Instantly purchase tokens from ethswap for a fixed price', async()=>{
			//chcking investor token balance after purchase
			let investorBalance= await token.balanceOf(investor)
			assert.equal(investorBalance.toString(), tokens('100'))	
			//chck ethswap bal after purchase
			let ethSwapBalance
			ethSwapBalance=await token.balanceOf(ethSwap.address)
			assert.equal(ethSwapBalance.toString(),tokens('999900'))
			//check ether Balance went up
			ethSwapBalance=await web3.eth.getBalance(ethSwap.address)
			assert.equal(ethSwapBalance.toString(), web3.utils.toWei('1','Ether'))

			//check logs to ensure event was emitted with correct data
			//console.log(result.logs[0].args)
			const event=result.logs[0].args
			assert.equal(event.account,investor)
			assert.equal(event.token, token.address)
			assert.equal(event.amount.toString(),tokens('100').toString())
			assert.equal(event.rate.toString(),'100')


			
		})
	})

	describe('sellTokens()', async()=>{
		let result

		before (async()=>{
			//investor must apprve tokens b4 purchase
			await token.approve(ethSwap.address,tokens('100'),{from: investor} )
			//investor sells tokens
			result= await ethSwap.sellTokens(tokens('100'),{from: investor})
				})
		it('allows user to Instantly sell tokens to ethswap for a fixed price', async()=>{
			//chcking investor token balance goes down to 0
			let investorBalance= await token.balanceOf(investor)
			assert.equal(investorBalance.toString(), tokens('0'))	

			//check ethSwap balance aftr invstr sells
			let ethSwapBalance
			ethSwapBalance=await token.balanceOf(ethSwap.address)
			assert.equal(ethSwapBalance.toString(),tokens('1000000'))
			//check ether Balance went down
			ethSwapBalance=await web3.eth.getBalance(ethSwap.address)
			assert.equal(ethSwapBalance.toString(), web3.utils.toWei('0','Ether'))


			//check logs to ensure event was emitted with correct data
			const event=result.logs[0].args
			assert.equal(event.account,investor)
			assert.equal(event.token, token.address)
			assert.equal(event.amount.toString(),tokens('100').toString())
			assert.equal(event.rate.toString(),'100')

			//failure: investor cnt sell more tokens than they have
			await ethSwap.sellTokens(tokens('500'),{from:investor}).should.be.rejected;

			
		})
	})
})	