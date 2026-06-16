const DATA_URL = "./data/platforms.json";
const ASSET_VERSION = "20260617-more-platforms-batch";
const REPOSITORY_URL = "https://github.com/dibsy/ctf-atlas";
const ALLOWED_URL_PROTOCOLS = new Set(["http:", "https:"]);

const elements = {
  search: document.querySelector("#platform-search"),
  clearSearch: document.querySelector(".clear-search"),
  statusFilterButtons: document.querySelectorAll("[data-status-filter]"),
  hostingFilterButtons: document.querySelectorAll("[data-hosting-filter]"),
  list: document.querySelector("#platform-list"),
  emptyState: document.querySelector("#empty-state"),
  resultCount: document.querySelector("#result-count"),
  totalCount: document.querySelector("#total-count"),
  activeCount: document.querySelector("#active-count"),
  inactiveCount: document.querySelector("#inactive-count"),
  selfHostedCount: document.querySelector("#self-hosted-count"),
  visualTotal: document.querySelector("#visual-total"),
  template: document.querySelector("#platform-card-template"),
  repoLinks: document.querySelectorAll("[data-repo-link]"),
};

const state = {
  platforms: [],
  query: "",
  statusFilter: "all",
  hostingFilter: "all",
};

function toBoolean(value) {
  return value === true || ["true", "yes", "self-hosted"].includes(String(value).toLowerCase());
}

function sanitizeHttpUrl(value) {
  try {
    const url = new URL(String(value).trim());

    if (!ALLOWED_URL_PROTOCOLS.has(url.protocol)) {
      return "";
    }

    return url.href;
  } catch {
    return "";
  }
}

function normalizePlatform(entry) {
  const hosting = entry.Hosting ?? entry.hosting ?? "";
  const selfHosted =
    entry.SelfHosted ?? entry.selfHosted ?? entry.self_hosted ?? entry["Self Hosted"] ?? hosting;
  const url = sanitizeHttpUrl(entry.URL ?? entry.url ?? "");

  return {
    name: entry.Name ?? entry.name ?? "",
    description: entry.Description ?? entry.description ?? "",
    status: (entry.Status ?? entry.status ?? "").toLowerCase(),
    selfHosted: toBoolean(selfHosted),
    url,
  };
}

function initials(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

function hostName(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
  }
}

function matchesPlatform(platform) {
  const isInactive = platform.status === "inactive";

  if (state.statusFilter === "active" && isInactive) {
    return false;
  }

  if (state.statusFilter === "inactive" && !isInactive) {
    return false;
  }

  if (state.hostingFilter === "hosted" && platform.selfHosted) {
    return false;
  }

  if (state.hostingFilter === "self-hosted" && !platform.selfHosted) {
    return false;
  }

  if (!state.query) {
    return true;
  }

  const haystack = [
    platform.name,
    platform.description,
    platform.status,
    platform.selfHosted ? "self-hosted local deploy lab" : "hosted online",
    platform.url,
    hostName(platform.url),
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(state.query);
}

function updateStats(filtered) {
  const inactive = state.platforms.filter((platform) => platform.status === "inactive").length;
  const selfHosted = state.platforms.filter((platform) => platform.selfHosted).length;
  const active = state.platforms.length - inactive;

  elements.totalCount.textContent = state.platforms.length;
  elements.activeCount.textContent = active;
  elements.inactiveCount.textContent = inactive;
  elements.selfHostedCount.textContent = selfHosted;
  elements.visualTotal.textContent = state.platforms.length;

  const label = filtered.length === 1 ? "result" : "results";
  elements.resultCount.textContent = `${filtered.length} ${label}`;
}

function createCard(platform) {
  const fragment = elements.template.content.cloneNode(true);
  const card = fragment.querySelector(".platform-card");
  const statusPill = fragment.querySelector(".status-pill");
  const hostingPill = fragment.querySelector(".hosting-pill");
  const link = fragment.querySelector(".open-platform");

  fragment.querySelector(".platform-initials").textContent = initials(platform.name);
  fragment.querySelector("h2").textContent = platform.name;
  fragment.querySelector(".platform-description").textContent = platform.description;
  fragment.querySelector(".platform-host").textContent = hostName(platform.url);

  link.href = platform.url;
  link.setAttribute("aria-label", `Open ${platform.name}`);

  if (platform.status === "inactive") {
    card.classList.add("is-inactive");
    card.dataset.status = "inactive";
    statusPill.hidden = false;
  }

  if (platform.selfHosted) {
    card.classList.add("is-self-hosted");
    card.dataset.hosting = "self-hosted";
    hostingPill.hidden = false;
  }

  return fragment;
}

function render() {
  const filtered = state.platforms.filter(matchesPlatform);
  const fragment = document.createDocumentFragment();

  filtered.forEach((platform) => {
    fragment.append(createCard(platform));
  });

  elements.list.replaceChildren(fragment);
  elements.list.setAttribute("aria-busy", "false");
  elements.emptyState.hidden = filtered.length > 0;
  elements.clearSearch.hidden = state.query.length === 0;
  updateStats(filtered);
}

function configureRepositoryLinks() {
  const repositoryUrl = sanitizeHttpUrl(REPOSITORY_URL);

  if (!repositoryUrl) {
    return;
  }

  elements.repoLinks.forEach((link) => {
    link.href = repositoryUrl;
  });
}

function setStatusFilter(filter) {
  state.statusFilter = filter;

  elements.statusFilterButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.statusFilter === filter);
  });

  render();
}

function setHostingFilter(filter) {
  state.hostingFilter = filter;

  elements.hostingFilterButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.hostingFilter === filter);
  });

  render();
}

async function loadPlatforms() {
  try {
    const response = await fetch(`${DATA_URL}?v=${ASSET_VERSION}`, { cache: "no-store" });

    if (!response.ok) {
      throw new Error(`Could not load ${DATA_URL}`);
    }

    const data = await response.json();
    state.platforms = data.map(normalizePlatform).filter((platform) => {
      return platform.name && platform.description && platform.url;
    });

    render();
  } catch (error) {
    elements.list.setAttribute("aria-busy", "false");
    elements.resultCount.textContent = "Error";
    elements.emptyState.hidden = false;
    elements.emptyState.textContent =
      "Could not load platform data. Start a local server so the JSON file can be fetched.";
    console.error(error);
  }
}

elements.search.addEventListener("input", (event) => {
  state.query = event.target.value.trim().toLowerCase();
  render();
});

elements.clearSearch.addEventListener("click", () => {
  elements.search.value = "";
  elements.search.focus();
  state.query = "";
  render();
});

elements.statusFilterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setStatusFilter(button.dataset.statusFilter);
  });
});

elements.hostingFilterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setHostingFilter(button.dataset.hostingFilter);
  });
});

configureRepositoryLinks();
loadPlatforms();
