import { Framework } from "vuetify";

declare module "*.vue" {
  import Vue from "vue";
  export default Vue;
  interface Vue {
    $vuetify: Framework;
  }
}
