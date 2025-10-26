var AssetClass = /* @__PURE__ */ ((AssetClass2) => {
  AssetClass2["AREA"] = "ems__Area";
  AssetClass2["TASK"] = "ems__Task";
  AssetClass2["PROJECT"] = "ems__Project";
  AssetClass2["MEETING"] = "ems__Meeting";
  AssetClass2["INITIATIVE"] = "ems__Initiative";
  AssetClass2["TASK_PROTOTYPE"] = "ems__TaskPrototype";
  AssetClass2["MEETING_PROTOTYPE"] = "ems__MeetingPrototype";
  AssetClass2["DAILY_NOTE"] = "pn__DailyNote";
  AssetClass2["CONCEPT"] = "ims__Concept";
  return AssetClass2;
})(AssetClass || {});

var EffortStatus = /* @__PURE__ */ ((EffortStatus2) => {
  EffortStatus2["DRAFT"] = "ems__EffortStatusDraft";
  EffortStatus2["BACKLOG"] = "ems__EffortStatusBacklog";
  EffortStatus2["ANALYSIS"] = "ems__EffortStatusAnalysis";
  EffortStatus2["TODO"] = "ems__EffortStatusToDo";
  EffortStatus2["DOING"] = "ems__EffortStatusDoing";
  EffortStatus2["DONE"] = "ems__EffortStatusDone";
  EffortStatus2["TRASHED"] = "ems__EffortStatusTrashed";
  return EffortStatus2;
})(EffortStatus || {});

class WikiLinkHelpers {
  static {
    this.WIKI_LINK_PATTERN = /\[\[|\]\]/g;
  }
  static normalize(value) {
    if (!value) return "";
    return value.replace(this.WIKI_LINK_PATTERN, "").trim();
  }
  static normalizeArray(values) {
    if (!values) return [];
    const arr = Array.isArray(values) ? values : [values];
    return arr.map((v) => this.normalize(v)).filter((v) => v.length > 0);
  }
  static equals(a, b) {
    return this.normalize(a) === this.normalize(b);
  }
  static includes(array, value) {
    const normalized = this.normalizeArray(array);
    const target = this.normalize(value);
    return normalized.includes(target);
  }
}

function hasClass(instanceClass, targetClass) {
  if (!instanceClass) return false;
  const classes = Array.isArray(instanceClass) ? instanceClass : [instanceClass];
  return classes.some((cls) => WikiLinkHelpers.normalize(cls) === targetClass);
}
function isAreaOrProject(instanceClass) {
  return hasClass(instanceClass, AssetClass.AREA) || hasClass(instanceClass, AssetClass.PROJECT);
}
function isEffort(instanceClass) {
  return hasClass(instanceClass, AssetClass.TASK) || hasClass(instanceClass, AssetClass.PROJECT) || hasClass(instanceClass, AssetClass.MEETING);
}
function hasStatus(currentStatus, targetStatus) {
  if (!currentStatus) return false;
  const statusValue = Array.isArray(currentStatus) ? currentStatus[0] : currentStatus;
  if (!statusValue) return false;
  const cleanStatus = WikiLinkHelpers.normalize(statusValue);
  return cleanStatus === targetStatus;
}
function isAssetArchived(isArchived) {
  if (isArchived === true || isArchived === 1) return true;
  if (typeof isArchived === "string") {
    const lowerValue = isArchived.toLowerCase();
    return lowerValue === "true" || lowerValue === "yes";
  }
  return false;
}
function hasEmptyProperties(metadata) {
  if (!metadata || Object.keys(metadata).length === 0) return false;
  return Object.values(metadata).some((value) => {
    if (value === null || value === void 0) return true;
    if (typeof value === "string" && value.trim() === "") return true;
    if (Array.isArray(value) && value.length === 0) return true;
    if (typeof value === "object" && !Array.isArray(value) && Object.keys(value).length === 0)
      return true;
    return false;
  });
}
function needsFolderRepair(currentFolder, expectedFolder) {
  if (!expectedFolder) return false;
  const normalizedCurrent = currentFolder.replace(/\/$/, "");
  const normalizedExpected = expectedFolder.replace(/\/$/, "");
  return normalizedCurrent !== normalizedExpected;
}
function canCreateTask(context) {
  return isAreaOrProject(context.instanceClass);
}
function canCreateProject(context) {
  return hasClass(context.instanceClass, AssetClass.AREA) || hasClass(context.instanceClass, AssetClass.INITIATIVE) || hasClass(context.instanceClass, AssetClass.PROJECT);
}
function canCreateChildArea(context) {
  return hasClass(context.instanceClass, AssetClass.AREA);
}
function canCreateInstance(context) {
  return hasClass(context.instanceClass, AssetClass.TASK_PROTOTYPE) || hasClass(context.instanceClass, AssetClass.MEETING_PROTOTYPE);
}
function getTodayDateString() {
  const now = /* @__PURE__ */ new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
function isPlannedForToday(metadata) {
  const effortDay = metadata.ems__Effort_day;
  if (!effortDay) return false;
  const todayString = getTodayDateString();
  if (typeof effortDay === "string") {
    const cleanValue = effortDay.replace(/["'[\]]/g, "").trim();
    return cleanValue === todayString;
  }
  if (Array.isArray(effortDay) && effortDay.length > 0) {
    const cleanValue = String(effortDay[0]).replace(/["'[\]]/g, "").trim();
    return cleanValue === todayString;
  }
  return false;
}
function canPlanOnToday(context) {
  if (!isEffort(context.instanceClass)) return false;
  if (isPlannedForToday(context.metadata)) return false;
  return true;
}
function canPlanForEvening(context) {
  if (!hasClass(context.instanceClass, AssetClass.TASK) && !hasClass(context.instanceClass, AssetClass.MEETING)) return false;
  return hasStatus(context.currentStatus, EffortStatus.BACKLOG);
}
function hasEffortDay(metadata) {
  const effortDay = metadata.ems__Effort_day;
  if (!effortDay) return false;
  if (typeof effortDay === "string") {
    const cleanValue = effortDay.replace(/["'[\]]/g, "").trim();
    return cleanValue.length > 0;
  }
  if (Array.isArray(effortDay) && effortDay.length > 0) {
    const cleanValue = String(effortDay[0]).replace(/["'[\]]/g, "").trim();
    return cleanValue.length > 0;
  }
  return false;
}
function canShiftDayBackward(context) {
  if (!isEffort(context.instanceClass)) return false;
  return hasEffortDay(context.metadata);
}
function canShiftDayForward(context) {
  if (!isEffort(context.instanceClass)) return false;
  return hasEffortDay(context.metadata);
}
function canSetDraftStatus(context) {
  if (!isEffort(context.instanceClass)) return false;
  return !context.currentStatus;
}
function canMoveToBacklog(context) {
  if (!isEffort(context.instanceClass)) return false;
  return hasStatus(context.currentStatus, EffortStatus.DRAFT);
}
function canMoveToAnalysis(context) {
  if (!hasClass(context.instanceClass, AssetClass.PROJECT)) return false;
  return hasStatus(context.currentStatus, EffortStatus.BACKLOG);
}
function canMoveToToDo(context) {
  if (!hasClass(context.instanceClass, AssetClass.PROJECT)) return false;
  return hasStatus(context.currentStatus, EffortStatus.ANALYSIS);
}
function canStartEffort(context) {
  if (!isEffort(context.instanceClass)) return false;
  if (hasClass(context.instanceClass, AssetClass.TASK) || hasClass(context.instanceClass, AssetClass.MEETING)) {
    return hasStatus(context.currentStatus, EffortStatus.BACKLOG);
  }
  if (hasClass(context.instanceClass, AssetClass.PROJECT)) {
    return hasStatus(context.currentStatus, EffortStatus.TODO);
  }
  return false;
}
function canMarkDone(context) {
  if (!isEffort(context.instanceClass)) return false;
  return hasStatus(context.currentStatus, EffortStatus.DOING);
}
function canTrashEffort(context) {
  if (!isEffort(context.instanceClass)) return false;
  if (!context.currentStatus) return true;
  const statuses = Array.isArray(context.currentStatus) ? context.currentStatus : [context.currentStatus];
  const hasTrashedOrDone = statuses.some((status) => {
    const cleanStatus = WikiLinkHelpers.normalize(status);
    return cleanStatus === EffortStatus.TRASHED || cleanStatus === EffortStatus.DONE;
  });
  return !hasTrashedOrDone;
}
function canArchiveTask(context) {
  return !isAssetArchived(context.isArchived);
}
function canCleanProperties(context) {
  return hasEmptyProperties(context.metadata);
}
function canRepairFolder(context) {
  return needsFolderRepair(context.currentFolder, context.expectedFolder);
}
function canRenameToUid(context, currentFilename) {
  const uid = context.metadata.exo__Asset_uid;
  if (!uid) return false;
  if (hasClass(context.instanceClass, AssetClass.CONCEPT)) return false;
  return currentFilename !== uid;
}
function canVoteOnEffort(context) {
  if (!isEffort(context.instanceClass)) return false;
  if (isAssetArchived(context.isArchived)) return false;
  return true;
}
function canRollbackStatus(context) {
  if (!isEffort(context.instanceClass)) return false;
  if (isAssetArchived(context.isArchived)) return false;
  if (!context.currentStatus) return false;
  const statusValue = Array.isArray(context.currentStatus) ? context.currentStatus[0] : context.currentStatus;
  if (!statusValue) return false;
  const cleanStatus = WikiLinkHelpers.normalize(statusValue);
  if (cleanStatus === EffortStatus.TRASHED) return false;
  return true;
}
function canCreateRelatedTask(context) {
  if (!hasClass(context.instanceClass, AssetClass.TASK)) return false;
  if (isAssetArchived(context.isArchived)) return false;
  return true;
}
function canSetActiveFocus(context) {
  return hasClass(context.instanceClass, AssetClass.AREA);
}
function canCopyLabelToAliases(context) {
  const label = context.metadata.exo__Asset_label;
  if (!label || typeof label !== "string" || label.trim() === "") return false;
  const trimmedLabel = label.trim();
  const aliases = context.metadata.aliases;
  if (!aliases) return true;
  if (!Array.isArray(aliases)) return true;
  if (aliases.length === 0) return true;
  return !aliases.some((alias) => {
    if (typeof alias !== "string") return false;
    return alias.trim() === trimmedLabel;
  });
}
function canCreateNarrowerConcept(context) {
  return hasClass(context.instanceClass, AssetClass.CONCEPT);
}

const max = 'ffffffff-ffff-ffff-ffff-ffffffffffff';

const nil = '00000000-0000-0000-0000-000000000000';

const REGEX = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/i;

function validate(uuid) {
    return typeof uuid === 'string' && REGEX.test(uuid);
}

function parse(uuid) {
    if (!validate(uuid)) {
        throw TypeError('Invalid UUID');
    }
    let v;
    return Uint8Array.of((v = parseInt(uuid.slice(0, 8), 16)) >>> 24, (v >>> 16) & 0xff, (v >>> 8) & 0xff, v & 0xff, (v = parseInt(uuid.slice(9, 13), 16)) >>> 8, v & 0xff, (v = parseInt(uuid.slice(14, 18), 16)) >>> 8, v & 0xff, (v = parseInt(uuid.slice(19, 23), 16)) >>> 8, v & 0xff, ((v = parseInt(uuid.slice(24, 36), 16)) / 0x10000000000) & 0xff, (v / 0x100000000) & 0xff, (v >>> 24) & 0xff, (v >>> 16) & 0xff, (v >>> 8) & 0xff, v & 0xff);
}

const byteToHex = [];
for (let i = 0; i < 256; ++i) {
    byteToHex.push((i + 0x100).toString(16).slice(1));
}
function unsafeStringify(arr, offset = 0) {
    return (byteToHex[arr[offset + 0]] +
        byteToHex[arr[offset + 1]] +
        byteToHex[arr[offset + 2]] +
        byteToHex[arr[offset + 3]] +
        '-' +
        byteToHex[arr[offset + 4]] +
        byteToHex[arr[offset + 5]] +
        '-' +
        byteToHex[arr[offset + 6]] +
        byteToHex[arr[offset + 7]] +
        '-' +
        byteToHex[arr[offset + 8]] +
        byteToHex[arr[offset + 9]] +
        '-' +
        byteToHex[arr[offset + 10]] +
        byteToHex[arr[offset + 11]] +
        byteToHex[arr[offset + 12]] +
        byteToHex[arr[offset + 13]] +
        byteToHex[arr[offset + 14]] +
        byteToHex[arr[offset + 15]]).toLowerCase();
}
function stringify(arr, offset = 0) {
    const uuid = unsafeStringify(arr, offset);
    if (!validate(uuid)) {
        throw TypeError('Stringified UUID is invalid');
    }
    return uuid;
}

let getRandomValues;
const rnds8 = new Uint8Array(16);
function rng() {
    if (!getRandomValues) {
        if (typeof crypto === 'undefined' || !crypto.getRandomValues) {
            throw new Error('crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported');
        }
        getRandomValues = crypto.getRandomValues.bind(crypto);
    }
    return getRandomValues(rnds8);
}

const _state$1 = {};
function v1(options, buf, offset) {
    let bytes;
    const isV6 = options?._v6 ?? false;
    if (options) {
        const optionsKeys = Object.keys(options);
        if (optionsKeys.length === 1 && optionsKeys[0] === '_v6') {
            options = undefined;
        }
    }
    if (options) {
        bytes = v1Bytes(options.random ?? options.rng?.() ?? rng(), options.msecs, options.nsecs, options.clockseq, options.node, buf, offset);
    }
    else {
        const now = Date.now();
        const rnds = rng();
        updateV1State(_state$1, now, rnds);
        bytes = v1Bytes(rnds, _state$1.msecs, _state$1.nsecs, isV6 ? undefined : _state$1.clockseq, isV6 ? undefined : _state$1.node, buf, offset);
    }
    return buf ?? unsafeStringify(bytes);
}
function updateV1State(state, now, rnds) {
    state.msecs ??= -Infinity;
    state.nsecs ??= 0;
    if (now === state.msecs) {
        state.nsecs++;
        if (state.nsecs >= 10000) {
            state.node = undefined;
            state.nsecs = 0;
        }
    }
    else if (now > state.msecs) {
        state.nsecs = 0;
    }
    else if (now < state.msecs) {
        state.node = undefined;
    }
    if (!state.node) {
        state.node = rnds.slice(10, 16);
        state.node[0] |= 0x01;
        state.clockseq = ((rnds[8] << 8) | rnds[9]) & 0x3fff;
    }
    state.msecs = now;
    return state;
}
function v1Bytes(rnds, msecs, nsecs, clockseq, node, buf, offset = 0) {
    if (rnds.length < 16) {
        throw new Error('Random bytes length must be >= 16');
    }
    if (!buf) {
        buf = new Uint8Array(16);
        offset = 0;
    }
    else {
        if (offset < 0 || offset + 16 > buf.length) {
            throw new RangeError(`UUID byte range ${offset}:${offset + 15} is out of buffer bounds`);
        }
    }
    msecs ??= Date.now();
    nsecs ??= 0;
    clockseq ??= ((rnds[8] << 8) | rnds[9]) & 0x3fff;
    node ??= rnds.slice(10, 16);
    msecs += 12219292800000;
    const tl = ((msecs & 0xfffffff) * 10000 + nsecs) % 0x100000000;
    buf[offset++] = (tl >>> 24) & 0xff;
    buf[offset++] = (tl >>> 16) & 0xff;
    buf[offset++] = (tl >>> 8) & 0xff;
    buf[offset++] = tl & 0xff;
    const tmh = ((msecs / 0x100000000) * 10000) & 0xfffffff;
    buf[offset++] = (tmh >>> 8) & 0xff;
    buf[offset++] = tmh & 0xff;
    buf[offset++] = ((tmh >>> 24) & 0xf) | 0x10;
    buf[offset++] = (tmh >>> 16) & 0xff;
    buf[offset++] = (clockseq >>> 8) | 0x80;
    buf[offset++] = clockseq & 0xff;
    for (let n = 0; n < 6; ++n) {
        buf[offset++] = node[n];
    }
    return buf;
}

function v1ToV6(uuid) {
    const v1Bytes = typeof uuid === 'string' ? parse(uuid) : uuid;
    const v6Bytes = _v1ToV6(v1Bytes);
    return typeof uuid === 'string' ? unsafeStringify(v6Bytes) : v6Bytes;
}
function _v1ToV6(v1Bytes) {
    return Uint8Array.of(((v1Bytes[6] & 0x0f) << 4) | ((v1Bytes[7] >> 4) & 0x0f), ((v1Bytes[7] & 0x0f) << 4) | ((v1Bytes[4] & 0xf0) >> 4), ((v1Bytes[4] & 0x0f) << 4) | ((v1Bytes[5] & 0xf0) >> 4), ((v1Bytes[5] & 0x0f) << 4) | ((v1Bytes[0] & 0xf0) >> 4), ((v1Bytes[0] & 0x0f) << 4) | ((v1Bytes[1] & 0xf0) >> 4), ((v1Bytes[1] & 0x0f) << 4) | ((v1Bytes[2] & 0xf0) >> 4), 0x60 | (v1Bytes[2] & 0x0f), v1Bytes[3], v1Bytes[8], v1Bytes[9], v1Bytes[10], v1Bytes[11], v1Bytes[12], v1Bytes[13], v1Bytes[14], v1Bytes[15]);
}

function md5(bytes) {
    const words = uint8ToUint32(bytes);
    const md5Bytes = wordsToMd5(words, bytes.length * 8);
    return uint32ToUint8(md5Bytes);
}
function uint32ToUint8(input) {
    const bytes = new Uint8Array(input.length * 4);
    for (let i = 0; i < input.length * 4; i++) {
        bytes[i] = (input[i >> 2] >>> ((i % 4) * 8)) & 0xff;
    }
    return bytes;
}
function getOutputLength(inputLength8) {
    return (((inputLength8 + 64) >>> 9) << 4) + 14 + 1;
}
function wordsToMd5(x, len) {
    const xpad = new Uint32Array(getOutputLength(len)).fill(0);
    xpad.set(x);
    xpad[len >> 5] |= 0x80 << len % 32;
    xpad[xpad.length - 1] = len;
    x = xpad;
    let a = 1732584193;
    let b = -271733879;
    let c = -1732584194;
    let d = 271733878;
    for (let i = 0; i < x.length; i += 16) {
        const olda = a;
        const oldb = b;
        const oldc = c;
        const oldd = d;
        a = md5ff(a, b, c, d, x[i], 7, -680876936);
        d = md5ff(d, a, b, c, x[i + 1], 12, -389564586);
        c = md5ff(c, d, a, b, x[i + 2], 17, 606105819);
        b = md5ff(b, c, d, a, x[i + 3], 22, -1044525330);
        a = md5ff(a, b, c, d, x[i + 4], 7, -176418897);
        d = md5ff(d, a, b, c, x[i + 5], 12, 1200080426);
        c = md5ff(c, d, a, b, x[i + 6], 17, -1473231341);
        b = md5ff(b, c, d, a, x[i + 7], 22, -45705983);
        a = md5ff(a, b, c, d, x[i + 8], 7, 1770035416);
        d = md5ff(d, a, b, c, x[i + 9], 12, -1958414417);
        c = md5ff(c, d, a, b, x[i + 10], 17, -42063);
        b = md5ff(b, c, d, a, x[i + 11], 22, -1990404162);
        a = md5ff(a, b, c, d, x[i + 12], 7, 1804603682);
        d = md5ff(d, a, b, c, x[i + 13], 12, -40341101);
        c = md5ff(c, d, a, b, x[i + 14], 17, -1502002290);
        b = md5ff(b, c, d, a, x[i + 15], 22, 1236535329);
        a = md5gg(a, b, c, d, x[i + 1], 5, -165796510);
        d = md5gg(d, a, b, c, x[i + 6], 9, -1069501632);
        c = md5gg(c, d, a, b, x[i + 11], 14, 643717713);
        b = md5gg(b, c, d, a, x[i], 20, -373897302);
        a = md5gg(a, b, c, d, x[i + 5], 5, -701558691);
        d = md5gg(d, a, b, c, x[i + 10], 9, 38016083);
        c = md5gg(c, d, a, b, x[i + 15], 14, -660478335);
        b = md5gg(b, c, d, a, x[i + 4], 20, -405537848);
        a = md5gg(a, b, c, d, x[i + 9], 5, 568446438);
        d = md5gg(d, a, b, c, x[i + 14], 9, -1019803690);
        c = md5gg(c, d, a, b, x[i + 3], 14, -187363961);
        b = md5gg(b, c, d, a, x[i + 8], 20, 1163531501);
        a = md5gg(a, b, c, d, x[i + 13], 5, -1444681467);
        d = md5gg(d, a, b, c, x[i + 2], 9, -51403784);
        c = md5gg(c, d, a, b, x[i + 7], 14, 1735328473);
        b = md5gg(b, c, d, a, x[i + 12], 20, -1926607734);
        a = md5hh(a, b, c, d, x[i + 5], 4, -378558);
        d = md5hh(d, a, b, c, x[i + 8], 11, -2022574463);
        c = md5hh(c, d, a, b, x[i + 11], 16, 1839030562);
        b = md5hh(b, c, d, a, x[i + 14], 23, -35309556);
        a = md5hh(a, b, c, d, x[i + 1], 4, -1530992060);
        d = md5hh(d, a, b, c, x[i + 4], 11, 1272893353);
        c = md5hh(c, d, a, b, x[i + 7], 16, -155497632);
        b = md5hh(b, c, d, a, x[i + 10], 23, -1094730640);
        a = md5hh(a, b, c, d, x[i + 13], 4, 681279174);
        d = md5hh(d, a, b, c, x[i], 11, -358537222);
        c = md5hh(c, d, a, b, x[i + 3], 16, -722521979);
        b = md5hh(b, c, d, a, x[i + 6], 23, 76029189);
        a = md5hh(a, b, c, d, x[i + 9], 4, -640364487);
        d = md5hh(d, a, b, c, x[i + 12], 11, -421815835);
        c = md5hh(c, d, a, b, x[i + 15], 16, 530742520);
        b = md5hh(b, c, d, a, x[i + 2], 23, -995338651);
        a = md5ii(a, b, c, d, x[i], 6, -198630844);
        d = md5ii(d, a, b, c, x[i + 7], 10, 1126891415);
        c = md5ii(c, d, a, b, x[i + 14], 15, -1416354905);
        b = md5ii(b, c, d, a, x[i + 5], 21, -57434055);
        a = md5ii(a, b, c, d, x[i + 12], 6, 1700485571);
        d = md5ii(d, a, b, c, x[i + 3], 10, -1894986606);
        c = md5ii(c, d, a, b, x[i + 10], 15, -1051523);
        b = md5ii(b, c, d, a, x[i + 1], 21, -2054922799);
        a = md5ii(a, b, c, d, x[i + 8], 6, 1873313359);
        d = md5ii(d, a, b, c, x[i + 15], 10, -30611744);
        c = md5ii(c, d, a, b, x[i + 6], 15, -1560198380);
        b = md5ii(b, c, d, a, x[i + 13], 21, 1309151649);
        a = md5ii(a, b, c, d, x[i + 4], 6, -145523070);
        d = md5ii(d, a, b, c, x[i + 11], 10, -1120210379);
        c = md5ii(c, d, a, b, x[i + 2], 15, 718787259);
        b = md5ii(b, c, d, a, x[i + 9], 21, -343485551);
        a = safeAdd(a, olda);
        b = safeAdd(b, oldb);
        c = safeAdd(c, oldc);
        d = safeAdd(d, oldd);
    }
    return Uint32Array.of(a, b, c, d);
}
function uint8ToUint32(input) {
    if (input.length === 0) {
        return new Uint32Array();
    }
    const output = new Uint32Array(getOutputLength(input.length * 8)).fill(0);
    for (let i = 0; i < input.length; i++) {
        output[i >> 2] |= (input[i] & 0xff) << ((i % 4) * 8);
    }
    return output;
}
function safeAdd(x, y) {
    const lsw = (x & 0xffff) + (y & 0xffff);
    const msw = (x >> 16) + (y >> 16) + (lsw >> 16);
    return (msw << 16) | (lsw & 0xffff);
}
function bitRotateLeft(num, cnt) {
    return (num << cnt) | (num >>> (32 - cnt));
}
function md5cmn(q, a, b, x, s, t) {
    return safeAdd(bitRotateLeft(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b);
}
function md5ff(a, b, c, d, x, s, t) {
    return md5cmn((b & c) | (~b & d), a, b, x, s, t);
}
function md5gg(a, b, c, d, x, s, t) {
    return md5cmn((b & d) | (c & ~d), a, b, x, s, t);
}
function md5hh(a, b, c, d, x, s, t) {
    return md5cmn(b ^ c ^ d, a, b, x, s, t);
}
function md5ii(a, b, c, d, x, s, t) {
    return md5cmn(c ^ (b | ~d), a, b, x, s, t);
}

function stringToBytes(str) {
    str = unescape(encodeURIComponent(str));
    const bytes = new Uint8Array(str.length);
    for (let i = 0; i < str.length; ++i) {
        bytes[i] = str.charCodeAt(i);
    }
    return bytes;
}
const DNS = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
const URL = '6ba7b811-9dad-11d1-80b4-00c04fd430c8';
function v35(version, hash, value, namespace, buf, offset) {
    const valueBytes = typeof value === 'string' ? stringToBytes(value) : value;
    const namespaceBytes = typeof namespace === 'string' ? parse(namespace) : namespace;
    if (typeof namespace === 'string') {
        namespace = parse(namespace);
    }
    if (namespace?.length !== 16) {
        throw TypeError('Namespace must be array-like (16 iterable integer values, 0-255)');
    }
    let bytes = new Uint8Array(16 + valueBytes.length);
    bytes.set(namespaceBytes);
    bytes.set(valueBytes, namespaceBytes.length);
    bytes = hash(bytes);
    bytes[6] = (bytes[6] & 0x0f) | version;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    if (buf) {
        offset = offset || 0;
        for (let i = 0; i < 16; ++i) {
            buf[offset + i] = bytes[i];
        }
        return buf;
    }
    return unsafeStringify(bytes);
}

function v3(value, namespace, buf, offset) {
    return v35(0x30, md5, value, namespace, buf, offset);
}
v3.DNS = DNS;
v3.URL = URL;

const randomUUID = typeof crypto !== 'undefined' && crypto.randomUUID && crypto.randomUUID.bind(crypto);
const native = { randomUUID };

function v4(options, buf, offset) {
    if (native.randomUUID && !buf && !options) {
        return native.randomUUID();
    }
    options = options || {};
    const rnds = options.random ?? options.rng?.() ?? rng();
    if (rnds.length < 16) {
        throw new Error('Random bytes length must be >= 16');
    }
    rnds[6] = (rnds[6] & 0x0f) | 0x40;
    rnds[8] = (rnds[8] & 0x3f) | 0x80;
    if (buf) {
        offset = offset || 0;
        if (offset < 0 || offset + 16 > buf.length) {
            throw new RangeError(`UUID byte range ${offset}:${offset + 15} is out of buffer bounds`);
        }
        for (let i = 0; i < 16; ++i) {
            buf[offset + i] = rnds[i];
        }
        return buf;
    }
    return unsafeStringify(rnds);
}

function f(s, x, y, z) {
    switch (s) {
        case 0:
            return (x & y) ^ (~x & z);
        case 1:
            return x ^ y ^ z;
        case 2:
            return (x & y) ^ (x & z) ^ (y & z);
        case 3:
            return x ^ y ^ z;
    }
}
function ROTL(x, n) {
    return (x << n) | (x >>> (32 - n));
}
function sha1(bytes) {
    const K = [0x5a827999, 0x6ed9eba1, 0x8f1bbcdc, 0xca62c1d6];
    const H = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476, 0xc3d2e1f0];
    const newBytes = new Uint8Array(bytes.length + 1);
    newBytes.set(bytes);
    newBytes[bytes.length] = 0x80;
    bytes = newBytes;
    const l = bytes.length / 4 + 2;
    const N = Math.ceil(l / 16);
    const M = new Array(N);
    for (let i = 0; i < N; ++i) {
        const arr = new Uint32Array(16);
        for (let j = 0; j < 16; ++j) {
            arr[j] =
                (bytes[i * 64 + j * 4] << 24) |
                    (bytes[i * 64 + j * 4 + 1] << 16) |
                    (bytes[i * 64 + j * 4 + 2] << 8) |
                    bytes[i * 64 + j * 4 + 3];
        }
        M[i] = arr;
    }
    M[N - 1][14] = ((bytes.length - 1) * 8) / Math.pow(2, 32);
    M[N - 1][14] = Math.floor(M[N - 1][14]);
    M[N - 1][15] = ((bytes.length - 1) * 8) & 0xffffffff;
    for (let i = 0; i < N; ++i) {
        const W = new Uint32Array(80);
        for (let t = 0; t < 16; ++t) {
            W[t] = M[i][t];
        }
        for (let t = 16; t < 80; ++t) {
            W[t] = ROTL(W[t - 3] ^ W[t - 8] ^ W[t - 14] ^ W[t - 16], 1);
        }
        let a = H[0];
        let b = H[1];
        let c = H[2];
        let d = H[3];
        let e = H[4];
        for (let t = 0; t < 80; ++t) {
            const s = Math.floor(t / 20);
            const T = (ROTL(a, 5) + f(s, b, c, d) + e + K[s] + W[t]) >>> 0;
            e = d;
            d = c;
            c = ROTL(b, 30) >>> 0;
            b = a;
            a = T;
        }
        H[0] = (H[0] + a) >>> 0;
        H[1] = (H[1] + b) >>> 0;
        H[2] = (H[2] + c) >>> 0;
        H[3] = (H[3] + d) >>> 0;
        H[4] = (H[4] + e) >>> 0;
    }
    return Uint8Array.of(H[0] >> 24, H[0] >> 16, H[0] >> 8, H[0], H[1] >> 24, H[1] >> 16, H[1] >> 8, H[1], H[2] >> 24, H[2] >> 16, H[2] >> 8, H[2], H[3] >> 24, H[3] >> 16, H[3] >> 8, H[3], H[4] >> 24, H[4] >> 16, H[4] >> 8, H[4]);
}

function v5(value, namespace, buf, offset) {
    return v35(0x50, sha1, value, namespace, buf, offset);
}
v5.DNS = DNS;
v5.URL = URL;

function v6(options, buf, offset) {
    options ??= {};
    offset ??= 0;
    let bytes = v1({ ...options, _v6: true }, new Uint8Array(16));
    bytes = v1ToV6(bytes);
    if (buf) {
        for (let i = 0; i < 16; i++) {
            buf[offset + i] = bytes[i];
        }
        return buf;
    }
    return unsafeStringify(bytes);
}

function v6ToV1(uuid) {
    const v6Bytes = typeof uuid === 'string' ? parse(uuid) : uuid;
    const v1Bytes = _v6ToV1(v6Bytes);
    return typeof uuid === 'string' ? unsafeStringify(v1Bytes) : v1Bytes;
}
function _v6ToV1(v6Bytes) {
    return Uint8Array.of(((v6Bytes[3] & 0x0f) << 4) | ((v6Bytes[4] >> 4) & 0x0f), ((v6Bytes[4] & 0x0f) << 4) | ((v6Bytes[5] & 0xf0) >> 4), ((v6Bytes[5] & 0x0f) << 4) | (v6Bytes[6] & 0x0f), v6Bytes[7], ((v6Bytes[1] & 0x0f) << 4) | ((v6Bytes[2] & 0xf0) >> 4), ((v6Bytes[2] & 0x0f) << 4) | ((v6Bytes[3] & 0xf0) >> 4), 0x10 | ((v6Bytes[0] & 0xf0) >> 4), ((v6Bytes[0] & 0x0f) << 4) | ((v6Bytes[1] & 0xf0) >> 4), v6Bytes[8], v6Bytes[9], v6Bytes[10], v6Bytes[11], v6Bytes[12], v6Bytes[13], v6Bytes[14], v6Bytes[15]);
}

const _state = {};
function v7(options, buf, offset) {
    let bytes;
    if (options) {
        bytes = v7Bytes(options.random ?? options.rng?.() ?? rng(), options.msecs, options.seq, buf, offset);
    }
    else {
        const now = Date.now();
        const rnds = rng();
        updateV7State(_state, now, rnds);
        bytes = v7Bytes(rnds, _state.msecs, _state.seq, buf, offset);
    }
    return buf ?? unsafeStringify(bytes);
}
function updateV7State(state, now, rnds) {
    state.msecs ??= -Infinity;
    state.seq ??= 0;
    if (now > state.msecs) {
        state.seq = (rnds[6] << 23) | (rnds[7] << 16) | (rnds[8] << 8) | rnds[9];
        state.msecs = now;
    }
    else {
        state.seq = (state.seq + 1) | 0;
        if (state.seq === 0) {
            state.msecs++;
        }
    }
    return state;
}
function v7Bytes(rnds, msecs, seq, buf, offset = 0) {
    if (rnds.length < 16) {
        throw new Error('Random bytes length must be >= 16');
    }
    if (!buf) {
        buf = new Uint8Array(16);
        offset = 0;
    }
    else {
        if (offset < 0 || offset + 16 > buf.length) {
            throw new RangeError(`UUID byte range ${offset}:${offset + 15} is out of buffer bounds`);
        }
    }
    msecs ??= Date.now();
    seq ??= ((rnds[6] * 0x7f) << 24) | (rnds[7] << 16) | (rnds[8] << 8) | rnds[9];
    buf[offset++] = (msecs / 0x10000000000) & 0xff;
    buf[offset++] = (msecs / 0x100000000) & 0xff;
    buf[offset++] = (msecs / 0x1000000) & 0xff;
    buf[offset++] = (msecs / 0x10000) & 0xff;
    buf[offset++] = (msecs / 0x100) & 0xff;
    buf[offset++] = msecs & 0xff;
    buf[offset++] = 0x70 | ((seq >>> 28) & 0x0f);
    buf[offset++] = (seq >>> 20) & 0xff;
    buf[offset++] = 0x80 | ((seq >>> 14) & 0x3f);
    buf[offset++] = (seq >>> 6) & 0xff;
    buf[offset++] = ((seq << 2) & 0xff) | (rnds[10] & 0x03);
    buf[offset++] = rnds[11];
    buf[offset++] = rnds[12];
    buf[offset++] = rnds[13];
    buf[offset++] = rnds[14];
    buf[offset++] = rnds[15];
    return buf;
}

function version(uuid) {
    if (!validate(uuid)) {
        throw TypeError('Invalid UUID');
    }
    return parseInt(uuid.slice(14, 15), 16);
}

class MetadataHelpers {
  static findAllReferencingProperties(metadata, currentFileName) {
    const properties = [];
    for (const [key, value] of Object.entries(metadata)) {
      if (this.containsReference(value, currentFileName)) {
        properties.push(key);
      }
    }
    return properties;
  }
  static findReferencingProperty(metadata, currentFileName) {
    for (const [key, value] of Object.entries(metadata)) {
      if (this.containsReference(value, currentFileName)) {
        return key;
      }
    }
    return void 0;
  }
  static containsReference(value, fileName) {
    if (!value) return false;
    const cleanName = fileName.replace(/\.md$/, "");
    if (typeof value === "string") {
      return value.includes(`[[${cleanName}]]`) || value.includes(cleanName);
    }
    if (Array.isArray(value)) {
      return value.some((v) => this.containsReference(v, fileName));
    }
    return false;
  }
  static isAssetArchived(metadata) {
    if (metadata?.exo__Asset_isArchived === true) {
      return true;
    }
    const archivedValue = metadata?.archived;
    if (archivedValue === void 0 || archivedValue === null) {
      return false;
    }
    if (typeof archivedValue === "boolean") {
      return archivedValue;
    }
    if (typeof archivedValue === "number") {
      return archivedValue !== 0;
    }
    if (typeof archivedValue === "string") {
      const normalized = archivedValue.toLowerCase().trim();
      return normalized === "true" || normalized === "yes" || normalized === "1";
    }
    return false;
  }
  static getPropertyValue(relation, propertyName) {
    if (propertyName === "Name") return relation.title;
    if (propertyName === "title") return relation.title;
    if (propertyName === "created") return relation.created;
    if (propertyName === "modified") return relation.modified;
    if (propertyName === "path") return relation.path;
    return relation.metadata?.[propertyName];
  }
  static ensureQuoted(value) {
    if (!value || value === '""') return '""';
    if (value.startsWith('"') && value.endsWith('"')) return value;
    return `"${value}"`;
  }
  static buildFileContent(frontmatter, bodyContent) {
    const frontmatterLines = Object.entries(frontmatter).map(([key, value]) => {
      if (Array.isArray(value)) {
        const arrayItems = value.map((item) => `  - ${item}`).join("\n");
        return `${key}:
${arrayItems}`;
      }
      return `${key}: ${value}`;
    }).join("\n");
    const body = bodyContent ? `
${bodyContent}
` : "\n";
    return `---
${frontmatterLines}
---
${body}`;
  }
}

class DateFormatter {
  /**
   * Format date to local timestamp string in ISO 8601 format (without timezone).
   *
   * Format: `YYYY-MM-DDTHH:MM:SS`
   *
   * Used for frontmatter properties like:
   * - `ems__Effort_created`
   * - `ems__Effort_modified`
   * - `ems__Effort_archived`
   *
   * @param date - Date object to format
   * @returns ISO 8601 local timestamp string
   *
   * @example
   * ```typescript
   * const date = new Date('2025-10-24T14:30:45Z');
   * const timestamp = DateFormatter.toLocalTimestamp(date);
   * // "2025-10-24T14:30:45"
   * ```
   */
  static toLocalTimestamp(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  }
  /**
   * Format date to Obsidian wikilink format (quoted).
   *
   * Format: `"[[YYYY-MM-DD]]"`
   *
   * Used for frontmatter properties like:
   * - `ems__Effort_day` (daily note reference)
   * - `pn__DailyNote_day` (daily note date)
   *
   * Note: Returns quoted string ready for YAML frontmatter.
   *
   * @param date - Date object to format
   * @returns Quoted wikilink string
   *
   * @example
   * ```typescript
   * const date = new Date('2025-10-24T14:30:45Z');
   * const wikilink = DateFormatter.toDateWikilink(date);
   * // "[[2025-10-24]]"
   * ```
   */
  static toDateWikilink(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `"[[${year}-${month}-${day}]]"`;
  }
  /**
   * Get current date as wikilink format.
   *
   * Convenience method equivalent to `toDateWikilink(new Date())`.
   *
   * @returns Today's date as quoted wikilink
   *
   * @example
   * ```typescript
   * const today = DateFormatter.getTodayWikilink();
   * // "[[2025-10-24]]"
   * ```
   */
  static getTodayWikilink() {
    return DateFormatter.toDateWikilink(/* @__PURE__ */ new Date());
  }
  /**
   * Format date to simple date string (no brackets, no quotes).
   *
   * Format: `YYYY-MM-DD`
   *
   * Used for generating default labels or simple date formatting.
   *
   * @param date - Date object to format
   * @returns Simple date string
   *
   * @example
   * ```typescript
   * const date = new Date('2025-10-24T14:30:45Z');
   * const dateStr = DateFormatter.toDateString(date);
   * // "2025-10-24"
   * ```
   */
  static toDateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  /**
   * Parse wikilink format back to date string (without quotes).
   *
   * Extracts date from `"[[YYYY-MM-DD]]"` or `[[YYYY-MM-DD]]` format.
   *
   * @param wikilink - Wikilink string (with or without quotes)
   * @returns Date string in YYYY-MM-DD format, or null if invalid
   *
   * @example
   * ```typescript
   * const date1 = DateFormatter.parseWikilink('"[[2025-10-24]]"');
   * // "2025-10-24"
   *
   * const date2 = DateFormatter.parseWikilink('[[2025-10-24]]');
   * // "2025-10-24"
   *
   * const invalid = DateFormatter.parseWikilink('invalid');
   * // null
   * ```
   */
  static parseWikilink(wikilink) {
    const cleaned = wikilink.replace(/^["']|["']$/g, "");
    const match = cleaned.match(/\[\[(\d{4}-\d{2}-\d{2})\]\]/);
    return match ? match[1] : null;
  }
  /**
   * Add days to a date and return new date.
   *
   * @param date - Starting date
   * @param days - Number of days to add (negative for subtraction)
   * @returns New date object with days added
   *
   * @example
   * ```typescript
   * const today = new Date('2025-10-24');
   * const tomorrow = DateFormatter.addDays(today, 1);
   * const yesterday = DateFormatter.addDays(today, -1);
   * ```
   */
  static addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }
  /**
   * Check if two dates are on the same day (ignoring time).
   *
   * @param date1 - First date
   * @param date2 - Second date
   * @returns True if dates are on same day
   *
   * @example
   * ```typescript
   * const morning = new Date('2025-10-24T08:00:00');
   * const evening = new Date('2025-10-24T20:00:00');
   * const isSameDay = DateFormatter.isSameDay(morning, evening);
   * // true
   * ```
   */
  static isSameDay(date1, date2) {
    return date1.getFullYear() === date2.getFullYear() && date1.getMonth() === date2.getMonth() && date1.getDate() === date2.getDate();
  }
}

class MetadataExtractor {
  constructor(metadataCache) {
    this.metadataCache = metadataCache;
  }
  extractMetadata(file) {
    if (!file) return {};
    const cache = this.metadataCache.getFileCache(file);
    return cache?.frontmatter || {};
  }
  extractInstanceClass(metadata) {
    return metadata.exo__Instance_class || null;
  }
  extractStatus(metadata) {
    return metadata.ems__Effort_status || null;
  }
  extractIsArchived(metadata) {
    const archived = metadata.exo__Asset_isArchived;
    if (archived === true || archived === 1) return true;
    if (typeof archived === "string") {
      const lowerValue = archived.toLowerCase();
      return lowerValue === "true" || lowerValue === "yes";
    }
    return false;
  }
  static extractIsDefinedBy(sourceMetadata) {
    let isDefinedBy = sourceMetadata.exo__Asset_isDefinedBy || '""';
    if (Array.isArray(isDefinedBy)) {
      isDefinedBy = isDefinedBy[0] || '""';
    }
    return isDefinedBy;
  }
  extractExpectedFolder(metadata) {
    const isDefinedBy = metadata.exo__Asset_isDefinedBy;
    if (!isDefinedBy) return null;
    const definedByValue = Array.isArray(isDefinedBy) ? isDefinedBy[0] : isDefinedBy;
    if (!definedByValue || typeof definedByValue !== "string") return null;
    const cleanValue = definedByValue.replace(/["'[\]]/g, "").trim();
    if (!cleanValue) return null;
    const parts = cleanValue.split("/");
    parts.pop();
    return parts.join("/");
  }
  extractCommandVisibilityContext(file) {
    const metadata = this.extractMetadata(file);
    const instanceClass = this.extractInstanceClass(metadata);
    const currentStatus = this.extractStatus(metadata);
    const isArchived = this.extractIsArchived(metadata);
    const currentFolder = file.parent?.path || "";
    const expectedFolder = this.extractExpectedFolder(metadata);
    return {
      instanceClass,
      currentStatus,
      metadata,
      isArchived,
      currentFolder,
      expectedFolder
    };
  }
  extractCache(file) {
    if (!file) return null;
    return this.metadataCache.getFileCache(file);
  }
}

const EFFORT_PROPERTY_MAP$1 = {
  [AssetClass.AREA]: "ems__Effort_area",
  [AssetClass.PROJECT]: "ems__Effort_parent",
  [AssetClass.TASK_PROTOTYPE]: "ems__Effort_prototype",
  [AssetClass.MEETING_PROTOTYPE]: "ems__Effort_prototype"
};
const INSTANCE_CLASS_MAP = {
  [AssetClass.AREA]: AssetClass.TASK,
  [AssetClass.PROJECT]: AssetClass.TASK,
  [AssetClass.TASK_PROTOTYPE]: AssetClass.TASK,
  [AssetClass.MEETING_PROTOTYPE]: AssetClass.MEETING
};
class TaskFrontmatterGenerator {
  generateTaskFrontmatter(sourceMetadata, sourceName, sourceClass, label, uid, taskSize) {
    const now = /* @__PURE__ */ new Date();
    const timestamp = DateFormatter.toLocalTimestamp(now);
    const isDefinedBy = MetadataExtractor.extractIsDefinedBy(sourceMetadata);
    const cleanSourceClass = WikiLinkHelpers.normalize(sourceClass);
    const effortProperty = EFFORT_PROPERTY_MAP$1[cleanSourceClass] || "ems__Effort_area";
    const instanceClass = INSTANCE_CLASS_MAP[cleanSourceClass] || AssetClass.TASK;
    const frontmatter = {};
    frontmatter["exo__Asset_isDefinedBy"] = MetadataHelpers.ensureQuoted(isDefinedBy);
    frontmatter["exo__Asset_uid"] = uid || v4();
    frontmatter["exo__Asset_createdAt"] = timestamp;
    frontmatter["exo__Instance_class"] = [`"[[${instanceClass}]]"`];
    frontmatter["ems__Effort_status"] = '"[[ems__EffortStatusDraft]]"';
    frontmatter[effortProperty] = `"[[${sourceName}]]"`;
    let finalLabel = label;
    if (instanceClass === AssetClass.MEETING && (!label || label.trim() === "")) {
      const baseLabel = sourceMetadata.exo__Asset_label || sourceName;
      const dateStr = DateFormatter.toDateString(now);
      finalLabel = `${baseLabel} ${dateStr}`;
    }
    if (finalLabel && finalLabel.trim() !== "") {
      const trimmedLabel = finalLabel.trim();
      frontmatter["exo__Asset_label"] = trimmedLabel;
      frontmatter["aliases"] = [trimmedLabel];
    }
    if (taskSize) {
      frontmatter["ems__Task_size"] = taskSize;
    }
    return frontmatter;
  }
  generateRelatedTaskFrontmatter(sourceMetadata, sourceName, label, uid, taskSize) {
    const now = /* @__PURE__ */ new Date();
    const timestamp = DateFormatter.toLocalTimestamp(now);
    const isDefinedBy = MetadataExtractor.extractIsDefinedBy(sourceMetadata);
    const frontmatter = {};
    frontmatter["exo__Asset_isDefinedBy"] = MetadataHelpers.ensureQuoted(isDefinedBy);
    frontmatter["exo__Asset_uid"] = uid || v4();
    frontmatter["exo__Asset_createdAt"] = timestamp;
    frontmatter["exo__Instance_class"] = [`"[[${AssetClass.TASK}]]"`];
    frontmatter["ems__Effort_status"] = '"[[ems__EffortStatusDraft]]"';
    frontmatter["exo__Asset_relates"] = [`"[[${sourceName}]]"`];
    if (label && label.trim() !== "") {
      const trimmedLabel = label.trim();
      frontmatter["exo__Asset_label"] = trimmedLabel;
      frontmatter["aliases"] = [trimmedLabel];
    }
    if (taskSize) {
      frontmatter["ems__Task_size"] = taskSize;
    }
    return frontmatter;
  }
}

class AlgorithmExtractor {
  extractH2Section(content, heading) {
    const lines = content.split("\n");
    const targetHeading = `## ${heading}`;
    let inSection = false;
    const sectionContent = [];
    for (const line of lines) {
      if (line.trim() === targetHeading) {
        inSection = true;
        continue;
      }
      if (inSection) {
        if (line.startsWith("## ") || line.startsWith("# ")) {
          break;
        }
        sectionContent.push(line);
      }
    }
    if (sectionContent.length === 0) {
      return null;
    }
    const content_text = sectionContent.join("\n").trim();
    return content_text || null;
  }
}

class TaskCreationService {
  constructor(vault) {
    this.vault = vault;
    this.frontmatterGenerator = new TaskFrontmatterGenerator();
    this.algorithmExtractor = new AlgorithmExtractor();
  }
  async createTask(sourceFile, sourceMetadata, sourceClass, label, taskSize) {
    const uid = v4();
    const fileName = `${uid}.md`;
    const frontmatter = this.frontmatterGenerator.generateTaskFrontmatter(
      sourceMetadata,
      sourceFile.basename,
      sourceClass,
      label,
      uid,
      taskSize
    );
    let bodyContent = "";
    const cleanSourceClass = WikiLinkHelpers.normalize(sourceClass);
    if (cleanSourceClass === AssetClass.TASK_PROTOTYPE) {
      const prototypeContent = await this.vault.read(sourceFile);
      const algorithmSection = this.algorithmExtractor.extractH2Section(
        prototypeContent,
        "Algorithm"
      );
      if (algorithmSection) {
        bodyContent = `## Algorithm

${algorithmSection}`;
      }
    }
    const fileContent = MetadataHelpers.buildFileContent(frontmatter, bodyContent);
    const folderPath = sourceFile.parent?.path || "";
    const filePath = folderPath ? `${folderPath}/${fileName}` : fileName;
    const createdFile = await this.vault.create(filePath, fileContent);
    return createdFile;
  }
  async createRelatedTask(sourceFile, sourceMetadata, label, taskSize) {
    const uid = v4();
    const fileName = `${uid}.md`;
    const frontmatter = this.frontmatterGenerator.generateRelatedTaskFrontmatter(
      sourceMetadata,
      sourceFile.basename,
      label,
      uid,
      taskSize
    );
    const fileContent = MetadataHelpers.buildFileContent(frontmatter);
    const folderPath = sourceFile.parent?.path || "";
    const filePath = folderPath ? `${folderPath}/${fileName}` : fileName;
    const createdFile = await this.vault.create(filePath, fileContent);
    await this.addRelationToSourceFile(sourceFile, uid);
    return createdFile;
  }
  generateTaskFrontmatter(sourceMetadata, sourceName, sourceClass, label, uid, taskSize) {
    return this.frontmatterGenerator.generateTaskFrontmatter(
      sourceMetadata,
      sourceName,
      sourceClass,
      label,
      uid,
      taskSize
    );
  }
  // Used only by unit tests via (service as any).generateRelatedTaskFrontmatter
  generateRelatedTaskFrontmatter(sourceMetadata, sourceName, label, uid, taskSize) {
    return this.frontmatterGenerator.generateRelatedTaskFrontmatter(
      sourceMetadata,
      sourceName,
      label,
      uid,
      taskSize
    );
  }
  // Used only by unit tests via (service as any).extractH2Section
  extractH2Section(content, heading) {
    return this.algorithmExtractor.extractH2Section(content, heading);
  }
  async addRelationToSourceFile(sourceFile, newTaskUid) {
    const content = await this.vault.read(sourceFile);
    const updatedContent = this.addRelationToFrontmatter(content, newTaskUid);
    await this.vault.modify(sourceFile, updatedContent);
  }
  addRelationToFrontmatter(content, relatedTaskUid) {
    const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---/;
    const match = content.match(frontmatterRegex);
    const lineEnding = content.includes("\r\n") ? "\r\n" : "\n";
    if (!match) {
      const newFrontmatter = `---${lineEnding}exo__Asset_relates:${lineEnding}  - "[[${relatedTaskUid}]]"${lineEnding}---${lineEnding}${content}`;
      return newFrontmatter;
    }
    const frontmatterContent = match[1];
    let updatedFrontmatter = frontmatterContent;
    if (updatedFrontmatter.includes("exo__Asset_relates:")) {
      const relatesMatch = updatedFrontmatter.match(/exo__Asset_relates:\r?\n((?: {2}- .*\r?\n)*)/);
      if (relatesMatch) {
        const existingItems = relatesMatch[1];
        const newItem = `  - "[[${relatedTaskUid}]]"${lineEnding}`;
        updatedFrontmatter = updatedFrontmatter.replace(
          /exo__Asset_relates:\r?\n((?: {2}- .*\r?\n)*)/,
          `exo__Asset_relates:${lineEnding}${existingItems}${newItem}`
        );
      }
    } else {
      updatedFrontmatter += `${lineEnding}exo__Asset_relates:${lineEnding}  - "[[${relatedTaskUid}]]"`;
    }
    return content.replace(
      frontmatterRegex,
      `---${lineEnding}${updatedFrontmatter}${lineEnding}---`
    );
  }
}

const EFFORT_PROPERTY_MAP = {
  [AssetClass.AREA]: "ems__Effort_area",
  [AssetClass.INITIATIVE]: "ems__Effort_parent",
  [AssetClass.PROJECT]: "ems__Effort_parent"
};
class ProjectCreationService {
  constructor(vault) {
    this.vault = vault;
  }
  async createProject(sourceFile, sourceMetadata, sourceClass, label) {
    const uid = v4();
    const fileName = `${uid}.md`;
    const frontmatter = this.generateProjectFrontmatter(
      sourceMetadata,
      sourceFile.basename,
      sourceClass,
      label,
      uid
    );
    const fileContent = MetadataHelpers.buildFileContent(frontmatter);
    const folderPath = sourceFile.parent?.path || "";
    const filePath = folderPath ? `${folderPath}/${fileName}` : fileName;
    const createdFile = await this.vault.create(filePath, fileContent);
    return createdFile;
  }
  generateProjectFrontmatter(sourceMetadata, sourceName, sourceClass, label, uid) {
    const now = /* @__PURE__ */ new Date();
    const timestamp = DateFormatter.toLocalTimestamp(now);
    const isDefinedBy = MetadataExtractor.extractIsDefinedBy(sourceMetadata);
    const cleanSourceClass = WikiLinkHelpers.normalize(sourceClass);
    const effortProperty = EFFORT_PROPERTY_MAP[cleanSourceClass] || "ems__Effort_area";
    const frontmatter = {};
    frontmatter["exo__Asset_isDefinedBy"] = MetadataHelpers.ensureQuoted(isDefinedBy);
    frontmatter["exo__Asset_uid"] = uid || v4();
    frontmatter["exo__Asset_createdAt"] = timestamp;
    frontmatter["exo__Instance_class"] = [`"[[${AssetClass.PROJECT}]]"`];
    frontmatter["ems__Effort_status"] = '"[[ems__EffortStatusDraft]]"';
    frontmatter[effortProperty] = `"[[${sourceName}]]"`;
    if (label && label.trim() !== "") {
      const trimmedLabel = label.trim();
      frontmatter["exo__Asset_label"] = trimmedLabel;
      frontmatter["aliases"] = [trimmedLabel];
    }
    return frontmatter;
  }
}

let FrontmatterService$1 = class FrontmatterService {
  static {
    /**
     * Regex pattern for matching YAML frontmatter blocks.
     * Matches: ---\n[content]\n---
     */
    this.FRONTMATTER_REGEX = /^---\n([\s\S]*?)\n---/;
  }
  /**
   * Parse frontmatter from markdown content.
   *
   * @param content - Full markdown file content
   * @returns Parse result with existence flag and content
   *
   * @example
   * ```typescript
   * const result = service.parse('---\nfoo: bar\n---\nBody');
   * // result.exists === true
   * // result.content === 'foo: bar'
   * ```
   */
  parse(content) {
    const match = content.match(FrontmatterService.FRONTMATTER_REGEX);
    if (!match) {
      return {
        exists: false,
        content: "",
        originalContent: content
      };
    }
    return {
      exists: true,
      content: match[1],
      originalContent: content
    };
  }
  /**
   * Update or add a property in frontmatter.
   *
   * - If frontmatter exists and has the property: updates value
   * - If frontmatter exists but lacks property: adds property
   * - If no frontmatter exists: creates frontmatter with property
   *
   * @param content - Full markdown file content
   * @param property - Property name (e.g., 'status', 'ems__Effort_status')
   * @param value - Property value (e.g., '"[[StatusDone]]"', 'true', '42')
   * @returns Updated content with modified frontmatter
   *
   * @example
   * ```typescript
   * // Update existing
   * const result1 = service.updateProperty(
   *   '---\nstatus: draft\n---\nBody',
   *   'status',
   *   'published'
   * );
   * // result1 === '---\nstatus: published\n---\nBody'
   *
   * // Add new property
   * const result2 = service.updateProperty(
   *   '---\nfoo: bar\n---\nBody',
   *   'status',
   *   'draft'
   * );
   * // result2 === '---\nfoo: bar\nstatus: draft\n---\nBody'
   *
   * // Create frontmatter if missing
   * const result3 = service.updateProperty(
   *   'Body content',
   *   'status',
   *   'draft'
   * );
   * // result3 === '---\nstatus: draft\n---\nBody content'
   * ```
   */
  updateProperty(content, property, value) {
    const parsed = this.parse(content);
    if (!parsed.exists) {
      return this.createFrontmatter(content, { [property]: value });
    }
    let updatedFrontmatter = parsed.content;
    if (this.hasProperty(updatedFrontmatter, property)) {
      const propertyRegex = new RegExp(`${this.escapeRegex(property)}:.*$`, "m");
      updatedFrontmatter = updatedFrontmatter.replace(
        propertyRegex,
        `${property}: ${value}`
      );
    } else {
      const separator = updatedFrontmatter.length > 0 ? "\n" : "";
      updatedFrontmatter += `${separator}${property}: ${value}`;
    }
    return content.replace(
      FrontmatterService.FRONTMATTER_REGEX,
      `---
${updatedFrontmatter}
---`
    );
  }
  /**
   * Add a new property to frontmatter (alias for updateProperty).
   *
   * Convenience method with clearer semantics for adding new properties.
   *
   * @param content - Full markdown file content
   * @param property - Property name
   * @param value - Property value
   * @returns Updated content
   */
  addProperty(content, property, value) {
    return this.updateProperty(content, property, value);
  }
  /**
   * Remove a property from frontmatter.
   *
   * - If property exists: removes the line
   * - If property doesn't exist: returns content unchanged
   * - If no frontmatter exists: returns content unchanged
   *
   * @param content - Full markdown file content
   * @param property - Property name to remove
   * @returns Updated content with property removed
   *
   * @example
   * ```typescript
   * const result = service.removeProperty(
   *   '---\nfoo: bar\nstatus: draft\n---\nBody',
   *   'status'
   * );
   * // result === '---\nfoo: bar\n---\nBody'
   * ```
   */
  removeProperty(content, property) {
    const parsed = this.parse(content);
    if (!parsed.exists || !this.hasProperty(parsed.content, property)) {
      return content;
    }
    const propertyLineRegex = new RegExp(
      `
?${this.escapeRegex(property)}:.*$`,
      "m"
    );
    const updatedFrontmatter = parsed.content.replace(propertyLineRegex, "");
    return content.replace(
      FrontmatterService.FRONTMATTER_REGEX,
      `---
${updatedFrontmatter}
---`
    );
  }
  /**
   * Check if frontmatter contains a specific property.
   *
   * @param frontmatterContent - Frontmatter content (without --- delimiters)
   * @param property - Property name to check
   * @returns True if property exists
   *
   * @example
   * ```typescript
   * const hasStatus = service.hasProperty('foo: bar\nstatus: draft', 'status');
   * // hasStatus === true
   * ```
   */
  hasProperty(frontmatterContent, property) {
    return frontmatterContent.includes(`${property}:`);
  }
  /**
   * Create new frontmatter block with given properties.
   *
   * @param content - Original markdown content (without frontmatter)
   * @param properties - Object with property-value pairs
   * @returns Content with new frontmatter prepended
   *
   * @example
   * ```typescript
   * const result = service.createFrontmatter(
   *   'Body content',
   *   { status: 'draft', priority: 'high' }
   * );
   * // result === '---\nstatus: draft\npriority: high\n---\nBody content'
   * ```
   */
  createFrontmatter(content, properties) {
    const frontmatterLines = Object.entries(properties).map(
      ([key, value]) => `${key}: ${value}`
    );
    const frontmatterBlock = `---
${frontmatterLines.join("\n")}
---`;
    const separator = content.startsWith("\n") ? "" : "\n";
    return `${frontmatterBlock}${separator}${content}`;
  }
  /**
   * Get property value from frontmatter content.
   *
   * @param frontmatterContent - Frontmatter content (without --- delimiters)
   * @param property - Property name
   * @returns Property value or null if not found
   *
   * @example
   * ```typescript
   * const value = service.getPropertyValue(
   *   'foo: bar\nstatus: draft',
   *   'status'
   * );
   * // value === 'draft'
   * ```
   */
  getPropertyValue(frontmatterContent, property) {
    const propertyRegex = new RegExp(
      `${this.escapeRegex(property)}:\\s*(.*)$`,
      "m"
    );
    const match = frontmatterContent.match(propertyRegex);
    return match ? match[1].trim() : null;
  }
  /**
   * Escape special regex characters in property names.
   *
   * Handles property names with special characters like dots, underscores, etc.
   *
   * @param str - String to escape
   * @returns Escaped string safe for use in RegExp
   * @private
   */
  escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
};

class EffortStatusWorkflow {
  getPreviousStatus(currentStatus, instanceClass) {
    const normalizedStatus = this.normalizeStatus(currentStatus);
    if (normalizedStatus === EffortStatus.DRAFT) {
      return null;
    }
    if (normalizedStatus === EffortStatus.BACKLOG) {
      return this.wrapStatus(EffortStatus.DRAFT);
    }
    if (normalizedStatus === EffortStatus.ANALYSIS) {
      return this.wrapStatus(EffortStatus.BACKLOG);
    }
    if (normalizedStatus === EffortStatus.TODO) {
      return this.wrapStatus(EffortStatus.ANALYSIS);
    }
    if (normalizedStatus === EffortStatus.DOING) {
      const isProject = this.hasInstanceClass(instanceClass, AssetClass.PROJECT);
      return isProject ? this.wrapStatus(EffortStatus.TODO) : this.wrapStatus(EffortStatus.BACKLOG);
    }
    if (normalizedStatus === EffortStatus.DONE) {
      return this.wrapStatus(EffortStatus.DOING);
    }
    return void 0;
  }
  normalizeStatus(status) {
    return status.replace(/["'[\]]/g, "").trim();
  }
  wrapStatus(status) {
    return `"[[${status}]]"`;
  }
  hasInstanceClass(instanceClass, targetClass) {
    if (!instanceClass) return false;
    const classes = Array.isArray(instanceClass) ? instanceClass : [instanceClass];
    return classes.some(
      (cls) => cls.replace(/["'[\]]/g, "").trim() === targetClass
    );
  }
}

class StatusTimestampService {
  constructor(vault) {
    this.vault = vault;
    this.frontmatterService = new FrontmatterService$1();
  }
  async addStartTimestamp(taskFile) {
    const content = await this.vault.read(taskFile);
    const timestamp = DateFormatter.toLocalTimestamp(/* @__PURE__ */ new Date());
    const updated = this.frontmatterService.updateProperty(
      content,
      "ems__Effort_startTimestamp",
      timestamp
    );
    await this.vault.modify(taskFile, updated);
  }
  async addEndTimestamp(taskFile, date) {
    const content = await this.vault.read(taskFile);
    const targetDate = date || /* @__PURE__ */ new Date();
    const timestamp = DateFormatter.toLocalTimestamp(targetDate);
    const updated = this.frontmatterService.updateProperty(
      content,
      "ems__Effort_endTimestamp",
      timestamp
    );
    await this.vault.modify(taskFile, updated);
  }
  async addResolutionTimestamp(taskFile) {
    const content = await this.vault.read(taskFile);
    const timestamp = DateFormatter.toLocalTimestamp(/* @__PURE__ */ new Date());
    const updated = this.frontmatterService.updateProperty(
      content,
      "ems__Effort_resolutionTimestamp",
      timestamp
    );
    await this.vault.modify(taskFile, updated);
  }
  async addEndAndResolutionTimestamps(taskFile, date) {
    const content = await this.vault.read(taskFile);
    const targetDate = date || /* @__PURE__ */ new Date();
    const timestamp = DateFormatter.toLocalTimestamp(targetDate);
    let updated = this.frontmatterService.updateProperty(
      content,
      "ems__Effort_endTimestamp",
      timestamp
    );
    updated = this.frontmatterService.updateProperty(
      updated,
      "ems__Effort_resolutionTimestamp",
      timestamp
    );
    await this.vault.modify(taskFile, updated);
  }
  async removeStartTimestamp(taskFile) {
    const content = await this.vault.read(taskFile);
    const updated = this.frontmatterService.removeProperty(
      content,
      "ems__Effort_startTimestamp"
    );
    await this.vault.modify(taskFile, updated);
  }
  async removeEndTimestamp(taskFile) {
    const content = await this.vault.read(taskFile);
    const updated = this.frontmatterService.removeProperty(
      content,
      "ems__Effort_endTimestamp"
    );
    await this.vault.modify(taskFile, updated);
  }
  async removeResolutionTimestamp(taskFile) {
    const content = await this.vault.read(taskFile);
    const updated = this.frontmatterService.removeProperty(
      content,
      "ems__Effort_resolutionTimestamp"
    );
    await this.vault.modify(taskFile, updated);
  }
  async removeEndAndResolutionTimestamps(taskFile) {
    const content = await this.vault.read(taskFile);
    let updated = this.frontmatterService.removeProperty(
      content,
      "ems__Effort_endTimestamp"
    );
    updated = this.frontmatterService.removeProperty(
      updated,
      "ems__Effort_resolutionTimestamp"
    );
    await this.vault.modify(taskFile, updated);
  }
}

class TaskStatusService {
  constructor(vault) {
    this.vault = vault;
    this.frontmatterService = new FrontmatterService$1();
    this.workflow = new EffortStatusWorkflow();
    this.timestampService = new StatusTimestampService(vault);
  }
  async setDraftStatus(taskFile) {
    await this.updateStatus(taskFile, "ems__EffortStatusDraft");
  }
  async moveToBacklog(taskFile) {
    await this.updateStatus(taskFile, "ems__EffortStatusBacklog");
  }
  async moveToAnalysis(projectFile) {
    await this.updateStatus(projectFile, "ems__EffortStatusAnalysis");
  }
  async moveToToDo(projectFile) {
    await this.updateStatus(projectFile, "ems__EffortStatusToDo");
  }
  async startEffort(taskFile) {
    const content = await this.vault.read(taskFile);
    const timestamp = DateFormatter.toLocalTimestamp(/* @__PURE__ */ new Date());
    let updated = this.frontmatterService.updateProperty(
      content,
      "ems__Effort_status",
      '"[[ems__EffortStatusDoing]]"'
    );
    updated = this.frontmatterService.updateProperty(
      updated,
      "ems__Effort_startTimestamp",
      timestamp
    );
    await this.vault.modify(taskFile, updated);
  }
  async markTaskAsDone(taskFile) {
    const content = await this.vault.read(taskFile);
    const timestamp = DateFormatter.toLocalTimestamp(/* @__PURE__ */ new Date());
    let updated = this.frontmatterService.updateProperty(
      content,
      "ems__Effort_status",
      '"[[ems__EffortStatusDone]]"'
    );
    updated = this.frontmatterService.updateProperty(
      updated,
      "ems__Effort_endTimestamp",
      timestamp
    );
    updated = this.frontmatterService.updateProperty(
      updated,
      "ems__Effort_resolutionTimestamp",
      timestamp
    );
    await this.vault.modify(taskFile, updated);
  }
  async syncEffortEndTimestamp(taskFile, date) {
    await this.timestampService.addEndAndResolutionTimestamps(taskFile, date);
  }
  async trashEffort(taskFile) {
    const content = await this.vault.read(taskFile);
    const timestamp = DateFormatter.toLocalTimestamp(/* @__PURE__ */ new Date());
    let updated = this.frontmatterService.updateProperty(
      content,
      "ems__Effort_status",
      '"[[ems__EffortStatusTrashed]]"'
    );
    updated = this.frontmatterService.updateProperty(
      updated,
      "ems__Effort_resolutionTimestamp",
      timestamp
    );
    await this.vault.modify(taskFile, updated);
  }
  async archiveTask(taskFile) {
    const content = await this.vault.read(taskFile);
    const updated = this.frontmatterService.updateProperty(
      content,
      "archived",
      "true"
    );
    await this.vault.modify(taskFile, updated);
  }
  async planOnToday(taskFile) {
    const content = await this.vault.read(taskFile);
    const todayWikilink = DateFormatter.getTodayWikilink();
    const updated = this.frontmatterService.updateProperty(
      content,
      "ems__Effort_day",
      todayWikilink
    );
    await this.vault.modify(taskFile, updated);
  }
  async planForEvening(taskFile) {
    const content = await this.vault.read(taskFile);
    const evening = /* @__PURE__ */ new Date();
    evening.setHours(19, 0, 0, 0);
    const eveningTimestamp = DateFormatter.toLocalTimestamp(evening);
    const updated = this.frontmatterService.updateProperty(
      content,
      "ems__Effort_plannedStartTimestamp",
      eveningTimestamp
    );
    await this.vault.modify(taskFile, updated);
  }
  async shiftDayBackward(taskFile) {
    await this.shiftDay(taskFile, -1);
  }
  async shiftDayForward(taskFile) {
    await this.shiftDay(taskFile, 1);
  }
  async rollbackStatus(taskFile) {
    const content = await this.vault.read(taskFile);
    const currentStatus = this.extractCurrentStatus(content);
    const instanceClass = this.extractInstanceClass(content);
    if (!currentStatus) {
      throw new Error("No current status to rollback from");
    }
    const previousStatus = this.workflow.getPreviousStatus(
      currentStatus,
      instanceClass
    );
    if (previousStatus === void 0) {
      throw new Error("Cannot rollback from current status");
    }
    let updated = content;
    if (previousStatus === null) {
      updated = this.frontmatterService.removeProperty(
        updated,
        "ems__Effort_status"
      );
    } else {
      updated = this.frontmatterService.updateProperty(
        updated,
        "ems__Effort_status",
        previousStatus
      );
    }
    const normalizedStatus = this.workflow.normalizeStatus(currentStatus);
    if (normalizedStatus === "ems__EffortStatusDone") {
      updated = this.frontmatterService.removeProperty(
        updated,
        "ems__Effort_endTimestamp"
      );
      updated = this.frontmatterService.removeProperty(
        updated,
        "ems__Effort_resolutionTimestamp"
      );
    } else if (normalizedStatus === "ems__EffortStatusDoing") {
      updated = this.frontmatterService.removeProperty(
        updated,
        "ems__Effort_startTimestamp"
      );
    }
    await this.vault.modify(taskFile, updated);
  }
  async updateStatus(taskFile, statusValue) {
    const content = await this.vault.read(taskFile);
    const updated = this.frontmatterService.updateProperty(
      content,
      "ems__Effort_status",
      `"[[${statusValue}]]"`
    );
    await this.vault.modify(taskFile, updated);
  }
  async shiftDay(taskFile, days) {
    const content = await this.vault.read(taskFile);
    const currentEffortDay = this.extractEffortDay(content);
    if (!currentEffortDay) {
      throw new Error("ems__Effort_day property not found");
    }
    const currentDate = this.parseDateFromWikilink(currentEffortDay);
    if (!currentDate) {
      throw new Error("Invalid date format in ems__Effort_day");
    }
    const newDate = DateFormatter.addDays(currentDate, days);
    const newWikilink = DateFormatter.toDateWikilink(newDate);
    const updated = this.frontmatterService.updateProperty(
      content,
      "ems__Effort_day",
      newWikilink
    );
    await this.vault.modify(taskFile, updated);
  }
  parseDateFromWikilink(wikilink) {
    const cleanValue = wikilink.replace(/["'[\]]/g, "").trim();
    const date = new Date(cleanValue);
    if (isNaN(date.getTime())) {
      return null;
    }
    return date;
  }
  extractEffortDay(content) {
    const parsed = this.frontmatterService.parse(content);
    if (!parsed.exists) return null;
    return this.frontmatterService.getPropertyValue(
      parsed.content,
      "ems__Effort_day"
    );
  }
  extractCurrentStatus(content) {
    const parsed = this.frontmatterService.parse(content);
    if (!parsed.exists) return null;
    return this.frontmatterService.getPropertyValue(
      parsed.content,
      "ems__Effort_status"
    );
  }
  extractInstanceClass(content) {
    const parsed = this.frontmatterService.parse(content);
    if (!parsed.exists) return null;
    const arrayMatch = parsed.content.match(
      /exo__Instance_class:\s*\n((?:\s*-\s*.*\n?)+)/
    );
    if (arrayMatch) {
      const lines = arrayMatch[1].split("\n").filter((l) => l.trim());
      return lines.map((line) => line.replace(/^\s*-\s*/, "").trim());
    }
    return this.frontmatterService.getPropertyValue(
      parsed.content,
      "exo__Instance_class"
    );
  }
}

class AreaCreationService {
  constructor(vault) {
    this.vault = vault;
  }
  async createChildArea(sourceFile, sourceMetadata, label) {
    const uid = v4();
    const fileName = `${uid}.md`;
    const frontmatter = this.generateChildAreaFrontmatter(
      sourceMetadata,
      sourceFile.basename,
      label,
      uid
    );
    const fileContent = MetadataHelpers.buildFileContent(frontmatter);
    const folderPath = sourceFile.parent?.path || "";
    const filePath = folderPath ? `${folderPath}/${fileName}` : fileName;
    const createdFile = await this.vault.create(filePath, fileContent);
    return createdFile;
  }
  generateChildAreaFrontmatter(sourceMetadata, sourceName, label, uid) {
    const now = /* @__PURE__ */ new Date();
    const timestamp = DateFormatter.toLocalTimestamp(now);
    const isDefinedBy = MetadataExtractor.extractIsDefinedBy(sourceMetadata);
    const frontmatter = {};
    frontmatter["exo__Asset_isDefinedBy"] = MetadataHelpers.ensureQuoted(isDefinedBy);
    frontmatter["exo__Asset_uid"] = uid || v4();
    frontmatter["exo__Asset_createdAt"] = timestamp;
    frontmatter["exo__Instance_class"] = [`"[[${AssetClass.AREA}]]"`];
    frontmatter["ems__Area_parent"] = `"[[${sourceName}]]"`;
    if (label && label.trim() !== "") {
      const trimmedLabel = label.trim();
      frontmatter["exo__Asset_label"] = trimmedLabel;
      frontmatter["aliases"] = [trimmedLabel];
    }
    return frontmatter;
  }
}

"use strict";
var define_process_env_default = {};
if (typeof document !== "undefined") {
  const proto = HTMLElement.prototype;
  if (!proto.createEl) {
    proto.createEl = function(tag, options) {
      const el = document.createElement(tag);
      if (options?.text) el.textContent = options.text;
      if (options?.cls) el.className = options.cls;
      if (options?.attr) {
        for (const [key, value] of Object.entries(options.attr)) {
          el.setAttribute(key, String(value));
        }
      }
      this.appendChild(el);
      return el;
    };
  }
  if (!proto.createDiv) {
    proto.createDiv = function(options) {
      const el = document.createElement("div");
      if (options?.cls) el.className = options.cls;
      if (options?.text) el.textContent = options.text;
      this.appendChild(el);
      return el;
    };
  }
  if (!proto.createSpan) {
    proto.createSpan = function(options) {
      const el = document.createElement("span");
      if (options?.cls) el.className = options.cls;
      if (options?.text) el.textContent = options.text;
      if (options?.attr) {
        for (const [key, value] of Object.entries(options.attr)) {
          el.setAttribute(key, String(value));
        }
      }
      this.appendChild(el);
      return el;
    };
  }
  if (!proto.empty) {
    proto.empty = function() {
      while (this.firstChild) {
        this.removeChild(this.firstChild);
      }
    };
  }
  if (!proto.addClass) {
    proto.addClass = function(cls) {
      this.classList.add(cls);
    };
  }
  if (!proto.removeClass) {
    proto.removeClass = function(cls) {
      this.classList.remove(cls);
    };
  }
  if (!proto.hasClass) {
    proto.hasClass = function(cls) {
      return this.classList.contains(cls);
    };
  }
}
class Plugin {
  constructor(app, manifest) {
    this.app = app;
    this.manifest = manifest;
  }
  async loadData() {
    return {};
  }
  async saveData(data) {
  }
  addCommand(command) {
  }
  addRibbonIcon(icon, title, callback) {
    const el = document.createElement("div");
    el.addClass = jest.fn();
    return el;
  }
  addSettingTab(settingTab) {
  }
  registerEvent(event) {
  }
  registerInterval(interval) {
    return interval;
  }
  registerMarkdownCodeBlockProcessor(language, handler) {
    this.codeBlockProcessor = handler;
  }
  registerMarkdownPostProcessor(processor) {
    this.markdownPostProcessor = processor;
  }
  registerView(type, viewCreator) {
    this.registeredViews = this.registeredViews || {};
    this.registeredViews[type] = viewCreator;
  }
  addStatusBarItem() {
    return document.createElement("div");
  }
  async onload() {
  }
  async onunload() {
  }
}
class Modal {
  constructor(app) {
    this.app = app;
    this.contentEl = document.createElement("div");
    this.modalEl = document.createElement("div");
    this.setupObsidianMethods(this.contentEl);
    this.setupObsidianMethods(this.modalEl);
  }
  setupObsidianMethods(el) {
    if (!el.addClass) {
      el.addClass = function(cls) {
        this.classList.add(cls);
      };
    }
    if (!el.removeClass) {
      el.removeClass = function(cls) {
        this.classList.remove(cls);
      };
    }
    if (!el.hasClass) {
      el.hasClass = function(cls) {
        return this.classList.contains(cls);
      };
    }
    if (!el.createEl) {
      el.createEl = function(tag, options) {
        const element = document.createElement(tag);
        if (options?.text) element.textContent = options.text;
        if (options?.cls) element.className = options.cls;
        if (options?.attr) {
          for (const [key, value] of Object.entries(options.attr)) {
            element.setAttribute(key, String(value));
          }
        }
        this.appendChild(element);
        return element;
      };
    }
    if (!el.empty) {
      el.empty = function() {
        while (this.firstChild) {
          this.removeChild(this.firstChild);
        }
      };
    }
  }
  open() {
    this.backdrop = document.createElement("div");
    this.backdrop.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      z-index: 1000;
      display: flex;
      align-items: flex-end;
      justify-content: center;
      transition: opacity 0.3s ease;
    `;
    document.body.appendChild(this.backdrop);
    this.backdrop.appendChild(this.modalEl);
    this.onOpen();
  }
  close() {
    this.onClose();
    if (this.backdrop) {
      document.body.removeChild(this.backdrop);
      this.backdrop = void 0;
    }
  }
  onOpen() {
  }
  onClose() {
  }
}
class PluginSettingTab {
  constructor(app, plugin) {
    this.app = app;
    this.containerEl = document.createElement("div");
  }
  display() {
  }
  hide() {
  }
}
class Setting {
  constructor(containerEl) {
    this.containerEl = containerEl;
    this.nameEl = document.createElement("div");
    this.descEl = document.createElement("div");
    this.controlEl = document.createElement("div");
    this.setupContainerMethods(containerEl);
  }
  setupContainerMethods(el) {
    if (!el.createEl) {
      el.createEl = function(tag, options) {
        const element = document.createElement(tag);
        if (options?.text) element.textContent = options.text;
        if (options?.cls) element.className = options.cls;
        this.appendChild(element);
        return element;
      };
    }
    if (!el.createDiv) {
      el.createDiv = function(options) {
        const element = document.createElement("div");
        if (options?.cls) element.className = options.cls;
        this.appendChild(element);
        return element;
      };
    }
    if (!el.empty) {
      el.empty = function() {
        while (this.firstChild) {
          this.removeChild(this.firstChild);
        }
      };
    }
  }
  setName(name) {
    return this;
  }
  setDesc(desc) {
    return this;
  }
  addText(cb) {
    cb(new TextComponent(this.containerEl));
    return this;
  }
  addTextArea(cb) {
    cb(new TextAreaComponent(this.containerEl));
    return this;
  }
  addToggle(cb) {
    cb(new ToggleComponent(this.containerEl));
    return this;
  }
  addButton(cb) {
    cb(new ButtonComponent(this.containerEl));
    return this;
  }
  addDropdown(cb) {
    cb(new DropdownComponent(this.containerEl));
    return this;
  }
}
class TextComponent {
  constructor(containerEl) {
    this.containerEl = containerEl;
    this.inputEl = document.createElement("input");
  }
  setPlaceholder(placeholder) {
    return this;
  }
  setValue(value) {
    this.inputEl.value = value;
    return this;
  }
  onChange(callback) {
    return this;
  }
}
class TextAreaComponent {
  constructor(containerEl) {
    this.containerEl = containerEl;
    this.inputEl = document.createElement("textarea");
  }
  setPlaceholder(placeholder) {
    return this;
  }
  setValue(value) {
    this.inputEl.value = value;
    return this;
  }
  onChange(callback) {
    return this;
  }
}
class ToggleComponent {
  constructor(containerEl) {
    this.containerEl = containerEl;
    this.toggleEl = document.createElement("input");
  }
  setValue(value) {
    return this;
  }
  onChange(callback) {
    return this;
  }
}
class ButtonComponent {
  constructor(containerEl) {
    this.containerEl = containerEl;
    this.buttonEl = document.createElement("button");
    if (!this.buttonEl.addClass) {
      this.buttonEl.addClass = function(cls) {
        this.classList.add(cls);
      };
    }
    if (!this.buttonEl.removeClass) {
      this.buttonEl.removeClass = function(cls) {
        this.classList.remove(cls);
      };
    }
    containerEl.appendChild(this.buttonEl);
  }
  setButtonText(text) {
    this.buttonEl.textContent = text;
    return this;
  }
  setCta() {
    this.buttonEl.addClass("mod-cta");
    return this;
  }
  onClick(callback) {
    this.buttonEl.addEventListener("click", callback);
    return this;
  }
  setTooltip(tooltip) {
    this.buttonEl.setAttribute("title", tooltip);
    return this;
  }
  setClass(cls) {
    this.buttonEl.className = cls;
    return this;
  }
}
class DropdownComponent {
  constructor(containerEl) {
    this.containerEl = containerEl;
    this.selectEl = document.createElement("select");
    containerEl.appendChild(this.selectEl);
  }
  addOption(value, display) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = display || value;
    this.selectEl.appendChild(option);
    return this;
  }
  setValue(value) {
    this.selectEl.value = value;
    return this;
  }
  onChange(callback) {
    this.selectEl.addEventListener(
      "change",
      () => callback(this.selectEl.value)
    );
    return this;
  }
}
class Notice {
  constructor(message) {
  }
}
class MarkdownView {
  constructor() {
    this.previewMode = {
      rerender: jest.fn()
    };
  }
}
class TFile {
  constructor(path) {
    this.path = path || "";
    this.basename = path ? path.split("/").pop()?.replace(/\.[^/.]+$/, "") || "" : "";
    this.extension = path ? path.split(".").pop() || "" : "";
  }
}
class WorkspaceLeaf {
  constructor() {
    this.view = null;
  }
  openFile(file) {
    return Promise.resolve();
  }
}
class App {
  constructor() {
    this.vault = new Vault();
    this.workspace = new Workspace();
    this.metadataCache = new MetadataCache();
    this.fileManager = new FileManager(this.vault);
  }
}
class Vault {
  constructor() {
    this.mockFiles = [];
    this.adapter = {
      read: jest.fn().mockRejectedValue(new Error("File not found")),
      write: jest.fn().mockResolvedValue(void 0),
      exists: jest.fn().mockResolvedValue(false),
      mkdir: jest.fn().mockResolvedValue(void 0),
      remove: jest.fn().mockResolvedValue(void 0),
      list: jest.fn().mockResolvedValue({ files: [], folders: [] })
    };
  }
  getFiles() {
    return this.mockFiles;
  }
  getMarkdownFiles() {
    return this.mockFiles.filter((file) => file.extension === "md");
  }
  getAbstractFileByPath(path) {
    return this.mockFiles.find((file) => file.path === path) || null;
  }
  create(path, content) {
    const file = new TFile(path);
    this.mockFiles.push(file);
    return Promise.resolve(file);
  }
  async read(file) {
    if (typeof file === "string") {
      return Promise.resolve("Mock file content");
    }
    return Promise.resolve("Mock file content");
  }
  async modify(file, content) {
    return Promise.resolve();
  }
  async delete(file) {
    const index = this.mockFiles.indexOf(file);
    if (index > -1) {
      this.mockFiles.splice(index, 1);
    }
    return Promise.resolve();
  }
  async rename(file, newPath) {
    const targetFile = this.mockFiles.find((f) => f === file);
    if (targetFile) {
      targetFile.path = newPath;
      targetFile.name = newPath.split("/").pop() || "";
    }
    return Promise.resolve();
  }
  getAllLoadedFiles() {
    return this.mockFiles;
  }
  async createFolder(path) {
    return Promise.resolve();
  }
  async exists(path) {
    return this.mockFiles.some((file) => file.path === path);
  }
  on(event, callback) {
    return {
      e: {
        target: this,
        fn: callback,
        event
      }
    };
  }
  off(event, callback) {
  }
  // Helper method for testing
  __addMockFile(path, content) {
    const file = new TFile(path);
    this.mockFiles.push(file);
    return file;
  }
  // Helper method to clear mock files for tests
  __clearMockFiles() {
    this.mockFiles = [];
  }
}
class Workspace {
  constructor() {
    this.activeFile = null;
    this.leaves = [];
  }
  getActiveFile() {
    return this.activeFile;
  }
  getLeaf(newLeaf) {
    if (newLeaf || this.leaves.length === 0) {
      const leaf = new WorkspaceLeaf();
      this.leaves.push(leaf);
      return leaf;
    }
    return this.leaves[0];
  }
  iterateAllLeaves(callback) {
    this.leaves.forEach(callback);
  }
  getActiveViewOfType(type) {
    return null;
  }
  openLinkText(linkText, sourcePath) {
  }
  on(name, callback) {
  }
  off(name, callback) {
  }
  trigger(name, ...data) {
  }
  // Helper method for testing
  __setActiveFile(file) {
    this.activeFile = file;
  }
}
class MetadataCache {
  constructor() {
    this.cache = /* @__PURE__ */ new Map();
  }
  getFileCache(file) {
    return this.cache.get(file.path) || {
      frontmatter: {},
      sections: [],
      headings: [],
      links: [],
      embeds: [],
      tags: []
    };
  }
  getBacklinksForFile(file) {
    return {
      data: /* @__PURE__ */ new Map(),
      count: () => 0,
      keys: () => []
    };
  }
  getFrontmatterPropertyValue(file, property) {
    const cache = this.getFileCache(file);
    return cache.frontmatter?.[property];
  }
  on(name, callback) {
  }
  off(name, callback) {
  }
  // Helper method for testing
  __setFileCache(path, cache) {
    this.cache.set(path, cache);
  }
  // Helper method to clear cache for tests
  __clearCache() {
    this.cache.clear();
  }
}
class Component {
  load() {
  }
  onload() {
  }
  unload() {
  }
  onunload() {
  }
  addChild(component) {
    return component;
  }
  removeChild(component) {
    return component;
  }
}
class MarkdownRenderer {
  static renderMarkdown(markdown, el, sourcePath, component) {
    el.innerHTML = markdown;
    return Promise.resolve();
  }
}
class FileManager {
  constructor(vault) {
    this.vault = vault;
  }
  generateMarkdownLink(file, sourcePath) {
    return `[[${file.basename}]]`;
  }
  async renameFile(file, newPath) {
    await this.vault.rename(file, newPath);
  }
}
function normalizePath(path) {
  return path.replace(/\\/g, "/");
}
function requestUrl(request) {
  return Promise.resolve({
    status: 200,
    json: {},
    text: "",
    arrayBuffer: new ArrayBuffer(0)
  });
}
function debounce(func, wait, immediate) {
  return func;
}
const moment = {
  now: () => Date.now(),
  unix: (timestamp) => ({
    format: (format) => new Date(timestamp * 1e3).toISOString()
  })
};
const Platform = {
  isMobile: define_process_env_default.TEST_PLATFORM === "mobile" || false,
  isMobileApp: define_process_env_default.TEST_PLATFORM === "mobile" || false,
  isIosApp: define_process_env_default.TEST_PLATFORM === "ios" || false,
  isAndroidApp: define_process_env_default.TEST_PLATFORM === "android" || false,
  isTablet: define_process_env_default.TEST_PLATFORM === "tablet" || false,
  isDesktop: define_process_env_default.TEST_PLATFORM !== "mobile" && define_process_env_default.TEST_PLATFORM !== "tablet",
  isWin: false,
  isMacOS: true,
  isLinux: false
};
if (typeof window !== "undefined" && typeof document !== "undefined") {
  if (!window.TouchEvent) {
    class MockTouchEvent extends Event {
      constructor(type, eventInitDict) {
        super(type, eventInitDict);
        const createTouchList = (touches) => {
          const list = touches || [];
          list.item = (index) => list[index] || null;
          return list;
        };
        this.touches = createTouchList(eventInitDict?.touches);
        this.changedTouches = createTouchList(
          eventInitDict?.changedTouches
        );
        this.targetTouches = createTouchList(
          eventInitDict?.targetTouches
        );
      }
    }
    window.TouchEvent = MockTouchEvent;
  }
  if (!window.PointerEvent) {
    class MockPointerEvent extends Event {
      constructor(type, eventInitDict) {
        super(type, eventInitDict);
        this.pointerId = eventInitDict?.pointerId || 0;
        this.pointerType = eventInitDict?.pointerType || "touch";
        this.clientX = eventInitDict?.clientX || 0;
        this.clientY = eventInitDict?.clientY || 0;
      }
    }
    window.PointerEvent = MockPointerEvent;
  }
  if (!("ontouchstart" in window)) {
    Object.defineProperty(window, "ontouchstart", {
      value: null,
      configurable: true,
      writable: true
    });
  }
  Object.defineProperty(navigator, "maxTouchPoints", {
    value: define_process_env_default.TEST_PLATFORM === "mobile" ? 10 : 0,
    configurable: true
  });
  Object.defineProperty(navigator, "msMaxTouchPoints", {
    value: define_process_env_default.TEST_PLATFORM === "mobile" ? 10 : 0,
    configurable: true
  });
  if (!navigator.vibrate) {
    Object.defineProperty(navigator, "vibrate", {
      value: jest.fn((pattern) => {
        console.log(`Mock vibrate called with:`, pattern);
        return true;
      }),
      configurable: true,
      writable: true
    });
  }
  Object.defineProperty(navigator, "deviceMemory", {
    value: define_process_env_default.TEST_PLATFORM === "mobile" ? 4 : 8,
    // 4GB for mobile, 8GB for desktop
    configurable: true
  });
  Object.defineProperty(navigator, "connection", {
    value: {
      effectiveType: define_process_env_default.TEST_PLATFORM === "mobile" ? "3g" : "4g",
      type: "cellular",
      downlink: define_process_env_default.TEST_PLATFORM === "mobile" ? 1.5 : 10
    },
    configurable: true
  });
  Object.defineProperty(navigator, "getBattery", {
    value: () => Promise.resolve({
      level: 0.75,
      charging: false,
      chargingTime: Infinity,
      dischargingTime: 7200
    }),
    configurable: true
  });
  if (define_process_env_default.TEST_PLATFORM === "mobile") {
    window.Capacitor = {
      platform: define_process_env_default.TEST_PLATFORM === "ios" ? "ios" : "android",
      isNative: true
    };
    window.ObsidianMobile = {
      version: "1.0.0",
      platform: define_process_env_default.TEST_PLATFORM === "ios" ? "ios" : "android"
    };
  }
  if (!performance.memory && define_process_env_default.TEST_PLATFORM === "mobile") {
    Object.defineProperty(performance, "memory", {
      value: {
        usedJSHeapSize: 50 * 1024 * 1024,
        // 50MB
        totalJSHeapSize: 100 * 1024 * 1024,
        // 100MB
        jsHeapSizeLimit: 512 * 1024 * 1024
        // 512MB for mobile
      },
      configurable: true
    });
  }
  if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = jest.fn((callback) => {
      const id = setTimeout(() => callback(performance.now()), 16);
      return id;
    });
  }
  if (!window.cancelAnimationFrame) {
    window.cancelAnimationFrame = jest.fn((id) => {
      clearTimeout(id);
    });
  }
  if (!screen.orientation) {
    Object.defineProperty(screen, "orientation", {
      value: {
        angle: 0,
        type: "portrait-primary",
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
      },
      configurable: true
    });
  }
  if (!window.matchMedia) {
    window.matchMedia = jest.fn((query) => ({
      matches: query.includes("max-width: 768px") ? define_process_env_default.TEST_PLATFORM === "mobile" : false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn()
    }));
  }
  if (!window.CSS) {
    Object.defineProperty(window, "CSS", {
      value: {
        supports: jest.fn((property) => {
          return property.includes("safe-area") || property.includes("env(");
        })
      },
      configurable: true
    });
  }
  const originalGetComputedStyle = window.getComputedStyle;
  window.getComputedStyle = jest.fn((element) => {
    const mockStyle = {
      getPropertyValue: jest.fn((prop) => {
        const safeAreaMap = {
          "env(safe-area-inset-top)": define_process_env_default.TEST_PLATFORM === "ios" ? "44px" : "0px",
          "env(safe-area-inset-bottom)": define_process_env_default.TEST_PLATFORM === "ios" ? "34px" : "0px",
          "env(safe-area-inset-left)": "0px",
          "env(safe-area-inset-right)": "0px"
        };
        return safeAreaMap[prop] || "0px";
      }),
      ...originalGetComputedStyle ? originalGetComputedStyle(element) : {}
    };
    return mockStyle;
  });
  const mobileUserAgents = {
    ios: "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1",
    android: "Mozilla/5.0 (Linux; Android 12; Pixel 6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Mobile Safari/537.36",
    tablet: "Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1",
    desktop: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36"
  };
  if (define_process_env_default.TEST_PLATFORM && define_process_env_default.TEST_PLATFORM in mobileUserAgents) {
    Object.defineProperty(navigator, "userAgent", {
      value: mobileUserAgents[define_process_env_default.TEST_PLATFORM],
      configurable: true
    });
  }
  const platformMap = {
    ios: "iPhone",
    android: "Linux armv8l",
    tablet: "iPad",
    desktop: "MacIntel"
  };
  if (define_process_env_default.TEST_PLATFORM && define_process_env_default.TEST_PLATFORM in platformMap) {
    Object.defineProperty(navigator, "platform", {
      value: platformMap[define_process_env_default.TEST_PLATFORM],
      configurable: true
    });
  }
  const screenDimensions = {
    mobile: { width: 375, height: 667 },
    ios: { width: 375, height: 667 },
    android: { width: 412, height: 892 },
    tablet: { width: 768, height: 1024 },
    desktop: { width: 1920, height: 1080 }
  };
  if (define_process_env_default.TEST_PLATFORM && define_process_env_default.TEST_PLATFORM in screenDimensions) {
    const dimensions = screenDimensions[define_process_env_default.TEST_PLATFORM];
    Object.defineProperty(window, "innerWidth", {
      value: dimensions.width,
      configurable: true
    });
    Object.defineProperty(window, "innerHeight", {
      value: dimensions.height,
      configurable: true
    });
    Object.defineProperty(screen, "width", {
      value: dimensions.width,
      configurable: true
    });
    Object.defineProperty(screen, "height", {
      value: dimensions.height,
      configurable: true
    });
  }
}
const MobileTestUtils = {
  /**
   * Set the test platform for mobile tests
   */
  setPlatform(platform) {
    define_process_env_default.TEST_PLATFORM = platform;
    if (typeof window !== "undefined") {
      window.__PLATFORM_REFRESH__?.();
    }
  },
  /**
   * Create a mock touch event for testing
   */
  createTouchEvent(type, touches, target) {
    const touchList = touches.map((touch, index) => ({
      identifier: touch.id || index,
      clientX: touch.x,
      clientY: touch.y,
      pageX: touch.x,
      pageY: touch.y,
      screenX: touch.x,
      screenY: touch.y,
      target: target || document.body
    }));
    const event = new TouchEvent(type, {
      touches: type === "touchend" || type === "touchcancel" ? [] : touchList,
      changedTouches: touchList,
      targetTouches: type === "touchend" || type === "touchcancel" ? [] : touchList,
      bubbles: true,
      cancelable: true
    });
    event.preventDefault = jest.fn();
    event.stopPropagation = jest.fn();
    return event;
  },
  /**
   * Mock device capabilities for testing
   */
  mockDeviceCapabilities(capabilities) {
    if (capabilities.vibration !== void 0) {
      Object.defineProperty(navigator, "vibrate", {
        value: capabilities.vibration ? jest.fn() : void 0,
        configurable: true
      });
    }
    if (capabilities.geolocation !== void 0) {
      Object.defineProperty(navigator, "geolocation", {
        value: capabilities.geolocation ? {
          getCurrentPosition: jest.fn(),
          watchPosition: jest.fn(),
          clearWatch: jest.fn()
        } : void 0,
        configurable: true
      });
    }
    if (capabilities.memory !== void 0) {
      Object.defineProperty(navigator, "deviceMemory", {
        value: capabilities.memory,
        configurable: true
      });
    }
    if (capabilities.connection !== void 0) {
      Object.defineProperty(navigator, "connection", {
        value: {
          effectiveType: capabilities.connection,
          type: "cellular",
          downlink: capabilities.connection === "4g" ? 10 : 1.5
        },
        configurable: true
      });
    }
  },
  /**
   * Reset all mobile mocks to default state
   */
  reset() {
    delete define_process_env_default.TEST_PLATFORM;
  }
};

class AreaHierarchyBuilder {
  constructor(vault, metadataCache) {
    this.vault = vault;
    this.metadataCache = metadataCache;
  }
  buildHierarchy(currentAreaPath, _relations) {
    const currentFile = this.vault.getAbstractFileByPath(currentAreaPath);
    if (!this.isFile(currentFile)) {
      return null;
    }
    const cache = this.metadataCache.getFileCache(currentFile);
    const metadata = cache?.frontmatter || {};
    const instanceClass = this.extractInstanceClass(metadata);
    if (instanceClass !== AssetClass.AREA) {
      return null;
    }
    const allAreas = this.collectAllAreasFromVault();
    const visited = /* @__PURE__ */ new Set();
    return this.buildTree(currentAreaPath, allAreas, visited, 0);
  }
  isFile(file) {
    if (file instanceof TFile) {
      return true;
    }
    return file && typeof file === "object" && "basename" in file && "path" in file && "stat" in file;
  }
  extractInstanceClass(metadata) {
    const instanceClass = metadata.exo__Instance_class || "";
    if (Array.isArray(instanceClass)) {
      return this.cleanWikiLink(instanceClass[0] || "");
    }
    return this.cleanWikiLink(instanceClass);
  }
  cleanWikiLink(value) {
    if (typeof value !== "string") return "";
    return value.replace(/^\[\[|\]\]$/g, "").trim();
  }
  collectAllAreasFromVault() {
    const areas = /* @__PURE__ */ new Map();
    const pathByBasename = /* @__PURE__ */ new Map();
    const allFiles = this.vault.getMarkdownFiles();
    for (const file of allFiles) {
      const cache = this.metadataCache.getFileCache(file);
      const metadata = cache?.frontmatter || {};
      const instanceClass = this.extractInstanceClass(metadata);
      if (instanceClass === AssetClass.AREA) {
        const parentPath = this.extractParentPath(metadata);
        areas.set(file.path, {
          path: file.path,
          title: file.basename,
          label: metadata.exo__Asset_label || void 0,
          isArchived: this.isArchived(metadata),
          depth: 0,
          parentPath: parentPath || void 0
        });
        pathByBasename.set(file.basename, file.path);
      }
    }
    for (const [, area] of areas.entries()) {
      if (area.parentPath && pathByBasename.has(area.parentPath)) {
        area.parentPath = pathByBasename.get(area.parentPath);
      }
    }
    return areas;
  }
  extractParentPath(metadata) {
    const parentProperty = metadata.ems__Area_parent;
    if (!parentProperty) {
      return null;
    }
    if (Array.isArray(parentProperty)) {
      const firstParent = parentProperty[0] || "";
      return this.cleanWikiLink(firstParent);
    }
    return this.cleanWikiLink(parentProperty);
  }
  isArchived(metadata) {
    const archivedProp = metadata.exo__Asset_archived;
    if (archivedProp === true || archivedProp === "true") {
      return true;
    }
    if (Array.isArray(archivedProp) && archivedProp.length > 0) {
      const first = archivedProp[0];
      return first === true || first === "true";
    }
    return false;
  }
  buildTree(path, areas, visited, depth) {
    if (visited.has(path)) {
      return null;
    }
    visited.add(path);
    const area = areas.get(path);
    if (!area) {
      return null;
    }
    const children = [];
    for (const [childPath, childData] of areas.entries()) {
      if (childData.parentPath === path) {
        const childNode = this.buildTree(childPath, areas, visited, depth + 1);
        if (childNode) {
          children.push(childNode);
        }
      }
    }
    children.sort((a, b) => {
      const aLabel = a.label || a.title;
      const bLabel = b.label || b.title;
      return aLabel.localeCompare(bLabel);
    });
    return {
      path: area.path,
      title: area.title,
      label: area.label,
      isArchived: area.isArchived,
      depth,
      parentPath: area.parentPath,
      children
    };
  }
}

class ConceptCreationService {
  constructor(vault) {
    this.vault = vault;
  }
  async createNarrowerConcept(parentFile, fileName, definition, aliases) {
    const uid = v4();
    const fullFileName = fileName.endsWith(".md") ? fileName : `${fileName}.md`;
    const frontmatter = this.generateConceptFrontmatter(
      parentFile.basename,
      definition,
      aliases,
      uid
    );
    const fileContent = MetadataHelpers.buildFileContent(frontmatter);
    const folderPath = "concepts";
    const filePath = `${folderPath}/${fullFileName}`;
    const folder = this.vault.getAbstractFileByPath(folderPath);
    if (!folder) {
      await this.vault.createFolder(folderPath);
    }
    const createdFile = await this.vault.create(filePath, fileContent);
    return createdFile;
  }
  generateConceptFrontmatter(parentConceptName, definition, aliases, uid) {
    const now = /* @__PURE__ */ new Date();
    const timestamp = DateFormatter.toLocalTimestamp(now);
    const frontmatter = {};
    frontmatter["exo__Asset_isDefinedBy"] = '"[[!concepts]]"';
    frontmatter["exo__Asset_uid"] = uid;
    frontmatter["exo__Asset_createdAt"] = timestamp;
    frontmatter["exo__Instance_class"] = [`"[[${AssetClass.CONCEPT}]]"`];
    frontmatter["ims__Concept_broader"] = `"[[${parentConceptName}]]"`;
    frontmatter["ims__Concept_definition"] = definition;
    if (aliases.length > 0) {
      frontmatter["aliases"] = aliases;
    }
    return frontmatter;
  }
}

class EffortVotingService {
  constructor(vault) {
    this.vault = vault;
  }
  /**
   * Increment the vote count for an effort
   * Creates property if it doesn't exist (starts at 1)
   * @param effortFile - The file representing the effort (Task or Project)
   * @returns The new vote count after increment
   */
  async incrementEffortVotes(effortFile) {
    const fileContent = await this.vault.read(effortFile);
    const currentVotes = this.extractVoteCount(fileContent);
    const newVoteCount = currentVotes + 1;
    const updatedContent = this.updateFrontmatterWithVotes(
      fileContent,
      newVoteCount
    );
    await this.vault.modify(effortFile, updatedContent);
    return newVoteCount;
  }
  /**
   * Extract current vote count from file content
   * Returns 0 if property doesn't exist
   * @param content - The file content to parse
   * @returns Current vote count (0 if property doesn't exist)
   */
  extractVoteCount(content) {
    const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---/;
    const match = content.match(frontmatterRegex);
    if (!match) return 0;
    const frontmatterContent = match[1];
    const votesMatch = frontmatterContent.match(/ems__Effort_votes:\s*(\d+)/);
    if (votesMatch && votesMatch[1]) {
      return parseInt(votesMatch[1], 10);
    }
    return 0;
  }
  /**
   * Update frontmatter with new vote count
   * Creates frontmatter if it doesn't exist
   * Adds or updates ems__Effort_votes property
   * @param content - Original file content
   * @param voteCount - New vote count to set
   * @returns Updated file content with new vote count
   */
  updateFrontmatterWithVotes(content, voteCount) {
    const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---/;
    const match = content.match(frontmatterRegex);
    const lineEnding = content.includes("\r\n") ? "\r\n" : "\n";
    if (!match) {
      const newFrontmatter = `---${lineEnding}ems__Effort_votes: ${voteCount}${lineEnding}---${lineEnding}${content}`;
      return newFrontmatter;
    }
    const frontmatterContent = match[1];
    let updatedFrontmatter = frontmatterContent;
    if (updatedFrontmatter.includes("ems__Effort_votes:")) {
      updatedFrontmatter = updatedFrontmatter.replace(
        /ems__Effort_votes:.*$/m,
        `ems__Effort_votes: ${voteCount}`
      );
    } else {
      updatedFrontmatter += `${lineEnding}ems__Effort_votes: ${voteCount}`;
    }
    return content.replace(
      frontmatterRegex,
      `---${lineEnding}${updatedFrontmatter}${lineEnding}---`
    );
  }
}

class FolderRepairService {
  constructor(vault, app) {
    this.vault = vault;
    this.app = app;
  }
  /**
   * Get the expected folder for an asset based on its exo__Asset_isDefinedBy property
   * Returns null if no expected folder can be determined
   */
  async getExpectedFolder(file, metadata) {
    const isDefinedBy = metadata?.exo__Asset_isDefinedBy;
    if (!isDefinedBy) {
      return null;
    }
    const reference = this.extractReference(isDefinedBy);
    if (!reference) {
      return null;
    }
    const referencedFile = this.app.metadataCache.getFirstLinkpathDest(
      reference,
      file.path
    );
    if (!referencedFile) {
      return null;
    }
    return this.getFileFolder(referencedFile);
  }
  /**
   * Move asset to its expected folder based on exo__Asset_isDefinedBy
   */
  async repairFolder(file, expectedFolder) {
    const newPath = `${expectedFolder}/${file.name}`;
    const existingFile = this.vault.getAbstractFileByPath(newPath);
    if (existingFile) {
      throw new Error(
        `Cannot move file: ${newPath} already exists`
      );
    }
    await this.ensureFolderExists(expectedFolder);
    await this.vault.rename(file, newPath);
  }
  /**
   * Get the folder path for a file
   */
  getFileFolder(file) {
    const folderPath = file.parent?.path || "";
    return folderPath;
  }
  /**
   * Extract reference from various formats:
   * - [[Reference]] -> Reference
   * - "[[Reference]]" -> Reference
   * - Reference -> Reference
   */
  extractReference(value) {
    if (typeof value !== "string") {
      return null;
    }
    let cleaned = value.trim().replace(/^["']|["']$/g, "");
    cleaned = cleaned.replace(/^\[\[|\]\]$/g, "");
    return cleaned || null;
  }
  /**
   * Ensure a folder exists, creating it if necessary
   */
  async ensureFolderExists(folderPath) {
    if (!folderPath) {
      return;
    }
    const folder = this.vault.getAbstractFileByPath(folderPath);
    if (folder && "children" in folder) {
      return;
    }
    await this.vault.createFolder(folderPath);
  }
}

class LabelToAliasService {
  constructor(vault) {
    this.vault = vault;
  }
  async copyLabelToAliases(file) {
    const fileContent = await this.vault.read(file);
    const label = this.extractLabel(fileContent);
    if (!label) {
      throw new Error("No exo__Asset_label found in file");
    }
    const updatedContent = this.addLabelToAliases(fileContent, label);
    await this.vault.modify(file, updatedContent);
  }
  extractLabel(content) {
    const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---/;
    const match = content.match(frontmatterRegex);
    if (!match) return null;
    const frontmatterContent = match[1];
    const labelMatch = frontmatterContent.match(/exo__Asset_label:\s*["']?([^"'\r\n]+)["']?/);
    if (labelMatch && labelMatch[1]) {
      return labelMatch[1].trim();
    }
    return null;
  }
  addLabelToAliases(content, label) {
    const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---/;
    const match = content.match(frontmatterRegex);
    const lineEnding = content.includes("\r\n") ? "\r\n" : "\n";
    if (!match) {
      const newFrontmatter = `---${lineEnding}aliases:${lineEnding}  - "${label}"${lineEnding}---${lineEnding}${content}`;
      return newFrontmatter;
    }
    const frontmatterContent = match[1];
    let updatedFrontmatter = frontmatterContent;
    if (updatedFrontmatter.includes("aliases:")) {
      const aliasesMatch = updatedFrontmatter.match(/(aliases:\r?\n(?: {2}- .*\r?\n)*)/);
      if (aliasesMatch) {
        updatedFrontmatter = updatedFrontmatter.replace(
          /(aliases:\r?\n(?: {2}- .*\r?\n)*)/,
          `$1  - "${label}"${lineEnding}`
        );
      }
    } else {
      updatedFrontmatter += `${lineEnding}aliases:${lineEnding}  - "${label}"`;
    }
    return content.replace(
      frontmatterRegex,
      `---${lineEnding}${updatedFrontmatter}${lineEnding}---`
    );
  }
}

class LoggingService {
  static {
    this.isVerbose = false;
  }
  static setVerbose(verbose) {
    this.isVerbose = verbose;
  }
  static debug(message, context) {
    if (this.isVerbose) {
      console.debug(`[Exocortex] ${message}`, context ?? "");
    }
  }
  static info(message, context) {
    console.log(`[Exocortex] ${message}`, context ?? "");
  }
  static warn(message, context) {
    console.warn(`[Exocortex] ${message}`, context ?? "");
  }
  static error(message, error) {
    console.error(`[Exocortex ERROR] ${message}`, error ?? "");
    if (error?.stack) {
      console.error(error.stack);
    }
  }
}

class PropertyCleanupService {
  constructor(vault) {
    this.vault = vault;
  }
  /**
   * Remove all empty properties from file frontmatter
   * Empty properties are: null, undefined, "", [], {}
   */
  async cleanEmptyProperties(file) {
    const fileContent = await this.vault.read(file);
    const updatedContent = this.removeEmptyPropertiesFromContent(fileContent);
    await this.vault.modify(file, updatedContent);
  }
  /**
   * Remove empty properties from file content
   */
  removeEmptyPropertiesFromContent(content) {
    const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
    const match = content.match(frontmatterRegex);
    if (!match) {
      return content;
    }
    const frontmatterContent = match[1];
    const lines = frontmatterContent.split("\n");
    const cleanedLines = [];
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trim();
      if (trimmed === "") {
        cleanedLines.push(line);
        i++;
        continue;
      }
      const propertyMatch = trimmed.match(/^([^:]+):\s*(.*)$/);
      if (propertyMatch) {
        const value = propertyMatch[2];
        if (value === "" && i + 1 < lines.length) {
          const nextLine = lines[i + 1];
          if (nextLine.match(/^\s+- /)) {
            const listItems = [];
            let j = i + 1;
            while (j < lines.length && lines[j].match(/^\s+- /)) {
              listItems.push(lines[j]);
              j++;
            }
            const allEmpty = listItems.every((item) => {
              const itemValue = item.replace(/^\s+- /, "").trim();
              return this.isEmptyValue(itemValue);
            });
            if (allEmpty) {
              i = j;
              continue;
            } else {
              cleanedLines.push(line);
              for (let k = i + 1; k < j; k++) {
                cleanedLines.push(lines[k]);
              }
              i = j;
              continue;
            }
          }
        }
        if (this.isEmptyValue(value)) {
          i++;
          continue;
        }
        cleanedLines.push(line);
        i++;
      } else if (trimmed.match(/^\s*- /)) {
        i++;
      } else {
        cleanedLines.push(line);
        i++;
      }
    }
    const cleanedFrontmatter = cleanedLines.join("\n");
    return content.replace(frontmatterRegex, `---
${cleanedFrontmatter}
---`);
  }
  /**
   * Check if a value string represents an empty value
   */
  isEmptyValue(value) {
    const trimmed = value.trim();
    if (trimmed === "") return true;
    if (trimmed === "null" || trimmed === "undefined") return true;
    if (trimmed === "[]") return true;
    if (trimmed === "{}") return true;
    if (trimmed === '""' || trimmed === "''") return true;
    return false;
  }
}

class RenameToUidService {
  constructor(app) {
    this.app = app;
  }
  async renameToUid(file, metadata) {
    const uid = metadata.exo__Asset_uid;
    if (!uid) {
      throw new Error("Asset has no exo__Asset_uid property");
    }
    const currentBasename = file.basename;
    const targetBasename = uid;
    if (currentBasename === targetBasename) {
      throw new Error("File is already named according to UID");
    }
    const currentLabel = metadata.exo__Asset_label;
    const needsLabelUpdate = !currentLabel || currentLabel.trim() === "";
    if (needsLabelUpdate) {
      await this.updateLabel(file, currentBasename);
    }
    const folderPath = file.parent?.path || "";
    const newPath = folderPath ? `${folderPath}/${targetBasename}.md` : `${targetBasename}.md`;
    await this.app.fileManager.renameFile(file, newPath);
  }
  async updateLabel(file, label) {
    await this.app.vault.process(file, (content) => {
      const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
      const match = content.match(frontmatterRegex);
      if (!match) {
        return content;
      }
      const frontmatterContent = match[1];
      const newFrontmatter = `${frontmatterContent}
exo__Asset_label: ${label}
aliases:
  - ${label}`;
      return content.replace(frontmatterRegex, `---
${newFrontmatter}
---`);
    });
  }
}

class SupervisionCreationService {
  constructor(vault) {
    this.vault = vault;
  }
  async createSupervision(formData) {
    const uid = v4();
    const fileName = `${uid}.md`;
    const frontmatter = this.generateFrontmatter(uid);
    const body = this.generateBody(formData);
    const fileContent = this.buildFileContent(frontmatter, body);
    const filePath = `01 Inbox/${fileName}`;
    const createdFile = await this.vault.create(filePath, fileContent);
    return createdFile;
  }
  generateFrontmatter(uid) {
    const now = /* @__PURE__ */ new Date();
    const timestamp = DateFormatter.toLocalTimestamp(now);
    return {
      exo__Asset_isDefinedBy: '"[[!kitelev]]"',
      exo__Asset_uid: uid,
      exo__Asset_createdAt: timestamp,
      exo__Instance_class: ['"[[ztlk__FleetingNote]]"'],
      ztlk__FleetingNote_type: '"[[CBT-Diary Record]]"'
    };
  }
  generateBody(formData) {
    const fields = [
      { label: "Ситуация/триггер", value: formData.situation },
      { label: "Эмоции", value: formData.emotions },
      { label: "Мысли", value: formData.thoughts },
      { label: "Поведение", value: formData.behavior },
      {
        label: "Краткосрочные последствия поведения",
        value: formData.shortTermConsequences
      },
      {
        label: "Долгосрочные последствия поведения",
        value: formData.longTermConsequences
      }
    ];
    return fields.map((field) => `- ${field.label}: ${field.value}`).join("\n");
  }
  buildFileContent(frontmatter, body) {
    const frontmatterLines = Object.entries(frontmatter).map(([key, value]) => {
      if (Array.isArray(value)) {
        const arrayItems = value.map((item) => `  - ${item}`).join("\n");
        return `${key}:
${arrayItems}`;
      }
      return `${key}: ${value}`;
    }).join("\n");
    return `---
${frontmatterLines}
---

${body}
`;
  }
}

class FrontmatterService {
  static {
    /**
     * Regex pattern for matching YAML frontmatter blocks.
     * Matches: ---\n[content]\n---
     */
    this.FRONTMATTER_REGEX = /^---\n([\s\S]*?)\n---/;
  }
  /**
   * Parse frontmatter from markdown content.
   *
   * @param content - Full markdown file content
   * @returns Parse result with existence flag and content
   *
   * @example
   * ```typescript
   * const result = service.parse('---\nfoo: bar\n---\nBody');
   * // result.exists === true
   * // result.content === 'foo: bar'
   * ```
   */
  parse(content) {
    const match = content.match(FrontmatterService.FRONTMATTER_REGEX);
    if (!match) {
      return {
        exists: false,
        content: "",
        originalContent: content
      };
    }
    return {
      exists: true,
      content: match[1],
      originalContent: content
    };
  }
  /**
   * Update or add a property in frontmatter.
   *
   * - If frontmatter exists and has the property: updates value
   * - If frontmatter exists but lacks property: adds property
   * - If no frontmatter exists: creates frontmatter with property
   *
   * @param content - Full markdown file content
   * @param property - Property name (e.g., 'status', 'ems__Effort_status')
   * @param value - Property value (e.g., '"[[StatusDone]]"', 'true', '42')
   * @returns Updated content with modified frontmatter
   *
   * @example
   * ```typescript
   * // Update existing
   * const result1 = service.updateProperty(
   *   '---\nstatus: draft\n---\nBody',
   *   'status',
   *   'published'
   * );
   * // result1 === '---\nstatus: published\n---\nBody'
   *
   * // Add new property
   * const result2 = service.updateProperty(
   *   '---\nfoo: bar\n---\nBody',
   *   'status',
   *   'draft'
   * );
   * // result2 === '---\nfoo: bar\nstatus: draft\n---\nBody'
   *
   * // Create frontmatter if missing
   * const result3 = service.updateProperty(
   *   'Body content',
   *   'status',
   *   'draft'
   * );
   * // result3 === '---\nstatus: draft\n---\nBody content'
   * ```
   */
  updateProperty(content, property, value) {
    const parsed = this.parse(content);
    if (!parsed.exists) {
      return this.createFrontmatter(content, { [property]: value });
    }
    let updatedFrontmatter = parsed.content;
    if (this.hasProperty(updatedFrontmatter, property)) {
      const propertyRegex = new RegExp(`${this.escapeRegex(property)}:.*$`, "m");
      updatedFrontmatter = updatedFrontmatter.replace(
        propertyRegex,
        `${property}: ${value}`
      );
    } else {
      const separator = updatedFrontmatter.length > 0 ? "\n" : "";
      updatedFrontmatter += `${separator}${property}: ${value}`;
    }
    return content.replace(
      FrontmatterService.FRONTMATTER_REGEX,
      `---
${updatedFrontmatter}
---`
    );
  }
  /**
   * Add a new property to frontmatter (alias for updateProperty).
   *
   * Convenience method with clearer semantics for adding new properties.
   *
   * @param content - Full markdown file content
   * @param property - Property name
   * @param value - Property value
   * @returns Updated content
   */
  addProperty(content, property, value) {
    return this.updateProperty(content, property, value);
  }
  /**
   * Remove a property from frontmatter.
   *
   * - If property exists: removes the line
   * - If property doesn't exist: returns content unchanged
   * - If no frontmatter exists: returns content unchanged
   *
   * @param content - Full markdown file content
   * @param property - Property name to remove
   * @returns Updated content with property removed
   *
   * @example
   * ```typescript
   * const result = service.removeProperty(
   *   '---\nfoo: bar\nstatus: draft\n---\nBody',
   *   'status'
   * );
   * // result === '---\nfoo: bar\n---\nBody'
   * ```
   */
  removeProperty(content, property) {
    const parsed = this.parse(content);
    if (!parsed.exists || !this.hasProperty(parsed.content, property)) {
      return content;
    }
    const propertyLineRegex = new RegExp(
      `
?${this.escapeRegex(property)}:.*$`,
      "m"
    );
    const updatedFrontmatter = parsed.content.replace(propertyLineRegex, "");
    return content.replace(
      FrontmatterService.FRONTMATTER_REGEX,
      `---
${updatedFrontmatter}
---`
    );
  }
  /**
   * Check if frontmatter contains a specific property.
   *
   * @param frontmatterContent - Frontmatter content (without --- delimiters)
   * @param property - Property name to check
   * @returns True if property exists
   *
   * @example
   * ```typescript
   * const hasStatus = service.hasProperty('foo: bar\nstatus: draft', 'status');
   * // hasStatus === true
   * ```
   */
  hasProperty(frontmatterContent, property) {
    return frontmatterContent.includes(`${property}:`);
  }
  /**
   * Create new frontmatter block with given properties.
   *
   * @param content - Original markdown content (without frontmatter)
   * @param properties - Object with property-value pairs
   * @returns Content with new frontmatter prepended
   *
   * @example
   * ```typescript
   * const result = service.createFrontmatter(
   *   'Body content',
   *   { status: 'draft', priority: 'high' }
   * );
   * // result === '---\nstatus: draft\npriority: high\n---\nBody content'
   * ```
   */
  createFrontmatter(content, properties) {
    const frontmatterLines = Object.entries(properties).map(
      ([key, value]) => `${key}: ${value}`
    );
    const frontmatterBlock = `---
${frontmatterLines.join("\n")}
---`;
    const separator = content.startsWith("\n") ? "" : "\n";
    return `${frontmatterBlock}${separator}${content}`;
  }
  /**
   * Get property value from frontmatter content.
   *
   * @param frontmatterContent - Frontmatter content (without --- delimiters)
   * @param property - Property name
   * @returns Property value or null if not found
   *
   * @example
   * ```typescript
   * const value = service.getPropertyValue(
   *   'foo: bar\nstatus: draft',
   *   'status'
   * );
   * // value === 'draft'
   * ```
   */
  getPropertyValue(frontmatterContent, property) {
    const propertyRegex = new RegExp(
      `${this.escapeRegex(property)}:\\s*(.*)$`,
      "m"
    );
    const match = frontmatterContent.match(propertyRegex);
    return match ? match[1].trim() : null;
  }
  /**
   * Escape special regex characters in property names.
   *
   * Handles property names with special characters like dots, underscores, etc.
   *
   * @param str - String to escape
   * @returns Escaped string safe for use in RegExp
   * @private
   */
  escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
}

class EffortSortingHelpers {
  static sortByPriority(a, b) {
    if (a.isTrashed !== b.isTrashed) {
      return a.isTrashed ? 1 : -1;
    }
    if (a.isDone !== b.isDone) {
      return a.isDone ? 1 : -1;
    }
    const aVotes = typeof a.metadata.ems__Effort_votes === "number" ? a.metadata.ems__Effort_votes : 0;
    const bVotes = typeof b.metadata.ems__Effort_votes === "number" ? b.metadata.ems__Effort_votes : 0;
    if (aVotes !== bVotes) {
      return bVotes - aVotes;
    }
    if (a.startTime && b.startTime) {
      return a.startTime.localeCompare(b.startTime);
    }
    if (a.startTime) return -1;
    if (b.startTime) return 1;
    return 0;
  }
}

class FileNotFoundError extends Error {
  constructor(path) {
    super(`File not found: ${path}`);
    this.name = "FileNotFoundError";
  }
}
class FileAlreadyExistsError extends Error {
  constructor(path) {
    super(`File already exists: ${path}`);
    this.name = "FileAlreadyExistsError";
  }
}

export { canCleanProperties as a, canCreateInstance as b, canArchiveTask as c, canCreateTask as d, canMarkDone as e, canMoveToBacklog as f, canPlanOnToday as g, canRepairFolder as h, canStartEffort as i, canVoteOnEffort as j };
//# sourceMappingURL=index-BFV2YJKW.js.map
