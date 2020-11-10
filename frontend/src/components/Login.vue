<template>
  <div>
    <v-row justify="center" align="center" dense>
      <v-col align-self="end">
        <v-img :src="require('../assets/logo.png')" contain height="150" />
      </v-col>
    </v-row>

    <v-row>
      <v-col lg="6" md="8" sm="10" offset-lg="3" offset-md="2" offset-sm="1">
        <v-tabs v-model="tab" vertical>
          <v-tab>Create a space</v-tab>
          <v-tab>Join a space</v-tab>

          <v-tabs-items v-model="tab">
            <v-tab-item>
              <v-row>
                <v-col sm="8" offset-sm="1">
                  <v-form>
                    <v-text-field
                      v-model="entryCode"
                      label="Set a 6-digit entry code (optional)"
                      prepend-icon="mdi-key"
                      outlined
                      clearable
                      dense
                    />
                  </v-form>
                </v-col>
                <v-col xs="3">
                  <v-btn>
                    Let's go!
                  </v-btn>
                </v-col>
              </v-row>
            </v-tab-item>

            <v-tab-item>
              <v-row>
                <v-col md="10" sm="10" offset-md="1" offset-sm="1">
                  <v-form>
                    <v-text-field
                      v-model="roomID"
                      label="Space ID"
                      prepend-icon="mdi-door-open"
                      outlined
                      clearable
                      dense
                    />
                    <v-text-field
                      v-model="entryCode"
                      label="6-digit entry code"
                      prepend-icon="mdi-key"
                      outlined
                      clearable
                      dense
                    />
                  </v-form>
                </v-col>
              </v-row>
            </v-tab-item>
          </v-tabs-items>
        </v-tabs>
      </v-col>
    </v-row>
  </div>
</template>

<style scoped>
h1 {
  margin: 0px;
}
</style>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: "HelloWorld",

  data: () => ({
    tab: null
  })
});
</script>
