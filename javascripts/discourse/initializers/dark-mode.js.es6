import themeSelector from "discourse/lib/theme-selector";
import { withPluginApi } from "discourse/lib/plugin-api";
import showModal from "discourse/lib/show-modal";

export default {
	name: "discourse-dark-mode",
	initialize() {
		withPluginApi("0.8.31", api => {
			const currentUser = api.getCurrentUser();
			const selectedUserSetting = settings.dark_theme_switch_on_by_default
				? "disableDarkMode"
				: "enableDarkMode";

			const browserInDarkMode = window.matchMedia(
				"(prefers-color-scheme: dark)"
			);
			const themes = Discourse.Site._current.user_themes;

			function defaultThemeId() {
				let default_theme = themes.filter(theme => theme.default === true)[0];

				if (default_theme.theme_id) {
					return parseInt(default_theme.theme_id);
				}

				return -1;
			}

			function darkModeDisabled(key) {
				const pref = localStorage.getItem(key);

				if (key === "disableDarkMode") {
					if (pref !== null && pref === "true") {
						return true;
					}
					return false;
				} else {
					if (pref !== null && pref === "true") {
						return false;
					}
					return true;
				}
			}

			function toggleDarkTheme(e) {
				let darkThemeId = parseInt(settings.dark_theme_id);

				if (
					darkModeDisabled(selectedUserSetting) ||
					!darkThemeId ||
					defaultThemeId() === darkThemeId
				) {
					return;
				}

				let dark_theme = themes.filter(theme => theme.theme_id === darkThemeId);
				if (dark_theme.length !== 1) {
					return;
				}

				let currentThemeId = themeSelector.currentThemeId();

				if (
					currentUser &&
					browserInDarkMode.matches &&
					currentThemeId !== darkThemeId &&
					currentThemeId === defaultThemeId()
				) {
					setTheme(currentUser, darkThemeId);
				}

				if (
					currentUser &&
					!browserInDarkMode.matches &&
					currentThemeId === darkThemeId
				) {
					setTheme(currentUser, defaultThemeId());
				}
			}

			function setTheme(currentUser, themeId) {
				currentUser.findDetails().then(user => {
					const seq = user.get("user_option.theme_key_seq");
					themeSelector.setLocalTheme([themeId], seq);
					showModal("dark-mode-modal");
					window.location.reload();
				});
			}

			browserInDarkMode.addListener(toggleDarkTheme);

			var domReady = function(callback) {
				document.readyState === "interactive" ||
				document.readyState === "complete"
					? callback()
					: document.addEventListener("DOMContentLoaded", callback);
			};

			domReady(function() {
				toggleDarkTheme();
			});

			api.modifyClass("controller:preferences/interface", {
				actions: {
					save() {
						this._super();
						if (this.get("model.username") === currentUser.get("username")) {
							localStorage.setItem(
								selectedUserSetting,
								this.get(`model.${selectedUserSetting}`).toString()
							);
						}
					}
				}
			});
		});
	}
};
