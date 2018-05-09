




$(document).ready(function(){


	if(typeof web3!=='undefined'){
    web3=new Web3(web3.CurrentProvider);
}
else{
    web3=new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
}

web3.eth.defaultAccount = web3.eth.accounts[0];

var myContract=web3.eth.contract([
	{
		"constant": true,
		"inputs": [],
		"name": "GetBalanceOfContract",
		"outputs": [
			{
				"name": "",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [],
		"name": "TransferEtherToOwner",
		"outputs": [],
		"payable": true,
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"payable": true,
		"stateMutability": "payable",
		"type": "fallback"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"name": "sender",
				"type": "address"
			},
			{
				"indexed": false,
				"name": "to",
				"type": "address"
			},
			{
				"indexed": false,
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "LogTransfer",
		"type": "event"
	}
]);

var contractAddress="0x3e4942b4bb5fc9cdae887f37eda42ba14f786158";

var myContractDeployedAt= myContract.at(contractAddress);
console.log(myContractDeployedAt);








	var transferEvent=myContractDeployedAt.LogTransfer();
	$("#txtAddress").val(web3.eth.defaultAccount);

	$("#txtbal").val(myContractDeployedAt.GetBalanceOfContract());

	myContractDeployedAt.GetBalanceOfContract(function(error,result){
		if(!error){
			
			$("#txtbal").val(result);
		}else{
			console.log(error);
		}
	});


	$("#btnTransfer").click(function(){
		
		myContractDeployedAt.TransferEtherToOwner();
	});

	transferEvent.watch(function(error,result){
		
		if(!error){

			$("#txtbal").val(result.args.amount);
		}
		else
		{
			console.log(error);
		}
	});

	for(var i=0;i<web3.eth.accounts.length;i++){
		$("#ddlAddresses").append($("<option></option>").val(i+1).html(web3.eth.accounts[i]));
	}

	$("#ddlAddresses").change(function(){
		web3.eth.defaultAccount=$("#ddlAddresses option:selected").text();
		$("#txtAddress").val(web3.eth.defaultAccount);
	}); 

	$("#btnSend").click(function(){
		var etherAmount=web3.toWei(Number($("#txtEther").val(), "ether"));
		web3.eth.sendTransaction({from:web3.eth.defaultAccount,to:contractAddress,value:etherAmount});
	});
});