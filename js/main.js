$(document).ready(function(){

	if(typeof web3!=='undefined'){
    web3=new Web3(web3.CurrentProvider);
}
else{
    web3=new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
}

web3.eth.defaultAccount = web3.eth.accounts[1];

var bondContract=web3.eth.contract(abiData);

// testing comments. few more comments.  added in remote repo .. more in local

var bond= bondContract.at(contractAddress);
console.log(bond);

var defaultMultiplier=500;

var vm={};

vm.etherBal=ko.observable();
vm.etherBal(web3.eth.getBalance(web3.eth.accounts[1])/1000000000000000000);
vm.buyTokensCount=ko.observable(0);
vm.buyEtherAmount=ko.observable();
vm.sellTokensCount=ko.observable(0);
vm.sellEtherAmount=ko.observable();
vm.sellAddress=ko.observable();
vm.tokensPerEther=ko.observable(defaultMultiplier);
vm.buyTokensCount.subscribe(function(newValue){
    vm.buyEtherAmount(newValue/vm.tokensPerEther());
});

ko.observable.fn.beforeAndAfterSubscribe = function(callback, target) {
    var _oldValue;
    this.subscribe(function(oldValue) {
        _oldValue = oldValue;
    }, null, 'beforeChange');

    this.subscribe(function(newValue) {
        callback.call(target, _oldValue, newValue);
    });
};


vm.sellAddress.beforeAndAfterSubscribe(function(oldValue,newValue){
    if(newValue && web3.isAddress(newValue))
    {
        var val=bond.GetTokensPerEther(web3.toChecksumAddress(newValue));
        if(val!=0)
            vm.tokensPerEther(val);
        else
            vm.tokensPerEther(defaultMultiplier);
        
         vm.sellEtherAmount(vm.sellTokensCount()/vm.tokensPerEther());
    }
    else if(newValue){
        alert("Invalid Address. Reverting to the previous one");
        vm.sellAddress(oldValue);
    }
});

vm.sellTokensCount.subscribe(function(newValue){
    
    vm.sellEtherAmount(newValue/vm.tokensPerEther());
});

vm.tokensPerEther=ko.observable(defaultMultiplier);


for(var i=1;i<web3.eth.accounts.length;i++){
		$("#ddlAddresses").append($("<option></option>").val(i+1).html(web3.eth.accounts[i]));
	}

	$("#ddlAddresses").change(function(){
		web3.eth.defaultAccount=$("#ddlAddresses option:selected").text();
		$("#txtAddress").val(web3.eth.defaultAccount);
        vm.etherBal(web3.eth.getBalance(web3.eth.defaultAccount)/1000000000000000000);
	}); 

$("#btnBuySubmit").click(function(){
    if(vm.etherBal()<vm.buyEtherAmount()){
        alert("No sufficient bal");
    }

    bond.BuyTokens({value:web3.toWei(vm.buyEtherAmount(), 'ether'),gas:1000000},function(error,result){
        if(!error){
            vm.buyTokensCount(0);
            console.log(result);
            vm.etherBal(web3.eth.getBalance(web3.eth.defaultAccount)/1000000000000000000);
            alert("SUCCESS");
        }
        else{
            console.log(error);
        }
    });
});

$("#btnSellInitiateSubmit").click(function(){
    bond.InitiateSell(vm.tokensPerEther(),function(error,result){
        if(!error){
            vm.sellTokensCount(0);
            vm.etherBal(web3.eth.getBalance(web3.eth.defaultAccount)/1000000000000000000); 
            console.log(result);
            alert("SUCCESS");
        }
        else{
            console.log(error);
        }
    });
});

$("#btnSellSubmit").click(function(){
   /* var account={};
for(var i=1;i<web3.eth.accounts.length;i++){
    if(web3.eth.accounts[i]==vm.sellAddress())
    {
        account=web3.eth.accounts[i];
    }
}
console.log(account);
console.log(web3.eth.accounts[1]);*/
//console.log("Address");
//console.log(web3.toChecksumAddress(vm.sellAddress()));
    bond.TransferTokens(web3.toChecksumAddress(vm.sellAddress()),{value:web3.toWei(vm.sellEtherAmount(), 'ether'),gas:1000000},function(error,result){
        if(!error){
            vm.sellAddress("");
            vm.sellEtherAmount(0);
            vm.etherBal(web3.eth.getBalance(web3.eth.defaultAccount)/1000000000000000000);
             console.log(result);
            alert("SUCCESS");
        }
        else{
            console.log(error);
        }
    });
});




ko.applyBindings(vm);

});
