<template>
    <div>
        <b-form @submit.prevent="requestSecurityQuestion" class="mt-20">
            <b-form-group
              id="forgetPGroup"
            >
            <label class="text-info"
            >You should at least enter 4 secret key shares to retrieve secret key.
        </label>
              <b-input-group class="flex flex-column"  size="md">
                <b-form-input
                  id="recoveryUser"
                  v-model="recoveryForm.key"
                  type="text"
                  placeholder="Enter key 1"
                  autofocus
                  required
              ></b-form-input>
              <b-form-input
              id="recoveryUser"
              v-model="recoveryForm.key"
              type="text"
              placeholder="Enter key 2"
              autofocus
              required
          ></b-form-input>
          <b-form-input
          id="recoveryUser"
          v-model="recoveryForm.key"
          type="text"
          placeholder="Enter key 3"
          autofocus
          required
      ></b-form-input>
      <b-form-input
      id="recoveryUser"
      v-model="recoveryForm.key"
      type="text"
      placeholder="Enter key 4"
      autofocus
      required
  ></b-form-input>
                  <b-button class="mt-4" type="submit" size="md"  variant="info">
                    Retrieve
                  </b-button>
              </b-input-group>
            </b-form-group>
          </b-form>
    </div>
</template>
<script>
import { EventBus } from '@/event-bus.js';

export default {
  name: 'Recovery',
  data: function() {
      return {
        recoveryForm: {
          key: ''
        },
      };
    },
    emits: {
      forgotPasswordWallet: (value) => {
        return value;
      }
    },
    methods: {
        requestSecurityQuestion: function(event) {
          event.preventDefault();
          EventBus.$emit('forgotPasswordWallet', { username: this.recoveryForm.key })
        }
    }
}
</script>