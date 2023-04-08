import { expect } from "chai";
import { ethers } from "hardhat";
import { TestUniswapV2, IERC20 } from "../typechain-types";

const DAI = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
const WBTC = "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599";
const AAVE = "0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9";
const LINK = "0x514910771AF9Ca656af840dff83E8264EcF986CA";
const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const USDT = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
// const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
// const BUSD = "0x4Fabb145d64652a948d72533023f6E7A623C7C53"

const DAI_WHALE = "0xF977814e90dA44bFA03b6295A0616a897441aceC";
const USDT_WHALE = "0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503";

describe("Uniswap V2", function () {
  let testUniswapV2: TestUniswapV2;
  let tokenIn: IERC20;
  let tokenOut: IERC20;
  let tokenA: IERC20;
  let tokenB: IERC20;
  let tokenFlashUSDC: IERC20;

  before(async function () {
    [this.owner, this.investor] = await ethers.getSigners();
    // 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266, 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
    this.whale = await ethers.getImpersonatedSigner(DAI_WHALE);
    // this.whaleUSDT = await ethers.getImpersonatedSigner(USDT_WHALE);
    const TestUniswapV2 = await ethers.getContractFactory("TestUniswapV2");
    testUniswapV2 = await TestUniswapV2.deploy();
    await testUniswapV2.deployed();
    tokenIn = await ethers.getContractAt("IERC20", DAI);
    tokenOut = await ethers.getContractAt("IERC20", WBTC);
    tokenA = await ethers.getContractAt("IERC20", AAVE);
    tokenB = await ethers.getContractAt("IERC20", LINK);
    tokenFlashUSDC = await ethers.getContractAt("IERC20", USDC);
  });

  describe("Swap", function () {
    it("Should pass", async function () {
      const amountIn = ethers.utils.parseEther("1000000"); // 1 million DAI
      const amountOut = ethers.utils.parseUnits("30", 8); // Minimum 30 WBTC

      await tokenIn
        .connect(this.whale)
        .approve(testUniswapV2.address, amountIn);

      const balanceWhaleBeforeDAI = await tokenIn.balanceOf(this.whale.address);
      const balanceInvestorBeforeWBTC = await tokenOut.balanceOf(
        this.investor.address
      );
      expect(balanceInvestorBeforeWBTC).to.equal(0);

      const getAmountOutMin = await testUniswapV2
        .connect(this.whale)
        .getAmountOutMin(tokenIn.address, tokenOut.address, amountIn);

      await testUniswapV2
        .connect(this.whale)
        .swap(
          tokenIn.address,
          tokenOut.address,
          amountIn,
          amountOut,
          this.investor.address
        );

      const balanceWhaleAfterDAI = await tokenIn.balanceOf(this.whale.address);
      const balanceInvestorAfterWBTC = await tokenOut.balanceOf(
        this.investor.address
      );
      expect(balanceWhaleAfterDAI).to.equal(
        balanceWhaleBeforeDAI.sub(amountIn)
      );
      expect(balanceInvestorAfterWBTC)
        .to.equal(getAmountOutMin)
        .to.be.gt(balanceInvestorBeforeWBTC);
    });
  });

  describe("Add & Remove Liquidity", function () {
    it("Should pass", async function () {
      const amountTokenA = ethers.utils.parseEther("900");
      const amountTokenB = ethers.utils.parseEther("10000");
      await tokenA
        .connect(this.whale)
        .approve(testUniswapV2.address, amountTokenA);
      await tokenB
        .connect(this.whale)
        .approve(testUniswapV2.address, amountTokenB);

      let tx = await testUniswapV2
        .connect(this.whale)
        .addLiquidity(
          tokenA.address,
          tokenB.address,
          amountTokenA,
          amountTokenB
        );
      let result = await tx.wait();
      if (result.events) {
        for (const res of result.events) {
          res.event && console.log(res.event, ": args => ", res.args);
        }
      }

      tx = await testUniswapV2
        .connect(this.whale)
        .removeLiquidity(tokenA.address, tokenB.address);
      result = await tx.wait();
      if (result.events) {
        for (const res of result.events) {
          res.event && console.log(res.event, ": args => ", res.args);
        }
      }
    });
  });

  describe("Flash Swap / Flash Loan", function () {
    it("Should pass", async function () {
      const decimalsUSDC = 6;
      const borrowAmount = ethers.utils.parseUnits("500", decimalsUSDC);
      const fee = Math.round(borrowAmount.mul(3).div(997).add(1).toNumber());

      // transfer to contract the fees
      let balanceContractUSDC = await tokenFlashUSDC.balanceOf(
        testUniswapV2.address
      );
      expect(balanceContractUSDC).to.equal(0);
      await tokenFlashUSDC
        .connect(this.whale)
        .transfer(testUniswapV2.address, fee);
      balanceContractUSDC = await tokenFlashUSDC.balanceOf(
        testUniswapV2.address
      );
      expect(balanceContractUSDC).to.equal(fee);

      await testUniswapV2
        .connect(this.whale)
        .testFlashSwap(tokenFlashUSDC.address, borrowAmount);

      balanceContractUSDC = await tokenFlashUSDC.balanceOf(
        testUniswapV2.address
      );
      expect(balanceContractUSDC).to.equal(0);
    });
  });
});
