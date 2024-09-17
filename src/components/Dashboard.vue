<template>
  <div>
    <div :class="alertClass" role="alert" v-if="showAlert">
      {{ alertMessage }}
    </div>

    <Stepper
      v-show="showIntro"
    />

    <div class="center fade-in" v-show="!showIntro">
      <div class="balance-card">
        <div class="first-half">
          ${{
            (balance / 100).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")
          }}
        </div>
      </div>

      <b-card
        class="container-fluid"
        style="
          padding: 3px;
          min-width: 18rem;
          max-width: 50rem;
          min-height: 30rem;
        "
      >
        <b-tabs justified card align="center">
          <b-tab v-if="isAdmin">
            <template #title>
              Mint
              <b-icon
                class="no-icon"
                font-scale="1"
                icon="coin"
              ></b-icon>
            </template>
            <Mint />
          </b-tab>
          <b-tab active>
            <template #title>
              Send
              <b-icon
                class="no-icon"
                font-scale="1"
                icon="arrow-up-circle"
              ></b-icon>
            </template>
            <b-card-body>
              <div v-if="showSecretKey" class="p-20">
                <label class="text-info"
                  >This is master secret key.</label
                >
                <textarea
                  v-model="secretKeys[0]"
                  readonly
                  class="form-control p-20"
                  rows="2"
                ></textarea>
                <div class="qr-code">
                  <qrcode-vue :value="secretKeys[0]" :size="100" level="H"></qrcode-vue>
                </div>
                </div
            >
            <label class="text-info"
              >These are your secret key Shares. Each line is a secret key. 
              </label
            >
            <textarea
              readonly
              class="form-control p-20"
              rows="6"
            >0:625021612a480c12d83588c0031833b00ff24c7b4680edbd947e10cce9244e7c
            1:731ba1ffa2bdccd6b1d7a286e1ad3f2ab020aef4435e2625d12a0ec040395706
            2:6747013c7dd20be0e4053e5cea8b9495cd29d8f7c2c49a249e951948ee2e061f
            3:3ed23f17bb84c9316ebe5c421db333f1670dca85c4b449b9fcbf3066f3025bc7
            4:6dab02e485738210853cd43e84c5f542d18a27a1492b90e4eba854194eb657ff
            5:0bf5fdfc88633bedc10cf6420c80287f6523a844502db7a76b5084620149fac5
          </textarea>
          </b-card-body>
            <Send />
          </b-tab>
          <b-tab>
            <template #title>
              Receive
              <b-icon
                class="no-icon"
                font-scale="1"
                icon="arrow-down-circle"
              ></b-icon>
            </template>
            <Receive :address="addressToCopy" />
          </b-tab>
          <b-tab>
            <template #title>
              Token
              <b-icon
                class="no-icon"
                font-scale="1"
                icon="cash-coin"
              ></b-icon>
            </template>
            <ImportToken />
          </b-tab>
          <b-tab v-on:click="retrieveTxs()">
            <template #title>
              History
              <b-icon
                class="no-icon"
                font-scale="1"
                icon="clock-history"
              ></b-icon>
            </template>
            <Transaction-list :pubkey="pubkey" :txns="txs" />
          </b-tab>
        </b-tabs>
      </b-card>
    </div>
  </div>
</template>

<script>
import Receive from "./Receive.vue";
import Send from "./Send.vue";
import ImportToken from "./ImportToken.vue";
import TransactionList from "./TransactionList.vue";
import Mint from './Mint.vue'
import Stepper from "./Stepper.vue";
import QrcodeVue from 'qrcode.vue';
const Pubkey = window.cbdc.Publickey;
const Input = window.cbdc.Input;
const Output = window.cbdc.Output;
const Transaction = window.cbdc.Transaction;
const Address = window.cbdc.Address;

import axios from "axios";
import { EventBus } from "@/event-bus.js";
const axiosCaller = axios.create({
  baseURL: "http://localhost:3002/api/v1", // uncomment this line (and comment out the next line) to run outside docker
  // baseURL: process.env.VUE_APP_API_BASE_URL,
  timeout: 1000,
  headers: { "X-Custom-Header": "foobar" },
});

export default {
  components: { Send, Receive, TransactionList, Stepper, ImportToken, Mint, QrcodeVue },
  name: "Dashboard",
  props: {},
  data: function () {
    return {
      selectedTab: "Send",
      baseUrl: process.env.BASE_URL,
      port: process.env.PORT,
      showSecretKey: false,
      showSendComponent: true,
      showReceiveComponent: false,
      showIntro: true,
      isAdmin: false,
      canVerify: false,
      showTransactionListComponent: false,
      fundEnabled: true,
      secretKeys: [],
      balance: 0.0,
      address: "",
      pubkey: "",
      txs: [],
      inputsToSearch: [],
      addressToCopy: "",
      showAlert: false,
      alertType: "",
      alertMessage: "",
    };
  },
  methods: {
    confirmTx: function (senderInfo) {
      const sendAmount = senderInfo[1];
      const outputValue = Math.round(sendAmount * 100);
      const recipientAddress = senderInfo[0];
      const inputsSpent = [];
      const outputsCreated = [];
      const txInputs = [];
      const txOutputs = [];

      const recipientPubkey =
        Address.decodeFromAddressString(recipientAddress).pubkeyHex;
      const output = new Output(
        this.sha256("00" + recipientPubkey),
        outputValue
      );

      txOutputs.push(output);
      outputsCreated.push({
        value: outputValue,
        index: 0,
        witnessCommitment: output.witnessProgramCommitment,
        recipientPubkey: recipientPubkey,
        senderpubkey: this.pubkey,
      });
      axiosCaller.get("/outputs/" + this.pubkey, {}).then((res) => {
        const inputsToSearch = res.data;
        // Algorithm for crafting inputs and outputs for tx
        // 1. sum up the inputs individual values and add each to a queue until the cumulative sum those utxos is equal to or greater than sendAmount (add to inputsSendQueue)
        // 2. If the cumulative sum is less than the sendAmount and all inputs are exhausted the user has insufficient funds, a tx can not be made
        // 3. If cumulative sum is greater than, then a new is needed to send change back to sender (cumulativeSum - sendAmount)

        let cumulativeInputBalance = 0;
        for (let i = 0; i < inputsToSearch.length; i++) {
          let inp = inputsToSearch[i];
          let inpValue = inp.amount;

          if (inpValue + cumulativeInputBalance == outputValue) {
            cumulativeInputBalance += inpValue;
            inputsSpent.push(inp);
            break;
          } else if (inpValue + cumulativeInputBalance < outputValue) {
            cumulativeInputBalance += inpValue;
            inputsSpent.push(inp);
            continue;
          } else {
            // enough inputs to cover for tx
            cumulativeInputBalance += inpValue;
            inputsSpent.push(inp);
            break;
          }
        }

        for (let j = 0; j < inputsSpent.length; j++) {
          let inp = inputsSpent[j];
          txInputs.push(
            new Input(
              inp.created_txid,
              inp.index,
              inp.witness_commitment,
              inp.amount
            )
          );
        }

        // determine if there is change to send back to wallet's pubkey
        if (cumulativeInputBalance > sendAmount && inputsSpent.length > 0) {
          const changeOutputAmount = cumulativeInputBalance - outputValue;
          const out = new Output(
            this.sha256("00" + this.pubkey),
            changeOutputAmount
          );
          txOutputs.push(out);
          // same recipient and sender indicates change or sent to self
          outputsCreated.push({
            value: changeOutputAmount,
            index: 1,
            witnessCommitment: out.witnessProgramCommitment,
            recipientPubkey: this.pubkey,
            senderpubkey: this.pubkey,
          }); // change to self
        }

        if (txInputs == []) {
          return;
        }

        const tx = new Transaction(txInputs, txOutputs);
        let secKey = localStorage.getItem("secKey");
        const txid = tx.getTxid();
        tx.sign(secKey);
        const signedTx = tx.toHex();

        axiosCaller
          .post("/sendTx/", {
            inputsSpent,
            outputsCreated,
            recipientpubkey: recipientPubkey,
            senderpubkey: this.pubkey,
            value: outputValue,
            signedTx,
            txid,
          })
          .then((res) => {
            axiosCaller
              .get("/balance/" + this.pubkey, { pubkey: this.pubkey })
              .then((res) => {
                const unspent = res.data;
                let bal = 0;
                for (let i = 0; i < unspent.length; i++) {
                  bal += unspent[i].amount;
                }
                this.balance = bal;
              });
            return res;
          });
      });
    },
    showAlertMessage(type, message) {
      this.alertType = type;
      this.alertMessage = message;
      this.showAlert = true;
      setTimeout(() => {
        this.showAlert = false;
      }, 3000);
    },
    setupWallet: function (data) {
      localStorage.setItem("completedSetup", true);
      this.secretKeys = data.keys;
      let secKey = this.secretKeys[0];
      let publicKey = new Pubkey(secKey);
      this.pubkey = publicKey.publicKey;
      this.addressToCopy = new Address("00", publicKey.publicKey).address;
      this.address = new Address("00", publicKey.publicKey);
      localStorage.setItem("pubkey", this.pubkey);
      localStorage.setItem("secKey", secKey);
    },
    signUp: function (data) {
      this.setupWallet(data);
      axiosCaller
        .post("/signUp/", {
          publicKey: this.pubkey,
        })
        .then((res) => {
          if (res.status === 201) {
            axiosCaller
              .get("/balance/" + this.pubkey, { pubkey: this.pubkey })
              .then((res) => {
                const unspent = res.data;
                let bal = 0;
                for (let i = 0; i < unspent.length; i++) {
                  bal += unspent[i].amount;
                }
                this.balance = bal;
                this.showSecretKey = true;
              })
              .catch((error) => {
                console.error("Error fetching balance:", error);
              });

            this.showIntro = false;
            this.showAlertMessage("success", "Wallet Created");
          } else {
            this.showAlertMessage("error", "Error During Wallet Creation");
          }
        })
        .catch((error) => {
          this.showAlertMessage(
            "error",
            "Error during sign up, try again",
            error
          );
        });
    },
    signIn: function (data) {
      let secKey = data.secretKey;
      let publicKey = new Pubkey(secKey);
      this.pubkey = publicKey.publicKey;
      this.addressToCopy = new Address("00", publicKey.publicKey).address;
      this.address = new Address("00", publicKey.publicKey);
      localStorage.setItem("pubkey", this.pubkey);
      localStorage.setItem("secKey", secKey);

      axiosCaller
        .post("/signIn/", { publicKey: this.pubkey })
        .then((response) => {
          this.pubkey = response.data.public_key;
          this.isAdmin = response.data.role === 'admin' ? true : false
          this.addressToCopy = new Address(
            "00",
            response.data.public_key
          ).address;
          this.address = new Address("00", response.data.public_key);
          axiosCaller
            .get("/balance/" + this.pubkey, { pubkey: this.pubkey })
            .then((res) => {
              const unspent = res.data;
              let bal = 0;
              for (let i = 0; i < unspent.length; i++) {
                bal += unspent[i].amount;
              }
              this.balance = bal;
            })
            .catch((error) => {
              console.error("Error fetching balance:", error);
            });

          this.showIntro = false;
          this.showAlertMessage("success", "sign in successful");
        })
        .catch((error) => {
          this.showAlertMessage(
            "error",
            "Error during sign in, try again",
            error
          );
        });
    },
    mint: function (data) {
      axiosCaller
        .post("/mintTx/", { publicKey: this.pubkey, value: data.value })
        .then(() => {
          axiosCaller
            .get("/balance/" + this.pubkey, { pubkey: this.pubkey })
            .then((res) => {
              const unspent = res.data;
              let bal = 0;
              for (let i = 0; i < unspent.length; i++) {
                bal += unspent[i].amount;
              }
              this.balance = bal;
            })
            .catch((error) => {
              console.error("Error fetching balance:", error);
            });
        })
    },
    importToken: function (data) {
      axiosCaller
        .post("/importToken/", {
          publicKey: this.pubkey,
          transactionHex: data.transactionHex,
        })
        .then((response) => {
          this.showAlertMessage("error", 'error', response);
          axiosCaller
            .get("/balance/" + this.pubkey, { pubkey: this.pubkey })
            .then((res) => {
              const unspent = res.data;
              let bal = 0;
              for (let i = 0; i < unspent.length; i++) {
                bal += unspent[i].amount;
              }
              this.balance = bal;
            })
            .catch((error) => {
              this.showAlertMessage("error", 'Error Fetching Balance', error);
            });
        }).catch((error) => {
          this.showAlertMessage("error",  'Some Error Happend During Importing Tokens', error);
        });
    },
    formTx: function () {},
    retrieveTxs: function () {
      axiosCaller.get("/txs/" + this.pubkey).then((res) => {
        console.log("Transaction list after click: ", res.data);
        if (res.data === undefined) {
          this.txs = [];
        } else {
          const txData = res.data;
          this.txs = txData;
        }
        axiosCaller
          .get("/balance/" + this.pubkey, { pubkey: this.pubkey })
          .then((res) => {
            const unspent = res.data;
            let bal = 0;
            for (let i = 0; i < unspent.length; i++) {
              bal += unspent[i].amount;
            }
            this.balance = bal;
          });
      });
    },

    clickedFundWallet: function () {
      this.fundEnabled = false;
      axiosCaller
        .post("/fundAddress/", { recipientPubkey: this.pubkey, value: 20000 })
        .then((res) => {
          const info = res.data;
          console.log(info);
          axiosCaller
            .get("/balance/" + this.pubkey, { pubkey: this.pubkey })
            .then((res) => {
              const unspent = res.data;
              let bal = 0;
              for (let i = 0; i < unspent.length; i++) {
                bal += unspent[i].amount;
              }
              this.balance = bal;

              axiosCaller.get("/txs/" + this.pubkey).then((res) => {
                if (res.data === undefined) {
                  this.txs = [];
                } else {
                  const txData = res.data;
                  this.txs = txData;
                }
              });
            });
        });
    },
    sha256: function a(b) {
      function c(a, b) {
        return (a >>> b) | (a << (32 - b));
      }
      for (
        var d,
          e,
          f = Math.pow,
          g = f(2, 32),
          h = "length",
          i = "",
          j = [],
          k = 8 * b[h],
          l = (a.h = a.h || []),
          m = (a.k = a.k || []),
          n = m[h],
          o = {},
          p = 2;
        64 > n;
        p++
      )
        if (!o[p]) {
          for (d = 0; 313 > d; d += p) o[d] = p;
          (l[n] = (f(p, 0.5) * g) | 0), (m[n++] = (f(p, 1 / 3) * g) | 0);
        }
      for (b += "\x80"; (b[h] % 64) - 56; ) b += "\x00";
      for (d = 0; d < b[h]; d++) {
        if (((e = b.charCodeAt(d)), e >> 8)) return;
        j[d >> 2] |= e << (((3 - d) % 4) * 8);
      }
      for (j[j[h]] = (k / g) | 0, j[j[h]] = k, e = 0; e < j[h]; ) {
        var q = j.slice(e, (e += 16)),
          r = l;
        for (l = l.slice(0, 8), d = 0; 64 > d; d++) {
          var s = q[d - 15],
            t = q[d - 2],
            u = l[0],
            v = l[4],
            w =
              l[7] +
              (c(v, 6) ^ c(v, 11) ^ c(v, 25)) +
              ((v & l[5]) ^ (~v & l[6])) +
              m[d] +
              (q[d] =
                16 > d
                  ? q[d]
                  : (q[d - 16] +
                      (c(s, 7) ^ c(s, 18) ^ (s >>> 3)) +
                      q[d - 7] +
                      (c(t, 17) ^ c(t, 19) ^ (t >>> 10))) |
                    0),
            x =
              (c(u, 2) ^ c(u, 13) ^ c(u, 22)) +
              ((u & l[1]) ^ (u & l[2]) ^ (l[1] & l[2]));
          (l = [(w + x) | 0].concat(l)), (l[4] = (l[4] + w) | 0);
        }
        for (d = 0; 8 > d; d++) l[d] = (l[d] + r[d]) | 0;
      }
      for (d = 0; 8 > d; d++)
        for (e = 3; e + 1; e--) {
          var y = (l[d] >> (8 * e)) & 255;
          i += (16 > y ? 0 : "") + y.toString(16);
        }
      return i;
    },
    clickedTab: function (tab) {
      this.selectedTab = tab;
      if (tab == "Send") {
        this.showSendComponent = true;
        this.showReceiveComponent = false;
        this.showTransactionListComponent = false;
      } else if (tab == "Receive") {
        this.showSendComponent = false;
        this.showReceiveComponent = true;
        this.showTransactionListComponent = false;
      } else if (tab == "History") {
        this.showSendComponent = false;
        this.showReceiveComponent = false;
        this.showTransactionListComponent = true;
        this.retrieveTxs();
      }
    },
    // onActivate(target) {
    //   console.log("Received Event: scrollspy::activate for target ", target);
    // },
    // scrollInView($event) {
    //   let el;
    //   let href = $event.target.getAttribute("href");
    //   if (href) {
    //     el = document.querySelector(href);
    //     if (el) {
    //       el.scrollIntoView({
    //         behavior: "smooth",
    //       });
    //     }
    //   }
    // },
  },
  computed: {
    alertClass() {
      return {
        alert: true,
        "alert-success": this.alertType === "success",
        "alert-danger": this.alertType === "error",
        fade: true, // Add fade class for the fade effect
        show: this.showAlert, // Add show class to make the alert visible
      };
    },
  },
  // lifecycle hooks
  created: function () {
    EventBus.$on("showSignUp", this.showSignUp);
    EventBus.$on("showSignIn", this.showSignIn);
    EventBus.$on("signInWallet", this.signIn);
    EventBus.$on("importToken", this.importToken);
    EventBus.$on("unlockWallet", this.signUp);
    EventBus.$on("sendTx", this.confirmTx);
    EventBus.$on("Mint", this.mint);
  },
  mounted: function () {},
  updated: function () {},
  copy: function () {},
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Nunito&display=swap");
@import url("https://fonts.googleapis.com/css2?family=Roboto&display=swap");

@media only screen and (max-width: 400px) {
  .no-icon {
    display: none;
  }
}

.dashboard-container {
  display: flex;
  flex: 1;
  justify-content: center;
  flex-wrap: wrap;
  padding: 20px;
  border-radius: 20px;
}

#scrollspy-example {
  /* position: relative; */
  height: 300px;
  overflow-y: scroll;
}

.dashboard-tab {
  display: flex;
  flex: 1;
  justify-content: center;
  align-items: center;
  flex-direction: row;
  flex-wrap: wrap;
}

.center {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
}

.fade-in {
  opacity: 1;
  animation-name: fadeInOpacity;
  animation-iteration-count: 1;
  animation-timing-function: ease-in;
  animation-duration: 0.5s;
}

@keyframes fadeInOpacity {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}

.dashboard-nav {
  display: flex;
  flex: 1;
  justify-content: center;
  align-items: center;
  flex-direction: row;
  flex-wrap: wrap;
  width: 100%;
  margin-top: 30px;
}

.row-container {
  width: 100%;
}

.deselected {
  background-color: white;
  color: rgb(96, 96, 96);
  font-family: "Roboto", sans-serif;
  font-size: 24px;
  padding: 5px;
  background-color: whitesmoke;
  cursor: pointer;
}

.deselected:hover {
  border-bottom: 1px solid hsl(185, 57%, 50%);
}

.selected {
  border-top-left-radius: 5px;
  border-top-right-radius: 5px;
  background-color: white;
  font-family: "Roboto", sans-serif;
  padding: 5px;
  font-size: 24px;
  cursor: pointer;
}

.nav-icon {
  width: 50px;
  height: 50px;
}

.selected:hover {
  border-top-left-radius: 5px;
  border-top-right-radius: 5px;
  background-color: white;
}

ul {
  list-style-type: none;
}

.balance-card {
  display: flex;
  flex: 1;
  flex-direction: row;
  align-items: center;
  font-family: "Roboto", sans-serif;
  font-size: 40px;
  font-weight: 600;
  border-radius: 10px;
  flex-wrap: wrap;
}

.custom-control:focus {
  outline: none !important;
}

.first-half {
  display: flex;
  flex-wrap: wrap;
  flex: 1;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  width: 100%;
  padding-right: 10px;
  padding-left: 10px;
  border-radius: 5px;
}

.btn {
  background-color: rgb(0, 195, 235);
  border: none;
  color: white;
  border-radius: 5px;
  width: 60px;
  height: 40px;
}

.second-half {
  display: flex;
  height: 100%;
  flex: 1;
  flex-direction: row;
  align-items: center;
  justify-content: flex-end;
  padding: 5px;
}

.second-half:hover {
  opacity: 0.8;
}

.qr-code {
  display: flex;
  justify-content: center;
  margin-top: 8px;
}
</style>
