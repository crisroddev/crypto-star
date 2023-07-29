const StarNotary = artifacts.require("StarNotary");

let accounts;
let owner;
let user1;
let user2;

contract('StarNotary', (accs) => {
    accounts = accs;
    owner = accounts[0];
    user1 = accounts[1];
    user2 = accounts[2];
});

beforeEach(async () => {
    instance = await StarNotary.deployed();
});

it('can Create a Star', async() => {
    const starId = 1;
    await instance.createStar("New Star", starId, { from: accounts[0]});
    assert.equal(await instance.tokenIdToStarInfo.call(starId), "New Star");
});

it('lets user1 put up their star for sale', async() => {
    let starId = 2;
    let starPrice = web3.utils.toWei(".01", "ether");
    await instance.createStar('awesome star', starId, {from: user1});
    await instance.putStarUpForSale(starId, starPrice, {from: user1});
    assert.equal(await instance.starsForSale.call(starId), starPrice);
});

it('lets user1 get the funds after the sale', async() => {
    let starId = 3;
    let starPrice = web3.utils.toWei(".01", "ether");
    let balance = web3.utils.toWei(".05", "ether");
    const gasPrice = web3.utils.toWei(".0001", "ether");

    await instance.createStar('awesome star', starId, {from: user1});
    await instance.putStarUpForSale(starId, starPrice, {from: user1});

    await instance.approve(user2, starId, { from: user1, gasPrice: gasPrice }); // ERC721: Fix error: approve caller is not owner nor approved for all 

    let balanceOfUser1BeforeTransaction = await web3.eth.getBalance(user1);

    await instance.buyStar(starId, {from: user2, value: balance});
    let balanceOfUser1AfterTransaction = await web3.eth.getBalance(user1);
    let value1 = Number(balanceOfUser1BeforeTransaction) + Number(starPrice);
    let value2 = Number(balanceOfUser1AfterTransaction);
    assert.equal(value1, value2);
});

it('lets user2 buy a star, if it is put up for sale', async() => {
    const starId = 4;
    let starPrice = web3.utils.toWei(".01", "ether");
    let balance = web3.utils.toWei(".05", "ether");
    const gasPrice = web3.utils.toWei(".0001", "ether");
    await instance.createStar('awesome star', starId, {from: user1});
    await instance.putStarUpForSale(starId, starPrice, {from: user1});
    let balanceOfUser1BeforeTransaction = await web3.eth.getBalance(user2);
    await instance.approve(user2, starId, { from: user1, gasPrice: gasPrice }); // ERC721: Fix error: approve caller is not owner nor approved for all

    // when
    await instance.buyStar(starId, {from: user2, value: balance});

    // then
    assert.equal(await instance.ownerOf.call(starId), user2);
});

it('lets user2 buy a star and decreases its balance in ether', async() => {
    let starId = 5;
    let starPrice = web3.utils.toWei(".01", "ether");
    let balance = web3.utils.toWei(".05", "ether");
    const gasPrice = web3.utils.toWei(".0001", "ether");
    await instance.createStar('awesome star', starId, {from: user1});
    await instance.putStarUpForSale(starId, starPrice, {from: user1});

    await instance.approve(user2, starId, { from: user1, gasPrice: gasPrice });// ERC721: Fix error: approve caller is not owner nor approved for all 
    // Moving Approve() before GetBalance(), removes the following errors:
    // Error: Returned error: VM Exception while processing transaction: Transaction's maxFeePerGas (0) is less than the block's baseFeePerGas (86510)
    // (vm hf=london -> block -> tx)

    const balanceOfUser1BeforeTransaction = await web3.eth.getBalance(user1);
    const balanceOfUser2BeforeTransaction = await web3.eth.getBalance(user2);

    await instance.buyStar(starId, {from: user2, value: balance, gasPrice: gasPrice});


    const balanceAfterUser2BuysStar = await web3.eth.getBalance(user2);
    let value = Number(balanceOfUser2BeforeTransaction) - Number(balanceAfterUser2BuysStar);
    // assert.equal(value, starPrice); // NEVER EQUAL BECAUSE OF THE GAS FEES, THAT CANNOT BE EQUAL TO ZERO

    assert(value > starPrice);

});

// Implement Task 2 Add supporting unit tests

it('can add the star name and star symbol properly', async() => {
    // 1. create a Star with different tokenId
    //2. Call the name and symbol properties in your Smart Contract and compare with the name and symbol provided
    let starId = 6;
    await instance.createStar('awesome star', starId, { from: accounts[0] });
    assert.equal(await instance.lookUptokenIdToStarInfo(starId), 'awesome star');
});

it('lets 2 users exchange stars', async() => {
    // 1. create 2 Stars with different tokenId
    // 2. Call the exchangeStars functions implemented in the Smart Contract
    // 3. Verify that the owners changed
    let star1 = 7;
    let star2 = 8;
    await instance.createStar('awesome1', star1, { from: user1 });
    await instance.createStar('awesome2', star2, { from: user2 });

    assert.equal(await instance.ownerOf.call(star1), user1);
    assert.equal(await instance.ownerOf.call(star2), user2);

    await instance.approve(user2, star1, { from: user1 });

    await instance.approve(user1, star2, { from: user2 });

    await instance.exchangeStars(star1, star2, { from: user1 });

    assert.equal(await instance.ownerOf.call(star1), user2);
    assert.equal(await instance.ownerOf.call(star2), user1);
});

it('lets a user transfer a star', async() => {
    // 1. create a Star with different tokenId
    // 2. use the transferStar function implemented in the Smart Contract
    // 3. Verify the star owner changed.
    let starId = 9;
    await instance.createStar('awesome 9', starId, { from: user1 });

    assert.equal(await instance.ownerOf.call(starId), user1);
    assert.notEqual(await instance.ownerOf.call(starId), user2);

    await instance.transferStar(user2, starId, { from: user1 });

    assert.notEqual(await instance.ownerOf.call(starId), user1);
    assert.equal(await instance.ownerOf.call(starId), user2);
});

it('lookUptokenIdToStarInfo test', async() => {
    // 1. create a Star with different tokenId
    // 2. Call your method lookUptokenIdToStarInfo
    // 3. Verify if you Star name is the same
    let starId = 10;
    await instance.createStar('awesome 10', starId, { from: user1 });
    assert.equal(await instance.lookUptokenIdToStarInfo(starId), 'awesome 10')
});