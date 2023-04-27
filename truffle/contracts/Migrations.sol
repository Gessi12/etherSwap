pragma solidity ^0.8.0;

contract Migrations {
    address public onwer;
    uint public last_completed_migration;

    constructor() public {
        onwer = msg.sender;
    }

    modifier restricted() {
        require(msg.sender == onwer);
        _;
    }

    function setCompleted(uint completed) public  restricted {
        last_completed_migration = completed;
    }

    function upgrade(address new_address) public restricted {
        Migrations upgraded = Migrations(new_address);
        upgraded.setCompleted(last_completed_migration);
    }
}