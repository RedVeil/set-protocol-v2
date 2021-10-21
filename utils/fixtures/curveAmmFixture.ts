import { providers } from "ethers";
import { Address } from "../types";
import DeployHelper from "../deploys";
import { Signer } from "ethers";
import { MetapoolStableSwap } from "@typechain/MetapoolStableSwap";
import { ether } from "@utils/common";
import { StandardTokenMock } from "@typechain/StandardTokenMock";
import { ethers } from "hardhat";
import dependencies from "@utils/deploys/dependencies";
import { ERC20 } from "@typechain/ERC20";
import MetapoolFactoryAbi from "../../external/abi/curve/MetapoolFactory.json";
import MetaPoolStableSwapAbi from "../../external/abi/curve/MetapoolStableSwap.json";
import { MetapoolFactory } from "@typechain/MetapoolFactory";
import { CurveFactoryMetapoolAmmAdapter } from "@typechain/CurveFactoryMetapoolAmmAdapter";

interface FactoryMetapoolSetup {
  pool: MetapoolStableSwap;
  lpToken: MetapoolStableSwap;
  underlying: [Address, Address];
}
export class CurveAmmFixture {
  private _ownerAddress: Address;
  private _ownerSigner: Signer;
  private _deployer: DeployHelper;

  public mim: ERC20;
  public setToken: StandardTokenMock;
  public threeCrv: ERC20;

  public metapoolFactory: MetapoolFactory;

  public mim3CRVFactoryMetapoolSetup: FactoryMetapoolSetup;

  public curveFactoryMetapoolAmmAdapter: CurveFactoryMetapoolAmmAdapter;

  constructor(provider: providers.Web3Provider | providers.JsonRpcProvider, ownerAddress: Address) {
    this._ownerAddress = ownerAddress;
    this._ownerSigner = provider.getSigner(ownerAddress);
    this._deployer = new DeployHelper(this._ownerSigner);
  }



  public async deployForkedContracts(): Promise<void> {
    this.mim = (await ethers.getContractAt("ERC20", dependencies.MIM[1])) as ERC20;
    this.threeCrv = (await ethers.getContractAt("ERC20", dependencies.THREE_CRV[1])) as ERC20;

    this.setToken = await this._deployer.mocks.deployTokenMock(
      this._ownerAddress,
      ether(1000000),
      18,
    );

    this.metapoolFactory = (await ethers.getContractAt(
      MetapoolFactoryAbi.abi,
      "0x0959158b6040D32d04c301A72CBFD6b39E21c9AE",
    )) as MetapoolFactory;

    const factoryMetapool = (await ethers.getContractAt(
      MetaPoolStableSwapAbi.abi,
      "0x5a6A4D54456819380173272A5E8E9B9904BdF41B",
    )) as MetapoolStableSwap; // MIM factory Metapool

    this.curveFactoryMetapoolAmmAdapter = await this._deployer.adapters.deployCurveFactoryMetapoolAmmAdapter(
      this.metapoolFactory.address
    );

    this.mim3CRVFactoryMetapoolSetup = {
      pool: factoryMetapool,
      lpToken: factoryMetapool,
      underlying: [this.mim.address, this.threeCrv.address],
    };
  }
}