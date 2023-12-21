"use client";

import React, { useCallback, useRef, useState } from "react";
import { getQueryClient } from "@sei-js/core";
// import { HdPath, stringToPath } from "@cosmjs/crypto";
import { getNetworkInfo, Network } from "@injectivelabs/networks";
import { Keyring, ApiPromise, WsProvider, HttpProvider } from "@polkadot/api";
import { BigNumberInBase } from "@injectivelabs/utils";
// import { BigNumber } from "bignumber.js";

//主网
// const network = getNetworkInfo(Network.Mainnet);

let polkadotlWSS = "https://polkadot.publicnode.com";
// const polkadotProvider = new WsProvider(polkadotlWSS);
const network = new HttpProvider(polkadotlWSS);

function getNowTime() {
  var d = new Date(),
      str = '[';
  str += d.getHours() + ':';
  str += d.getMinutes() + ':';
  str += d.getSeconds() + ':';
  str += d.getMilliseconds();
  str += "] ";
  return str;
}


const Minter: React.FC = () => {
  const [mnemonic, setMnemonic] = useState<string>("");
  const [isEnd, setIsEnd] = useState<boolean>(false);
  const isEndRef = useRef<boolean>(false);
  isEndRef.current = isEnd;
  const [logs, setLogs] = useState<string[]>([]);
  const [count, setCount] = useState<number>(0);

  const mintFn = useCallback(
    async (polkadotApi: any, joeyAddress: any, joey: any) => {
      try {
        let tx1 = polkadotApi.tx.balances.transferKeepAlive(joeyAddress, 0);
        let tx2 = polkadotApi.tx.system.remark(
          '{"p":"dot-20","op":"mint","tick":"DOTA"}'
        );
        let tx3 = await polkadotApi.tx.utility
          .batchAll([tx1, tx2])
          .signAndSend(joey);
        console.log(tx3, "hash:", tx3.hash.toHex());
        if (tx3.hash.toHex().length !== 0) {
          setCount((prev) => prev + 1);
          setLogs((pre) => [...pre, `${getNowTime()} ：铸造完成`]);
        }
      } catch (e) {
        // sleep 1s
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    },
    []
  );

  const walletMint = useCallback(
    async (m: string) => {
      // const wallet = await generateWalletFromMnemonic(m);
      const denom = "dot";

      const polkadotApi = await ApiPromise.create({ provider: network });
      let joey = (new Keyring({ type: "sr25519" }) as any).addFromMnemonic(m);
      let joeyAddress = joey.address;

      // const wallet = await DirectSecp256k1Wallet.fromKey(Buffer.from(priv.toPrivateKeyHex().slice(2)), chain);
      setLogs((pre) => [...pre, `成功导入钱包: ${joeyAddress}`]);

      while (true) {
      if (isEndRef.current) {
        setLogs((pre) => [...pre, `暂停铸造`]);
        break;
      }
      await mintFn(polkadotApi, joeyAddress, joey);
      await new Promise((resolve) => setTimeout(resolve, 7000));
      }
    },
    [mintFn]
  );

  const handleMint = async () => {
    setIsEnd(false);
    setLogs((pre) => [...pre, `开始铸造`]);

    // 验证助记词
    if (!mnemonic) {
      setLogs((pre) => [...pre, `请输入助记词`]);
      return;
    }
    const walletMnemonics = mnemonic.split(",");
    for (let i = 0; i < walletMnemonics.length; i++) {
      walletMint(walletMnemonics[i]);
    }
  };

  const handleEnd = () => {
    setIsEnd(true);
    isEndRef.current = true;
  };

  return (
    <div className="flex flex-col items-center">
      <h1>dota疯狂铸造脚本 7秒铸造一次（最适合的时间） 交易详细看 https://polkadot.subscan.io/</h1>
      <p className="text-xs mt-2 text-gray-400">打到账户没钱为止</p>
      <div>
        <textarea
          className="mt-6 border border-black rounded-xl w-[400px] px-4 py-6 resize-none h-[220px]"
          placeholder="请输入助记词，比如：jazz bench loan chronic ready pelican travel charge lunar pear detect couch。当有多的账号的时候，用,分割，比如:jazz bench loan chronic ready pelican travel charge lunar pear detect couch,black clay figure average spoil insane hire typical surge still brown object"
          value={mnemonic}
          onChange={(e) => setMnemonic(e.target.value)}
        />
      </div>
      <div className="flex w-[400px] justify-center space-x-6 mt-4">
        <button
          className="border border-black px-4 py-2 rounded-full"
          onClick={handleMint}
        >
          开始铸造
        </button>
        <button
          className="border border-black px-4 py-2 rounded-full"
          onClick={handleEnd}
        >
          暂停
        </button>
      </div>

      <span className="mt-6 w-[400px] text-left">{`日志(本次已铸造+${count})`}</span>
      <div className="px-4 py-2 whitespace-pre border border-black w-[400px] h-[400px] overflow-auto">
        {logs.join("\n")}
      </div>
    </div>
  );
};

export default Minter;
