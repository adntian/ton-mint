const { TonClient, WalletContractV4, internal } = require("@ton/ton");
const { mnemonicToPrivateKey } = require("@ton/crypto");
const https = require('https');

// Create Client
const client = new TonClient({
  endpoint:
    'https://ton.access.orbs.network/55B1c0ff5Bd3F8B62C092Ab4D238bEE463E655B1/1/mainnet/toncenter-api-v2/jsonRPC',
  //"https://ton.access.orbs.network/44A2c0ff5Bd3F8B62C092Ab4D238bEE463E644A2/1/mainnet/toncenter-api-v2/jsonRPC",
});

// 最大尝试多少次
const maxTimes = 10000;

async function main(mnemonic, index) {
  const mnemonics = mnemonic.split(' ');
  let keyPair = await mnemonicToPrivateKey(mnemonics);
  let workchain = 0;
  let wallet = WalletContractV4.create({
    workchain,
    publicKey: keyPair.publicKey,
  });
  let contract = client.open(wallet);

  let v = [];

  for (let i = 0; i < 4; i++) {
    v.push(
      internal({
        to: `EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c`,
        value: '0',
        body: `data:application/json,{"p":"ton-20","op":"mint","tick":"nano","amt":"100000000000"}`,
      })
    );
  }
  let count = 0;

  for (let i = 0; i < maxTimes; i++) {
    try {
      let seqno = await contract.getSeqno();
      console.log(seqno);
      let transfer = await contract.sendTransfer({
        seqno: seqno,
        secretKey: keyPair.secretKey,
        validUntil: Math.floor(Date.now() / 1e3) + 600,
        messages: v,
      });
      console.log(transfer);
      count++;
      console.log(`第${index}个钱包，第${count}次成功`);
    } catch (error) {
      console.log(error);
    }
  }
}

let mnemonic = ['word1 word2 .... word24', 'word1 word2 .... word24'];
const checkStatus = (addr) => {
  // get请求 https://api.ton.cat/v2/contracts/address/EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c，返回的json数据中meta.is_suspended为true时，合约被冻结
  const url = `https://api.ton.cat/v2/contracts/address/${addr}`;
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      res.on('data', (d) => {
        const data = JSON.parse(d);
        // console.log(data);
        if (data.meta.is_suspended) {
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
  });
};

const run = () => {
  console.log('检测状态');
  checkStatus('EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c').then(
    (res) => {
      if (res) {
        mnemonic.forEach((t, index) => {
          main(t, index + 1);
        });
      } else {
        const waitTime = 10;
        console.log(
          `合约被冻结，等待${waitTime}秒后重试，当前时间：`,
          new Date().toLocaleString()
        );
        setTimeout(() => {
          run();
        }, waitTime * 1000);
      }
    }
  );
};

run();