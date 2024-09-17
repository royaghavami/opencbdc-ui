<template>
  <div>
    <b-form @submit="onSubmit" v-if="show">
      <!-- <b-form-group
        id="input-group-username"
        label-for="input-username"
        class="mb-2"
      >
        <b-input-group size="md" class="mb-2">
          <b-form-input
            id="suUId"
            name="input-username"
            v-model="form.username"
            type="text"
            placeholder="Username"
            required
          ></b-form-input>
        </b-input-group>
      </b-form-group>
      <b-form-group id="input-group-1" label-for="input-1" class="mb-2">
        <b-input-group size="md" class="mb-2">
          <b-form-input
            id="suPId"
            name="input-1"
            v-model="form.password"
            type="password"
            placeholder="Passphrase"
            autofocus
            required
          ></b-form-input>
        </b-input-group>
      </b-form-group> -->

      <b-button type="submit" size="md" variant="info"
        >Create Now!</b-button
      >
    </b-form>
    <div class="mt-2">
      Already have a wallet?
      <div class="signin-button" @click="goToSignIn">click</div>
    </div>
  </div>
</template>

<script>
const Secp256k1 = require("@enumatech/secp256k1-js");
import { EventBus } from "@/event-bus.js";
const CryptoJS = require("crypto-js");

export default {
  name: "CreateWallet",
  data: function () {
    return {
      form: {
        username: "",
        password: "",
      },
      show: true,
      showPassword: true,
      userPassword: "",
      showSignIn: false,
    };
  },
  methods: {
    goToSignIn: function (event) {
      event.preventDefault();
      EventBus.$emit("goSignIn", {});
    },
    onSubmit: function (event) {
      event.preventDefault();
      let keys = this.generateRandomKeys(10);

      EventBus.$emit("unlockWallet", {
        keys: keys,
      });
    },
    generateRandomKeys: function (numKeys) {
      let keys = [];
      for (let x = 0; x < numKeys; x++) {
        const array = new Uint8Array(32);
        window.crypto.getRandomValues(array);
        const sec = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
        keys.push(sec);
      }
      return keys;
    },
    derive: function (passphrase, username, numKeys) {
      const hashedUsername = CryptoJS.SHA256(username).toString();
      const hashedPassphrase = CryptoJS.SHA256(passphrase).toString();

      let keys = [];
      for (let x = 0; x < numKeys; x++) {
        const sec = Secp256k1.uint256(
          CryptoJS.SHA256(
            hashedPassphrase + hashedUsername + x.toString()
          ).toString(),
          16
        );
        keys.push(
          sec.toString("hex").length === 63
            ? "0" + sec.toString("hex")
            : sec.toString("hex")
        );
      }
      return keys;
    },
    sha256: function (input) {
      return CryptoJS.SHA256(input).toString();
    },
  },
};
</script>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Nunito&display=swap");
@import url("https://fonts.googleapis.com/css2?family=Roboto&display=swap");

.center {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  padding: 10px;
}

.signin-button {
  display: inline-block;
  color: rgb(0, 195, 235);
  text-align: center;
  cursor: pointer;
  user-select: none;
  transition: background-color 0.3s;
}

.signin-button:hover {
  opacity: 0.8;
}
</style>
