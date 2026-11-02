import React, { useState, useContext } from "react";
import ethereumIcon from "../images/ethereumIcon.png";
import {
  getStakeBalance,
  getWalletBalance,
  getTotalStaked,
  getRemainTimeToStake,
  getAvailableStakeBalance,
  getAccumulatedPoint,
  unstake,
  emergencyUnstake,
  stake,
} from "../utils/Contract";
import { MyContext } from "../landingcomponents/MyContext";
import { StakeSettingModal } from "./StakeSettingModal";
import Countdown from "react-countdown";

export const EthereumModal = ({ address, onDisconnect }) => {
  const [stakedAmount, setStakedAmount] = useState(0);
  const [walletBalance, setWalletBalance] = useState(0);
  const [totalStaked, setTotalStaked] = useState(0);
  const [remainTimeToStake, setRemainTimeToStake] = useState(0);
  const [availableStakeBalance, setAvailableStakeBalance] = useState(0);
  const [stakeValue, setStakeValue] = useState(0);
  const [accumulatedPoint, setAccumulatedPoint] = useState(0);
  const [defaultDay, setDefaultDay] = useState(30);
  const [modalShow, setModalShow] = useState(false);
  const [stakeType, setStakeType] = useState("");
  const AlertContext = useContext(MyContext);

  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + defaultDay);
  const changeDate = futureDate.toISOString().slice(0, 10);

  const onChangeDay = (pDay) => setDefaultDay(pDay);
  const changeStakeValue = (e) => setStakeValue(e.target.value);

  const onStake = async () => {
    const ret = await stake(
      defaultDay === 15 ? 0 : defaultDay === 30 ? 1 : 2,
      stakeValue * 1e9,
      address
    );
    AlertContext.setAlert(ret);
    setModalShow(false);
  };

  const onUnstake = async () => {
    const ret = await unstake(address);
    AlertContext.setAlert(ret);
    setModalShow(false);
  };

  const onEmergencyUnstake = async () => {
    const ret = await emergencyUnstake(address);
    AlertContext.setAlert(ret);
    setModalShow(false);
  };

  return (
    <div className="EthereumModal">
      <StakeSettingModal
        show={modalShow}
        onHide={() => setModalShow(false)}
        onStake={onStake}
        onUnstake={onUnstake}
        onEmergencyUnstake={onEmergencyUnstake}
        stakeType={stakeType}
        stakeValue={stakeValue}
        defaultDay={defaultDay}
      />
      <div className="centerModal">
        <div className="btnGroup firstGroup">
          <div className="ethBtn ethBtn1 ethIconBtn">
            <img src={ethereumIcon} alt="ethereum" />
            Sepolia
          </div>
          <div className="ethBtn1">Coming Soon</div>
          <div className="ethBtn1">Coming Soon</div>
        </div>

        <div className="btnGroup">
          {[15, 30, 90].map((day) => (
            <div
              key={day}
              className="ethBtn ethBtn1 prefix1"
              onClick={() => onChangeDay(day)}
              style={defaultDay === day ? { backgroundColor: "#8b38e4", color: "white" } : {}}
            >
              <span>{day === 15 ? "1X" : day === 30 ? "1.5X" : "3X"}</span>
              {day} Days
            </div>
          ))}
        </div>

        <div className="btnGroup">
          <span className="cover1">
            <span className="cover3">X%</span>{" "}
            <span className="cover2">ETH</span> APR,{" "}
            <span className="cover3">1x</span> Multiplier On Seed Staking Points
            Generation Per <span className="cover2">ETH</span>
          </span>
        </div>

        <div className="btnGroup">
          <div className="ethBtn2 infoBtn">
            <span className="iSpan">Staked Amount</span>
            <span className="cSpan">{stakedAmount}</span>
          </div>
        </div>

        <div className="btnGroup">
          <div className="ethBtn2 infoBtn">
            <span className="iSpan">Wallet Balance</span>
            <span className="cSpan">{walletBalance}</span>
          </div>
          <div className="ethBtn2 infoBtn">
            <span className="iSpan">Total ETH Staked</span>
            <span className="cSpan">{totalStaked}</span>
          </div>
        </div>

        <div className="btnGroup">
          <div className="ethBtn2 infoBtn">
            <span className="iSpan">Maturity Date</span>
            <span className="cSpan">{changeDate}</span>
          </div>
          <div className="ethBtn2 infoBtn">
            <span className="iSpan">Race Medals</span>
            <span className="cSpan">{accumulatedPoint}</span>
          </div>
        </div>

        <div className="btnGroup amountGroup">
          <div className="wSpan">Enter Stake Amount</div>
          <div style={{ display: "flex" }}>
            <input
              placeholder="Type In The Stake Amount"
              className="ethBtn2 ethBtn4 inputBtn"
              value={stakeValue < 0 ? 0 : stakeValue}
              onChange={changeStakeValue}
              type="number"
            />
            <div className="maxBtn" onClick={() => setStakeValue(walletBalance)} />
          </div>
        </div>

        <div className="btnGroup">
          <div className="ethBtn5" onClick={() => { setStakeType("stake"); setModalShow(true); }}>
            Stake
          </div>
        </div>

        <div className="btnGroup">
          <div className="setNumberGroup">
            <div className="availStake">
              <span className="iSpan">Available Staked Amount:</span>
              <span className="cSpan">{availableStakeBalance}</span>
            </div>
          </div>
          <div className="ethBtn2 unstakeBtn" onClick={() => { setStakeType("unstake"); setModalShow(true); }}>
            Unstake
          </div>
        </div>

        <div className="btnGroup" style={{ marginBottom: "20px" }}>
          <div className="setNumberGroup">
            <div className="availStake">
              <span className="iSpan">Total Staked Amount:</span>
              <span className="cSpan">{stakedAmount}</span>
            </div>
          </div>
          <div className="ethBtn2 unstakeBtn" onClick={() => { setStakeType("emergencyUnstake"); setModalShow(true); }}>
            Emergency Unstake
          </div>
        </div>

        {remainTimeToStake > 0 && (
          <Countdown
            date={Date.now() + remainTimeToStake * 1000}
            intervalDelay={0}
            renderer={({ hours, minutes, seconds }) => (
              <div className="btnGroup">
                <div className="ethBtn2 ethBtn6">
                  <span className="iSpan">You Are On Cool Down For:</span>
                  <span className="cSpan">{hours}</span>
                  <span className="iSpan">Hours</span>
                  <span className="cSpan">{minutes}</span>
                  <span className="iSpan">Minutes</span>
                  <span className="cSpan">{seconds}</span>
                  <span className="iSpan">Seconds</span>
                </div>
              </div>
            )}
          />
        )}

        {address && (
          <div className="disconnetGp">
            <div className="wallnetBtn" onClick={onDisconnect}>
              Disconnect
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
