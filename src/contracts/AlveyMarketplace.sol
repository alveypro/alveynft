// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
}

interface INFT {
    function ownerOf(uint256 tokenId) external view returns (address);
    function safeTransferFrom(address from, address to, uint256 tokenId) external;
    function tokenTier(uint256 tokenId) external view returns (uint8);
    function tierMinted(uint8 tier) external view returns (uint256);
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

    uint96 public holdersBps = 800;
    uint96 public burnBps = 100;
    uint96 public platformBps = 100;
    address public constant DEAD = 0x000000000000000000000000000000000000dEaD;

    uint64 public minAuctionDuration = 1 hours;
    uint64 public extensionWindow = 10 minutes;
    uint64 public extensionDuration = 10 minutes;

    uint256 public listingCount;
    uint256 public auctionCount;

    uint256 public rewardPerWeightStored;
    uint256 public totalWeightCached;
    uint64 public lastWeightSync;

    mapping(uint256 => uint256) public rewardPerWeightPaid;
    mapping(uint256 => uint256) public accruedRewards;

    uint256 private _locked;

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

    event ListingCreated(uint256 indexed listingId, address indexed seller, uint256 indexed tokenId, uint256 price);
    event ListingCancelled(uint256 indexed listingId);
    event ListingFilled(uint256 indexed listingId, address indexed buyer, uint256 price);

    event AuctionCreated(uint256 indexed auctionId, address indexed seller, uint256 indexed tokenId, uint256 reservePrice, uint64 endTime);
    event BidPlaced(uint256 indexed auctionId, address indexed bidder, uint256 amount, uint64 endTime);
    event AuctionCancelled(uint256 indexed auctionId);
    event AuctionSettled(uint256 indexed auctionId, address indexed winner, uint256 amount);

    event RewardsAdded(uint256 amount, uint256 rewardPerWeight);
    event RewardsClaimed(address indexed account, uint256 amount);
    event FeeRecipientUpdated(address indexed recipient);
    event FeeSplitUpdated(uint96 holdersBps, uint96 burnBps, uint96 platformBps);

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

    constructor(address nft_, address paymentToken_, address feeRecipient_) {
        require(nft_ != address(0), "Invalid NFT");
        require(paymentToken_ != address(0), "Invalid token");
        require(feeRecipient_ != address(0), "Invalid fee recipient");
        owner = msg.sender;
        nft = nft_;
        paymentToken = IERC20(paymentToken_);
        feeRecipient = feeRecipient_;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid owner");
        owner = newOwner;
    }

    function setFeeRecipient(address recipient) external onlyOwner {
        require(recipient != address(0), "Invalid recipient");
        feeRecipient = recipient;
        emit FeeRecipientUpdated(recipient);
    }

    function setFeeSplit(uint96 holders, uint96 burn, uint96 platform) external onlyOwner {
        require(holders + burn + platform == 1000, "Split must be 10%");
        holdersBps = holders;
        burnBps = burn;
        platformBps = platform;
        emit FeeSplitUpdated(holders, burn, platform);
    }

    function setAuctionParams(uint64 minDuration, uint64 window, uint64 extension) external onlyOwner {
        require(minDuration >= 1 hours, "Min duration");
        minAuctionDuration = minDuration;
        extensionWindow = window;
        extensionDuration = extension;
    }

    function _syncWeights() internal returns (uint256 totalWeight) {
        totalWeight = 0;
        for (uint8 i = 0; i < 8; i++) {
            uint256 minted = INFT(nft).tierMinted(i);
            totalWeight += minted * (uint256(i) + 1);
        }
        totalWeightCached = totalWeight;
        lastWeightSync = uint64(block.timestamp);
    }

    function _updateRewards(uint256 amount) internal {
        if (amount == 0) return;
        uint256 totalWeight = _syncWeights();
        if (totalWeight == 0) return;
        rewardPerWeightStored += (amount * 1e18) / totalWeight;
        emit RewardsAdded(amount, rewardPerWeightStored);
    }

    function _accrue(uint256 tokenId) internal {
        uint256 paid = rewardPerWeightPaid[tokenId];
        if (rewardPerWeightStored == paid) return;
        uint256 weight = uint256(INFT(nft).tokenTier(tokenId)) + 1;
        uint256 pending = ((rewardPerWeightStored - paid) * weight) / 1e18;
        accruedRewards[tokenId] += pending;
        rewardPerWeightPaid[tokenId] = rewardPerWeightStored;
    }

    function pendingRewards(uint256 tokenId) public view returns (uint256) {
        uint256 paid = rewardPerWeightPaid[tokenId];
        uint256 weight = uint256(INFT(nft).tokenTier(tokenId)) + 1;
        uint256 pending = ((rewardPerWeightStored - paid) * weight) / 1e18;
        return accruedRewards[tokenId] + pending;
    }

    function claimRewards(uint256[] calldata tokenIds) external nonReentrant {
        uint256 total;
        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];
            require(INFT(nft).ownerOf(tokenId) == msg.sender, "Not owner");
            _accrue(tokenId);
            uint256 reward = accruedRewards[tokenId];
            if (reward > 0) {
                accruedRewards[tokenId] = 0;
                total += reward;
            }
        }
        require(total > 0, "No rewards");
        require(paymentToken.transfer(msg.sender, total), "Reward transfer failed");
        emit RewardsClaimed(msg.sender, total);
    }

    function createListing(uint256 tokenId, uint256 price) external nonReentrant {
        require(price > 0, "Invalid price");
        require(INFT(nft).ownerOf(tokenId) == msg.sender, "Not owner");

        listingCount++;
        listings[listingCount] = Listing({
            seller: msg.sender,
            tokenId: tokenId,
            price: price,
            active: true
        });

        INFT(nft).safeTransferFrom(msg.sender, address(this), tokenId);
        emit ListingCreated(listingCount, msg.sender, tokenId, price);
    }

    function cancelListing(uint256 listingId) external nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.active, "Inactive");
        require(listing.seller == msg.sender, "Not seller");
        listing.active = false;

        INFT(nft).safeTransferFrom(address(this), msg.sender, listing.tokenId);
        emit ListingCancelled(listingId);
    }

    function buyListing(uint256 listingId) external nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.active, "Inactive");
        listing.active = false;

        uint256 holdersFee = (listing.price * holdersBps) / 10000;
        uint256 burnFee = (listing.price * burnBps) / 10000;
        uint256 platformFee = (listing.price * platformBps) / 10000;
        uint256 payout = listing.price - holdersFee - burnFee - platformFee;

        require(paymentToken.transferFrom(msg.sender, listing.seller, payout), "Pay seller failed");
        if (platformFee > 0) {
            require(paymentToken.transferFrom(msg.sender, feeRecipient, platformFee), "Pay platform failed");
        }
        if (burnFee > 0) {
            require(paymentToken.transferFrom(msg.sender, DEAD, burnFee), "Burn failed");
        }
        if (holdersFee > 0) {
            require(paymentToken.transferFrom(msg.sender, address(this), holdersFee), "Pay holders failed");
            _updateRewards(holdersFee);
        }

        INFT(nft).safeTransferFrom(address(this), msg.sender, listing.tokenId);
        emit ListingFilled(listingId, msg.sender, listing.price);
    }

    function createAuction(uint256 tokenId, uint256 reservePrice, uint64 duration) external nonReentrant {
        require(reservePrice > 0, "Invalid reserve");
        require(duration >= minAuctionDuration, "Short duration");
        require(INFT(nft).ownerOf(tokenId) == msg.sender, "Not owner");

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

        INFT(nft).safeTransferFrom(msg.sender, address(this), tokenId);
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

        INFT(nft).safeTransferFrom(address(this), msg.sender, auction.tokenId);
        emit AuctionCancelled(auctionId);
    }

    function settleAuction(uint256 auctionId) external nonReentrant {
        Auction storage auction = auctions[auctionId];
        require(!auction.settled, "Settled");
        require(block.timestamp >= auction.endTime, "Not ended");
        auction.settled = true;

        if (auction.highestBidder == address(0)) {
            INFT(nft).safeTransferFrom(address(this), auction.seller, auction.tokenId);
            emit AuctionSettled(auctionId, address(0), 0);
            return;
        }

        uint256 holdersFee = (auction.highestBid * holdersBps) / 10000;
        uint256 burnFee = (auction.highestBid * burnBps) / 10000;
        uint256 platformFee = (auction.highestBid * platformBps) / 10000;
        uint256 payout = auction.highestBid - holdersFee - burnFee - platformFee;

        require(paymentToken.transfer(auction.seller, payout), "Pay seller failed");
        if (platformFee > 0) {
            require(paymentToken.transfer(feeRecipient, platformFee), "Pay platform failed");
        }
        if (burnFee > 0) {
            require(paymentToken.transfer(DEAD, burnFee), "Burn failed");
        }
        if (holdersFee > 0) {
            _updateRewards(holdersFee);
        }

        INFT(nft).safeTransferFrom(address(this), auction.highestBidder, auction.tokenId);
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
