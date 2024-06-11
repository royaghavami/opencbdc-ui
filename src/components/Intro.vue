<template>
    <div class="center fade-in">
      <b-card
          style="min-width: 12rem; max-width: 40rem"
          class="text-center container-fluid"
        >
        <div class="text-center p-0">
          <button v-if="canGoBack" @click="previousComponent" class="btn d-flex p-0 align-self-start">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" id="back-arrow"><path d="m30.91 39-15-15 15-15 1.17 1.18L18.26 24l13.82 13.82Z"></path></svg>
          </button>
          <h3>{{currentTitle}}</h3>
        </div>
        <div class="card-body ">
          <component :is="currentComponent" :securityQuestion="localSecurityQuestion" :canVerify="localCanVerify"></component>
        </div>
      </b-card>
    </div>
  </template>
  
  <script>
  import { ref, computed } from 'vue';
  import { EventBus } from "@/event-bus.js";
  import CreateWallet from "./CreateWallet.vue";
  import SignInWallet from "./SignIn.vue";
  import Recovery from "./Recovery.vue";
  
  export default {
    name: 'Intro',
    components: {
      CreateWallet,
      SignInWallet,
      Recovery
    },
    props: {
      securityQuestion: {
        type: String
      },
      canVerify: {
        type: Boolean
      }
    },
    computed: {
      localSecurityQuestion() {
        console.log('in intro', this.securityQuestion)
        return this.securityQuestion
      },
      localCanVerify() {
        return this.canVerify
      }
    },
    created: function () {
      EventBus.$on("goRecovery", () => {this.nextComponent()})
      EventBus.$on("goSignIn", () => {this.nextComponent()});
      EventBus.$on("goSignUp", () => {this.previousComponent()});
    },
    setup() {
      const components = [CreateWallet, SignInWallet, Recovery];
      const currentIndex = ref(0);

      const titles = {
        'CreateWallet': 'Sign Up',
        'SignInWallet': 'Sign In',
        'Recovery': 'Forgot Password'
      }
      const currentComponent = computed(() => components[currentIndex.value].name);
      const currentTitle = computed(() => titles[components[currentIndex.value].name]);
  
      const nextComponent = () => {
        if (currentIndex.value < components.length - 1) {
          currentIndex.value++;
        }
      };
  
      const previousComponent = () => {
        if (currentIndex.value > 0) {
          currentIndex.value--;
        }
      };
  
      const canGoBack = computed(() => currentIndex.value > 0);
  
      return {
        currentComponent,
        currentTitle,
        nextComponent,
        previousComponent,
        canGoBack
      };
    }
  }
  </script>
  <style scoped>
  .svg-button {
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
  }
  
  #back-arrow {
    fill: currentColor;
  }
  </style>