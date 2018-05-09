$(document).ready(function(){


	if(typeof web3!=='undefined'){
    web3=new Web3(web3.CurrentProvider);
}
else{
    web3=new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
}

web3.eth.defaultAccount = web3.eth.accounts[0];

var bondContract=web3.eth.contract(abiData);



var bond= bondContract.at(contractAddress);
console.log(bond);

var infoClass=function(addr,tokens,ethers,expTime,sellAmount){
    this.addr=ko.observable(addr);
    this.tokens=ko.observable(tokens);
    this.ethers=ko.observable(ethers/1000000000000000000);
    this.expTime=ko.observable(expTime);
    this.sellAmount=ko.observable(sellAmount);
}

var vm={};

vm.kickinTime=ko.observable();
bond.GetContractKickInTime(function(error,result){
 if(!error){
vm.kickinTime(result);
 }
});



vm.governmentInfo=ko.observable();
var govtBal=web3.eth.getBalance(web3.eth.accounts[0]);
vm.governmentInfo(new infoClass(web3.eth.accounts[0],'N/A',govtBal,'N/A','N/A'));
/*bond.GetEtherBalance(web3.eth.accounts[0],function(error,result){
    if(!error){
        vm.governmentInfo(new infoClass(web3.eth.accounts[0],0,result));
    } else {
        console.log(error);
    }
});*/



vm.contractInfo=ko.observable();
vm.contractInfo(new infoClass("","","","N/A",'N/A'));
//vm.contractInfo(new infoClass(contractAddress,"",web3.eth.getBalance(contractAddress)));

 bond.GetBalanceOfContract(function(error,result){
    if(!error){
       //vm.contractInfo(new infoClass(contractAddress,0,result));
       vm.contractInfo().addr(contractAddress);
       //vm.contractInfo().tokens(0);
       vm.contractInfo().ethers(result/1000000000000000000);
       
    } else {
        console.log(error);
   
    }
 });

 bond.GetAvailableTokensInContract(function(error,result){
    if(!error){
       //vm.contractInfo(new infoClass(contractAddress,0,result));
       
       vm.contractInfo().tokens(result);
      
       
    } else {
        console.log(error);
   
    }
 });



vm.usersInfo=ko.observableArray();

for(var i=1;i<web3.eth.accounts.length;i++){

    bond.InvokeValidateTokensSaleModifier(web3.eth.accounts[i]);
    var tokensPerEther=bond.GetTokensPerEther(web3.eth.accounts[i]);
    
    var newUserInfo=new infoClass(web3.eth.accounts[i],   bond.GetTokensAvailable(web3.eth.accounts[i]),
    web3.eth.getBalance(web3.eth.accounts[i]),bond.GetTokenExpirationTime(web3.eth.accounts[i]),tokensPerEther>0?tokensPerEther:'N/A');  
    vm.usersInfo.push(newUserInfo);

}


/* setInterval(function(){
    bond.GetContractKickInTime(function(error,result){
 if(!error){
vm.kickinTime(result);
 }
});
},3000); */

ko.applyBindings(vm);

});