// import { reset } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { IERC20, IWETH9, LiquidityExamples } from "../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

const DAI = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
const WETH9 = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const WHALE = "0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503";
// const ALCHEMY_MAINNET = process.env.ALCHEMY_MAINNET || "";
// const blockNumber = 17144228;

describe.only("LiquidityExamples", function () {
  let accounts: SignerWithAddress[];
  let dai: IERC20;
  let weth: IWETH9;
  let usdc: IERC20;
  let liquidityExamples: LiquidityExamples;
  let whale: SignerWithAddress;

  before(async () => {
    // await reset(ALCHEMY_MAINNET, blockNumber);
    accounts = await ethers.getSigners();

    const whale = await ethers.getImpersonatedSigner(WHALE);

    dai = await ethers.getContractAt("IERC20", DAI);
    weth = await ethers.getContractAt("IWETH9", WETH9);
    usdc = await ethers.getContractAt("IERC20", USDC);

    const LiquidityExamples = await ethers.getContractFactory(
      "LiquidityExamples"
    );
    liquidityExamples = await LiquidityExamples.deploy();
    await liquidityExamples.deployed();

    const daiAmount = ethers.utils.parseEther("1000");
    const usdcAmount = ethers.utils.parseUnits("1000", 6);

    expect(await dai.balanceOf(WHALE)).to.be.gt(daiAmount);
    expect(await usdc.balanceOf(WHALE)).to.be.gt(usdcAmount);

    await dai.connect(whale).transfer(accounts[0].address, daiAmount);
    await usdc.connect(whale).transfer(accounts[0].address, usdcAmount);
  });

  it("mintNewPosition and collectAllFees", async function () {
    const daiAmount = ethers.utils.parseEther("100");
    const usdcAmount = ethers.utils.parseUnits("100", 6);

    await dai.transfer(liquidityExamples.address, daiAmount);
    await usdc.transfer(liquidityExamples.address, usdcAmount);

    await liquidityExamples.mintNewPosition();

    console.log(
      "await dai.balanceOf(accounts[0].address) :>> ",
      await dai.balanceOf(accounts[0].address)
    );
    console.log(
      "await usdc.balanceOf(accounts[0].address) :>> ",
      await usdc.balanceOf(accounts[0].address)
    );
  });

  it("collectAllFees", async function () {
    const tokenId = await liquidityExamples.tokenId();
    console.log("tokenId :>> ", tokenId);
    await liquidityExamples.collectAllFees();
  });

  it.skip("increaseLiquidityCurrentRange", async function () {
    const daiAmount = ethers.utils.parseEther("20");
    const usdcAmount = ethers.utils.parseUnits("20", 6);
    await dai.approve(liquidityExamples.address, daiAmount);
    await usdc.approve(liquidityExamples.address, usdcAmount);

    await liquidityExamples.increaseLiquidityCurrentRange(
      daiAmount,
      usdcAmount
    );

    console.log(
      "await dai.balanceOf(accounts[0].address) :>> ",
      await dai.balanceOf(accounts[0].address)
    );
    console.log(
      "await usdc.balanceOf(accounts[0].address) :>> ",
      await usdc.balanceOf(accounts[0].address)
    );
  });

  it("decreaseLiquidity", async function () {
    const tokenId = await liquidityExamples.tokenId();
    const liquidity = await liquidityExamples.getLiquidity(tokenId);

    await liquidityExamples.decreaseLiquidity(liquidity);

    console.log(
      "await dai.balanceOf(liquidityExamples.address) :>> ",
      await dai.balanceOf(liquidityExamples.address)
    );
    console.log(
      "await usdc.balanceOf(liquidityExamples.address) :>> ",
      await usdc.balanceOf(liquidityExamples.address)
    );
  });

  it("collectAllFees", async function () {
    await liquidityExamples.collectAllFees();

    console.log(
      "await dai.balanceOf(liquidityExamples.address) :>> ",
      await dai.balanceOf(liquidityExamples.address)
    );
    console.log(
      "await usdc.balanceOf(liquidityExamples.address) :>> ",
      await usdc.balanceOf(liquidityExamples.address)
    );
  });
});
