// @ts-nocheck
"use strict";

/*
 * ============================================================
 * DREAMVERSE NFT STUDIO
 * Complete browser-based NFT generator.
 *
 * - Collection Website is optional.
 * - Image Base URI is optional during generation.
 * - Maximum collection size: 4,000.
 * - JSZip must be loaded before this file.
 * ============================================================
 */

const state = {
  collection: {
    name: "DREAMVERSE",
    description: "",
    count: 10,
    website: "",
    imageBaseURI: "",
  },

  layers: [],
  generated: [],
  isGenerating: false,

  imageDimensions: {
    width: null,
    height: null,
  },
};

/* ============================================================
   DOM HELPERS
   ============================================================ */

function $(id) {
  return document.getElementById(id);
}

function cleanText(value) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function setText(id, value) {
  const element = $(id);

  if (element) {
    element.textContent = String(value);
  }
}

/* ============================================================
   SAFE FILENAMES
   ============================================================ */

function safeFilename(value) {
  return (
    cleanText(value)
      .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
      .replace(/[^\w\s.-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^\.+/, "")
      .slice(0, 100) || "untitled"
  );
}

function slugify(value) {
  return (
    safeFilename(value)
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "collection"
  );
}

/* ============================================================
   ERROR HANDLING
   ============================================================ */

function showError(message) {
  window.alert(`DREAMVERSE NFT STUDIO\n\n${String(message)}`);
}

/* ============================================================
   PANEL NAVIGATION
   ============================================================ */

function showPanel(panelId) {
  const panelIds = ["setup", "layers", "traits", "generate", "export"];

  panelIds.forEach((id) => {
    const panel = $(id);

    if (panel) {
      panel.classList.toggle("hidden", id !== panelId);
    }
  });

  updateSteps(panelId);
}

function updateSteps(panelId) {
  const steps = document.querySelectorAll(".steps span");

  const order = {
    setup: 0,
    layers: 1,
    traits: 2,
    generate: 3,
    export: 4,
  };

  const current = Object.prototype.hasOwnProperty.call(order, panelId)
    ? order[panelId]
    : 0;

  steps.forEach((step, index) => {
    step.classList.toggle("active", index === current);
  });
}

/* ============================================================
   DOWNLOAD
   ============================================================ */

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = url;
  link.download = filename;

  document.body.appendChild(link);

  link.click();

  link.remove();

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 2000);
}

/* ============================================================
   IMAGE LOADING
   ============================================================ */

function loadImage(file) {
  return new Promise((resolve, reject) => {
    if (!(file instanceof File)) {
      reject(new Error("Invalid image file."));

      return;
    }

    const url = URL.createObjectURL(file);

    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(url);

      resolve({
        image,
        width: image.naturalWidth,
        height: image.naturalHeight,
      });
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);

      reject(new Error(`Unable to read image: ${file.name}`));
    };

    image.src = url;
  });
}

/* ============================================================
   IMAGE DIMENSIONS
   ============================================================ */

async function validateImageDimensions(file, layer) {
  const result = await loadImage(file);

  if (!state.imageDimensions.width || !state.imageDimensions.height) {
    state.imageDimensions.width = result.width;

    state.imageDimensions.height = result.height;
  }

  if (
    result.width !== state.imageDimensions.width ||
    result.height !== state.imageDimensions.height
  ) {
    throw new Error(
      `${file.name} is ${result.width}×${result.height}px.\n\n` +
        `All NFT layers must use the same dimensions.\n\n` +
        `Required: ${state.imageDimensions.width}×${state.imageDimensions.height}px.`,
    );
  }

  layer.dimensions = {
    width: result.width,
    height: result.height,
  };

  return result;
}

/* ============================================================
   COLLECTION SETUP
   ============================================================ */

function readCollectionSetup() {
  const name = cleanText($("collection-name")?.value);

  const description = cleanText($("collection-description")?.value);

  const count = Number.parseInt($("nft-count")?.value, 10);

  const website = cleanText($("external-url")?.value);

  const imageBaseURI = cleanText($("image-base-uri")?.value);

  if (!name) {
    throw new Error("Please enter a collection name.");
  }

  if (!Number.isInteger(count)) {
    throw new Error("Please enter a valid NFT quantity.");
  }

  if (count < 1 || count > 4000) {
    throw new Error("NFT quantity must be between 1 and 4,000.");
  }

  /*
   * Website is OPTIONAL.
   */
  if (website) {
    let url;

    try {
      url = new URL(website);
    } catch {
      throw new Error("Collection Website must be a valid URL.");
    }

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error(
        "Collection Website must begin with http:// or https://.",
      );
    }
  }

  state.collection = {
    name,
    description,
    count,
    website,
    imageBaseURI,
  };
}

function continueToLayers() {
  try {
    readCollectionSetup();

    showPanel("layers");
  } catch (error) {
    showError(error.message || "Unable to continue.");
  }
}

/* ============================================================
   LAYERS
   ============================================================ */

function createLayer() {
  return {
    id: `layer-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,

    name: `Layer ${state.layers.length + 1}`,

    traits: [],

    dimensions: {
      width: null,
      height: null,
    },
  };
}

function addLayer() {
  state.layers.push(createLayer());

  renderLayers();
}

function removeLayer(layerId) {
  const index = state.layers.findIndex((layer) => layer.id === layerId);

  if (index === -1) {
    return;
  }

  const layer = state.layers[index];

  if (
    !window.confirm(
      `Remove "${layer.name}"?\n\n` +
        "All traits in this layer will also be removed.",
    )
  ) {
    return;
  }

  state.layers.splice(index, 1);

  recalculateDimensions();

  renderLayers();
}

function moveLayer(layerId, direction) {
  const index = state.layers.findIndex((layer) => layer.id === layerId);

  if (index === -1) {
    return;
  }

  const newIndex = index + direction;

  if (newIndex < 0 || newIndex >= state.layers.length) {
    return;
  }

  [state.layers[index], state.layers[newIndex]] = [
    state.layers[newIndex],
    state.layers[index],
  ];

  renderLayers();
}

function updateLayerName(layerId, value) {
  const layer = state.layers.find((item) => item.id === layerId);

  if (layer) {
    layer.name = cleanText(value) || "Unnamed Layer";
  }
}

/* ============================================================
   TRAITS
   ============================================================ */

function createTrait(file, imageData) {
  const originalName = file.name.replace(/\.[^/.]+$/, "");

  return {
    id: `trait-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,

    name: safeFilename(originalName),

    file,

    image: imageData.image,

    width: imageData.width,

    height: imageData.height,

    weight: 1,
  };
}
async function handleTraitUpload(layerId, files) {
  const layer = state.layers.find((item) => item.id === layerId);

  if (!layer) {
    throw new Error("Layer could not be found.");
  }

  const selectedFiles = Array.from(files || []);

  if (!selectedFiles.length) {
    return;
  }

  const allowedExtensions = ["png", "jpg", "jpeg", "webp"];

  for (const file of selectedFiles) {
    const filename = String(file.name || "").toLowerCase();

    const extension = filename.includes(".") ? filename.split(".").pop() : "";

    const validByExtension = allowedExtensions.includes(extension);

    const validByMime =
      typeof file.type === "string" &&
      ["image/png", "image/jpeg", "image/webp"].includes(file.type);

    if (!validByExtension && !validByMime) {
      showError(
        `${file.name || "Selected file"}\n\n` +
          "Only PNG, JPG, JPEG and WebP images are supported.",
      );
      continue;
    }

    try {
      const imageData = await validateImageDimensions(file, layer);

      layer.traits.push(createTrait(file, imageData));
    } catch (error) {
      showError(error.message || `Unable to load ${file.name}.`);
    }
  }

  renderLayers();
}
/* ============================================================
   DIMENSION RECALCULATION
   ============================================================ */

function recalculateDimensions() {
  let width = null;
  let height = null;

  for (const layer of state.layers) {
    for (const trait of layer.traits) {
      if (width === null) {
        width = trait.width;
        height = trait.height;
      }
    }
  }

  state.imageDimensions = {
    width,
    height,
  };
}

/* ============================================================
   RENDER LAYERS
   ============================================================ */

function renderLayers() {
  const container = $("layer-list");

  if (!container) {
    return;
  }

  container.innerHTML = "";

  if (!state.layers.length) {
    const message = document.createElement("p");

    message.textContent = "No layers yet. Click “+ Add Layer” to begin.";

    container.appendChild(message);

    return;
  }

  state.layers.forEach((layer, index) => {
    const wrapper = document.createElement("div");

    wrapper.className = "layer-item";

    wrapper.dataset.layerId = layer.id;

    /* Layer header */

    const header = document.createElement("div");

    header.className = "layer-header";

    const nameInput = document.createElement("input");

    nameInput.type = "text";
    nameInput.value = layer.name;
    nameInput.maxLength = 60;

    nameInput.setAttribute("aria-label", "Layer name");

    nameInput.addEventListener("input", (event) => {
      updateLayerName(layer.id, event.target.value);
    });

    const upButton = document.createElement("button");

    upButton.type = "button";
    upButton.textContent = "↑";
    upButton.title = "Move layer up";

    upButton.disabled = index === 0;

    upButton.addEventListener("click", () => {
      moveLayer(layer.id, -1);
    });

    const downButton = document.createElement("button");

    downButton.type = "button";
    downButton.textContent = "↓";
    downButton.title = "Move layer down";

    downButton.disabled = index === state.layers.length - 1;

    downButton.addEventListener("click", () => {
      moveLayer(layer.id, 1);
    });

    const removeButton = document.createElement("button");

    removeButton.type = "button";

    removeButton.textContent = "Remove Layer";

    removeButton.addEventListener("click", () => {
      removeLayer(layer.id);
    });

    header.append(nameInput, upButton, downButton, removeButton);

    wrapper.appendChild(header);

    /* Upload */

    const uploadLabel = document.createElement("label");

    uploadLabel.className = "trait-upload-label";

    uploadLabel.textContent = "Upload Trait Images";

    const fileInput = document.createElement("input");

    fileInput.type = "file";

    fileInput.accept = ".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp";

    fileInput.multiple = true;

    fileInput.className = "trait-file-input";

    fileInput.addEventListener("change", async (event) => {
      try {
        await handleTraitUpload(layer.id, event.target.files);
      } catch (error) {
        showError(error.message || "Unable to upload traits.");
      }

      event.target.value = "";
    });

    uploadLabel.appendChild(fileInput);

    wrapper.appendChild(uploadLabel);

    /* Dimensions */

    if (layer.dimensions.width && layer.dimensions.height) {
      const dimensions = document.createElement("small");

      dimensions.textContent = `Image size: ${layer.dimensions.width} × ${layer.dimensions.height}px`;

      wrapper.appendChild(dimensions);
    }

    /* Traits */

    const traitList = document.createElement("div");

    traitList.className = "trait-list";

    if (!layer.traits.length) {
      const message = document.createElement("p");

      message.textContent = "No traits uploaded yet.";

      traitList.appendChild(message);
    }

    layer.traits.forEach((trait) => {
      const row = document.createElement("div");

      row.className = "trait-row";

      const name = document.createElement("input");

      name.type = "text";
      name.value = trait.name;
      name.maxLength = 100;

      name.setAttribute("aria-label", "Trait name");

      name.addEventListener("input", (event) => {
        updateTraitName(layer.id, trait.id, event.target.value);
      });

      const weight = document.createElement("input");

      weight.type = "number";
      weight.min = "0";
      weight.step = "0.01";
      weight.value = trait.weight;

      weight.title =
        "Weight or percentage, depending on the selected rarity method.";

      weight.addEventListener("input", (event) => {
        updateTraitWeight(layer.id, trait.id, event.target.value);
      });

      const remove = document.createElement("button");

      remove.type = "button";

      remove.textContent = "Remove";

      remove.addEventListener("click", () => {
        removeTrait(layer.id, trait.id);
      });

      row.append(name, weight, remove);

      traitList.appendChild(row);
    });

    wrapper.appendChild(traitList);

    container.appendChild(wrapper);
  });
}

/* ============================================================
   VALIDATION
   ============================================================ */
function calculateMaximumCombinations() {
  if (!state.layers.length) {
    return 0;
  }

  return state.layers.reduce((total, layer) => total * layer.traits.length, 1);
}

function validateLayers() {
  if (!state.layers.length) {
    throw new Error("Create at least one layer.");
  }

  for (const layer of state.layers) {
    layer.name = cleanText(layer.name);

    if (!layer.name) {
      throw new Error("Every layer must have a name.");
    }

    if (!layer.traits.length) {
      throw new Error(
        `Layer "${layer.name}" has no traits.\n\n` +
          "Upload at least one trait image.",
      );
    }

    for (const trait of layer.traits) {
      trait.name = cleanText(trait.name);

      if (!trait.name) {
        throw new Error(`A trait in "${layer.name}" has no name.`);
      }

      if (!Number.isFinite(trait.weight) || trait.weight < 0) {
        throw new Error(`Trait "${trait.name}" has an invalid weight.`);
      }
    }
  }

  const maximum = calculateMaximumCombinations();

  const preventDuplicates = $("prevent-duplicates")?.checked !== false;

  if (preventDuplicates && state.collection.count > maximum) {
    throw new Error(
      `You requested ${state.collection.count} NFTs, ` +
        `but your layers can produce only ${maximum} unique combinations.\n\n` +
        "Add more traits or reduce the NFT quantity.",
    );
  }

  const mode = $("rarity-mode")?.value || "weights";

  for (const layer of state.layers) {
    if (mode === "weights" || mode === "percentages") {
      const total = layer.traits.reduce(
        (sum, trait) => sum + Number(trait.weight),
        0,
      );

      if (total <= 0) {
        throw new Error(`All traits in "${layer.name}" have zero weight.`);
      }

      if (mode === "percentages" && Math.abs(total - 100) > 0.01) {
        throw new Error(
          `Percentages for "${layer.name}" must add up to 100%.\n\n` +
            `Current total: ${total.toFixed(2)}%`,
        );
      }
    }
  }

  let width = null;
  let height = null;

  for (const layer of state.layers) {
    for (const trait of layer.traits) {
      if (width === null) {
        width = trait.width;

        height = trait.height;
      }

      if (trait.width !== width || trait.height !== height) {
        throw new Error("All trait images must have identical dimensions.");
      }
    }
  }

  state.imageDimensions = {
    width,
    height,
  };

  return true;
}

/* ============================================================
   SUMMARY
   ============================================================ */

function updateSummary() {
  setText("summary-name", state.collection.name);

  setText("summary-count", state.collection.count);

  setText("summary-layers", state.layers.length);

  const traitCount = state.layers.reduce(
    (total, layer) => total + layer.traits.length,
    0,
  );

  setText("summary-traits", traitCount);
}

/* ============================================================
   TRAIT SELECTION
   ============================================================ */

function randomIndex(length) {
  return Math.floor(Math.random() * length);
}

function chooseRandomTrait(traits) {
  return traits[randomIndex(traits.length)];
}

function chooseWeightedTrait(traits) {
  const validTraits = traits.filter((trait) => Number(trait.weight) > 0);

  if (!validTraits.length) {
    return chooseRandomTrait(traits);
  }

  const total = validTraits.reduce(
    (sum, trait) => sum + Number(trait.weight),
    0,
  );

  let random = Math.random() * total;

  for (const trait of validTraits) {
    random -= Number(trait.weight);

    if (random <= 0) {
      return trait;
    }
  }

  return validTraits[validTraits.length - 1];
}

function chooseTrait(layer, mode) {
  if (mode === "random") {
    return chooseRandomTrait(layer.traits);
  }

  return chooseWeightedTrait(layer.traits);
}

/* ============================================================
   RARITY
   ============================================================ */

function getRarityLabels() {
  const input = $("rarity-names");

  const labels = cleanText(input?.value);

  if (!labels) {
    return ["Common", "Uncommon", "Rare", "Epic", "Legendary"];
  }

  return labels.split(",").map(cleanText).filter(Boolean);
}

function calculateRarity(selectedTraits) {
  if (!selectedTraits.length) {
    return "Common";
  }

  const labels = getRarityLabels();

  if (labels.length === 1) {
    return labels[0];
  }

  const averageWeight =
    selectedTraits.reduce((sum, trait) => sum + Number(trait.weight || 1), 0) /
    selectedTraits.length;

  if (averageWeight <= 1) {
    return labels[labels.length - 1];
  }

  if (averageWeight <= 5) {
    return labels[Math.min(labels.length - 2, 3)];
  }

  if (averageWeight <= 15) {
    return labels[Math.min(labels.length - 3, 2)];
  }

  if (averageWeight <= 35) {
    return labels[Math.min(labels.length - 4, 1)];
  }

  return labels[0];
}

/* ============================================================
   DUPLICATE COMBINATION
   ============================================================ */

function createCombinationKey(selections) {
  return selections.map((item) => `${item.layerId}:${item.traitId}`).join("|");
}

/* ============================================================
   CANVAS
   ============================================================ */

async function composeNFT(selections) {
  if (!state.imageDimensions.width || !state.imageDimensions.height) {
    throw new Error("NFT image dimensions are not available.");
  }

  const canvas = document.createElement("canvas");

  canvas.width = state.imageDimensions.width;

  canvas.height = state.imageDimensions.height;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Your browser does not support canvas generation.");
  }

  context.clearRect(0, 0, canvas.width, canvas.height);

  for (const selection of selections) {
    context.drawImage(selection.trait.image, 0, 0, canvas.width, canvas.height);
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Unable to create NFT image."));

        return;
      }

      resolve(blob);
    }, "image/png");
  });
}

/* ============================================================
   METADATA
   ============================================================ */
function buildImageURI(tokenNumber) {
  const base = cleanText(state.collection.imageBaseURI);

  const filename = `${tokenNumber}.png`;

  if (!base) {
    return `IPFS_URI_REQUIRED/${filename}`;
  }

  return base.replace(/\/+$/, "") + "/" + filename;
}

function buildMetadata(tokenNumber, selections) {
  const metadata = {
    name: `${state.collection.name} #${tokenNumber}`,

    description: state.collection.description,

    image: buildImageURI(tokenNumber),
  };

  if ($("include-attributes")?.checked !== false) {
    metadata.attributes = selections.map((selection) => ({
      trait_type: selection.layer.name,

      value: selection.trait.name,
    }));
  }

  if ($("include-rarity")?.checked !== false) {
    metadata.rarity = calculateRarity(
      selections.map((selection) => selection.trait),
    );
  }

  if (state.collection.website) {
    metadata.external_url = state.collection.website;
  }

  return metadata;
}

/* ============================================================
   GENERATE ONE NFT
   ============================================================ */

