<template>
  <div id="inspire">
    <!-- Space information -->
    <v-system-bar app>
      <span class="font-weight-bold">Space ID</span>
      <span class="ml-1">space-1</span>
      <span class="font-weight-bold ml-2">Entry code</span>
      <span class="ml-1">193231</span>
      <v-spacer />
    </v-system-bar>

    <v-navigation-drawer app mini-variant mini-variant-width="56" permanent>
      <v-list-item class="px-2">
        <v-app-bar-nav-icon @click.stop="toggleDrawer" />
      </v-list-item>

      <v-divider />
      <v-list dense nav>
        <v-list-item>
          <v-icon @click="toggleDarkMode">mdi-invert-colors</v-icon>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-navigation-drawer v-model="drawer" app width="300" clipped>
      <v-list class="pl-14" shaped height="0px">
        <v-list-item v-for="n in 3" :key="n" link>
          <v-list-item-content>
            <v-list-item-title>Item {{ n }}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-navigation-drawer app clipped right>
      <v-list>
        <v-list-item v-for="n in 5" :key="n" link>
          <v-list-item-content>
            <v-list-item-title>Item {{ n }}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-main>
      <div>
        {{ hello }}
      </div>
    </v-main>

    <v-footer app color="transparent" height="72" inset>
      <v-text-field
        id="searchBar"
        v-model="searchText"
        dense
        flat
        hide-details
        rounded
        solo-inverted
        label="Search for a passage"
        @keyup.enter="submitSearch"
      />
    </v-footer>
  </div>
</template>

<script>
export default {
  data() {
    return {
      drawer: null,
      searchText: "",
      darkMode: false
    };
  },
  methods: {
    toggleDrawer() {
      this.drawer = !this.drawer;
      this.updateGameListItem();
    },
    submitSearch() {
      this.searchText = "";
    },
    toggleDarkMode() {
      this.$vuetify.theme.dark = !this.$vuetify.theme.dark;
    }
  }
};
</script>
