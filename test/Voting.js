const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
require("@nomicfoundation/hardhat-chai-matchers");

describe("Voting", function () {
  async function deployFixture() {
    const proposals = [
      ["APC", "chris"],
      ["PDP", "peter"],
      ["LP", "doe"],
    ];
    const NOW = await time.latest();
    const START_DATE = NOW + 7 * 24 * 60 * 60;
    const END_DATE = 30 * 24 * 60 * 60 + START_DATE;

    const [owner, otherAccount, otherAccount1, otherAccount2] =
      await ethers.getSigners();

    const Voting = await ethers.getContractFactory("Voting");
    const voting = await Voting.deploy(
      START_DATE,
      END_DATE,
      "ayaversity",
      proposals
    );

    return {
      voting,
      START_DATE,
      END_DATE,
      owner,
      otherAccount,
      proposals,
      otherAccount1,
      otherAccount2,
    };
  }

  describe("Deployment", function () {
    it("Should return proposals", async function () {
      const { proposals, voting } = await loadFixture(deployFixture);
      const res = await voting.getCandidates();
      const r = res.map((i) => [i[2], i[1]]);
      expect(r).to.deep.equal(proposals);
    });

    it("Should return a current leading Candidate before voting", async function () {
      const { voting } = await loadFixture(deployFixture);
      const res = await voting.getCurrentStatus();
      const r = [
        ethers.toNumber(res[0]),
        ethers.toNumber(res[1]),
        res[2],
        res[3],
      ];
      expect(r).to.deep.equal([0, 0, "ayaversity", "APC"]);
    });

    it("Should return a current leading Candidate after voting", async function () {
      const { voting, START_DATE, otherAccount, otherAccount1, otherAccount2 } =
        await loadFixture(deployFixture);
      await time.increaseTo(START_DATE);

      await voting.vote(1);
      await voting.connect(otherAccount).vote(0);
      await voting.connect(otherAccount1).vote(2);
      await voting.connect(otherAccount2).vote(2);
      const res = await voting.getCurrentStatus();
      const r = [
        ethers.toNumber(res[0]),
        ethers.toNumber(res[1]),
        res[2],
        res[3],
      ];
      expect(r).to.deep.equal([2, 4, "ayaversity", "LP"]);
    });

    it("Should emit a VoteCast event", async function () {
      const { voting, START_DATE } = await loadFixture(deployFixture);
      await time.increaseTo(START_DATE);
      await expect(voting.vote(0)).to.emit(voting, "VoteCast");
    });
    it("Should revert if called before voting starts", async function () {
      const { voting } = await loadFixture(deployFixture);
      await expect(voting.vote(0)).to.be.revertedWith(
        "Too early to call fuction"
      );
    });
    it("Should revert if called after voting ends", async function () {
      const { voting, END_DATE } = await loadFixture(deployFixture);
      await time.increaseTo(END_DATE);
      await expect(voting.vote(0)).to.be.revertedWith(
        "Too late to call fuction"
      );
    });

    it("Should revert if you have already cast your vote", async function () {
      const { voting, START_DATE } = await loadFixture(deployFixture);
      await time.increaseTo(START_DATE);
      await voting.vote(0);
      await expect(voting.vote(1)).to.be.revertedWith("You have voted already");
    });

    it("Should return winner after voting", async function () {
      const {
        voting,
        START_DATE,
        END_DATE,
        otherAccount,
        otherAccount1,
        otherAccount2,
      } = await loadFixture(deployFixture);
      await time.increaseTo(START_DATE);
      await voting.vote(0);
      await voting.connect(otherAccount).vote(1);
      await voting.connect(otherAccount1).vote(1);
      await voting.connect(otherAccount2).vote(2);
      await time.increaseTo(END_DATE);
      const rawTx = await voting.getWinner();
      const tx = await rawTx.wait();
      const res = new ethers.AbiCoder().decode(["string[]"], tx.logs[0].data);
      expect(res[0]).to.deep.equal(["peter"]);
    });

    it("Should return emit winner event", async function () {
      const { voting, START_DATE, END_DATE } = await loadFixture(deployFixture);
      await time.increaseTo(START_DATE);
      await voting.vote(0);
      await time.increaseTo(END_DATE);
      expect(await voting.getWinner()).to.emit(voting, "Winner");
    });

    it("Should revert if called before voting ends", async function () {
      const { voting, START_DATE } = await loadFixture(deployFixture);
      await time.increaseTo(START_DATE);
      await voting.vote(0);
      await expect(voting.getWinner()).to.be.revertedWith(
        "Too early to call fuction"
      );
    });
  });
});
