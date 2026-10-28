(function () {
	"use strict";

	const STORAGE_KEY = "simple-dash-generator-draft";
	const STYLE_ORDER = ["solid", "brands", "regular"];

	const defaultState = {
		title: "Your Homepage Title",
		showLabels: true,
		background: "",
		items: [
			{ alt: "Github", icon: "fa-brands fa-github", link: "https://github.com/your-username" },
			{ alt: "Twitter", icon: "fa-brands fa-x-twitter", link: "https://twitter.com/your-handle" },
			{ alt: "Docker Hub", icon: "fa-brands fa-docker", link: "https://hub.docker.com/u/your-username/" }
		]
	};

	function loadDraft() {
		try {
			const raw = localStorage.getItem(STORAGE_KEY);
			if (!raw) return structuredCloneState(defaultState);
			const parsed = JSON.parse(raw);
			return {
				title: typeof parsed.title === "string" ? parsed.title : "",
				showLabels: parsed.showLabels !== false,
				background: typeof parsed.background === "string" ? parsed.background : "",
				items: Array.isArray(parsed.items) ? parsed.items.map(normalizeItem) : []
			};
		} catch (error) {
			console.warn("Couldn't read saved draft, starting fresh.", error);
			return structuredCloneState(defaultState);
		}
	}

	function normalizeItem(item) {
		return {
			alt: typeof item?.alt === "string" ? item.alt : "",
			icon: typeof item?.icon === "string" ? item.icon : "",
			link: typeof item?.link === "string" ? item.link : ""
		};
	}

	function structuredCloneState(state) {
		return JSON.parse(JSON.stringify(state));
	}

	let state = loadDraft();
	let saveTimer;

	function saveDraft() {
		clearTimeout(saveTimer);
		saveTimer = setTimeout(() => {
			try {
				localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
			} catch (error) {
				console.warn("Couldn't save draft to localStorage.", error);
			}
		}, 200);
	}

	// --- DOM refs ---------------------------------------------------------
	const els = {
		title: document.getElementById("f-title"),
		showLabels: document.getElementById("f-showlabels"),
		background: document.getElementById("f-background"),
		items: document.getElementById("items"),
		itemsEmpty: document.getElementById("items-empty"),
		addItem: document.getElementById("add-item"),
		jsonOutput: document.getElementById("json-output"),
		downloadBtn: document.getElementById("download-btn"),
		copyBtn: document.getElementById("copy-btn"),
		importBtn: document.getElementById("import-btn"),
		importFile: document.getElementById("import-file"),
		dashTitle: document.getElementById("dash-title"),
		itemlist: document.getElementById("itemlist"),
		iconPicker: document.getElementById("icon-picker"),
		iconSearch: document.getElementById("icon-search"),
		iconResults: document.getElementById("icon-results"),
		iconPickerClose: document.getElementById("icon-picker-close")
	};

	// --- Icon data (loaded async, picker degrades gracefully without it) --
	let iconEntries = [];
	fetch("common/js/fa-icons.json", { cache: "force-cache" })
		.then((res) => (res.ok ? res.json() : []))
		.then((data) => {
			iconEntries = [];
			for (const icon of data) {
				const styles = [...icon.s].sort((a, b) => STYLE_ORDER.indexOf(a) - STYLE_ORDER.indexOf(b));
				for (const style of styles) {
					iconEntries.push({ cls: `fa-${style} fa-${icon.n}`, name: icon.n });
				}
			}
		})
		.catch((error) => console.warn("Icon search data failed to load; manual class entry still works.", error));

	// --- Rendering ----------------------------------------------------------
	function render() {
		els.title.value = state.title;
		els.showLabels.checked = state.showLabels;
		els.background.value = state.background;
		applyBackground(state.background);
		renderItems();
		renderPreview();
		renderJSON();
		saveDraft();
	}

	function renderItems() {
		els.items.innerHTML = "";
		els.itemsEmpty.hidden = state.items.length > 0;

		state.items.forEach((item, index) => {
			const row = document.createElement("div");
			row.className = "item-row";

			const fields = document.createElement("div");
			fields.className = "item-fields";

			const altInput = document.createElement("input");
			altInput.className = "f-alt";
			altInput.type = "text";
			altInput.placeholder = "Label (e.g. Github)";
			altInput.value = item.alt;
			altInput.addEventListener("input", () => {
				state.items[index].alt = altInput.value;
				renderPreview();
				renderJSON();
				saveDraft();
			});

			const linkInput = document.createElement("input");
			linkInput.className = "f-link";
			linkInput.type = "text";
			linkInput.placeholder = "https://example.com or {{cur}}";
			linkInput.value = item.link;
			linkInput.addEventListener("input", () => {
				state.items[index].link = linkInput.value;
				renderJSON();
				saveDraft();
			});

			const iconField = document.createElement("div");
			iconField.className = "icon-field";

			const iconPreview = document.createElement("i");
			iconPreview.className = "icon-preview " + (item.icon || "");

			const iconInput = document.createElement("input");
			iconInput.className = "f-icon";
			iconInput.type = "text";
			iconInput.placeholder = "fa-brands fa-github";
			iconInput.value = item.icon;
			iconInput.addEventListener("input", () => {
				state.items[index].icon = iconInput.value;
				iconPreview.className = "icon-preview " + iconInput.value;
				renderPreview();
				renderJSON();
				saveDraft();
			});

			const browseBtn = document.createElement("button");
			browseBtn.type = "button";
			browseBtn.className = "btn";
			browseBtn.textContent = "Browse";
			browseBtn.addEventListener("click", () => openIconPicker(index));

			iconField.append(iconPreview, iconInput, browseBtn);
			fields.append(altInput, iconField, linkInput);

			const controls = document.createElement("div");
			controls.className = "item-controls";

			const upBtn = makeIconButton("↑", "Move up", () => moveItem(index, -1));
			const downBtn = makeIconButton("↓", "Move down", () => moveItem(index, 1));
			const removeBtn = makeIconButton("✕", "Remove", () => removeItem(index));

			upBtn.disabled = index === 0;
			downBtn.disabled = index === state.items.length - 1;

			controls.append(upBtn, downBtn, removeBtn);
			row.append(fields, controls);
			els.items.appendChild(row);
		});
	}

	function makeIconButton(label, aria, onClick) {
		const btn = document.createElement("button");
		btn.type = "button";
		btn.className = "btn btn-icon";
		btn.textContent = label;
		btn.setAttribute("aria-label", aria);
		btn.addEventListener("click", onClick);
		return btn;
	}

	function renderPreview() {
		els.dashTitle.textContent = state.title || "";
		els.itemlist.classList.toggle("no-labels", state.showLabels === false);
		els.itemlist.innerHTML = "";

		state.items.forEach((item, index) => {
			const tile = document.createElement("a");
			tile.className = "tile";
			tile.href = item.link || "#";
			tile.title = item.alt;
			tile.style.setProperty("--i", index);
			tile.addEventListener("click", (e) => e.preventDefault());

			const iconWrap = document.createElement("span");
			iconWrap.className = "tile-icon";
			const icon = document.createElement("i");
			icon.className = `${item.icon} fa-fw`;
			icon.setAttribute("aria-hidden", "true");
			iconWrap.appendChild(icon);

			const label = document.createElement("span");
			label.className = "tile-label";
			label.textContent = item.alt || "";

			tile.append(iconWrap, label);
			els.itemlist.appendChild(tile);
		});
	}

	function renderJSON() {
		const output = {
			title: state.title,
			showLabels: state.showLabels,
			...(state.background ? { background: state.background } : {}),
			items: state.items.map((item) => ({ alt: item.alt, icon: item.icon, link: item.link }))
		};
		els.jsonOutput.textContent = JSON.stringify(output, null, "\t");
	}

	// --- Item mutation --------------------------------------------------
	function moveItem(index, dir) {
		const target = index + dir;
		if (target < 0 || target >= state.items.length) return;
		const [moved] = state.items.splice(index, 1);
		state.items.splice(target, 0, moved);
		render();
	}
	function removeItem(index) {
		state.items.splice(index, 1);
		render();
	}
	function addItem() {
		state.items.push({ alt: "", icon: "", link: "" });
		render();
		const rows = els.items.querySelectorAll(".f-alt");
		rows[rows.length - 1]?.focus();
	}

	// --- Icon picker --------------------------------------------------------
	let activeItemIndex = null;

	function openIconPicker(index) {
		activeItemIndex = index;
		els.iconPicker.hidden = false;
		els.iconSearch.value = "";
		els.iconResults.innerHTML = "";
		els.iconSearch.focus();
		showPopularIcons();
	}
	function closeIconPicker() {
		els.iconPicker.hidden = true;
		activeItemIndex = null;
	}

	function showPopularIcons() {
		if (!iconEntries.length) {
			els.iconResults.innerHTML = '<p class="icon-empty">Icon search is still loading&hellip;</p>';
			return;
		}
		els.iconResults.innerHTML = '<p class="icon-empty">Type to search ' + iconEntries.length + ' icons.</p>';
	}

	function searchIcons(query) {
		const q = query.trim().toLowerCase();
		if (!q) {
			showPopularIcons();
			return;
		}
		if (!iconEntries.length) {
			els.iconResults.innerHTML = '<p class="icon-empty">Icon search is still loading&hellip;</p>';
			return;
		}

		const matches = iconEntries.filter((entry) => entry.name.includes(q)).slice(0, 60);
		els.iconResults.innerHTML = "";

		if (matches.length === 0) {
			els.iconResults.innerHTML = '<p class="icon-empty">No icons match &ldquo;' + escapeHTML(query) + '&rdquo;.</p>';
			return;
		}

		const fragment = document.createDocumentFragment();
		for (const entry of matches) {
			const btn = document.createElement("button");
			btn.type = "button";
			btn.className = "icon-result";

			const i = document.createElement("i");
			i.className = entry.cls;
			const span = document.createElement("span");
			span.textContent = entry.cls;

			btn.append(i, span);
			btn.addEventListener("click", () => {
				if (activeItemIndex === null) return;
				state.items[activeItemIndex].icon = entry.cls;
				render();
				closeIconPicker();
			});
			fragment.appendChild(btn);
		}
		els.iconResults.appendChild(fragment);
	}

	function escapeHTML(str) {
		const div = document.createElement("div");
		div.textContent = str;
		return div.innerHTML;
	}

	let searchTimer;
	els.iconSearch.addEventListener("input", () => {
		clearTimeout(searchTimer);
		searchTimer = setTimeout(() => searchIcons(els.iconSearch.value), 120);
	});
	els.iconPickerClose.addEventListener("click", closeIconPicker);
	els.iconPicker.addEventListener("click", (e) => {
		if (e.target === els.iconPicker) closeIconPicker();
	});
	document.addEventListener("keydown", (e) => {
		if (e.key === "Escape" && !els.iconPicker.hidden) closeIconPicker();
	});

	// --- Top-level field bindings --------------------------------------
	els.title.addEventListener("input", () => {
		state.title = els.title.value;
		renderPreview();
		renderJSON();
		saveDraft();
	});
	els.showLabels.addEventListener("change", () => {
		state.showLabels = els.showLabels.checked;
		renderPreview();
		renderJSON();
		saveDraft();
	});
	let backgroundTimer;
	els.background.addEventListener("input", () => {
		state.background = els.background.value;
		renderJSON();
		saveDraft();
		clearTimeout(backgroundTimer);
		backgroundTimer = setTimeout(() => applyBackground(state.background), 500);
	});
	els.addItem.addEventListener("click", addItem);

	// --- Export / import --------------------------------------------------
	els.downloadBtn.addEventListener("click", () => {
		const blob = new Blob([els.jsonOutput.textContent], { type: "application/json" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "config.json";
		document.body.appendChild(a);
		a.click();
		a.remove();
		URL.revokeObjectURL(url);
	});

	els.copyBtn.addEventListener("click", async () => {
		try {
			await navigator.clipboard.writeText(els.jsonOutput.textContent);
			const original = els.copyBtn.textContent;
			els.copyBtn.textContent = "Copied!";
			setTimeout(() => (els.copyBtn.textContent = original), 1200);
		} catch (error) {
			console.warn("Clipboard copy failed; select the JSON manually instead.", error);
		}
	});

	els.importBtn.addEventListener("click", () => els.importFile.click());
	els.importFile.addEventListener("change", async () => {
		const file = els.importFile.files?.[0];
		if (!file) return;
		try {
			const text = await file.text();
			const parsed = JSON.parse(text);
			state = {
				title: typeof parsed.title === "string" ? parsed.title : "",
				showLabels: parsed.showLabels !== false,
				background: typeof parsed.background === "string" ? parsed.background : "",
				items: Array.isArray(parsed.items) ? parsed.items.map(normalizeItem) : []
			};
			render();
		} catch (error) {
			console.error(error);
			alert("Couldn't read that file — make sure it's a valid config.json.");
		} finally {
			els.importFile.value = "";
		}
	});

	// --- Background + init --------------------------------------------------
	// Fixed to the viewport (see #bg in generator.css), so it stays put while
	// the long form scrolls over it, and only ever needs to match the
	// viewport size rather than the page's full scrollable height.
	function renderBackground() {
		const pattern = Trianglify({ width: window.innerWidth, height: window.innerHeight });
		bg.style.backgroundImage = `url(${pattern.png()})`;
	}

	let usingCustomBackground = false;

	// Mirrors index.html's handling: preload so a broken URL falls back to
	// the generated pattern instead of leaving a blank/flat layer.
	function applyBackground(path) {
		if (!path) {
			if (usingCustomBackground) {
				usingCustomBackground = false;
				bg.classList.remove("custom");
				renderBackground();
			}
			return;
		}

		const preload = new Image();
		preload.onload = () => {
			usingCustomBackground = true;
			bg.classList.add("custom");
			bg.style.backgroundImage = `url(${JSON.stringify(path)})`;
		};
		preload.onerror = () => {
			console.warn(`Couldn't load the custom background "${path}"; using the generated pattern instead.`);
			usingCustomBackground = false;
			bg.classList.remove("custom");
			renderBackground();
		};
		preload.src = path;
	}

	let resizeTimer;
	window.addEventListener("resize", () => {
		clearTimeout(resizeTimer);
		resizeTimer = setTimeout(() => {
			if (usingCustomBackground) return;
			renderBackground();
		}, 400);
	});

	renderBackground();
	render();
})();
