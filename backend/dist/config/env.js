"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = exports.validateTemporalAddress = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../../.env') });
const validateTemporalAddress = (address = process.env.TEMPORAL_ADDRESS || 'localhost:7233') => {
    if (/^https?:\/\//i.test(address)) {
        throw new Error('Invalid TEMPORAL_ADDRESS. Use host:port format, for example localhost:7233.');
    }
    return address;
};
exports.validateTemporalAddress = validateTemporalAddress;
exports.env = {
    port: process.env.API_PORT || process.env.PORT || 4000,
    mongoUri: process.env.MONGO_URI || 'mongodb://vtkall:vtkall_password@localhost:27017/vtkall_demo_pack_1?authSource=admin',
    nodeEnv: process.env.NODE_ENV || 'development',
    temporalAddress: exports.validateTemporalAddress,
};
