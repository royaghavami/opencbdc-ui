<template>
    <b-card class="border-0">
      <b-form @submit.prevent="submitForm">
            <b-form-input
                v-model="form.value"
                class="input-group-append"
                id="input-2"
                name="input-2"
                placeholder="$0.00 place amount of value"
                required
        ></b-form-input>
        <button variant="info" class="btn" type="submit">Mint</button>
      </b-form>
    </b-card>
</template>
<script>
  import { EventBus } from "@/event-bus.js";
  export default {
    name: "Mint",
    data: function () {
        return {
            form: {
                value: ""
            },
        }
    },
    methods: {
      submitForm() {
        EventBus.$emit("Mint", { value: this.form.value });
      },
    },
  };
  </script>
  <style scoped>
  .btn {
    background-color: rgb(0, 195, 235);
    border: none;
    color: white;
    border-radius: 5px;
    width: 80px;
    height: 40px;
    margin-top: 10px;
  }
</style>
  