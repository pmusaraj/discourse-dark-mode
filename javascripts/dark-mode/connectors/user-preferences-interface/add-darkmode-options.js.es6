function prefValue(name) {
	let pref = localStorage.getItem(name);
	if (pref !== null && pref === "true") {
		return true;
	}
	return false;
}

export default {
	setupComponent(args, component) {
		if (component.currentUser.id === component.model.id) {
			component.set("isCurrentUser", true);
		}

		component.set(
			"darkThemeSwitchOnByDefault",
			settings.dark_theme_switch_on_by_default
		);

		component.set("model.disableDarkMode", prefValue("disableDarkMode"));
		component.set("model.enableDarkMode", prefValue("enableDarkMode"));
	}
};
