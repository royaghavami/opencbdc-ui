<template>
  <b-card class="border-0">
    <b-form @submit.prevent="submitForm">
      <b-form-file
        v-model="selectedFile"
        placeholder="Choose a text file or drop it here..."
        drop-placeholder="Drop text file here..."
        accept=".txt"
      ></b-form-file>
      <button variant="info" class="btn" type="submit">Submit</button>
    </b-form>
  </b-card>
</template>
<script>
import { EventBus } from "@/event-bus.js";
export default {
  name: "ImportToken",
  data: function () {
    return {
      selectedFile: null,
    };
  },
  methods: {
    submitForm() {
      if (!this.selectedFile) {
        alert("Please select a file.");
        return;
      }
      let reader = new FileReader();
      reader.onload = () => {
        let fileContent = reader.result;
        EventBus.$emit("importToken", { transactionHex: fileContent });
      };
      reader.readAsText(this.selectedFile);
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
