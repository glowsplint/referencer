<template>
  <div id="inspire">
    <!-- Space information @ system bar-->
    <v-system-bar app fixed height="40">
      <span class="font-weight-bold ml-1">Space ID</span>
      <v-btn
        rounded
        small
        elevation="0"
        class="ml-2"
        @mousedown="copySpaceID"
        @mouseup="releaseSpaceID"
        >{{ displayedSpaceID }}</v-btn
      >
      <span class="font-weight-bold ml-3">Entry code</span>
      <v-btn
        rounded
        small
        elevation="0"
        class="ml-2"
        @mousedown="copyEntryCode"
        @mouseup="releaseEntryCode"
        >{{ displayedEntryCode }}</v-btn
      >
      <v-spacer />
    </v-system-bar>

    <!-- Icon pane -->
    <v-navigation-drawer app mini-variant mini-variant-width="56" permanent>
      <v-list-item class="px-2">
        <v-app-bar-nav-icon @click.stop="toggleDrawer" />
      </v-list-item>

      <v-divider />
      <v-list dense nav>
        <v-list-item>
          <v-tooltip right>
            <template v-slot:activator="{ on, attrs }">
              <v-icon v-bind="attrs" v-on="on" @click="toggleDarkMode">
                mdi-invert-colors
              </v-icon>
            </template>
            <span>Toggle dark mode</span>
          </v-tooltip>
        </v-list-item>

        <v-list-item>
          <v-tooltip right>
            <template v-slot:activator="{ on, attrs }">
              <v-icon v-bind="attrs" v-on="on" @click="toggleUsers">
                mdi-account-multiple
              </v-icon>
            </template>
            <span>Toggle users</span>
          </v-tooltip>
        </v-list-item>

        <v-list-item>
          <v-tooltip right>
            <template v-slot:activator="{ on, attrs }">
              <v-icon v-bind="attrs" v-on="on" @click="toggleColours">
                mdi-palette
              </v-icon>
            </template>
            <span>Toggle colours</span>
          </v-tooltip>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <!-- Layer pane -->
    <v-navigation-drawer v-model="drawer" app width="300" clipped>
      <v-list class="pl-14" height="0" shaped dense>
        <v-subheader>Users</v-subheader>
        <v-list-item-group v-model="selectionUsers" multiple active-class="">
          <v-list-item v-for="n in users.length" :key="n" link dense>
            <template v-slot:default="{ active }">
              <v-list-item-action>
                <v-checkbox :input-value="active" light></v-checkbox>
              </v-list-item-action>
              <v-list-item-content>
                <v-list-item-title>{{ users[n - 1] }}</v-list-item-title>
              </v-list-item-content>
            </template>
          </v-list-item>
        </v-list-item-group>

        <v-divider />

        <v-subheader>Texts</v-subheader>
        <v-list-item-group v-model="selectionTexts" multiple active-class="">
          <v-list-item
            v-for="n in passages.length"
            :key="n"
            v-model="showSection[n - 1]"
            link
            dense
          >
            <template v-slot:default="{ active }">
              <v-list-item-action>
                <v-checkbox :input-value="active" color="grey" />
              </v-list-item-action>
              <v-list-item-content>
                <v-list-item-title>{{ passages[n - 1] }}</v-list-item-title>
              </v-list-item-content>
              <v-list-item-icon>
                <v-icon>
                  mdi-close
                </v-icon>
              </v-list-item-icon>
            </template>
          </v-list-item>
        </v-list-item-group>

        <v-divider />

        <v-subheader>Colours</v-subheader>
        <v-list-item-group v-model="selectionColours" multiple active-class="">
          <v-list-item v-for="n in colours.length" :key="n" link dense>
            <template v-slot:default="{ active }">
              <v-list-item-action>
                <v-checkbox
                  :input-value="active"
                  :color="coloursValue[n - 1]"
                />
              </v-list-item-action>
              <v-list-item-content>
                <v-list-item-title>{{ colours[n - 1] }}</v-list-item-title>
              </v-list-item-content>
            </template>
          </v-list-item>
        </v-list-item-group>
      </v-list>
    </v-navigation-drawer>

    <v-main>
      <v-row>
        {{ showSection }}
        <!-- Section A -->
        <v-col> {{ sectionATitle }} {{ sectionAText }} </v-col>

        <!-- Section B -->
        <v-col> {{ sectionBTitle }} {{ sectionBText }} </v-col>
      </v-row>
    </v-main>

    <v-footer app color="transparent" height="72">
      <v-combobox
        id="searchBar"
        v-model="searchText"
        :items="allBooks"
        prepend-inner-icon="mdi-magnify"
        dense
        flat
        hide-details
        rounded
        solo-inverted
        label="Add a passage"
        hide-no-data
        toggleable
        @keyup.enter="submitSearch"
      >
      </v-combobox>
    </v-footer>
  </div>
</template>

<script lang="ts">
import { allBooks } from "./allBooks";
import { bibleText } from "./bible";
import * as _ from "lodash";

export default {
  data() {
    return {
      allBooks: allBooks,
      bibleText: bibleText,
      darkMode: false,
      displayedEntryCode: "139267",
      displayedSpaceID: "space-1",
      drawer: null,
      entryCode: "139267",
      searchText: null,
      sectionATitle: null,
      sectionBTitle: null,
      sectionAText: null,
      sectionBText: null,
      spaceID: "space-1",
      colours: ["Red", "Green", "Blue", "Yellow", "Cyan", "Indigo"],
      coloursValue: [
        "red",
        "green",
        "blue lighten-1",
        "yellow darken-3",
        "cyan",
        "indigo lighten-1"
      ],
      users: ["Jon", "Mel", "Sean"],
      selectionUsers: [],
      selectionTexts: [],
      selectionColours: [],
      storedUsers: [],
      storedColours: [],
      showSection: [true, true]
    };
  },
  computed: {
    passages() {
      const allPassages = [this.sectionATitle, this.sectionBTitle];
      return allPassages.filter(section => section !== null);
    }
  },
  methods: {
    toggleDrawer() {
      this.drawer = !this.drawer;
    },
    toggleDarkMode() {
      this.$vuetify.theme.dark = !this.$vuetify.theme.dark;
    },
    copySpaceID() {
      navigator.clipboard.writeText(this.spaceID);
      this.displayedSpaceID = "Copied!";
    },
    releaseSpaceID() {
      this.displayedSpaceID = this.spaceID;
    },
    copyEntryCode() {
      navigator.clipboard.writeText(this.entryCode);
      this.displayedEntryCode = "Copied!";
    },
    releaseEntryCode() {
      this.displayedEntryCode = this.entryCode;
    },
    submitSearch() {
      // First, check if searchText is not null
      if (this.searchText !== null) {
        // If sectionATitle is not filled, fill it with searchText.
        // Else, if sectionBTitle is not same as searchText, replace sectionBTitle with searchText
        // (Prevents two of the same passage in both sectionATitle and sectionBTitle)
        if (this.sectionATitle === null) {
          [this.sectionATitle, this.sectionAText] = this.parseSearch(
            this.searchText
          );
        } else if (this.sectionATitle !== this.searchText) {
          [this.sectionBTitle, this.sectionBText] = this.parseSearch(
            this.searchText
          );
        }
        this.searchText = null;
      }
    },
    parseVerseSingle(searchText: string): object {
      // Single verse search, returns Array[textName, text]
      searchText = searchText.toLowerCase();
      return [_.capitalize(searchText), bibleText[searchText]];
    },
    parseVerseMultiple(searchText: string): object {
      // Multiple verse search
      return [];
    },
    parseChapterSingle(searchText: string): object {
      return [];
    },
    parseChapterMultiple(searchText: string): object {
      return [];
    },
    parseSearch(searchText: string): object {
      // Parses searchText and returns Array[textName, text]
      // Handles single-verse searches
      // Needs to handle multi-verse searches
      // Needs to handle chapter-level searches

      // Can consider using regex to handle - if regex of xx pattern...
      if (searchText.includes("-")) {
        return this.parseVerseMultiple(searchText);
      } else {
        return this.parseVerseSingle(searchText);
      }
    },
    toggleColours() {
      // I have colours selected, and I also have colours stored, I overwrite my stored colours
      // with my currently selected colours
      if (this.selectionColours.length > 0 && this.storedColours.length > 0) {
        this.storedColours = this.selectionColours;
        this.selectionColours = [];
      } else {
        [this.storedColours, this.selectionColours] = [
          this.selectionColours,
          this.storedColours
        ];
      }
    },
    toggleUsers() {
      if (this.selectionUsers.length > 0 && this.storedUsers.length > 0) {
        this.storedUsers = this.selectionUsers;
        this.selectionUsers = [];
      } else {
        [this.storedUsers, this.selectionUsers] = [
          this.selectionUsers,
          this.storedUsers
        ];
      }
    }
  }
};
</script>

<style scoped>
.v-btn {
  text-transform: none;
}
</style>
