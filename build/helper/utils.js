"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.decode = exports.generateToken = exports.generateAccessToken = exports.comparePassword = exports.hashPassword = exports.verifyJwtToken = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const base64_url_1 = __importDefault(require("base64-url"));
const otp_generator_1 = __importDefault(require("otp-generator"));
const timeStampOTP = 10;
const generateTimeStamp = (date, minutes) => {
    return new Date(date.getTime() + minutes * 60000);
};
const hashPassword = (password) => __awaiter(void 0, void 0, void 0, function* () {
    return yield bcryptjs_1.default.hash(password, 10);
});
exports.hashPassword = hashPassword;
const comparePassword = (password, hash) => __awaiter(void 0, void 0, void 0, function* () {
    return yield bcryptjs_1.default.compare(password, hash);
});
exports.comparePassword = comparePassword;
const generateAccessToken = (useInfo) => __awaiter(void 0, void 0, void 0, function* () {
    return jsonwebtoken_1.default.sign(useInfo, process.env.JWT_SECRET_CODE, { expiresIn: "7d" });
});
exports.generateAccessToken = generateAccessToken;
const verifyJwtToken = (token) => __awaiter(void 0, void 0, void 0, function* () {
    return yield jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET_CODE);
});
exports.verifyJwtToken = verifyJwtToken;
const generateToken = (obj) => __awaiter(void 0, void 0, void 0, function* () {
    let otp = '1234';
    if (process.env.MODE === 'production') {
        otp = otp_generator_1.default.generate(4, { digits: true, lowerCaseAlphabets: false, upperCaseAlphabets: false, specialChars: false });
    }
    let verifyToken = ({
        timestamp: generateTimeStamp(new Date(), timeStampOTP), //otp expire after 10 min
        id: obj._id,
        // otpcode: otp,
    });
    const encodeToken = yield encode(JSON.stringify(verifyToken));
    return ({ resetToken: encodeToken });
});
exports.generateToken = generateToken;
const encode = (val) => __awaiter(void 0, void 0, void 0, function* () {
    return base64_url_1.default.encode(val);
});
const decode = (val) => __awaiter(void 0, void 0, void 0, function* () {
    const decodeString = base64_url_1.default.decode(val);
    return JSON.parse(decodeString);
});
exports.decode = decode;
