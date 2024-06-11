<template>  
  <div>
    <b-form @submit="onSubmit" v-if="show">
        <b-form-group id="input-group-username" label-for="input-username" class="mb-2">
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
        </b-form-group>

        <h5 class="text-left mb-3 mt-4" style="color: #007bff;">Security Question</h5>
        <b-form-select v-model="selectedQuestion" :options="securityQuestions" placeholder="Please select a question"></b-form-select>
        <b-form-group class="mt-2">
          <b-form-input id="answer" v-model="answer" placeholder="Enter your answer"></b-form-input>
        </b-form-group>

        <b-button class="mt-4" type="submit" size="md" variant="info">Sign up</b-button>
      </b-form>
      <div>Already have an account? <div class="signin-button" @click="goToSignIn">Sign In</div></div>
  </div>
</template>

<script>
const Secp256k1 = require('@enumatech/secp256k1-js');
import { EventBus } from '@/event-bus.js';
const CryptoJS = require('crypto-js');

export default {
  name: 'CreateWallet',
  data: function() {
    return {
      form: {
        username: '',
        password: ''
      },
      securityQuestions: [
        { text: "What was the name of your first pet?", value: "pet" },
        { text: "In what city were you born?", value: "city" },
        { text: "What is your mother's maiden name?", value: "maidenName" },
        { text: "What was the name of your first school?", value: "school" },
        { text: "What is the make and model of your first car?", value: "car" },
        { text: "What is the name of your favorite childhood friend?", value: "friend" },
        { text: "What is the name of the street you grew up on?", value: "street" },
        { text: "What is your favorite food?", value: "food" },
        { text: "What is your favorite movie or book?", value: "movieOrBook" },
        { text: "What is your favorite holiday destination?", value: "holidayDestination" }
      ],
      selectedQuestion: null,
      answer: '',
      show: true,
      showPassword: true,
      userPassword: "",
      showSignIn: false
    };
  },
  methods: {
    goToSignIn: function(event) {
      event.preventDefault();
      EventBus.$emit('goSignIn', {})
    },
    onSubmit: function(event) {
      event.preventDefault();
      let securityQuestion = this.selectedQuestion;
      let securityAnswer = CryptoJS.SHA256(this.answer).toString();

      let salt = CryptoJS.lib.WordArray.random(128 / 8).toString(); // Generate a 128-bit salt
      let keys = this.derive(this.form.password, this.form.username, salt, 10);

      EventBus.$emit('unlockWallet', { 
        keys: keys, 
        salt: salt, 
        username: this.form.username, 
        securityQuestion: securityQuestion, 
        securityAnswer: securityAnswer
      });
    },
    derive: function(passphrase, username, salt, numKeys) {
      const hashedUsername = CryptoJS.SHA256(username + salt).toString();
      const hashedPassphrase = CryptoJS.SHA256(passphrase + salt).toString();

      let keys = [];
      for (let x = 0; x < numKeys; x++) {
          const sec = Secp256k1.uint256(CryptoJS.SHA256(hashedPassphrase + hashedUsername + x.toString()).toString(), 16);
          keys.push(sec.toString('hex').length === 63 ? '0' + sec.toString('hex') : sec.toString('hex'));
      }
      return keys;
    },
    sha256: function(input) {
      return CryptoJS.SHA256(input).toString();
    }
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Nunito&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Roboto&display=swap');

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
  color: rgb(0,195,235);
  text-align: center;
  cursor: pointer;
  user-select: none;
  transition: background-color 0.3s;
}

.signin-button:hover {
  opacity: 0.8;
}
</style>
