// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface ERC20Token {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
}

interface ERC721TokenReceiver {
    function onERC721Received(
        address operator,
        address from,
        uint256 id,
        bytes calldata data
    ) external returns (bytes4);
}

contract AlveyNFT {
    enum SalePhase {
        Paused,
        Allowlist,
        Public
    }

    string public name = "AlveyNFT";
    string public symbol = "ANFT";

    uint256 private _tokenIdCounter;
    uint256 public maxMintsPerWallet;
    uint256 public totalSupply;
    uint256 public totalMinted;
    ERC20Token public paymentToken;
    mapping(uint8 => uint256) public tierPrices;
    mapping(uint8 => uint256) public tierSupply;
    mapping(uint8 => uint256) public tierMinted;
    mapping(uint256 => uint8) public tokenTier;

    SalePhase public salePhase;
    mapping(address => bool) public allowlist;

    address public royaltyReceiver;
    uint96 public royaltyBps;
    bool public revealed;

    address public owner;

    mapping(uint256 => address) internal _ownerOf;
    mapping(address => uint256) internal _balanceOf;
    mapping(uint256 => address) public getApproved;
    mapping(address => mapping(address => bool)) public isApprovedForAll;
    mapping(address => uint256) public mintedWallets;
    mapping(uint256 => string) private _tokenURIs;
    string private _baseTokenURI;
    string private _hiddenTokenURI;

    event Transfer(address indexed from, address indexed to, uint256 indexed id);
    event Approval(address indexed owner, address indexed spender, uint256 indexed id);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event SalePhaseUpdated(uint8 phase);
    event RevealUpdated(bool revealed);
    event RoyaltyUpdated(address receiver, uint96 bps);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor(address paymentToken_, uint256 maxMintsPerWallet_) {
        owner = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);
        paymentToken = ERC20Token(paymentToken_);
        maxMintsPerWallet = maxMintsPerWallet_;
        tierPrices[0] = 50000 * 1e18;
        tierPrices[1] = 75000 * 1e18;
        tierPrices[2] = 100000 * 1e18;
        tierPrices[3] = 150000 * 1e18;
        tierPrices[4] = 200000 * 1e18;
        tierPrices[5] = 300000 * 1e18;
        tierPrices[6] = 400000 * 1e18;
        tierPrices[7] = 500000 * 1e18;
        tierSupply[0] = 400;
        tierSupply[1] = 200;
        tierSupply[2] = 140;
        tierSupply[3] = 100;
        tierSupply[4] = 70;
        tierSupply[5] = 50;
        tierSupply[6] = 30;
        tierSupply[7] = 10;
        totalSupply =
            tierSupply[0] +
            tierSupply[1] +
            tierSupply[2] +
            tierSupply[3] +
            tierSupply[4] +
            tierSupply[5] +
            tierSupply[6] +
            tierSupply[7];
        salePhase = SalePhase.Paused;
        royaltyReceiver = msg.sender;
        royaltyBps = 500;
    }

    function supportsInterface(bytes4 interfaceId) public pure returns (bool) {
        return
            interfaceId == 0x01ffc9a7 ||
            interfaceId == 0x80ac58cd ||
            interfaceId == 0x5b5e139f ||
            interfaceId == 0x2a55205a;
    }

    function balanceOf(address user) public view returns (uint256) {
        require(user != address(0), "Zero address");
        return _balanceOf[user];
    }

    function ownerOf(uint256 id) public view returns (address) {
        address owner_ = _ownerOf[id];
        require(owner_ != address(0), "Not minted");
        return owner_;
    }

    function approve(address spender, uint256 id) public {
        address owner_ = _ownerOf[id];
        require(
            msg.sender == owner_ || isApprovedForAll[owner_][msg.sender],
            "Not authorized"
        );
        getApproved[id] = spender;
        emit Approval(owner_, spender, id);
    }

    function setApprovalForAll(address operator, bool approved) public {
        isApprovedForAll[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    function transferFrom(address from, address to, uint256 id) public {
        require(from == _ownerOf[id], "Wrong from");
        require(to != address(0), "Invalid to");
        require(
            msg.sender == from ||
                msg.sender == getApproved[id] ||
                isApprovedForAll[from][msg.sender],
            "Not authorized"
        );

        unchecked {
            _balanceOf[from]--;
            _balanceOf[to]++;
        }

        _ownerOf[id] = to;
        delete getApproved[id];

        emit Transfer(from, to, id);
    }

    function safeTransferFrom(address from, address to, uint256 id) public {
        safeTransferFrom(from, to, id, "");
    }

    function safeTransferFrom(address from, address to, uint256 id, bytes memory data) public {
        transferFrom(from, to, id);

        if (to.code.length != 0) {
            require(
                ERC721TokenReceiver(to).onERC721Received(
                    msg.sender,
                    from,
                    id,
                    data
                ) == ERC721TokenReceiver.onERC721Received.selector,
                "Unsafe recipient"
            );
        }
    }

    function setBaseURI(string calldata baseURI_) external onlyOwner {
        _baseTokenURI = baseURI_;
    }

    function setHiddenURI(string calldata hiddenURI_) external onlyOwner {
        _hiddenTokenURI = hiddenURI_;
    }

    function setRevealed(bool revealed_) external onlyOwner {
        revealed = revealed_;
        emit RevealUpdated(revealed_);
    }

    function setPaymentToken(address paymentToken_) external onlyOwner {
        require(paymentToken_ != address(0), "Invalid token");
        paymentToken = ERC20Token(paymentToken_);
    }

    function setMaxMintsPerWallet(uint256 maxMints_) external onlyOwner {
        maxMintsPerWallet = maxMints_;
    }

    function setTierPrice(uint8 tier, uint256 price) external onlyOwner {
        tierPrices[tier] = price;
    }

    function setTierSupply(uint8 tier, uint256 supply) external onlyOwner {
        require(supply >= tierMinted[tier], "Supply below minted");
        uint256 currentTotal = totalSupply - tierSupply[tier];
        totalSupply = currentTotal + supply;
        tierSupply[tier] = supply;
    }

    function setSalePhase(uint8 phase) external onlyOwner {
        require(phase <= uint8(SalePhase.Public), "Invalid phase");
        salePhase = SalePhase(phase);
        emit SalePhaseUpdated(phase);
    }

    function setAllowlist(address[] calldata accounts, bool allowed) external onlyOwner {
        for (uint256 i = 0; i < accounts.length; i++) {
            allowlist[accounts[i]] = allowed;
        }
    }

    function isAllowlisted(address account) external view returns (bool) {
        return allowlist[account];
    }

    function setRoyalty(address receiver, uint96 bps) external onlyOwner {
        require(receiver != address(0), "Invalid receiver");
        require(bps <= 1000, "Royalty too high");
        royaltyReceiver = receiver;
        royaltyBps = bps;
        emit RoyaltyUpdated(receiver, bps);
    }

    function royaltyInfo(uint256, uint256 salePrice) external view returns (address, uint256) {
        uint256 royaltyAmount = (salePrice * royaltyBps) / 10000;
        return (royaltyReceiver, royaltyAmount);
    }

    function mintWithTier(uint8 tier, string calldata uri) external {
        require(salePhase != SalePhase.Paused, "Sale paused");
        if (salePhase == SalePhase.Allowlist) {
            require(allowlist[msg.sender], "Not allowlisted");
        }
        uint256 price = tierPrices[tier];
        require(price > 0, "Invalid tier");
        require(mintedWallets[msg.sender] < maxMintsPerWallet, "Max mints reached");
        require(tierMinted[tier] < tierSupply[tier], "Tier sold out");
        require(totalMinted < totalSupply, "Sold out");
        require(paymentToken.transferFrom(msg.sender, address(this), price), "Payment failed");

        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;

        _safeMint(msg.sender, tokenId);
        _tokenURIs[tokenId] = uri;
        tokenTier[tokenId] = tier;
        mintedWallets[msg.sender]++;
        tierMinted[tier]++;
        totalMinted++;
    }

    function ownerMint(address to, uint8 tier, string calldata uri) external onlyOwner {
        require(tierMinted[tier] < tierSupply[tier], "Tier sold out");
        require(totalMinted < totalSupply, "Sold out");

        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;

        _safeMint(to, tokenId);
        _tokenURIs[tokenId] = uri;
        tokenTier[tokenId] = tier;
        tierMinted[tier]++;
        totalMinted++;
    }

    function tokenURI(uint256 id) public view returns (string memory) {
        require(_ownerOf[id] != address(0), "Not minted");

        if (!revealed && bytes(_hiddenTokenURI).length > 0) {
            return _hiddenTokenURI;
        }

        string memory custom = _tokenURIs[id];
        if (bytes(custom).length > 0) {
            return custom;
        }

        if (bytes(_baseTokenURI).length > 0) {
            return string(abi.encodePacked(_baseTokenURI, _toString(id)));
        }

        return "";
    }

    function burn(uint256 id) external {
        address owner_ = _ownerOf[id];
        require(owner_ != address(0), "Not minted");
        require(
            msg.sender == owner_ ||
                msg.sender == getApproved[id] ||
                isApprovedForAll[owner_][msg.sender],
            "Not authorized"
        );

        _balanceOf[owner_]--;
        delete _ownerOf[id];
        delete getApproved[id];
        delete _tokenURIs[id];
        delete tokenTier[id];

        emit Transfer(owner_, address(0), id);
    }

    function withdraw(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "Invalid to");
        require(paymentToken.transfer(to, amount), "Withdraw failed");
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid owner");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    function _safeMint(address to, uint256 id) internal {
        require(to != address(0), "Invalid to");
        require(_ownerOf[id] == address(0), "Already minted");

        _ownerOf[id] = to;
        unchecked {
            _balanceOf[to]++;
        }

        emit Transfer(address(0), to, id);

        if (to.code.length != 0) {
            require(
                ERC721TokenReceiver(to).onERC721Received(
                    msg.sender,
                    address(0),
                    id,
                    ""
                ) == ERC721TokenReceiver.onERC721Received.selector,
                "Unsafe recipient"
            );
        }
    }

    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }

        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }

        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }

        return string(buffer);
    }
}
