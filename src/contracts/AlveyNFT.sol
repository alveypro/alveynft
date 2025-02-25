// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract AlveyNFT is ERC721, ERC721URIStorage, Ownable {
    uint256 private _tokenIdCounter;
    uint256 public constant MINT_PRICE = 0.01 ether;
    uint256 public constant MAX_MINTS_PER_WALLET = 3;
    
    mapping(address => uint256) public mintedWallets;

    constructor() ERC721("AlveyNFT", "ANFT") Ownable(msg.sender) {}

    function mint(string memory uri) public payable {
        require(msg.value >= MINT_PRICE, "Insufficient payment");
        require(mintedWallets[msg.sender] < MAX_MINTS_PER_WALLET, "Max mints reached");

        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, uri);
        
        mintedWallets[msg.sender]++;
    }

    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function withdraw() public onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}