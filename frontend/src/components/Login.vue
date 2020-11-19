<template>
  <v-container>
    <v-img :src="require('../assets/logo.png')" contain height="150" />
    <div class="d-sm-none align-center">
      <p class="text-center font-weight-medium">
        Caution: Mobile devices not supported.
      </p>
    </div>

    <v-row>
      <v-col lg="8" offset-lg="2" sm="10" offset-sm="1">
        <v-tabs v-model="tab" vertical>
          <v-tab>Create a space</v-tab>
          <v-tab>Join a space</v-tab>

          <v-tabs-items v-model="tab" vertical>
            <v-tab-item>
              <v-row>
                <v-col sm="10" offset-sm="1">
                  <v-form>
                    <v-text-field
                      v-model="entryCode"
                      label="Set a 6-digit entry code"
                      prepend-icon="mdi-key"
                      outlined
                      clearable
                      dense
                    />
                  </v-form>
                </v-col>
              </v-row>
            </v-tab-item>

            <v-tab-item>
              <v-row>
                <v-col sm="10" offset-sm="1">
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
  </v-container>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";

@Component
export default class Login extends Vue {
  entryCode = "";
  roomID = "";
  tab = null;
}
</script>

<style scoped>
h1 {
  margin: 0px;
}
</style>
