import "module-alias/register";
import { BigNumber } from "@ethersproject/bignumber";

import { Address } from "@utils/types";
import { Account } from "@utils/test/types";
import { ZERO } from "@utils/constants";
import { AxieInfinityMigrationWrapAdapter, TokenSwap } from "@utils/contracts";
import DeployHelper from "@utils/deploys";
import {
  ether,
} from "@utils/index";
import {
  addSnapshotBeforeRestoreAfterEach,
  getAccounts,
  getWaffleExpect
} from "@utils/test/index";

const expect = getWaffleExpect();

describe("AxieInfinityMigrationWrapAdapter", () => {
  let owner: Account;
  let deployer: DeployHelper;
  let tokenSwap: TokenSwap;
  let axieMigrationWrapAdapter: AxieInfinityMigrationWrapAdapter;

  let mockOtherUnderlyingToken: Account;
  let mockOtherWrappedToken: Account;
  let newAxsToken: Account;
  let oldAxsToken: Account;

  before(async () => {
    [
      owner,
      mockOtherUnderlyingToken,
      mockOtherWrappedToken,
      newAxsToken,
      oldAxsToken,
    ] = await getAccounts();

    deployer = new DeployHelper(owner.wallet);

    tokenSwap = await deployer.external.deployTokenSwap(oldAxsToken.address, newAxsToken.address);

    axieMigrationWrapAdapter = await deployer.adapters.deployAxieInfinityMigrationWrapAdapter(
      tokenSwap.address,
      oldAxsToken.address,
      newAxsToken.address
    );
  });

  addSnapshotBeforeRestoreAfterEach();

  describe("#constructor", async () => {
    let subjectTokenSwap: Address;
    let subjectoldAxsToken: Address;
    let subjectnewAxsToken: Address;

    beforeEach(async () => {
      subjectTokenSwap = tokenSwap.address;
      subjectoldAxsToken = oldAxsToken.address;
      subjectnewAxsToken = newAxsToken.address;
    });

    async function subject(): Promise<any> {
      return deployer.adapters.deployAxieInfinityMigrationWrapAdapter(
        subjectTokenSwap,
        subjectoldAxsToken,
        subjectnewAxsToken
      );
    }

    it("should have the correct tokenSwap address", async () => {
      const deployedAxieMigrationWrapAdapter = await subject();

      const actualTokenSwap = await deployedAxieMigrationWrapAdapter.tokenSwap();
      expect(actualTokenSwap).to.eq(subjectTokenSwap);
    });

    it("should have the correct old AXS token address", async () => {
      const deployedAxieMigrationWrapAdapter = await subject();

      const actualOldAxsToken = await deployedAxieMigrationWrapAdapter.oldToken();
      expect(actualOldAxsToken).to.eq(subjectoldAxsToken);
    });

    it("should have the correct new AXS token address", async () => {
        const deployedAxieMigrationWrapAdapter = await subject();

        const actualNewAxsToken = await deployedAxieMigrationWrapAdapter.newToken();
        expect(actualNewAxsToken).to.eq(subjectnewAxsToken);
      });
  });

  describe("#getSpenderAddress", async () => {
    async function subject(): Promise<any> {
      return axieMigrationWrapAdapter.getSpenderAddress(
        oldAxsToken.address,
        newAxsToken.address
      );
    }

    it("should return the correct spender address", async () => {
      const spender = await subject();

      expect(spender).to.eq(tokenSwap.address);
    });
  });

  describe("#getWrapCallData", async () => {
    let subjectUnderlyingToken: Address;
    let subjectWrappedToken: Address;
    let subjectUnderlyingUnits: BigNumber;

    beforeEach(async () => {
      subjectUnderlyingToken = oldAxsToken.address;
      subjectWrappedToken = newAxsToken.address;
      subjectUnderlyingUnits = ZERO;
    });

    async function subject(): Promise<any> {
      return axieMigrationWrapAdapter.getWrapCallData(subjectUnderlyingToken, subjectWrappedToken, subjectUnderlyingUnits);
    }

    it("should return correct data for valid pair", async () => {
      const [targetAddress, ethValue, callData] = await subject();

      const expectedCallData = tokenSwap.interface.encodeFunctionData("swapToken");

      expect(targetAddress).to.eq(tokenSwap.address);
      expect(ethValue).to.eq(ZERO);
      expect(callData).to.eq(expectedCallData);
    });

    describe("when underlying asset is not old AXS token", () => {
      beforeEach(async () => {
        subjectUnderlyingToken = mockOtherUnderlyingToken.address;
      });

      it("should revert", async () => {
        await expect(subject()).to.be.revertedWith("Must be old AXS token");
      });
    });

    describe("when wrapped asset is not new AXS token", () => {
      beforeEach(async () => {
        subjectWrappedToken = mockOtherWrappedToken.address;
      });

      it("should revert", async () => {
        await expect(subject()).to.be.revertedWith("Must be new AXS token");
      });
    });
  });

  describe("#getUnwrapCallData", async () => {
    let subjectUnderlyingToken: Address;
    let subjectWrappedToken: Address;
    let subjectWrappedTokenUnits: BigNumber;

    beforeEach(async () => {
      subjectUnderlyingToken = mockOtherUnderlyingToken.address;
      subjectWrappedToken = mockOtherWrappedToken.address;
      subjectWrappedTokenUnits = ether(2);
    });

    async function subject(): Promise<any> {
      return axieMigrationWrapAdapter.getUnwrapCallData(subjectUnderlyingToken, subjectWrappedToken, subjectWrappedTokenUnits);
    }

    it("should revert", async () => {
      await expect(subject()).to.be.revertedWith("AXS migration cannot be reversed");
    });
  });
});