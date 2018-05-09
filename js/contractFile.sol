pragma solidity ^0.4.11;

contract GovernmentBond
{
    
    struct investor{
        uint tokensAvailable;
        uint expirationTime;
        uint nextInterestPayTime;
        bool isSell;
        uint tokensPerEther;
    }
    
    
   
    address private _owner;
    uint private _contractTokensAvalable;
    
    uint private constant _totalTokenSupply=50000;
    
    uint private constant _multiplier=500;
    uint private constant _tokenExpirationPeriod=300;
    uint private _contractBeginTime;
    uint private _contractRevertTimeInterval=60;
    uint private _interstRate=4;
    uint private _interestPeriod=60;
    
    mapping(address=> investor) private _investors;
    
     event LogTransfer(address sender, address to, uint amount);
     event BuyTokensEvent(address addr,uint tokens,uint expiryTime);
    
    function GovernmentBond() public 
    {
        _owner=msg.sender;
        _contractTokensAvalable=_totalTokenSupply;
        _contractBeginTime=block.timestamp;
       
    }
    
    
    
     modifier ValidateTokensSale(address addr)   {
        if(block.timestamp>_contractBeginTime+_contractRevertTimeInterval && _contractTokensAvalable>_totalTokenSupply/10){
            
            uint256 etherAmount=_investors[addr].tokensAvailable / _multiplier * 1 ether;
             _investors[addr].tokensAvailable=0;
            _investors[addr].expirationTime=0;
            if(address(this).balance>etherAmount)
            {
                addr.transfer(etherAmount);
                emit LogTransfer(addr,address(this),etherAmount);
            }
            else
            {
               addr.transfer(address(this).balance);
               emit LogTransfer(addr,address(this),address(this).balance);
            }
            
            emit BuyTokensEvent(addr,0,0);
        }
        else{
            if(_investors[addr].tokensAvailable>0 && _investors[addr].expirationTime<block.timestamp 
            && _investors[addr].nextInterestPayTime>_investors[addr].expirationTime){
                uint amountDuringMaturity=_investors[addr].tokensAvailable / _multiplier * 1 ether;
                if(address(this).balance>amountDuringMaturity){
                    _investors[addr].tokensAvailable=0;
                    addr.transfer(amountDuringMaturity);
                    emit LogTransfer(addr,address(this),amountDuringMaturity);
                    
                }
            }
            else if(_investors[addr].tokensAvailable>0 && block.timestamp>_contractBeginTime+_contractRevertTimeInterval){
                if(_investors[addr].nextInterestPayTime<block.timestamp){
                    uint interestAmount=_investors[addr].tokensAvailable/_multiplier*_interstRate/100 * 1000 finney;
                    if(address(this).balance>interestAmount){
                       addr.transfer(interestAmount);
                        emit LogTransfer(addr,address(this),interestAmount); 
                        _investors[addr].nextInterestPayTime+=_interestPeriod;
                    }
                }
            }
            
        }
        _;
    }
    
   
    
    function InvokeValidateTokensSaleModifier(address addr) public ValidateTokensSale(addr) payable {
         if(block.timestamp<=_contractBeginTime+_contractRevertTimeInterval && _contractTokensAvalable<=_totalTokenSupply/10){
            if(address(this).balance!=0)
            {            
                uint bal=address(this).balance;
                _owner.transfer(bal);
                emit LogTransfer(_owner,address(this),address(this).balance);
            }
        }
    }
    
    function GetContractKickInTime() public constant returns(uint){
        if(block.timestamp>_contractBeginTime+_contractRevertTimeInterval){
            return 0;
        }
        else{
           return _contractBeginTime+_contractRevertTimeInterval-block.timestamp;
        }
    }
    
    function GetAvailableTokensInContract() public constant returns (uint){
        return _contractTokensAvalable;
    }
    
    function GetTokensAvailable(address addr) public constant  returns(uint){
        return _investors[addr].tokensAvailable;
        
    }
    
    function GetTokenExpirationTime(address addr) public constant returns (uint){
        if(_investors[addr].expirationTime<block.timestamp || _investors[addr].expirationTime==0)
        {
            return 0;
        }
        else
        {
            return _investors[addr].expirationTime -block.timestamp;
        }
        
    }
    
    function GetNextInterestTime(address addr) public constant returns (int){
        return int(_investors[addr].nextInterestPayTime) - int(block.timestamp);
    }
    
    
    function BuyTokens() public payable {
        
        uint256 tokensCount=msg.value / 1 ether * _multiplier;
        require(_contractTokensAvalable>tokensCount);
        _investors[msg.sender].tokensAvailable+=tokensCount;
        _contractTokensAvalable-=tokensCount;
        uint expiryTime;
        if(block.timestamp>_contractBeginTime+_contractRevertTimeInterval){
            expiryTime=block.timestamp+_tokenExpirationPeriod;
            _investors[msg.sender].nextInterestPayTime=block.timestamp+_interestPeriod;
        } 
        else
        {
            expiryTime=_tokenExpirationPeriod+_contractBeginTime+_contractRevertTimeInterval;
            _investors[msg.sender].nextInterestPayTime=_contractBeginTime+_contractRevertTimeInterval+_interestPeriod;
        }
        _investors[msg.sender].expirationTime=expiryTime;
        _investors[msg.sender].isSell=false;
        _investors[msg.sender].tokensPerEther=_multiplier;
        emit BuyTokensEvent(msg.sender,tokensCount,expiryTime);
    }
    
   function InitiateSell(uint tokensPerEther) public {
       _investors[msg.sender].tokensPerEther=tokensPerEther;
       _investors[msg.sender].isSell=true;
   }
   
   function GetTokensPerEther(address addr) public constant  returns (uint){
       if(_investors[addr].isSell==true){
           return _investors[addr].tokensPerEther;
       }
       else{
           return 0;
       }
   }
   
   function TransferTokens(address addr) public payable {
       require(_investors[addr].isSell==true);
       uint tokensBal=_investors[addr].tokensAvailable;
       uint256 tokensCount=msg.value / 1 ether * _investors[addr].tokensPerEther;
       require(tokensBal>=tokensCount && _investors[addr].expirationTime>block.timestamp);
       _investors[msg.sender].tokensAvailable+=tokensCount;
       _investors[addr].tokensAvailable-=tokensCount;
       _investors[msg.sender].expirationTime=_investors[addr].expirationTime;
       _investors[msg.sender].nextInterestPayTime=_investors[addr].nextInterestPayTime;
       _investors[msg.sender].isSell=false;
       _investors[msg.sender].tokensPerEther=_investors[addr].tokensPerEther;
       
       
       if(_investors[addr].tokensAvailable<=0){
           _investors[addr].isSell=false;
       }
       
       addr.transfer(msg.value);
       emit LogTransfer(msg.sender,addr,msg.value);
       
   }
    
    function() external payable 
    {
       
    }
    
    function TransferEtherToOwner() public payable
    {
        uint bal=address(this).balance;
        _owner.transfer(bal);
       emit LogTransfer(_owner,address(this),address(this).balance);
    }
    
    function GetBalanceOfContract() public constant returns (uint256)
    {
        return address(this).balance;
    }
    
    function GetEtherBalance(address addr) public constant returns(uint256){
        return addr.balance;
    }

}