"use strict";
/**
 * Enhanced CSV Parser type definitions with modern TypeScript patterns
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ENCODING_PATTERNS = exports.COMMON_QUOTES = exports.COMMON_DELIMITERS = exports.MIN_SAMPLE_SIZE = exports.MAX_SAMPLE_SIZE = exports.OPTIMAL_CHUNK_SIZE = exports.ParserState = void 0;
// Parser states for state machine
var ParserState;
(function (ParserState) {
    ParserState["FIELD_START"] = "FIELD_START";
    ParserState["IN_FIELD"] = "IN_FIELD";
    ParserState["IN_QUOTED_FIELD"] = "IN_QUOTED_FIELD";
    ParserState["QUOTE_IN_QUOTED_FIELD"] = "QUOTE_IN_QUOTED_FIELD";
    ParserState["FIELD_END"] = "FIELD_END";
    ParserState["ROW_END"] = "ROW_END";
})(ParserState || (exports.ParserState = ParserState = {}));
// Optimized buffer sizes based on research
exports.OPTIMAL_CHUNK_SIZE = 64 * 1024; // 64KB chunks
exports.MAX_SAMPLE_SIZE = 1024 * 1024; // 1MB for auto-detection
exports.MIN_SAMPLE_SIZE = 8 * 1024; // 8KB minimum sample
// Common delimiters to detect
exports.COMMON_DELIMITERS = [',', '\t', ';', '|', ':'];
// Common quote characters
exports.COMMON_QUOTES = ['"', "'", '`'];
exports.ENCODING_PATTERNS = [
    { encoding: 'utf8', bom: Buffer.from([0xef, 0xbb, 0xbf]) },
    { encoding: 'utf16le', bom: Buffer.from([0xff, 0xfe]) },
    { encoding: 'utf16be', bom: Buffer.from([0xfe, 0xff]) },
];
//# sourceMappingURL=types.js.map