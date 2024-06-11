<template>
    <div>
        <b-form @submit.prevent="requestSecurityQuestion" class="mt-20">
            <b-form-group
              id="forgetPGroup"
            >
              <b-input-group  size="md">
                <b-form-input
                    id="recoveryUser"
                    v-model="recoveryForm.username"
                    type="text"
                    placeholder="Username"
                    autofocus
                    required
                ></b-form-input>
                <b-input-group-append>
                  <b-button type="submit" size="md"  variant="info">
                    Recover Account
                  </b-button>
                </b-input-group-append>
              </b-input-group>
            </b-form-group>
          </b-form>

          <div class="row justify-content-center" v-if="localSecurityQuestion">
            <div class="col-md-6">
              <form @submit.prevent="verifySecurityAnswer">
                <h5><strong>Security Question:</strong> {{ securityQuestionValue }}</h5>
                  <div class="form-group">
                  <input type="text" v-model="form.securityAnswer" class="form-control" id="securityAnswer" placeholder="Answer" required>
                  <div class="invalid-feedback">Please enter your answer.</div>
                  </div>
                  <button type="submit" class="btn btn-primary">Submit Answer</button>
              </form>
            </div>
          </div>

          <!-- <div class="d-flex">
            <h5 class="align-self-start">Enter New Password</h5>
          </div> -->
    </div>
</template>
<script>
import { EventBus } from '@/event-bus.js';

export default {
  name: 'Recovery',
  data: function() {
      return {
        form: {
          securityAnswer: ''
        },
        recoveryForm: {
          username: ''
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
        ]
      };
    },
    props: {
      securityQuestion: {
        type: String
      },
      canVerify: {
        type: Boolean
      }
    },
    emits: {
      forgotPasswordWallet: (value) => {
        return value;
      }
    },
    methods: {
        requestSecurityQuestion: function(event) {
          event.preventDefault();
          EventBus.$emit('forgotPasswordWallet', { username: this.recoveryForm.username })
        },
        verifySecurityAnswer: function(event) {
          event.preventDefault();
          EventBus.$emit('verifySecurityAnswer', { username: this.recoveryForm.username, answer: this.form.securityAnswer })
        }
    },
    computed: {
      localSecurityQuestion() {
        console.log('in recovery')
        return this.securityQuestion;
      },
      securityQuestionValue() {
        const question = this.securityQuestions.find(q => q.value === this.localSecurityQuestion);
        return question ? question.text : '';
      },
      localCanVerify() {
        return this.canVerify
      }
    }
}
</script>