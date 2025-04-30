"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkUserSocketConnected = void 0;
const app_1 = require("../app");
const checkUserSocketConnected = (id) => {
    var _a, _b, _c, _d;
    console.log("inside the checkUserSocketConnected");
    if (!((_b = (_a = app_1.io === null || app_1.io === void 0 ? void 0 : app_1.io.sockets) === null || _a === void 0 ? void 0 : _a.adapter) === null || _b === void 0 ? void 0 : _b.rooms)) {
        console.error("no room founc");
        return false;
    }
    let flag = false;
    for (const roomSocket of (_d = (_c = app_1.io === null || app_1.io === void 0 ? void 0 : app_1.io.sockets) === null || _c === void 0 ? void 0 : _c.adapter) === null || _d === void 0 ? void 0 : _d.rooms) {
        console.log("room socket::", roomSocket[0]);
        if (roomSocket[0] === id) {
            flag = true;
            break;
        }
    }
    return flag;
};
exports.checkUserSocketConnected = checkUserSocketConnected;
