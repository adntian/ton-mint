const { TonClient, WalletContractV4, internal } = require("@ton/ton");
const { mnemonicToPrivateKey } = require("@ton/crypto");
const https = require('https');

const fs = require('fs');
const path = require('path');


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
// Create Client
const client = new TonClient({
    endpoint:
        "https://toncenter.com/api/v2/jsonRPC",
        // "https://ton.access.orbs.network/55B1c0ff5Bd3F8B62C092Ab4D238bEE463E655B1/1/mainnet/toncenter-api-v2/jsonRPC",
        //"https://ton.access.orbs.network/44A2c0ff5Bd3F8B62C092Ab4D238bEE463E644A2/1/mainnet/toncenter-api-v2/jsonRPC",
});


  try {
     await sleep(1500);
  let contract = client.open(wallet);
  console.log(wallet.address + ' 开始运行');
  let balance = await contract.getBalance();
  console.log(`第${index}个钱包：【${wallet.address}  】，余额：${balance}`)
    if (balance == 0) {
      console.log(`第${index}个钱包：【${wallet.address}  】，余额为0，3分钟后重试`)
      await sleep(180000);
      throw new Error('余额为0');
    }


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
    // await sleep(1000);
    try {
      let seqno = await contract.getSeqno();
      console.log('seqno' , seqno);
      await sleep(1100);
      let transfer = await contract.sendTransfer({
        seqno: seqno,
        secretKey: keyPair.secretKey,
        validUntil: Math.floor(Date.now() / 1e3) + 600,
        messages: v,
      });
      console.log(transfer);
      count++;
      console.log(`第${index}个钱包：【${wallet.address}  】，第${count}次成功`);
    } catch (error) {
      console.log(`第${index}个钱包：【${wallet.address}  】`, error.response.data.code, error.response.data.error)
    }
    
  }
  } catch (err) {
    console.log('create client error', err.response && err.response.data ? err.response.data.code : err.response, err.response && err.response.data ? err.response.data.error : '')
    console.log(`重试第${index}个钱包`)
    main(mnemonic, index)
  }
}

const sleep = (time) => {
  return new Promise((resolve) => setTimeout(resolve, time));
}


const getPhrase = () => {
  try {
  const phrases = fs.readFileSync(path.join(__dirname, './phrases.txt'), 'utf-8');
  return phrases.split('\n');
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('未发现phrases.txt文件，已自动创建文件')
      fs.writeFileSync(path.join(__dirname, './phrases.txt'), '');
    } else {
      console.log(error);
    }
    return [];
  }
}

const mnemonicList = getPhrase().map(t => t ? t.trim() : '').filter(t=>t && t.indexOf('#')==-1 && (t.split(' ').length === 12 || t.split(' ').length === 24));

if (mnemonicList.length === 0) {
    console.error(`
    ******************************************************
    未发现有效的钱包助记词，请在当前目录的phrases.txt文件中填写
    需要12位或24位的助记词，每行一个
    可以添加注释，以#开头即可，以下为文件示例：
    # 这是注释 我的钱包
    word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12 word13 word14 word15 word16 word17 word18 word19 word20 word21 word22 word23 word24
    ******************************************************`)
  return
} else {
    console.log(`本次共发现${mnemonicList.length}个助记词`)
}

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
}

        mnemonicList.forEach((t, index) => {
          main(t, index + 1);
        });

/*
const run = () => {
  checkStatus('EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c').then(
    (res) => {
      if (res) {
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
*/
