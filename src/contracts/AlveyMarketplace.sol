// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
}

interface IERC721 {
    function ownerOf(uint256 tokenId) external view returns (address);
    function safeTransferFrom(address from, address to, uint256 tokenId) external;
}

interface IERC721Receiver {
    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) external returns (bytes4);
}

contract AlveyMarketplace is IERC721Receiver {
    address public owner;
    address public immutable nft;
    IERC20 public immutable paymentToken;
    address public feeRecipient;
    uint96 public feeBps;

    uint64 public minAuctionDuration = 1 hours;
    uint64 public extensionWindow = 10 minutes;
    uint64 public extensionDuration = 10 minutes;

    uint256 public listingCount;
    uint256 public auctionCount;

    struct Listing {
        address seller;
        uint256 tokenId;
        uint256 price;
        bool active;
    }

    struct Auction {
        address seller;
        uint256 tokenId;
        uint256 reservePrice;
        uint256 highestBid;
        address highestBidder;
        uint64 endTime;
        bool settled;
    }

    mapping(uint256 => Listing) public listings;
    mapping(uint256 => Auction) public auctions;

    uint256 private _locked;

    event ListingCreated(uint256 indexed listingId, address indexed seller, uint256 indexed tokenId, uint256 price);
    event ListingCancelled(uint256 indexed listingId);
    event ListingFilled(uint256 indexed listingId, address indexed buyer, uint256 price);

    event AuctionCreated(uint256 indexed auctionId, address indexed seller, uint256 indexed tokenId, uint256 reservePrice, uint64 endTime);
    event BidPlaced(uint256 indexed auctionId, address indexed bidder, uint256 amount, uint64 endTime);
    event AuctionCancelled(uint256 indexed auctionId);
    event AuctionSettled(uint256 indexed auctionId, address indexed winner, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier nonReentrant() {
        require(_locked == 0, "Reentrancy");
        _locked = 1;
        _;
        _locked = 0;
    }

    constructor(address nft_, address paymentToken_, address feeRecipient_, uint96 feeBps_) {
        require(nft_ != address(0), "Invalid NFT");
        require(paymentToken_ != address(0), "Invalid token");
        require(feeRecipient_ != address(0), "Invalid fee recipient");
        require(feeBps_ <= 1000, "Fee too high");
        owner = msg.sender;
        nft = nft_;
        paymentToken = IERC20(paymentToken_);
        feeRecipient = feeRecipient_;
        feeBps = feeBps_;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid owner");
        owner = newOwner;
    }

    function setFeeRecipient(address recipient) external onlyOwner {
        require(recipient != address(0), "Invalid recipient");
        feeRecipient = recipient;
    }

    function setFeeBps(uint96 bps) external onlyOwner {
        require(bps <= 1000, "Fee too high");
        feeBps = bps;
    }

    function setAuctionParams(uint64 minDuration, uint64 window, uint64 extension) external onlyOwner {
        require(minDuration >= 1 hours, "Min duration");
        minAuctionDuration = minDuration;
        extensionWindow = window;
        extensionDuration = extension;
    }

    function createListing(uint256 tokenId, uint256 price) external nonReentrant {
        require(price > 0, "Invalid price");
        require(IERC721(nft).ownerOf(tokenId) == msg.sender, "Not owner");

        listingCount++;
        listings[listingCount] = Listing({
            seller: msg.sender,
            tokenId: tokenId,
            price: price,
            active: true
        });

        IERC721(nft).safeTransferFrom(msg.sender, address(this), tokenId);
        emit ListingCreated(listingCount, msg.sender, tokenId, price);
    }

    function cancelListing(uint256 listingId) external nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.active, "Inactive");
        require(listing.seller == msg.sender, "Not seller");
        listing.active = false;

        IERC721(nft).safeTransferFrom(address(this), msg.sender, listing.tokenId);
        emit ListingCancelled(listingId);
    }

    function buyListing(uint256 listingId) external nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.active, "Inactive");
        listing.active = false;

        uint256 fee = (listing.price * feeBps) / 10000;
        uint256 payout = listing.price - fee;

        require(paymentToken.transferFrom(msg.sender, listing.seller, payout), "Pay seller failed");
        if (fee > 0) {
            require(paymentToken.transferFrom(msg.sender, feeRecipient, fee), "Pay fee failed");
        }

        IERC721(nft).safeTransferFrom(address(this), msg.sender, listing.tokenId);
        emit ListingFilled(listingId, msg.sender, listing.price);
    }

    function createAuction(uint256 tokenId, uint256 reservePrice, uint64 duration) external nonReentrant {
        require(reservePrice > 0, "Invalid reserve");
        require(duration >= minAuctionDuration, "Short duration");
        require(IERC721(nft).ownerOf(tokenId) == msg.sender, "Not owner");

        auctionCount++;
        uint64 endTime = uint64(block.timestamp) + duration;
        auctions[auctionCount] = Auction({
            seller: msg.sender,
            tokenId: tokenId,
            reservePrice: reservePrice,
            highestBid: 0,
            highestBidder: address(0),
            endTime: endTime,
            settled: false
        });

        IERC721(nft).safeTransferFrom(msg.sender, address(this), tokenId);
        emit AuctionCreated(auctionCount, msg.sender, tokenId, reservePrice, endTime);
    }

    function bid(uint256 auctionId, uint256 amount) external nonReentrant {
        Auction storage auction = auctions[auctionId];
        require(!auction.settled, "Settled");
        require(block.timestamp < auction.endTime, "Ended");
        require(amount >= auction.reservePrice, "Below reserve");
        require(amount > auction.highestBid, "Low bid");

        require(paymentToken.transferFrom(msg.sender, address(this), amount), "Bid transfer failed");

        if (auction.highestBidder != address(0)) {
            require(paymentToken.transfer(auction.highestBidder, auction.highestBid), "Refund failed");
        }

        auction.highestBid = amount;
        auction.highestBidder = msg.sender;

        if (auction.endTime - uint64(block.timestamp) <= extensionWindow) {
            auction.endTime += extensionDuration;
        }

        emit BidPlaced(auctionId, msg.sender, amount, auction.endTime);
    }

    function cancelAuction(uint256 auctionId) external nonReentrant {
        Auction storage auction = auctions[auctionId];
        require(!auction.settled, "Settled");
        require(auction.seller == msg.sender, "Not seller");
        require(auction.highestBidder == address(0), "Has bid");
        auction.settled = true;

        IERC721(nft).safeTransferFrom(address(this), msg.sender, auction.tokenId);
        emit AuctionCancelled(auctionId);
    }

    function settleAuction(uint256 auctionId) external nonReentrant {
        Auction storage auction = auctions[auctionId];
        require(!auction.settled, "Settled");
        require(block.timestamp >= auction.endTime, "Not ended");
        auction.settled = true;

        if (auction.highestBidder == address(0)) {
            IERC721(nft).safeTransferFrom(address(this), auction.seller, auction.tokenId);
            emit AuctionSettled(auctionId, address(0), 0);
            return;
        }

        uint256 fee = (auction.highestBid * feeBps) / 10000;
        uint256 payout = auction.highestBid - fee;

        require(paymentToken.transfer(auction.seller, payout), "Pay seller failed");
        if (fee > 0) {
            require(paymentToken.transfer(feeRecipient, fee), "Pay fee failed");
        }

        IERC721(nft).safeTransferFrom(address(this), auction.highestBidder, auction.tokenId);
        emit AuctionSettled(auctionId, auction.highestBidder, auction.highestBid);
    }

    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }
}
