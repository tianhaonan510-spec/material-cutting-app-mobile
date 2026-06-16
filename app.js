const STORAGE_KEY = "aluminum-cutting-app-v3";

const PRODUCTS = [
  { id: "window", label: "窗户", frame: "窗框料", sash: "窗扇料", mullion: "窗中挺料", note: "客厅窗" },
  { id: "door", label: "门", frame: "门框料", sash: "门扇料", mullion: "门中挺料", note: "入户门" },
  { id: "screenWindow", label: "纱窗", frame: "纱窗框料", sash: "纱网压线", mullion: "纱窗中挺料", note: "纱窗" },
  { id: "screenDoor", label: "纱门", frame: "纱门框料", sash: "纱门扇料", mullion: "纱门中挺料", note: "纱门" },
];

const PRODUCT_LABELS = Object.fromEntries(PRODUCTS.map((item) => [item.id, item.label]));

const MATERIAL_CATEGORIES = [
  { id: "frame", label: "框料" },
  { id: "mullion", label: "中挺/分隔" },
  { id: "sash", label: "扇/压线" },
  { id: "other", label: "其他" },
];

const emptyDesign = (productId = "window") => ({
  template: productId === "door" || productId === "screenDoor" ? "single" : "double",
  width: productId === "door" || productId === "screenDoor" ? 90 : 120,
  height: productId === "door" || productId === "screenDoor" ? 210 : 150,
  verticals: productId === "window" || productId === "screenWindow" ? 1 : 0,
  horizontals: 0,
  frameMaterialId: "",
  sashMaterialId: "",
  mullionMaterialId: "",
  note: PRODUCTS.find((item) => item.id === productId)?.note || "尺寸图",
  qty: 1,
  colWidths: [],
  rowHeights: [],
  cells: [],
});

const emptyProductData = (productId) => ({
  design: emptyDesign(productId),
  demands: [],
});

const state = {
  activeProduct: "window",
  materials: [],
  remnants: [],
  products: Object.fromEntries(PRODUCTS.map((item) => [item.id, emptyProductData(item.id)])),
  lastResult: null,
};

const els = {
  productTabs: document.querySelector("#productTabs"),
  materialsBody: document.querySelector("#materialsBody"),
  remnantsBody: document.querySelector("#remnantsBody"),
  purchaseBody: document.querySelector("#purchaseBody"),
  totalPurchaseBody: document.querySelector("#totalPurchaseBody"),
  designOrdersBody: document.querySelector("#designOrdersBody"),
  designOrdersTitle: document.querySelector("#designOrdersTitle"),
  summary: document.querySelector("#summary"),
  results: document.querySelector("#results"),
  saveResultBtn: document.querySelector("#saveResultBtn"),
  designerTitle: document.querySelector("#designerTitle"),
  ordersTitle: document.querySelector("#ordersTitle"),
  resultTitle: document.querySelector("#resultTitle"),
  dashCost: document.querySelector("#dashCost"),
  dashBars: document.querySelector("#dashBars"),
  dashReusable: document.querySelector("#dashReusable"),
  dashWaste: document.querySelector("#dashWaste"),
  dashUtilization: document.querySelector("#dashUtilization"),
  designTemplate: document.querySelector("#designTemplate"),
  designWidth: document.querySelector("#designWidth"),
  designHeight: document.querySelector("#designHeight"),
  designVerticals: document.querySelector("#designVerticals"),
  designHorizontals: document.querySelector("#designHorizontals"),
  designFrameMaterial: document.querySelector("#designFrameMaterial"),
  designSashMaterial: document.querySelector("#designSashMaterial"),
  designMullionMaterial: document.querySelector("#designMullionMaterial"),
  designNote: document.querySelector("#designNote"),
  designQty: document.querySelector("#designQty"),
  windowDrawing: document.querySelector("#windowDrawing"),
  designBreakdown: document.querySelector("#designBreakdown"),
  dimensionEditor: document.querySelector("#dimensionEditor"),
};

const uid = () => globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
const num = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const round = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

const templateSettings = {
  single: { verticals: 0, horizontals: 0 },
  double: { verticals: 1, horizontals: 0 },
  triple: { verticals: 2, horizontals: 0 },
  topBottom: { verticals: 0, horizontals: 1 },
  grid4: { verticals: 1, horizontals: 1 },
};

function activeData() {
  return state.products[state.activeProduct];
}

function activeDesign() {
  return activeData().design;
}

function sampleData() {
  const materials = [];
  const products = Object.fromEntries(PRODUCTS.map((product) => {
    const frame = { id: uid(), name: product.frame, productType: product.id, category: "frame", stockLength: 500, price: product.id.includes("screen") ? 68 : 128, kerf: 1, reuseMin: 70 };
    const sash = { id: uid(), name: product.sash, productType: product.id, category: "sash", stockLength: 500, price: product.id.includes("screen") ? 42 : 116, kerf: 1, reuseMin: 60 };
    const mullion = { id: uid(), name: product.mullion, productType: product.id, category: "mullion", stockLength: 500, price: product.id.includes("screen") ? 38 : 98, kerf: 1, reuseMin: 60 };
    materials.push(frame, sash, mullion);

    const design = emptyDesign(product.id);
    design.frameMaterialId = frame.id;
    design.sashMaterialId = sash.id;
    design.mullionMaterialId = mullion.id;
    design.note = product.note;
    return [product.id, { design, demands: [] }];
  }));

  products.window.demands = [
    { id: uid(), materialId: products.window.design.frameMaterialId, length: 150, qty: 2, note: "客厅窗 外框竖料" },
    { id: uid(), materialId: products.window.design.frameMaterialId, length: 120, qty: 2, note: "客厅窗 外框横料" },
    { id: uid(), materialId: products.window.design.mullionMaterialId, length: 150, qty: 1, note: "客厅窗 竖向中挺" },
  ];

  products.door.demands = [
    { id: uid(), materialId: products.door.design.frameMaterialId, length: 210, qty: 2, note: "入户门 门框竖料" },
    { id: uid(), materialId: products.door.design.frameMaterialId, length: 90, qty: 2, note: "入户门 门框横料" },
  ];

  return {
    activeProduct: "window",
    materials,
    remnants: [
      { id: uid(), materialId: materials[0].id, length: 126, note: "上次窗框余料" },
      { id: uid(), materialId: materials[1].id, length: 92, note: "上次窗扇余料" },
      { id: uid(), materialId: materials[6].id, length: 160, note: "纱窗框余料" },
    ],
    products,
  };
}

function loadSample() {
  const data = sampleData();
  Object.assign(state, data, { lastResult: null });
  persist();
  render();
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    activeProduct: state.activeProduct,
    materials: state.materials,
    remnants: state.remnants,
    products: state.products,
  }));
}

function restore() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    loadSample();
    return;
  }
  try {
    const data = JSON.parse(raw);
    state.activeProduct = data.activeProduct || "window";
    state.materials = Array.isArray(data.materials) ? data.materials : [];
    state.remnants = Array.isArray(data.remnants) ? data.remnants : [];
    PRODUCTS.forEach((product) => {
      state.products[product.id] = {
        ...emptyProductData(product.id),
        ...(data.products?.[product.id] || {}),
      };
      state.products[product.id].design = {
        ...emptyDesign(product.id),
        ...(data.products?.[product.id]?.design || {}),
      };
      state.products[product.id].demands = Array.isArray(data.products?.[product.id]?.demands)
        ? data.products[product.id].demands
        : [];
    });
  } catch {
    loadSample();
  }
}

function productTypeOptions(selected) {
  const options = [{ id: "all", label: "全部" }].concat(PRODUCTS);
  return options.map((item) => `<option value="${item.id}" ${item.id === selected ? "selected" : ""}>${item.label}</option>`).join("");
}

function materialCategoryLabel(category, productId = state.activeProduct) {
  const product = PRODUCTS.find((item) => item.id === productId);
  if (category === "frame") return product?.frame || "框料";
  if (category === "mullion") return product?.mullion || "中挺/分隔";
  if (category === "sash") return product?.sash || "扇/压线";
  return MATERIAL_CATEGORIES.find((item) => item.id === category)?.label || "其他";
}

function materialCategoryOptions(selected, productId = state.activeProduct) {
  return MATERIAL_CATEGORIES.map((item) => `<option value="${item.id}" ${item.id === selected ? "selected" : ""}>${materialCategoryLabel(item.id, productId)}</option>`).join("");
}

function materialDisplayName(material, productId = state.activeProduct) {
  if (!material) return "材料";
  return materialCategoryLabel(materialCategory(material), material.productType || productId);
}

function materialMatchesProduct(material, productId = state.activeProduct) {
  return !material.productType || material.productType === "all" || material.productType === productId;
}

function materialMatchesCategory(material, category = "") {
  return !category || materialCategory(material) === category;
}

function materialCategory(material) {
  if (material.category) return material.category;
  const name = String(material.name || "");
  if (/中挺|分隔|中梃/.test(name)) return "mullion";
  if (/扇|压线|网/.test(name)) return "sash";
  if (/框|边框|主框/.test(name)) return "frame";
  return "other";
}

function materialOptions(selectedId, includeEmpty = false, productId = state.activeProduct, category = "") {
  const empty = includeEmpty ? `<option value="">不生成</option>` : "";
  const materials = state.materials.filter((material) => (
    materialMatchesProduct(material, productId) && materialMatchesCategory(material, category)
  ));
  return empty + materials.map((material) => {
    const selected = material.id === selectedId ? "selected" : "";
    return `<option value="${material.id}" ${selected}>${escapeHtml(materialDisplayName(material, productId))}</option>`;
  }).join("");
}

function render() {
  ensureDesignMaterials();
  renderTabs();
  renderTotalPurchaseOrder();
  renderDashboard();
  renderMode();
  if (state.activeProduct !== "total") {
    renderRows("material");
    renderRows("remnant");
    renderDesigner();
    renderDesignOrders();
    renderPurchaseOrder();
    renderResult(state.lastResult);
  }
  els.saveResultBtn.disabled = !state.lastResult;
}

function renderTabs() {
  const totalReady = PRODUCTS.every((product) => state.products[product.id].demands.length > 0);
  if (state.activeProduct === "total" && !totalReady) state.activeProduct = "window";
  const productButtons = PRODUCTS.map((product) => {
    const demands = state.products[product.id].demands.length;
    const active = product.id === state.activeProduct ? "active" : "";
    return `<button class="${active}" data-product="${product.id}">${product.label}<span>${demands}</span></button>`;
  }).join("");
  const activeTotal = state.activeProduct === "total" ? "active" : "";
  const disabledTotal = totalReady ? "" : "disabled";
  els.productTabs.innerHTML = `${productButtons}<button class="${activeTotal}" data-product="total" ${disabledTotal}>总采购清单<span>${totalReady ? "OK" : "未全"}</span></button>`;
  els.productTabs.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      if (button.disabled) return;
      state.activeProduct = button.dataset.product;
      state.lastResult = null;
      persist();
      render();
    });
  });
}

function renderMode() {
  const isTotal = state.activeProduct === "total";
  document.querySelectorAll(".product-only").forEach((section) => {
    section.hidden = isTotal;
  });
  document.querySelectorAll(".total-only").forEach((section) => {
    section.hidden = !isTotal;
  });
}

function renderRows(type) {
  const config = {
    material: { body: els.materialsBody, list: visibleMaterials(), template: "#materialRowTemplate" },
    remnant: { body: els.remnantsBody, list: visibleRemnants(), template: "#remnantRowTemplate" },
  }[type];
  if (!config) return;
  config.body.innerHTML = "";

  config.list.forEach((item) => {
    const row = document.querySelector(config.template).content.firstElementChild.cloneNode(true);
    row.dataset.id = item.id;
    row.querySelectorAll("[data-field]").forEach((field) => {
      const key = field.dataset.field;
      if (key === "productType") field.innerHTML = productTypeOptions(item[key] || "all");
      if (key === "category") field.innerHTML = materialCategoryOptions(materialCategory(item), item.productType || state.activeProduct);
      if (field.tagName === "SELECT" && key === "materialId") field.innerHTML = materialOptions(item[key]);
      field.value = key === "category" ? materialCategory(item) : item[key] ?? "";
    });
    row.querySelector("[data-action='delete']").addEventListener("click", () => deleteRow(type, item.id));
    row.querySelectorAll("[data-field]").forEach((field) => {
      field.addEventListener("input", () => updateRow(type, item.id, field.dataset.field, field.value));
      field.addEventListener("change", () => updateRow(type, item.id, field.dataset.field, field.value));
    });
    config.body.appendChild(row);
  });
}

function renderPurchaseOrder() {
  const result = optimizeForDemands(activeData().demands, false);
  if (!result || !result.groups.some((group) => group.newBars > 0)) {
    els.purchaseBody.innerHTML = `<tr><td colspan="5" class="muted">上方尺寸图生成用料后，这里会显示需要向商店采购的整料。</td></tr>`;
    return;
  }

  els.purchaseBody.innerHTML = result.groups
    .filter((group) => group.newBars > 0)
    .map((group) => `
      <tr>
        <td>${escapeHtml(materialDisplayName(group.material))}</td>
        <td>${round(group.material.stockLength)}</td>
        <td>${group.newBars}</td>
        <td>${round(group.material.price)}</td>
        <td>${round(group.cost)}</td>
      </tr>
    `).join("");
}

function renderTotalPurchaseOrder() {
  if (!els.totalPurchaseBody) return;
  const result = optimizeForDemands(allDemands(), false);
  if (!result || !result.groups.some((group) => group.newBars > 0)) {
    els.totalPurchaseBody.innerHTML = `<tr><td colspan="7" class="muted">各页面生成采购订单后，这里会汇总显示最终向商店下单的整料清单。</td></tr>`;
    return;
  }

  els.totalPurchaseBody.innerHTML = result.groups
    .filter((group) => group.newBars > 0)
    .map((group) => {
      const categoryLabel = materialCategoryLabel(materialCategory(group.material), group.material.productType || state.activeProduct);
      return `
        <tr>
          <td>${escapeHtml(materialDisplayName(group.material))}</td>
          <td>${escapeHtml(categoryLabel)}</td>
          <td>${round(group.material.stockLength)}</td>
          <td><strong>${group.newBars}</strong></td>
          <td>${round(group.material.price)}</td>
          <td>${round(group.cost)}</td>
          <td>${renderMaterialSources(group.material.id)}</td>
        </tr>
      `;
    }).join("");
}

function renderMaterialSources(materialId) {
  const sources = PRODUCTS.map((product) => {
    const demands = state.products[product.id].demands.filter((demand) => demand.materialId === materialId);
    const qty = demands.reduce((sum, demand) => sum + Math.floor(num(demand.qty, 1)), 0);
    return qty > 0 ? `${product.label} ${qty}件` : "";
  }).filter(Boolean);
  return sources.length ? sources.map((item) => `<span class="source-chip">${escapeHtml(item)}</span>`).join("") : "-";
}

function renderDesignOrders() {
  if (!els.designOrdersBody) return;
  const product = PRODUCTS.find((item) => item.id === state.activeProduct);
  els.designOrdersTitle.textContent = `4. ${product.label}订单项目`;
  const batches = designBatches();
  if (!batches.length) {
    els.designOrdersBody.innerHTML = `<tr><td colspan="5" class="muted">还没有订单项目。设置尺寸和数量后，点击“生成本页采购订单”即可添加。</td></tr>`;
    return;
  }

  els.designOrdersBody.innerHTML = batches.map((batch) => `
    <tr>
      <td>${escapeHtml(batch.label)}</td>
      <td>${batch.qty}</td>
      <td>${batch.items.length}</td>
      <td>${round(batch.requiredLength)}</td>
      <td><button class="icon danger" data-delete-batch="${escapeHtml(batch.id)}">删除</button></td>
    </tr>
  `).join("");

  els.designOrdersBody.querySelectorAll("[data-delete-batch]").forEach((button) => {
    button.addEventListener("click", () => deleteDesignBatch(button.dataset.deleteBatch));
  });
}

function designBatches() {
  const map = new Map();
  activeData().demands
    .filter((demand) => demand.source === "design")
    .forEach((demand) => {
      const id = demand.batchId || "legacy";
      if (!map.has(id)) {
        map.set(id, {
          id,
          label: demand.batchLabel || "旧订单项目",
          qty: batchQty(demand.batchLabel),
          items: [],
          requiredLength: 0,
        });
      }
      const batch = map.get(id);
      batch.items.push(demand);
      batch.requiredLength += num(demand.length) * Math.floor(num(demand.qty, 1));
    });
  return Array.from(map.values());
}

function batchQty(label) {
  const match = String(label || "").match(/x(\d+)$/);
  return match ? Number(match[1]) : 1;
}

function deleteDesignBatch(batchId) {
  activeData().demands = activeData().demands.filter((demand) => {
    const id = demand.batchId || "legacy";
    return id !== batchId;
  });
  state.lastResult = null;
  persist();
  render();
}

function visibleMaterials() {
  return state.materials.filter((material) => materialMatchesProduct(material));
}

function visibleRemnants() {
  return state.remnants.filter((remnant) => {
    const material = findMaterial(remnant.materialId);
    return material && materialMatchesProduct(material);
  });
}

function updateRow(type, id, field, value) {
  const list = type === "material" ? state.materials : type === "remnant" ? state.remnants : activeData().demands;
  const item = list.find((entry) => entry.id === id);
  if (!item) return;

  if (["stockLength", "price", "kerf", "reuseMin", "length"].includes(field)) {
    item[field] = num(value);
  } else if (field === "qty") {
    item[field] = Math.max(1, Math.floor(num(value, 1)));
  } else {
    item[field] = value;
  }

  state.lastResult = null;
  persist();
  if (type === "material") {
    ensureDesignMaterials();
    if (field === "productType") renderRows("material");
    renderRows("remnant");
    renderPurchaseOrder();
    renderTotalPurchaseOrder();
    renderDesignOrders();
    renderDesigner();
  }
  renderDashboard();
  renderTotalPurchaseOrder();
  renderDesignOrders();
  renderResult(null);
  els.saveResultBtn.disabled = true;
}

function deleteRow(type, id) {
  if (type === "material") {
    state.materials = state.materials.filter((item) => item.id !== id);
    state.remnants = state.remnants.filter((item) => item.materialId !== id);
    PRODUCTS.forEach((product) => {
      state.products[product.id].demands = state.products[product.id].demands.filter((item) => item.materialId !== id);
    });
  } else if (type === "remnant") {
    state.remnants = state.remnants.filter((item) => item.id !== id);
  } else {
    activeData().demands = activeData().demands.filter((item) => item.id !== id);
  }
  state.lastResult = null;
  persist();
  render();
}

function addMaterial() {
  state.materials.push({
    id: uid(),
    productType: state.activeProduct,
    category: "frame",
    name: materialCategoryLabel("frame", state.activeProduct),
    stockLength: 500,
    price: 0,
    kerf: 1,
    reuseMin: 70,
  });
  persist();
  render();
}

function addRemnant() {
  if (!state.materials.length) addMaterial();
  const material = state.materials.find((item) => materialMatchesProduct(item) && materialMatchesCategory(item, "frame"))
    || state.materials.find((item) => materialMatchesProduct(item))
    || state.materials[0];
  state.remnants.push({ id: uid(), materialId: material.id, length: 100, note: "" });
  persist();
  render();
}

function addDemand() {
  if (!state.materials.length) addMaterial();
  const material = state.materials.find((item) => materialMatchesProduct(item) && materialMatchesCategory(item, "frame"))
    || state.materials.find((item) => materialMatchesProduct(item))
    || state.materials[0];
  activeData().demands.push({ id: uid(), materialId: material.id, length: 100, qty: 1, note: "" });
  persist();
  render();
}

function ensureDesignMaterials() {
  PRODUCTS.forEach((product) => {
    const design = state.products[product.id].design;
    const candidates = state.materials.filter((material) => materialMatchesProduct(material, product.id));
    const valid = (id, category) => state.materials.some((material) => (
      material.id === id
      && materialMatchesProduct(material, product.id)
      && materialMatchesCategory(material, category)
    ));
    const pick = (category) => candidates.find((material) => materialCategory(material) === category)?.id || "";
    if (!valid(design.frameMaterialId, "frame")) design.frameMaterialId = pick("frame");
    if (!valid(design.sashMaterialId, "sash")) design.sashMaterialId = pick("sash");
    if (!valid(design.mullionMaterialId, "mullion")) design.mullionMaterialId = pick("mullion");
  });
}

function renderDesigner() {
  const product = PRODUCTS.find((item) => item.id === state.activeProduct);
  const design = activeDesign();
  normalizeDesignGrid(design);
  els.designerTitle.textContent = `3. ${product.label}尺寸图设计`;
  els.ordersTitle.textContent = `5. ${product.label}采购订单`;
  els.resultTitle.textContent = `6. ${product.label}优化结果`;
  els.designTemplate.value = design.template;
  els.designWidth.value = design.width;
  els.designHeight.value = design.height;
  els.designVerticals.value = design.verticals;
  els.designHorizontals.value = design.horizontals;
  els.designNote.value = design.note || "";
  els.designQty.value = Math.max(1, Math.floor(num(design.qty, 1)));
  els.designFrameMaterial.innerHTML = materialOptions(design.frameMaterialId, true, state.activeProduct, "frame");
  els.designSashMaterial.innerHTML = materialOptions(design.sashMaterialId, true, state.activeProduct, "sash");
  els.designSashMaterial.disabled = true;
  els.designSashMaterial.title = "This material is not used by the current frame/mullion cutting rule.";
  els.designMullionMaterial.innerHTML = materialOptions(design.mullionMaterialId, true, state.activeProduct, "mullion");
  els.windowDrawing.innerHTML = drawWindowSvg();
  els.dimensionEditor.innerHTML = renderDimensionEditor();
  bindDimensionEditor();
  els.designBreakdown.innerHTML = renderDesignBreakdown();
}

function updateDesign(field, value) {
  const design = activeDesign();
  if (field === "template") {
    design.template = value;
    if (templateSettings[value]) {
      design.verticals = templateSettings[value].verticals;
      design.horizontals = templateSettings[value].horizontals;
    }
  } else if (["width", "height"].includes(field)) {
    design[field] = Math.max(1, num(value, 1));
    resizePartsToTotal(design, field === "width" ? "colWidths" : "rowHeights", design[field]);
  } else if (["verticals", "horizontals"].includes(field)) {
    design.template = "custom";
    design[field] = Math.max(0, Math.floor(num(value, 0)));
    normalizeDesignGrid(design);
  } else if (field === "qty") {
    design.qty = Math.max(1, Math.floor(num(value, 1)));
  } else {
    design[field] = value;
  }
  refreshDesignDemands();
  state.lastResult = null;
  persist();
  renderDesigner();
  renderDesignOrders();
  renderPurchaseOrder();
  renderTotalPurchaseOrder();
  renderDashboard();
  renderResult(null);
  els.saveResultBtn.disabled = true;
}

function gridSize(design = activeDesign()) {
  return {
    cols: Math.max(1, Math.floor(num(design.verticals)) + 1),
    rows: Math.max(1, Math.floor(num(design.horizontals)) + 1),
  };
}

function normalizeDesignGrid(design = activeDesign()) {
  const { cols, rows } = gridSize(design);
  design.colWidths = normalizeParts(design.colWidths, cols, num(design.width, 1));
  design.rowHeights = normalizeParts(design.rowHeights, rows, num(design.height, 1));
  const oldCells = Array.isArray(design.cells) ? design.cells : [];
  design.cells = Array.from({ length: rows }, (_, rowIndex) => (
    Array.from({ length: cols }, (_, colIndex) => oldCells[rowIndex]?.[colIndex] !== false)
  ));
}

function normalizeParts(parts, count, total) {
  const values = Array.isArray(parts) ? parts.map((item) => Math.max(0.1, num(item, 0))) : [];
  if (values.length === count && values.every((item) => item > 0)) return values.map(round);
  return equalParts(total, count);
}

function equalParts(total, count) {
  const base = round(num(total, 1) / Math.max(1, count));
  const values = Array.from({ length: Math.max(1, count) }, () => base);
  values[values.length - 1] = round(num(total, 1) - values.slice(0, -1).reduce((sum, item) => sum + item, 0));
  return values;
}

function resizePartsToTotal(design, key, total) {
  const parts = design[key];
  const sum = parts.reduce((acc, item) => acc + num(item), 0);
  if (!sum) {
    design[key] = equalParts(total, parts.length || 1);
    return;
  }
  design[key] = parts.map((item) => round((num(item) / sum) * total));
  design[key][design[key].length - 1] = round(total - design[key].slice(0, -1).reduce((acc, item) => acc + item, 0));
}

function renderDimensionEditor() {
  const design = activeDesign();
  normalizeDesignGrid(design);
  return `
    <div class="editor-title">
      <strong>分格尺寸与形状</strong>
      <button type="button" class="secondary mini" id="resetGridBtn">均分尺寸</button>
    </div>
    <div class="size-list">
      <div>
        <span>列宽 cm</span>
        ${design.colWidths.map((value, index) => `<input data-grid="col" data-index="${index}" type="number" min="0.1" step="0.1" value="${value}" />`).join("")}
      </div>
      <div>
        <span>行高 cm</span>
        ${design.rowHeights.map((value, index) => `<input data-grid="row" data-index="${index}" type="number" min="0.1" step="0.1" value="${value}" />`).join("")}
      </div>
    </div>
    <div class="cell-editor" style="grid-template-columns: repeat(${design.colWidths.length}, minmax(42px, 1fr));">
      ${design.cells.flatMap((row, rowIndex) => row.map((enabled, colIndex) => `
        <label class="cell-toggle ${enabled ? "on" : ""}">
          <input type="checkbox" data-cell-row="${rowIndex}" data-cell-col="${colIndex}" ${enabled ? "checked" : ""} />
          ${rowIndex + 1}-${colIndex + 1}
        </label>
      `)).join("")}
    </div>
    <p class="muted editor-help">关闭小格可做简单异形或空缺；分隔/中挺料会按启用小格生成。</p>
  `;
}

function bindDimensionEditor() {
  els.dimensionEditor.querySelectorAll("[data-grid]").forEach((input) => {
    input.addEventListener("change", () => {
      const design = activeDesign();
      const key = input.dataset.grid === "col" ? "colWidths" : "rowHeights";
      design[key][Number(input.dataset.index)] = Math.max(0.1, num(input.value, 0.1));
      design.width = round(design.colWidths.reduce((sum, item) => sum + num(item), 0));
      design.height = round(design.rowHeights.reduce((sum, item) => sum + num(item), 0));
      refreshDesignDemands();
      state.lastResult = null;
      persist();
      renderDesigner();
      renderPurchaseOrder();
      renderDashboard();
      renderResult(null);
    });
  });

  els.dimensionEditor.querySelectorAll("[data-cell-row]").forEach((input) => {
    input.addEventListener("change", () => {
      const design = activeDesign();
      design.cells[Number(input.dataset.cellRow)][Number(input.dataset.cellCol)] = input.checked;
      refreshDesignDemands();
      state.lastResult = null;
      persist();
      renderDesigner();
      renderPurchaseOrder();
      renderDashboard();
      renderResult(null);
    });
  });

  els.dimensionEditor.querySelector("#resetGridBtn")?.addEventListener("click", () => {
    const design = activeDesign();
    const { cols, rows } = gridSize(design);
    design.colWidths = equalParts(design.width, cols);
    design.rowHeights = equalParts(design.height, rows);
    refreshDesignDemands();
    state.lastResult = null;
    persist();
    renderDesigner();
    renderPurchaseOrder();
    renderDashboard();
    renderResult(null);
  });
}

function drawWindowSvg(showCellIds = false) {
  const design = activeDesign();
  normalizeDesignGrid(design);
  const width = Math.max(1, design.colWidths.reduce((sum, item) => sum + num(item), 0));
  const height = Math.max(1, design.rowHeights.reduce((sum, item) => sum + num(item), 0));
  const viewW = 520;
  const viewH = 340;
  const margin = 56;
  const scale = Math.min((viewW - margin * 2) / width, (viewH - margin * 2) / height);
  const w = width * scale;
  const h = height * scale;
  const x = (viewW - w) / 2;
  const y = (viewH - h) / 2;
  const colPixels = design.colWidths.map((item) => item * scale);
  const rowPixels = design.rowHeights.map((item) => item * scale);
  const colStarts = cumulativeStarts(colPixels, x);
  const rowStarts = cumulativeStarts(rowPixels, y);
  const cells = [];
  const dims = [];

  design.cells.forEach((row, rowIndex) => {
    row.forEach((enabled, colIndex) => {
      const cx = colStarts[colIndex];
      const cy = rowStarts[rowIndex];
      const cw = colPixels[colIndex];
      const ch = rowPixels[rowIndex];
      cells.push(`<rect x="${cx}" y="${cy}" width="${cw}" height="${ch}" class="${enabled ? "glass" : "void-cell"}" />`);
      if (enabled) {
        if (showCellIds) {
          cells.push(`<text x="${cx + cw / 2}" y="${cy + ch / 2 - 20}" text-anchor="middle" class="cell-id">${rowIndex + 1}-${colIndex + 1}</text>`);
        }
        cells.push(`<text x="${cx + cw / 2}" y="${cy + ch / 2 - 4}" text-anchor="middle" class="cell-dim">${round(design.colWidths[colIndex])}</text>`);
        cells.push(`<text x="${cx + cw / 2}" y="${cy + ch / 2 + 13}" text-anchor="middle" class="cell-dim">x ${round(design.rowHeights[rowIndex])}</text>`);
      }
    });
  });

  design.colWidths.forEach((value, index) => {
    dims.push(`<text x="${colStarts[index] + colPixels[index] / 2}" y="${y + h + 24}" text-anchor="middle" class="dim">${round(value)} cm</text>`);
  });
  design.rowHeights.forEach((value, index) => {
    dims.push(`<text x="${x - 28}" y="${rowStarts[index] + rowPixels[index] / 2}" text-anchor="middle" class="dim rotate">${round(value)} cm</text>`);
  });

  const separators = [];
  for (let i = 1; i < colStarts.length; i += 1) {
    separators.push(`<line x1="${colStarts[i]}" y1="${y}" x2="${colStarts[i]}" y2="${y + h}" class="mullion" />`);
  }
  for (let i = 1; i < rowStarts.length; i += 1) {
    separators.push(`<line x1="${x}" y1="${rowStarts[i]}" x2="${x + w}" y2="${rowStarts[i]}" class="mullion" />`);
  }

  return `
    <svg viewBox="0 0 ${viewW} ${viewH}" role="img" aria-label="门窗尺寸示意图">
      ${cells.join("")}
      <rect x="${x}" y="${y}" width="${w}" height="${h}" class="frame" />
      ${separators.join("")}
      ${dims.join("")}
      <text x="${viewW / 2}" y="${viewH - 10}" text-anchor="middle" class="dim">总宽 ${round(width)} cm</text>
      <text x="${x + w + 30}" y="${y + h / 2}" text-anchor="middle" class="dim rotate">总高 ${round(height)} cm</text>
    </svg>
  `;
}

function cumulativeStarts(values, start) {
  const starts = [];
  values.reduce((acc, value) => {
    starts.push(acc);
    return acc + value;
  }, start);
  return starts;
}

function designPieces() {
  const design = activeDesign();
  const product = PRODUCTS.find((item) => item.id === state.activeProduct);
  normalizeDesignGrid(design);
  const width = round(design.colWidths.reduce((sum, item) => sum + num(item), 0));
  const height = round(design.rowHeights.reduce((sum, item) => sum + num(item), 0));
  const note = design.note || product.label;
  const pieces = [];

  if (design.frameMaterialId) {
    pieces.push({ materialId: design.frameMaterialId, length: height, qty: 2, note: `${note} 主框竖料` });
    pieces.push({ materialId: design.frameMaterialId, length: width, qty: 2, note: `${note} 主框横料` });
  }
  if (design.mullionMaterialId) {
    for (let col = 1; col < design.colWidths.length; col += 1) {
      design.rowHeights.forEach((rowHeight, row) => {
        if (design.cells[row]?.[col - 1] || design.cells[row]?.[col]) {
          pieces.push({ materialId: design.mullionMaterialId, length: rowHeight, qty: 1, note: `${note} 竖向分隔料 R${row + 1}` });
        }
      });
    }
    for (let row = 1; row < design.rowHeights.length; row += 1) {
      design.colWidths.forEach((colWidth, col) => {
        if (design.cells[row - 1]?.[col] || design.cells[row]?.[col]) {
          pieces.push({ materialId: design.mullionMaterialId, length: colWidth, qty: 1, note: `${note} 横向分隔料 C${col + 1}` });
        }
      });
    }
  }
  const designQty = Math.max(1, Math.floor(num(design.qty, 1)));
  return combinePieces(pieces
    .filter((piece) => piece.length > 0 && piece.qty > 0)
    .map((piece) => ({ ...piece, qty: piece.qty * designQty })));
}

function combinePieces(pieces) {
  const map = new Map();
  pieces.forEach((piece) => {
    const key = `${piece.materialId}|${round(piece.length)}|${piece.note}`;
    const existing = map.get(key);
    if (existing) {
      existing.qty += piece.qty;
    } else {
      map.set(key, { ...piece, length: round(piece.length) });
    }
  });
  return Array.from(map.values());
}

function renderDesignBreakdown() {
  const pieces = designPieces();
  if (!pieces.length) return `<p class="muted">选择材料后，可以从尺寸图生成内部切割需求，再计算采购订单。</p>`;
  return `
    <h3>将生成的用料</h3>
    <ul>
      ${pieces.map((piece) => {
        const material = findMaterial(piece.materialId);
        return `<li>${escapeHtml(materialDisplayName(material))}：${round(piece.length)}cm x ${piece.qty}，${escapeHtml(piece.note)}</li>`;
      }).join("")}
    </ul>
  `;
}

function applyDesignToDemands() {
  if (!state.materials.length) {
    alert("请先添加材料。");
    return;
  }
  const pieces = designPieces();
  if (!pieces.length) {
    alert("当前尺寸图没有可生成的用料。");
    return;
  }
  appendDesignDemands(pieces);
  state.lastResult = null;
  persist();
  render();
}

function refreshDesignDemands() {
  return;
}

function appendDesignDemands(pieces) {
  const design = activeDesign();
  const batchId = uid();
  const batchLabel = `${design.note || PRODUCT_LABELS[state.activeProduct]} x${Math.max(1, Math.floor(num(design.qty, 1)))}`;
  const designDemands = pieces.map((piece) => ({ id: uid(), source: "design", batchId, batchLabel, ...piece }));
  activeData().demands = activeData().demands.concat(designDemands);
}

function demandSignature(demand) {
  return `${demand.materialId}|${round(num(demand.length))}|${Math.floor(num(demand.qty, 1))}|${demand.note || ""}`;
}

function allDemands() {
  return PRODUCTS.flatMap((product) => state.products[product.id].demands);
}

function optimizeCurrent() {
  optimizeForDemands(activeData().demands, true);
}

function optimizeForDemands(demands, showErrors = false) {
  const errors = validateInput(demands);
  if (errors.length) {
    if (showErrors) renderError(errors);
    return null;
  }

  const groups = state.materials.map((material) => {
    const materialDemands = demands.filter((demand) => demand.materialId === material.id);
    const remnants = state.remnants.filter((remnant) => remnant.materialId === material.id);
    return optimizeMaterial(material, materialDemands, remnants);
  }).filter((result) => result.pieces.length);

  const totals = groups.reduce((acc, group) => {
    acc.cost += group.cost;
    acc.newBars += group.newBars;
    acc.reusable += group.reusableLength;
    acc.waste += group.wasteLength;
    acc.required += group.requiredLength;
    acc.newStockLength += group.newBars * num(group.material.stockLength);
    return acc;
  }, { cost: 0, newBars: 0, reusable: 0, waste: 0, required: 0, newStockLength: 0 });

  return { groups, totals };
}

function renderDashboard() {
  const result = optimizeForDemands(allDemands(), false);
  if (!result) {
    els.dashCost.textContent = "待完善";
    els.dashBars.textContent = "-";
    els.dashReusable.textContent = "-";
    els.dashWaste.textContent = "-";
    els.dashUtilization.textContent = "-";
    return;
  }
  const utilization = result.totals.newStockLength
    ? `${round((result.totals.required / result.totals.newStockLength) * 100)}%`
    : "0%";
  els.dashCost.textContent = money(result.totals.cost);
  els.dashBars.textContent = `${result.totals.newBars} 根`;
  els.dashReusable.textContent = `${round(result.totals.reusable)} cm`;
  els.dashWaste.textContent = `${round(result.totals.waste)} cm`;
  els.dashUtilization.textContent = utilization;
}

function validateInput(demands) {
  const errors = [];
  if (!state.materials.length) errors.push("请至少添加一种材料。");
  if (!demands.length) errors.push("请先从尺寸图生成本页采购订单。");

  state.materials.forEach((material) => {
    const label = materialDisplayName(material);
    if (num(material.stockLength) <= 0) errors.push(`${label} 的整根长度必须大于 0。`);
    if (num(material.price) < 0) errors.push(`${label} 的单价不能小于 0。`);
    if (num(material.kerf) < 0) errors.push(`${label} 的切割损耗不能小于 0。`);
  });

  demands.forEach((demand) => {
    const material = findMaterial(demand.materialId);
    if (!material) errors.push("订单中存在已删除的材料。");
    if (num(demand.length) <= 0) errors.push("订单长度必须大于 0。");
    if (num(demand.qty) < 1) errors.push("订单数量必须大于等于 1。");
    if (material && num(demand.length) + num(material.kerf) > num(material.stockLength)) {
      errors.push(`${materialDisplayName(material)} 有一条 ${demand.length}cm 的需求，加上切割损耗后超过整根长度 ${material.stockLength}cm。`);
    }
  });

  state.remnants.forEach((remnant) => {
    if (!findMaterial(remnant.materialId)) errors.push("余料中存在已删除的材料。");
    if (num(remnant.length) < 0) errors.push("余料长度必须大于等于 0。");
  });

  return errors;
}

function optimizeMaterial(material, demands, remnants) {
  const pieces = [];
  demands.forEach((demand) => {
    for (let i = 0; i < Math.floor(num(demand.qty)); i += 1) {
      pieces.push({
        length: num(demand.length),
        note: demand.note || `${materialDisplayName(material)} ${demand.length}cm`,
      });
    }
  });

  pieces.sort((a, b) => b.length - a.length);

  const bins = remnants
    .filter((remnant) => num(remnant.length) > 0)
    .sort((a, b) => num(a.length) - num(b.length))
    .map((remnant) => ({
      id: remnant.id,
      source: "remnant",
      title: remnant.note || "旧余料",
      length: num(remnant.length),
      cuts: [],
      used: 0,
      kerfLoss: 0,
    }));

  pieces.forEach((piece) => {
    const target = findBestBin(bins, piece.length, num(material.kerf));
    if (target) {
      placeCut(target, piece, num(material.kerf));
      return;
    }

    const newBin = {
      id: uid(),
      source: "new",
      title: "新整料",
      length: num(material.stockLength),
      cuts: [],
      used: 0,
      kerfLoss: 0,
    };
    placeCut(newBin, piece, num(material.kerf));
    bins.push(newBin);
  });

  const usedBins = bins.filter((bin) => bin.cuts.length);
  const newBars = usedBins.filter((bin) => bin.source === "new").length;
  const requiredLength = pieces.reduce((sum, piece) => sum + piece.length, 0);
  const reusableLength = usedBins.reduce((sum, bin) => {
    const left = remaining(bin);
    return left >= num(material.reuseMin) ? sum + left : sum;
  }, 0);
  const wasteLength = usedBins.reduce((sum, bin) => {
    const left = remaining(bin);
    return left < num(material.reuseMin) ? sum + left : sum;
  }, 0);

  return {
    material,
    pieces,
    bins: usedBins,
    newBars,
    cost: newBars * num(material.price),
    requiredLength,
    reusableLength,
    wasteLength,
  };
}

function findBestBin(bins, pieceLength, kerf) {
  return bins
    .filter((bin) => remainingAfter(bin, pieceLength, kerf) >= -0.0001)
    .sort((a, b) => remainingAfter(a, pieceLength, kerf) - remainingAfter(b, pieceLength, kerf))[0];
}

function remainingAfter(bin, pieceLength, kerf) {
  return bin.length - bin.used - kerf - pieceLength;
}

function placeCut(bin, piece, kerf) {
  bin.cuts.push(piece);
  bin.kerfLoss = round(bin.kerfLoss + kerf);
  bin.used = round(bin.used + kerf + piece.length);
}

function remaining(bin) {
  return round(bin.length - bin.used);
}

function saveResultRemnants() {
  if (!state.lastResult) return;

  const usedRemnantIds = new Set();
  const nextRemnants = [];

  state.lastResult.groups.forEach((group) => {
    group.bins.forEach((bin) => {
      if (bin.source === "remnant") usedRemnantIds.add(bin.id);
      const left = remaining(bin);
      if (left >= num(group.material.reuseMin)) {
        nextRemnants.push({
          id: uid(),
          materialId: group.material.id,
          length: left,
          note: `${new Date().toLocaleDateString()} ${PRODUCT_LABELS[state.activeProduct]}余料`,
        });
      }
    });
  });

  state.remnants = state.remnants.filter((remnant) => !usedRemnantIds.has(remnant.id)).concat(nextRemnants);
  activeData().demands = [];
  state.lastResult = null;
  persist();
  render();
}

function findMaterial(id) {
  return state.materials.find((material) => material.id === id);
}

function renderError(errors) {
  els.summary.className = "summary empty";
  els.summary.innerHTML = `<div class="error">${errors.map(escapeHtml).join("<br>")}</div>`;
  els.results.innerHTML = "";
  els.saveResultBtn.disabled = true;
}

function renderResult(result) {
  if (!result) {
    els.summary.className = "summary empty";
    els.summary.textContent = "生成本页采购订单后，点击计算。";
    els.results.innerHTML = "";
    return;
  }

  els.summary.className = "summary";
  els.summary.innerHTML = `
    <div class="metric"><span>本页预计成本</span><strong>${money(result.totals.cost)}</strong></div>
    <div class="metric"><span>需要购买整料</span><strong>${result.totals.newBars} 根</strong></div>
    <div class="metric"><span>可复用余料</span><strong>${round(result.totals.reusable)} cm</strong></div>
    <div class="metric"><span>低于阈值废料</span><strong>${round(result.totals.waste)} cm</strong></div>
  `;

  els.results.innerHTML = renderResultDrawing() + result.groups.map(renderMaterialResult).join("");
}

function renderResultDrawing() {
  const pieces = designPieces();
  if (!pieces.length) return "";
  return `
    <section class="result-drawing">
      <h3>尺寸图下料对照</h3>
      <div class="result-drawing-body">${drawWindowSvg(true)}</div>
    </section>
  `;
}

function renderMaterialResult(group) {
  const utilization = group.newBars
    ? `${round((group.requiredLength / (group.newBars * num(group.material.stockLength))) * 100)}%`
    : "使用旧余料";

  return `
    <section class="material-result">
      <div class="material-head">
        <h3>${escapeHtml(materialDisplayName(group.material))}</h3>
        <p>采购 ${group.newBars} 根，成本 ${money(group.cost)}，用料 ${round(group.requiredLength)}cm，整料利用率 ${utilization}</p>
      </div>
      <div class="bars">
        ${group.bins.map((bin, index) => renderBar(group.material, bin, index)).join("")}
      </div>
    </section>
  `;
}

function renderBar(material, bin, index) {
  const left = remaining(bin);
  const reusable = left >= num(material.reuseMin);
  const sourceLabel = bin.source === "new" ? `新整料 ${index + 1}` : `旧余料 ${index + 1}`;
  return `
    <article class="bar-card">
      <h4>
        <span>${sourceLabel}</span>
        <span class="tag ${bin.source === "new" ? "" : "ok"}">${round(bin.length)}cm</span>
      </h4>
      <div class="muted">${escapeHtml(bin.title)}，切割损耗 ${round(bin.kerfLoss)}cm</div>
      ${renderCutPlan(material, bin)}
      <ol class="cut-list">
        ${bin.cuts.map((cut, index) => renderCutListItem(cut, index)).join("")}
      </ol>
      <p class="muted">剩余 ${left}cm <span class="tag ${reusable ? "ok" : "warn"}">${reusable ? "可复用" : "废料"}</span></p>
    </article>
  `;
}

function renderCutPlan(material, bin) {
  const kerf = num(material.kerf);
  const left = remaining(bin);
  const minVisible = 1.8;
  const widthPercent = (length) => Math.max(minVisible, (num(length) / num(bin.length, 1)) * 100);
  const parts = [];

  bin.cuts.forEach((cut, index) => {
    if (kerf > 0) {
      parts.push(`
        <span
          class="cut-segment kerf-segment"
          style="flex-basis: ${widthPercent(kerf)}%;"
          title="Kerf ${round(kerf)}cm"
        ></span>
      `);
    }
    const cutLabel = cutClassLabel(cut.note) || `#${index + 1}`;
    parts.push(`
      <span
        class="cut-segment piece-segment"
        style="flex-basis: ${widthPercent(cut.length)}%;"
        title="${escapeHtml(cut.note)} ${round(cut.length)}cm"
      >
        <strong>${round(cut.length)}</strong>
        <small>${escapeHtml(cutLabel)}</small>
      </span>
    `);
  });

  if (left > 0) {
    parts.push(`
      <span
        class="cut-segment leftover-segment"
        style="flex-basis: ${widthPercent(left)}%;"
        title="Left ${round(left)}cm"
      >
        <strong>${round(left)}</strong>
        <small>left</small>
      </span>
    `);
  }

  return `
    <div class="cut-plan" aria-label="Cut plan">
      <div class="cut-plan-scale">
        <span>0</span>
        <span>${round(bin.length)}cm</span>
      </div>
      <div class="cut-plan-bar">${parts.join("")}</div>
      <div class="cut-plan-index">
        ${bin.cuts.map((cut, index) => renderCutIndexChip(cut, index)).join("")}
      </div>
    </div>
  `;
}

function renderCutListItem(cut, index) {
  const label = cutClassLabel(cut.note);
  const labelHtml = label ? `<span class="cut-class-tag">${escapeHtml(label)}</span>` : "";
  return `<li><strong>${round(cut.length)}cm</strong> ${labelHtml} <span class="muted">${escapeHtml(cut.note)}</span></li>`;
}

function renderCutIndexChip(cut, index) {
  const label = cutClassLabel(cut.note) || "-";
  return `
    <span class="cut-index-chip" title="${escapeHtml(cut.note)}">
      <strong>#${index + 1}</strong>
      <span>${escapeHtml(label)}</span>
      <small>${round(cut.length)}cm</small>
    </span>
  `;
}

function cutClassLabel(note) {
  const text = String(note || "");
  return text.match(/\b\d+-\d+\b/)?.[0]
    || text.match(/\b[RC]\d+\b/)?.[0]
    || text.match(/主框[^\s]*/)?.[0]
    || text.match(/外框[^\s]*/)?.[0]
    || text.match(/门框[^\s]*/)?.[0]
    || "";
}

function money(value) {
  return `${round(value).toLocaleString("zh-CN")} 元`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

document.querySelector("#addMaterialBtn").addEventListener("click", addMaterial);
document.querySelector("#addRemnantBtn").addEventListener("click", addRemnant);
document.querySelector("#addDemandBtn")?.addEventListener("click", addDemand);
document.querySelector("#optimizeBtn").addEventListener("click", () => {
  refreshDesignDemands();
  persist();
  renderPurchaseOrder();
  renderTotalPurchaseOrder();
  renderDesignOrders();
  renderDashboard();
  state.lastResult = optimizeForDemands(activeData().demands, true);
  if (state.lastResult) {
    els.saveResultBtn.disabled = false;
    renderResult(state.lastResult);
  }
});
document.querySelector("#saveResultBtn").addEventListener("click", saveResultRemnants);
document.querySelector("#applyDesignBtn").addEventListener("click", applyDesignToDemands);
document.querySelector("#loadSampleBtn").addEventListener("click", loadSample);
document.querySelector("#resetBtn").addEventListener("click", resetProjectData);
document.querySelector("#resetAllBtn").addEventListener("click", resetAllData);

function resetAllData() {
  if (!confirm("确定清空所有材料、余料和订单吗？")) return;
  Object.assign(state, {
    activeProduct: "window",
    materials: [],
    remnants: [],
    products: Object.fromEntries(PRODUCTS.map((item) => [item.id, emptyProductData(item.id)])),
    lastResult: null,
  });
  persist();
  render();
}

function resetProjectData() {
  if (!confirm("确定新建项目吗？材料设置会保留，余料库存、尺寸图和订单会清空。")) return;
  Object.assign(state, {
    activeProduct: "window",
    remnants: [],
    products: Object.fromEntries(PRODUCTS.map((item) => [item.id, emptyProductData(item.id)])),
    lastResult: null,
  });
  persist();
  render();
}

[
  ["designTemplate", "template"],
  ["designWidth", "width"],
  ["designHeight", "height"],
  ["designVerticals", "verticals"],
  ["designHorizontals", "horizontals"],
  ["designFrameMaterial", "frameMaterialId"],
  ["designSashMaterial", "sashMaterialId"],
  ["designMullionMaterial", "mullionMaterialId"],
  ["designNote", "note"],
  ["designQty", "qty"],
].forEach(([id, field]) => {
  document.querySelector(`#${id}`).addEventListener("input", (event) => updateDesign(field, event.target.value));
  document.querySelector(`#${id}`).addEventListener("change", (event) => updateDesign(field, event.target.value));
});

restore();
render();
