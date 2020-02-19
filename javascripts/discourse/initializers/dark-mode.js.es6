import themeSelector from "discourse/lib/theme-selector";
import { withPluginApi } from "discourse/lib/plugin-api";
import showModal from "discourse/lib/show-modal";
import Site from "discourse/models/site";

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

			const themes = Site._current.user_themes;

			function defaultThemeId() {
				let default_theme = themes.filter(theme => theme.default === true)[0];

				if (default_theme.theme_id) {
					return parseInt(default_theme.theme_id);
				}

				return -1;
			}

			function switchingDisabled() {
				const pref = localStorage.getItem(selectedUserSetting);

				if (selectedUserSetting === "disableDarkMode") {
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
				if (!currentUser) return;

				const darkThemeId = parseInt(settings.dark_theme_id),
					currentThemeId = themeSelector.currentThemeId();

				if (
					switchingDisabled() ||
					!darkThemeId ||
					defaultThemeId() === darkThemeId
				) {
					return;
				}

				const dark_theme = themes.filter(
					theme => theme.theme_id === darkThemeId
				);
				if (dark_theme.length !== 1) {
					return;
				}

				if (
					browserInDarkMode.matches &&
					currentThemeId !== darkThemeId &&
					currentThemeId === defaultThemeId()
				) {
					setTheme(darkThemeId);
				}

				if (!browserInDarkMode.matches && currentThemeId === darkThemeId) {
					setTheme(defaultThemeId());
				}
			}

			function setTheme(themeId) {
				setTimeout(function() {
					// delay and visibilityState check
					// needed because of a Safari iOS bug
					// that triggers matchMedia listener
					// while turning off screen
					if (document.visibilityState !== "hidden") {
						currentUser.findDetails().then(user => {
							const seq = user.get("user_option.theme_key_seq");
							themeSelector.setLocalTheme([themeId], seq);
							showModal("dark-mode-modal");
							window.location.reload();
						});
					}
				}, 500);
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
