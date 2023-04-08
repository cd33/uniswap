// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Callee.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "hardhat/console.sol";

contract TestUniswapV2 is IUniswapV2Callee {
    address private constant UniswapV2Factory =
        0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f;
    address private constant UniswapV2Router =
        0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;
    address private constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;

    event AddLiquidity(uint256 amountA, uint256 amountB, uint256 liquidity);
    event RemoveLiquidity(uint256 amountA, uint256 amountB);

    // Swap
    function swap(
        address _tokenIn,
        address _tokenOut,
        uint256 _amountIn,
        uint256 _amountOutMin,
        address _to
    ) external {
        IERC20(_tokenIn).transferFrom(msg.sender, address(this), _amountIn);
        IERC20(_tokenIn).approve(UniswapV2Router, _amountIn);

        address[] memory path;
        // Because it's the best route to pass from DAI to WBTC
        if (_tokenIn == WETH || _tokenOut == WETH) {
            path = new address[](2);
            path[0] = _tokenIn;
            path[1] = _tokenOut;
        } else {
            path = new address[](3);
            path[0] = _tokenIn;
            path[1] = WETH;
            path[2] = _tokenOut;
        }

        IUniswapV2Router02(UniswapV2Router).swapExactTokensForTokens(
            _amountIn,
            _amountOutMin,
            path,
            _to,
            block.timestamp
        );
    }

    function getAmountOutMin(
        address _tokenIn,
        address _tokenOut,
        uint256 _amountIn
    ) external view returns (uint256) {
        address[] memory path;
        if (_tokenIn == WETH || _tokenOut == WETH) {
            path = new address[](2);
            path[0] = _tokenIn;
            path[1] = _tokenOut;
        } else {
            path = new address[](3);
            path[0] = _tokenIn;
            path[1] = WETH;
            path[2] = _tokenOut;
        }

        // same length as path
        uint256[] memory amountOutMins = IUniswapV2Router02(UniswapV2Router)
            .getAmountsOut(_amountIn, path);

        return amountOutMins[path.length - 1];
    }

    // Liquidity
    function addLiquidity(
        address _tokenA,
        address _tokenB,
        uint256 _amountA,
        uint256 _amountB
    ) external {
        IERC20(_tokenA).transferFrom(msg.sender, address(this), _amountA);
        IERC20(_tokenB).transferFrom(msg.sender, address(this), _amountB);
        IERC20(_tokenA).approve(UniswapV2Router, _amountA);
        IERC20(_tokenB).approve(UniswapV2Router, _amountB);

        (
            uint256 amountA,
            uint256 amountB,
            uint256 liquidity
        ) = IUniswapV2Router02(UniswapV2Router).addLiquidity(
                _tokenA,
                _tokenB,
                _amountA,
                _amountB,
                1,
                1,
                address(this),
                block.timestamp
            );
        emit AddLiquidity(amountA, amountB, liquidity);
    }

    function removeLiquidity(address _tokenA, address _tokenB) external {
        address pair = IUniswapV2Factory(UniswapV2Factory).getPair(
            _tokenA,
            _tokenB
        );

        uint256 liquidity = IERC20(pair).balanceOf(address(this));

        IERC20(pair).approve(UniswapV2Router, liquidity);

        (uint256 amountA, uint256 amountB) = IUniswapV2Router02(UniswapV2Router)
            .removeLiquidity(
                _tokenA,
                _tokenB,
                liquidity,
                1,
                1,
                address(this),
                block.timestamp
            );
        emit RemoveLiquidity(amountA, amountB);
    }

    // Flash Swap / Flash Loan
    function testFlashSwap(address _tokenBorrow, uint256 _amount) external {
        address pair = IUniswapV2Factory(UniswapV2Factory).getPair(
            _tokenBorrow,
            WETH
        );
        require(pair != address(0), "!pair");
        address token0 = IUniswapV2Pair(pair).token0();
        address token1 = IUniswapV2Pair(pair).token1();
        uint256 amount0Out = _tokenBorrow == token0 ? _amount : 0;
        uint256 amount1Out = _tokenBorrow == token1 ? _amount : 0;

        // to trigger uniswapV2Call otherwise trigger a normal swap
        bytes memory data = abi.encode(_tokenBorrow, _amount);
        IUniswapV2Pair(pair).swap(amount0Out, amount1Out, address(this), data);
    }

    function uniswapV2Call(
        address _sender,
        uint256 _amount0,
        uint256 _amount1,
        bytes calldata _data
    ) external override {
        require(_sender == address(this), "!sender");
        address token0 = IUniswapV2Pair(msg.sender).token0();
        address token1 = IUniswapV2Pair(msg.sender).token1();
        address pair = IUniswapV2Factory(UniswapV2Factory).getPair(
            token0,
            token1
        );
        require(msg.sender == pair, "!pair");

        (address tokenBorrow, uint256 amount) = abi.decode(
            _data,
            (address, uint)
        );

        // Uniswap charges 0.3% for any form of swap
        uint fee = ((amount * 3) / 997) + 1;
        uint amountToRepay = amount + fee;

        console.log("amount", amount);
        console.log("_amount0", _amount0);
        console.log("_amount1", _amount1);
        console.log("fee", fee);
        console.log("amountToRepay", amountToRepay);

        IERC20(tokenBorrow).transfer(pair, amountToRepay);
    }
}
