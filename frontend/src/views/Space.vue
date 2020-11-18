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
        <v-list-item-group v-model="activeUsers" multiple active-class="">
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
        <v-list-item-group v-model="activeTexts" multiple active-class="">
          <v-list-item v-for="n in passages.length" :key="n" link dense>
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
        <v-list-item-group v-model="activeColours" multiple active-class="">
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
        <!-- Section A -->
        <v-col v-show="activeTexts.includes(0)">
          <h1>
            {{ sectionATitle }}
          </h1>
          {{ sectionAText }}
        </v-col>

        <!-- Section B -->
        <v-col v-show="activeTexts.includes(1)">
          <h1>
            {{ sectionBTitle }}
          </h1>
          {{ sectionBText }}
        </v-col>
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
import * as _ from "lodash";
import { allBooks } from "./allBooks";
import { verseIndexer } from "./verseIndexer";
import { lastVerse } from "./lastVerse";
import { textArray } from "./textArray";

const entryCode = "139267";
const spaceID = "space-1";

export default {
  data() {
    return {
      allBooks,
      lastVerse,
      textArray,
      verseIndexer,
      darkMode: false,
      displayedEntryCode: entryCode,
      displayedSpaceID: spaceID,
      drawer: null,
      entryCode: entryCode,
      searchText: null,
      sectionATitle: null,
      sectionBTitle: null,
      sectionAText: null,
      sectionBText: null,
      spaceID: spaceID,
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
      activeUsers: [],
      activeTexts: [0, 1], // defaults to display texts on addition
      activeColours: [],
      storedUsers: [],
      storedColours: []
    };
  },
  computed: {
    passages(): object {
      const allPassages = [this.sectionATitle, this.sectionBTitle];
      return allPassages.filter(section => section !== null);
    }
  },
  methods: {
    toggleDrawer(): void {
      this.drawer = !this.drawer;
    },
    toggleDarkMode(): void {
      this.$vuetify.theme.dark = !this.$vuetify.theme.dark;
    },
    copySpaceID(): void {
      navigator.clipboard.writeText(this.spaceID);
      this.displayedSpaceID = "Copied!";
    },
    releaseSpaceID(): void {
      this.displayedSpaceID = this.spaceID;
    },
    copyEntryCode(): void {
      navigator.clipboard.writeText(this.entryCode);
      this.displayedEntryCode = "Copied!";
    },
    releaseEntryCode(): void {
      this.displayedEntryCode = this.entryCode;
    },
    submitSearch() {
      // Entry method when search is submitted (Enter key is pressed)
      // First, check if searchText is not null
      function toTitleCase(str) {
        return str.replace(/\w\S*/g, function(txt) {
          return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        });
      }

      const searchText = toTitleCase(this.searchText);
      if (searchText !== null) {
        // If sectionATitle is not filled, fill it with searchText.
        // Else, if sectionBTitle is not same as searchText, replace sectionBTitle with searchText
        // (Prevents two of the same passage in both sectionATitle and sectionBTitle)
        if (this.sectionATitle === null) {
          [this.sectionATitle, this.sectionAText] = this.parseSearch(
            searchText
          );
        } else if (this.sectionATitle !== this.searchText) {
          [this.sectionBTitle, this.sectionBText] = this.parseSearch(
            searchText
          );
        }
        this.searchText = null;
      }
    },
    parseSingleVerse(searchText: string): object {
      // 1 John 1:1, Genesis 1:1
      return [searchText, textArray[verseIndexer[searchText]]];
    },
    parseSingleChapter(searchText: string): object {
      // 1 John 1, Genesis 1
      const firstIndex = verseIndexer[searchText + ":1"];
      const lastIndex = verseIndexer[lastVerse[searchText + ":1"]];
      return [searchText, textArray.slice(firstIndex, lastIndex)];
    },
    parseWithinChapter(searchText: string, match: RegExpMatchArray): object {
      // 1 John 1:1-3, {Genesis} {1}:{1}-{3}
      const chapter = match[1] + " " + match[2] + ":";
      const firstIndex = verseIndexer[chapter + match[3]];
      const lastIndex = verseIndexer[chapter + match[4]];
      return [searchText, textArray.slice(firstIndex, lastIndex)];
    },
    parseAcrossChapters(searchText: string, match: RegExpMatchArray): object {
      // 1 John 1:1-2:3, {Genesis} {1}:{1}-{2}:{3}
      const firstIndex =
        verseIndexer[match[1] + " " + match[2] + ":" + match[3]];
      const lastIndex =
        verseIndexer[match[1] + " " + match[4] + ":" + match[5]];
      return [searchText, textArray.slice(firstIndex, lastIndex)];
    },
    parseMultipleChapters(searchText: string, match: RegExpMatchArray): object {
      // 1 John 1-2, {Genesis} {1}-{2}
      const firstIndex = verseIndexer[match[1] + " " + match[2] + ":1"];
      const lastIndex =
        verseIndexer[lastVerse[match[1] + " " + match[3] + ":1"]];
      return [searchText, textArray.slice(firstIndex, lastIndex)];
    },
    parseSearch(searchText: string): object {
      // Parses searchText and returns Array[textName, text]
      const singleVerseRegExp = /^((?:[0-9][\s])?(?:[A-Za-z]+))\s([0-9]+):([0-9]+)$/;
      const singleChapterRegExp = /^((?:[0-9][\s])?(?:[A-Za-z]+))\s([0-9]+)$/;
      const withinChapterRegExp = /^((?:[0-9][\s])?(?:[A-Za-z]+))\s([0-9]+):([0-9]+)-([0-9]+)$/;
      const acrossChaptersRegExp = /^((?:[0-9][\s])?(?:[A-Za-z]+))\s([0-9]+):([0-9]+)-([0-9]+):([0-9]+)$/;
      const multipleChaptersRegExp = /^((?:[0-9][\s])?(?:[A-Za-z]+))\s([0-9]+)-([0-9]+)$/;

      const singleVerseMatch = searchText.match(singleVerseRegExp);
      const singleChapterMatch = searchText.match(singleChapterRegExp);
      const withinChapterMatch = searchText.match(withinChapterRegExp);
      const acrossChaptersMatch = searchText.match(acrossChaptersRegExp);
      const multipleChaptersMatch = searchText.match(multipleChaptersRegExp);

      // console.log(searchText)
      // console.log(withinChapterMatch)

      if (singleVerseMatch !== null) {
        return this.parseSingleVerse(searchText);
      } else if (singleChapterMatch !== null) {
        return this.parseSingleChapter(searchText);
      } else if (withinChapterMatch !== null) {
        return this.parseWithinChapter(searchText, withinChapterMatch);
      } else if (acrossChaptersMatch !== null) {
        return this.parseAcrossChapters(searchText, acrossChaptersMatch);
      } else if (multipleChaptersMatch !== null) {
        return this.parseMultipleChapters(searchText, multipleChaptersMatch);
      }
    },
    toggleColours(): void {
      // I have colours selected, and I also have colours stored, I overwrite my stored colours
      // with my currently selected colours
      if (this.activeColours.length > 0 && this.storedColours.length > 0) {
        this.storedColours = this.activeColours;
        this.activeColours = [];
      } else {
        [this.storedColours, this.activeColours] = [
          this.activeColours,
          this.storedColours
        ];
      }
    },
    toggleUsers(): void {
      if (this.activeUsers.length > 0 && this.storedUsers.length > 0) {
        this.storedUsers = this.activeUsers;
        this.activeUsers = [];
      } else {
        [this.storedUsers, this.activeUsers] = [
          this.activeUsers,
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
