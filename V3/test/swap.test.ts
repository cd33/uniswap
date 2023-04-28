import { reset } from "@nomicfoundation/hardhat-network-helpers";
import { ethers } from "hardhat";
import { IERC20, IWETH9, SwapExamples } from "../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

const DAI = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
const WETH9 = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const ALCHEMY_MAINNET = process.env.ALCHEMY_MAINNET || "";
const blockNumber = 17144228

describe("SwapExamples", function () {
  let accounts: SignerWithAddress[];
  let dai: IERC20;
  let weth: IWETH9;
  let usdc: IERC20;
  let swapExamples: SwapExamples;

  beforeEach(async () => {
    await reset(ALCHEMY_MAINNET, blockNumber)
    accounts = await ethers.getSigners();

    dai = await ethers.getContractAt("IERC20", DAI);
    weth = await ethers.getContractAt("IWETH9", WETH9);
    usdc = await ethers.getContractAt("IERC20", USDC);

    const SwapExamples = await ethers.getContractFactory("SwapExamples");
    swapExamples = await SwapExamples.deploy();
    await swapExamples.deployed();
  });

  it("SwapExactInputSingle", async function () {
    const amountIn = ethers.utils.parseEther("1");
    await weth.deposit({ value: amountIn });
    await weth.approve(swapExamples.address, amountIn);

    await swapExamples.swapExactInputSingle(amountIn);

    console.log("DAI Balance: ", await dai.balanceOf(accounts[0].address));
  });

  it("SwapExactOutputSingle", async function () {
    const wethAmountInMax = ethers.utils.parseEther("1");
    const daiAmountOut = ethers.utils.parseEther("1000");

    await weth.deposit({ value: wethAmountInMax });
    await weth.approve(swapExamples.address, wethAmountInMax);

    await swapExamples.swapExactOutputSingle(daiAmountOut, wethAmountInMax);

    console.log("DAI Balance: ", await dai.balanceOf(accounts[0].address));
  });

  it("swapExactInputMultihop", async function () {
    const amountIn = ethers.utils.parseEther("1");
    await weth.deposit({ value: amountIn });
    await weth.approve(swapExamples.address, amountIn);

    await swapExamples.swapExactInputMultihop(amountIn);

    console.log("DAI Balance: ", await dai.balanceOf(accounts[0].address));
  });

  it("swapExactOutputMultihop", async function () {
    const wethAmountInMax = ethers.utils.parseEther("1");
    const daiAmountOut = ethers.utils.parseEther("1000");

    await weth.deposit({ value: wethAmountInMax });
    await weth.approve(swapExamples.address, wethAmountInMax);

    await swapExamples.swapExactOutputMultihop(daiAmountOut, wethAmountInMax);

    console.log("DAI Balance: ", await dai.balanceOf(accounts[0].address));
  });
});
