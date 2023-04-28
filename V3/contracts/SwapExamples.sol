// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity =0.7.6;
pragma abicoder v2;

import "@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol";
import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";

// This example swaps WETH9/DAI for single path swaps and WETH9/USDC/DAI for multi path swaps.
contract SwapExamples {
    // NOTE: Does not work with SwapRouter02
    ISwapRouter public constant swapRouter =
        ISwapRouter(0xE592427A0AEce92De3Edee1F18E0157C05861564);

    address public constant DAI = 0x6B175474E89094C44Da98b954EedeAC495271d0F;
    address public constant WETH9 = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    address public constant USDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;

    /// @notice Swaps a fixed amount of WETH for a maximum possible amount of DAI
    function swapExactInputSingle(uint amountIn) external returns (uint amountOut) {
        // msg.sender must approve this contract

        // Transfer the specified amount of WETH9 to this contract.
        TransferHelper.safeTransferFrom(
            WETH9,
            msg.sender,
            address(this),
            amountIn
        );
        // Approve the router to spend WETH9.
        TransferHelper.safeApprove(WETH9, address(swapRouter), amountIn);

        // Naively set amountOutMinimum to 0. In production, use an oracle or other data source to choose a safer value for amountOutMinimum.
        // We also set the sqrtPriceLimitx96 to be 0 to ensure we swap our exact input amount.
        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter
        .ExactInputSingleParams({
            tokenIn: WETH9,
            tokenOut: DAI,
            fee: 3000, // pool fee 0.3%
            recipient: msg.sender,
            deadline: block.timestamp,
            amountIn: amountIn,
            amountOutMinimum: 0,
            // NOTE: In production, this value can be used to set the limit
            // for the price the swap will push the pool to,
            // which can help protect against price impact
            sqrtPriceLimitX96: 0
        });

        // The call to `exactInputSingle` executes the swap.
        amountOut = swapRouter.exactInputSingle(params);
    }

    /// @notice swaps a minimum possible amount of WETH for a fixed amount of DAI.
    /// @dev The calling address must approve this contract to spend its WETH9 for this function to succeed. As the amount of input WETH9 is variable,
    /// the calling address will need to approve for a slightly higher amount, anticipating some variance.
    /// @param amountOut The exact amount of DAI to receive from the swap.
    /// @param amountInMaximum The amount of WETH9 we are willing to spend to receive the specified amount of DAI.
    /// @return amountIn The amount of WETH9 actually spent in the swap.
    function swapExactOutputSingle(uint amountOut, uint amountInMaximum) external returns (uint amountIn) {
        TransferHelper.safeTransferFrom(
            WETH9,
            msg.sender,
            address(this),
            amountInMaximum
        );
        // In production, you should choose the maximum amount to spend based on oracles or other data sources to acheive a better swap.
        TransferHelper.safeApprove(WETH9, address(swapRouter), amountInMaximum);

        ISwapRouter.ExactOutputSingleParams memory params = ISwapRouter
            .ExactOutputSingleParams({
                tokenIn: WETH9,
                tokenOut: DAI,
                fee: 3000,
                recipient: msg.sender,
                deadline: block.timestamp,
                amountOut: amountOut,
                amountInMaximum: amountInMaximum,
                sqrtPriceLimitX96: 0
            });

        // Executes the swap returning the amountIn needed to spend to receive the desired amountOut.
        amountIn = swapRouter.exactOutputSingle(params);

        if (amountIn < amountInMaximum) {
            // Reset approval on router
            TransferHelper.safeApprove(WETH9, address(swapRouter), 0);
            // Refund WETH to user
            TransferHelper.safeTransfer(
                WETH9,
                msg.sender,
                amountInMaximum - amountIn
            );
        }
    }

    /// @notice swapInputMultiplePools swaps a fixed amount of WETH for a maximum possible amount of DAI
    /// swap WETH --> USDC --> DAI
    function swapExactInputMultihop(uint amountIn) external returns (uint amountOut) {
        TransferHelper.safeTransferFrom(
            WETH9,
            msg.sender,
            address(this),
            amountIn
        );
        TransferHelper.safeApprove(WETH9, address(swapRouter), amountIn);

        // Multiple pool swaps are encoded through bytes called a `path`. A path is a sequence of token addresses and poolFees that define the pools used in the swaps.
        // The format for pool encoding is (tokenIn, fee, tokenOut/tokenIn, fee, tokenOut) where tokenIn/tokenOut parameter is the shared token across the pools.
        // Since we are swapping WETH9 to USDC and then USDC to DAI the path encoding is (WETH9, 0.3%, USDC, 0.01%, DAI).
        ISwapRouter.ExactInputParams memory params = ISwapRouter
            .ExactInputParams({
                path: abi.encodePacked(
                    WETH9,
                    uint24(3000), // to know the value https://info.uniswap.org/#/pools (USDC/ETH 0.3%)
                    USDC,
                    uint24(100), // (DAI/USDC 0.01%)
                    DAI
                ),
                recipient: msg.sender,
                deadline: block.timestamp,
                amountIn: amountIn,
                amountOutMinimum: 0
            });
        amountOut = swapRouter.exactInput(params);
    }

    /// @notice swapExactOutputMultihop swaps a minimum possible amount of WETH for a fixed amount of USDC
    /// swap WETH --> USDC --> DAI
    function swapExactOutputMultihop(uint amountOut, uint amountInMaximum) external returns (uint amountIn) {
        TransferHelper.safeTransferFrom(
            WETH9,
            msg.sender,
            address(this),
            amountInMaximum
        );
        TransferHelper.safeApprove(WETH9, address(swapRouter), amountInMaximum);

        // The parameter path is encoded as (tokenOut, fee, tokenIn/tokenOut, fee, tokenIn)
        ISwapRouter.ExactOutputParams memory params = ISwapRouter
            .ExactOutputParams({
                path: abi.encodePacked(
                    DAI,
                    uint24(100),
                    USDC,
                    uint24(3000),
                    WETH9
                ),
                recipient: msg.sender,
                deadline: block.timestamp,
                amountOut: amountOut,
                amountInMaximum: amountInMaximum
            });

        amountIn = swapRouter.exactOutput(params);
        if (amountIn < amountInMaximum) {
            TransferHelper.safeApprove(WETH9, address(swapRouter), 0);
            TransferHelper.safeTransferFrom(
                WETH9,
                address(this),
                msg.sender,
                amountInMaximum - amountIn
            );
        }
    }
}