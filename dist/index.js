"use strict";
/**
 * Cognitive Ledger Protocol (CLP-1.0) — public API.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyChain = exports.GENESIS_HASH = exports.generateId = exports.hashEntry = exports.sha256 = exports.generateProfile = exports.generatePrompts = exports.analysePatterns = exports.detectBiases = exports.CognitiveLedger = void 0;
var ledger_1 = require("./ledger");
Object.defineProperty(exports, "CognitiveLedger", { enumerable: true, get: function () { return ledger_1.CognitiveLedger; } });
var bias_detector_1 = require("./bias-detector");
Object.defineProperty(exports, "detectBiases", { enumerable: true, get: function () { return bias_detector_1.detectBiases; } });
var pattern_analyser_1 = require("./pattern-analyser");
Object.defineProperty(exports, "analysePatterns", { enumerable: true, get: function () { return pattern_analyser_1.analysePatterns; } });
var generative_engine_1 = require("./generative-engine");
Object.defineProperty(exports, "generatePrompts", { enumerable: true, get: function () { return generative_engine_1.generatePrompts; } });
var profile_generator_1 = require("./profile-generator");
Object.defineProperty(exports, "generateProfile", { enumerable: true, get: function () { return profile_generator_1.generateProfile; } });
var hash_1 = require("./hash");
Object.defineProperty(exports, "sha256", { enumerable: true, get: function () { return hash_1.sha256; } });
Object.defineProperty(exports, "hashEntry", { enumerable: true, get: function () { return hash_1.hashEntry; } });
Object.defineProperty(exports, "generateId", { enumerable: true, get: function () { return hash_1.generateId; } });
Object.defineProperty(exports, "GENESIS_HASH", { enumerable: true, get: function () { return hash_1.GENESIS_HASH; } });
var verify_1 = require("./verify");
Object.defineProperty(exports, "verifyChain", { enumerable: true, get: function () { return verify_1.verifyChain; } });
//# sourceMappingURL=index.js.map