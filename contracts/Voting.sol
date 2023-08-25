// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/// @title A Voting smart contract
/// @author chisomchris (dudelycodez)

contract Voting {
    struct Proposal {
        uint256 id;
        string proposal;
        string party;
        uint256 count;
    }

    uint256 startDate;
    uint256 endDate;
    uint256 totalVotes;
    address owner;
    address deployer;
    int256[] private tier;
    string region;
    mapping(address => bool) private voted;
    Proposal[] public proposals;
    string[] private winningProposal;

    event VoteCast(address voter, string proposal, uint time);
    event Winner(string[] winner);

    /// `addr` is not registered
    error VoterNotRegistered(address addr);

    modifier onlyBefore(uint256 time) {
        require(block.timestamp < time, "Too late to call fuction");
        _;
    }

    modifier onlyAfter(uint256 time) {
        require(block.timestamp > time, "Too early to call fuction");
        _;
    }

    modifier onlyEOA() {
        require(msg.sender == tx.origin, "Only EOA are allowed");
        _;
    }
    modifier onlyValidAddress(address _address) {
        require(
            (_address != address(0) && _address == address(_address)),
            "Invalid Address"
        );
        _;
    }

    modifier canVote() {
        require(!voted[msg.sender], "You have voted already");
        _;
    }

    constructor(
        uint256 _startTime,
        uint256 _endTime,
        string memory _region,
        string[2][] memory _proposals
    ) {
        owner = msg.sender;
        require(_proposals.length >= 2, "Proposals must be more than one");
        startDate = _startTime;
        endDate = _endTime;
        region = _region;
        deployer = msg.sender;
        for (uint i = 0; i < _proposals.length; i++) {
            proposals.push(Proposal(i, _proposals[i][1], _proposals[i][0], 0));
        }
    }

    function vote(
        uint256 _proposal
    ) public onlyEOA canVote onlyBefore(endDate) onlyAfter(startDate) {
        voted[msg.sender] = true;
        proposals[_proposal].count++;
        totalVotes++;
        emit VoteCast(
            msg.sender,
            proposals[_proposal].proposal,
            block.timestamp
        );
    }

    function getCandidates() public view returns (Proposal[] memory) {
        return proposals;
    }

    function getWinner() public onlyAfter(endDate) {
        int256 winningIndex = _checkWinner();
        if (winningIndex == -1) {
            for (uint256 i = 0; i < tier.length; i++) {
                winningProposal.push(proposals[uint256(tier[i])].proposal);
            }
        } else {
            winningProposal.push(proposals[uint256(winningIndex)].proposal);
        }
        emit Winner(winningProposal);
    }

    function _checkWinner() private returns (int256) {
        uint256 winningCount;
        int256 winningIndex;

        for (uint256 i = 0; i < proposals.length; i++) {
            if (proposals[i].count == winningCount) {
                if (tier.length == 0) {
                    tier.push(winningIndex);
                }
                tier.push(int256(i));
                winningIndex = -1;
            } else if (proposals[i].count > winningCount) {
                if (tier.length > 0) {
                    tier = [int256(0)];
                    tier.pop();
                }
                winningCount = proposals[i].count;
                winningIndex = int256(i);
            }
        }
        return winningIndex;
    }

    function getCurrentStatus()
        public
        view
        returns (uint, uint, string memory, string memory)
    {
        uint winningCount;
        uint winningIndex;
        for (uint i = 0; i < proposals.length; i++) {
            if (proposals[i].count > winningCount) {
                winningCount = proposals[i].count;
                winningIndex = i;
            }
        }
        return (
            proposals[winningIndex].count,
            totalVotes,
            region,
            proposals[winningIndex].party
        );
    }
}

contract Deployer {
    address owner;
    mapping(string => Voting) deployed;
    event Deploy(address election, string region);

    function deploy(
        uint256 _startTime,
        uint256 _endTime,
        string memory _region,
        string[2][] memory _candidates
    ) public {
        // require(msg.sender == owner, "You cannot call this function");
        require(
            address(deployed[_region]) == address(0),
            "Ballot already Live"
        );
        Voting election = new Voting(
            _startTime,
            _endTime,
            _region,
            _candidates
        );
        deployed[_region] = election;
        emit Deploy(address(election), _region);
        // return address(election);
    }
}
