const state = {
  template: "calendar",
  size: "story",
  month: "",
  weekdayTimes: ["18:00"],
  weekendTimes: ["10:00", "13:00", "17:00"],
  cutoff: 15,
  excludes: [],
  extras: [],
  notes: [],
  slots: [],
  title: "",
  titleFormat: "yearMonth",
  subtitle: "預約請私訊｜每月 15 號後不接客",
  brand: "@xiang.nail",
  accent: "#df685f",
  titleColor: "#24211f",
  contentColor: "#5f5750",
  statusTextTone: "soft",
  titleX: 11,
  titleY: 11,
  titleSize: 1,
  subtitleX: 11,
  subtitleY: 16,
  noteX: 50,
  noteY: 85,
  noteSize: 1,
  showFrame: false,
  showGrid: false,
  dateFrameStyle: "none",
  lineGap: 1,
  calendarContentScale: 1,
  cardsAlign: "right",
  backgroundOpacity: 1,
  backgroundDataUrl: "",
  backgroundImage: null,
};
let loadedSavedState = false;
let backgroundLoadToken = 0;
const selectedExtraTimes = new Set();

const els = {};
const weekdayNames = ["日", "一", "二", "三", "四", "五", "六"];
const englishMonths = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const sizes = {
  story: [1080, 1920],
};

document.addEventListener("DOMContentLoaded", () => {
  bindElements();
  loadState();
  hydrateInputs();
  bindEvents();
  bindPanelTabs();
  if (!state.slots.length) generateSlots();
  render();
  registerServiceWorker();
});

function bindElements() {
  [
    "yearInput",
    "monthSelectInput",
    "weekdayTimesInput",
    "weekendTimesInput",
    "weekdayQuickTimes",
    "weekendQuickTimes",
    "cutoffInput",
    "generateBtnSecondary",
    "excludeDateInput",
    "addExcludeBtn",
    "excludeList",
    "extraDateInput",
    "extraTimeInput",
    "addExtraBtn",
    "addSelectedExtraBtn",
    "quickExtraTimes",
    "extraList",
    "noteInput",
    "addNoteBtn",
    "notesList",
    "titleInput",
    "titleFormatInput",
    "subtitleInput",
    "titleXInput",
    "titleYInput",
    "titleSizeInput",
    "subtitleXInput",
    "subtitleYInput",
    "noteXInput",
    "noteYInput",
    "noteSizeInput",
    "brandInput",
    "backgroundInput",
    "backgroundOpacityInput",
    "titleColorInput",
    "contentColorInput",
    "statusTextToneInput",
    "frameInput",
    "dateFrameStyleInput",
    "calendarContentScaleInput",
    "cardsAlignInput",
    "lineGapInput",
    "generateBtn",
    "exportBtn",
    "clearBtn",
    "saveDesignBtn",
    "savedDesignsInput",
    "saveDesignStatus",
    "loadDesignBtn",
    "deleteDesignBtn",
    "scheduleList",
    "slotSummary",
    "posterCanvas",
    "previewTitle",
  ].forEach((id) => {
    els[id] = document.getElementById(id);
  });
}

function bindEvents() {
  els.generateBtn.addEventListener("click", () => {
    generateAndRenderSlots();
  });

  els.generateBtnSecondary.addEventListener("click", () => {
    generateAndRenderSlots();
  });

  els.saveDesignBtn.addEventListener("click", () => {
    saveDesignSnapshot();
  });

  els.loadDesignBtn.addEventListener("click", () => {
    loadSelectedDesign();
  });

  els.deleteDesignBtn.addEventListener("click", () => {
    deleteSelectedDesign();
  });

  els.clearBtn.addEventListener("click", () => {
    state.slots = [];
    saveState();
    render();
  });

  els.exportBtn.addEventListener("click", exportPng);

  const appearanceInputIds = [
    "titleInput",
    "titleFormatInput",
    "subtitleInput",
    "titleXInput",
    "titleYInput",
    "titleSizeInput",
    "subtitleXInput",
    "subtitleYInput",
    "noteXInput",
    "noteYInput",
    "noteSizeInput",
    "brandInput",
    "titleColorInput",
    "contentColorInput",
    "statusTextToneInput",
    "lineGapInput",
    "calendarContentScaleInput",
    "cardsAlignInput",
    "dateFrameStyleInput",
    "backgroundOpacityInput",
  ];
  appearanceInputIds.forEach((id) => {
    els[id].addEventListener("input", updateAppearanceFromInputs);
    els[id].addEventListener("change", updateAppearanceFromInputs);
  });
  bindEventsContinued();
}

function generateAndRenderSlots() {
    readRuleInputs();
    generateSlots();
    saveState();
    render();
}

function bindEventsContinued() {

  els.frameInput.addEventListener("change", () => {
    state.showFrame = els.frameInput.checked;
    saveState();
    drawPoster();
  });

  ["yearInput", "monthSelectInput", "weekdayTimesInput", "weekendTimesInput", "cutoffInput"].forEach((id) => {
    els[id].addEventListener("change", () => {
      const previousTitle = defaultTitle();
      readRuleInputs();
      updateTitleFormatOptions();
      if (els.titleInput.value.trim() !== "" && isAutoMonthTitle(els.titleInput.value, previousTitle)) {
        state.title = defaultTitle();
        els.titleInput.value = state.title;
      }
      saveState();
      renderRuleTimeChoices();
      renderQuickExtraTimes();
      drawPoster();
    });
  });

  els.addExcludeBtn.addEventListener("click", () => {
    const date = els.excludeDateInput.value;
    if (!date || state.excludes.includes(date)) return;
    state.excludes.push(date);
    els.excludeDateInput.value = "";
    generateSlots();
    saveState();
    render();
  });

  els.addExtraBtn.addEventListener("click", () => {
    const date = els.extraDateInput.value;
    const time = els.extraTimeInput.value;
    if (!date || !time) return;
    addExtraTimes(date, [time]);
  });

  els.addSelectedExtraBtn.addEventListener("click", () => {
    const date = els.extraDateInput.value;
    if (!date || !selectedExtraTimes.size) return;
    addExtraTimes(date, [...selectedExtraTimes]);
  });

  els.addNoteBtn.addEventListener("click", () => {
    const note = els.noteInput.value.trim();
    if (!note) return;
    state.notes.push(note);
    els.noteInput.value = "";
    saveState();
    renderLists();
    drawPoster();
  });

  els.backgroundInput.addEventListener("change", handleBackgroundUpload);

  document.querySelectorAll("[data-template]").forEach((button) => {
    button.addEventListener("click", () => {
      state.template = button.dataset.template;
      document.querySelectorAll("[data-template]").forEach((el) => {
        el.classList.toggle("active", el === button);
      });
      saveState();
      drawPoster();
    });
  });
}

function bindPanelTabs() {
  const tabs = [...document.querySelectorAll("[data-panel-tab]")];
  if (!tabs.length) return;
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      setActivePanel(tab.dataset.panelTab);
    });
  });
  setActivePanel(tabs[0].dataset.panelTab);
}

function setActivePanel(panelName) {
  document.querySelectorAll("[data-panel-tab]").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.panelTab === panelName);
  });
  document.querySelectorAll("[data-panel]").forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.panel === panelName);
  });
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  if (!["https:", "http:"].includes(location.protocol)) return;
  navigator.serviceWorker.register("./service-worker.js").catch(() => {});
}

function updateAppearanceFromInputs(event) {
  const rawTitle = els.titleInput.value;
  const wasAutoTitle = rawTitle.trim() !== "" && isAutoMonthTitle(rawTitle);
  state.titleFormat = els.titleFormatInput.value;
  state.title = rawTitle.trim();
  if (event?.target?.id === "titleFormatInput" || wasAutoTitle) {
    state.title = defaultTitle();
    els.titleInput.value = state.title;
  }
  state.subtitle = els.subtitleInput.value.trim();
  state.titleX = Number(els.titleXInput.value) || 11;
  state.titleY = Number(els.titleYInput.value) || 11;
  state.titleSize = Number(els.titleSizeInput.value) || 1;
  state.subtitleX = Number(els.subtitleXInput.value) || 11;
  state.subtitleY = Number(els.subtitleYInput.value) || 16;
  state.noteX = Number(els.noteXInput.value) || 50;
  state.noteY = Number(els.noteYInput.value) || 85;
  state.noteSize = Number(els.noteSizeInput.value) || 1;
  state.brand = els.brandInput.value.trim();
  state.titleColor = els.titleColorInput.value;
  state.contentColor = els.contentColorInput.value;
  state.statusTextTone = els.statusTextToneInput.value;
  state.accent = state.contentColor;
  state.size = "story";
  state.lineGap = Number(els.lineGapInput.value) || 1;
  state.calendarContentScale = Number(els.calendarContentScaleInput.value) || 1;
  state.cardsAlign = els.cardsAlignInput.value;
  state.dateFrameStyle = els.dateFrameStyleInput.value;
  state.showGrid = state.dateFrameStyle !== "none";
  state.backgroundOpacity = clamp(Number(els.backgroundOpacityInput.value), 0, 1);
  resizeCanvas();
  saveState();
  drawPoster();
}

function hydrateInputs() {
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  state.month = state.month || month;
  populateYearOptions();
  if (!loadedSavedState && !state.title) {
    state.title = defaultTitle();
  } else if (state.title && isAutoMonthTitle(state.title)) {
    state.title = defaultTitle();
  }
  const [selectedYear, selectedMonth] = state.month.split("-");
  els.yearInput.value = selectedYear;
  els.monthSelectInput.value = selectedMonth;
  els.weekdayTimesInput.value = state.weekdayTimes.join(", ");
  els.weekendTimesInput.value = state.weekendTimes.join(", ");
  els.cutoffInput.value = state.cutoff;
  els.titleInput.value = state.title;
  els.titleFormatInput.value = state.titleFormat;
  updateTitleFormatOptions();
  els.subtitleInput.value = state.subtitle;
  els.titleXInput.value = state.titleX;
  els.titleYInput.value = state.titleY;
  els.titleSizeInput.value = state.titleSize;
  els.subtitleXInput.value = state.subtitleX;
  els.subtitleYInput.value = state.subtitleY;
  els.noteXInput.value = state.noteX;
  els.noteYInput.value = state.noteY;
  els.noteSizeInput.value = state.noteSize;
  els.brandInput.value = state.brand;
  els.titleColorInput.value = state.titleColor;
  els.contentColorInput.value = state.contentColor;
  els.statusTextToneInput.value = state.statusTextTone || "soft";
  els.frameInput.checked = state.showFrame;
  if (!state.dateFrameStyle) {
    state.dateFrameStyle = state.showGrid ? "outline" : "none";
  }
  if (state.dateFrameStyle === "chip") state.dateFrameStyle = "outline";
  els.dateFrameStyleInput.value = state.dateFrameStyle;
  els.lineGapInput.value = state.lineGap;
  els.calendarContentScaleInput.value = state.calendarContentScale || 1;
  els.cardsAlignInput.value = state.cardsAlign;
  els.backgroundOpacityInput.value = state.backgroundOpacity;
  document.querySelectorAll("[data-template]").forEach((button) => {
    button.classList.toggle("active", button.dataset.template === state.template);
  });
  resizeCanvas();
  if (state.backgroundDataUrl) {
    loadBackground(state.backgroundDataUrl);
  }
  renderSavedDesigns();
  renderRuleTimeChoices();
  renderQuickExtraTimes();
}

function renderRuleTimeChoices() {
  renderTimeChoiceGroup("weekday", els.weekdayQuickTimes, els.weekdayTimesInput);
  renderTimeChoiceGroup("weekend", els.weekendQuickTimes, els.weekendTimesInput);
}

function renderTimeChoiceGroup(kind, container, input) {
  if (!container || !input) return;
  const selected = new Set(parseTimes(input.value));
  const choices = quickRuleTimes(selected);
  container.innerHTML = "";
  choices.forEach((time) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "time-choice";
    button.classList.toggle("selected", selected.has(time));
    button.textContent = time;
    button.setAttribute("aria-pressed", selected.has(time) ? "true" : "false");
    button.addEventListener("click", () => {
      toggleRuleTime(input, time);
      readRuleInputs();
      saveState();
      renderRuleTimeChoices();
      renderQuickExtraTimes();
      drawPoster();
    });
    container.appendChild(button);
  });
}

function toggleRuleTime(input, time) {
  const times = parseTimes(input.value);
  const next = times.includes(time) ? times.filter((item) => item !== time) : [...times, time].sort();
  input.value = next.join(", ");
}

function quickRuleTimes(selected = new Set()) {
  return [...new Set([...selected, "10:00", "11:00", "13:00", "14:00", "17:00", "18:00", "20:00"])]
    .map(normalizeTime)
    .filter(Boolean)
    .sort();
}

function addExtraTimes(date, times) {
  const normalizedTimes = times.map(normalizeTime).filter(Boolean);
  normalizedTimes.forEach((time) => {
    if (!state.extras.some((extra) => extra.date === date && extra.time === time)) {
      state.extras.push({ date, time });
    }
  });
  selectedExtraTimes.clear();
  generateSlots();
  saveState();
  render();
}

function renderQuickExtraTimes() {
  if (!els.quickExtraTimes) return;
  const times = quickExtraTimes();
  selectedExtraTimes.forEach((time) => {
    if (!times.includes(time)) selectedExtraTimes.delete(time);
  });
  els.quickExtraTimes.innerHTML = "";
  times.forEach((time) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "time-choice";
    button.classList.toggle("selected", selectedExtraTimes.has(time));
    button.textContent = time;
    button.addEventListener("click", () => {
      if (selectedExtraTimes.has(time)) {
        selectedExtraTimes.delete(time);
      } else {
        selectedExtraTimes.add(time);
      }
      renderQuickExtraTimes();
    });
    els.quickExtraTimes.appendChild(button);
  });
  if (els.addSelectedExtraBtn) {
    els.addSelectedExtraBtn.disabled = !selectedExtraTimes.size;
  }
}

function quickExtraTimes() {
  return [...new Set([...state.weekdayTimes, ...state.weekendTimes, "10:00", "13:00", "17:00", "18:00", "20:00"])]
    .map(normalizeTime)
    .filter(Boolean)
    .sort();
}

function populateYearOptions() {
  const currentYear = new Date().getFullYear();
  const selectedYear = Number((state.month || "").slice(0, 4)) || currentYear;
  const startYear = Math.min(selectedYear, currentYear);
  const endYear = Math.max(selectedYear, currentYear + 8);
  els.yearInput.innerHTML = "";
  for (let year = startYear; year <= endYear; year += 1) {
    const option = document.createElement("option");
    option.value = String(year);
    option.textContent = `${year} 年`;
    els.yearInput.appendChild(option);
  }
}

function readRuleInputs() {
  state.month = `${els.yearInput.value}-${els.monthSelectInput.value}`;
  state.weekdayTimes = parseTimes(els.weekdayTimesInput.value);
  state.weekendTimes = parseTimes(els.weekendTimesInput.value);
  state.cutoff = clamp(Number(els.cutoffInput.value) || 15, 1, 31);
}

function parseTimes(value) {
  return value
    .split(/[,\s，、]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map(normalizeTime)
    .filter(Boolean)
    .filter((time, index, arr) => arr.indexOf(time) === index)
    .sort();
}

function normalizeTime(value) {
  const match = value.match(/^(\d{1,2}):?(\d{2})?$/);
  if (!match) return "";
  const hour = Number(match[1]);
  const minute = match[2] === undefined ? 0 : Number(match[2]);
  if (hour > 23 || minute > 59) return "";
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function generateSlots() {
  readRuleInputs();
  if (!state.month) return;
  const [year, month] = state.month.split("-").map(Number);
  const monthIndex = month - 1;
  const days = new Date(year, month, 0).getDate();
  const slots = [];

  for (let day = 1; day <= Math.min(days, state.cutoff); day += 1) {
    const date = toDateKey(year, month, day);
    if (state.excludes.includes(date)) continue;
    const weekday = new Date(year, monthIndex, day).getDay();
    const times = weekday === 0 || weekday === 6 ? state.weekendTimes : state.weekdayTimes;
    times.forEach((time) => {
      slots.push(createSlot(date, time));
    });
  }

  state.extras
    .filter((extra) => extra.date.startsWith(state.month))
    .forEach((extra) => {
      const exists = slots.some((slot) => slot.date === extra.date && slot.time === extra.time);
      if (!exists) slots.push(createSlot(extra.date, extra.time, "open", true));
    });

  state.slots = slots.sort(sortSlots);
}

function createSlot(date, time, status = "open", extra = false) {
  return {
    id: `${date}-${time}-${extra ? "extra" : "base"}`,
    date,
    time,
    status,
    extra,
  };
}

function render() {
  renderLists();
  renderQuickExtraTimes();
  renderSchedule();
  updateSummary();
  drawPoster();
}

function renderLists() {
  els.excludeList.innerHTML = "";
  state.excludes
    .filter((date) => !state.month || date.startsWith(state.month))
    .sort()
    .forEach((date) => {
      els.excludeList.appendChild(createTag(formatDateShort(date), () => {
        state.excludes = state.excludes.filter((item) => item !== date);
        generateSlots();
        saveState();
        render();
      }));
    });

  els.extraList.innerHTML = "";
  state.extras
    .filter((extra) => !state.month || extra.date.startsWith(state.month))
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
    .forEach((extra) => {
      els.extraList.appendChild(createTag(`${formatDateShort(extra.date)} ${extra.time}`, () => {
        state.extras = state.extras.filter(
          (item) => !(item.date === extra.date && item.time === extra.time),
        );
        generateSlots();
        saveState();
        render();
      }));
    });

  els.notesList.innerHTML = "";
  state.notes.forEach((note, index) => {
    els.notesList.appendChild(createTag(note, () => {
      state.notes.splice(index, 1);
      saveState();
      renderLists();
      drawPoster();
    }));
  });
}

function createTag(label, onRemove) {
  const tag = document.createElement("span");
  tag.className = "tag";
  tag.textContent = label;
  const button = document.createElement("button");
  button.type = "button";
  button.setAttribute("aria-label", `移除 ${label}`);
  button.textContent = "x";
  button.addEventListener("click", onRemove);
  tag.appendChild(button);
  return tag;
}

function renderSchedule() {
  els.scheduleList.innerHTML = "";
  const groups = groupSlots(state.slots);
  const dates = Object.keys(groups).sort();

  if (!dates.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "還沒有時段。按「產生時段」即可依規則建立本月時段表。";
    els.scheduleList.appendChild(empty);
    return;
  }

  dates.forEach((date) => {
    const row = document.createElement("article");
    row.className = "day-row";

    const head = document.createElement("div");
    head.className = "day-head";

    const label = document.createElement("div");
    label.className = "date-label";
    label.textContent = formatDateLabel(date);

    const actions = document.createElement("div");
    actions.className = "day-actions";
    [
      ["open", "可約"],
      ["full", "已滿"],
    ].forEach(([status, labelText]) => {
      const button = document.createElement("button");
      button.className = "day-action";
      button.type = "button";
      button.textContent = labelText;
      button.addEventListener("click", () => {
        state.slots = state.slots.map((slot) =>
          slot.date === date ? { ...slot, status } : slot,
        );
        saveState();
        render();
      });
      actions.appendChild(button);
    });

    head.append(label, actions);

    const slotButtons = document.createElement("div");
    slotButtons.className = "slot-buttons";
    groups[date].forEach((slot) => {
      const editor = document.createElement("div");
      editor.className = "slot-editor";

      const input = document.createElement("input");
      input.className = "slot-time-input";
      input.type = "text";
      input.inputMode = "numeric";
      input.pattern = "\\d{1,2}:\\d{2}";
      input.placeholder = "HH:MM";
      input.value = slot.time;
      input.addEventListener("change", () => {
        const nextTime = normalizeTime(input.value);
        if (!nextTime) {
          input.value = slot.time;
          return;
        }
        slot.time = nextTime;
        slot.id = `${slot.date}-${slot.time}-${slot.extra ? "extra" : "base"}`;
        state.slots.sort(sortSlots);
        saveState();
        render();
      });

      const button = document.createElement("button");
      button.className = `status-button ${slot.status}`;
      button.type = "button";
      button.textContent = statusLabel(slot);
      button.addEventListener("click", () => {
        slot.status = nextStatus(slot.status);
        saveState();
        render();
      });
      editor.append(input, button);
      slotButtons.appendChild(editor);
    });

    row.append(head, slotButtons);
    els.scheduleList.appendChild(row);
  });
}

function statusLabel(slot) {
  return slot.status === "full" ? "已滿" : "可約";
}

function nextStatus(status) {
  return status === "open" ? "full" : "open";
}

function updateSummary() {
  const openCount = state.slots.filter((slot) => slot.status === "open").length;
  const total = state.slots.length;
  els.slotSummary.textContent = `${openCount} 個可約 / ${total} 個時段`;
}

function resizeCanvas() {
  const [width, height] = sizes[state.size] || sizes.story;
  els.posterCanvas.width = width;
  els.posterCanvas.height = height;
  els.posterCanvas.style.aspectRatio = `${width} / ${height}`;
}

function drawPoster() {
  const canvas = els.posterCanvas;
  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0, 0, width, height);

  drawBackground(ctx, width, height);
  if (state.showFrame) drawFrame(ctx, width, height);
  drawHeader(ctx, width, height);

  if (state.template === "calendar") drawCalendarTemplate(ctx, width, height);
  if (state.template === "cards") drawCardsTemplate(ctx, width, height);

  drawFooter(ctx, width, height);
}

function drawBackground(ctx, width, height) {
  drawBaseBackground(ctx, width, height);

  if (state.backgroundImage) {
    ctx.save();
    ctx.globalAlpha = state.backgroundOpacity;
    drawCoverImage(ctx, state.backgroundImage, 0, 0, width, height);
    ctx.restore();
    return;
  }
}

function drawBaseBackground(ctx, width, height) {
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
}

function drawPresetNailArt(ctx, width, height) {
  ctx.save();
  ctx.globalAlpha = 0.58;

  const bottleX = width * 0.68;
  const bottleY = height * 0.075;
  ctx.translate(bottleX, bottleY);
  ctx.rotate(-0.22);
  ctx.fillStyle = "rgba(255, 255, 255, 0.68)";
  roundRect(ctx, 0, width * 0.075, width * 0.18, width * 0.26, width * 0.035);
  ctx.fill();
  ctx.fillStyle = "rgba(36, 33, 31, 0.18)";
  roundRect(ctx, width * 0.055, 0, width * 0.07, width * 0.09, width * 0.018);
  ctx.fill();
  ctx.fillStyle = "rgba(223, 104, 95, 0.36)";
  roundRect(ctx, width * 0.025, width * 0.16, width * 0.13, width * 0.14, width * 0.03);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = 0.36;
  ctx.translate(width * 0.12, height * 0.67);
  ctx.rotate(0.36);
  ["#ffffff", state.accent, "#287c74", "#f6d6cf"].forEach((color, index) => {
    ctx.fillStyle = color;
    roundRect(ctx, index * width * 0.065, 0, width * 0.045, width * 0.15, width * 0.025);
    ctx.fill();
  });
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = 0.20;
  ctx.strokeStyle = "#24211f";
  ctx.lineWidth = width * 0.006;
  ctx.beginPath();
  ctx.moveTo(width * 0.17, height * 0.20);
  ctx.bezierCurveTo(width * 0.24, height * 0.16, width * 0.28, height * 0.27, width * 0.37, height * 0.22);
  ctx.stroke();
  ctx.restore();
}

function drawFrame(ctx, width, height) {
  const margin = Math.max(48, width * 0.055);
  ctx.fillStyle = "rgba(255, 253, 250, 0.78)";
  roundRect(ctx, margin, margin, width - margin * 2, height - margin * 2, 28);
  ctx.fill();
  ctx.strokeStyle = "rgba(36, 33, 31, 0.16)";
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawHeader(ctx, width, height) {
  const x = width * (state.titleX / 100);
  const top = height * (state.titleY / 100);
  if (state.title) {
    ctx.fillStyle = state.titleColor;
    fitText(ctx, state.title, x, top, width * 0.78, boldFont(width * 0.088 * state.titleSize));
  }

  if (state.subtitle) {
    ctx.fillStyle = state.contentColor;
    fitText(
      ctx,
      state.subtitle,
      width * (state.subtitleX / 100),
      height * (state.subtitleY / 100),
      width * 0.78,
      normalFont(width * 0.032),
    );
  }
}

function drawFooter(ctx, width, height) {
  const bottom = height * 0.91;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = state.titleColor;
  ctx.font = normalFont(width * 0.025 * state.noteSize);
  state.notes.forEach((note, index, notes) => {
    const y = height * (state.noteY / 100) - width * 0.052 * state.noteSize * (notes.length - index - 1);
    fitText(ctx, note, width * (state.noteX / 100), y, width * 0.76, normalFont(width * 0.025 * state.noteSize), "center", "middle");
  });

  ctx.fillStyle = state.titleColor;
  ctx.font = boldFont(width * 0.033);
  ctx.fillText(state.brand || "@xiang.nail", width * 0.5, bottom);
  ctx.textAlign = "left";
}

function drawCalendarTemplate(ctx, width, height) {
  if (!state.month) return;
  const [year, month] = state.month.split("-").map(Number);
  const grouped = groupSlots(state.slots);
  const maxTimesInDay = Math.max(
    1,
    ...Object.values(grouped).map((slots) => slots.filter((slot) => slot.status === "open").length),
  );
  const denseCalendar = maxTimesInDay > 3;
  const contentScale = clamp(Number(state.calendarContentScale) || 1, 0.75, 1.15);
  const startY = height * (denseCalendar ? 0.215 : 0.295);
  const left = width * (denseCalendar ? 0.08 : 0.095);
  const gridW = width * (denseCalendar ? 0.88 : 0.81);
  const cellW = gridW / 7;
  const days = new Date(year, month, 0).getDate();
  const first = new Date(year, month - 1, 1).getDay();
  const rows = Math.ceil((first + days) / 7);
  const bottomLimit = height * (denseCalendar ? 0.845 : 0.835);
  const availableCellH = (bottomLimit - startY) / rows;
  const baseCellH = width * (denseCalendar ? 0.16 : 0.135);
  const requiredCellH =
    width * 0.028 +
    width * 0.052 * contentScale +
    maxTimesInDay * width * 0.032 * contentScale;
  const cellH = Math.min(availableCellH, Math.max(baseCellH, requiredCellH));
  const autoScale = Math.min(1, cellH / Math.max(requiredCellH, 1));
  const scale = clamp(contentScale * autoScale, 0.58, 1.15);
  const sharedTimeX = width * 0.017 * scale;
  const sharedTimeY = width * 0.055 * scale;
  const sharedTimeWidth = cellW - width * 0.027 * scale;
  const sharedTimeHeight = cellH - sharedTimeY - width * 0.012 * scale;
  const sharedTimeRows = maxTimesInDay;
  const sharedLineHeight = Math.max(
    9,
    Math.min(width * 0.031 * scale, sharedTimeHeight / Math.max(1, sharedTimeRows)),
  );
  const sharedPreferredFontSize = Math.max(8, Math.min(width * 0.022 * scale, sharedLineHeight * 0.82));
  const sharedTimeFontSize = calendarTimeFontSize(
    ctx,
    Object.values(grouped).flatMap((slots) => slots.filter((slot) => slot.status === "open").map((slot) => slot.time)),
    sharedTimeWidth,
    sharedPreferredFontSize,
    8,
  );

  ctx.font = boldFont(width * 0.026 * scale);
  ctx.fillStyle = state.contentColor;
  weekdayNames.forEach((name, index) => {
    ctx.textAlign = "center";
    ctx.fillText(name, left + cellW * index + cellW / 2, startY - width * 0.035 * scale);
  });

  for (let day = 1; day <= days; day += 1) {
    const position = first + day - 1;
    const col = position % 7;
    const row = Math.floor(position / 7);
    const x = left + col * cellW;
    const y = startY + row * cellH;
    const date = toDateKey(year, month, day);
    const slots = grouped[date] || [];
    const isRestDay = !slots.length && (day > state.cutoff || state.excludes.includes(date));

    if (!["lineOnly", "noFill"].includes(state.dateFrameStyle)) {
      ctx.fillStyle = slots.length ? "rgba(255,255,255,0.86)" : "rgba(255,255,255,0.42)";
      roundRect(ctx, x + 5, y + 5, cellW - 10, cellH - 10, 14);
      ctx.fill();
    }
    drawDateFrame(ctx, x + 5, y + 5, cellW - 10, cellH - 10, 14);

    ctx.fillStyle = state.contentColor;
    ctx.textAlign = "left";
    ctx.font = boldFont(width * 0.031 * scale);
    ctx.fillText(String(day), x + width * 0.017 * scale, y + width * 0.019 * scale);

    const open = slots.filter((slot) => slot.status === "open").map((slot) => slot.time);
    const full = slots.filter((slot) => slot.status === "full").length;
    drawCalendarCellTimes(ctx, {
      x: x + sharedTimeX,
      y: y + sharedTimeY,
      width: sharedTimeWidth,
      height: sharedTimeHeight,
      times: open,
      fallback: full ? "已滿" : isRestDay ? "休" : "",
      canvasWidth: width,
      scale,
      lineHeight: sharedLineHeight,
      fontSize: sharedTimeFontSize,
    });
  }

  ctx.textAlign = "left";
}

function drawCalendarCellTimes(ctx, options) {
  const { x, y, width, height, times, fallback, canvasWidth, scale = 1, lineHeight: fixedLineHeight, fontSize: fixedFontSize } = options;
  ctx.fillStyle = times.length ? state.contentColor : statusTextColor();

  if (!times.length) {
    ctx.font = boldFont(canvasWidth * 0.022 * scale);
    wrapLines(ctx, fallback, x, y, width, canvasWidth * 0.03 * scale * state.lineGap, 2);
    return;
  }

  const columns = 1;
  const rows = Math.ceil(times.length / columns);
  const columnGap = columns > 1 ? canvasWidth * 0.006 : 0;
  const columnWidth = (width - columnGap * (columns - 1)) / columns;
  const lineHeight = fixedLineHeight || Math.max(9, Math.min(canvasWidth * 0.031 * scale, height / Math.max(1, rows)));
  const preferredFontSize = Math.max(8, Math.min(canvasWidth * 0.022 * scale, lineHeight * 0.82));
  const fontSize = fixedFontSize || calendarTimeFontSize(ctx, times, columnWidth, preferredFontSize, 8);

  ctx.font = boldFont(fontSize);
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  times.forEach((time, index) => {
    const column = Math.floor(index / rows);
    const row = index % rows;
    const tx = x + column * (columnWidth + columnGap);
    const ty = y + row * lineHeight;
    ctx.fillText(time, tx, ty);
  });
}

function calendarTimeFontSize(ctx, times, maxWidth, preferredSize, minSize) {
  let size = Math.floor(preferredSize);
  while (size > minSize) {
    ctx.font = boldFont(size);
    if (times.every((time) => ctx.measureText(time).width <= maxWidth)) return size;
    size -= 1;
  }
  return minSize;
}

function statusTextColor() {
  if (state.statusTextTone === "content") return state.contentColor;
  if (state.statusTextTone === "title") return state.titleColor;
  return "#8b827a";
}

function drawCardsTemplate(ctx, width, height) {
  const openGroups = Object.entries(groupSlots(state.slots))
    .map(([date, slots]) => [date, slots.filter((slot) => slot.status === "open")])
    .filter(([, slots]) => slots.length);
  const x = width * 0.12;
  const y = height * 0.29;
  const rowW = width * 0.76;
  const availableH = height * 0.83 - y;
  const rowCount = Math.max(1, openGroups.length);
  const lineGapProgress = clamp((state.lineGap - 0.85) / 0.5, 0, 1);
  const span = availableH * (0.58 + lineGapProgress * 0.42);
  const rowStep = rowCount > 1 ? span / (rowCount - 1) : 0;
  const rowH = Math.min(width * 0.064, rowStep ? rowStep * 0.78 : width * 0.064);
  const dateFont = clamp(rowH * 0.42, width * 0.025, width * 0.036);
  const timeFont = clamp(rowH * 0.36, width * 0.022, width * 0.034);
  const dateX = x;
  const timeLeftX = x + rowW * 0.24;
  const timeRightX = x + rowW;

  openGroups.forEach(([date, slots], index) => {
    const top = y + index * rowStep;
    const centerY = top + rowH * 0.52;
    ctx.fillStyle = state.contentColor;
    ctx.font = boldFont(dateFont);
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.fillText(formatDateLabel(date), dateX, centerY);

    ctx.fillStyle = state.contentColor;
    const timeText = slots.map((slot) => slot.time).join("  ");
    if (state.cardsAlign === "left") {
      fitText(ctx, timeText, timeLeftX, centerY, rowW * 0.68, boldFont(timeFont), "left", "middle");
    } else {
      fitText(ctx, timeText, timeRightX, centerY, rowW * 0.68, boldFont(timeFont), "right", "middle");
    }
    ctx.textAlign = "left";
  });

  if (!openGroups.length) drawEmptyPosterMessage(ctx, width, height, "目前已滿");
}

function drawDateFrame(ctx, x, y, width, height, radius) {
  if (state.dateFrameStyle === "outline") {
    ctx.strokeStyle = state.contentColor;
    ctx.lineWidth = 1.5;
    roundRect(ctx, x, y, width, height, radius);
    ctx.stroke();
    return;
  }

  if (state.dateFrameStyle === "underline" || state.dateFrameStyle === "lineOnly") {
    ctx.strokeStyle = state.contentColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, y + height);
    ctx.lineTo(x + width, y + height);
    ctx.stroke();
  }
}

function drawEmptyPosterMessage(ctx, width, height, message) {
  ctx.fillStyle = "rgba(255,255,255,0.84)";
  roundRect(ctx, width * 0.17, height * 0.43, width * 0.66, width * 0.18, 28);
  ctx.fill();
  ctx.fillStyle = statusTextColor();
  fitText(ctx, message, width * 0.5, height * 0.485, width * 0.56, boldFont(width * 0.05), "center", "middle");
}

function exportPng() {
  drawPoster();
  els.posterCanvas.toBlob(async (blob) => {
    if (!blob) return;
    const filename = `booking-board-${state.month || "month"}.png`;
    const file = new File([blob], filename, { type: "image/png" });
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: "預約時段圖" });
        return;
      } catch {
        // Fall back to a normal download when sharing is cancelled or unavailable.
      }
    }
    downloadBlob(blob, filename);
  }, "image/png");
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function handleBackgroundUpload(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  backgroundLoadToken += 1;
  const token = backgroundLoadToken;
  state.backgroundDataUrl = "";
  state.backgroundImage = null;
  drawPoster();
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    if (token !== backgroundLoadToken) return;
    prepareBackgroundDataUrl(String(reader.result), (preparedDataUrl) => {
      if (token !== backgroundLoadToken) return;
      state.backgroundDataUrl = preparedDataUrl;
      loadBackground(state.backgroundDataUrl, token);
      saveState();
      els.backgroundInput.value = "";
    });
  });
  reader.readAsDataURL(file);
}

function prepareBackgroundDataUrl(dataUrl, callback) {
  const image = new Image();
  image.addEventListener("load", () => {
    try {
      callback(compressBackgroundDataUrl(image));
    } catch {
      callback(dataUrl);
    }
  });
  image.addEventListener("error", () => callback(dataUrl));
  image.src = dataUrl;
}

function compressBackgroundDataUrl(image) {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawCoverImage(ctx, image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.88);
}

function loadBackground(dataUrl, token = ++backgroundLoadToken) {
  const image = new Image();
  image.addEventListener("load", () => {
    if (token !== backgroundLoadToken) return;
    state.backgroundImage = image;
    drawPoster();
  });
  image.src = dataUrl;
}

function groupSlots(slots) {
  return slots.reduce((acc, slot) => {
    acc[slot.date] ||= [];
    acc[slot.date].push(slot);
    acc[slot.date].sort((a, b) => a.time.localeCompare(b.time));
    return acc;
  }, {});
}

function sortSlots(a, b) {
  return `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`);
}

function defaultTitle() {
  if (!state.month) return "";
  const [year, month] = state.month.split("-").map(Number);
  const english = englishMonths[month - 1] || "";
  if (state.titleFormat === "englishLong") return `${english} ${year}`;
  if (state.titleFormat === "englishShort") return `${english.slice(0, 3)} ${year}`;
  if (state.titleFormat === "englishUpper") return `${english.toUpperCase()} ${year}`;
  if (state.titleFormat === "englishMonthOnly") return english;
  return `${year}/${String(month).padStart(2, "0")}`;
}

function updateTitleFormatOptions() {
  const options = {
    yearMonth: defaultTitleForFormat("yearMonth"),
    englishLong: defaultTitleForFormat("englishLong"),
    englishShort: defaultTitleForFormat("englishShort"),
    englishUpper: defaultTitleForFormat("englishUpper"),
    englishMonthOnly: defaultTitleForFormat("englishMonthOnly"),
  };
  Object.entries(options).forEach(([value, label]) => {
    const option = els.titleFormatInput?.querySelector(`option[value="${value}"]`);
    if (option) option.textContent = label;
  });
}

function isAutoMonthTitle(value, previousTitle = "") {
  const title = (value || "").trim();
  return (
    title === previousTitle ||
    /^\d{4}\/\d{2}$/.test(title) ||
    englishMonths.some((month) => {
      const year = state.month ? state.month.slice(0, 4) : "";
      return (
        title === `${month} ${year}` ||
        title === `${month.slice(0, 3)} ${year}` ||
        title === `${month.toUpperCase()} ${year}` ||
        title === month
      );
    }) ||
    new RegExp(`^(${englishMonths.join("|")}) \\d{4}$`).test(title) ||
    new RegExp(`^(${englishMonths.map((month) => month.slice(0, 3)).join("|")}) \\d{4}$`).test(title) ||
    new RegExp(`^(${englishMonths.map((month) => month.toUpperCase()).join("|")}) \\d{4}$`).test(title) ||
    title === "六月預約開放" ||
    title === "六月預約表"
  );
}

function formatDateShort(date) {
  const [, month, day] = date.split("-").map(Number);
  return `${month}/${day}`;
}

function formatDateLabel(date) {
  const parsed = new Date(`${date}T00:00:00`);
  return `${formatDateShort(date)}（${weekdayNames[parsed.getDay()]}）`;
}

function toDateKey(year, month, day) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function designSnapshotName() {
  const label = state.month ? defaultTitleForFormat("yearMonth") : "未命名";
  const now = new Date();
  const rocYear = now.getFullYear() - 1911;
  const dateCode = `${rocYear}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  return `${label}-${dateCode}版`;
}

function defaultTitleForFormat(format) {
  const currentFormat = state.titleFormat;
  state.titleFormat = format;
  const title = defaultTitle();
  state.titleFormat = currentFormat;
  return title;
}

function getDesignSnapshots() {
  try {
    return JSON.parse(localStorage.getItem("nail-booking-board-designs") || "[]");
  } catch {
    return [];
  }
}

function saveDesignSnapshot() {
  setSaveDesignStatus("");
  const snapshots = getDesignSnapshots();
  const baseName = designSnapshotName();
  const snapshot = {
    id: `${Date.now()}`,
    name: uniqueSnapshotName(baseName, snapshots),
    updatedAt: new Date().toISOString(),
    data: { ...state, backgroundImage: null },
  };
  const nextSnapshots = [snapshot, ...snapshots].slice(0, 20);
  if (!persistDesignSnapshots(nextSnapshots)) {
    snapshot.data = { ...snapshot.data, backgroundDataUrl: "" };
    if (!persistDesignSnapshots([snapshot, ...snapshots].slice(0, 20))) {
      setSaveDesignStatus("儲存失敗：手機空間不足，請先刪除舊設計或換一張較小的背景圖。");
      return;
    }
    setSaveDesignStatus("已儲存設定；因手機空間不足，這次沒有一起保存背景圖。");
  } else {
    setSaveDesignStatus("已儲存設計。");
  }
  renderSavedDesigns(snapshot.id);
}

function setSaveDesignStatus(message) {
  if (!els.saveDesignStatus) return;
  els.saveDesignStatus.textContent = message;
}

function persistDesignSnapshots(snapshots) {
  try {
    localStorage.setItem("nail-booking-board-designs", JSON.stringify(snapshots));
    return true;
  } catch {
    return false;
  }
}

function uniqueSnapshotName(baseName, snapshots) {
  const names = new Set(snapshots.map((snapshot) => snapshot.name));
  if (!names.has(baseName)) return baseName;
  let index = 1;
  while (names.has(`${baseName}(${index})`)) index += 1;
  return `${baseName}(${index})`;
}

function renderSavedDesigns(selectedId = "") {
  if (!els.savedDesignsInput) return;
  const snapshots = getDesignSnapshots();
  els.savedDesignsInput.innerHTML = "";
  if (!snapshots.length) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "尚未儲存";
    els.savedDesignsInput.appendChild(option);
    return;
  }
  snapshots.forEach((snapshot) => {
    const option = document.createElement("option");
    option.value = snapshot.id;
    option.textContent = snapshot.name;
    els.savedDesignsInput.appendChild(option);
  });
  els.savedDesignsInput.value = selectedId || snapshots[0].id;
}

function loadSelectedDesign() {
  const id = els.savedDesignsInput.value;
  if (!id) return;
  const snapshot = getDesignSnapshots().find((item) => item.id === id);
  if (!snapshot) return;
  Object.assign(state, snapshot.data);
  state.backgroundImage = null;
  saveState();
  hydrateInputs();
  render();
  setSaveDesignStatus("已載入設計。");
}

function deleteSelectedDesign() {
  const id = els.savedDesignsInput.value;
  if (!id) return;
  const snapshots = getDesignSnapshots().filter((item) => item.id !== id);
  persistDesignSnapshots(snapshots);
  renderSavedDesigns();
  setSaveDesignStatus("已刪除設計。");
}

function saveState() {
  const saved = { ...state, backgroundImage: null };
  try {
    localStorage.setItem("nail-booking-board", JSON.stringify(saved));
  } catch {
    const lightweight = { ...saved, backgroundDataUrl: "" };
    try {
      localStorage.setItem("nail-booking-board", JSON.stringify(lightweight));
    } catch {
      setSaveDesignStatus("手機暫存空間不足，部分設定可能無法自動保存。");
    }
  }
}

function loadState() {
  try {
    const raw = localStorage.getItem("nail-booking-board");
    loadedSavedState = Boolean(raw);
    const saved = JSON.parse(raw || "{}");
    Object.assign(state, saved);
    state.size = "story";
    if (!["calendar", "cards"].includes(state.template)) state.template = "calendar";
    state.notes = Array.isArray(state.notes) ? state.notes : [];
    state.titleFormat = state.titleFormat || "yearMonth";
    state.titleSize = Number(state.titleSize) || 1;
    state.noteSize = Number(state.noteSize) || 1;
    state.calendarContentScale = Number(state.calendarContentScale) || Number(state.calendarCellScale) || 1;
    state.backgroundOpacity = state.backgroundOpacity === undefined ? 1 : clamp(Number(state.backgroundOpacity), 0, 1);
    state.statusTextTone = state.statusTextTone || "soft";
    state.noteX = Number(state.noteX) || 50;
    state.noteY = Number(state.noteY) || 85;
    state.contentColor =
      state.contentColor ||
      state.timeColor ||
      state.dateColor ||
      state.subtitleColor ||
      state.brandColor ||
      "#5f5750";
    state.accent = state.contentColor;
    state.dateFrameStyle = state.dateFrameStyle || (state.showGrid ? "outline" : "none");
    if (state.dateFrameStyle === "chip") state.dateFrameStyle = "outline";
    state.showGrid = state.dateFrameStyle !== "none";
    state.slots = (state.slots || []).map((slot) => ({
      ...slot,
      status: slot.status === "full" ? "full" : "open",
    }));
  } catch {
    localStorage.removeItem("nail-booking-board");
  }
}

function drawCoverImage(ctx, image, x, y, width, height) {
  const scale = Math.max(width / image.width, height / image.height);
  const imageW = image.width * scale;
  const imageH = image.height * scale;
  const imageX = x + (width - imageW) / 2;
  const imageY = y + (height - imageH) / 2;
  ctx.drawImage(image, imageX, imageY, imageW, imageH);
}

function roundRect(ctx, x, y, width, height, radius) {
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, radius);
    return;
  }
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
}

function fitText(ctx, text, x, y, maxWidth, font, align = "left", baseline = "top") {
  ctx.font = font;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  if (ctx.measureText(text).width <= maxWidth) {
    ctx.fillText(text, x, y);
    return;
  }
  let trimmed = text;
  while (trimmed.length > 1 && ctx.measureText(`${trimmed}...`).width > maxWidth) {
    trimmed = trimmed.slice(0, -1);
  }
  ctx.fillText(`${trimmed}...`, x, y);
}

function wrapLines(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
  if (!text) return;
  const words = text.split(" ");
  let line = "";
  let count = 0;
  words.forEach((word) => {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && line) {
      ctx.fillText(line, x, y + count * lineHeight);
      line = word;
      count += 1;
    } else {
      line = next;
    }
  });
  if (line && count < maxLines) ctx.fillText(line, x, y + count * lineHeight);
}

function boldFont(size) {
  return `800 ${Math.round(size)}px "Noto Sans TC", "PingFang TC", sans-serif`;
}

function normalFont(size) {
  return `500 ${Math.round(size)}px "Noto Sans TC", "PingFang TC", sans-serif`;
}
