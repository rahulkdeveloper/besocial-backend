"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const authentication_1 = __importDefault(require("./authentication"));
const contact_1 = __importDefault(require("./contact"));
const user_1 = __importDefault(require("./user"));
const routers = [
    {
        path: "/api/authentication",
        handler: authentication_1.default
    },
    {
        path: "/api/contact",
        handler: contact_1.default
    },
    {
        path: "/api/user",
        handler: user_1.default
    }
];
exports.default = routers;
