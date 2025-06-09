"use strict";
/**
 * Section 3: Exploratory Data Analysis (EDA) Deep Dive - Type Definitions
 * Comprehensive interfaces matching Section3.md specification
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EdaDataType = exports.SemanticType = void 0;
// Semantic type classification for enhanced analysis
var SemanticType;
(function (SemanticType) {
    SemanticType["CURRENCY"] = "currency";
    SemanticType["AGE"] = "age";
    SemanticType["IDENTIFIER"] = "identifier";
    SemanticType["CATEGORY"] = "category";
    SemanticType["STATUS"] = "status";
    SemanticType["DEMOGRAPHIC"] = "demographic";
    SemanticType["DATE_TRANSACTION"] = "date_transaction";
    SemanticType["ORGANIZATIONAL_UNIT"] = "organizational_unit";
    SemanticType["RATING"] = "rating";
    SemanticType["PERCENTAGE"] = "percentage";
    SemanticType["COUNT"] = "count";
    SemanticType["UNKNOWN"] = "unknown";
})(SemanticType || (exports.SemanticType = SemanticType = {}));
// Enhanced data type classification beyond basic types
var EdaDataType;
(function (EdaDataType) {
    EdaDataType["NUMERICAL_FLOAT"] = "numerical_float";
    EdaDataType["NUMERICAL_INTEGER"] = "numerical_integer";
    EdaDataType["CATEGORICAL"] = "categorical";
    EdaDataType["DATE_TIME"] = "date_time";
    EdaDataType["BOOLEAN"] = "boolean";
    EdaDataType["TEXT_GENERAL"] = "text_general";
    EdaDataType["TEXT_ADDRESS"] = "text_address";
})(EdaDataType || (exports.EdaDataType = EdaDataType = {}));
//# sourceMappingURL=types.js.map