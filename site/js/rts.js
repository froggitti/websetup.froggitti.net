(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
/* Copyright (c) 2019-2020 Digital Dream Labs. See LICENSE file for details */

class BleMessageProtocol {
  constructor(maxSize) {
    this.kMsgStart = 0b10;
    this.kMsgContinue = 0b00;
    this.kMsgEnd = 0b01;
    this.kMsgSolo = 0b11;
    this.kMsgBits = 0b11 << 6;

    this.maxSize = maxSize;
    this.sendRawEvent;
    this.delegate;

    this.state = this.kMsgStart;
    this.buffer = [];
  }

  onSendRaw(fnc) {
    this.sendRawEvent = fnc;
  }

  setDelegate(delegate) {
    this.delegate = delegate;
  }

  receiveRawBuffer(buffer) {
    if (buffer.length < 1) {
      return;
    }

    let headerByte = buffer[0];
    let sizeByte = BleMessageProtocol.getSize(headerByte);
    let multipartState = BleMessageProtocol.getMultipartBits(headerByte);

    if (sizeByte != buffer.length - 1) {
      console.log("Size failure " + sizeByte + ", " + (buffer.length - 1));
      return;
    }

    switch (multipartState) {
      case this.kMsgStart: {
        if (this.state != this.kMsgStart) {
          // error
        }

        this.buffer = [];
        this.append(buffer);
        this.state = this.kMsgContinue;

        break;
      }
      case this.kMsgContinue: {
        if (this.state != this.kMsgContinue) {
          // error
        }

        this.append(buffer);
        this.state = this.kMsgContinue;
        break;
      }
      case this.kMsgEnd: {
        if (this.state != this.kMsgContinue) {
          // error
        }

        this.append(buffer);
        if (this.delegate != null) {
          this.delegate.handleReceive(this.buffer);
        }
        this.state = this.kMsgStart;
        break;
      }
      case this.kMsgSolo: {
        if (this.state != this.kMsgStart) {
          // error
        }

        if (this.delegate != null) {
          buffer.splice(0, 1);
          this.delegate.handleReceive(buffer);
        }
        this.state = this.kMsgStart;
        break;
      }
    }
  }

  sendMessage(buffer) {
    let sizeRemaining = buffer.length;

    if (buffer.length < this.maxSize) {
      this.sendRawMessage(this.kMsgSolo, buffer);
    } else {
      while (sizeRemaining > 0) {
        let offset = buffer.length - sizeRemaining;

        if (sizeRemaining == buffer.length) {
          let msgSize = this.maxSize - 1;
          this.sendRawMessage(
            this.kMsgStart,
            buffer.slice(offset, msgSize + offset)
          );
          sizeRemaining -= msgSize;
        } else if (sizeRemaining < this.maxSize) {
          this.sendRawMessage(
            this.kMsgEnd,
            buffer.slice(offset, sizeRemaining + offset)
          );
          sizeRemaining = 0;
        } else {
          let msgSize = this.maxSize - 1;
          this.sendRawMessage(
            this.kMsgContinue,
            buffer.slice(offset, msgSize + offset)
          );
          sizeRemaining -= msgSize;
        }
      }
    }
  }

  append(buffer) {
    this.buffer = this.buffer.concat(buffer.slice(1));
  }

  sendRawMessage(multipart, buffer) {
    let arr = [BleMessageProtocol.getHeaderByte(multipart, buffer.length)];

    let sendBuffer = arr.concat(buffer);

    if (this.sendRawEvent != null) {
      this.sendRawEvent(sendBuffer);
    }
  }

  static kMsgBits() {
    return 0b11 << 6;
  }

  static getMultipartBits(headerByte) {
    return (headerByte >> 6) & 0xff;
  }

  static getHeaderByte(multipart, size) {
    return ((multipart << 6) | (size & ~BleMessageProtocol.kMsgBits())) & 0xff;
  }

  static getSize(headerByte) {
    return headerByte & ~BleMessageProtocol.kMsgBits();
  }
}

module.exports = { BleMessageProtocol };

},{}],2:[function(require,module,exports){
/* Copyright (c) 2019-2020 Digital Dream Labs. See LICENSE file for details. */
class Blesh {
  constructor() {}

  static isSupported() {
    return false;
  }

  onReceiveData(fnc) {}

  send(data) {}

  start(port) {
    let p = new Promise(function (resolve, reject) {
      resolve(false);
    });

    return p;
  }
}

module.exports = { Blesh };

},{}],3:[function(require,module,exports){
/* Copyright (c) 2019-2020 Digital Dream Labs. See LICENSE file for details. */
class Clad {
  constructor() {}

  pack() {
    return null;
  }

  unpack(buffer) {
    return null;
  }

  unpackFromClad(cladBuffer) {
    let buf = cladBuffer.buffer.slice(cladBuffer.index);
    this.unpack(buf);
    cladBuffer.index += this.size;
  }

  get size() {
    return 0;
  }
}

class CladBuffer {
  constructor(buffer) {
    this.index = 0;
    this.buffer = buffer;
  }

  readBool() {
    let ret = this.buffer.slice(this.index, this.index + 1) != 0;
    this.index++;
    return ret;
  }

  readUint8() {
    let ret = IntBuffer.BufferToUInt8(
      this.buffer.slice(this.index, this.index + 1)
    );
    this.index += 1;
    return ret;
  }

  readInt8() {
    let ret = IntBuffer.BufferToInt8(
      this.buffer.slice(this.index, this.index + 1)
    );
    this.index += 1;
    return ret;
  }

  readUint16() {
    let ret = IntBuffer.BufferToUInt16(
      this.buffer.slice(this.index, this.index + 2)
    );
    this.index += 2;
    return ret;
  }

  readInt16() {
    let ret = IntBuffer.BufferToInt16(
      this.buffer.slice(this.index, this.index + 2)
    );
    this.index += 2;
    return ret;
  }

  readUint32() {
    let ret = IntBuffer.BufferToUInt32(
      this.buffer.slice(this.index, this.index + 4)
    );
    this.index += 4;
    return ret;
  }

  readInt32() {
    let ret = IntBuffer.BufferToInt32(
      this.buffer.slice(this.index, this.index + 4)
    );
    this.index += 4;
    return ret;
  }

  readBigInt64() {
    let ret = IntBuffer.LE64ToBigInt(
      this.buffer.slice(this.index, this.index + 8)
    );
    this.index += 8;
    return ret;
  }

  readBigUint64() {
    let ret = IntBuffer.LE64ToBigUInt(
      this.buffer.slice(this.index, this.index + 8)
    );
    this.index += 8;
    return ret;
  }

  readFloat32() {
    let byteArray = this.buffer.slice(this.index, this.index + 4);

    if (IntBuffer.IsHostLittleEndian()) {
      byteArray.reverse();
    }

    let ret = IntBuffer.BufferToFloat32(byteArray);
    this.index += 4;
    return ret;
  }

  readFloat64() {
    let byteArray = this.buffer.slice(this.index, this.index + 8);

    if (IntBuffer.IsHostLittleEndian()) {
      byteArray.reverse();
    }

    let ret = IntBuffer.BufferToFloat64(byteArray);
    this.index += 8;
    return ret;
  }

  readFArray(isFloat, type, capacity, signed) {
    if (type == 1) {
      let ret = this.buffer.slice(this.index, this.index + capacity);
      this.index += capacity;
      return signed ? new Int8Array(ret) : new Uint8Array(ret);
    } else {
      let ret = this.buffer.slice(this.index, this.index + capacity * type);
      this.index += capacity * type;

      let typedArray;

      if (isFloat) {
        switch (type) {
          case 4:
            typedArray = new Float32Array(capacity);
            break;
          case 8:
            typedArray = new Float64Array(capacity);
            break;
          default:
            console.error("Unhandled array type.");
            return null;
        }

        for (let i = 0; i < capacity; i++) {
          let buf = ret.slice(i * type, i * type + type);
          let numArr;

          if (IntBuffer.IsHostLittleEndian()) {
            buf.reverse();
          }

          switch (type) {
            case 4:
              numArr = [IntBuffer.BufferToFloat32(buf)];
              break;
            case 8:
              numArr = [IntBuffer.BufferToFloat64(buf)];
              break;
            default:
              return null;
          }

          typedArray.set(numArr, i);
        }
      } else {
        switch (type) {
          case 2:
            typedArray = signed
              ? new Int16Array(capacity)
              : new Uint16Array(capacity);
            break;
          case 4:
            typedArray = signed
              ? new Int32Array(capacity)
              : new Uint32Array(capacity);
            break;
          default:
            console.error("Unhandled array type.");
            return null;
        }

        for (let i = 0; i < capacity; i++) {
          let buf = ret.slice(i * type, i * type + type);
          let numArr;

          switch (type) {
            case 2:
              numArr = signed
                ? [IntBuffer.BufferToInt16(buf)]
                : [IntBuffer.BufferToUInt16(buf)];
              break;
            case 4:
              numArr = signed
                ? [IntBuffer.BufferToInt32(buf)]
                : [IntBuffer.BufferToUInt32(buf)];
              break;
            default:
              return null;
          }

          typedArray.set(numArr, i);
        }
      }

      return typedArray;
    }
  }

  readVArray(isFloat, type, sizeType, signed) {
    let vArrayLength = 0;

    switch (sizeType) {
      case 1:
        vArrayLength = IntBuffer.BufferToUInt8(
          this.buffer.slice(this.index, this.index + 1)
        );
        this.index++;
        break;
      case 2:
        vArrayLength = IntBuffer.BufferToUInt16(
          this.buffer.slice(this.index, this.index + 2)
        );
        this.index += 2;
        break;
      case 4:
        vArrayLength = IntBuffer.BufferToUInt32(
          this.buffer.slice(this.index, this.index + 4)
        );
        this.index += 4;
        break;
      case 8:
        vArrayLength = IntBuffer.BufferToUInt32(
          this.buffer.slice(this.index, this.index + 4)
        );

        let bigNumber = false;
        for (let i = 0; i < 4; i++) {
          bigNumber |= this.buffer[this.index + i] != 0;
        }

        if (bigNumber) {
          console.log(
            "Warning! readVArray is reading a uint_64 type that is larger than uint_32, which is unsupported in JS_emitter.py"
          );
        }

        this.index += 8;
        break;
    }

    return this.readFArray(isFloat, type, vArrayLength, signed);
  }

  readString(type) {
    let buffer = this.readVArray(false, 1, type, false);
    return String.fromCharCode.apply(String, buffer);
  }

  readStringFArray(isFloat, type, capacity) {
    let array = [];

    for (let i = 0; i < capacity; i++) {
      array.push(this.readString(type));
    }

    return array;
  }

  readStringVArray(isFloat, type, sizeType) {
    let vArrayLength = 0;
    let array = [];

    switch (sizeType) {
      case 1:
        vArrayLength = IntBuffer.BufferToUInt8(
          this.buffer.slice(this.index, this.index + 1)
        );
        this.index++;
        break;
      case 2:
        vArrayLength = IntBuffer.BufferToUInt16(
          this.buffer.slice(this.index, this.index + 2)
        );
        this.index += 2;
        break;
      case 4:
        vArrayLength = IntBuffer.BufferToUInt32(
          this.buffer.slice(this.index, this.index + 4)
        );
        this.index += 4;
        break;
      case 8:
        vArrayLength = IntBuffer.BufferToUInt32(
          this.buffer.slice(this.index, this.index + 4)
        );
        this.index += 8;
        break;
    }

    for (let i = 0; i < vArrayLength; i++) {
      array.push(this.readString(type));
    }

    return array;
  }

  ///
  /// Write operations
  ///
  write(array) {
    this.buffer.set(array, this.index);
    this.index += array.length;
  }

  writeBool(value) {
    this.buffer.set([value], this.index);
    this.index++;
  }

  writeUint8(value) {
    this.buffer.set([value], this.index);
    this.index++;
  }

  writeInt8(value) {
    this.buffer.set([value], this.index);
    this.index++;
  }

  writeUint16(value) {
    this.buffer.set(IntBuffer.Int16ToLE(value), this.index);
    this.index += 2;
  }

  writeInt16(value) {
    this.buffer.set(IntBuffer.Int16ToLE(value), this.index);
    this.index += 2;
  }

  writeUint32(value) {
    this.buffer.set(IntBuffer.Int32ToLE(value), this.index);
    this.index += 4;
  }

  writeInt32(value) {
    this.buffer.set(IntBuffer.Int32ToLE(value), this.index);
    this.index += 4;
  }

  writeBigUint64(value) {
    this.write(IntBuffer.BigIntToLE64(value));
  }

  writeBigInt64(value) {
    this.write(IntBuffer.BigIntToLE64(value));
  }

  writeFloat32(value) {
    this.buffer.set(IntBuffer.Float32ToLE(value), this.index);
    this.index += 4;
  }

  writeFloat64(value) {
    this.buffer.set(IntBuffer.Float64ToLE(value), this.index);
    this.index += 8;
  }

  writeFArray(array) {
    this.buffer.set(IntBuffer.TypedArrayToByteArray(array), this.index);
    this.index += array.length * array.BYTES_PER_ELEMENT;
  }

  writeVArray(array, sizeType) {
    switch (sizeType) {
      case 1:
        this.buffer.set([array.length], this.index);
        break;
      case 2:
        this.buffer.set(IntBuffer.Int16ToLE(array.length), this.index);
        break;
      case 4:
        this.buffer.set(IntBuffer.Int32ToLE(array.length), this.index);
        break;
      case 8:
        this.buffer.set(IntBuffer.Int32ToLE(array.length), this.index);
        break;
      default:
        console.error("Unsupported size type.");
        break;
    }

    this.index += sizeType;

    this.buffer.set(IntBuffer.TypedArrayToByteArray(array), this.index);
    this.index += array.length * array.BYTES_PER_ELEMENT;
  }

  writeString(value, sizeType) {
    let stringBuffer = new Uint8Array(value.length);

    for (let i = 0; i < value.length; i++) {
      stringBuffer.set([value.charCodeAt(i)], i);
    }

    this.writeVArray(stringBuffer, sizeType);
  }

  writeStringFArray(value, capacity, sizeType) {
    for (let i = 0; i < capacity; i++) {
      this.writeString(value[i], sizeType);
    }
  }

  writeStringVArray(array, arrayType, sizeType) {
    switch (arrayType) {
      case 1:
        this.buffer.set([array.length], this.index);
        break;
      case 2:
        this.buffer.set(IntBuffer.Int16ToLE(array.length), this.index);
        break;
      case 4:
        this.buffer.set(IntBuffer.Int32ToLE(array.length), this.index);
        break;
      case 8:
        this.buffer.set(IntBuffer.Int32ToLE(array.length), this.index);
        break;
      default:
        console.error("Unsupported size type.");
        break;
    }

    this.index += arrayType;

    for (let i = 0; i < array.length; i++) {
      this.writeString(array[i], sizeType);
    }
  }
}

class IntBuffer {
  static IsHostLittleEndian() {
    let buffer = new ArrayBuffer(2);
    let byteArray = new Uint8Array(buffer);
    let shortArray = new Uint16Array(buffer);
    byteArray[0] = 0x11;
    byteArray[1] = 0x22;

    return shortArray[0] == 0x2211;
  }

  static Int32ToLE(number) {
    let buffer = new Array(4);
    buffer[0] = number & 0x000000ff;
    buffer[1] = (number >> 8) & 0x0000ff;
    buffer[2] = (number >> 16) & 0x00ff;
    buffer[3] = number >> 24;
    return buffer;
  }

  static Int16ToLE(number) {
    let buffer = new Array(2);
    buffer[0] = number & 0x00ff;
    buffer[1] = number >> 8;
    return buffer;
  }

  static Float32ToLE(number) {
    let buffer = new Float32Array(1);
    buffer[0] = number;
    let byteArray = new Int8Array(buffer.buffer);

    if (!IntBuffer.IsHostLittleEndian()) {
      byteArray.reverse();
    }

    return Array.from(byteArray);
  }

  static Float64ToLE(number) {
    let buffer = new Float64Array(1);
    buffer[0] = number;
    let byteArray = new Int8Array(buffer.buffer);

    if (!IntBuffer.IsHostLittleEndian()) {
      byteArray.reverse();
    }

    return Array.from(byteArray);
  }

  static BufferToInt8(buffer) {
    var buf = new ArrayBuffer(1);
    var view = new DataView(buf);

    buffer.forEach(function (b, i) {
      view.setUint8(i, b);
    });

    return view.getInt8(0);
  }

  static BufferToUInt8(buffer) {
    var buf = new ArrayBuffer(1);
    var view = new DataView(buf);

    buffer.forEach(function (b, i) {
      view.setUint8(i, b);
    });

    return view.getUint8(0);
  }

  static BufferToInt16(buffer) {
    var buf = new ArrayBuffer(2);
    var view = new DataView(buf);

    buffer.forEach(function (b, i) {
      view.setUint8(i, b);
    });

    return view.getInt16(0, true);
  }

  static BufferToUInt16(buffer) {
    var buf = new ArrayBuffer(2);
    var view = new DataView(buf);

    buffer.forEach(function (b, i) {
      view.setUint8(i, b);
    });

    return view.getUint16(0, true);
  }

  static BufferToInt32(buffer) {
    var buf = new ArrayBuffer(4);
    var view = new DataView(buf);

    buffer.forEach(function (b, i) {
      view.setUint8(i, b);
    });

    return view.getInt32(0, true);
  }

  static BufferToUInt32(buffer) {
    var buf = new ArrayBuffer(4);
    var view = new DataView(buf);

    buffer.forEach(function (b, i) {
      view.setUint8(i, b);
    });

    return view.getUint32(0, true);
  }

  static BufferToFloat32(buffer) {
    // Create a buffer
    var buf = new ArrayBuffer(4);
    // Create a data view of it
    var view = new DataView(buf);

    // set bytes
    buffer.forEach(function (b, i) {
      view.setUint8(i, b);
    });

    // Read the bits as a float; note that by doing this, we're implicitly
    // converting it from a 32-bit float into JavaScript's native 64-bit double
    return view.getFloat32(0);
  }

  static BufferToFloat64(buffer) {
    // Create a buffer
    var buf = new ArrayBuffer(8);
    // Create a data view of it
    var view = new DataView(buf);

    // set bytes
    buffer.forEach(function (b, i) {
      view.setUint8(i, b);
    });

    // Read the bits as a float; note that by doing this, we're implicitly
    // converting it from a 32-bit float into JavaScript's native 64-bit double
    return view.getFloat64(0);
  }

  static TypedArrayToByteArray(typedArray) {
    let elementSize = typedArray.BYTES_PER_ELEMENT;
    let buffer = new Uint8Array(elementSize * typedArray.length);

    if (typedArray.constructor.name.indexOf("Float") == 0) {
      // type is float array
      switch (elementSize) {
        case 4:
          for (let i = 0; i < typedArray.length; i++) {
            buffer.set(IntBuffer.Float32ToLE(typedArray[i]), i * 4);
          }
          break;
        case 8:
          for (let i = 0; i < typedArray.length; i++) {
            buffer.set(IntBuffer.Float64ToLE(typedArray[i]), i * 8);
          }
          break;
      }
    } else {
      switch (elementSize) {
        case 1:
          for (let i = 0; i < typedArray.length; i++) {
            buffer.set([typedArray[i]], i);
          }
          break;
        case 2:
          for (let i = 0; i < typedArray.length; i++) {
            buffer.set(IntBuffer.Int16ToLE(typedArray[i]), i * 2);
          }
          break;
        case 4:
          for (let i = 0; i < typedArray.length; i++) {
            buffer.set(IntBuffer.Int32ToLE(typedArray[i]), i * 4);
          }
          break;
        case 8:
          // not yet supported
          break;
      }
    }

    return buffer;
  }

  static BigIntToLE64(bigInt) {
    let big64bit = BigInt.asUintN(64, bigInt);
    let high = Number(big64bit & 0xffffffffn);
    let low = Number(big64bit >> 32n);

    let bufferHigh = IntBuffer.Int32ToLE(high);
    let bufferLow = IntBuffer.Int32ToLE(low);

    return bufferHigh.concat(bufferLow);
  }

  static LE64ToBigInt(buffer) {
    let low = buffer.slice(0, 4);
    let high = buffer.slice(4, 8);

    let lowInt = IntBuffer.BufferToUInt32(low);
    let highInt = IntBuffer.BufferToUInt32(high);

    let bigInt = (BigInt(highInt) << 32n) | BigInt(lowInt);

    return BigInt.asIntN(64, bigInt);
  }

  static LE64ToBigUInt(buffer) {
    let low = buffer.slice(0, 4);
    let high = buffer.slice(4, 8);

    let lowInt = IntBuffer.BufferToUInt32(low);
    let highInt = IntBuffer.BufferToUInt32(high);

    let bigInt = (BigInt(highInt) << 32n) | BigInt(lowInt);

    return BigInt.asUintN(64, bigInt);
  }
}

module.exports = { Clad, CladBuffer, IntBuffer };

},{}],4:[function(require,module,exports){
/* Copyright (c) 2019-2020 Digital Dream Labs. See LICENSE file for details. */

var { VectorBluetooth } = require("./vectorBluetooth.js");
var { RtsCliUtil } = require("./rtsCliUtil.js");
var { IntBuffer } = require("./clad.js");
var { RtsV2Handler } = require("./rtsV2Handler.js");
var { RtsV3Handler } = require("./rtsV3Handler.js");
var { RtsV4Handler } = require("./rtsV4Handler.js");
var { RtsV5Handler } = require("./rtsV5Handler.js");
var { RtsV6Handler } = require("./rtsV6Handler.js");
var { Sessions } = require("./sessions.js");
var { Settings } = require("./settings.js");
var { TYPE } = require("./stack.js");

let rtsHandler = null;
let vecBle = new VectorBluetooth();

let _sodium = null;

let currentPhase = 1;
let selectedNetwork = null;
let scannedNetworks = [];
let cloudSession = {};
let _version = 0;
let _wifiCredentials = null;
let _settings = null;
let _stack = null;
let _otaEndpoint = null;
let _serverIp = null;
let _networkIp = null;
let _serverPort = null;
let urlParams = {};
let _statusInterval = null;
let _enableAutoFlow = true;
let _sessions = new Sessions();
let _filter = null;
let _cmdPending = false;
setView(_sessions.getViewMode(), false);

window.sodium = {
  onload: function (sodium) {
    //
    _sodium = sodium;
  },
};

// set build type
function parseParams() {
  let params = new URL(window.location.href).searchParams;
  let buildType = params.get("build");
  switch (buildType) {
    case "dev":
    case "beta":
    case "prod":
      _build = buildType;
      break;
    default:
      _build = "prod";
      break;
  }

  let wifiSsid = params.get("wifiSsid");
  let wifiPassword = params.get("wifiPassword");

  if (wifiSsid != null) {
    _wifiCredentials = {
      ssid: wifiSsid,
      pw: wifiPassword,
      auth: 6,
    };
  }
}

//************* Settings ******************
function setupStacks(stacks) {
  var btns = "";

  if (stacks.length === 1) {
    handleStackSelection(stacks[0]);
    return;
  }

  stacks.map((stack) => (btns += generateStackRow(stack)));

  $("#envOptions").html(btns);

  $(".vec-env-select-btn").click(function () {
    var selectedStack = $("#envOptions").val();
    handleStackSelection(selectedStack);
  });
}

function handleStackSelection(stackName) {
  _stack = _settings.getStack(stackName);

  configurePtrem();

  $("#boxVectorEnv").removeClass("vec-hidden");
  $("#vecEnv").html(stackName);

  toggleIcon("iconEnv", true);

  setPhase("containerDiscover");
}

function generateStackRow(name) {
  return (
    '<option value="' +
    name +
    '">' +
    name.charAt(0).toUpperCase() +
    name.slice(1) +
    "</option>"
  );
}

function configurePtrem() {
  // load env
  let env = _sessions.getEnv();
  if (env != null) {
    pterm_env = env;
  }

  pterm_on("env", function () {
    _sessions.setEnv(pterm_env);
    _sessions.save();
  });

  // pterm_set("OTA_LKG", _stack.otaEndpoints);
  pterm_set("OTA_URL", urlParams["otaUrl"]);

  let lastVector = _sessions.getLastVector();
  if (lastVector) {
    pterm_set("LAST", lastVector);
  }

  pterm_insert_history("ble-connect '" + lastVector + "'");
}

//**************** OTA *******************
function setupOTAFiles() {
  if (_version != 2) {
    toggleIcon("iconOta", true);
    setPhase("containerAccount");
    return;
  }

  if (_stack === null) {
    return;
  }

  getOtasPresent(_stack.name).then((data) => {
    if (!Array.isArray(data.message)) {
      console.log("No otas found for env");
      data.message = [];
    }

    var localOtas = data.message;

    var localUrlPrefix = `http://${_networkIp}:${_serverPort}/static/firmware/${_stack.name}/`;
    var otaUrls = [];

    localOtas.map((endpoint) => {
      var obj = parseURL(localUrlPrefix + endpoint);
      obj.type = TYPE.LOCAL;
      otaUrls.push(obj);
    });

    console.log(otaUrls);

    setPhase("containerOta");

    // No URL present
    if (otaUrls.length == 0) {
      $("#containerOtaSelection").addClass("vec-hidden");
      $("#containerOtaNoImage").removeClass("vec-hidden");
    }
    // One URL present
    else if (otaUrls.length == 1) {
      $("#containerOtaSelection").addClass("vec-hidden");
      $("#otaUpdate").removeClass("vec-hidden");
      _otaEndpoint = otaUrls[0].href;
      doOta();
    }
    // Multiple URL's presents
    else {
      var urlViews = "";
      otaUrls.map((url, index) => (urlViews += generateOtaFileRow(index, url)));
      $("#otaSelection").html(urlViews);

      $(".vec-ota-row").click(function () {
        $("#containerOtaSelection").addClass("vec-hidden");
        $("#otaUpdate").removeClass("vec-hidden");

        var selectedUrl = $(this).data().value;
        _otaEndpoint = otaUrls[selectedUrl].href;

        pterm_set("OTA_LKG", _otaEndpoint);
        // Previous version allowed webclient to be configured using
        // url params. OTA_URL was used to send that to pterm
        pterm_set("OTA_URL", _otaEndpoint);

        doOta();
      });
    }
  });
}

function parseURL(url) {
  var obj = new URL(url);
  obj.filename = url.substring(url.lastIndexOf("/") + 1);
  return obj;
}

function getOtasPresent(env) {
  return new Promise((resolve, reject) => {
    $.ajax({
      type: "POST",
      url: `http://${_serverIp}:${_serverPort}/firmware`,
      data: {
        env: env,
      },
    })
      .done(function (data) {
        resolve(data);
      })
      .fail(function (data) {
        reject(data);
      });
  });
}

function generateOtaFileRow(value, urlObj) {
  var img = "";

  if (urlObj.type == TYPE.CLOUD) {
    img = "/static/images/fontawesome/cloud-download-alt-solid.svg";
  } else if (urlObj.type == TYPE.LOCAL) {
    img = "/static/images/fontawesome/sd-card-solid.svg";
  }

  return (
    `<div 'data-value="${value}" class="row vec-ota-row">` +
    `<div class="col-md-2"><img class="vec-ota-type" src="${img}" /> </div>` +
    `<div class="vec-ota-name col-md-10">` +
    `<div class="vec-ota-name col-md-12">${urlObj.filename}</div>` +
    `<div class="vec-ota-host col-md-12">${urlObj.hostname}</div>` +
    `</div>` +
    `</div>`
  );
}

function getOtaUrl() {
  if ("otaUrl" in urlParams) {
    return urlParams["otaUrl"];
  } else {
    return _otaEndpoint;
  }
}

//**************** Wifi *******************

function connectToWifi(ssid, pw, auth) {
  rtsHandler.doWifiConnect(ssid, pw, auth, 15).then(function (msg) {
    if (msg.value.wifiState == 2 || msg.value.wifiState == 1) {
      $("#wifiConnectErrorLabel").addClass("vec-hidden");
      toggleIcon("iconWifi", true);
      setupOTAFiles();
    } else {
      // wifi failed
      $("#wifiConnectErrorLabel").removeClass("vec-hidden");
      scanForWifi();
      _wifiCredentials = null;
    }
  });
}

function toggleIcon(icon, on) {
  $("#" + icon).removeClass("vec-icon-active");
  $("#" + icon).addClass("vec-icon-done");
}

function setPhase(phase) {
  // general clearing
  $("#txtPin").val("");

  // update icon
  let icon = $("#" + phase).attr("icon");
  if (icon != null && icon != "") {
    $(".vec-icon").removeClass("vec-icon-active");
    $("#" + icon).addClass("vec-icon-active");
  }

  $(".vec-container.vec-current").css("opacity", 0);
  $(".vec-container.vec-current").removeClass("vec-current");
  $("#" + phase).addClass("vec-current");
  $("#" + phase).css("opacity", 1);

  if (phase == "containerAccount") {
    $("#newAccount").css("opacity", 0);
    $("#newAccount").css("display", "none");
  }
}

function setOtaProgress(percent) {
  let maskWidth = (1 - percent) * 100;
  $("#progressBarOta")
    .children(".vec-progress-bar-mask")
    .css("width", maskWidth + "%");
}

function setLogProgress(percent) {
  let maskWidth = (1 - percent) * 100;
  $("#progressBarLogs")
    .children(".vec-progress-bar-mask")
    .css("width", maskWidth + "%");
}

function generateWifiRow(hex, auth, strength) {
  let ssid = RtsCliUtil.convertHexToStr(hex);
  let n = "1";
  if (strength > 45) {
    n = "2";
  }
  if (strength > 65) {
    n = "3";
  }
  let img = "/static/images/settings_icon_wifilife_" + n + "bars_mini.svg";
  return (
    `<div class="vec-wifi-row" authType="${auth}" hexId="${hex}">` +
    `<img class="vec-wifi-signal" src="${img}" />` +
    `<div class="vec-wifi-ssid">${ssid}</div>` +
    "</div>"
  );
}

function displayWifiNetworks(m) {
  let wifiHtml = "";

  for (let i = 0; i < m.scanResult.length; i++) {
    if (m.scanResult[i].wifiSsidHex == "hidden") continue;

    wifiHtml += generateWifiRow(
      m.scanResult[i].wifiSsidHex,
      m.scanResult[i].authType,
      m.scanResult[i].signalStrength
    );
  }

  $("#wifiScanTable").html(wifiHtml);
}

function handleDisconnected() {
  cleanRtsHandler();
  pterm_changeprompt("", null);
  clearInterval(_statusInterval);
  $("#boxVectorStatus").addClass("vec-hidden");
  toggleIcon("iconBle", false);
  setPhase("containerDiscover");
}

function doOta() {
  if (_version == 2) {
    rtsHandler.doOtaStart(getOtaUrl()).then(
      function (msg) {
        console.log("ota success");
      },
      function (msg) {
        console.log(msg);
        $("#otaErrorLabel").removeClass("vec-hidden");
        $("#btnTryAgain").removeClass("vec-hidden");
      }
    );
  } else {
    toggleIcon("iconOta", true);
    setPhase("containerAccount");
  }
}

function setView(mode, animate) {
  _sessions.setViewMode(mode);
  _sessions.save();

  if (!animate) {
    $(".vec-panel").addClass("pterm-no-transition");
  }

  if (mode == 1) {
    $(".vec-panel-ui").css("flex", "1 0 50%");
    $(".vec-shell").css("flex", "0");
  } else if (mode == 2) {
    $(".vec-panel-ui").css("flex", "1 0 50%");
    $(".vec-shell").css("flex", "1 0 50%");
  } else if (mode == 3) {
    $(".vec-panel-ui").css("flex", "0");
    $(".vec-shell").css("flex", "1 0 50%");
  }

  $(".vec-panel")[0].offsetHeight;

  if (!animate) {
    $(".vec-panel").removeClass("pterm-no-transition");
  }
}

$(document).ready(function () {
  $(document).keydown(function (event) {
    if (event.altKey) {
      if (event.keyCode == 49) {
        setView(1, true);
      } else if (event.keyCode == 50) {
        setView(2, true);
      } else if (event.keyCode == 51) {
        setView(3, true);
      }
    }
  });

  console.log(
    " __      ________ _____ _______ ____  _____  \n" +
      " \\ \\    / /  ____/ ____|__   __/ __ \\|  __ \\ \n" +
      "  \\ \\  / /| |__ | |       | | | |  | | |__) |\n" +
      "   \\ \\/ / |  __|| |       | | | |  | |  _  / \n" +
      "    \\  /  | |___| |____   | | | |__| | | \\ \\ \n" +
      "     \\/   |______\\_____|  |_|  \\____/|_|  \\_\\"
  );

  console.log(
    "\nURL parameters:\n" +
      "\t    wifiSsid = WIFI_SSID\n" +
      "\twifiPassword = WIFI_PASSWORD\n\n"
  );

  if (!navigator.bluetooth) {
    setPhase("containerIncompatible");
    return;
  }

  // process url params
  parseParams();

  // set up env selection
  $.getJSON("/static/data/settings.json", function (json) {
    try {
      _settings = new Settings(json);

      setPhase("containerEnvironment");
      // setPhase("containerAccount");

      setupStacks(_settings.getStackNames());
    } catch (error) {
      console.error(error);
      setPhase("containerEnvironmentError");
    }
  }).fail(function () {
    setPhase("containerEnvironmentError");
  });

  _serverIp = $("#serverIp").text();
  _networkIp = $("#networkIp").text();
  _serverPort = $("#serverPort").text();

  // listen to ble messages
  vecBle.onReceive(handleRtsHandshake);
  vecBle.onDisconnected(handleDisconnected);
  vecBle.onCancelSelect(function () {
    setPhase("containerDiscover");

    if (_cmdPending) {
      _cmdPending = false;
      newLine();
    }
  });

  $("#containerEnvironment").css("opacity", 1);

  $("#wifiScanTable").on("click", ".vec-wifi-row", function () {
    for (let i = 0; i < scannedNetworks.length; i++) {
      if (scannedNetworks[i].wifiSsidHex == $(this).attr("hexId")) {
        selectedNetwork = scannedNetworks[i];
      }
    }

    $("#txtWifiSsid").val($(this).children(".vec-wifi-ssid").html());
    $("#txtWifiSsid").addClass("readonly");
    $("#txtWifiSsid").prop("readonly", true);
    setPhase("containerWifiConfig");
  });

  $(".vec-container").bind("keypress", function (e) {
    if (e.which == 13) {
      let buttons = $(this).children('[type="button"]');
      buttons.first().trigger("click");
      return false;
    }
  });

  pterm_on("cmd", function (args) {
    if (rtsHandler != null) {
      pterm_handled = rtsHandler.handleCli(args);
    } else {
      pterm_handled = true;

      if (args[0] == "help") {
        let helpArgs = {
          "ble-connect": {
            args: 0,
            des: "Scan and connect to a Vector",
            help: "ble-connect [VECTOR_NAME]",
          },
          "ble-clear": {
            args: 0,
            des: "Clear stored session data.",
            help: "ble-clear",
          },
          echo: {
            args: 1,
            des: "Echo text to terminal.",
            help: "echo $LAST",
          },
          export: {
            args: 1,
            des: "Save env variables.",
            help: "export MY_VAR=0 OTHER_VAR=40",
          },
          printenv: {
            args: 0,
            des: "Print environment variables.",
            help: "printenv",
          },
          unset: {
            args: 1,
            des: "Unset env variables",
            help: "unset MY_VAR",
          },
        };
        pterm_print(RtsCliUtil.printHelp(helpArgs));
      } else if (args[0] == "ble-connect") {
        if (args[1]) {
          if (args[1].length == 4) {
            _filter = "Vector " + args[1];
          } else {
            _filter = args[1];
          }
        } else {
          _filter = null;
        }
        $("#btnDiscoverVector").click();
        _cmdPending = true;
        pterm_handled = false;
      } else if (args[0] == "ble-clear") {
        _sessions.clearSessions();
        _sessions.save();
      }
    }
  });
});

let handleRtsHandshake = {};
handleRtsHandshake.receive = function (data) {
  if (data[0] == 1 && data.length == 5) {
    // This message is a handshake from Vector
    let version = IntBuffer.BufferToUInt32(data.slice(1));
    HandleHandshake(version);
  } else {
    // Received message after version handler exists
  }
};

function doCloudLogin(inputUsername, inputPassword) {
  let self = this;
  let p = new Promise(function (resolve, reject) {
    $.ajax({
      type: "POST",
      url: _stack.getAccountEndpoints() + "/1/sessions",
      headers: {
        "Anki-App-Key": _stack.getApiKeys(),
      },
      data: {
        username: inputUsername,
        password: inputPassword,
      },
    })
      .done(function (data) {
        resolve(data);
      })
      .fail(function (data) {
        reject(data);
      });
  });

  return p;
}

function doPasswordReset(inputEmail) {
  let p = new Promise(function (resolve, reject) {
    $.ajax({
      type: "POST",
      url: _stack.getAccountEndpoints() + "/1/reset_user_password",
      headers: {
        "Anki-App-Key": _stack.getApiKeys(),
      },
      data: {
        email: inputEmail,
      },
    })
      .done(function (data) {
        resolve(data);
      })
      .fail(function (data) {
        reject(data);
      });
  });

  return p;
}

function createAccount(inputEmail, inputPassword, inputDob) {
  let p = new Promise(function (resolve, reject) {
    $.ajax({
      type: "POST",
      url: _stack.getAccountEndpoints() + "/1/users",
      headers: {
        "Anki-App-Key": _stack.getApiKeys(),
      },
      dataType: "json",
      contentType: "application/json",
      data: JSON.stringify({
        email: inputEmail,
        password: inputPassword,
        dob: inputDob,
        created_by_app_name: "vector-web-setup",
        created_by_app_platform: "web",
        created_by_app_version: "1.0.0",
      }),
    })
      .done(function (data) {
        resolve(data);
      })
      .fail(function (data) {
        reject(data);
      });
  });

  return p;
}

function GenerateHandshakeMessage(version) {
  let buffer = IntBuffer.Int32ToLE(version);
  return [1].concat(buffer);
}

function scanForWifi() {
  rtsHandler.doWifiScan().then(function (m) {
    scannedNetworks = m.value;
    displayWifiNetworks(m.value);
    setPhase("containerWifi");
  });
}

function updateStatusBox(m) {
  $("#boxVectorStatus").removeClass("vec-hidden");
  if (m.value.wifiState == 1 || m.value.wifiState == 2) {
    $("#vecInfoWifi").removeClass("vec-hidden");
    $("#vecStatusSsid").html(RtsCliUtil.convertHexToStr(m.value.wifiSsidHex));
  } else {
    $("#vecInfoWifi").addClass("vec-hidden");
  }
  $("#vecInfoEsn").html(m.value.esn);
  $("#vecInfoBuild").html(m.value.version.split("-")[0]);
  $("#vecStatusTitle").html(vecBle.bleName);

  if (
    _version == 2 ||
    _version == 3 ||
    !m.value.hasOwner ||
    m.value.isCloudAuthed
  ) {
    // RtsV2 or Cloud authorized

    // Save session
    saveSession();

    enableLogPanel();
  }
}

function saveSession() {
  // Save session
  let remoteKey = rtsHandler.remoteKeys.publicKey;
  let name = vecBle.bleName;
  let encryptKey = rtsHandler.cryptoKeys.encrypt;
  let decryptKey = rtsHandler.cryptoKeys.decrypt;
  _sessions.setSession(remoteKey, name, encryptKey, decryptKey);
  _sessions.setKeys(rtsHandler.keys.publicKey, rtsHandler.keys.privateKey);
  _sessions.save();
}

function enableLogPanel() {
  $("#boxStatusLogs").removeClass("vec-hidden");
}

function cleanRtsHandler() {
  if (rtsHandler != null) {
    rtsHandler.cleanup();
    rtsHandler = null;
  }
}

function HandleHandshake(version) {
  cleanRtsHandler();
  toggleIcon("iconBle", true);

  switch (version) {
    case 6:
      // RTSv6
      rtsHandler = new RtsV6Handler(vecBle, _sodium, _sessions);
      break;
    case 5:
      // RTSv5
      rtsHandler = new RtsV5Handler(vecBle, _sodium, _sessions);
      break;
    case 4:
      // RTSv4
      rtsHandler = new RtsV4Handler(vecBle, _sodium, _sessions);
      break;
    case 3:
      // RTSv3 (Dev)
      rtsHandler = new RtsV3Handler(vecBle, _sodium, _sessions);
      break;
    case 2:
      // RTSv2 (Factory)
      rtsHandler = new RtsV2Handler(vecBle, _sodium, _sessions);
      break;
    default:
      // Unknown
      break;
  }

  _version = version;

  rtsHandler.onReadyForPin(function () {
    setPhase("containerEnterPin");

    if (_cmdPending) {
      pterm_read("Enter pin:").then(function (args) {
        _enableAutoFlow = false;
        _cmdPending = false;
        rtsHandler.enterPin(args[0]);
        setPhase("containerLoading");
      });
    }
  });

  rtsHandler.onEncryptedConnection(function () {
    $("#discoverFirstTime").addClass("vec-hidden");
    $("#discoverReconnect").removeClass("vec-hidden");

    if (_statusInterval != null) {
      clearInterval(_statusInterval);
    }

    if (_cmdPending) {
      _cmdPending = false;
      newLine();
    }

    rtsHandler.doStatus().then(function (m) {
      updateStatusBox(m);

      if (!_enableAutoFlow) {
        // early out of auto update flow
        $(".vec-panel-ui").css("flex", "0");
        $(".vec-shell").css("flex", "1 0 50%");
        return;
      }

      if (m.value.wifiState == 1 || m.value.wifiState == 2) {
        toggleIcon("iconWifi", true);
        // skip wifi scan
        setupOTAFiles();
      } else if (_wifiCredentials != null) {
        // try to reconnect with stored credentials
        rtsHandler.doWifiScan().then(function (m) {
          connectToWifi(
            _wifiCredentials.ssid,
            _wifiCredentials.pw,
            _wifiCredentials.auth
          );
        });
      } else {
        scanForWifi();
      }
    });

    _sessions.setLastVector(vecBle.bleName);
    _sessions.save();
    pterm_set("LAST", vecBle.bleName);

    pterm_changeprompt(
      "[v" + _version + "] " + vecBle.bleName.split(" ")[1],
      "blue"
    );
  });

  if (rtsHandler.onCloudAuthorized) {
    rtsHandler.onCloudAuthorized(function (value) {
      if (value.success) {
        // save session
        saveSession();
      }
    });
  }

  rtsHandler.onOtaProgress(function (value) {
    if (value.status == 2) {
      let progress = Number(value.current) / Number(value.expected);
      setOtaProgress(progress);
    } else if (value.status == 3) {
      // handle OTA complete
      toggleIcon("iconOta", true);
      setPhase("containerDiscover");
    } else {
      // todo: handle failure
    }
  });

  rtsHandler.onLogProgress(function (value) {
    let progress = Number(value.packetNumber) / Number(value.packetTotal);
    setLogProgress(progress);
  });

  rtsHandler.onCliResponse(function (output) {
    pterm_print(output);
    newLine();
  });

  rtsHandler.onPrint(function (output) {
    pterm_print(output);
  });

  rtsHandler.onCommandDone(function () {
    newLine();
  });

  rtsHandler.onNewProgressBar(function () {
    pterm_new_progress_bar();
  });

  rtsHandler.onUpdateProgressBar(function (value, total) {
    pterm_set_progress_bar(value, total);
  });

  rtsHandler.onLogsDownloaded(function (name, logFile) {
    var file = new Blob(logFile, { type: ".tar.gz" });
    var a = document.createElement("a"),
      url = URL.createObjectURL(file);
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 0);
  });

  vecBle.send(GenerateHandshakeMessage(version));
}

$("#btnTryAgain").click(function () {
  $("#btnTryAgain").addClass("vec-hidden");
  $("#otaErrorLabel").addClass("vec-hidden");
  doOta();
});

$("#btnDiscoverVector").click(function () {
  setPhase("containerLoading");
  vecBle.tryConnect(_filter);
  _filter = null;
});

$("#btnEnterPin").click(function () {
  _enableAutoFlow = $("#checkboxEnableAutoFlow").is(":checked");
  rtsHandler.enterPin($("#txtPin").val());
  setPhase("containerLoading");
});

$("#btnConnectWifi").click(function () {
  let auth = 6;
  if (selectedNetwork != null) {
    auth = selectedNetwork.authType;
  }

  _wifiCredentials = {
    ssid: $("#txtWifiSsid").val(),
    pw: $("#txtWifiPw").val(),
    auth: auth,
  };

  setPhase("containerLoading");

  connectToWifi(_wifiCredentials.ssid, _wifiCredentials.pw, auth);

  $("#txtWifiSsid").val("");
  $("#txtWifiPw").val("");
});

$("#btnCustomWifi").click(function () {
  selectedNetwork = null;
  $("#txtWifiSsid").removeClass("readonly");
  $("#txtWifiSsid").prop("readonly", false);
  setPhase("containerWifiConfig");
});

$("#passwordReset").click(function () {
  var email = prompt("Please enter your email:");
  if (email) {
    doPasswordReset(email).then(() => {
      alert("We have sent you an email with a link to reset your password");
    });
  }
});

$("#createAccount").click(function () {
  $("#accountAuth").css("opacity", 0);
  $("#accountAuth").css("visibility", "hidden");
  $("#accountAuth").css("display", "none");

  $("#newAccount").css("opacity", 1);
  $("#newAccount").css("visibility", "visible");
  $("#newAccount").css("display", "block");
});

$("#btnCancelAccountCreation").click(function () {
  showAccountAuth();
});

const showAccountAuth = () => {
  $("#newAccount").css("opacity", 0);
  $("#newAccount").css("visibility", "hidden");
  $("#newAccount").css("display", "none");

  $("#accountAuth").css("opacity", 1);
  $("#accountAuth").css("visibility", "visible");
  $("#accountAuth").css("display", "block");
};

$("#btnCreateAccount").click(function () {
  // let cloudUsername = $("#txtNewAccountUsername").val();
  let cloudEmail = $("#txtNewAccountEmail").val();
  let cloudPassword = $("#txtNewAccountPw").val();
  let cloudDob = $("#txtNewAccountDob").val();

  var re = /[A-Z0-9._%+-]+@[A-Z0-9.-]+.[A-Z]{2,4}/gim;

  if (cloudEmail == "" || !re.test(cloudEmail)) {
    handleAccountCreationError("Please enter a valid email address");
    return;
  }

  createAccount(cloudEmail, cloudPassword, cloudDob).then(
    () => {
      showAccountAuth();

      // $("#txtNewAccountUsername").val("");
      $("#txtNewAccountEmail").val("");
      $("#txtNewAccountPw").val("");
      $("#txtNewAccountDob").val("");

      alert("We have sent you an email with a link to activate your account");
    },
    (data) => {
      const response = data.responseJSON.message;

      if (response !== undefined) {
        handleAccountCreationError(response);
      } else {
        handleAccountCreationError(
          "Error while creating account. Please try again."
        );
      }
    }
  );
});

function handleAccountCreationError(msg) {
  $("#accountCreationErrorLabel").html(msg);
  $("#accountCreationErrorLabel").removeClass("vec-hidden");
}

$("#txtAccountUsername").keypress(function (e) {
  var key = e.which;
  if (key == 13) {
    // the enter key code
    $("#txtAccountPw").focus();
    return false;
  }
});

$("#txtAccountPw").keypress(function (e) {
  var key = e.which;
  if (key == 13) {
    // the enter key code
    $("#btnConnectCloud").click();
    return false;
  }
});

$("#btnConnectCloud").click(function () {
  let cloudUsername = $("#txtAccountUsername").val();
  let cloudPassword = $("#txtAccountPw").val();

  setPhase("containerLoading");

  $("#txtAccountPw").val("");

  doCloudLogin(cloudUsername, cloudPassword).then(
    function (data) {
      cloudSession.sesionToken = data.session.session_token;

      rtsHandler.doAnkiAuth(cloudSession.sesionToken).then(function (msg) {
        if (msg.value.success) {
          cloudSession.clientToken = msg.value.clientTokenGuid;

          // adjust default timezone
          let tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
          let jqtz = $("#selectTimeZone option[value='" + tz + "']");
          jqtz.prop("selected", "selected");

          toggleIcon("iconAccount", true);
          setPhase("containerSettings");
          enableLogPanel();
        } else {
          // todo: handle case when session token fails
          handleLoginError("Error in bot authentication. Please try again.");
        }
      });
    },
    function (data) {
      let msg = "Error logging in. Please try again.";
      console.log(data);
      if (
        data.status == 403 &&
        data.responseJSON.code == "invalid_username_or_password"
      ) {
        msg = data.responseJSON.message;
      }

      handleLoginError(msg);
    }
  );
});

function handleLoginError(msg) {
  $("#accountErrorLabel").html(msg);
  $("#accountErrorLabel").removeClass("vec-hidden");
  setPhase("containerAccount");
}

$("#btnFinishSetup").click(function () {
  let timezone = $("#selectTimeZone").val();
  let locale = navigator.locale;
  let isFahrenheit = $("#selectTemperature").val() == "fahrenheit";
  let isMetric = $("#selectDistance").val() == "metric";
  let allowDataAnalytics = $("#checkboxDataAnalytics").is(":checked");
  let alexaOptIn = $("#checkboxEnableAlexa").is(":checked");

  setPhase("containerLoading");

  rtsHandler
    .doSdk(
      cloudSession.clientToken,
      "1",
      "/v1/alexa_opt_in",
      JSON.stringify({ opt_in: alexaOptIn })
    )
    .then(function (alexaRes) {
      // todo: check response for status 200
      rtsHandler
        .doSdk(
          cloudSession.clientToken,
          "1",
          "/v1/update_account_settings",
          '{ "account_settings":{ "data_collection":' +
            allowDataAnalytics +
            ', "app_locale":"' +
            locale +
            '"} }'
        )
        .then(function (response) {
          // todo: check response for status 200
          rtsHandler
            .doSdk(
              cloudSession.clientToken,
              "1",
              "/v1/update_settings",
              JSON.stringify({
                settings: {
                  time_zone: timezone,
                  locale: locale,
                  dist_is_metric: isMetric,
                  temp_is_fahrenheit: isFahrenheit,
                },
              })
            )
            .then(function (settingsResponse) {
              // todo: check response for status 200 then wake
              rtsHandler
                .doSdk(
                  cloudSession.clientToken,
                  "1",
                  "/v1/send_onboarding_input",
                  JSON.stringify({
                    onboarding_mark_complete_and_exit: {},
                  })
                )
                .then(function (msg) {
                  toggleIcon("iconSettings", true);
                  setPhase("containerComplete");
                });
            });
        });
    });
});

$("#txtAccountPwEye").click(function () {
  let pwId = "#" + $(this).attr("target");
  if ($(this).attr("state") == "visible") {
    $(this).attr("state", "hidden");
    $(this)
      .children(".vec-eyecon")
      .attr("src", "../images/fontawesome/eye-solid.svg");
    $(pwId).attr("type", "text");
  } else {
    $(this).attr("state", "visible");
    $(this)
      .children(".vec-eyecon")
      .attr("src", "../images/fontawesome/eye-slash-solid.svg");
    $(pwId).attr("type", "password");
  }
});

$("#btnDownloadLogs").click(function () {
  $("#btnDownloadLogs").addClass("vec-hidden");
  $("#panelLogs").removeClass("vec-hidden");
  rtsHandler.doLog().then(function () {
    $("#btnDownloadLogs").removeClass("vec-hidden");
    $("#panelLogs").addClass("vec-hidden");
  });
});

},{"./clad.js":3,"./rtsCliUtil.js":6,"./rtsV2Handler.js":7,"./rtsV3Handler.js":8,"./rtsV4Handler.js":9,"./rtsV5Handler.js":10,"./rtsV6Handler.js":11,"./sessions.js":12,"./settings.js":13,"./stack.js":14,"./vectorBluetooth.js":15}],5:[function(require,module,exports){
//Copyright (c) 2019-2020 Digital Dream Labs. See LICENSE file for details.
//
// Autogenerated JS message buffer code.
// Source: victor-clad/clad/sdk/clad/externalInterface/messageExternalComms.clad
// Full command line: ./victor-clad/tools/message-buffers/emitters/JS_emitter.py -o . victor-clad/clad/sdk/clad/externalInterface/messageExternalComms.clad

const { Clad, CladBuffer } = require("./clad.js");

if (Anki === undefined) {
  var Anki = {};
}
if (Anki.Vector === undefined) {
  Anki.Vector = {};
}
if (Anki.Vector.ExternalComms === undefined) {
  Anki.Vector.ExternalComms = {};
}
// ENUM RtsMode
Anki.Vector.ExternalComms.RtsMode = Object.freeze({
  RAW: 0x0,
  CLAD: 0x1,
  CLAD_ENCRYPTED: 0x2,
});

// ENUM RtsConnType
Anki.Vector.ExternalComms.RtsConnType = Object.freeze({
  FirstTimePair: 0x0,
  Reconnection: 0x1,
});

// ENUM RtsResponseCode
Anki.Vector.ExternalComms.RtsResponseCode = Object.freeze({
  NotCloudAuthorized: 0,
  UnsupportedRequest: 1,
});

// ENUM RtsCloudStatus
Anki.Vector.ExternalComms.RtsCloudStatus = Object.freeze({
  UnknownError: 0x0,
  ConnectionError: 0x1,
  WrongAccount: 0x2,
  InvalidSessionToken: 0x3,
  AuthorizedAsPrimary: 0x4,
  AuthorizedAsSecondary: 0x5,
  Reauthorized: 0x6,
});

// MESSAGE RtsWifiScanResult
Anki.Vector.ExternalComms.RtsWifiScanResult = class extends Clad {
  constructor(authType, signalStrength, wifiSsidHex) {
    super();
    this.authType = authType;
    this.signalStrength = signalStrength;
    this.wifiSsidHex = wifiSsidHex;
  }

  type() {
    return "RtsWifiScanResult";
  }

  get size() {
    let result = 0;
    result += 1; // authType uint_8
    result += 1; // signalStrength uint_8
    result += 1; // wifiSsidHex length (uint_8)
    result += this.wifiSsidHex.length; // uint_8 array
    return result;
  }

  unpack(buffer) {
    let cladBuffer = new CladBuffer(buffer);
    this.authType = cladBuffer.readUint8();
    this.signalStrength = cladBuffer.readUint8();
    this.wifiSsidHex = cladBuffer.readString(1);
  }

  pack() {
    let buffer = new Uint8Array(this.size);
    let cladBuffer = new CladBuffer(buffer);

    try {
      cladBuffer.writeUint8(this.authType);
      cladBuffer.writeUint8(this.signalStrength);
      if (this.wifiSsidHex.length > 255) {
        buffer = null;
        return;
      }
      cladBuffer.writeString(this.wifiSsidHex, 1);
    } catch {
      return null;
    }
    return cladBuffer.buffer;
  }

  string() {
    return JSON.stringify(this);
  }
};

// MESSAGE RtsWifiScanResult_2
Anki.Vector.ExternalComms.RtsWifiScanResult_2 = class extends Clad {
  constructor(authType, signalStrength, wifiSsidHex, hidden) {
    super();
    this.authType = authType;
    this.signalStrength = signalStrength;
    this.wifiSsidHex = wifiSsidHex;
    this.hidden = hidden;
  }

  type() {
    return "RtsWifiScanResult_2";
  }

  get size() {
    let result = 0;
    result += 1; // authType uint_8
    result += 1; // signalStrength uint_8
    result += 1; // wifiSsidHex length (uint_8)
    result += this.wifiSsidHex.length; // uint_8 array
    result += 1; // hidden bool
    return result;
  }

  unpack(buffer) {
    let cladBuffer = new CladBuffer(buffer);
    this.authType = cladBuffer.readUint8();
    this.signalStrength = cladBuffer.readUint8();
    this.wifiSsidHex = cladBuffer.readString(1);
    this.hidden = cladBuffer.readBool();
  }

  pack() {
    let buffer = new Uint8Array(this.size);
    let cladBuffer = new CladBuffer(buffer);

    try {
      cladBuffer.writeUint8(this.authType);
      cladBuffer.writeUint8(this.signalStrength);
      if (this.wifiSsidHex.length > 255) {
        buffer = null;
        return;
      }
      cladBuffer.writeString(this.wifiSsidHex, 1);
      cladBuffer.writeBool(this.hidden);
    } catch {
      return null;
    }
    return cladBuffer.buffer;
  }

  string() {
    return JSON.stringify(this);
  }
};

// MESSAGE RtsWifiScanResult_3
Anki.Vector.ExternalComms.RtsWifiScanResult_3 = class extends Clad {
  constructor(authType, signalStrength, wifiSsidHex, hidden, provisioned) {
    super();
    this.authType = authType;
    this.signalStrength = signalStrength;
    this.wifiSsidHex = wifiSsidHex;
    this.hidden = hidden;
    this.provisioned = provisioned;
  }

  type() {
    return "RtsWifiScanResult_3";
  }

  get size() {
    let result = 0;
    result += 1; // authType uint_8
    result += 1; // signalStrength uint_8
    result += 1; // wifiSsidHex length (uint_8)
    result += this.wifiSsidHex.length; // uint_8 array
    result += 1; // hidden bool
    result += 1; // provisioned bool
    return result;
  }

  unpack(buffer) {
    let cladBuffer = new CladBuffer(buffer);
    this.authType = cladBuffer.readUint8();
    this.signalStrength = cladBuffer.readUint8();
    this.wifiSsidHex = cladBuffer.readString(1);
    this.hidden = cladBuffer.readBool();
    this.provisioned = cladBuffer.readBool();
  }

  pack() {
    let buffer = new Uint8Array(this.size);
    let cladBuffer = new CladBuffer(buffer);

    try {
      cladBuffer.writeUint8(this.authType);
      cladBuffer.writeUint8(this.signalStrength);
      if (this.wifiSsidHex.length > 255) {
        buffer = null;
        return;
      }
      cladBuffer.writeString(this.wifiSsidHex, 1);
      cladBuffer.writeBool(this.hidden);
      cladBuffer.writeBool(this.provisioned);
    } catch {
      return null;
    }
    return cladBuffer.buffer;
  }

  string() {
    return JSON.stringify(this);
  }
};

// MESSAGE RtsConnRequest
Anki.Vector.ExternalComms.RtsConnRequest = class extends Clad {
  constructor(publicKey) {
    super();
    this.publicKey = publicKey;
  }

  type() {
    return "RtsConnRequest";
  }

  get size() {
    let result = 0;
    result += 32; // uint_8 array
    return result;
  }

  unpack(buffer) {
    let cladBuffer = new CladBuffer(buffer);
    this.publicKey = cladBuffer.readFArray(false, 1, 32, false);
  }

  pack() {
    let buffer = new Uint8Array(this.size);
    let cladBuffer = new CladBuffer(buffer);

    try {
      cladBuffer.writeFArray(this.publicKey);
    } catch {
      return null;
    }
    return cladBuffer.buffer;
  }

  string() {
    return JSON.stringify(this);
  }
};

// MESSAGE RtsConnRequest_6
Anki.Vector.ExternalComms.RtsConnRequest_6 = class extends Clad {
  constructor(publicKey, isPairing, bluetoothSigCompanyId, productId) {
    super();
    this.publicKey = publicKey;
    this.isPairing = isPairing;
    this.bluetoothSigCompanyId = bluetoothSigCompanyId;
    this.productId = productId;
  }

  type() {
    return "RtsConnRequest_6";
  }

  get size() {
    let result = 0;
    result += 32; // uint_8 array
    result += 1; // isPairing bool
    result += 2; // uint_8 array
    result += 1; // productId uint_8
    return result;
  }

  unpack(buffer) {
    let cladBuffer = new CladBuffer(buffer);
    this.publicKey = cladBuffer.readFArray(false, 1, 32, false);
    this.isPairing = cladBuffer.readBool();
    this.bluetoothSigCompanyId = cladBuffer.readFArray(false, 1, 2, false);
    this.productId = cladBuffer.readUint8();
  }

  pack() {
    let buffer = new Uint8Array(this.size);
    let cladBuffer = new CladBuffer(buffer);

    try {
      cladBuffer.writeFArray(this.publicKey);
      cladBuffer.writeBool(this.isPairing);
      cladBuffer.writeFArray(this.bluetoothSigCompanyId);
      cladBuffer.writeUint8(this.productId);
    } catch {
      return null;
    }
    return cladBuffer.buffer;
  }

  string() {
    return JSON.stringify(this);
  }
};

// MESSAGE RtsConnResponse
Anki.Vector.ExternalComms.RtsConnResponse = class extends Clad {
  constructor(connectionType, publicKey) {
    super();
    this.connectionType = connectionType;
    this.publicKey = publicKey;
  }

  type() {
    return "RtsConnResponse";
  }

  get size() {
    let result = 0;
    result += 1; // connectionType RtsConnType
    result += 32; // uint_8 array
    return result;
  }

  unpack(buffer) {
    let cladBuffer = new CladBuffer(buffer);
    this.connectionType = cladBuffer.readUint8();
    this.publicKey = cladBuffer.readFArray(false, 1, 32, false);
  }

  pack() {
    let buffer = new Uint8Array(this.size);
    let cladBuffer = new CladBuffer(buffer);

    try {
      cladBuffer.writeUint8(this.connectionType);
      cladBuffer.writeFArray(this.publicKey);
    } catch {
      return null;
    }
    return cladBuffer.buffer;
  }

  string() {
    return JSON.stringify(this);
  }
};

// MESSAGE RtsNonceMessage
Anki.Vector.ExternalComms.RtsNonceMessage = class extends Clad {
  constructor(toRobotNonce, toDeviceNonce) {
    super();
    this.toRobotNonce = toRobotNonce;
    this.toDeviceNonce = toDeviceNonce;
  }

  type() {
    return "RtsNonceMessage";
  }

  get size() {
    let result = 0;
    result += 24; // uint_8 array
    result += 24; // uint_8 array
    return result;
  }

  unpack(buffer) {
    let cladBuffer = new CladBuffer(buffer);
    this.toRobotNonce = cladBuffer.readFArray(false, 1, 24, false);
    this.toDeviceNonce = cladBuffer.readFArray(false, 1, 24, false);
  }

  pack() {
    let buffer = new Uint8Array(this.size);
    let cladBuffer = new CladBuffer(buffer);

    try {
      cladBuffer.writeFArray(this.toRobotNonce);
      cladBuffer.writeFArray(this.toDeviceNonce);
    } catch {
      return null;
    }
    return cladBuffer.buffer;
  }

  string() {
    return JSON.stringify(this);
  }
};

// MESSAGE RtsAck
Anki.Vector.ExternalComms.RtsAck = class extends Clad {
  constructor(rtsConnectionTag) {
    super();
    this.rtsConnectionTag = rtsConnectionTag;
  }

  type() {
    return "RtsAck";
  }

  get size() {
    let result = 0;
    result += 1; // rtsConnectionTag uint_8
    return result;
  }

  unpack(buffer) {
    let cladBuffer = new CladBuffer(buffer);
    this.rtsConnectionTag = cladBuffer.readUint8();
  }

  pack() {
    let buffer = new Uint8Array(this.size);
    let cladBuffer = new CladBuffer(buffer);

    try {
      cladBuffer.writeUint8(this.rtsConnectionTag);
    } catch {
      return null;
    }
    return cladBuffer.buffer;
  }

  string() {
    return JSON.stringify(this);
  }
};

// MESSAGE RtsChallengeMessage
Anki.Vector.ExternalComms.RtsChallengeMessage = class extends Clad {
  constructor(number) {
    super();
    this.number = number;
  }

  type() {
    return "RtsChallengeMessage";
  }

  get size() {
    let result = 0;
    result += 4; // number uint_32
    return result;
  }

  unpack(buffer) {
    let cladBuffer = new CladBuffer(buffer);
    this.number = cladBuffer.readUint32();
  }

  pack() {
    let buffer = new Uint8Array(this.size);
    let cladBuffer = new CladBuffer(buffer);

    try {
      cladBuffer.writeUint32(this.number);
    } catch {
      return null;
    }
    return cladBuffer.buffer;
  }

  string() {
    return JSON.stringify(this);
  }
};

// MESSAGE RtsChallengeSuccessMessage
Anki.Vector.ExternalComms.RtsChallengeSuccessMessage = class extends Clad {
  constructor() {
    super();
  }

  type() {
    return "RtsChallengeSuccessMessage";
  }

  get size() {
    return 0;
  }

  unpack(buffer) {
    let cladBuffer = new CladBuffer(buffer);
  }

  pack() {
    let buffer = new Uint8Array(this.size);
    let cladBuffer = new CladBuffer(buffer);

    try {
    } catch {
      return null;
    }
    return cladBuffer.buffer;
  }

  string() {
    return "";
  }
};

// MESSAGE RtsWifiForgetRequest
Anki.Vector.ExternalComms.RtsWifiForgetRequest = class extends Clad {
  constructor(deleteAll, wifiSsidHex) {
    super();
    this.deleteAll = deleteAll;
    this.wifiSsidHex = wifiSsidHex;
  }

  type() {
    return "RtsWifiForgetRequest";
  }

  get size() {
    let result = 0;
    result += 1; // deleteAll bool
    result += 1; // wifiSsidHex length (uint_8)
    result += this.wifiSsidHex.length; // uint_8 array
    return result;
  }

  unpack(buffer) {
    let cladBuffer = new CladBuffer(buffer);
    this.deleteAll = cladBuffer.readBool();
    this.wifiSsidHex = cladBuffer.readString(1);
  }

  pack() {
    let buffer = new Uint8Array(this.size);
    let cladBuffer = new CladBuffer(buffer);

    try {
      cladBuffer.writeBool(this.deleteAll);
      if (this.wifiSsidHex.length > 255) {
        buffer = null;
        return;
      }
      cladBuffer.writeString(this.wifiSsidHex, 1);
    } catch {
      return null;
    }
    return cladBuffer.buffer;
  }

  string() {
    return JSON.stringify(this);
  }
};

// MESSAGE RtsWifiForgetResponse
Anki.Vector.ExternalComms.RtsWifiForgetResponse = class extends Clad {
  constructor(didDelete, wifiSsidHex) {
    super();
    this.didDelete = didDelete;
    this.wifiSsidHex = wifiSsidHex;
  }

  type() {
    return "RtsWifiForgetResponse";
  }

  get size() {
    let result = 0;
    result += 1; // didDelete bool
    result += 1; // wifiSsidHex length (uint_8)
    result += this.wifiSsidHex.length; // uint_8 array
    return result;
  }

  unpack(buffer) {
    let cladBuffer = new CladBuffer(buffer);
    this.didDelete = cladBuffer.readBool();
    this.wifiSsidHex = cladBuffer.readString(1);
  }

  pack() {
    let buffer = new Uint8Array(this.size);
    let cladBuffer = new CladBuffer(buffer);

    try {
      cladBuffer.writeBool(this.didDelete);
      if (this.wifiSsidHex.length > 255) {
        buffer = null;
        return;
      }
      cladBuffer.writeString(this.wifiSsidHex, 1);
    } catch {
      return null;
    }
    return cladBuffer.buffer;
  }

  string() {
    return JSON.stringify(this);
  }
};

// MESSAGE RtsWifiConnectRequest
Anki.Vector.ExternalComms.RtsWifiConnectRequest = class extends Clad {
  constructor(wifiSsidHex, password, timeout, authType, hidden) {
    super();
    this.wifiSsidHex = wifiSsidHex;
    this.password = password;
    this.timeout = timeout;
    this.authType = authType;
    this.hidden = hidden;
  }

  type() {
    return "RtsWifiConnectRequest";
  }

  get size() {
    let result = 0;
    result += 1; // wifiSsidHex length (uint_8)
    result += this.wifiSsidHex.length; // uint_8 array
    result += 1; // password length (uint_8)
    result += this.password.length; // uint_8 array
    result += 1; // timeout uint_8
    result += 1; // authType uint_8
    result += 1; // hidden bool
    return result;
  }

  unpack(buffer) {
    let cladBuffer = new CladBuffer(buffer);
    this.wifiSsidHex = cladBuffer.readString(1);
    this.password = cladBuffer.readString(1);
    this.timeout = cladBuffer.readUint8();
    this.authType = cladBuffer.readUint8();
    this.hidden = cladBuffer.readBool();
  }

  pack() {
    let buffer = new Uint8Array(this.size);
    let cladBuffer = new CladBuffer(buffer);

    try {
      if (this.wifiSsidHex.length > 255) {
        buffer = null;
        return;
      }
      cladBuffer.writeString(this.wifiSsidHex, 1);
      if (this.password.length > 255) {
        buffer = null;
        return;
      }
      cladBuffer.writeString(this.password, 1);
      cladBuffer.writeUint8(this.timeout);
      cladBuffer.writeUint8(this.authType);
      cladBuffer.writeBool(this.hidden);
    } catch {
      return null;
    }
    return cladBuffer.buffer;
  }

  string() {
    return JSON.stringify(this);
  }
};

// MESSAGE RtsWifiConnectResponse
Anki.Vector.ExternalComms.RtsWifiConnectResponse = class extends Clad {
  constructor(wifiSsidHex, wifiState) {
    super();
    this.wifiSsidHex = wifiSsidHex;
    this.wifiState = wifiState;
  }

  type() {
    return "RtsWifiConnectResponse";
  }

  get size() {
    let result = 0;
    result += 1; // wifiSsidHex length (uint_8)
    result += this.wifiSsidHex.length; // uint_8 array
    result += 1; // wifiState uint_8
    return result;
  }

  unpack(buffer) {
    let cladBuffer = new CladBuffer(buffer);
    this.wifiSsidHex = cladBuffer.readString(1);
    this.wifiState = cladBuffer.readUint8();
  }

  pack() {
    let buffer = new Uint8Array(this.size);
    let cladBuffer = new CladBuffer(buffer);

    try {
      if (this.wifiSsidHex.length > 255) {
        buffer = null;
        return;
      }
      cladBuffer.writeString(this.wifiSsidHex, 1);
      cladBuffer.writeUint8(this.wifiState);
    } catch {
      return null;
    }
    return cladBuffer.buffer;
  }

  string() {
    return JSON.stringify(this);
  }
};

// MESSAGE RtsWifiConnectResponse_3
Anki.Vector.ExternalComms.RtsWifiConnectResponse_3 = class extends Clad {
  constructor(wifiSsidHex, wifiState, connectResult) {
    super();
    this.wifiSsidHex = wifiSsidHex;
    this.wifiState = wifiState;
    this.connectResult = connectResult;
  }

  type() {
    return "RtsWifiConnectResponse_3";
  }

  get size() {
    let result = 0;
    result += 1; // wifiSsidHex length (uint_8)
    result += this.wifiSsidHex.length; // uint_8 array
    result += 1; // wifiState uint_8
    result += 1; // connectResult uint_8
    return result;
  }

  unpack(buffer) {
    let cladBuffer = new CladBuffer(buffer);
    this.wifiSsidHex = cladBuffer.readString(1);
    this.wifiState = cladBuffer.readUint8();
    this.connectResult = cladBuffer.readUint8();
  }

  pack() {
    let buffer = new Uint8Array(this.size);
    let cladBuffer = new CladBuffer(buffer);

    try {
      if (this.wifiSsidHex.length > 255) {
        buffer = null;
        return;
      }
      cladBuffer.writeString(this.wifiSsidHex, 1);
      cladBuffer.writeUint8(this.wifiState);
      cladBuffer.writeUint8(this.connectResult);
    } catch {
      return null;
    }
    return cladBuffer.buffer;
  }

  string() {
    return JSON.stringify(this);
  }
};

// MESSAGE RtsWifiIpRequest
Anki.Vector.ExternalComms.RtsWifiIpRequest = class extends Clad {
  constructor() {
    super();
  }

  type() {
    return "RtsWifiIpRequest";
  }

  get size() {
    return 0;
  }

  unpack(buffer) {
    let cladBuffer = new CladBuffer(buffer);
  }

  pack() {
    let buffer = new Uint8Array(this.size);
    let cladBuffer = new CladBuffer(buffer);

    try {
    } catch {
      return null;
    }
    return cladBuffer.buffer;
  }

  string() {
    return "";
  }
};

// MESSAGE RtsWifiIpResponse
Anki.Vector.ExternalComms.RtsWifiIpResponse = class extends Clad {
  constructor(hasIpV4, hasIpV6, ipV4, ipV6) {
    super();
    this.hasIpV4 = hasIpV4;
    this.hasIpV6 = hasIpV6;
    this.ipV4 = ipV4;
    this.ipV6 = ipV6;
  }

  type() {
    return "RtsWifiIpResponse";
  }

  get size() {
    let result = 0;
    result += 1; // hasIpV4 uint_8
    result += 1; // hasIpV6 uint_8
    result += 4; // uint_8 array
    result += 16; // uint_8 array
    return result;
  }

  unpack(buffer) {
    let cladBuffer = new CladBuffer(buffer);
    this.hasIpV4 = cladBuffer.readUint8();
    this.hasIpV6 = cladBuffer.readUint8();
    this.ipV4 = cladBuffer.readFArray(false, 1, 4, false);
    this.ipV6 = cladBuffer.readFArray(false, 1, 16, false);
  }

  pack() {
    let buffer = new Uint8Array(this.size);
    let cladBuffer = new CladBuffer(buffer);

    try {
      cladBuffer.writeUint8(this.hasIpV4);
      cladBuffer.writeUint8(this.hasIpV6);
      cladBuffer.writeFArray(this.ipV4);
      cladBuffer.writeFArray(this.ipV6);
    } catch {
      return null;
    }
    return cladBuffer.buffer;
  }

  string() {
    return JSON.stringify(this);
  }
};

// MESSAGE RtsStatusRequest
Anki.Vector.ExternalComms.RtsStatusRequest = class extends Clad {
  constructor() {
    super();
  }

  type() {
    return "RtsStatusRequest";
  }

  get size() {
    return 0;
  }

  unpack(buffer) {
    let cladBuffer = new CladBuffer(buffer);
  }

  pack() {
    let buffer = new Uint8Array(this.size);
    let cladBuffer = new CladBuffer(buffer);

    try {
    } catch {
      return null;
    }
    return cladBuffer.buffer;
  }

  string() {
    return "";
  }
};

// MESSAGE RtsStatusResponse
Anki.Vector.ExternalComms.RtsStatusResponse = class extends Clad {
  constructor(wifiSsidHex, wifiState, accessPoint, bleState, batteryState) {
    super();
    this.wifiSsidHex = wifiSsidHex;
    this.wifiState = wifiState;
    this.accessPoint = accessPoint;
    this.bleState = bleState;
    this.batteryState = batteryState;
  }

  type() {
    return "RtsStatusResponse";
  }

  get size() {
    let result = 0;
    result += 1; // wifiSsidHex length (uint_8)
    result += this.wifiSsidHex.length; // uint_8 array
    result += 1; // wifiState uint_8
    result += 1; // accessPoint bool
    result += 1; // bleState uint_8
    result += 1; // batteryState uint_8
    return result;
  }

  unpack(buffer) {
    let cladBuffer = new CladBuffer(buffer);
    this.wifiSsidHex = cladBuffer.readString(1);
    this.wifiState = cladBuffer.readUint8();
    this.accessPoint = cladBuffer.readBool();
    this.bleState = cladBuffer.readUint8();
    this.batteryState = cladBuffer.readUint8();
  }

  pack() {
    let buffer = new Uint8Array(this.size);
    let cladBuffer = new CladBuffer(buffer);

    try {
      if (this.wifiSsidHex.length > 255) {
        buffer = null;
        return;
      }
      cladBuffer.writeString(this.wifiSsidHex, 1);
      cladBuffer.writeUint8(this.wifiState);
      cladBuffer.writeBool(this.accessPoint);
      cladBuffer.writeUint8(this.bleState);
      cladBuffer.writeUint8(this.batteryState);
    } catch {
      return null;
    }
    return cladBuffer.buffer;
  }

  string() {
    return JSON.stringify(this);
  }
};

// MESSAGE RtsStatusResponse_2
Anki.Vector.ExternalComms.RtsStatusResponse_2 = class extends Clad {
  constructor(
    wifiSsidHex,
    wifiState,
    accessPoint,
    bleState,
    batteryState,
    version,
    otaInProgress
  ) {
    super();
    this.wifiSsidHex = wifiSsidHex;
    this.wifiState = wifiState;
    this.accessPoint = accessPoint;
    this.bleState = bleState;
    this.batteryState = batteryState;
    this.version = version;
    this.otaInProgress = otaInProgress;
  }

  type() {
    return "RtsStatusResponse_2";
  }

  get size() {
    let result = 0;
    result += 1; // wifiSsidHex length (uint_8)
    result += this.wifiSsidHex.length; // uint_8 array
    result += 1; // wifiState uint_8
    result += 1; // accessPoint bool
    result += 1; // bleState uint_8
    result += 1; // batteryState uint_8
    result += 1; // version length (uint_8)
    result += this.version.length; // uint_8 array
    result += 1; // otaInProgress bool
    return result;
  }

  unpack(buffer) {
    let cladBuffer = new CladBuffer(buffer);
    this.wifiSsidHex = cladBuffer.readString(1);
    this.wifiState = cladBuffer.readUint8();
    this.accessPoint = cladBuffer.readBool();
    this.bleState = cladBuffer.readUint8();
    this.batteryState = cladBuffer.readUint8();
    this.version = cladBuffer.readString(1);
    this.otaInProgress = cladBuffer.readBool();
  }

  pack() {
    let buffer = new Uint8Array(this.size);
    let cladBuffer = new CladBuffer(buffer);

    try {
      if (this.wifiSsidHex.length > 255) {
        buffer = null;
        return;
      }
      cladBuffer.writeString(this.wifiSsidHex, 1);
      cladBuffer.writeUint8(this.wifiState);
      cladBuffer.writeBool(this.accessPoint);
      cladBuffer.writeUint8(this.bleState);
      cladBuffer.writeUint8(this.batteryState);
      if (this.version.length > 255) {
        buffer = null;
        return;
      }
      cladBuffer.writeString(this.version, 1);
      cladBuffer.writeBool(this.otaInProgress);
    } catch {
      return null;
    }
    return cladBuffer.buffer;
  }

  string() {
    return JSON.stringify(this);
  }
};

// MESSAGE RtsStatusResponse_3
Anki.Vector.ExternalComms.RtsStatusResponse_3 = class extends Clad {
  constructor(
    wifiSsidHex,
    wifiState,
    accessPoint,
    bleState,
    batteryState,
    version,
    otaInProgress,
    hasOwner
  ) {
    super();
    this.wifiSsidHex = wifiSsidHex;
    this.wifiState = wifiState;
    this.accessPoint = accessPoint;
    this.bleState = bleState;
    this.batteryState = batteryState;
    this.version = version;
    this.otaInProgress = otaInProgress;
    this.hasOwner = hasOwner;
  }

  type() {
    return "RtsStatusResponse_3";
  }

  get size() {
    let result = 0;
    result += 1; // wifiSsidHex length (uint_8)
    result += this.wifiSsidHex.length; // uint_8 array
    result += 1; // wifiState uint_8
    result += 1; // accessPoint bool
    result += 1; // bleState uint_8
    result += 1; // batteryState uint_8
    result += 1; // version length (uint_8)
    result += this.version.length; // uint_8 array
    result += 1; // otaInProgress bool
    result += 1; // hasOwner bool
    return result;
  }

  unpack(buffer) {
    let cladBuffer = new CladBuffer(buffer);
    this.wifiSsidHex = cladBuffer.readString(1);
    this.wifiState = cladBuffer.readUint8();
    this.accessPoint = cladBuffer.readBool();
    this.bleState = cladBuffer.readUint8();
    this.batteryState = cladBuffer.readUint8();
    this.version = cladBuffer.readString(1);
    this.otaInProgress = cladBuffer.readBool();
    this.hasOwner = cladBuffer.readBool();
  }

  pack() {
    let buffer = new Uint8Array(this.size);
    let cladBuffer = new CladBuffer(buffer);

    try {
      if (this.wifiSsidHex.length > 255) {
        buffer = null;
        return;
      }
      cladBuffer.writeString(this.wifiSsidHex, 1);
      cladBuffer.writeUint8(this.wifiState);
      cladBuffer.writeBool(this.accessPoint);
      cladBuffer.writeUint8(this.bleState);
      cladBuffer.writeUint8(this.batteryState);
      if (this.version.length > 255) {
        buffer = null;
        return;
      }
      cladBuffer.writeString(this.version, 1);
      cladBuffer.writeBool(this.otaInProgress);
      cladBuffer.writeBool(this.hasOwner);
    } catch {
      return null;
    }
    return cladBuffer.buffer;
  }

  string() {
    return JSON.stringify(this);
  }
};

// MESSAGE RtsStatusResponse_4
Anki.Vector.ExternalComms.RtsStatusResponse_4 = class extends Clad {
  constructor(
    wifiSsidHex,
    wifiState,
    accessPoint,
    bleState,
    batteryState,
    version,
    esn,
    otaInProgress,
    hasOwner
  ) {
    super();
    this.wifiSsidHex = wifiSsidHex;
    this.wifiState = wifiState;
    this.accessPoint = accessPoint;
    this.bleState = bleState;
    this.batteryState = batteryState;
    this.version = version;
    this.esn = esn;
    this.otaInProgress = otaInProgress;
    this.hasOwner = hasOwner;
  }

  type() {
    return "RtsStatusResponse_4";
  }

  get size() {
    let result = 0;
    result += 1; // wifiSsidHex length (uint_8)
    result += this.wifiSsidHex.length; // uint_8 array
    result += 1; // wifiState uint_8
    result += 1; // accessPoint bool
    result += 1; // bleState uint_8
    result += 1; // batteryState uint_8
    result += 1; // version length (uint_8)
    result += this.version.length; // uint_8 array
    result += 1; // esn length (uint_8)
    result += this.esn.length; // uint_8 array
    result += 1; // otaInProgress bool
    result += 1; // hasOwner bool
    return result;
  }

  unpack(buffer) {
    let cladBuffer = new CladBuffer(buffer);
    this.wifiSsidHex = cladBuffer.readString(1);
    this.wifiState = cladBuffer.readUint8();
    this.accessPoint = cladBuffer.readBool();
    this.bleState = cladBuffer.readUint8();
    this.batteryState = cladBuffer.readUint8();
    this.version = cladBuffer.readString(1);
    this.esn = cladBuffer.readString(1);
    this.otaInProgress = cladBuffer.readBool();
    this.hasOwner = cladBuffer.readBool();
  }

  pack() {
    let buffer = new Uint8Array(this.size);
    let cladBuffer = new CladBuffer(buffer);

    try {
      if (this.wifiSsidHex.length > 255) {
        buffer = null;
        return;
      }
      cladBuffer.writeString(this.wifiSsidHex, 1);
      cladBuffer.writeUint8(this.wifiState);
      cladBuffer.writeBool(this.accessPoint);
      cladBuffer.writeUint8(this.bleState);
      cladBuffer.writeUint8(this.batteryState);
      if (this.version.length > 255) {
        buffer = null;
        return;
      }
      cladBuffer.writeString(this.version, 1);
      if (this.esn.length > 255) {
        buffer = null;
        return;
      }
      cladBuffer.writeString(this.esn, 1);
      cladBuffer.writeBool(this.otaInProgress);
      cladBuffer.writeBool(this.hasOwner);
    } catch {
      return null;
    }
    return cladBuffer.buffer;
  }

  string() {
    return JSON.stringify(this);
  }
};

// MESSAGE RtsStatusResponse_5
Anki.Vector.ExternalComms.RtsStatusResponse_5 = class extends Clad {
  constructor(
    wifiSsidHex,
    wifiState,
    accessPoint,
    bleState,
    batteryState,
    version,
    esn,
    otaInProgress,
    hasOwner,
    isCloudAuthed
  ) {
    super();
    this.wifiSsidHex = wifiSsidHex;
    this.wifiState = wifiState;
    this.accessPoint = accessPoint;
    this.bleState = bleState;
    this.batteryState = batteryState;
    this.version = version;
    this.esn = esn;
    this.otaInProgress = otaInProgress;
    this.hasOwner = hasOwner;
    this.isCloudAuthed = isCloudAuthed;
  }

  type() {
    return "RtsStatusResponse_5";
  }

  get size() {
    let result = 0;
    result += 1; // wifiSsidHex length (uint_8)
    result += this.wifiSsidHex.length; // uint_8 array
    result += 1; // wifiState uint_8
    result += 1; // accessPoint bool
    result += 1; // bleState uint_8
    result += 1; // batteryState uint_8
    result += 1; // version length (uint_8)
    result += this.version.length; // uint_8 array
    result += 1; // esn length (uint_8)
    result += this.esn.length; // uint_8 array
    result += 1; // otaInProgress bool
    result += 1; // hasOwner bool
    result += 1; // isCloudAuthed bool
    return result;
  }

  unpack(buffer) {
    let cladBuffer = new CladBuffer(buffer);
    this.wifiSsidHex = cladBuffer.readString(1);
    this.wifiState = cladBuffer.readUint8();
    this.accessPoint = cladBuffer.readBool();
    this.bleState = cladBuffer.readUint8();
    this.batteryState = cladBuffer.readUint8();
    this.version = cladBuffer.readString(1);
    this.esn = cladBuffer.readString(1);
    this.otaInProgress = cladBuffer.readBool();
    this.hasOwner = cladBuffer.readBool();
    this.isCloudAuthed = cladBuffer.readBool();
  }

  pack() {
    let buffer = new Uint8Array(this.size);
    let cladBuffer = new CladBuffer(buffer);

    try {
      if (this.wifiSsidHex.length > 255) {
        buffer = null;
        return;
      }
      cladBuffer.writeString(this.wifiSsidHex, 1);
      cladBuffer.writeUint8(this.wifiState);
      cladBuffer.writeBool(this.accessPoint);
      cladBuffer.writeUint8(this.bleState);
      cladBuffer.writeUint8(this.batteryState);
      if (this.version.length > 255) {
        buffer = null;
        return;
      }
      cladBuffer.writeString(this.version, 1);
      if (this.esn.length > 255) {
        buffer = null;
        return;
      }
      cladBuffer.writeString(this.esn, 1);
      cladBuffer.writeBool(this.otaInProgress);
      cladBuffer.writeBool(this.hasOwner);
      cladBuffer.writeBool(this.isCloudAuthed);
    } catch {
      return null;
    }
    return cladBuffer.buffer;
  }

  string() {
    return JSON.stringify(this);
  }
};

// MESSAGE RtsWifiScanRequest
Anki.Vector.ExternalComms.RtsWifiScanRequest = class extends Clad {
  constructor() {
    super();
  }

  type() {
    return "RtsWifiScanRequest";
  }

  get size() {
    return 0;
  }

  unpack(buffer) {
    let cladBuffer = new CladBuffer(buffer);
  }

  pack() {
    let buffer = new Uint8Array(this.size);
    let cladBuffer = new CladBuffer(buffer);

    try {
    } catch {
      return null;
    }
    return cladBuffer.buffer;
  }

  string() {
    return "";
  }
};

// MESSAGE RtsWifiScanResponse
Anki.Vector.ExternalComms.RtsWifiScanResponse = class extends Clad {
  constructor(statusCode, scanResult) {
    super();
    this.statusCode = statusCode;
    this.scanResult = scanResult;
  }

  type() {
    return "RtsWifiScanResponse";
  }

  get size() {
    let result = 0;
    result += 1; // statusCode uint_8
    result += 1; // scanResult length (uint_8)
    for (let i = 0; i < this.scanResult.length; i++) {
      result += this.scanResult[i].size;
    }
    return result;
  }

  unpack(buffer) {
    let cladBuffer = new CladBuffer(buffer);
    this.statusCode = cladBuffer.readUint8();
    let scanResultLength = cladBuffer.readUint8();
    this.scanResult = [];
    for (let i = 0; i < scanResultLength; i++) {
      let scanResultNew = new Anki.Vector.ExternalComms.RtsWifiScanResult(null);
      scanResultNew.unpackFromClad(cladBuffer);
      this.scanResult.push(scanResultNew);
    }
  }

  pack() {
    let buffer = new Uint8Array(this.size);
    let cladBuffer = new CladBuffer(buffer);

    try {
      cladBuffer.writeUint8(this.statusCode);
      cladBuffer.writeUint8(this.scanResult.length);
      for (let i = 0; i < this.scanResult.length; i++) {
        cladBuffer.write(this.scanResult[i].pack());
      }
    } catch {
      return null;
    }
    return cladBuffer.buffer;
  }

  string() {
    return JSON.stringify(this);
  }
};

// MESSAGE RtsWifiScanResponse_2
Anki.Vector.ExternalComms.RtsWifiScanResponse_2 = class extends Clad {
  constructor(statusCode, scanResult) {
    super();
    this.statusCode = statusCode;
    this.scanResult = scanResult;
  }

  type() {
    return "RtsWifiScanResponse_2";
  }

  get size() {
    let result = 0;
    result += 1; // statusCode uint_8
    result += 1; // scanResult length (uint_8)
    for (let i = 0; i < this.scanResult.length; i++) {
      result += this.scanResult[i].size;
    }
    return result;
  }

  unpack(buffer) {
    let cladBuffer = new CladBuffer(buffer);
    this.statusCode = cladBuffer.readUint8();
    let scanResultLength = cladBuffer.readUint8();
    this.scanResult = [];
    for (let i = 0; i < scanResultLength; i++) {
      let scanResultNew = new Anki.Vector.ExternalComms.RtsWifiScanResult_2(
        null
      );
      scanResultNew.unpackFromClad(cladBuffer);
      this.scanResult.push(scanResultNew);
    }
  }

  pack() {
    let buffer = new Uint8Array(this.size);
    let cladBuffer = new CladBuffer(buffer);

    try {
      cladBuffer.writeUint8(this.statusCode);
      cladBuffer.writeUint8(this.scanResult.length);
      for (let i = 0; i < this.scanResult.length; i++) {
        cladBuffer.write(this.scanResult[i].pack());
      }
    } catch {
      return null;
    }
    return cladBuffer.buffer;
  }

  string() {
    return JSON.stringify(this);
  }
};

// MESSAGE RtsWifiScanResponse_3
Anki.Vector.ExternalComms.RtsWifiScanResponse_3 = class extends Clad {
  constructor(statusCode, scanResult) {
    super();
    this.statusCode = statusCode;
    this.scanResult = scanResult;
  }

  type() {
    return "RtsWifiScanResponse_3";
  }

  get size() {
    let result = 0;
    result += 1; // statusCode uint_8
    result += 1; // scanResult length (uint_8)
    for (let i = 0; i < this.scanResult.length; i++) {
      result += this.scanResult[i].size;
    }
    return result;
  }

  unpack(buffer) {
    let cladBuffer = new CladBuffer(buffer);
    this.statusCode = cladBuffer.readUint8();
    let scanResultLength = cladBuffer.readUint8();
    this.scanResult = [];
    for (let i = 0; i < scanResultLength; i++) {
      let scanResultNew = new Anki.Vector.ExternalComms.RtsWifiScanResult_3(
        null
      );
      scanResultNew.unpackFromClad(cladBuffer);
      this.scanResult.push(scanResultNew);
    }
  }

  pack() {
    let buffer = new Uint8Array(this.size);
    let cladBuffer = new CladBuffer(buffer);

    try {
      cladBuffer.writeUint8(this.statusCode);
      cladBuffer.writeUint8(this.scanResult.length);
      for (let i = 0; i < this.scanResult.length; i++) {
        cladBuffer.write(this.scanResult[i].pack());
      }
    } catch {
      return null;
    }
    return cladBuffer.buffer;
  }

  string() {
    return JSON.stringify(this);
  }
};

// MESSAGE RtsOtaUpdateRequest
Anki.Vector.ExternalComms.RtsOtaUpdateRequest = class extends Clad {
  constructor(url) {
    super();
    this.url = url;
  }

  type() {
    return "RtsOtaUpdateRequest";
  }

  get size() {
    let result = 0;
    result += 1; // url length (uint_8)
    result += this.url.length; // uint_8 array
    return result;
  }

  unpack(buffer) {
    let cladBuffer = new CladBuffer(buffer);
    this.url = cladBuffer.readString(1);
  }

  pack() {
    let buffer = new Uint8Array(this.size);
    let cladBuffer = new CladBuffer(buffer);

    try {
      if (this.url.length > 255) {
        buffer = null;
        return;
      }
      cladBuffer.writeString(this.url, 1);
    } catch {
      return null;
    }
    return cladBuffer.buffer;
  }

  string() {
    return JSON.stringify(this);
  }
};

// MESSAGE RtsOtaCancelRequest
Anki.Vector.ExternalComms.RtsOtaCancelRequest = class extends Clad {
  constructor() {
    super();
  }

  type() {
    return "RtsOtaCancelRequest";
  }

  get size() {
    return 0;
  }

  unpack(buffer) {
    let cladBuffer = new CladBuffer(buffer);
  }

  pack() {
    let buffer = new Uint8Array(this.size);
    let cladBuffer = new CladBuffer(buffer);

    try {
    } catch {
      return null;
    }
    return cladBuffer.buffer;
  }

  string() {
    return "";
  }
};

// MESSAGE RtsOtaUpdateResponse
Anki.Vector.ExternalComms.RtsOtaUpdateResponse = class extends Clad {
  constructor(status, current, expected) {
    super();
    this.status = status;
    this.current = current;
    this.expected = expected;
  }

  type() {
    return "RtsOtaUpdateResponse";
  }

  get size() {
    let result = 0;
    result += 1; // status uint_8
    result += 8; // current uint_64
    result += 8; // expected uint_64
    return result;
  }

  unpack(buffer) {
    let cladBuffer = new CladBuffer(buffer);
    this.status = cladBuffer.readUint8();
    this.current = cladBuffer.readBigUint64();
    this.expected = cladBuffer.readBigUint64();
  }

  pack() {
    let buffer = new Uint8Array(this.size);
    let cladBuffer = new CladBuffer(buffer);

    try {
      cladBuffer.writeUint8(this.status);
      cladBuffer.writeBigUint64(this.current);
      cladBuffer.writeBigUint64(this.expected);
    } catch {
      return null;
    }
    return cladBuffer.buffer;
  }

  string() {
    return JSON.stringify(this);
  }
};

// MESSAGE RtsWifiAccessPointRequest
Anki.Vector.ExternalComms.RtsWifiAccessPointRequest = class extends Clad {
  constructor(enable) {
    super();
    this.enable = enable;
  }

  type() {
    return "RtsWifiAccessPointRequest";
  }

  get size() {
    let result = 0;
    result += 1; // enable bool
    return result;
  }

  unpack(buffer) {
    let cladBuffer = new CladBuffer(buffer);
    this.enable = cladBuffer.readBool();
  }

  pack() {
    let buffer = new Uint8Array(this.size);
    let cladBuffer = new CladBuffer(buffer);

    try {
      cladBuffer.writeBool(this.enable);
    } catch {
      return null;
    }
    return cladBuffer.buffer;
  }

  string() {
    return JSON.stringify(this);
  }
};

// MESSAGE RtsWifiAccessPointResponse
Anki.Vector.ExternalComms.RtsWifiAccessPointResponse = class extends Clad {
  constructor(enabled, ssid, password) {
    super();
    this.enabled = enabled;
    this.ssid = ssid;
    this.password = password;
  }

  type() {
    return "RtsWifiAccessPointResponse";
  }

  get size() {
    let result = 0;
    result += 1; // enabled bool
    result += 1; // ssid length (uint_8)
    result += this.ssid.length; // uint_8 array
    result += 1; // password length (uint_8)
    result += this.password.length; // uint_8 array
    return result;
  }

  unpack(buffer) {
    let cladBuffer = new CladBuffer(buffer);
    this.enabled = cladBuffer.readBool();
    this.ssid = cladBuffer.readString(1);
    this.password = cladBuffer.readString(1);
  }

  pack() {
    let buffer = new Uint8Array(this.size);
    let cladBuffer = new CladBuffer(buffer);

    try {
      cladBuffer.writeBool(this.enabled);
      if (this.ssid.length > 255) {
        buffer = null;
        return;
      }
      cladBuffer.writeString(this.ssid, 1);
      if (this.password.length > 255) {
        buffer = null;
        return;
      }
      cladBuffer.writeString(this.password, 1);
    } catch {
      return null;
    }
    return cladBuffer.buffer;
  }

  string() {
    return JSON.stringify(this);
  }
};

// MESSAGE RtsCancelPairing
Anki.Vector.ExternalComms.RtsCancelPairing = class extends Clad {
  constructor() {
    super();
  }

  type() {
    return "RtsCancelPairing";
  }

  get size() {
    return 0;
  }

  unpack(buffer) {
    let cladBuffer = new CladBuffer(buffer);
  }

  pack() {
    let buffer = new Uint8Array(this.size);
    let cladBuffer = new CladBuffer(buffer);

    try {
    } catch {
      return null;
    }
    return cladBuffer.buffer;
  }

  string() {
    return "";
  }
};

// MESSAGE RtsForceDisconnect
Anki.Vector.ExternalComms.RtsForceDisconnect = class extends Clad {
  constructor() {
    super();
  }

  type() {
    return "RtsForceDisconnect";
  }

  get size() {
    return 0;
  }

  unpack(buffer) {
    let cladBuffer = new CladBuffer(buffer);
  }

  pack() {
    let buffer = new Uint8Array(this.size);
    let cladBuffer = new CladBuffer(buffer);

    try {
    } catch {
      return null;
    }
    return cladBuffer.buffer;
  }

  string() {
    return "";
  }
};

// MESSAGE RtsSshRequest
Anki.Vector.ExternalComms.RtsSshRequest = class extends Clad {
  constructor(sshAuthorizedKeyBytes) {
    super();
    this.sshAuthorizedKeyBytes = sshAuthorizedKeyBytes;
  }

  type() {
    return "RtsSshRequest";
  }

  get size() {
    let result = 0;
    result += 2; // sshAuthorizedKeyBytes length (uint_16)
    for (let i = 0; i < this.sshAuthorizedKeyBytes.length; i++) {
      result += 1; // sshAuthorizedKeyBytes[i] length (uint_8)
      result += this.sshAuthorizedKeyBytes[i].length; // uint_8 array
    }
    return result;
  }

  unpack(buffer) {
    let cladBuffer = new CladBuffer(buffer);
    this.sshAuthorizedKeyBytes = cladBuffer.readStringVArray(false, 1, 2);
  }

  pack() {
    let buffer = new Uint8Array(this.size);
    let cladBuffer = new CladBuffer(buffer);

    try {
      cladBuffer.writeStringVArray(this.sshAuthorizedKeyBytes, 2, 1);
    } catch {
      return null;
    }
    return cladBuffer.buffer;
  }

  string() {
    return JSON.stringify(this);
  }
};

// MESSAGE RtsSshResponse
Anki.Vector.ExternalComms.RtsSshResponse = class extends Clad {
  constructor() {
    super();
  }

  type() {
    return "RtsSshResponse";
  }

  get size() {
    return 0;
  }

  unpack(buffer) {
    let cladBuffer = new CladBuffer(buffer);
  }

  pack() {
    let buffer = new Uint8Array(this.size);
    let cladBuffer = new CladBuffer(buffer);

    try {
    } catch {
      return null;
    }
    return cladBuffer.buffer;
  }

  string() {
    return "";
  }
};

// MESSAGE RtsLogRequest
Anki.Vector.ExternalComms.RtsLogRequest = class extends Clad {
  constructor(mode, filter) {
    super();
    this.mode = mode;
    this.filter = filter;
  }

  type() {
    return "RtsLogRequest";
  }

  get size() {
    let result = 0;
    result += 1; // mode uint_8
    result += 2; // filter length (uint_16)
    for (let i = 0; i < this.filter.length; i++) {
      result += 1; // filter[i] length (uint_8)
      result += this.filter[i].length; // uint_8 array
    }
    return result;
  }

  unpack(buffer) {
    let cladBuffer = new CladBuffer(buffer);
    this.mode = cladBuffer.readUint8();
    this.filter = cladBuffer.readStringVArray(false, 1, 2);
  }

  pack() {
    let buffer = new Uint8Array(this.size);
    let cladBuffer = new CladBuffer(buffer);

    try {
      cladBuffer.writeUint8(this.mode);
      cladBuffer.writeStringVArray(this.filter, 2, 1);
    } catch {
      return null;
    }
    return cladBuffer.buffer;
  }

  string() {
    return JSON.stringify(this);
  }
};

// MESSAGE RtsLogResponse
Anki.Vector.ExternalComms.RtsLogResponse = class extends Clad {
  constructor(exitCode, fileId) {
    super();
    this.exitCode = exitCode;
    this.fileId = fileId;
  }

  type() {
    return "RtsLogResponse";
  }

  get size() {
    let result = 0;
    result += 1; // exitCode uint_8
    result += 4; // fileId uint_32
    return result;
  }

  unpack(buffer) {
    let cladBuffer = new CladBuffer(buffer);
    this.exitCode = cladBuffer.readUint8();
    this.fileId = cladBuffer.readUint32();
  }

  pack() {
    let buffer = new Uint8Array(this.size);
    let cladBuffer = new CladBuffer(buffer);

    try {
      cladBuffer.writeUint8(this.exitCode);
      cladBuffer.writeUint32(this.fileId);
    } catch {
      return null;
    }
    return cladBuffer.buffer;
  }

  string() {
    return JSON.stringify(this);
  }
};

// MESSAGE RtsFileDownload
Anki.Vector.ExternalComms.RtsFileDownload = class extends Clad {
  constructor(status, fileId, packetNumber, packetTotal, fileChunk) {
    super();
    this.status = status;
    this.fileId = fileId;
    this.packetNumber = packetNumber;
    this.packetTotal = packetTotal;
    this.fileChunk = fileChunk;
  }

  type() {
    return "RtsFileDownload";
  }

  get size() {
    let result = 0;
    result += 1; // status uint_8
    result += 4; // fileId uint_32
    result += 4; // packetNumber uint_32
    result += 4; // packetTotal uint_32
    result += 2; // fileChunk length (uint_16)
    result += this.fileChunk.length; // uint_8 array
    return result;
  }

  unpack(buffer) {
    let cladBuffer = new CladBuffer(buffer);
    this.status = cladBuffer.readUint8();
    this.fileId = cladBuffer.readUint32();
    this.packetNumber = cladBuffer.readUint32();
    this.packetTotal = cladBuffer.readUint32();
    this.fileChunk = cladBuffer.readVArray(false, 1, 2, false);
  }

  pack() {
    let buffer = new Uint8Array(this.size);
    let cladBuffer = new CladBuffer(buffer);

    try {
      cladBuffer.writeUint8(this.status);
      cladBuffer.writeUint32(this.fileId);
      cladBuffer.writeUint32(this.packetNumber);
      cladBuffer.writeUint32(this.packetTotal);
      cladBuffer.writeVArray(this.fileChunk, 2);
    } catch {
      return null;
    }
    return cladBuffer.buffer;
  }

  string() {
    return JSON.stringify(this);
  }
};

// MESSAGE RtsCloudSessionRequest
Anki.Vector.ExternalComms.RtsCloudSessionRequest = class extends Clad {
  constructor(sessionToken) {
    super();
    this.sessionToken = sessionToken;
  }

  type() {
    return "RtsCloudSessionRequest";
  }

  get size() {
    let result = 0;
    result += 2; // sessionToken length (uint_16)
    result += this.sessionToken.length; // uint_8 array
    return result;
  }

  unpack(buffer) {
    let cladBuffer = new CladBuffer(buffer);
    this.sessionToken = cladBuffer.readString(2);
  }

  pack() {
    let buffer = new Uint8Array(this.size);
    let cladBuffer = new CladBuffer(buffer);

    try {
      if (this.sessionToken.length > 65535) {
        buffer = null;
        return;
      }
      cladBuffer.writeString(this.sessionToken, 2);
    } catch {
      return null;
    }
    return cladBuffer.buffer;
  }

  string() {
    return JSON.stringify(this);
  }
};

// MESSAGE RtsCloudSessionRequest_5
Anki.Vector.ExternalComms.RtsCloudSessionRequest_5 = class extends Clad {
  constructor(sessionToken, clientName, appId) {
    super();
    this.sessionToken = sessionToken;
    this.clientName = clientName;
    this.appId = appId;
  }

  type() {
    return "RtsCloudSessionRequest_5";
  }

  get size() {
    let result = 0;
    result += 2; // sessionToken length (uint_16)
    result += this.sessionToken.length; // uint_8 array
    result += 1; // clientName length (uint_8)
    result += this.clientName.length; // uint_8 array
    result += 1; // appId length (uint_8)
    result += this.appId.length; // uint_8 array
    return result;
  }

  unpack(buffer) {
    let cladBuffer = new CladBuffer(buffer);
    this.sessionToken = cladBuffer.readString(2);
    this.clientName = cladBuffer.readString(1);
    this.appId = cladBuffer.readString(1);
  }

  pack() {
    let buffer = new Uint8Array(this.size);
    let cladBuffer = new CladBuffer(buffer);

    try {
      if (this.sessionToken.length > 65535) {
        buffer = null;
        return;
      }
      cladBuffer.writeString(this.sessionToken, 2);
      if (this.clientName.length > 255) {
        buffer = null;
        return;
      }
      cladBuffer.writeString(this.clientName, 1);
      if (this.appId.length > 255) {
        buffer = null;
        return;
      }
      cladBuffer.writeString(this.appId, 1);
    } catch {
      return null;
    }
    return cladBuffer.buffer;
  }

  string() {
    return JSON.stringify(this);
  }
};

// MESSAGE RtsCloudSessionResponse
Anki.Vector.ExternalComms.RtsCloudSessionResponse = class extends Clad {
  constructor(success, statusCode, clientTokenGuid) {
    super();
    this.success = success;
    this.statusCode = statusCode;
    this.clientTokenGuid = clientTokenGuid;
  }

  type() {
    return "RtsCloudSessionResponse";
  }

  get size() {
    let result = 0;
    result += 1; // success bool
    result += 1; // statusCode RtsCloudStatus
    result += 2; // clientTokenGuid length (uint_16)
    result += this.clientTokenGuid.length; // uint_8 array
    return result;
  }

  unpack(buffer) {
    let cladBuffer = new CladBuffer(buffer);
    this.success = cladBuffer.readBool();
    this.statusCode = cladBuffer.readUint8();
    this.clientTokenGuid = cladBuffer.readString(2);
  }

  pack() {
    let buffer = new Uint8Array(this.size);
    let cladBuffer = new CladBuffer(buffer);

    try {
      cladBuffer.writeBool(this.success);
      cladBuffer.writeUint8(this.statusCode);
      if (this.clientTokenGuid.length > 65535) {
        buffer = null;
        return;
      }
      cladBuffer.writeString(this.clientTokenGuid, 2);
    } catch {
      return null;
    }
    return cladBuffer.buffer;
  }

  string() {
    return JSON.stringify(this);
  }
};

// MESSAGE RtsAppConnectionIdRequest
Anki.Vector.ExternalComms.RtsAppConnectionIdRequest = class extends Clad {
  constructor(connectionId) {
    super();
    this.connectionId = connectionId;
  }

  type() {
    return "RtsAppConnectionIdRequest";
  }

  get size() {
    let result = 0;
    result += 2; // connectionId length (uint_16)
    result += this.connectionId.length; // uint_8 array
    return result;
  }

  unpack(buffer) {
    let cladBuffer = new CladBuffer(buffer);
    this.connectionId = cladBuffer.readString(2);
  }

  pack() {
    let buffer = new Uint8Array(this.size);
    let cladBuffer = new CladBuffer(buffer);

    try {
      if (this.connectionId.length > 65535) {
        buffer = null;
        return;
      }
      cladBuffer.writeString(this.connectionId, 2);
    } catch {
      return null;
    }
    return cladBuffer.buffer;
  }

  string() {
    return JSON.stringify(this);
  }
};

// MESSAGE RtsAppConnectionIdResponse
Anki.Vector.ExternalComms.RtsAppConnectionIdResponse = class extends Clad {
  constructor() {
    super();
  }

  type() {
    return "RtsAppConnectionIdResponse";
  }

  get size() {
    return 0;
  }

  unpack(buffer) {
    let cladBuffer = new CladBuffer(buffer);
  }

  pack() {
    let buffer = new Uint8Array(this.size);
    let cladBuffer = new CladBuffer(buffer);

    try {
    } catch {
      return null;
    }
    return cladBuffer.buffer;
  }

  string() {
    return "";
  }
};

// MESSAGE RtsResponse
Anki.Vector.ExternalComms.RtsResponse = class extends Clad {
  constructor(code, responseMessage) {
    super();
    this.code = code;
    this.responseMessage = responseMessage;
  }

  type() {
    return "RtsResponse";
  }

  get size() {
    let result = 0;
    result += 2; // code RtsResponseCode
    result += 2; // responseMessage length (uint_16)
    result += this.responseMessage.length; // uint_8 array
    return result;
  }

  unpack(buffer) {
    let cladBuffer = new CladBuffer(buffer);
    this.code = cladBuffer.readUint16();
    this.responseMessage = cladBuffer.readString(2);
  }

  pack() {
    let buffer = new Uint8Array(this.size);
    let cladBuffer = new CladBuffer(buffer);

    try {
      cladBuffer.writeUint16(this.code);
      if (this.responseMessage.length > 65535) {
        buffer = null;
        return;
      }
      cladBuffer.writeString(this.responseMessage, 2);
    } catch {
      return null;
    }
    return cladBuffer.buffer;
  }

  string() {
    return JSON.stringify(this);
  }
};

// MESSAGE RtsSdkProxyRequest
Anki.Vector.ExternalComms.RtsSdkProxyRequest = class extends Clad {
  constructor(clientGuid, messageId, urlPath, json) {
    super();
    this.clientGuid = clientGuid;
    this.messageId = messageId;
    this.urlPath = urlPath;
    this.json = json;
  }

  type() {
    return "RtsSdkProxyRequest";
  }

  get size() {
    let result = 0;
    result += 1; // clientGuid length (uint_8)
    result += this.clientGuid.length; // uint_8 array
    result += 1; // messageId length (uint_8)
    result += this.messageId.length; // uint_8 array
    result += 1; // urlPath length (uint_8)
    result += this.urlPath.length; // uint_8 array
    result += 2; // json length (uint_16)
    result += this.json.length; // uint_8 array
    return result;
  }

  unpack(buffer) {
    let cladBuffer = new CladBuffer(buffer);
    this.clientGuid = cladBuffer.readString(1);
    this.messageId = cladBuffer.readString(1);
    this.urlPath = cladBuffer.readString(1);
    this.json = cladBuffer.readString(2);
  }

  pack() {
    let buffer = new Uint8Array(this.size);
    let cladBuffer = new CladBuffer(buffer);

    try {
      if (this.clientGuid.length > 255) {
        buffer = null;
        return;
      }
      cladBuffer.writeString(this.clientGuid, 1);
      if (this.messageId.length > 255) {
        buffer = null;
        return;
      }
      cladBuffer.writeString(this.messageId, 1);
      if (this.urlPath.length > 255) {
        buffer = null;
        return;
      }
      cladBuffer.writeString(this.urlPath, 1);
      if (this.json.length > 65535) {
        buffer = null;
        return;
      }
      cladBuffer.writeString(this.json, 2);
    } catch {
      return null;
    }
    return cladBuffer.buffer;
  }

  string() {
    return JSON.stringify(this);
  }
};

// MESSAGE RtsSdkProxyResponse
Anki.Vector.ExternalComms.RtsSdkProxyResponse = class extends Clad {
  constructor(messageId, statusCode, responseType, responseBody) {
    super();
    this.messageId = messageId;
    this.statusCode = statusCode;
    this.responseType = responseType;
    this.responseBody = responseBody;
  }

  type() {
    return "RtsSdkProxyResponse";
  }

  get size() {
    let result = 0;
    result += 1; // messageId length (uint_8)
    result += this.messageId.length; // uint_8 array
    result += 2; // statusCode uint_16
    result += 1; // responseType length (uint_8)
    result += this.responseType.length; // uint_8 array
    result += 2; // responseBody length (uint_16)
    result += this.responseBody.length; // uint_8 array
    return result;
  }

  unpack(buffer) {
    let cladBuffer = new CladBuffer(buffer);
    this.messageId = cladBuffer.readString(1);
    this.statusCode = cladBuffer.readUint16();
    this.responseType = cladBuffer.readString(1);
    this.responseBody = cladBuffer.readString(2);
  }

  pack() {
    let buffer = new Uint8Array(this.size);
    let cladBuffer = new CladBuffer(buffer);

    try {
      if (this.messageId.length > 255) {
        buffer = null;
        return;
      }
      cladBuffer.writeString(this.messageId, 1);
      cladBuffer.writeUint16(this.statusCode);
      if (this.responseType.length > 255) {
        buffer = null;
        return;
      }
      cladBuffer.writeString(this.responseType, 1);
      if (this.responseBody.length > 65535) {
        buffer = null;
        return;
      }
      cladBuffer.writeString(this.responseBody, 2);
    } catch {
      return null;
    }
    return cladBuffer.buffer;
  }

  string() {
    return JSON.stringify(this);
  }
};

// MESSAGE RtsVersionListRequest
Anki.Vector.ExternalComms.RtsVersionListRequest = class extends Clad {
  constructor() {
    super();
  }

  type() {
    return "RtsVersionListRequest";
  }

  get size() {
    return 0;
  }

  unpack(buffer) {
    let cladBuffer = new CladBuffer(buffer);
  }

  pack() {
    let buffer = new Uint8Array(this.size);
    let cladBuffer = new CladBuffer(buffer);

    try {
    } catch {
      return null;
    }
    return cladBuffer.buffer;
  }

  string() {
    return "";
  }
};

// MESSAGE RtsVersionListResponse
Anki.Vector.ExternalComms.RtsVersionListResponse = class extends Clad {
  constructor(supportedVersions) {
    super();
    this.supportedVersions = supportedVersions;
  }

  type() {
    return "RtsVersionListResponse";
  }

  get size() {
    let result = 0;
    result += 2; // supportedVersions length (uint_16)
    result += this.supportedVersions.length * 2; // uint_16 array
    return result;
  }

  unpack(buffer) {
    let cladBuffer = new CladBuffer(buffer);
    this.supportedVersions = cladBuffer.readVArray(false, 2, 2, false);
  }

  pack() {
    let buffer = new Uint8Array(this.size);
    let cladBuffer = new CladBuffer(buffer);

    try {
      cladBuffer.writeVArray(this.supportedVersions, 2);
    } catch {
      return null;
    }
    return cladBuffer.buffer;
  }

  string() {
    return JSON.stringify(this);
  }
};

// MESSAGE RtsBleshConnectRequest
Anki.Vector.ExternalComms.RtsBleshConnectRequest = class extends Clad {
  constructor() {
    super();
  }

  type() {
    return "RtsBleshConnectRequest";
  }

  get size() {
    return 0;
  }

  unpack(buffer) {
    let cladBuffer = new CladBuffer(buffer);
  }

  pack() {
    let buffer = new Uint8Array(this.size);
    let cladBuffer = new CladBuffer(buffer);

    try {
    } catch {
      return null;
    }
    return cladBuffer.buffer;
  }

  string() {
    return "";
  }
};

// MESSAGE RtsBleshConnectResponse
Anki.Vector.ExternalComms.RtsBleshConnectResponse = class extends Clad {
  constructor(result) {
    super();
    this.result = result;
  }

  type() {
    return "RtsBleshConnectResponse";
  }

  get size() {
    let result = 0;
    result += 1; // result uint_8
    return result;
  }

  unpack(buffer) {
    let cladBuffer = new CladBuffer(buffer);
    this.result = cladBuffer.readUint8();
  }

  pack() {
    let buffer = new Uint8Array(this.size);
    let cladBuffer = new CladBuffer(buffer);

    try {
      cladBuffer.writeUint8(this.result);
    } catch {
      return null;
    }
    return cladBuffer.buffer;
  }

  string() {
    return JSON.stringify(this);
  }
};

// MESSAGE RtsBleshDisconnectRequest
Anki.Vector.ExternalComms.RtsBleshDisconnectRequest = class extends Clad {
  constructor() {
    super();
  }

  type() {
    return "RtsBleshDisconnectRequest";
  }

  get size() {
    return 0;
  }

  unpack(buffer) {
    let cladBuffer = new CladBuffer(buffer);
  }

  pack() {
    let buffer = new Uint8Array(this.size);
    let cladBuffer = new CladBuffer(buffer);

    try {
    } catch {
      return null;
    }
    return cladBuffer.buffer;
  }

  string() {
    return "";
  }
};

// MESSAGE RtsBleshDisconnectResponse
Anki.Vector.ExternalComms.RtsBleshDisconnectResponse = class extends Clad {
  constructor(result) {
    super();
    this.result = result;
  }

  type() {
    return "RtsBleshDisconnectResponse";
  }

  get size() {
    let result = 0;
    result += 1; // result uint_8
    return result;
  }

  unpack(buffer) {
    let cladBuffer = new CladBuffer(buffer);
    this.result = cladBuffer.readUint8();
  }

  pack() {
    let buffer = new Uint8Array(this.size);
    let cladBuffer = new CladBuffer(buffer);

    try {
      cladBuffer.writeUint8(this.result);
    } catch {
      return null;
    }
    return cladBuffer.buffer;
  }

  string() {
    return JSON.stringify(this);
  }
};

// MESSAGE RtsBleshToServerRequest
Anki.Vector.ExternalComms.RtsBleshToServerRequest = class extends Clad {
  constructor(data) {
    super();
    this.data = data;
  }

  type() {
    return "RtsBleshToServerRequest";
  }

  get size() {
    let result = 0;
    result += 2; // data length (uint_16)
    result += this.data.length; // uint_8 array
    return result;
  }

  unpack(buffer) {
    let cladBuffer = new CladBuffer(buffer);
    this.data = cladBuffer.readVArray(false, 1, 2, false);
  }

  pack() {
    let buffer = new Uint8Array(this.size);
    let cladBuffer = new CladBuffer(buffer);

    try {
      cladBuffer.writeVArray(this.data, 2);
    } catch {
      return null;
    }
    return cladBuffer.buffer;
  }

  string() {
    return JSON.stringify(this);
  }
};

// MESSAGE RtsBleshToServerResponse
Anki.Vector.ExternalComms.RtsBleshToServerResponse = class extends Clad {
  constructor(result) {
    super();
    this.result = result;
  }

  type() {
    return "RtsBleshToServerResponse";
  }

  get size() {
    let result = 0;
    result += 1; // result uint_8
    return result;
  }

  unpack(buffer) {
    let cladBuffer = new CladBuffer(buffer);
    this.result = cladBuffer.readUint8();
  }

  pack() {
    let buffer = new Uint8Array(this.size);
    let cladBuffer = new CladBuffer(buffer);

    try {
      cladBuffer.writeUint8(this.result);
    } catch {
      return null;
    }
    return cladBuffer.buffer;
  }

  string() {
    return JSON.stringify(this);
  }
};

// MESSAGE RtsBleshToClientRequest
Anki.Vector.ExternalComms.RtsBleshToClientRequest = class extends Clad {
  constructor(data) {
    super();
    this.data = data;
  }

  type() {
    return "RtsBleshToClientRequest";
  }

  get size() {
    let result = 0;
    result += 2; // data length (uint_16)
    result += this.data.length; // uint_8 array
    return result;
  }

  unpack(buffer) {
    let cladBuffer = new CladBuffer(buffer);
    this.data = cladBuffer.readVArray(false, 1, 2, false);
  }

  pack() {
    let buffer = new Uint8Array(this.size);
    let cladBuffer = new CladBuffer(buffer);

    try {
      cladBuffer.writeVArray(this.data, 2);
    } catch {
      return null;
    }
    return cladBuffer.buffer;
  }

  string() {
    return JSON.stringify(this);
  }
};

// MESSAGE RtsBleshToClientResponse
Anki.Vector.ExternalComms.RtsBleshToClientResponse = class extends Clad {
  constructor(result) {
    super();
    this.result = result;
  }

  type() {
    return "RtsBleshToClientResponse";
  }

  get size() {
    let result = 0;
    result += 1; // result uint_8
    return result;
  }

  unpack(buffer) {
    let cladBuffer = new CladBuffer(buffer);
    this.result = cladBuffer.readUint8();
  }

  pack() {
    let buffer = new Uint8Array(this.size);
    let cladBuffer = new CladBuffer(buffer);

    try {
      cladBuffer.writeUint8(this.result);
    } catch {
      return null;
    }
    return cladBuffer.buffer;
  }

  string() {
    return JSON.stringify(this);
  }
};

// MESSAGE Error
Anki.Vector.ExternalComms.Error = class extends Clad {
  constructor() {
    super();
  }

  type() {
    return "Error";
  }

  get size() {
    return 0;
  }

  unpack(buffer) {
    let cladBuffer = new CladBuffer(buffer);
  }

  pack() {
    let buffer = new Uint8Array(this.size);
    let cladBuffer = new CladBuffer(buffer);

    try {
    } catch {
      return null;
    }
    return cladBuffer.buffer;
  }

  string() {
    return "";
  }
};

// UNION RtsConnection_2
Anki.Vector.ExternalComms.RtsConnection_2Tag = Object.freeze({
  Error: 0x0,
  RtsConnRequest: 0x1,
  RtsConnResponse: 0x2,
  RtsNonceMessage: 0x3,
  RtsChallengeMessage: 0x4,
  RtsChallengeSuccessMessage: 0x5,
  RtsWifiConnectRequest: 0x6,
  RtsWifiConnectResponse: 0x7,
  RtsWifiIpRequest: 0x8,
  RtsWifiIpResponse: 0x9,
  RtsStatusRequest: 0xa,
  RtsStatusResponse_2: 0xb,
  RtsWifiScanRequest: 0xc,
  RtsWifiScanResponse_2: 0xd,
  RtsOtaUpdateRequest: 0xe,
  RtsOtaUpdateResponse: 0xf,
  RtsCancelPairing: 0x10,
  RtsForceDisconnect: 0x11,
  RtsAck: 0x12,
  RtsWifiAccessPointRequest: 0x13,
  RtsWifiAccessPointResponse: 0x14,
  RtsSshRequest: 0x15,
  RtsSshResponse: 0x16,
  RtsOtaCancelRequest: 0x17,
  RtsLogRequest: 0x18,
  RtsLogResponse: 0x19,
  RtsFileDownload: 0x1a,
  INVALID: 0xff,
});

Anki.Vector.ExternalComms.RtsConnection_2 = class extends Clad {
  constructor() {
    super();
    this._tag = Anki.Vector.ExternalComms.RtsConnection_2Tag.INVALID;
  }

  get tag() {
    if (this._tag == null) {
      return Anki.Vector.ExternalComms.RtsConnection_2Tag.INVALID;
    }
    return this._tag;
  }

  get size() {
    if (
      this._tag == null ||
      this._tag == Anki.Vector.ExternalComms.RtsConnection_2Tag.INVALID
    ) {
      return 1;
    }
    return 1 + this.value.size;
  }

  pack() {
    if (this._tag == Anki.Vector.ExternalComms.RtsConnection_2Tag.INVALID) {
      return null;
    }
    let buffer = new Uint8Array(this.size);
    // add tag
    buffer.set([this._tag], 0);
    // add message
    buffer.set(this.value.pack(), 1);
    return buffer;
  }

  unpackStructure(tag, buffer) {
    let ret = null;
    switch (tag) {
      case Anki.Vector.ExternalComms.RtsConnection_2Tag.Error:
        ret = new Anki.Vector.ExternalComms.Error();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_2Tag.RtsConnRequest:
        ret = new Anki.Vector.ExternalComms.RtsConnRequest();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_2Tag.RtsConnResponse:
        ret = new Anki.Vector.ExternalComms.RtsConnResponse();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_2Tag.RtsNonceMessage:
        ret = new Anki.Vector.ExternalComms.RtsNonceMessage();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_2Tag.RtsChallengeMessage:
        ret = new Anki.Vector.ExternalComms.RtsChallengeMessage();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_2Tag
        .RtsChallengeSuccessMessage:
        ret = new Anki.Vector.ExternalComms.RtsChallengeSuccessMessage();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_2Tag.RtsWifiConnectRequest:
        ret = new Anki.Vector.ExternalComms.RtsWifiConnectRequest();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_2Tag.RtsWifiConnectResponse:
        ret = new Anki.Vector.ExternalComms.RtsWifiConnectResponse();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_2Tag.RtsWifiIpRequest:
        ret = new Anki.Vector.ExternalComms.RtsWifiIpRequest();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_2Tag.RtsWifiIpResponse:
        ret = new Anki.Vector.ExternalComms.RtsWifiIpResponse();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_2Tag.RtsStatusRequest:
        ret = new Anki.Vector.ExternalComms.RtsStatusRequest();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_2Tag.RtsStatusResponse_2:
        ret = new Anki.Vector.ExternalComms.RtsStatusResponse_2();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_2Tag.RtsWifiScanRequest:
        ret = new Anki.Vector.ExternalComms.RtsWifiScanRequest();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_2Tag.RtsWifiScanResponse_2:
        ret = new Anki.Vector.ExternalComms.RtsWifiScanResponse_2();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_2Tag.RtsOtaUpdateRequest:
        ret = new Anki.Vector.ExternalComms.RtsOtaUpdateRequest();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_2Tag.RtsOtaUpdateResponse:
        ret = new Anki.Vector.ExternalComms.RtsOtaUpdateResponse();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_2Tag.RtsCancelPairing:
        ret = new Anki.Vector.ExternalComms.RtsCancelPairing();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_2Tag.RtsForceDisconnect:
        ret = new Anki.Vector.ExternalComms.RtsForceDisconnect();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_2Tag.RtsAck:
        ret = new Anki.Vector.ExternalComms.RtsAck();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_2Tag
        .RtsWifiAccessPointRequest:
        ret = new Anki.Vector.ExternalComms.RtsWifiAccessPointRequest();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_2Tag
        .RtsWifiAccessPointResponse:
        ret = new Anki.Vector.ExternalComms.RtsWifiAccessPointResponse();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_2Tag.RtsSshRequest:
        ret = new Anki.Vector.ExternalComms.RtsSshRequest();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_2Tag.RtsSshResponse:
        ret = new Anki.Vector.ExternalComms.RtsSshResponse();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_2Tag.RtsOtaCancelRequest:
        ret = new Anki.Vector.ExternalComms.RtsOtaCancelRequest();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_2Tag.RtsLogRequest:
        ret = new Anki.Vector.ExternalComms.RtsLogRequest();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_2Tag.RtsLogResponse:
        ret = new Anki.Vector.ExternalComms.RtsLogResponse();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_2Tag.RtsFileDownload:
        ret = new Anki.Vector.ExternalComms.RtsFileDownload();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      default:
        return ret;
    }
  }

  unpack(buffer) {
    this._tag = Anki.Vector.ExternalComms.RtsConnection_2Tag.INVALID;
    if (buffer.length == 0) {
      // error case
      return null;
    }
    this._tag = buffer[0];
    if (this._tag == Anki.Vector.ExternalComms.RtsConnection_2Tag.INVALID) {
      return null;
    }
    return this.unpackStructure(this._tag, buffer.slice(1));
  }

  string() {
    if (this._tag == null) {
      return "null";
    }
    if (this._tag == Anki.Vector.ExternalComms.RtsConnection_2Tag.INVALID) {
      return "INVALID";
    }
    return JSON.stringify(this);
  }

  getError() {
    if (this.tag != Anki.Vector.ExternalComms.RtsConnection_2Tag.Error) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_2WithError(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_2();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_2Tag.Error;
    m.value = value;
    return m;
  }

  getRtsConnRequest() {
    if (
      this.tag != Anki.Vector.ExternalComms.RtsConnection_2Tag.RtsConnRequest
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_2WithRtsConnRequest(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_2();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_2Tag.RtsConnRequest;
    m.value = value;
    return m;
  }

  getRtsConnResponse() {
    if (
      this.tag != Anki.Vector.ExternalComms.RtsConnection_2Tag.RtsConnResponse
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_2WithRtsConnResponse(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_2();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_2Tag.RtsConnResponse;
    m.value = value;
    return m;
  }

  getRtsNonceMessage() {
    if (
      this.tag != Anki.Vector.ExternalComms.RtsConnection_2Tag.RtsNonceMessage
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_2WithRtsNonceMessage(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_2();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_2Tag.RtsNonceMessage;
    m.value = value;
    return m;
  }

  getRtsChallengeMessage() {
    if (
      this.tag !=
      Anki.Vector.ExternalComms.RtsConnection_2Tag.RtsChallengeMessage
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_2WithRtsChallengeMessage(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_2();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_2Tag.RtsChallengeMessage;
    m.value = value;
    return m;
  }

  getRtsChallengeSuccessMessage() {
    if (
      this.tag !=
      Anki.Vector.ExternalComms.RtsConnection_2Tag.RtsChallengeSuccessMessage
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_2WithRtsChallengeSuccessMessage(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_2();
    m._tag =
      Anki.Vector.ExternalComms.RtsConnection_2Tag.RtsChallengeSuccessMessage;
    m.value = value;
    return m;
  }

  getRtsWifiConnectRequest() {
    if (
      this.tag !=
      Anki.Vector.ExternalComms.RtsConnection_2Tag.RtsWifiConnectRequest
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_2WithRtsWifiConnectRequest(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_2();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_2Tag.RtsWifiConnectRequest;
    m.value = value;
    return m;
  }

  getRtsWifiConnectResponse() {
    if (
      this.tag !=
      Anki.Vector.ExternalComms.RtsConnection_2Tag.RtsWifiConnectResponse
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_2WithRtsWifiConnectResponse(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_2();
    m._tag =
      Anki.Vector.ExternalComms.RtsConnection_2Tag.RtsWifiConnectResponse;
    m.value = value;
    return m;
  }

  getRtsWifiIpRequest() {
    if (
      this.tag != Anki.Vector.ExternalComms.RtsConnection_2Tag.RtsWifiIpRequest
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_2WithRtsWifiIpRequest(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_2();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_2Tag.RtsWifiIpRequest;
    m.value = value;
    return m;
  }

  getRtsWifiIpResponse() {
    if (
      this.tag != Anki.Vector.ExternalComms.RtsConnection_2Tag.RtsWifiIpResponse
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_2WithRtsWifiIpResponse(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_2();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_2Tag.RtsWifiIpResponse;
    m.value = value;
    return m;
  }

  getRtsStatusRequest() {
    if (
      this.tag != Anki.Vector.ExternalComms.RtsConnection_2Tag.RtsStatusRequest
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_2WithRtsStatusRequest(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_2();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_2Tag.RtsStatusRequest;
    m.value = value;
    return m;
  }

  getRtsStatusResponse_2() {
    if (
      this.tag !=
      Anki.Vector.ExternalComms.RtsConnection_2Tag.RtsStatusResponse_2
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_2WithRtsStatusResponse_2(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_2();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_2Tag.RtsStatusResponse_2;
    m.value = value;
    return m;
  }

  getRtsWifiScanRequest() {
    if (
      this.tag !=
      Anki.Vector.ExternalComms.RtsConnection_2Tag.RtsWifiScanRequest
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_2WithRtsWifiScanRequest(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_2();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_2Tag.RtsWifiScanRequest;
    m.value = value;
    return m;
  }

  getRtsWifiScanResponse_2() {
    if (
      this.tag !=
      Anki.Vector.ExternalComms.RtsConnection_2Tag.RtsWifiScanResponse_2
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_2WithRtsWifiScanResponse_2(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_2();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_2Tag.RtsWifiScanResponse_2;
    m.value = value;
    return m;
  }

  getRtsOtaUpdateRequest() {
    if (
      this.tag !=
      Anki.Vector.ExternalComms.RtsConnection_2Tag.RtsOtaUpdateRequest
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_2WithRtsOtaUpdateRequest(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_2();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_2Tag.RtsOtaUpdateRequest;
    m.value = value;
    return m;
  }

  getRtsOtaUpdateResponse() {
    if (
      this.tag !=
      Anki.Vector.ExternalComms.RtsConnection_2Tag.RtsOtaUpdateResponse
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_2WithRtsOtaUpdateResponse(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_2();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_2Tag.RtsOtaUpdateResponse;
    m.value = value;
    return m;
  }

  getRtsCancelPairing() {
    if (
      this.tag != Anki.Vector.ExternalComms.RtsConnection_2Tag.RtsCancelPairing
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_2WithRtsCancelPairing(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_2();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_2Tag.RtsCancelPairing;
    m.value = value;
    return m;
  }

  getRtsForceDisconnect() {
    if (
      this.tag !=
      Anki.Vector.ExternalComms.RtsConnection_2Tag.RtsForceDisconnect
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_2WithRtsForceDisconnect(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_2();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_2Tag.RtsForceDisconnect;
    m.value = value;
    return m;
  }

  getRtsAck() {
    if (this.tag != Anki.Vector.ExternalComms.RtsConnection_2Tag.RtsAck) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_2WithRtsAck(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_2();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_2Tag.RtsAck;
    m.value = value;
    return m;
  }

  getRtsWifiAccessPointRequest() {
    if (
      this.tag !=
      Anki.Vector.ExternalComms.RtsConnection_2Tag.RtsWifiAccessPointRequest
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_2WithRtsWifiAccessPointRequest(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_2();
    m._tag =
      Anki.Vector.ExternalComms.RtsConnection_2Tag.RtsWifiAccessPointRequest;
    m.value = value;
    return m;
  }

  getRtsWifiAccessPointResponse() {
    if (
      this.tag !=
      Anki.Vector.ExternalComms.RtsConnection_2Tag.RtsWifiAccessPointResponse
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_2WithRtsWifiAccessPointResponse(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_2();
    m._tag =
      Anki.Vector.ExternalComms.RtsConnection_2Tag.RtsWifiAccessPointResponse;
    m.value = value;
    return m;
  }

  getRtsSshRequest() {
    if (
      this.tag != Anki.Vector.ExternalComms.RtsConnection_2Tag.RtsSshRequest
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_2WithRtsSshRequest(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_2();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_2Tag.RtsSshRequest;
    m.value = value;
    return m;
  }

  getRtsSshResponse() {
    if (
      this.tag != Anki.Vector.ExternalComms.RtsConnection_2Tag.RtsSshResponse
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_2WithRtsSshResponse(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_2();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_2Tag.RtsSshResponse;
    m.value = value;
    return m;
  }

  getRtsOtaCancelRequest() {
    if (
      this.tag !=
      Anki.Vector.ExternalComms.RtsConnection_2Tag.RtsOtaCancelRequest
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_2WithRtsOtaCancelRequest(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_2();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_2Tag.RtsOtaCancelRequest;
    m.value = value;
    return m;
  }

  getRtsLogRequest() {
    if (
      this.tag != Anki.Vector.ExternalComms.RtsConnection_2Tag.RtsLogRequest
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_2WithRtsLogRequest(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_2();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_2Tag.RtsLogRequest;
    m.value = value;
    return m;
  }

  getRtsLogResponse() {
    if (
      this.tag != Anki.Vector.ExternalComms.RtsConnection_2Tag.RtsLogResponse
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_2WithRtsLogResponse(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_2();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_2Tag.RtsLogResponse;
    m.value = value;
    return m;
  }

  getRtsFileDownload() {
    if (
      this.tag != Anki.Vector.ExternalComms.RtsConnection_2Tag.RtsFileDownload
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_2WithRtsFileDownload(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_2();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_2Tag.RtsFileDownload;
    m.value = value;
    return m;
  }
};

// UNION RtsConnection_3
Anki.Vector.ExternalComms.RtsConnection_3Tag = Object.freeze({
  Error: 0x0,
  RtsConnRequest: 0x1,
  RtsConnResponse: 0x2,
  RtsNonceMessage: 0x3,
  RtsChallengeMessage: 0x4,
  RtsChallengeSuccessMessage: 0x5,
  RtsWifiConnectRequest: 0x6,
  RtsWifiConnectResponse_3: 0x7,
  RtsWifiIpRequest: 0x8,
  RtsWifiIpResponse: 0x9,
  RtsStatusRequest: 0xa,
  RtsStatusResponse_3: 0xb,
  RtsWifiScanRequest: 0xc,
  RtsWifiScanResponse_3: 0xd,
  RtsOtaUpdateRequest: 0xe,
  RtsOtaUpdateResponse: 0xf,
  RtsCancelPairing: 0x10,
  RtsForceDisconnect: 0x11,
  RtsAck: 0x12,
  RtsWifiAccessPointRequest: 0x13,
  RtsWifiAccessPointResponse: 0x14,
  RtsSshRequest: 0x15,
  RtsSshResponse: 0x16,
  RtsOtaCancelRequest: 0x17,
  RtsLogRequest: 0x18,
  RtsLogResponse: 0x19,
  RtsFileDownload: 0x1a,
  RtsWifiForgetRequest: 0x1b,
  RtsWifiForgetResponse: 0x1c,
  RtsCloudSessionRequest: 0x1d,
  RtsCloudSessionResponse: 0x1e,
  INVALID: 0xff,
});

Anki.Vector.ExternalComms.RtsConnection_3 = class extends Clad {
  constructor() {
    super();
    this._tag = Anki.Vector.ExternalComms.RtsConnection_3Tag.INVALID;
  }

  get tag() {
    if (this._tag == null) {
      return Anki.Vector.ExternalComms.RtsConnection_3Tag.INVALID;
    }
    return this._tag;
  }

  get size() {
    if (
      this._tag == null ||
      this._tag == Anki.Vector.ExternalComms.RtsConnection_3Tag.INVALID
    ) {
      return 1;
    }
    return 1 + this.value.size;
  }

  pack() {
    if (this._tag == Anki.Vector.ExternalComms.RtsConnection_3Tag.INVALID) {
      return null;
    }
    let buffer = new Uint8Array(this.size);
    // add tag
    buffer.set([this._tag], 0);
    // add message
    buffer.set(this.value.pack(), 1);
    return buffer;
  }

  unpackStructure(tag, buffer) {
    let ret = null;
    switch (tag) {
      case Anki.Vector.ExternalComms.RtsConnection_3Tag.Error:
        ret = new Anki.Vector.ExternalComms.Error();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_3Tag.RtsConnRequest:
        ret = new Anki.Vector.ExternalComms.RtsConnRequest();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_3Tag.RtsConnResponse:
        ret = new Anki.Vector.ExternalComms.RtsConnResponse();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_3Tag.RtsNonceMessage:
        ret = new Anki.Vector.ExternalComms.RtsNonceMessage();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_3Tag.RtsChallengeMessage:
        ret = new Anki.Vector.ExternalComms.RtsChallengeMessage();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_3Tag
        .RtsChallengeSuccessMessage:
        ret = new Anki.Vector.ExternalComms.RtsChallengeSuccessMessage();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_3Tag.RtsWifiConnectRequest:
        ret = new Anki.Vector.ExternalComms.RtsWifiConnectRequest();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_3Tag
        .RtsWifiConnectResponse_3:
        ret = new Anki.Vector.ExternalComms.RtsWifiConnectResponse_3();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_3Tag.RtsWifiIpRequest:
        ret = new Anki.Vector.ExternalComms.RtsWifiIpRequest();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_3Tag.RtsWifiIpResponse:
        ret = new Anki.Vector.ExternalComms.RtsWifiIpResponse();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_3Tag.RtsStatusRequest:
        ret = new Anki.Vector.ExternalComms.RtsStatusRequest();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_3Tag.RtsStatusResponse_3:
        ret = new Anki.Vector.ExternalComms.RtsStatusResponse_3();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_3Tag.RtsWifiScanRequest:
        ret = new Anki.Vector.ExternalComms.RtsWifiScanRequest();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_3Tag.RtsWifiScanResponse_3:
        ret = new Anki.Vector.ExternalComms.RtsWifiScanResponse_3();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_3Tag.RtsOtaUpdateRequest:
        ret = new Anki.Vector.ExternalComms.RtsOtaUpdateRequest();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_3Tag.RtsOtaUpdateResponse:
        ret = new Anki.Vector.ExternalComms.RtsOtaUpdateResponse();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_3Tag.RtsCancelPairing:
        ret = new Anki.Vector.ExternalComms.RtsCancelPairing();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_3Tag.RtsForceDisconnect:
        ret = new Anki.Vector.ExternalComms.RtsForceDisconnect();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_3Tag.RtsAck:
        ret = new Anki.Vector.ExternalComms.RtsAck();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_3Tag
        .RtsWifiAccessPointRequest:
        ret = new Anki.Vector.ExternalComms.RtsWifiAccessPointRequest();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_3Tag
        .RtsWifiAccessPointResponse:
        ret = new Anki.Vector.ExternalComms.RtsWifiAccessPointResponse();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_3Tag.RtsSshRequest:
        ret = new Anki.Vector.ExternalComms.RtsSshRequest();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_3Tag.RtsSshResponse:
        ret = new Anki.Vector.ExternalComms.RtsSshResponse();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_3Tag.RtsOtaCancelRequest:
        ret = new Anki.Vector.ExternalComms.RtsOtaCancelRequest();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_3Tag.RtsLogRequest:
        ret = new Anki.Vector.ExternalComms.RtsLogRequest();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_3Tag.RtsLogResponse:
        ret = new Anki.Vector.ExternalComms.RtsLogResponse();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_3Tag.RtsFileDownload:
        ret = new Anki.Vector.ExternalComms.RtsFileDownload();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_3Tag.RtsWifiForgetRequest:
        ret = new Anki.Vector.ExternalComms.RtsWifiForgetRequest();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_3Tag.RtsWifiForgetResponse:
        ret = new Anki.Vector.ExternalComms.RtsWifiForgetResponse();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_3Tag.RtsCloudSessionRequest:
        ret = new Anki.Vector.ExternalComms.RtsCloudSessionRequest();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_3Tag.RtsCloudSessionResponse:
        ret = new Anki.Vector.ExternalComms.RtsCloudSessionResponse();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      default:
        return ret;
    }
  }

  unpack(buffer) {
    this._tag = Anki.Vector.ExternalComms.RtsConnection_3Tag.INVALID;
    if (buffer.length == 0) {
      // error case
      return null;
    }
    this._tag = buffer[0];
    if (this._tag == Anki.Vector.ExternalComms.RtsConnection_3Tag.INVALID) {
      return null;
    }
    return this.unpackStructure(this._tag, buffer.slice(1));
  }

  string() {
    if (this._tag == null) {
      return "null";
    }
    if (this._tag == Anki.Vector.ExternalComms.RtsConnection_3Tag.INVALID) {
      return "INVALID";
    }
    return JSON.stringify(this);
  }

  getError() {
    if (this.tag != Anki.Vector.ExternalComms.RtsConnection_3Tag.Error) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_3WithError(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_3();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_3Tag.Error;
    m.value = value;
    return m;
  }

  getRtsConnRequest() {
    if (
      this.tag != Anki.Vector.ExternalComms.RtsConnection_3Tag.RtsConnRequest
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_3WithRtsConnRequest(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_3();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_3Tag.RtsConnRequest;
    m.value = value;
    return m;
  }

  getRtsConnResponse() {
    if (
      this.tag != Anki.Vector.ExternalComms.RtsConnection_3Tag.RtsConnResponse
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_3WithRtsConnResponse(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_3();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_3Tag.RtsConnResponse;
    m.value = value;
    return m;
  }

  getRtsNonceMessage() {
    if (
      this.tag != Anki.Vector.ExternalComms.RtsConnection_3Tag.RtsNonceMessage
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_3WithRtsNonceMessage(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_3();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_3Tag.RtsNonceMessage;
    m.value = value;
    return m;
  }

  getRtsChallengeMessage() {
    if (
      this.tag !=
      Anki.Vector.ExternalComms.RtsConnection_3Tag.RtsChallengeMessage
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_3WithRtsChallengeMessage(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_3();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_3Tag.RtsChallengeMessage;
    m.value = value;
    return m;
  }

  getRtsChallengeSuccessMessage() {
    if (
      this.tag !=
      Anki.Vector.ExternalComms.RtsConnection_3Tag.RtsChallengeSuccessMessage
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_3WithRtsChallengeSuccessMessage(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_3();
    m._tag =
      Anki.Vector.ExternalComms.RtsConnection_3Tag.RtsChallengeSuccessMessage;
    m.value = value;
    return m;
  }

  getRtsWifiConnectRequest() {
    if (
      this.tag !=
      Anki.Vector.ExternalComms.RtsConnection_3Tag.RtsWifiConnectRequest
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_3WithRtsWifiConnectRequest(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_3();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_3Tag.RtsWifiConnectRequest;
    m.value = value;
    return m;
  }

  getRtsWifiConnectResponse_3() {
    if (
      this.tag !=
      Anki.Vector.ExternalComms.RtsConnection_3Tag.RtsWifiConnectResponse_3
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_3WithRtsWifiConnectResponse_3(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_3();
    m._tag =
      Anki.Vector.ExternalComms.RtsConnection_3Tag.RtsWifiConnectResponse_3;
    m.value = value;
    return m;
  }

  getRtsWifiIpRequest() {
    if (
      this.tag != Anki.Vector.ExternalComms.RtsConnection_3Tag.RtsWifiIpRequest
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_3WithRtsWifiIpRequest(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_3();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_3Tag.RtsWifiIpRequest;
    m.value = value;
    return m;
  }

  getRtsWifiIpResponse() {
    if (
      this.tag != Anki.Vector.ExternalComms.RtsConnection_3Tag.RtsWifiIpResponse
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_3WithRtsWifiIpResponse(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_3();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_3Tag.RtsWifiIpResponse;
    m.value = value;
    return m;
  }

  getRtsStatusRequest() {
    if (
      this.tag != Anki.Vector.ExternalComms.RtsConnection_3Tag.RtsStatusRequest
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_3WithRtsStatusRequest(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_3();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_3Tag.RtsStatusRequest;
    m.value = value;
    return m;
  }

  getRtsStatusResponse_3() {
    if (
      this.tag !=
      Anki.Vector.ExternalComms.RtsConnection_3Tag.RtsStatusResponse_3
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_3WithRtsStatusResponse_3(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_3();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_3Tag.RtsStatusResponse_3;
    m.value = value;
    return m;
  }

  getRtsWifiScanRequest() {
    if (
      this.tag !=
      Anki.Vector.ExternalComms.RtsConnection_3Tag.RtsWifiScanRequest
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_3WithRtsWifiScanRequest(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_3();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_3Tag.RtsWifiScanRequest;
    m.value = value;
    return m;
  }

  getRtsWifiScanResponse_3() {
    if (
      this.tag !=
      Anki.Vector.ExternalComms.RtsConnection_3Tag.RtsWifiScanResponse_3
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_3WithRtsWifiScanResponse_3(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_3();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_3Tag.RtsWifiScanResponse_3;
    m.value = value;
    return m;
  }

  getRtsOtaUpdateRequest() {
    if (
      this.tag !=
      Anki.Vector.ExternalComms.RtsConnection_3Tag.RtsOtaUpdateRequest
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_3WithRtsOtaUpdateRequest(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_3();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_3Tag.RtsOtaUpdateRequest;
    m.value = value;
    return m;
  }

  getRtsOtaUpdateResponse() {
    if (
      this.tag !=
      Anki.Vector.ExternalComms.RtsConnection_3Tag.RtsOtaUpdateResponse
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_3WithRtsOtaUpdateResponse(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_3();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_3Tag.RtsOtaUpdateResponse;
    m.value = value;
    return m;
  }

  getRtsCancelPairing() {
    if (
      this.tag != Anki.Vector.ExternalComms.RtsConnection_3Tag.RtsCancelPairing
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_3WithRtsCancelPairing(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_3();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_3Tag.RtsCancelPairing;
    m.value = value;
    return m;
  }

  getRtsForceDisconnect() {
    if (
      this.tag !=
      Anki.Vector.ExternalComms.RtsConnection_3Tag.RtsForceDisconnect
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_3WithRtsForceDisconnect(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_3();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_3Tag.RtsForceDisconnect;
    m.value = value;
    return m;
  }

  getRtsAck() {
    if (this.tag != Anki.Vector.ExternalComms.RtsConnection_3Tag.RtsAck) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_3WithRtsAck(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_3();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_3Tag.RtsAck;
    m.value = value;
    return m;
  }

  getRtsWifiAccessPointRequest() {
    if (
      this.tag !=
      Anki.Vector.ExternalComms.RtsConnection_3Tag.RtsWifiAccessPointRequest
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_3WithRtsWifiAccessPointRequest(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_3();
    m._tag =
      Anki.Vector.ExternalComms.RtsConnection_3Tag.RtsWifiAccessPointRequest;
    m.value = value;
    return m;
  }

  getRtsWifiAccessPointResponse() {
    if (
      this.tag !=
      Anki.Vector.ExternalComms.RtsConnection_3Tag.RtsWifiAccessPointResponse
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_3WithRtsWifiAccessPointResponse(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_3();
    m._tag =
      Anki.Vector.ExternalComms.RtsConnection_3Tag.RtsWifiAccessPointResponse;
    m.value = value;
    return m;
  }

  getRtsSshRequest() {
    if (
      this.tag != Anki.Vector.ExternalComms.RtsConnection_3Tag.RtsSshRequest
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_3WithRtsSshRequest(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_3();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_3Tag.RtsSshRequest;
    m.value = value;
    return m;
  }

  getRtsSshResponse() {
    if (
      this.tag != Anki.Vector.ExternalComms.RtsConnection_3Tag.RtsSshResponse
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_3WithRtsSshResponse(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_3();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_3Tag.RtsSshResponse;
    m.value = value;
    return m;
  }

  getRtsOtaCancelRequest() {
    if (
      this.tag !=
      Anki.Vector.ExternalComms.RtsConnection_3Tag.RtsOtaCancelRequest
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_3WithRtsOtaCancelRequest(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_3();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_3Tag.RtsOtaCancelRequest;
    m.value = value;
    return m;
  }

  getRtsLogRequest() {
    if (
      this.tag != Anki.Vector.ExternalComms.RtsConnection_3Tag.RtsLogRequest
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_3WithRtsLogRequest(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_3();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_3Tag.RtsLogRequest;
    m.value = value;
    return m;
  }

  getRtsLogResponse() {
    if (
      this.tag != Anki.Vector.ExternalComms.RtsConnection_3Tag.RtsLogResponse
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_3WithRtsLogResponse(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_3();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_3Tag.RtsLogResponse;
    m.value = value;
    return m;
  }

  getRtsFileDownload() {
    if (
      this.tag != Anki.Vector.ExternalComms.RtsConnection_3Tag.RtsFileDownload
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_3WithRtsFileDownload(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_3();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_3Tag.RtsFileDownload;
    m.value = value;
    return m;
  }

  getRtsWifiForgetRequest() {
    if (
      this.tag !=
      Anki.Vector.ExternalComms.RtsConnection_3Tag.RtsWifiForgetRequest
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_3WithRtsWifiForgetRequest(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_3();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_3Tag.RtsWifiForgetRequest;
    m.value = value;
    return m;
  }

  getRtsWifiForgetResponse() {
    if (
      this.tag !=
      Anki.Vector.ExternalComms.RtsConnection_3Tag.RtsWifiForgetResponse
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_3WithRtsWifiForgetResponse(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_3();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_3Tag.RtsWifiForgetResponse;
    m.value = value;
    return m;
  }

  getRtsCloudSessionRequest() {
    if (
      this.tag !=
      Anki.Vector.ExternalComms.RtsConnection_3Tag.RtsCloudSessionRequest
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_3WithRtsCloudSessionRequest(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_3();
    m._tag =
      Anki.Vector.ExternalComms.RtsConnection_3Tag.RtsCloudSessionRequest;
    m.value = value;
    return m;
  }

  getRtsCloudSessionResponse() {
    if (
      this.tag !=
      Anki.Vector.ExternalComms.RtsConnection_3Tag.RtsCloudSessionResponse
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_3WithRtsCloudSessionResponse(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_3();
    m._tag =
      Anki.Vector.ExternalComms.RtsConnection_3Tag.RtsCloudSessionResponse;
    m.value = value;
    return m;
  }
};

// UNION RtsConnection_4
Anki.Vector.ExternalComms.RtsConnection_4Tag = Object.freeze({
  Error: 0x0,
  RtsConnRequest: 0x1,
  RtsConnResponse: 0x2,
  RtsNonceMessage: 0x3,
  RtsChallengeMessage: 0x4,
  RtsChallengeSuccessMessage: 0x5,
  RtsWifiConnectRequest: 0x6,
  RtsWifiConnectResponse_3: 0x7,
  RtsWifiIpRequest: 0x8,
  RtsWifiIpResponse: 0x9,
  RtsStatusRequest: 0xa,
  RtsStatusResponse_4: 0xb,
  RtsWifiScanRequest: 0xc,
  RtsWifiScanResponse_3: 0xd,
  RtsOtaUpdateRequest: 0xe,
  RtsOtaUpdateResponse: 0xf,
  RtsCancelPairing: 0x10,
  RtsForceDisconnect: 0x11,
  RtsAck: 0x12,
  RtsWifiAccessPointRequest: 0x13,
  RtsWifiAccessPointResponse: 0x14,
  RtsSshRequest: 0x15,
  RtsSshResponse: 0x16,
  RtsOtaCancelRequest: 0x17,
  RtsLogRequest: 0x18,
  RtsLogResponse: 0x19,
  RtsFileDownload: 0x1a,
  RtsWifiForgetRequest: 0x1b,
  RtsWifiForgetResponse: 0x1c,
  RtsCloudSessionRequest: 0x1d,
  RtsCloudSessionResponse: 0x1e,
  RtsAppConnectionIdRequest: 0x1f,
  RtsAppConnectionIdResponse: 0x20,
  RtsResponse: 0x21,
  INVALID: 0xff,
});

Anki.Vector.ExternalComms.RtsConnection_4 = class extends Clad {
  constructor() {
    super();
    this._tag = Anki.Vector.ExternalComms.RtsConnection_4Tag.INVALID;
  }

  get tag() {
    if (this._tag == null) {
      return Anki.Vector.ExternalComms.RtsConnection_4Tag.INVALID;
    }
    return this._tag;
  }

  get size() {
    if (
      this._tag == null ||
      this._tag == Anki.Vector.ExternalComms.RtsConnection_4Tag.INVALID
    ) {
      return 1;
    }
    return 1 + this.value.size;
  }

  pack() {
    if (this._tag == Anki.Vector.ExternalComms.RtsConnection_4Tag.INVALID) {
      return null;
    }
    let buffer = new Uint8Array(this.size);
    // add tag
    buffer.set([this._tag], 0);
    // add message
    buffer.set(this.value.pack(), 1);
    return buffer;
  }

  unpackStructure(tag, buffer) {
    let ret = null;
    switch (tag) {
      case Anki.Vector.ExternalComms.RtsConnection_4Tag.Error:
        ret = new Anki.Vector.ExternalComms.Error();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_4Tag.RtsConnRequest:
        ret = new Anki.Vector.ExternalComms.RtsConnRequest();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_4Tag.RtsConnResponse:
        ret = new Anki.Vector.ExternalComms.RtsConnResponse();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_4Tag.RtsNonceMessage:
        ret = new Anki.Vector.ExternalComms.RtsNonceMessage();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_4Tag.RtsChallengeMessage:
        ret = new Anki.Vector.ExternalComms.RtsChallengeMessage();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_4Tag
        .RtsChallengeSuccessMessage:
        ret = new Anki.Vector.ExternalComms.RtsChallengeSuccessMessage();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_4Tag.RtsWifiConnectRequest:
        ret = new Anki.Vector.ExternalComms.RtsWifiConnectRequest();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_4Tag
        .RtsWifiConnectResponse_3:
        ret = new Anki.Vector.ExternalComms.RtsWifiConnectResponse_3();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_4Tag.RtsWifiIpRequest:
        ret = new Anki.Vector.ExternalComms.RtsWifiIpRequest();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_4Tag.RtsWifiIpResponse:
        ret = new Anki.Vector.ExternalComms.RtsWifiIpResponse();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_4Tag.RtsStatusRequest:
        ret = new Anki.Vector.ExternalComms.RtsStatusRequest();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_4Tag.RtsStatusResponse_4:
        ret = new Anki.Vector.ExternalComms.RtsStatusResponse_4();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_4Tag.RtsWifiScanRequest:
        ret = new Anki.Vector.ExternalComms.RtsWifiScanRequest();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_4Tag.RtsWifiScanResponse_3:
        ret = new Anki.Vector.ExternalComms.RtsWifiScanResponse_3();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_4Tag.RtsOtaUpdateRequest:
        ret = new Anki.Vector.ExternalComms.RtsOtaUpdateRequest();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_4Tag.RtsOtaUpdateResponse:
        ret = new Anki.Vector.ExternalComms.RtsOtaUpdateResponse();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_4Tag.RtsCancelPairing:
        ret = new Anki.Vector.ExternalComms.RtsCancelPairing();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_4Tag.RtsForceDisconnect:
        ret = new Anki.Vector.ExternalComms.RtsForceDisconnect();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_4Tag.RtsAck:
        ret = new Anki.Vector.ExternalComms.RtsAck();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_4Tag
        .RtsWifiAccessPointRequest:
        ret = new Anki.Vector.ExternalComms.RtsWifiAccessPointRequest();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_4Tag
        .RtsWifiAccessPointResponse:
        ret = new Anki.Vector.ExternalComms.RtsWifiAccessPointResponse();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_4Tag.RtsSshRequest:
        ret = new Anki.Vector.ExternalComms.RtsSshRequest();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_4Tag.RtsSshResponse:
        ret = new Anki.Vector.ExternalComms.RtsSshResponse();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_4Tag.RtsOtaCancelRequest:
        ret = new Anki.Vector.ExternalComms.RtsOtaCancelRequest();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_4Tag.RtsLogRequest:
        ret = new Anki.Vector.ExternalComms.RtsLogRequest();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_4Tag.RtsLogResponse:
        ret = new Anki.Vector.ExternalComms.RtsLogResponse();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_4Tag.RtsFileDownload:
        ret = new Anki.Vector.ExternalComms.RtsFileDownload();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_4Tag.RtsWifiForgetRequest:
        ret = new Anki.Vector.ExternalComms.RtsWifiForgetRequest();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_4Tag.RtsWifiForgetResponse:
        ret = new Anki.Vector.ExternalComms.RtsWifiForgetResponse();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_4Tag.RtsCloudSessionRequest:
        ret = new Anki.Vector.ExternalComms.RtsCloudSessionRequest();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_4Tag.RtsCloudSessionResponse:
        ret = new Anki.Vector.ExternalComms.RtsCloudSessionResponse();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_4Tag
        .RtsAppConnectionIdRequest:
        ret = new Anki.Vector.ExternalComms.RtsAppConnectionIdRequest();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_4Tag
        .RtsAppConnectionIdResponse:
        ret = new Anki.Vector.ExternalComms.RtsAppConnectionIdResponse();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_4Tag.RtsResponse:
        ret = new Anki.Vector.ExternalComms.RtsResponse();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      default:
        return ret;
    }
  }

  unpack(buffer) {
    this._tag = Anki.Vector.ExternalComms.RtsConnection_4Tag.INVALID;
    if (buffer.length == 0) {
      // error case
      return null;
    }
    this._tag = buffer[0];
    if (this._tag == Anki.Vector.ExternalComms.RtsConnection_4Tag.INVALID) {
      return null;
    }
    return this.unpackStructure(this._tag, buffer.slice(1));
  }

  string() {
    if (this._tag == null) {
      return "null";
    }
    if (this._tag == Anki.Vector.ExternalComms.RtsConnection_4Tag.INVALID) {
      return "INVALID";
    }
    return JSON.stringify(this);
  }

  getError() {
    if (this.tag != Anki.Vector.ExternalComms.RtsConnection_4Tag.Error) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_4WithError(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_4();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_4Tag.Error;
    m.value = value;
    return m;
  }

  getRtsConnRequest() {
    if (
      this.tag != Anki.Vector.ExternalComms.RtsConnection_4Tag.RtsConnRequest
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_4WithRtsConnRequest(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_4();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_4Tag.RtsConnRequest;
    m.value = value;
    return m;
  }

  getRtsConnResponse() {
    if (
      this.tag != Anki.Vector.ExternalComms.RtsConnection_4Tag.RtsConnResponse
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_4WithRtsConnResponse(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_4();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_4Tag.RtsConnResponse;
    m.value = value;
    return m;
  }

  getRtsNonceMessage() {
    if (
      this.tag != Anki.Vector.ExternalComms.RtsConnection_4Tag.RtsNonceMessage
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_4WithRtsNonceMessage(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_4();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_4Tag.RtsNonceMessage;
    m.value = value;
    return m;
  }

  getRtsChallengeMessage() {
    if (
      this.tag !=
      Anki.Vector.ExternalComms.RtsConnection_4Tag.RtsChallengeMessage
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_4WithRtsChallengeMessage(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_4();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_4Tag.RtsChallengeMessage;
    m.value = value;
    return m;
  }

  getRtsChallengeSuccessMessage() {
    if (
      this.tag !=
      Anki.Vector.ExternalComms.RtsConnection_4Tag.RtsChallengeSuccessMessage
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_4WithRtsChallengeSuccessMessage(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_4();
    m._tag =
      Anki.Vector.ExternalComms.RtsConnection_4Tag.RtsChallengeSuccessMessage;
    m.value = value;
    return m;
  }

  getRtsWifiConnectRequest() {
    if (
      this.tag !=
      Anki.Vector.ExternalComms.RtsConnection_4Tag.RtsWifiConnectRequest
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_4WithRtsWifiConnectRequest(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_4();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_4Tag.RtsWifiConnectRequest;
    m.value = value;
    return m;
  }

  getRtsWifiConnectResponse_3() {
    if (
      this.tag !=
      Anki.Vector.ExternalComms.RtsConnection_4Tag.RtsWifiConnectResponse_3
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_4WithRtsWifiConnectResponse_3(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_4();
    m._tag =
      Anki.Vector.ExternalComms.RtsConnection_4Tag.RtsWifiConnectResponse_3;
    m.value = value;
    return m;
  }

  getRtsWifiIpRequest() {
    if (
      this.tag != Anki.Vector.ExternalComms.RtsConnection_4Tag.RtsWifiIpRequest
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_4WithRtsWifiIpRequest(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_4();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_4Tag.RtsWifiIpRequest;
    m.value = value;
    return m;
  }

  getRtsWifiIpResponse() {
    if (
      this.tag != Anki.Vector.ExternalComms.RtsConnection_4Tag.RtsWifiIpResponse
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_4WithRtsWifiIpResponse(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_4();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_4Tag.RtsWifiIpResponse;
    m.value = value;
    return m;
  }

  getRtsStatusRequest() {
    if (
      this.tag != Anki.Vector.ExternalComms.RtsConnection_4Tag.RtsStatusRequest
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_4WithRtsStatusRequest(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_4();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_4Tag.RtsStatusRequest;
    m.value = value;
    return m;
  }

  getRtsStatusResponse_4() {
    if (
      this.tag !=
      Anki.Vector.ExternalComms.RtsConnection_4Tag.RtsStatusResponse_4
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_4WithRtsStatusResponse_4(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_4();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_4Tag.RtsStatusResponse_4;
    m.value = value;
    return m;
  }

  getRtsWifiScanRequest() {
    if (
      this.tag !=
      Anki.Vector.ExternalComms.RtsConnection_4Tag.RtsWifiScanRequest
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_4WithRtsWifiScanRequest(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_4();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_4Tag.RtsWifiScanRequest;
    m.value = value;
    return m;
  }

  getRtsWifiScanResponse_3() {
    if (
      this.tag !=
      Anki.Vector.ExternalComms.RtsConnection_4Tag.RtsWifiScanResponse_3
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_4WithRtsWifiScanResponse_3(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_4();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_4Tag.RtsWifiScanResponse_3;
    m.value = value;
    return m;
  }

  getRtsOtaUpdateRequest() {
    if (
      this.tag !=
      Anki.Vector.ExternalComms.RtsConnection_4Tag.RtsOtaUpdateRequest
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_4WithRtsOtaUpdateRequest(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_4();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_4Tag.RtsOtaUpdateRequest;
    m.value = value;
    return m;
  }

  getRtsOtaUpdateResponse() {
    if (
      this.tag !=
      Anki.Vector.ExternalComms.RtsConnection_4Tag.RtsOtaUpdateResponse
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_4WithRtsOtaUpdateResponse(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_4();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_4Tag.RtsOtaUpdateResponse;
    m.value = value;
    return m;
  }

  getRtsCancelPairing() {
    if (
      this.tag != Anki.Vector.ExternalComms.RtsConnection_4Tag.RtsCancelPairing
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_4WithRtsCancelPairing(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_4();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_4Tag.RtsCancelPairing;
    m.value = value;
    return m;
  }

  getRtsForceDisconnect() {
    if (
      this.tag !=
      Anki.Vector.ExternalComms.RtsConnection_4Tag.RtsForceDisconnect
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_4WithRtsForceDisconnect(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_4();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_4Tag.RtsForceDisconnect;
    m.value = value;
    return m;
  }

  getRtsAck() {
    if (this.tag != Anki.Vector.ExternalComms.RtsConnection_4Tag.RtsAck) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_4WithRtsAck(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_4();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_4Tag.RtsAck;
    m.value = value;
    return m;
  }

  getRtsWifiAccessPointRequest() {
    if (
      this.tag !=
      Anki.Vector.ExternalComms.RtsConnection_4Tag.RtsWifiAccessPointRequest
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_4WithRtsWifiAccessPointRequest(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_4();
    m._tag =
      Anki.Vector.ExternalComms.RtsConnection_4Tag.RtsWifiAccessPointRequest;
    m.value = value;
    return m;
  }

  getRtsWifiAccessPointResponse() {
    if (
      this.tag !=
      Anki.Vector.ExternalComms.RtsConnection_4Tag.RtsWifiAccessPointResponse
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_4WithRtsWifiAccessPointResponse(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_4();
    m._tag =
      Anki.Vector.ExternalComms.RtsConnection_4Tag.RtsWifiAccessPointResponse;
    m.value = value;
    return m;
  }

  getRtsSshRequest() {
    if (
      this.tag != Anki.Vector.ExternalComms.RtsConnection_4Tag.RtsSshRequest
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_4WithRtsSshRequest(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_4();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_4Tag.RtsSshRequest;
    m.value = value;
    return m;
  }

  getRtsSshResponse() {
    if (
      this.tag != Anki.Vector.ExternalComms.RtsConnection_4Tag.RtsSshResponse
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_4WithRtsSshResponse(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_4();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_4Tag.RtsSshResponse;
    m.value = value;
    return m;
  }

  getRtsOtaCancelRequest() {
    if (
      this.tag !=
      Anki.Vector.ExternalComms.RtsConnection_4Tag.RtsOtaCancelRequest
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_4WithRtsOtaCancelRequest(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_4();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_4Tag.RtsOtaCancelRequest;
    m.value = value;
    return m;
  }

  getRtsLogRequest() {
    if (
      this.tag != Anki.Vector.ExternalComms.RtsConnection_4Tag.RtsLogRequest
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_4WithRtsLogRequest(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_4();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_4Tag.RtsLogRequest;
    m.value = value;
    return m;
  }

  getRtsLogResponse() {
    if (
      this.tag != Anki.Vector.ExternalComms.RtsConnection_4Tag.RtsLogResponse
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_4WithRtsLogResponse(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_4();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_4Tag.RtsLogResponse;
    m.value = value;
    return m;
  }

  getRtsFileDownload() {
    if (
      this.tag != Anki.Vector.ExternalComms.RtsConnection_4Tag.RtsFileDownload
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_4WithRtsFileDownload(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_4();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_4Tag.RtsFileDownload;
    m.value = value;
    return m;
  }

  getRtsWifiForgetRequest() {
    if (
      this.tag !=
      Anki.Vector.ExternalComms.RtsConnection_4Tag.RtsWifiForgetRequest
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_4WithRtsWifiForgetRequest(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_4();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_4Tag.RtsWifiForgetRequest;
    m.value = value;
    return m;
  }

  getRtsWifiForgetResponse() {
    if (
      this.tag !=
      Anki.Vector.ExternalComms.RtsConnection_4Tag.RtsWifiForgetResponse
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_4WithRtsWifiForgetResponse(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_4();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_4Tag.RtsWifiForgetResponse;
    m.value = value;
    return m;
  }

  getRtsCloudSessionRequest() {
    if (
      this.tag !=
      Anki.Vector.ExternalComms.RtsConnection_4Tag.RtsCloudSessionRequest
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_4WithRtsCloudSessionRequest(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_4();
    m._tag =
      Anki.Vector.ExternalComms.RtsConnection_4Tag.RtsCloudSessionRequest;
    m.value = value;
    return m;
  }

  getRtsCloudSessionResponse() {
    if (
      this.tag !=
      Anki.Vector.ExternalComms.RtsConnection_4Tag.RtsCloudSessionResponse
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_4WithRtsCloudSessionResponse(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_4();
    m._tag =
      Anki.Vector.ExternalComms.RtsConnection_4Tag.RtsCloudSessionResponse;
    m.value = value;
    return m;
  }

  getRtsAppConnectionIdRequest() {
    if (
      this.tag !=
      Anki.Vector.ExternalComms.RtsConnection_4Tag.RtsAppConnectionIdRequest
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_4WithRtsAppConnectionIdRequest(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_4();
    m._tag =
      Anki.Vector.ExternalComms.RtsConnection_4Tag.RtsAppConnectionIdRequest;
    m.value = value;
    return m;
  }

  getRtsAppConnectionIdResponse() {
    if (
      this.tag !=
      Anki.Vector.ExternalComms.RtsConnection_4Tag.RtsAppConnectionIdResponse
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_4WithRtsAppConnectionIdResponse(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_4();
    m._tag =
      Anki.Vector.ExternalComms.RtsConnection_4Tag.RtsAppConnectionIdResponse;
    m.value = value;
    return m;
  }

  getRtsResponse() {
    if (this.tag != Anki.Vector.ExternalComms.RtsConnection_4Tag.RtsResponse) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_4WithRtsResponse(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_4();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_4Tag.RtsResponse;
    m.value = value;
    return m;
  }
};

// UNION RtsConnection_5
Anki.Vector.ExternalComms.RtsConnection_5Tag = Object.freeze({
  Error: 0x0,
  RtsConnRequest: 0x1,
  RtsConnResponse: 0x2,
  RtsNonceMessage: 0x3,
  RtsChallengeMessage: 0x4,
  RtsChallengeSuccessMessage: 0x5,
  RtsWifiConnectRequest: 0x6,
  RtsWifiConnectResponse_3: 0x7,
  RtsWifiIpRequest: 0x8,
  RtsWifiIpResponse: 0x9,
  RtsStatusRequest: 0xa,
  RtsStatusResponse_5: 0xb,
  RtsWifiScanRequest: 0xc,
  RtsWifiScanResponse_3: 0xd,
  RtsOtaUpdateRequest: 0xe,
  RtsOtaUpdateResponse: 0xf,
  RtsCancelPairing: 0x10,
  RtsForceDisconnect: 0x11,
  RtsAck: 0x12,
  RtsWifiAccessPointRequest: 0x13,
  RtsWifiAccessPointResponse: 0x14,
  RtsSshRequest: 0x15,
  RtsSshResponse: 0x16,
  RtsOtaCancelRequest: 0x17,
  RtsLogRequest: 0x18,
  RtsLogResponse: 0x19,
  RtsFileDownload: 0x1a,
  RtsWifiForgetRequest: 0x1b,
  RtsWifiForgetResponse: 0x1c,
  RtsCloudSessionRequest_5: 0x1d,
  RtsCloudSessionResponse: 0x1e,
  RtsAppConnectionIdRequest: 0x1f,
  RtsAppConnectionIdResponse: 0x20,
  RtsResponse: 0x21,
  RtsSdkProxyRequest: 0x22,
  RtsSdkProxyResponse: 0x23,
  INVALID: 0xff,
});

Anki.Vector.ExternalComms.RtsConnection_5 = class extends Clad {
  constructor() {
    super();
    this._tag = Anki.Vector.ExternalComms.RtsConnection_5Tag.INVALID;
  }

  get tag() {
    if (this._tag == null) {
      return Anki.Vector.ExternalComms.RtsConnection_5Tag.INVALID;
    }
    return this._tag;
  }

  get size() {
    if (
      this._tag == null ||
      this._tag == Anki.Vector.ExternalComms.RtsConnection_5Tag.INVALID
    ) {
      return 1;
    }
    return 1 + this.value.size;
  }

  pack() {
    if (this._tag == Anki.Vector.ExternalComms.RtsConnection_5Tag.INVALID) {
      return null;
    }
    let buffer = new Uint8Array(this.size);
    // add tag
    buffer.set([this._tag], 0);
    // add message
    buffer.set(this.value.pack(), 1);
    return buffer;
  }

  unpackStructure(tag, buffer) {
    let ret = null;
    switch (tag) {
      case Anki.Vector.ExternalComms.RtsConnection_5Tag.Error:
        ret = new Anki.Vector.ExternalComms.Error();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_5Tag.RtsConnRequest:
        ret = new Anki.Vector.ExternalComms.RtsConnRequest();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_5Tag.RtsConnResponse:
        ret = new Anki.Vector.ExternalComms.RtsConnResponse();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_5Tag.RtsNonceMessage:
        ret = new Anki.Vector.ExternalComms.RtsNonceMessage();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_5Tag.RtsChallengeMessage:
        ret = new Anki.Vector.ExternalComms.RtsChallengeMessage();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_5Tag
        .RtsChallengeSuccessMessage:
        ret = new Anki.Vector.ExternalComms.RtsChallengeSuccessMessage();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_5Tag.RtsWifiConnectRequest:
        ret = new Anki.Vector.ExternalComms.RtsWifiConnectRequest();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_5Tag
        .RtsWifiConnectResponse_3:
        ret = new Anki.Vector.ExternalComms.RtsWifiConnectResponse_3();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_5Tag.RtsWifiIpRequest:
        ret = new Anki.Vector.ExternalComms.RtsWifiIpRequest();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_5Tag.RtsWifiIpResponse:
        ret = new Anki.Vector.ExternalComms.RtsWifiIpResponse();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_5Tag.RtsStatusRequest:
        ret = new Anki.Vector.ExternalComms.RtsStatusRequest();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_5Tag.RtsStatusResponse_5:
        ret = new Anki.Vector.ExternalComms.RtsStatusResponse_5();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_5Tag.RtsWifiScanRequest:
        ret = new Anki.Vector.ExternalComms.RtsWifiScanRequest();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_5Tag.RtsWifiScanResponse_3:
        ret = new Anki.Vector.ExternalComms.RtsWifiScanResponse_3();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_5Tag.RtsOtaUpdateRequest:
        ret = new Anki.Vector.ExternalComms.RtsOtaUpdateRequest();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_5Tag.RtsOtaUpdateResponse:
        ret = new Anki.Vector.ExternalComms.RtsOtaUpdateResponse();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_5Tag.RtsCancelPairing:
        ret = new Anki.Vector.ExternalComms.RtsCancelPairing();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_5Tag.RtsForceDisconnect:
        ret = new Anki.Vector.ExternalComms.RtsForceDisconnect();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_5Tag.RtsAck:
        ret = new Anki.Vector.ExternalComms.RtsAck();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_5Tag
        .RtsWifiAccessPointRequest:
        ret = new Anki.Vector.ExternalComms.RtsWifiAccessPointRequest();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_5Tag
        .RtsWifiAccessPointResponse:
        ret = new Anki.Vector.ExternalComms.RtsWifiAccessPointResponse();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_5Tag.RtsSshRequest:
        ret = new Anki.Vector.ExternalComms.RtsSshRequest();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_5Tag.RtsSshResponse:
        ret = new Anki.Vector.ExternalComms.RtsSshResponse();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_5Tag.RtsOtaCancelRequest:
        ret = new Anki.Vector.ExternalComms.RtsOtaCancelRequest();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_5Tag.RtsLogRequest:
        ret = new Anki.Vector.ExternalComms.RtsLogRequest();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_5Tag.RtsLogResponse:
        ret = new Anki.Vector.ExternalComms.RtsLogResponse();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_5Tag.RtsFileDownload:
        ret = new Anki.Vector.ExternalComms.RtsFileDownload();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_5Tag.RtsWifiForgetRequest:
        ret = new Anki.Vector.ExternalComms.RtsWifiForgetRequest();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_5Tag.RtsWifiForgetResponse:
        ret = new Anki.Vector.ExternalComms.RtsWifiForgetResponse();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_5Tag
        .RtsCloudSessionRequest_5:
        ret = new Anki.Vector.ExternalComms.RtsCloudSessionRequest_5();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_5Tag.RtsCloudSessionResponse:
        ret = new Anki.Vector.ExternalComms.RtsCloudSessionResponse();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_5Tag
        .RtsAppConnectionIdRequest:
        ret = new Anki.Vector.ExternalComms.RtsAppConnectionIdRequest();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_5Tag
        .RtsAppConnectionIdResponse:
        ret = new Anki.Vector.ExternalComms.RtsAppConnectionIdResponse();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_5Tag.RtsResponse:
        ret = new Anki.Vector.ExternalComms.RtsResponse();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_5Tag.RtsSdkProxyRequest:
        ret = new Anki.Vector.ExternalComms.RtsSdkProxyRequest();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_5Tag.RtsSdkProxyResponse:
        ret = new Anki.Vector.ExternalComms.RtsSdkProxyResponse();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      default:
        return ret;
    }
  }

  unpack(buffer) {
    this._tag = Anki.Vector.ExternalComms.RtsConnection_5Tag.INVALID;
    if (buffer.length == 0) {
      // error case
      return null;
    }
    this._tag = buffer[0];
    if (this._tag == Anki.Vector.ExternalComms.RtsConnection_5Tag.INVALID) {
      return null;
    }
    return this.unpackStructure(this._tag, buffer.slice(1));
  }

  string() {
    if (this._tag == null) {
      return "null";
    }
    if (this._tag == Anki.Vector.ExternalComms.RtsConnection_5Tag.INVALID) {
      return "INVALID";
    }
    return JSON.stringify(this);
  }

  getError() {
    if (this.tag != Anki.Vector.ExternalComms.RtsConnection_5Tag.Error) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_5WithError(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_5();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_5Tag.Error;
    m.value = value;
    return m;
  }

  getRtsConnRequest() {
    if (
      this.tag != Anki.Vector.ExternalComms.RtsConnection_5Tag.RtsConnRequest
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_5WithRtsConnRequest(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_5();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_5Tag.RtsConnRequest;
    m.value = value;
    return m;
  }

  getRtsConnResponse() {
    if (
      this.tag != Anki.Vector.ExternalComms.RtsConnection_5Tag.RtsConnResponse
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_5WithRtsConnResponse(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_5();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_5Tag.RtsConnResponse;
    m.value = value;
    return m;
  }

  getRtsNonceMessage() {
    if (
      this.tag != Anki.Vector.ExternalComms.RtsConnection_5Tag.RtsNonceMessage
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_5WithRtsNonceMessage(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_5();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_5Tag.RtsNonceMessage;
    m.value = value;
    return m;
  }

  getRtsChallengeMessage() {
    if (
      this.tag !=
      Anki.Vector.ExternalComms.RtsConnection_5Tag.RtsChallengeMessage
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_5WithRtsChallengeMessage(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_5();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_5Tag.RtsChallengeMessage;
    m.value = value;
    return m;
  }

  getRtsChallengeSuccessMessage() {
    if (
      this.tag !=
      Anki.Vector.ExternalComms.RtsConnection_5Tag.RtsChallengeSuccessMessage
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_5WithRtsChallengeSuccessMessage(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_5();
    m._tag =
      Anki.Vector.ExternalComms.RtsConnection_5Tag.RtsChallengeSuccessMessage;
    m.value = value;
    return m;
  }

  getRtsWifiConnectRequest() {
    if (
      this.tag !=
      Anki.Vector.ExternalComms.RtsConnection_5Tag.RtsWifiConnectRequest
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_5WithRtsWifiConnectRequest(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_5();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_5Tag.RtsWifiConnectRequest;
    m.value = value;
    return m;
  }

  getRtsWifiConnectResponse_3() {
    if (
      this.tag !=
      Anki.Vector.ExternalComms.RtsConnection_5Tag.RtsWifiConnectResponse_3
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_5WithRtsWifiConnectResponse_3(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_5();
    m._tag =
      Anki.Vector.ExternalComms.RtsConnection_5Tag.RtsWifiConnectResponse_3;
    m.value = value;
    return m;
  }

  getRtsWifiIpRequest() {
    if (
      this.tag != Anki.Vector.ExternalComms.RtsConnection_5Tag.RtsWifiIpRequest
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_5WithRtsWifiIpRequest(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_5();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_5Tag.RtsWifiIpRequest;
    m.value = value;
    return m;
  }

  getRtsWifiIpResponse() {
    if (
      this.tag != Anki.Vector.ExternalComms.RtsConnection_5Tag.RtsWifiIpResponse
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_5WithRtsWifiIpResponse(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_5();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_5Tag.RtsWifiIpResponse;
    m.value = value;
    return m;
  }

  getRtsStatusRequest() {
    if (
      this.tag != Anki.Vector.ExternalComms.RtsConnection_5Tag.RtsStatusRequest
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_5WithRtsStatusRequest(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_5();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_5Tag.RtsStatusRequest;
    m.value = value;
    return m;
  }

  getRtsStatusResponse_5() {
    if (
      this.tag !=
      Anki.Vector.ExternalComms.RtsConnection_5Tag.RtsStatusResponse_5
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_5WithRtsStatusResponse_5(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_5();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_5Tag.RtsStatusResponse_5;
    m.value = value;
    return m;
  }

  getRtsWifiScanRequest() {
    if (
      this.tag !=
      Anki.Vector.ExternalComms.RtsConnection_5Tag.RtsWifiScanRequest
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_5WithRtsWifiScanRequest(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_5();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_5Tag.RtsWifiScanRequest;
    m.value = value;
    return m;
  }

  getRtsWifiScanResponse_3() {
    if (
      this.tag !=
      Anki.Vector.ExternalComms.RtsConnection_5Tag.RtsWifiScanResponse_3
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_5WithRtsWifiScanResponse_3(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_5();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_5Tag.RtsWifiScanResponse_3;
    m.value = value;
    return m;
  }

  getRtsOtaUpdateRequest() {
    if (
      this.tag !=
      Anki.Vector.ExternalComms.RtsConnection_5Tag.RtsOtaUpdateRequest
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_5WithRtsOtaUpdateRequest(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_5();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_5Tag.RtsOtaUpdateRequest;
    m.value = value;
    return m;
  }

  getRtsOtaUpdateResponse() {
    if (
      this.tag !=
      Anki.Vector.ExternalComms.RtsConnection_5Tag.RtsOtaUpdateResponse
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_5WithRtsOtaUpdateResponse(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_5();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_5Tag.RtsOtaUpdateResponse;
    m.value = value;
    return m;
  }

  getRtsCancelPairing() {
    if (
      this.tag != Anki.Vector.ExternalComms.RtsConnection_5Tag.RtsCancelPairing
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_5WithRtsCancelPairing(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_5();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_5Tag.RtsCancelPairing;
    m.value = value;
    return m;
  }

  getRtsForceDisconnect() {
    if (
      this.tag !=
      Anki.Vector.ExternalComms.RtsConnection_5Tag.RtsForceDisconnect
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_5WithRtsForceDisconnect(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_5();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_5Tag.RtsForceDisconnect;
    m.value = value;
    return m;
  }

  getRtsAck() {
    if (this.tag != Anki.Vector.ExternalComms.RtsConnection_5Tag.RtsAck) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_5WithRtsAck(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_5();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_5Tag.RtsAck;
    m.value = value;
    return m;
  }

  getRtsWifiAccessPointRequest() {
    if (
      this.tag !=
      Anki.Vector.ExternalComms.RtsConnection_5Tag.RtsWifiAccessPointRequest
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_5WithRtsWifiAccessPointRequest(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_5();
    m._tag =
      Anki.Vector.ExternalComms.RtsConnection_5Tag.RtsWifiAccessPointRequest;
    m.value = value;
    return m;
  }

  getRtsWifiAccessPointResponse() {
    if (
      this.tag !=
      Anki.Vector.ExternalComms.RtsConnection_5Tag.RtsWifiAccessPointResponse
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_5WithRtsWifiAccessPointResponse(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_5();
    m._tag =
      Anki.Vector.ExternalComms.RtsConnection_5Tag.RtsWifiAccessPointResponse;
    m.value = value;
    return m;
  }

  getRtsSshRequest() {
    if (
      this.tag != Anki.Vector.ExternalComms.RtsConnection_5Tag.RtsSshRequest
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_5WithRtsSshRequest(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_5();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_5Tag.RtsSshRequest;
    m.value = value;
    return m;
  }

  getRtsSshResponse() {
    if (
      this.tag != Anki.Vector.ExternalComms.RtsConnection_5Tag.RtsSshResponse
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_5WithRtsSshResponse(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_5();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_5Tag.RtsSshResponse;
    m.value = value;
    return m;
  }

  getRtsOtaCancelRequest() {
    if (
      this.tag !=
      Anki.Vector.ExternalComms.RtsConnection_5Tag.RtsOtaCancelRequest
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_5WithRtsOtaCancelRequest(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_5();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_5Tag.RtsOtaCancelRequest;
    m.value = value;
    return m;
  }

  getRtsLogRequest() {
    if (
      this.tag != Anki.Vector.ExternalComms.RtsConnection_5Tag.RtsLogRequest
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_5WithRtsLogRequest(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_5();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_5Tag.RtsLogRequest;
    m.value = value;
    return m;
  }

  getRtsLogResponse() {
    if (
      this.tag != Anki.Vector.ExternalComms.RtsConnection_5Tag.RtsLogResponse
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_5WithRtsLogResponse(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_5();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_5Tag.RtsLogResponse;
    m.value = value;
    return m;
  }

  getRtsFileDownload() {
    if (
      this.tag != Anki.Vector.ExternalComms.RtsConnection_5Tag.RtsFileDownload
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_5WithRtsFileDownload(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_5();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_5Tag.RtsFileDownload;
    m.value = value;
    return m;
  }

  getRtsWifiForgetRequest() {
    if (
      this.tag !=
      Anki.Vector.ExternalComms.RtsConnection_5Tag.RtsWifiForgetRequest
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_5WithRtsWifiForgetRequest(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_5();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_5Tag.RtsWifiForgetRequest;
    m.value = value;
    return m;
  }

  getRtsWifiForgetResponse() {
    if (
      this.tag !=
      Anki.Vector.ExternalComms.RtsConnection_5Tag.RtsWifiForgetResponse
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_5WithRtsWifiForgetResponse(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_5();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_5Tag.RtsWifiForgetResponse;
    m.value = value;
    return m;
  }

  getRtsCloudSessionRequest_5() {
    if (
      this.tag !=
      Anki.Vector.ExternalComms.RtsConnection_5Tag.RtsCloudSessionRequest_5
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_5WithRtsCloudSessionRequest_5(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_5();
    m._tag =
      Anki.Vector.ExternalComms.RtsConnection_5Tag.RtsCloudSessionRequest_5;
    m.value = value;
    return m;
  }

  getRtsCloudSessionResponse() {
    if (
      this.tag !=
      Anki.Vector.ExternalComms.RtsConnection_5Tag.RtsCloudSessionResponse
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_5WithRtsCloudSessionResponse(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_5();
    m._tag =
      Anki.Vector.ExternalComms.RtsConnection_5Tag.RtsCloudSessionResponse;
    m.value = value;
    return m;
  }

  getRtsAppConnectionIdRequest() {
    if (
      this.tag !=
      Anki.Vector.ExternalComms.RtsConnection_5Tag.RtsAppConnectionIdRequest
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_5WithRtsAppConnectionIdRequest(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_5();
    m._tag =
      Anki.Vector.ExternalComms.RtsConnection_5Tag.RtsAppConnectionIdRequest;
    m.value = value;
    return m;
  }

  getRtsAppConnectionIdResponse() {
    if (
      this.tag !=
      Anki.Vector.ExternalComms.RtsConnection_5Tag.RtsAppConnectionIdResponse
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_5WithRtsAppConnectionIdResponse(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_5();
    m._tag =
      Anki.Vector.ExternalComms.RtsConnection_5Tag.RtsAppConnectionIdResponse;
    m.value = value;
    return m;
  }

  getRtsResponse() {
    if (this.tag != Anki.Vector.ExternalComms.RtsConnection_5Tag.RtsResponse) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_5WithRtsResponse(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_5();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_5Tag.RtsResponse;
    m.value = value;
    return m;
  }

  getRtsSdkProxyRequest() {
    if (
      this.tag !=
      Anki.Vector.ExternalComms.RtsConnection_5Tag.RtsSdkProxyRequest
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_5WithRtsSdkProxyRequest(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_5();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_5Tag.RtsSdkProxyRequest;
    m.value = value;
    return m;
  }

  getRtsSdkProxyResponse() {
    if (
      this.tag !=
      Anki.Vector.ExternalComms.RtsConnection_5Tag.RtsSdkProxyResponse
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_5WithRtsSdkProxyResponse(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_5();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_5Tag.RtsSdkProxyResponse;
    m.value = value;
    return m;
  }
};

// UNION RtsConnection_6
Anki.Vector.ExternalComms.RtsConnection_6Tag = Object.freeze({
  Error: 0x0,
  RtsConnRequest_6: 0x1,
  RtsConnResponse: 0x2,
  RtsNonceMessage: 0x3,
  RtsChallengeMessage: 0x4,
  RtsChallengeSuccessMessage: 0x5,
  RtsWifiConnectRequest: 0x6,
  RtsWifiConnectResponse_3: 0x7,
  RtsWifiIpRequest: 0x8,
  RtsWifiIpResponse: 0x9,
  RtsStatusRequest: 0xa,
  RtsStatusResponse_5: 0xb,
  RtsWifiScanRequest: 0xc,
  RtsWifiScanResponse_3: 0xd,
  RtsOtaUpdateRequest: 0xe,
  RtsOtaUpdateResponse: 0xf,
  RtsCancelPairing: 0x10,
  RtsForceDisconnect: 0x11,
  RtsAck: 0x12,
  RtsWifiAccessPointRequest: 0x13,
  RtsWifiAccessPointResponse: 0x14,
  RtsSshRequest: 0x15,
  RtsSshResponse: 0x16,
  RtsOtaCancelRequest: 0x17,
  RtsLogRequest: 0x18,
  RtsLogResponse: 0x19,
  RtsFileDownload: 0x1a,
  RtsWifiForgetRequest: 0x1b,
  RtsWifiForgetResponse: 0x1c,
  RtsCloudSessionRequest_5: 0x1d,
  RtsCloudSessionResponse: 0x1e,
  RtsAppConnectionIdRequest: 0x1f,
  RtsAppConnectionIdResponse: 0x20,
  RtsResponse: 0x21,
  RtsSdkProxyRequest: 0x22,
  RtsSdkProxyResponse: 0x23,
  RtsVersionListRequest: 0x24,
  RtsVersionListResponse: 0x25,
  RtsBleshConnectRequest: 0x26,
  RtsBleshConnectResponse: 0x27,
  RtsBleshToServerRequest: 0x28,
  RtsBleshToServerResponse: 0x29,
  RtsBleshToClientRequest: 0x2a,
  RtsBleshToClientResponse: 0x2b,
  RtsBleshDisconnectRequest: 0x2c,
  RtsBleshDisconnectResponse: 0x2d,
  INVALID: 0xff,
});

Anki.Vector.ExternalComms.RtsConnection_6 = class extends Clad {
  constructor() {
    super();
    this._tag = Anki.Vector.ExternalComms.RtsConnection_6Tag.INVALID;
  }

  get tag() {
    if (this._tag == null) {
      return Anki.Vector.ExternalComms.RtsConnection_6Tag.INVALID;
    }
    return this._tag;
  }

  get size() {
    if (
      this._tag == null ||
      this._tag == Anki.Vector.ExternalComms.RtsConnection_6Tag.INVALID
    ) {
      return 1;
    }
    return 1 + this.value.size;
  }

  pack() {
    if (this._tag == Anki.Vector.ExternalComms.RtsConnection_6Tag.INVALID) {
      return null;
    }
    let buffer = new Uint8Array(this.size);
    // add tag
    buffer.set([this._tag], 0);
    // add message
    buffer.set(this.value.pack(), 1);
    return buffer;
  }

  unpackStructure(tag, buffer) {
    let ret = null;
    switch (tag) {
      case Anki.Vector.ExternalComms.RtsConnection_6Tag.Error:
        ret = new Anki.Vector.ExternalComms.Error();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsConnRequest_6:
        ret = new Anki.Vector.ExternalComms.RtsConnRequest_6();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsConnResponse:
        ret = new Anki.Vector.ExternalComms.RtsConnResponse();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsNonceMessage:
        ret = new Anki.Vector.ExternalComms.RtsNonceMessage();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsChallengeMessage:
        ret = new Anki.Vector.ExternalComms.RtsChallengeMessage();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_6Tag
        .RtsChallengeSuccessMessage:
        ret = new Anki.Vector.ExternalComms.RtsChallengeSuccessMessage();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsWifiConnectRequest:
        ret = new Anki.Vector.ExternalComms.RtsWifiConnectRequest();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_6Tag
        .RtsWifiConnectResponse_3:
        ret = new Anki.Vector.ExternalComms.RtsWifiConnectResponse_3();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsWifiIpRequest:
        ret = new Anki.Vector.ExternalComms.RtsWifiIpRequest();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsWifiIpResponse:
        ret = new Anki.Vector.ExternalComms.RtsWifiIpResponse();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsStatusRequest:
        ret = new Anki.Vector.ExternalComms.RtsStatusRequest();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsStatusResponse_5:
        ret = new Anki.Vector.ExternalComms.RtsStatusResponse_5();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsWifiScanRequest:
        ret = new Anki.Vector.ExternalComms.RtsWifiScanRequest();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsWifiScanResponse_3:
        ret = new Anki.Vector.ExternalComms.RtsWifiScanResponse_3();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsOtaUpdateRequest:
        ret = new Anki.Vector.ExternalComms.RtsOtaUpdateRequest();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsOtaUpdateResponse:
        ret = new Anki.Vector.ExternalComms.RtsOtaUpdateResponse();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsCancelPairing:
        ret = new Anki.Vector.ExternalComms.RtsCancelPairing();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsForceDisconnect:
        ret = new Anki.Vector.ExternalComms.RtsForceDisconnect();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsAck:
        ret = new Anki.Vector.ExternalComms.RtsAck();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_6Tag
        .RtsWifiAccessPointRequest:
        ret = new Anki.Vector.ExternalComms.RtsWifiAccessPointRequest();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_6Tag
        .RtsWifiAccessPointResponse:
        ret = new Anki.Vector.ExternalComms.RtsWifiAccessPointResponse();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsSshRequest:
        ret = new Anki.Vector.ExternalComms.RtsSshRequest();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsSshResponse:
        ret = new Anki.Vector.ExternalComms.RtsSshResponse();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsOtaCancelRequest:
        ret = new Anki.Vector.ExternalComms.RtsOtaCancelRequest();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsLogRequest:
        ret = new Anki.Vector.ExternalComms.RtsLogRequest();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsLogResponse:
        ret = new Anki.Vector.ExternalComms.RtsLogResponse();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsFileDownload:
        ret = new Anki.Vector.ExternalComms.RtsFileDownload();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsWifiForgetRequest:
        ret = new Anki.Vector.ExternalComms.RtsWifiForgetRequest();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsWifiForgetResponse:
        ret = new Anki.Vector.ExternalComms.RtsWifiForgetResponse();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_6Tag
        .RtsCloudSessionRequest_5:
        ret = new Anki.Vector.ExternalComms.RtsCloudSessionRequest_5();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsCloudSessionResponse:
        ret = new Anki.Vector.ExternalComms.RtsCloudSessionResponse();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_6Tag
        .RtsAppConnectionIdRequest:
        ret = new Anki.Vector.ExternalComms.RtsAppConnectionIdRequest();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_6Tag
        .RtsAppConnectionIdResponse:
        ret = new Anki.Vector.ExternalComms.RtsAppConnectionIdResponse();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsResponse:
        ret = new Anki.Vector.ExternalComms.RtsResponse();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsSdkProxyRequest:
        ret = new Anki.Vector.ExternalComms.RtsSdkProxyRequest();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsSdkProxyResponse:
        ret = new Anki.Vector.ExternalComms.RtsSdkProxyResponse();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsVersionListRequest:
        ret = new Anki.Vector.ExternalComms.RtsVersionListRequest();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsVersionListResponse:
        ret = new Anki.Vector.ExternalComms.RtsVersionListResponse();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsBleshConnectRequest:
        ret = new Anki.Vector.ExternalComms.RtsBleshConnectRequest();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsBleshConnectResponse:
        ret = new Anki.Vector.ExternalComms.RtsBleshConnectResponse();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsBleshToServerRequest:
        ret = new Anki.Vector.ExternalComms.RtsBleshToServerRequest();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_6Tag
        .RtsBleshToServerResponse:
        ret = new Anki.Vector.ExternalComms.RtsBleshToServerResponse();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsBleshToClientRequest:
        ret = new Anki.Vector.ExternalComms.RtsBleshToClientRequest();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_6Tag
        .RtsBleshToClientResponse:
        ret = new Anki.Vector.ExternalComms.RtsBleshToClientResponse();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_6Tag
        .RtsBleshDisconnectRequest:
        ret = new Anki.Vector.ExternalComms.RtsBleshDisconnectRequest();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_6Tag
        .RtsBleshDisconnectResponse:
        ret = new Anki.Vector.ExternalComms.RtsBleshDisconnectResponse();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      default:
        return ret;
    }
  }

  unpack(buffer) {
    this._tag = Anki.Vector.ExternalComms.RtsConnection_6Tag.INVALID;
    if (buffer.length == 0) {
      // error case
      return null;
    }
    this._tag = buffer[0];
    if (this._tag == Anki.Vector.ExternalComms.RtsConnection_6Tag.INVALID) {
      return null;
    }
    return this.unpackStructure(this._tag, buffer.slice(1));
  }

  string() {
    if (this._tag == null) {
      return "null";
    }
    if (this._tag == Anki.Vector.ExternalComms.RtsConnection_6Tag.INVALID) {
      return "INVALID";
    }
    return JSON.stringify(this);
  }

  getError() {
    if (this.tag != Anki.Vector.ExternalComms.RtsConnection_6Tag.Error) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_6WithError(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_6();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_6Tag.Error;
    m.value = value;
    return m;
  }

  getRtsConnRequest_6() {
    if (
      this.tag != Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsConnRequest_6
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_6WithRtsConnRequest_6(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_6();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsConnRequest_6;
    m.value = value;
    return m;
  }

  getRtsConnResponse() {
    if (
      this.tag != Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsConnResponse
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_6WithRtsConnResponse(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_6();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsConnResponse;
    m.value = value;
    return m;
  }

  getRtsNonceMessage() {
    if (
      this.tag != Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsNonceMessage
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_6WithRtsNonceMessage(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_6();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsNonceMessage;
    m.value = value;
    return m;
  }

  getRtsChallengeMessage() {
    if (
      this.tag !=
      Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsChallengeMessage
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_6WithRtsChallengeMessage(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_6();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsChallengeMessage;
    m.value = value;
    return m;
  }

  getRtsChallengeSuccessMessage() {
    if (
      this.tag !=
      Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsChallengeSuccessMessage
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_6WithRtsChallengeSuccessMessage(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_6();
    m._tag =
      Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsChallengeSuccessMessage;
    m.value = value;
    return m;
  }

  getRtsWifiConnectRequest() {
    if (
      this.tag !=
      Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsWifiConnectRequest
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_6WithRtsWifiConnectRequest(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_6();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsWifiConnectRequest;
    m.value = value;
    return m;
  }

  getRtsWifiConnectResponse_3() {
    if (
      this.tag !=
      Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsWifiConnectResponse_3
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_6WithRtsWifiConnectResponse_3(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_6();
    m._tag =
      Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsWifiConnectResponse_3;
    m.value = value;
    return m;
  }

  getRtsWifiIpRequest() {
    if (
      this.tag != Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsWifiIpRequest
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_6WithRtsWifiIpRequest(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_6();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsWifiIpRequest;
    m.value = value;
    return m;
  }

  getRtsWifiIpResponse() {
    if (
      this.tag != Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsWifiIpResponse
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_6WithRtsWifiIpResponse(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_6();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsWifiIpResponse;
    m.value = value;
    return m;
  }

  getRtsStatusRequest() {
    if (
      this.tag != Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsStatusRequest
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_6WithRtsStatusRequest(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_6();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsStatusRequest;
    m.value = value;
    return m;
  }

  getRtsStatusResponse_5() {
    if (
      this.tag !=
      Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsStatusResponse_5
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_6WithRtsStatusResponse_5(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_6();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsStatusResponse_5;
    m.value = value;
    return m;
  }

  getRtsWifiScanRequest() {
    if (
      this.tag !=
      Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsWifiScanRequest
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_6WithRtsWifiScanRequest(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_6();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsWifiScanRequest;
    m.value = value;
    return m;
  }

  getRtsWifiScanResponse_3() {
    if (
      this.tag !=
      Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsWifiScanResponse_3
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_6WithRtsWifiScanResponse_3(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_6();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsWifiScanResponse_3;
    m.value = value;
    return m;
  }

  getRtsOtaUpdateRequest() {
    if (
      this.tag !=
      Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsOtaUpdateRequest
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_6WithRtsOtaUpdateRequest(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_6();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsOtaUpdateRequest;
    m.value = value;
    return m;
  }

  getRtsOtaUpdateResponse() {
    if (
      this.tag !=
      Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsOtaUpdateResponse
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_6WithRtsOtaUpdateResponse(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_6();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsOtaUpdateResponse;
    m.value = value;
    return m;
  }

  getRtsCancelPairing() {
    if (
      this.tag != Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsCancelPairing
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_6WithRtsCancelPairing(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_6();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsCancelPairing;
    m.value = value;
    return m;
  }

  getRtsForceDisconnect() {
    if (
      this.tag !=
      Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsForceDisconnect
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_6WithRtsForceDisconnect(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_6();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsForceDisconnect;
    m.value = value;
    return m;
  }

  getRtsAck() {
    if (this.tag != Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsAck) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_6WithRtsAck(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_6();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsAck;
    m.value = value;
    return m;
  }

  getRtsWifiAccessPointRequest() {
    if (
      this.tag !=
      Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsWifiAccessPointRequest
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_6WithRtsWifiAccessPointRequest(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_6();
    m._tag =
      Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsWifiAccessPointRequest;
    m.value = value;
    return m;
  }

  getRtsWifiAccessPointResponse() {
    if (
      this.tag !=
      Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsWifiAccessPointResponse
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_6WithRtsWifiAccessPointResponse(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_6();
    m._tag =
      Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsWifiAccessPointResponse;
    m.value = value;
    return m;
  }

  getRtsSshRequest() {
    if (
      this.tag != Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsSshRequest
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_6WithRtsSshRequest(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_6();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsSshRequest;
    m.value = value;
    return m;
  }

  getRtsSshResponse() {
    if (
      this.tag != Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsSshResponse
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_6WithRtsSshResponse(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_6();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsSshResponse;
    m.value = value;
    return m;
  }

  getRtsOtaCancelRequest() {
    if (
      this.tag !=
      Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsOtaCancelRequest
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_6WithRtsOtaCancelRequest(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_6();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsOtaCancelRequest;
    m.value = value;
    return m;
  }

  getRtsLogRequest() {
    if (
      this.tag != Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsLogRequest
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_6WithRtsLogRequest(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_6();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsLogRequest;
    m.value = value;
    return m;
  }

  getRtsLogResponse() {
    if (
      this.tag != Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsLogResponse
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_6WithRtsLogResponse(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_6();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsLogResponse;
    m.value = value;
    return m;
  }

  getRtsFileDownload() {
    if (
      this.tag != Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsFileDownload
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_6WithRtsFileDownload(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_6();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsFileDownload;
    m.value = value;
    return m;
  }

  getRtsWifiForgetRequest() {
    if (
      this.tag !=
      Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsWifiForgetRequest
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_6WithRtsWifiForgetRequest(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_6();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsWifiForgetRequest;
    m.value = value;
    return m;
  }

  getRtsWifiForgetResponse() {
    if (
      this.tag !=
      Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsWifiForgetResponse
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_6WithRtsWifiForgetResponse(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_6();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsWifiForgetResponse;
    m.value = value;
    return m;
  }

  getRtsCloudSessionRequest_5() {
    if (
      this.tag !=
      Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsCloudSessionRequest_5
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_6WithRtsCloudSessionRequest_5(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_6();
    m._tag =
      Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsCloudSessionRequest_5;
    m.value = value;
    return m;
  }

  getRtsCloudSessionResponse() {
    if (
      this.tag !=
      Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsCloudSessionResponse
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_6WithRtsCloudSessionResponse(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_6();
    m._tag =
      Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsCloudSessionResponse;
    m.value = value;
    return m;
  }

  getRtsAppConnectionIdRequest() {
    if (
      this.tag !=
      Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsAppConnectionIdRequest
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_6WithRtsAppConnectionIdRequest(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_6();
    m._tag =
      Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsAppConnectionIdRequest;
    m.value = value;
    return m;
  }

  getRtsAppConnectionIdResponse() {
    if (
      this.tag !=
      Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsAppConnectionIdResponse
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_6WithRtsAppConnectionIdResponse(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_6();
    m._tag =
      Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsAppConnectionIdResponse;
    m.value = value;
    return m;
  }

  getRtsResponse() {
    if (this.tag != Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsResponse) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_6WithRtsResponse(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_6();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsResponse;
    m.value = value;
    return m;
  }

  getRtsSdkProxyRequest() {
    if (
      this.tag !=
      Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsSdkProxyRequest
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_6WithRtsSdkProxyRequest(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_6();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsSdkProxyRequest;
    m.value = value;
    return m;
  }

  getRtsSdkProxyResponse() {
    if (
      this.tag !=
      Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsSdkProxyResponse
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_6WithRtsSdkProxyResponse(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_6();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsSdkProxyResponse;
    m.value = value;
    return m;
  }

  getRtsVersionListRequest() {
    if (
      this.tag !=
      Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsVersionListRequest
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_6WithRtsVersionListRequest(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_6();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsVersionListRequest;
    m.value = value;
    return m;
  }

  getRtsVersionListResponse() {
    if (
      this.tag !=
      Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsVersionListResponse
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_6WithRtsVersionListResponse(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_6();
    m._tag =
      Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsVersionListResponse;
    m.value = value;
    return m;
  }

  getRtsBleshConnectRequest() {
    if (
      this.tag !=
      Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsBleshConnectRequest
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_6WithRtsBleshConnectRequest(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_6();
    m._tag =
      Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsBleshConnectRequest;
    m.value = value;
    return m;
  }

  getRtsBleshConnectResponse() {
    if (
      this.tag !=
      Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsBleshConnectResponse
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_6WithRtsBleshConnectResponse(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_6();
    m._tag =
      Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsBleshConnectResponse;
    m.value = value;
    return m;
  }

  getRtsBleshToServerRequest() {
    if (
      this.tag !=
      Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsBleshToServerRequest
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_6WithRtsBleshToServerRequest(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_6();
    m._tag =
      Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsBleshToServerRequest;
    m.value = value;
    return m;
  }

  getRtsBleshToServerResponse() {
    if (
      this.tag !=
      Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsBleshToServerResponse
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_6WithRtsBleshToServerResponse(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_6();
    m._tag =
      Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsBleshToServerResponse;
    m.value = value;
    return m;
  }

  getRtsBleshToClientRequest() {
    if (
      this.tag !=
      Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsBleshToClientRequest
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_6WithRtsBleshToClientRequest(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_6();
    m._tag =
      Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsBleshToClientRequest;
    m.value = value;
    return m;
  }

  getRtsBleshToClientResponse() {
    if (
      this.tag !=
      Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsBleshToClientResponse
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_6WithRtsBleshToClientResponse(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_6();
    m._tag =
      Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsBleshToClientResponse;
    m.value = value;
    return m;
  }

  getRtsBleshDisconnectRequest() {
    if (
      this.tag !=
      Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsBleshDisconnectRequest
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_6WithRtsBleshDisconnectRequest(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_6();
    m._tag =
      Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsBleshDisconnectRequest;
    m.value = value;
    return m;
  }

  getRtsBleshDisconnectResponse() {
    if (
      this.tag !=
      Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsBleshDisconnectResponse
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_6WithRtsBleshDisconnectResponse(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_6();
    m._tag =
      Anki.Vector.ExternalComms.RtsConnection_6Tag.RtsBleshDisconnectResponse;
    m.value = value;
    return m;
  }
};

// UNION RtsConnection_1
Anki.Vector.ExternalComms.RtsConnection_1Tag = Object.freeze({
  Error: 0x0,
  RtsConnRequest: 0x1,
  RtsConnResponse: 0x2,
  RtsNonceMessage: 0x3,
  RtsChallengeMessage: 0x4,
  RtsChallengeSuccessMessage: 0x5,
  RtsWifiConnectRequest: 0x6,
  RtsWifiConnectResponse: 0x7,
  RtsWifiIpRequest: 0x8,
  RtsWifiIpResponse: 0x9,
  RtsStatusRequest: 0xa,
  RtsStatusResponse: 0xb,
  RtsWifiScanRequest: 0xc,
  RtsWifiScanResponse: 0xd,
  RtsOtaUpdateRequest: 0xe,
  RtsOtaUpdateResponse: 0xf,
  RtsCancelPairing: 0x10,
  RtsForceDisconnect: 0x11,
  RtsAck: 0x12,
  RtsWifiAccessPointRequest: 0x13,
  RtsWifiAccessPointResponse: 0x14,
  RtsSshRequest: 0x15,
  RtsSshResponse: 0x16,
  INVALID: 0xff,
});

Anki.Vector.ExternalComms.RtsConnection_1 = class extends Clad {
  constructor() {
    super();
    this._tag = Anki.Vector.ExternalComms.RtsConnection_1Tag.INVALID;
  }

  get tag() {
    if (this._tag == null) {
      return Anki.Vector.ExternalComms.RtsConnection_1Tag.INVALID;
    }
    return this._tag;
  }

  get size() {
    if (
      this._tag == null ||
      this._tag == Anki.Vector.ExternalComms.RtsConnection_1Tag.INVALID
    ) {
      return 1;
    }
    return 1 + this.value.size;
  }

  pack() {
    if (this._tag == Anki.Vector.ExternalComms.RtsConnection_1Tag.INVALID) {
      return null;
    }
    let buffer = new Uint8Array(this.size);
    // add tag
    buffer.set([this._tag], 0);
    // add message
    buffer.set(this.value.pack(), 1);
    return buffer;
  }

  unpackStructure(tag, buffer) {
    let ret = null;
    switch (tag) {
      case Anki.Vector.ExternalComms.RtsConnection_1Tag.Error:
        ret = new Anki.Vector.ExternalComms.Error();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_1Tag.RtsConnRequest:
        ret = new Anki.Vector.ExternalComms.RtsConnRequest();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_1Tag.RtsConnResponse:
        ret = new Anki.Vector.ExternalComms.RtsConnResponse();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_1Tag.RtsNonceMessage:
        ret = new Anki.Vector.ExternalComms.RtsNonceMessage();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_1Tag.RtsChallengeMessage:
        ret = new Anki.Vector.ExternalComms.RtsChallengeMessage();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_1Tag
        .RtsChallengeSuccessMessage:
        ret = new Anki.Vector.ExternalComms.RtsChallengeSuccessMessage();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_1Tag.RtsWifiConnectRequest:
        ret = new Anki.Vector.ExternalComms.RtsWifiConnectRequest();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_1Tag.RtsWifiConnectResponse:
        ret = new Anki.Vector.ExternalComms.RtsWifiConnectResponse();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_1Tag.RtsWifiIpRequest:
        ret = new Anki.Vector.ExternalComms.RtsWifiIpRequest();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_1Tag.RtsWifiIpResponse:
        ret = new Anki.Vector.ExternalComms.RtsWifiIpResponse();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_1Tag.RtsStatusRequest:
        ret = new Anki.Vector.ExternalComms.RtsStatusRequest();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_1Tag.RtsStatusResponse:
        ret = new Anki.Vector.ExternalComms.RtsStatusResponse();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_1Tag.RtsWifiScanRequest:
        ret = new Anki.Vector.ExternalComms.RtsWifiScanRequest();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_1Tag.RtsWifiScanResponse:
        ret = new Anki.Vector.ExternalComms.RtsWifiScanResponse();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_1Tag.RtsOtaUpdateRequest:
        ret = new Anki.Vector.ExternalComms.RtsOtaUpdateRequest();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_1Tag.RtsOtaUpdateResponse:
        ret = new Anki.Vector.ExternalComms.RtsOtaUpdateResponse();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_1Tag.RtsCancelPairing:
        ret = new Anki.Vector.ExternalComms.RtsCancelPairing();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_1Tag.RtsForceDisconnect:
        ret = new Anki.Vector.ExternalComms.RtsForceDisconnect();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_1Tag.RtsAck:
        ret = new Anki.Vector.ExternalComms.RtsAck();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_1Tag
        .RtsWifiAccessPointRequest:
        ret = new Anki.Vector.ExternalComms.RtsWifiAccessPointRequest();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_1Tag
        .RtsWifiAccessPointResponse:
        ret = new Anki.Vector.ExternalComms.RtsWifiAccessPointResponse();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_1Tag.RtsSshRequest:
        ret = new Anki.Vector.ExternalComms.RtsSshRequest();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnection_1Tag.RtsSshResponse:
        ret = new Anki.Vector.ExternalComms.RtsSshResponse();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      default:
        return ret;
    }
  }

  unpack(buffer) {
    this._tag = Anki.Vector.ExternalComms.RtsConnection_1Tag.INVALID;
    if (buffer.length == 0) {
      // error case
      return null;
    }
    this._tag = buffer[0];
    if (this._tag == Anki.Vector.ExternalComms.RtsConnection_1Tag.INVALID) {
      return null;
    }
    return this.unpackStructure(this._tag, buffer.slice(1));
  }

  string() {
    if (this._tag == null) {
      return "null";
    }
    if (this._tag == Anki.Vector.ExternalComms.RtsConnection_1Tag.INVALID) {
      return "INVALID";
    }
    return JSON.stringify(this);
  }

  getError() {
    if (this.tag != Anki.Vector.ExternalComms.RtsConnection_1Tag.Error) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_1WithError(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_1();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_1Tag.Error;
    m.value = value;
    return m;
  }

  getRtsConnRequest() {
    if (
      this.tag != Anki.Vector.ExternalComms.RtsConnection_1Tag.RtsConnRequest
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_1WithRtsConnRequest(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_1();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_1Tag.RtsConnRequest;
    m.value = value;
    return m;
  }

  getRtsConnResponse() {
    if (
      this.tag != Anki.Vector.ExternalComms.RtsConnection_1Tag.RtsConnResponse
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_1WithRtsConnResponse(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_1();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_1Tag.RtsConnResponse;
    m.value = value;
    return m;
  }

  getRtsNonceMessage() {
    if (
      this.tag != Anki.Vector.ExternalComms.RtsConnection_1Tag.RtsNonceMessage
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_1WithRtsNonceMessage(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_1();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_1Tag.RtsNonceMessage;
    m.value = value;
    return m;
  }

  getRtsChallengeMessage() {
    if (
      this.tag !=
      Anki.Vector.ExternalComms.RtsConnection_1Tag.RtsChallengeMessage
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_1WithRtsChallengeMessage(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_1();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_1Tag.RtsChallengeMessage;
    m.value = value;
    return m;
  }

  getRtsChallengeSuccessMessage() {
    if (
      this.tag !=
      Anki.Vector.ExternalComms.RtsConnection_1Tag.RtsChallengeSuccessMessage
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_1WithRtsChallengeSuccessMessage(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_1();
    m._tag =
      Anki.Vector.ExternalComms.RtsConnection_1Tag.RtsChallengeSuccessMessage;
    m.value = value;
    return m;
  }

  getRtsWifiConnectRequest() {
    if (
      this.tag !=
      Anki.Vector.ExternalComms.RtsConnection_1Tag.RtsWifiConnectRequest
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_1WithRtsWifiConnectRequest(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_1();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_1Tag.RtsWifiConnectRequest;
    m.value = value;
    return m;
  }

  getRtsWifiConnectResponse() {
    if (
      this.tag !=
      Anki.Vector.ExternalComms.RtsConnection_1Tag.RtsWifiConnectResponse
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_1WithRtsWifiConnectResponse(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_1();
    m._tag =
      Anki.Vector.ExternalComms.RtsConnection_1Tag.RtsWifiConnectResponse;
    m.value = value;
    return m;
  }

  getRtsWifiIpRequest() {
    if (
      this.tag != Anki.Vector.ExternalComms.RtsConnection_1Tag.RtsWifiIpRequest
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_1WithRtsWifiIpRequest(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_1();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_1Tag.RtsWifiIpRequest;
    m.value = value;
    return m;
  }

  getRtsWifiIpResponse() {
    if (
      this.tag != Anki.Vector.ExternalComms.RtsConnection_1Tag.RtsWifiIpResponse
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_1WithRtsWifiIpResponse(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_1();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_1Tag.RtsWifiIpResponse;
    m.value = value;
    return m;
  }

  getRtsStatusRequest() {
    if (
      this.tag != Anki.Vector.ExternalComms.RtsConnection_1Tag.RtsStatusRequest
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_1WithRtsStatusRequest(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_1();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_1Tag.RtsStatusRequest;
    m.value = value;
    return m;
  }

  getRtsStatusResponse() {
    if (
      this.tag != Anki.Vector.ExternalComms.RtsConnection_1Tag.RtsStatusResponse
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_1WithRtsStatusResponse(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_1();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_1Tag.RtsStatusResponse;
    m.value = value;
    return m;
  }

  getRtsWifiScanRequest() {
    if (
      this.tag !=
      Anki.Vector.ExternalComms.RtsConnection_1Tag.RtsWifiScanRequest
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_1WithRtsWifiScanRequest(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_1();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_1Tag.RtsWifiScanRequest;
    m.value = value;
    return m;
  }

  getRtsWifiScanResponse() {
    if (
      this.tag !=
      Anki.Vector.ExternalComms.RtsConnection_1Tag.RtsWifiScanResponse
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_1WithRtsWifiScanResponse(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_1();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_1Tag.RtsWifiScanResponse;
    m.value = value;
    return m;
  }

  getRtsOtaUpdateRequest() {
    if (
      this.tag !=
      Anki.Vector.ExternalComms.RtsConnection_1Tag.RtsOtaUpdateRequest
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_1WithRtsOtaUpdateRequest(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_1();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_1Tag.RtsOtaUpdateRequest;
    m.value = value;
    return m;
  }

  getRtsOtaUpdateResponse() {
    if (
      this.tag !=
      Anki.Vector.ExternalComms.RtsConnection_1Tag.RtsOtaUpdateResponse
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_1WithRtsOtaUpdateResponse(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_1();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_1Tag.RtsOtaUpdateResponse;
    m.value = value;
    return m;
  }

  getRtsCancelPairing() {
    if (
      this.tag != Anki.Vector.ExternalComms.RtsConnection_1Tag.RtsCancelPairing
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_1WithRtsCancelPairing(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_1();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_1Tag.RtsCancelPairing;
    m.value = value;
    return m;
  }

  getRtsForceDisconnect() {
    if (
      this.tag !=
      Anki.Vector.ExternalComms.RtsConnection_1Tag.RtsForceDisconnect
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_1WithRtsForceDisconnect(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_1();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_1Tag.RtsForceDisconnect;
    m.value = value;
    return m;
  }

  getRtsAck() {
    if (this.tag != Anki.Vector.ExternalComms.RtsConnection_1Tag.RtsAck) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_1WithRtsAck(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_1();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_1Tag.RtsAck;
    m.value = value;
    return m;
  }

  getRtsWifiAccessPointRequest() {
    if (
      this.tag !=
      Anki.Vector.ExternalComms.RtsConnection_1Tag.RtsWifiAccessPointRequest
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_1WithRtsWifiAccessPointRequest(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_1();
    m._tag =
      Anki.Vector.ExternalComms.RtsConnection_1Tag.RtsWifiAccessPointRequest;
    m.value = value;
    return m;
  }

  getRtsWifiAccessPointResponse() {
    if (
      this.tag !=
      Anki.Vector.ExternalComms.RtsConnection_1Tag.RtsWifiAccessPointResponse
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_1WithRtsWifiAccessPointResponse(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_1();
    m._tag =
      Anki.Vector.ExternalComms.RtsConnection_1Tag.RtsWifiAccessPointResponse;
    m.value = value;
    return m;
  }

  getRtsSshRequest() {
    if (
      this.tag != Anki.Vector.ExternalComms.RtsConnection_1Tag.RtsSshRequest
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_1WithRtsSshRequest(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_1();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_1Tag.RtsSshRequest;
    m.value = value;
    return m;
  }

  getRtsSshResponse() {
    if (
      this.tag != Anki.Vector.ExternalComms.RtsConnection_1Tag.RtsSshResponse
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnection_1WithRtsSshResponse(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection_1();
    m._tag = Anki.Vector.ExternalComms.RtsConnection_1Tag.RtsSshResponse;
    m.value = value;
    return m;
  }
};

// UNION RtsConnection
Anki.Vector.ExternalComms.RtsConnectionTag = Object.freeze({
  Error: 0x0,
  RtsConnection_2: 0x2,
  RtsConnection_3: 0x3,
  RtsConnection_4: 0x4,
  RtsConnection_5: 0x5,
  RtsConnection_6: 0x6,
  INVALID: 0xff,
});

Anki.Vector.ExternalComms.RtsConnection = class extends Clad {
  constructor() {
    super();
    this._tag = Anki.Vector.ExternalComms.RtsConnectionTag.INVALID;
  }

  get tag() {
    if (this._tag == null) {
      return Anki.Vector.ExternalComms.RtsConnectionTag.INVALID;
    }
    return this._tag;
  }

  get size() {
    if (
      this._tag == null ||
      this._tag == Anki.Vector.ExternalComms.RtsConnectionTag.INVALID
    ) {
      return 1;
    }
    return 1 + this.value.size;
  }

  pack() {
    if (this._tag == Anki.Vector.ExternalComms.RtsConnectionTag.INVALID) {
      return null;
    }
    let buffer = new Uint8Array(this.size);
    // add tag
    buffer.set([this._tag], 0);
    // add message
    buffer.set(this.value.pack(), 1);
    return buffer;
  }

  unpackStructure(tag, buffer) {
    let ret = null;
    switch (tag) {
      case Anki.Vector.ExternalComms.RtsConnectionTag.Error:
        ret = new Anki.Vector.ExternalComms.Error();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnectionTag.RtsConnection_2:
        ret = new Anki.Vector.ExternalComms.RtsConnection_2();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnectionTag.RtsConnection_3:
        ret = new Anki.Vector.ExternalComms.RtsConnection_3();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnectionTag.RtsConnection_4:
        ret = new Anki.Vector.ExternalComms.RtsConnection_4();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnectionTag.RtsConnection_5:
        ret = new Anki.Vector.ExternalComms.RtsConnection_5();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.RtsConnectionTag.RtsConnection_6:
        ret = new Anki.Vector.ExternalComms.RtsConnection_6();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      default:
        return ret;
    }
  }

  unpack(buffer) {
    this._tag = Anki.Vector.ExternalComms.RtsConnectionTag.INVALID;
    if (buffer.length == 0) {
      // error case
      return null;
    }
    this._tag = buffer[0];
    if (this._tag == Anki.Vector.ExternalComms.RtsConnectionTag.INVALID) {
      return null;
    }
    return this.unpackStructure(this._tag, buffer.slice(1));
  }

  string() {
    if (this._tag == null) {
      return "null";
    }
    if (this._tag == Anki.Vector.ExternalComms.RtsConnectionTag.INVALID) {
      return "INVALID";
    }
    return JSON.stringify(this);
  }

  getError() {
    if (this.tag != Anki.Vector.ExternalComms.RtsConnectionTag.Error) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnectionWithError(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection();
    m._tag = Anki.Vector.ExternalComms.RtsConnectionTag.Error;
    m.value = value;
    return m;
  }

  getRtsConnection_2() {
    if (
      this.tag != Anki.Vector.ExternalComms.RtsConnectionTag.RtsConnection_2
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnectionWithRtsConnection_2(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection();
    m._tag = Anki.Vector.ExternalComms.RtsConnectionTag.RtsConnection_2;
    m.value = value;
    return m;
  }

  getRtsConnection_3() {
    if (
      this.tag != Anki.Vector.ExternalComms.RtsConnectionTag.RtsConnection_3
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnectionWithRtsConnection_3(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection();
    m._tag = Anki.Vector.ExternalComms.RtsConnectionTag.RtsConnection_3;
    m.value = value;
    return m;
  }

  getRtsConnection_4() {
    if (
      this.tag != Anki.Vector.ExternalComms.RtsConnectionTag.RtsConnection_4
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnectionWithRtsConnection_4(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection();
    m._tag = Anki.Vector.ExternalComms.RtsConnectionTag.RtsConnection_4;
    m.value = value;
    return m;
  }

  getRtsConnection_5() {
    if (
      this.tag != Anki.Vector.ExternalComms.RtsConnectionTag.RtsConnection_5
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnectionWithRtsConnection_5(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection();
    m._tag = Anki.Vector.ExternalComms.RtsConnectionTag.RtsConnection_5;
    m.value = value;
    return m;
  }

  getRtsConnection_6() {
    if (
      this.tag != Anki.Vector.ExternalComms.RtsConnectionTag.RtsConnection_6
    ) {
      return null;
    }
    return this.value;
  }

  static NewRtsConnectionWithRtsConnection_6(value) {
    let m = new Anki.Vector.ExternalComms.RtsConnection();
    m._tag = Anki.Vector.ExternalComms.RtsConnectionTag.RtsConnection_6;
    m.value = value;
    return m;
  }
};

// MESSAGE DeprecatedAndReserved
Anki.Vector.ExternalComms.DeprecatedAndReserved = class extends Clad {
  constructor() {
    super();
  }

  type() {
    return "DeprecatedAndReserved";
  }

  get size() {
    return 0;
  }

  unpack(buffer) {
    let cladBuffer = new CladBuffer(buffer);
  }

  pack() {
    let buffer = new Uint8Array(this.size);
    let cladBuffer = new CladBuffer(buffer);

    try {
    } catch {
      return null;
    }
    return cladBuffer.buffer;
  }

  string() {
    return "";
  }
};

// UNION ExternalComms
Anki.Vector.ExternalComms.ExternalCommsTag = Object.freeze({
  Error: 0x0,
  RtsConnection_1: 0x1,
  RtsConnection: 0x4,
  INVALID: 0xff,
});

Anki.Vector.ExternalComms.ExternalComms = class extends Clad {
  constructor() {
    super();
    this._tag = Anki.Vector.ExternalComms.ExternalCommsTag.INVALID;
  }

  get tag() {
    if (this._tag == null) {
      return Anki.Vector.ExternalComms.ExternalCommsTag.INVALID;
    }
    return this._tag;
  }

  get size() {
    if (
      this._tag == null ||
      this._tag == Anki.Vector.ExternalComms.ExternalCommsTag.INVALID
    ) {
      return 1;
    }
    return 1 + this.value.size;
  }

  pack() {
    if (this._tag == Anki.Vector.ExternalComms.ExternalCommsTag.INVALID) {
      return null;
    }
    let buffer = new Uint8Array(this.size);
    // add tag
    buffer.set([this._tag], 0);
    // add message
    buffer.set(this.value.pack(), 1);
    return buffer;
  }

  unpackStructure(tag, buffer) {
    let ret = null;
    switch (tag) {
      case Anki.Vector.ExternalComms.ExternalCommsTag.Error:
        ret = new Anki.Vector.ExternalComms.Error();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.ExternalCommsTag.RtsConnection_1:
        ret = new Anki.Vector.ExternalComms.RtsConnection_1();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      case Anki.Vector.ExternalComms.ExternalCommsTag.RtsConnection:
        ret = new Anki.Vector.ExternalComms.RtsConnection();
        ret.unpack(buffer);
        this.value = ret;
        return ret;
      default:
        return ret;
    }
  }

  unpack(buffer) {
    this._tag = Anki.Vector.ExternalComms.ExternalCommsTag.INVALID;
    if (buffer.length == 0) {
      // error case
      return null;
    }
    this._tag = buffer[0];
    if (this._tag == Anki.Vector.ExternalComms.ExternalCommsTag.INVALID) {
      return null;
    }
    return this.unpackStructure(this._tag, buffer.slice(1));
  }

  string() {
    if (this._tag == null) {
      return "null";
    }
    if (this._tag == Anki.Vector.ExternalComms.ExternalCommsTag.INVALID) {
      return "INVALID";
    }
    return JSON.stringify(this);
  }

  getError() {
    if (this.tag != Anki.Vector.ExternalComms.ExternalCommsTag.Error) {
      return null;
    }
    return this.value;
  }

  static NewExternalCommsWithError(value) {
    let m = new Anki.Vector.ExternalComms.ExternalComms();
    m._tag = Anki.Vector.ExternalComms.ExternalCommsTag.Error;
    m.value = value;
    return m;
  }

  getRtsConnection_1() {
    if (
      this.tag != Anki.Vector.ExternalComms.ExternalCommsTag.RtsConnection_1
    ) {
      return null;
    }
    return this.value;
  }

  static NewExternalCommsWithRtsConnection_1(value) {
    let m = new Anki.Vector.ExternalComms.ExternalComms();
    m._tag = Anki.Vector.ExternalComms.ExternalCommsTag.RtsConnection_1;
    m.value = value;
    return m;
  }

  getRtsConnection() {
    if (this.tag != Anki.Vector.ExternalComms.ExternalCommsTag.RtsConnection) {
      return null;
    }
    return this.value;
  }

  static NewExternalCommsWithRtsConnection(value) {
    let m = new Anki.Vector.ExternalComms.ExternalComms();
    m._tag = Anki.Vector.ExternalComms.ExternalCommsTag.RtsConnection;
    m.value = value;
    return m;
  }
};

module.exports = { Anki };

},{"./clad.js":3}],6:[function(require,module,exports){
/* Copyright (c) 2019-2020 Digital Dream Labs. See LICENSE file for details. */

class RtsCliUtil {
  static msgToStr(msg) {
    let str = "";

    switch (msg.type()) {
      case "RtsWifiScanResponse_3": {
        str = RtsCliUtil.rtsWifiScanResponseStr(msg, 3);
        break;
      }
      case "RtsWifiScanResponse_2": {
        str = RtsCliUtil.rtsWifiScanResponseStr(msg, 2);
        break;
      }
      case "RtsWifiConnectResponse_3": {
        str = RtsCliUtil.rtsWifiConnectResponseStr(msg, 3);
        break;
      }
      case "RtsWifiConnectResponse": {
        str = RtsCliUtil.rtsWifiConnectResponseStr(msg, 2);
        break;
      }
      case "RtsStatusResponse_2": {
        str = RtsCliUtil.rtsStatusResponseStr(msg, 2);
        break;
      }
      case "RtsStatusResponse_4": {
        str = RtsCliUtil.rtsStatusResponseStr(msg, 4);
        break;
      }
      case "RtsStatusResponse_5": {
        str = RtsCliUtil.rtsStatusResponseStr(msg, 5);
        break;
      }
      case "RtsWifiForgetResponse": {
        str = RtsCliUtil.rtsWifiForgetResponseStr(msg);
        break;
      }
      case "RtsWifiAccessPointResponse": {
        str = RtsCliUtil.rtsWifiAccessPointResponseStr(msg);
        break;
      }
      case "RtsWifiIpResponse": {
        str = RtsCliUtil.rtsWifiIpResponseStr(msg);
        break;
      }
      case "RtsCloudSessionResponse": {
        str = RtsCliUtil.rtsCloudSessionResponseStr(msg);
        break;
      }
      case "RtsOtaUpdateResponse": {
        str = RtsCliUtil.rtsOtaUpdateResponseStr(msg);
        break;
      }
      case "RtsSdkProxyResponse": {
        str = RtsCliUtil.rtsSdkProxyResponseStr(msg);
        break;
      }
      case "RtsResponse": {
        str = RtsCliUtil.rtsResponseStr(msg);
        break;
      }
      case "RtsFileDownload": {
        str = "Successfully downloaded logs.";
        break;
      }
      default:
        break;
    }

    return str;
  }

  static padEnd(str, targetLength, padString) {
    str = str + "";
    targetLength = targetLength >> 0; //floor if number or convert non-number to 0;
    padString = String(typeof padString !== "undefined" ? padString : " ");
    if (str.length > targetLength) {
      return String(str);
    } else {
      targetLength = targetLength - str.length;
      if (targetLength > padString.length) {
        padString += padString.repeat(targetLength / padString.length); //append to original to ensure we are longer than needed
      }
      return String(str) + padString.slice(0, targetLength);
    }
  }

  static padStart(str, targetLength, padString) {
    str = str + "";
    targetLength = targetLength >> 0; //truncate if number, or convert non-number to 0;
    padString = String(typeof padString !== "undefined" ? padString : " ");
    if (str.length >= targetLength) {
      return String(str);
    } else {
      targetLength = targetLength - str.length;
      if (targetLength > padString.length) {
        padString += padString.repeat(targetLength / padString.length); //append to original to ensure we are longer than needed
      }
      return padString.slice(0, targetLength) + String(str);
    }
  }

  static replaceAll(base, str1, str2, ignore) {
    return base.replace(
      new RegExp(
        str1.replace(/([\/\,\!\\\^\$\{\}\[\]\(\)\.\*\+\?\|\<\>\-\&])/g, "\\$&"),
        ignore ? "gi" : "g"
      ),
      typeof str2 == "string" ? str2.replace(/\$/g, "$$$$") : str2
    );
  }

  static removeBackspace(str) {
    let hexLine = RtsCliUtil.convertStrToHex(str);
    let hexArr = [];

    for (let i = 0; i < hexLine.length; i += 2) {
      hexArr.push(hexLine.substring(i, i + 2));
    }

    while (hexArr.indexOf("7F") != -1) {
      let idx = hexArr.indexOf("7F");

      hexArr.splice(idx, 1);

      if (idx != 0) {
        hexArr.splice(idx - 1, 1);
      }
    }

    let hexStr = "";
    for (let i = 0; i < hexArr.length; i++) {
      hexStr += hexArr[i];
    }

    return RtsCliUtil.convertHexToStr(hexStr);
  }

  static convertHexToStr(hexString) {
    let ssid = "";

    if (hexString.length % 2 != 0) {
      return null;
    }

    for (let i = 0; i < hexString.length; i += 2) {
      let code = hexString.charAt(i) + hexString.charAt(i + 1);
      try {
        let intFromCode = parseInt("0x" + code);
        if (isNaN(intFromCode)) {
          return null;
        }

        ssid += String.fromCharCode(parseInt("0x" + code));
      } catch {
        return null;
      }
    }

    return ssid;
  }

  static convertStrToHex(str) {
    let hex = "";

    for (let i = 0; i < str.length; i++) {
      hex += RtsCliUtil.padStart(
        str.charCodeAt(i).toString(16).toUpperCase(),
        2,
        "0"
      );
    }

    return hex;
  }

  static rtsWifiScanResponseStr(msg, version) {
    let str = "";

    let statusStr = "";

    switch (msg.statusCode) {
      case 0:
        statusStr = "success";
        break;
      case 100:
        statusStr = "error_getting_proxy";
        break;
      case 101:
        statusStr = "error_scanning";
        break;
      case 102:
        statusStr = "failed_scanning";
        break;
      case 103:
        statusStr = "error_getting_manager";
        break;
      case 104:
        statusStr = "error_getting_services";
        break;
      case 105:
        statusStr = "failed_getting_services";
        break;
      default:
        statusStr = "?";
        break;
    }

    str += `status: ${statusStr}\n`;
    str += `scanned ${msg.scanResult.length} network(s)...\n\n`;

    str += RtsCliUtil.padEnd("Auth", 12, " ");
    str += RtsCliUtil.padEnd("Signal", 6, " ");
    str += RtsCliUtil.padEnd("", 4, " ");
    str += RtsCliUtil.padEnd("", 4, " ");
    str += "SSID\n";

    for (let i = 0; i < msg.scanResult.length; i++) {
      let authType = "";
      let r = msg.scanResult[i];
      switch (r.authType) {
        case 0:
          authType = "none";
          break;
        case 1:
          authType = "WEP";
          break;
        case 2:
          authType = "WEP_SHARED";
          break;
        case 3:
          authType = "IEEE8021X";
          break;
        case 4:
          authType = "WPA_PSK";
          break;
        case 5:
          authType = "WPA_EAP";
          break;
        case 6:
          authType = "WPA2_PSK";
          break;
        case 7:
          authType = "WPA2_EAP";
          break;
      }

      str += RtsCliUtil.padEnd(authType, 12, " ");
      let signalStr = RtsCliUtil.padEnd(r.signalStrength, 6, " ");

      if (version < 3) {
        switch (r.signalStrength) {
          case 0:
          case 1:
            r.signalStrength = 30;
            break;
          case 2:
            r.signalStrength = 70;
            break;
          default:
          case 3:
            r.signalStrength = 100;
            break;
        }
      }

      if (0 <= r.signalStrength && r.signalStrength <= 30) {
        signalStr = "\x1b[91m" + RtsCliUtil.padEnd("#", 6, " ") + "\x1b[0m";
      } else if (30 < r.signalStrength && r.signalStrength <= 70) {
        signalStr = "\x1b[93m" + RtsCliUtil.padEnd("##", 6, " ") + "\x1b[0m";
      } else if (70 < r.signalStrength && r.signalStrength <= 100) {
        signalStr = "\x1b[92m" + RtsCliUtil.padEnd("###", 6, " ") + "\x1b[0m";
      }

      str += signalStr;
      str += RtsCliUtil.padEnd(r.hidden ? "H" : "", 4, " ");

      let p = "";
      if (version >= 3) {
        p = r.provisioned ? "*" : "";
      }
      str += RtsCliUtil.padEnd(p, 4, " ");

      if (r.wifiSsidHex == "hidden") {
        str += "hidden\n";
      } else {
        str += RtsCliUtil.convertHexToStr(r.wifiSsidHex) + "\n";
      }
    }

    return str;
  }

  static rtsWifiConnectResponseStr(msg, version) {
    let str = "";
    let wifiState = "";
    let result = "";

    switch (msg.wifiState) {
      case 0:
        wifiState = "\x1b[91munknown\x1b[0m";
        break;
      case 1:
        wifiState = "\x1b[92monline\x1b[0m";
        break;
      case 2:
        wifiState = "\x1b[93mconnected\x1b[0m";
        break;
      case 3:
        wifiState = "\x1b[91mdisconnected\x1b[0m";
        break;
      default:
        wifiState = "?";
        break;
    }

    str +=
      `WiFi connection:\n` +
      `${RtsCliUtil.padStart("wifi state: ", 14, " ") + wifiState}\n`;

    if (version >= 3) {
      switch (msg.connectResult) {
        case 0:
          result = "success";
          break;
        case 1:
          result = "failure";
          break;
        case 2:
          result = "invalid password";
          break;
        case 255:
          result = "none";
          break;
        default:
          result = "?";
          break;
      }
      str += `${RtsCliUtil.padStart("result: ", 14, " ") + result}\n`;
    }

    return str;
  }

  static rtsStatusResponseStr(msg, version) {
    let str = "";
    let wifiSsid =
      msg.wifiSsidHex != "" ? RtsCliUtil.convertHexToStr(msg.wifiSsidHex) : "";
    let wifiState = "";
    let apStr = msg.accessPoint ? "on" : "off";
    let v = msg.version;
    let otaStr = msg.otaInProgress ? "yes" : "no";
    let esn, ownerStr, cloudAuthed;

    switch (msg.wifiState) {
      case 0:
        wifiState = "\x1b[91munknown";
        break;
      case 1:
        wifiState = "\x1b[92monline";
        break;
      case 2:
        wifiState = "\x1b[93mconnected";
        break;
      case 3:
        wifiState = "\x1b[91mdisconnected";
        break;
      default:
        wifiState = "?";
        break;
    }

    if (version >= 4) {
      esn = msg.esn;
      ownerStr = msg.hasOwner ? "yes" : "no";
    }

    if (version >= 5) {
      cloudAuthed = msg.isCloudAuthed ? "yes" : "no";
    }

    str +=
      `${RtsCliUtil.padStart("ssid: ", 20, " ") + wifiSsid}\n` +
      `${
        RtsCliUtil.padStart("wifi state: ", 20, " ") + wifiState + "\x1b[0m"
      }\n` +
      `${RtsCliUtil.padStart("access point: ", 20, " ") + apStr}\n` +
      `${RtsCliUtil.padStart("build version: ", 20, " ") + v}\n` +
      `${RtsCliUtil.padStart("is ota updating: ", 20, " ") + otaStr}\n`;

    if (version >= 4) {
      str +=
        `${RtsCliUtil.padStart("serial number: ", 20, " ") + esn}\n` +
        `${RtsCliUtil.padStart("has cloud owner: ", 20, " ") + ownerStr}\n`;
    }

    if (version >= 5) {
      str += `${
        RtsCliUtil.padStart("is cloud authed: ", 20, " ") + cloudAuthed
      }\n`;
    }

    return str;
  }

  static rtsWifiIpResponseStr(msg) {
    let str = "";

    if (msg.hasIpV4) {
      // add ipv4
      str += "IPv4: ";

      for (let i = 0; i < 4; i++) {
        str += msg.ipV4[i];
        if (i < 4 - 1) {
          str += ".";
        }
      }
      str += "\n";
    }

    if (msg.hasIpV6) {
      // add ipv6
      str += "IPv6: ";

      for (let i = 0; i < 16; i += 2) {
        str += RtsCliUtil.padStart(msg.ipV6[i].toString(16), 2, "0");
        str += RtsCliUtil.padStart(msg.ipV6[i + 1].toString(16), 2, "0");
        if (i < 16 - 3) {
          str += ":";
        }
      }
      str += "\n";
    }

    return str;
  }

  static rtsCloudSessionResponseStr(msg) {
    let str = "";
    let statusStr = "";

    str += RtsCliUtil.padStart("result: ", 10, " ");

    if (msg.success) {
      str += "\x1b[92msuccessfully authorized\n" + "\x1b[0m";
    } else {
      str += "\x1b[91mfailed to authorize\n" + "\x1b[0m";
    }

    switch (msg.statusCode) {
      case 0:
        statusStr = "UnknownError";
        break;
      case 1:
        statusStr = "ConnectionError";
        break;
      case 2:
        statusStr = "WrongAccount";
        break;
      case 3:
        statusStr = "InvalidSessionToken";
        break;
      case 4:
        statusStr = "AuthorizedAsPrimary";
        break;
      case 5:
        statusStr = "AuthorizedAsSecondary";
        break;
      case 6:
        statusStr = "ReassociatedPrimary";
        break;
    }

    str += RtsCliUtil.padStart("status: ", 10, " ") + statusStr + "\n";
    str += RtsCliUtil.padStart("token: ", 10, " ") + msg.clientTokenGuid + "\n";

    return str;
  }

  static rtsWifiAccessPointResponseStr(msg) {
    let str = "";

    if (msg.ssid == "") {
      str += "AP Disabled";
    } else {
      str += RtsCliUtil.padStart("ssid: ", 15, " ") + msg.ssid + "\n";
      str += RtsCliUtil.padStart("password: ", 15, " ") + msg.password + "\n";
    }

    return str;
  }

  static rtsSdkProxyResponseStr(msg) {
    let str = "";

    str += RtsCliUtil.padStart("messageId: ", 15, " ") + msg.messageId + "\n";
    str += RtsCliUtil.padStart("statusCode: ", 15, " ") + msg.statusCode + "\n";
    str +=
      RtsCliUtil.padStart("responseType: ", 15, " ") + msg.responseType + "\n";
    str +=
      RtsCliUtil.padStart("responseBody: ", 15, " ") + msg.responseBody + "\n";

    return str;
  }

  static rtsWifiForgetResponseStr(msg) {
    let str = "";

    str += "status: " + (msg.didDelete ? "deleted" : "no delete");

    return str;
  }

  static rtsResponseStr(msg) {
    if (msg.code == 0) {
      return 'Error: Not cloud authorized. Do "anki-auth SESSION_TOKEN"';
    }

    return "Unknown error...";
  }

  static rtsOtaUpdateResponseStr(msg) {
    let n = 0;
    if (msg.expected > 0) {
      n = Number(msg.current / msg.expected);
    }
    return `status:${msg.status}\nprogress:${100 * n}% (${msg.current} / ${
      msg.expected
    })`;
  }

  static addTimeout(promise) {
    let timeout = new Promise((resolve, reject) => {
      let t = setTimeout(() => {
        clearTimeout(t);
        reject();
      }, 5000);
    });

    return Promise.race([promise, timeout]);
  }

  static makeId() {
    let ret = "";
    let chars = "abcdefghijklmnopqrstuvwxyz";

    for (let i = 0; i < 24; i++) {
      ret += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return ret;
  }

  static getDateString() {
    let d = new Date(Date.now());
    let year = "" + d.getFullYear();
    let month = ("" + (d.getMonth() + 1)).padStart(2, "0");
    let day = ("" + d.getDate()).padStart(2, "0");
    let hours = ("" + d.getHours()).padStart(2, "0");
    let mins = ("" + d.getMinutes()).padStart(2, "0");
    let secs = ("" + d.getSeconds()).padStart(2, "0");

    return (
      year + "-" + month + "-" + day + "-" + hours + "-" + mins + "-" + secs
    );
  }

  static byteToHexStr(n) {
    let s = n.toString(16).toUpperCase();
    return "0".repeat(2 - s.length) + s;
  }

  static keyToHexStr(arr) {
    let str = "";
    for (let i = 0; i < arr.length; i++) {
      str += RtsCliUtil.byteToHexStr(arr[i]);
    }
    return str;
  }

  static printHelp(args) {
    let keys = Object.keys(args);
    let p = "";
    for (let i = 0; i < keys.length; i++) {
      p += keys[i] + " ".repeat(24 - keys[i].length) + args[keys[i]].des + "\n";
      p += " ".repeat(24) + args[keys[i]].help + "\n\n";
    }

    return p;
  }
}

module.exports = { RtsCliUtil };

},{}],7:[function(require,module,exports){
/* Copyright (c) 2019-2020 Digital Dream Labs. See LICENSE file for details. */

var { RtsCliUtil } = require("./rtsCliUtil.js");
var { Anki } = require("./messageExternalComms.js");

if (!Rts) {
  var Rts = Anki.Vector.ExternalComms;
}

class RtsV2Handler {
  constructor(vectorBle, sodium, sessions) {
    this.vectorBle = vectorBle;
    this.vectorBle.onReceive(this);
    this.sodium = sodium;
    this.sessions = sessions;
    this.encrypted = false;
    this.keysAuthorized = false;
    this.waitForResponse = "";
    this.promiseKeys = {};

    // remembered state
    this.wifiScanResults = {};
    this.otaProgress = {};
    this.logId = 0;
    this.logFile = [];
    this.isReading = false;
    this.cryptoKeys = {};
    this.firstTimePair = true;
    this.hasProgressBar = false;
    this.helpArgs = {};
    this.connRequestHandle = null;

    // events
    this.onEncryptedConnectionEvent = [];
    this.onReadyForPinEvent = [];
    this.onOtaProgressEvent = [];
    this.onLogProgressEvent = [];
    this.onCliResponseEvent = [];
    this.onPrintEvent = [];
    this.onCommandDoneEvent = [];
    this.onNewProgressBarEvent = [];
    this.onUpdateProgressBarEvent = [];
    this.onLogsDownloadedEvent = [];

    this.setCliHelp();
  }

  onReadyForPin(fnc) {
    this.onReadyForPinEvent.push(fnc);
  }

  onOtaProgress(fnc) {
    this.onOtaProgressEvent.push(fnc);
  }

  onLogProgress(fnc) {
    this.onLogProgressEvent.push(fnc);
  }

  onEncryptedConnection(fnc) {
    this.onEncryptedConnectionEvent.push(fnc);
  }

  onCliResponse(fnc) {
    this.onCliResponseEvent.push(fnc);
  }

  onPrint(fnc) {
    this.onPrintEvent.push(fnc);
  }

  onCommandDone(fnc) {
    this.onCommandDoneEvent.push(fnc);
  }

  onNewProgressBar(fnc) {
    this.onNewProgressBarEvent.push(fnc);
  }

  onUpdateProgressBar(fnc) {
    this.onUpdateProgressBarEvent.push(fnc);
  }

  onLogsDownloaded(fnc) {
    this.onLogsDownloadedEvent.push(fnc);
  }

  enterPin(pin) {
    let clientKeys = this.sodium.crypto_kx_client_session_keys(
      this.keys.publicKey,
      this.keys.privateKey,
      this.remoteKeys.publicKey
    );
    let sharedRx = this.sodium.crypto_generichash(32, clientKeys.sharedRx, pin);
    let sharedTx = this.sodium.crypto_generichash(32, clientKeys.sharedTx, pin);

    this.cryptoKeys.decrypt = sharedRx;
    this.cryptoKeys.encrypt = sharedTx;

    this.send(
      Rts.RtsConnection_2.NewRtsConnection_2WithRtsAck(
        new Rts.RtsAck(Rts.RtsConnection_2Tag.RtsNonceMessage)
      )
    );

    this.encrypted = true;
  }

  cleanup() {
    this.vectorBle.onReceiveUnsubscribe(this);
  }

  send(rtsConn2) {
    let rtsConn = Rts.RtsConnection.NewRtsConnectionWithRtsConnection_2(
      rtsConn2
    );
    let extResponse = Rts.ExternalComms.NewExternalCommsWithRtsConnection(
      rtsConn
    );

    let data = extResponse.pack();

    if (this.encrypted) {
      data = this.encrypt(data);
    }

    let packet = Array.from(data); // todo: Buffer.from
    this.vectorBle.send(packet);
  }

  receive(data) {
    if (this.encrypted) {
      data = this.decrypt(data);
    }

    if (data == null) {
      return;
    }

    if (data[0] == 1 && data.length == 5) {
      // data is handshake so we should bail
      this.cancelConnection();
      return;
    }

    let comms = new Rts.ExternalComms();
    comms.unpack(data);

    if (comms.tag == Rts.ExternalCommsTag.RtsConnection) {
      switch (comms.value.tag) {
        case Rts.RtsConnectionTag.RtsConnection_2: {
          let rtsMsg = comms.value.value;

          switch (rtsMsg.tag) {
            case Rts.RtsConnection_2Tag.RtsConnRequest:
              this.onRtsConnRequest(rtsMsg.value);
              break;
            case Rts.RtsConnection_2Tag.RtsNonceMessage:
              this.onRtsNonceMessage(rtsMsg.value);
              break;
            case Rts.RtsConnection_2Tag.RtsChallengeMessage:
              this.onRtsChallengeMessage(rtsMsg.value);
              break;
            case Rts.RtsConnection_2Tag.RtsChallengeSuccessMessage:
              this.onRtsChallengeSuccessMessage(rtsMsg.value);
              break;

            // Post-connection messages
            case Rts.RtsConnection_2Tag.RtsWifiScanResponse_2:
              this.resolvePromise("wifi-scan", rtsMsg);
              break;
            case Rts.RtsConnection_2Tag.RtsWifiConnectResponse:
              this.resolvePromise("wifi-connect", rtsMsg);
              break;
            case Rts.RtsConnection_2Tag.RtsStatusResponse_2:
              this.resolvePromise("status", rtsMsg);
              break;
            case Rts.RtsConnection_2Tag.RtsWifiForgetResponse:
              this.resolvePromise("wifi-forget", rtsMsg);
              break;
            case Rts.RtsConnection_2Tag.RtsWifiAccessPointResponse:
              this.resolvePromise("wifi-ap", rtsMsg);
              break;
            case Rts.RtsConnection_2Tag.RtsWifiIpResponse:
              this.resolvePromise("wifi-ip", rtsMsg);
              break;
            case Rts.RtsConnection_2Tag.RtsOtaUpdateResponse:
              this.otaProgress["value"] = rtsMsg.value;

              for (let i = 0; i < this.onOtaProgressEvent.length; i++) {
                this.onOtaProgressEvent[i](rtsMsg.value);
              }

              if (this.hasProgressBar) {
                for (let i = 0; i < this.onUpdateProgressBarEvent.length; i++) {
                  this.onUpdateProgressBarEvent[i](
                    Number(rtsMsg.value.current),
                    Number(rtsMsg.value.expected)
                  );
                }
              }

              if (this.waitForResponse == "ota-start") {
                if (rtsMsg.value.status == 3) {
                  this.resolvePromise(this.waitForResponse, rtsMsg);
                } else if (rtsMsg.value.status >= 5) {
                  this.rejectPromise(this.waitForResponse, rtsMsg);
                }
              } else if (this.waitForResponse == "ota-cancel") {
                if (rtsMsg.value.status != 2) {
                  this.resolvePromise(this.waitForResponse, rtsMsg);
                }
              }
              break;
            case Rts.RtsConnection_2Tag.RtsResponse:
              this.rejectPromise(this.waitForResponse, rtsMsg);
              break;
            case Rts.RtsConnection_2Tag.RtsLogResponse:
              if (rtsMsg.value.exitCode == 0) {
                this.logId = rtsMsg.value.fileId;
                this.logFile = [];
              } else {
                // todo: error case
              }
              break;
            case Rts.RtsConnection_2Tag.RtsFileDownload:
              let chunk = rtsMsg.value;
              if (chunk.fileId == this.logId) {
                this.logFile = this.logFile.concat(chunk.fileChunk);

                for (let i = 0; i < this.onLogProgressEvent.length; i++) {
                  this.onLogProgressEvent[i](rtsMsg.value);
                }

                if (this.hasProgressBar) {
                  for (
                    let i = 0;
                    i < this.onUpdateProgressBarEvent.length;
                    i++
                  ) {
                    this.onUpdateProgressBarEvent[i](
                      chunk.packetNumber,
                      chunk.packetTotal
                    );
                  }
                }

                if (chunk.packetNumber == chunk.packetTotal) {
                  // resolve promise
                  let fileName =
                    "vector-logs-" + RtsCliUtil.getDateString() + ".tar.bz2";
                  for (let i = 0; i < this.onLogsDownloadedEvent.length; i++) {
                    this.onLogsDownloadedEvent[i](fileName, this.logFile);
                  }

                  this.resolvePromise("logs", rtsMsg);
                }
              }
              break;
            default:
              break;
          }
          break;
        }
        default:
          break;
      }
    }
  }

  encrypt(data) {
    let txt = new Uint8Array(data);
    let nonce = new Uint8Array(this.nonces.encrypt);

    let cipher = this.sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(
      txt,
      null,
      null,
      nonce,
      this.cryptoKeys.encrypt
    );

    this.sodium.increment(this.nonces.encrypt);
    return cipher;
  }

  decrypt(cipher) {
    let c = new Uint8Array(cipher);
    let nonce = new Uint8Array(this.nonces.decrypt);

    let data = null;

    try {
      data = this.sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(
        null,
        c,
        null,
        nonce,
        this.cryptoKeys.decrypt
      );

      this.sodium.increment(this.nonces.decrypt);
    } catch (e) {
      console.log("error decrypting");
      this.sessions.deleteSession(this.remoteKeys.publicKey);
      this.sessions.save();
    }

    return data;
  }

  onRtsConnRequest(msg) {
    this.remoteKeys = {};
    this.remoteKeys.publicKey = msg.publicKey;

    let savedSession = this.sessions.getSession(this.remoteKeys.publicKey);

    if (savedSession != null) {
      this.keys = this.sessions.getKeys();
      this.cryptoKeys = { encrypt: savedSession.tx, decrypt: savedSession.rx };
      this.firstTimePair = false;

      // use saved session
      this.send(
        Rts.RtsConnection_5.NewRtsConnection_5WithRtsConnResponse(
          new Rts.RtsConnResponse(
            Rts.RtsConnType.Reconnection,
            this.keys.publicKey
          )
        )
      );
    } else if (
      this.remoteKeys.publicKey.toString() in this.vectorBle.sessions
    ) {
      let session = this.vectorBle.sessions[
        this.remoteKeys.publicKey.toString()
      ];
      this.keys = session.myKeys;
      this.cryptoKeys = session.cryptoKeys;
      this.firstTimePair = false;

      // use saved session
      this.send(
        Rts.RtsConnection_2.NewRtsConnection_2WithRtsConnResponse(
          new Rts.RtsConnResponse(
            Rts.RtsConnType.Reconnection,
            this.keys.publicKey
          )
        )
      );
    } else {
      // generate keys
      this.keys = this.sodium.crypto_kx_keypair();
      let self = this;
      this.connRequestHandle = setTimeout(function () {
        self.cancelConnection();
      }, 3000);
      this.send(
        Rts.RtsConnection_2.NewRtsConnection_2WithRtsConnResponse(
          new Rts.RtsConnResponse(
            Rts.RtsConnType.FirstTimePair,
            this.keys.publicKey
          )
        )
      );
    }
  }

  cancelConnection() {
    let msg =
      "\x1b[91mPairing failed. Double press robot button and try again. You may need to do 'ble-clear'.\x1b[0m";
    for (let i = 0; i < this.onPrintEvent.length; i++) {
      this.onPrintEvent[i](msg);
    }
    this.vectorBle.tryDisconnect();
    for (let i = 0; i < this.onCommandDoneEvent.length; i++) {
      this.onCommandDoneEvent[i]();
    }
  }

  onRtsNonceMessage(msg) {
    if (this.connRequestHandle != null) {
      clearTimeout(this.connRequestHandle);
      this.connRequestHandle = null;
    }
    this.nonces = {};

    this.nonces.decrypt = msg.toDeviceNonce;
    this.nonces.encrypt = msg.toRobotNonce;

    if (!this.firstTimePair) {
      // No need to enter pin
      this.send(
        Rts.RtsConnection_2.NewRtsConnection_2WithRtsAck(
          new Rts.RtsAck(Rts.RtsConnection_2Tag.RtsNonceMessage)
        )
      );

      this.encrypted = true;
      return;
    }

    for (let i = 0; i < this.onReadyForPinEvent.length; i++) {
      this.onReadyForPinEvent[i](this);
    }
  }

  onRtsChallengeMessage(msg) {
    this.send(
      Rts.RtsConnection_2.NewRtsConnection_2WithRtsChallengeMessage(
        new Rts.RtsChallengeMessage(msg.number + 1)
      )
    );
  }

  onRtsChallengeSuccessMessage(msg) {
    this.keysAuthorized = true;
    this.vectorBle.sessions[this.remoteKeys.publicKey.toString()] = {
      cryptoKeys: this.cryptoKeys,
      myKeys: this.keys,
    };

    // successfully received rtsChallengeSuccessMessage
    for (let i = 0; i < this.onEncryptedConnectionEvent.length; i++) {
      this.onEncryptedConnectionEvent[i](this);
    }
  }

  storePromiseMethods(str, resolve, reject) {
    this.promiseKeys[str] = {};
    this.promiseKeys[str].resolve = resolve;
    this.promiseKeys[str].reject = reject;
  }

  resolvePromise(str, msg) {
    if (this.promiseKeys[str] != null) {
      this.promiseKeys[str].resolve(msg);
      this.promiseKeys[str] = null;
    }
  }

  rejectPromise(str, msg) {
    if (this.promiseKeys[str] != null) {
      this.promiseKeys[str].reject(msg);
      this.promiseKeys[str] = null;
    }
  }

  cliResolve(msg) {
    let output = "";

    if (msg == null) {
      output = "Request timed out.";
    } else {
      output = RtsCliUtil.msgToStr(msg.value);
    }

    for (let i = 0; i < this.onCliResponseEvent.length; i++) {
      this.onCliResponseEvent[i](output);
    }

    this.waitForResponse = "";
  }

  //
  // <!-- API Promises
  //

  doWifiScan() {
    let self = this;
    let p = new Promise(function (resolve, reject) {
      self.storePromiseMethods("wifi-scan", resolve, reject);
      self.send(
        Rts.RtsConnection_2.NewRtsConnection_2WithRtsWifiScanRequest(
          new Rts.RtsWifiScanRequest()
        )
      );
    });

    return p;
  }

  doWifiConnect(ssid, password, auth, timeout) {
    let self = this;
    let p = new Promise(function (resolve, reject) {
      self.storePromiseMethods("wifi-connect", resolve, reject);
      self.send(
        Rts.RtsConnection_2.NewRtsConnection_2WithRtsWifiConnectRequest(
          new Rts.RtsWifiConnectRequest(
            RtsCliUtil.convertStrToHex(ssid),
            password,
            timeout,
            auth,
            false
          )
        )
      );
    });

    return p;
  }

  doWifiForget(ssid) {
    let self = this;
    let p = new Promise(function (resolve, reject) {
      self.storePromiseMethods("wifi-forget", resolve, reject);
      let deleteAll = ssid == "!all";
      let hexSsid = deleteAll ? "" : RtsCliUtil.convertStrToHex(ssid);
      self.send(
        Rts.RtsConnection_2.NewRtsConnection_2WithRtsWifiForgetRequest(
          new Rts.RtsWifiForgetRequest(deleteAll, hexSsid)
        )
      );
    });

    return p;
  }

  doWifiAp(enable) {
    let self = this;
    let p = new Promise(function (resolve, reject) {
      self.storePromiseMethods("wifi-ap", resolve, reject);
      self.send(
        Rts.RtsConnection_2.NewRtsConnection_2WithRtsWifiAccessPointRequest(
          new Rts.RtsWifiAccessPointRequest(enable.toLowerCase() == "true")
        )
      );
    });

    return p;
  }

  doWifiIp() {
    let self = this;
    let p = new Promise(function (resolve, reject) {
      self.storePromiseMethods("wifi-ip", resolve, reject);
      self.send(
        Rts.RtsConnection_2.NewRtsConnection_2WithRtsWifiIpRequest(
          new Rts.RtsWifiIpRequest()
        )
      );
    });

    return p;
  }

  doStatus() {
    let self = this;
    let p = new Promise(function (resolve, reject) {
      self.storePromiseMethods("status", resolve, reject);
      self.send(
        Rts.RtsConnection_2.NewRtsConnection_2WithRtsStatusRequest(
          new Rts.RtsStatusRequest()
        )
      );
    });

    return RtsCliUtil.addTimeout(p);
  }

  doOtaStart(url) {
    let self = this;
    let p = new Promise(function (resolve, reject) {
      self.storePromiseMethods("ota-start", resolve, reject);
      self.send(
        Rts.RtsConnection_2.NewRtsConnection_2WithRtsOtaUpdateRequest(
          new Rts.RtsOtaUpdateRequest(url)
        )
      );
    });

    return p;
  }

  doOtaCancel(url) {
    let self = this;
    let p = new Promise(function (resolve, reject) {
      self.storePromiseMethods("ota-cancel", resolve, reject);
      self.send(
        Rts.RtsConnection_2.NewRtsConnection_2WithRtsOtaCancelRequest(
          new Rts.RtsOtaCancelRequest(url)
        )
      );
    });

    return p;
  }

  doLog() {
    let self = this;
    let p = new Promise(function (resolve, reject) {
      self.storePromiseMethods("logs", resolve, reject);
      self.send(
        Rts.RtsConnection_2.NewRtsConnection_2WithRtsLogRequest(
          new Rts.RtsLogRequest(0, [])
        )
      );
    });

    return p;
  }

  requireArgs(args, num) {
    if (args.length < num) {
      console.log(
        '"' + args[0] + '" command requires ' + (num - 1) + " arguments"
      );
      return false;
    }

    return true;
  }

  //
  // API Promises -->
  //
  setCliHelp() {
    let helpArgs = {
      "wifi-connect": {
        args: 2,
        des: "Connect Vector to a WiFi network.",
        help: "wifi-connect {ssid} {password}",
      },
      "wifi-scan": {
        args: 0,
        des: "Get WiFi networks that Vector can scan.",
        help: "wifi-scan",
      },
      "wifi-ip": {
        args: 0,
        des: "Get Vector's WiFi IPv4/IPv6 addresses.",
        help: "wifi-ip",
      },
      "wifi-ap": {
        args: 1,
        des: "Enable/Disable Vector as a WiFi access point.",
        help: "wifi-ap {true|false}",
      },
      "wifi-forget": {
        args: 1,
        des: "Forget a WiFi network, or optionally all of them.",
        help: "wifi-forget {ssid|!all}",
      },
      "ota-start": {
        args: 1,
        des: "Tell Vector to start an OTA update with the given URL.",
        help: "ota-start {url}",
      },
      "ota-progress": {
        args: 0,
        des: "Get the current OTA progress.",
        help: "ota-progress",
      },
      "ota-cancel": {
        args: 0,
        des: "Cancel an OTA in progress.",
        help: "ota-cancel",
      },
      logs: {
        args: 0,
        des: "Download logs over BLE from Vector.",
        help: "logs",
      },
      status: {
        args: 0,
        des: "Get status information from Vector.",
        help: "status",
      },
      "anki-auth": {
        args: 1,
        des: "Provision Vector with Anki account.",
        help: "anki-auth {session_token}",
      },
      "connection-id": {
        args: 1,
        des: "Give Vector a DAS/analytics id for this BLE session.",
        help: "connection-id {id}",
      },
      sdk: {
        args: 3,
        des: "Send an SDK request over BLE.",
        help: "sdk {path} {json} {client_app_guid}",
      },
    };

    this.helpArgs = helpArgs;

    return helpArgs;
  }

  // returns whether resolved immediately
  handleCli(args) {
    let self = this;
    let cmd = args[0];
    let r = function (msg) {
      self.cliResolve(msg);
    };
    let output = "";

    switch (cmd) {
      case "quit":
      case "exit":
        self.vectorBle.tryDisconnect();
        return false;
      case "help":
        output = RtsCliUtil.printHelp(self.helpArgs);
        for (let i = 0; i < this.onPrintEvent.length; i++) {
          this.onPrintEvent[i](output);
        }
        break;
      case "wifi-scan":
        self.waitForResponse = "wifi-scan";
        self.doWifiScan().then(function (msg) {
          self.wifiScanResults = msg.value.scanResult;
          self.cliResolve(msg);
        }, r);
        break;
      case "wifi-connect":
        if (!self.requireArgs(args, 3)) break;

        self.waitForResponse = "wifi-connect";

        let ssid = args[1];
        let hasScanned = false;
        let result = null;

        for (let i = 0; i < self.wifiScanResults.length; i++) {
          let r = self.wifiScanResults[i];

          if (ssid == RtsCliUtil.convertHexToStr(r.wifiSsidHex)) {
            result = r;
            hasScanned = true;
            break;
          }
        }

        self
          .doWifiConnect(ssid, args[2], hasScanned ? result.authType : 6, 15)
          .then(function (msg) {
            self.cliResolve(msg);
          }, r);

        break;
      case "status":
        self.waitForResponse = "status";
        self.doStatus().then(function (msg) {
          self.cliResolve(msg);
        }, r);
        break;
      case "wifi-ip":
        self.waitForResponse = "wifi-ip";
        self.doWifiIp().then(function (msg) {
          self.cliResolve(msg);
        }, r);
        break;
      case "wifi-forget":
        if (!self.requireArgs(args, 2)) break;

        self.waitForResponse = "wifi-forget";
        self.doWifiForget(args[1]).then(function (msg) {
          self.cliResolve(msg);
        }, r);
        break;
      case "wifi-ap":
        if (!self.requireArgs(args, 2)) break;

        self.waitForResponse = "wifi-ap";
        self.doWifiAp(args[1]).then(function (msg) {
          self.cliResolve(msg);
        }, r);
        break;
      case "anki-auth":
        if (!self.requireArgs(args, 2)) break;

        self.waitForResponse = "anki-auth";
        self.doAnkiAuth(args[1]).then(function (msg) {
          self.cliResolve(msg);
        }, r);
        break;
      case "ota-start":
        if (!self.requireArgs(args, 2)) break;

        self.waitForResponse = "ota-start";
        self.hasProgressBar = true;
        output = "Updating robot with OTA from " + args[1];
        for (let i = 0; i < this.onPrintEvent.length; i++) {
          this.onPrintEvent[i](output);
        }
        for (let i = 0; i < this.onNewProgressBarEvent.length; i++) {
          this.onNewProgressBarEvent[i]();
        }

        self.doOtaStart(args[1]).then(function (msg) {
          self.otaProgress.value = msg.value;
          self.hasProgressBar = false;
          self.cliResolve(msg);
        }, r);
        break;
      case "ota-cancel":
        self.waitForResponse = "ota-cancel";
        self.doOtaCancel().then(function (msg) {
          self.otaProgress.value = msg.value;
          self.cliResolve(msg);
        }, r);
        break;
      case "ota-progress":
        if (self.otaProgress.value != null) {
          console.log(
            RtsCliUtil.rtsOtaUpdateResponseStr(self.otaProgress.value)
          );
        }

        break;
      case "logs":
        console.log(
          "downloading logs over BLE will probably take about 30 seconds..."
        );
        self.waitForResponse = "logs";
        self.hasProgressBar = true;
        output = "Downloading logs...";
        for (let i = 0; i < this.onPrintEvent.length; i++) {
          this.onPrintEvent[i](output);
        }
        for (let i = 0; i < this.onNewProgressBarEvent.length; i++) {
          this.onNewProgressBarEvent[i]();
        }

        self.doLog().then(function (msg) {
          self.hasProgressBar = false;
          self.cliResolve(msg);
        }, r);
        break;
      default:
        self.waitForResponse = "";
        break;
    }

    if (self.waitForResponse == "") {
      return true;
    }

    return false;
  }
}

module.exports = { RtsV2Handler };

},{"./messageExternalComms.js":5,"./rtsCliUtil.js":6}],8:[function(require,module,exports){
/* Copyright (c) 2019-2020 Digital Dream Labs. See LICENSE file for details. */

var { RtsCliUtil } = require("./rtsCliUtil.js");
var { Anki } = require("./messageExternalComms.js");

if (!Rts) {
  var Rts = Anki.Vector.ExternalComms;
}

class RtsV3Handler {
  constructor(vectorBle, sodium, sessions) {
    this.vectorBle = vectorBle;
    this.vectorBle.onReceive(this);
    this.sodium = sodium;
    this.sessions = sessions;
    this.encrypted = false;
    this.keysAuthorized = false;
    this.waitForResponse = "";
    this.promiseKeys = {};

    // remembered state
    this.wifiScanResults = {};
    this.otaProgress = {};
    this.logId = 0;
    this.logFile = [];
    this.isReading = false;
    this.cryptoKeys = {};
    this.firstTimePair = true;
    this.hasProgressBar = false;
    this.helpArgs = {};
    this.connRequestHandle = null;

    // events
    this.onEncryptedConnectionEvent = [];
    this.onReadyForPinEvent = [];
    this.onOtaProgressEvent = [];
    this.onLogProgressEvent = [];
    this.onCliResponseEvent = [];
    this.onCloudAuthorizedEvent = [];
    this.onPrintEvent = [];
    this.onCommandDoneEvent = [];
    this.onNewProgressBarEvent = [];
    this.onUpdateProgressBarEvent = [];
    this.onLogsDownloadedEvent = [];

    this.setCliHelp();
  }

  onReadyForPin(fnc) {
    this.onReadyForPinEvent.push(fnc);
  }

  onOtaProgress(fnc) {
    this.onOtaProgressEvent.push(fnc);
  }

  onLogProgress(fnc) {
    this.onLogProgressEvent.push(fnc);
  }

  onEncryptedConnection(fnc) {
    this.onEncryptedConnectionEvent.push(fnc);
  }

  onCloudAuthorized(fnc) {
    this.onCloudAuthorizedEvent.push(fnc);
  }

  onCliResponse(fnc) {
    this.onCliResponseEvent.push(fnc);
  }

  onPrint(fnc) {
    this.onPrintEvent.push(fnc);
  }

  onCommandDone(fnc) {
    this.onCommandDoneEvent.push(fnc);
  }

  onNewProgressBar(fnc) {
    this.onNewProgressBarEvent.push(fnc);
  }

  onUpdateProgressBar(fnc) {
    this.onUpdateProgressBarEvent.push(fnc);
  }

  onLogsDownloaded(fnc) {
    this.onLogsDownloadedEvent.push(fnc);
  }

  enterPin(pin) {
    let clientKeys = this.sodium.crypto_kx_client_session_keys(
      this.keys.publicKey,
      this.keys.privateKey,
      this.remoteKeys.publicKey
    );
    let sharedRx = this.sodium.crypto_generichash(32, clientKeys.sharedRx, pin);
    let sharedTx = this.sodium.crypto_generichash(32, clientKeys.sharedTx, pin);

    this.cryptoKeys.decrypt = sharedRx;
    this.cryptoKeys.encrypt = sharedTx;

    this.send(
      Rts.RtsConnection_3.NewRtsConnection_3WithRtsAck(
        new Rts.RtsAck(Rts.RtsConnection_3Tag.RtsNonceMessage)
      )
    );

    this.encrypted = true;
  }

  cleanup() {
    this.vectorBle.onReceiveUnsubscribe(this);
  }

  send(rtsConn3) {
    let rtsConn = Rts.RtsConnection.NewRtsConnectionWithRtsConnection_3(
      rtsConn3
    );
    let extResponse = Rts.ExternalComms.NewExternalCommsWithRtsConnection(
      rtsConn
    );

    let data = extResponse.pack();

    if (this.encrypted) {
      data = this.encrypt(data);
    }

    let packet = Array.from(data); // todo: Buffer.from
    this.vectorBle.send(packet);
  }

  receive(data) {
    if (this.encrypted) {
      data = this.decrypt(data);
    }

    if (data == null) {
      return;
    }

    if (data[0] == 1 && data.length == 5) {
      // data is handshake so we should bail
      this.cancelConnection();
      return;
    }

    let comms = new Rts.ExternalComms();
    comms.unpack(data);

    if (comms.tag == Rts.ExternalCommsTag.RtsConnection) {
      switch (comms.value.tag) {
        case Rts.RtsConnectionTag.RtsConnection_3: {
          let rtsMsg = comms.value.value;

          switch (rtsMsg.tag) {
            case Rts.RtsConnection_3Tag.RtsConnRequest:
              this.onRtsConnRequest(rtsMsg.value);
              break;
            case Rts.RtsConnection_3Tag.RtsNonceMessage:
              this.onRtsNonceMessage(rtsMsg.value);
              break;
            case Rts.RtsConnection_3Tag.RtsChallengeMessage:
              this.onRtsChallengeMessage(rtsMsg.value);
              break;
            case Rts.RtsConnection_3Tag.RtsChallengeSuccessMessage:
              this.onRtsChallengeSuccessMessage(rtsMsg.value);
              break;

            // Post-connection messages
            case Rts.RtsConnection_3Tag.RtsWifiScanResponse_3:
              this.resolvePromise("wifi-scan", rtsMsg);
              break;
            case Rts.RtsConnection_3Tag.RtsWifiConnectResponse_3:
              this.resolvePromise("wifi-connect", rtsMsg);
              break;
            case Rts.RtsConnection_3Tag.RtsStatusResponse_3:
              this.resolvePromise("status", rtsMsg);
              break;
            case Rts.RtsConnection_3Tag.RtsWifiForgetResponse:
              this.resolvePromise("wifi-forget", rtsMsg);
              break;
            case Rts.RtsConnection_3Tag.RtsWifiAccessPointResponse:
              this.resolvePromise("wifi-ap", rtsMsg);
              break;
            case Rts.RtsConnection_3Tag.RtsWifiIpResponse:
              this.resolvePromise("wifi-ip", rtsMsg);
              break;
            case Rts.RtsConnection_3Tag.RtsCloudSessionResponse:
              for (let i = 0; i < this.onCloudAuthorizedEvent.length; i++) {
                this.onCloudAuthorizedEvent[i](rtsMsg.value);
              }

              this.resolvePromise("anki-auth", rtsMsg);
              break;
            case Rts.RtsConnection_3Tag.RtsOtaUpdateResponse:
              this.otaProgress["value"] = rtsMsg.value;

              for (let i = 0; i < this.onOtaProgressEvent.length; i++) {
                this.onOtaProgressEvent[i](rtsMsg.value);
              }

              if (this.hasProgressBar) {
                for (let i = 0; i < this.onUpdateProgressBarEvent.length; i++) {
                  this.onUpdateProgressBarEvent[i](
                    Number(rtsMsg.value.current),
                    Number(rtsMsg.value.expected)
                  );
                }
              }

              if (this.waitForResponse == "ota-start") {
                if (rtsMsg.status == 3) {
                  this.resolvePromise(this.waitForResponse, rtsMsg);
                } else if (rtsMsg.status >= 5) {
                  this.rejectPromise(this.waitForResponse, rtsMsg);
                }
              } else if (this.waitForResponse == "ota-cancel") {
                if (rtsMsg.status != 2) {
                  this.resolvePromise(this.waitForResponse, rtsMsg);
                }
              }
              break;
            case Rts.RtsConnection_3Tag.RtsResponse:
              this.rejectPromise(this.waitForResponse, rtsMsg);
              break;
            case Rts.RtsConnection_3Tag.RtsSdkProxyResponse:
              this.resolvePromise("sdk", rtsMsg);
              break;
            case Rts.RtsConnection_3Tag.RtsAppConnectionIdResponse:
              this.resolvePromise("connection-id", rtsMsg);
              break;
            case Rts.RtsConnection_3Tag.RtsLogResponse:
              if (rtsMsg.value.exitCode == 0) {
                this.logId = rtsMsg.value.fileId;
                this.logFile = [];
              } else {
                // todo: error case
              }
              break;
            case Rts.RtsConnection_3Tag.RtsFileDownload:
              let chunk = rtsMsg.value;
              if (chunk.fileId == this.logId) {
                this.logFile = this.logFile.concat(chunk.fileChunk);

                for (let i = 0; i < this.onLogProgressEvent.length; i++) {
                  this.onLogProgressEvent[i](rtsMsg.value);
                }

                if (this.hasProgressBar) {
                  for (
                    let i = 0;
                    i < this.onUpdateProgressBarEvent.length;
                    i++
                  ) {
                    this.onUpdateProgressBarEvent[i](
                      chunk.packetNumber,
                      chunk.packetTotal
                    );
                  }
                }

                if (chunk.packetNumber == chunk.packetTotal) {
                  // resolve promise
                  let fileName =
                    "vector-logs-" + RtsCliUtil.getDateString() + ".tar.bz2";
                  for (let i = 0; i < this.onLogsDownloadedEvent.length; i++) {
                    this.onLogsDownloadedEvent[i](fileName, this.logFile);
                  }

                  this.resolvePromise("logs", rtsMsg);
                }
              }
              break;
            default:
              break;
          }
          break;
        }
        default:
          break;
      }
    }
  }

  encrypt(data) {
    let txt = new Uint8Array(data);
    let nonce = new Uint8Array(this.nonces.encrypt);

    let cipher = this.sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(
      txt,
      null,
      null,
      nonce,
      this.cryptoKeys.encrypt
    );

    this.sodium.increment(this.nonces.encrypt);
    return cipher;
  }

  decrypt(cipher) {
    let c = new Uint8Array(cipher);
    let nonce = new Uint8Array(this.nonces.decrypt);

    let data = null;

    try {
      data = this.sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(
        null,
        c,
        null,
        nonce,
        this.cryptoKeys.decrypt
      );

      this.sodium.increment(this.nonces.decrypt);
    } catch (e) {
      console.log("error decrypting");
      this.sessions.deleteSession(this.remoteKeys.publicKey);
      this.sessions.save();
    }

    return data;
  }

  onRtsConnRequest(msg) {
    this.remoteKeys = {};
    this.remoteKeys.publicKey = msg.publicKey;

    let savedSession = this.sessions.getSession(this.remoteKeys.publicKey);

    if (savedSession != null) {
      this.keys = this.sessions.getKeys();
      this.cryptoKeys = { encrypt: savedSession.tx, decrypt: savedSession.rx };
      this.firstTimePair = false;

      // use saved session
      this.send(
        Rts.RtsConnection_3.NewRtsConnection_3WithRtsConnResponse(
          new Rts.RtsConnResponse(
            Rts.RtsConnType.Reconnection,
            this.keys.publicKey
          )
        )
      );
    } else if (
      this.remoteKeys.publicKey.toString() in this.vectorBle.sessions
    ) {
      let session = this.vectorBle.sessions[
        this.remoteKeys.publicKey.toString()
      ];
      this.keys = session.myKeys;
      this.cryptoKeys = session.cryptoKeys;
      this.firstTimePair = false;

      // use saved session
      this.send(
        Rts.RtsConnection_3.NewRtsConnection_3WithRtsConnResponse(
          new Rts.RtsConnResponse(
            Rts.RtsConnType.Reconnection,
            this.keys.publicKey
          )
        )
      );
    } else {
      // generate keys
      this.keys = this.sodium.crypto_kx_keypair();
      let self = this;
      this.connRequestHandle = setTimeout(function () {
        self.cancelConnection();
      }, 3000);
      this.send(
        Rts.RtsConnection_3.NewRtsConnection_3WithRtsConnResponse(
          new Rts.RtsConnResponse(
            Rts.RtsConnType.FirstTimePair,
            this.keys.publicKey
          )
        )
      );
    }
  }

  cancelConnection() {
    let msg =
      "\x1b[91mPairing failed. Double press robot button and try again. You may need to do 'ble-clear'.\x1b[0m";
    for (let i = 0; i < this.onPrintEvent.length; i++) {
      this.onPrintEvent[i](msg);
    }
    this.vectorBle.tryDisconnect();
    for (let i = 0; i < this.onCommandDoneEvent.length; i++) {
      this.onCommandDoneEvent[i]();
    }
  }

  onRtsNonceMessage(msg) {
    if (this.connRequestHandle != null) {
      clearTimeout(this.connRequestHandle);
      this.connRequestHandle = null;
    }
    this.nonces = {};

    this.nonces.decrypt = msg.toDeviceNonce;
    this.nonces.encrypt = msg.toRobotNonce;

    if (!this.firstTimePair) {
      // No need to enter pin
      this.send(
        Rts.RtsConnection_3.NewRtsConnection_3WithRtsAck(
          new Rts.RtsAck(Rts.RtsConnection_3Tag.RtsNonceMessage)
        )
      );

      this.encrypted = true;
      return;
    }

    for (let i = 0; i < this.onReadyForPinEvent.length; i++) {
      this.onReadyForPinEvent[i](this);
    }
  }

  onRtsChallengeMessage(msg) {
    this.send(
      Rts.RtsConnection_3.NewRtsConnection_3WithRtsChallengeMessage(
        new Rts.RtsChallengeMessage(msg.number + 1)
      )
    );
  }

  onRtsChallengeSuccessMessage(msg) {
    this.keysAuthorized = true;
    this.vectorBle.sessions[this.remoteKeys.publicKey.toString()] = {
      cryptoKeys: this.cryptoKeys,
      myKeys: this.keys,
    };

    // successfully received rtsChallengeSuccessMessage
    for (let i = 0; i < this.onEncryptedConnectionEvent.length; i++) {
      this.onEncryptedConnectionEvent[i](this);
    }
  }

  storePromiseMethods(str, resolve, reject) {
    this.promiseKeys[str] = {};
    this.promiseKeys[str].resolve = resolve;
    this.promiseKeys[str].reject = reject;
  }

  resolvePromise(str, msg) {
    if (this.promiseKeys[str] != null) {
      this.promiseKeys[str].resolve(msg);
      this.promiseKeys[str] = null;
    }
  }

  rejectPromise(str, msg) {
    if (this.promiseKeys[str] != null) {
      this.promiseKeys[str].reject(msg);
      this.promiseKeys[str] = null;
    }
  }

  cliResolve(msg) {
    let output = "";

    if (msg == null) {
      output = "Request timed out.";
    } else {
      output = RtsCliUtil.msgToStr(msg.value);
    }

    for (let i = 0; i < this.onCliResponseEvent.length; i++) {
      this.onCliResponseEvent[i](output);
    }

    this.waitForResponse = "";
  }

  //
  // <!-- API Promises
  //

  doWifiScan() {
    let self = this;
    let p = new Promise(function (resolve, reject) {
      self.storePromiseMethods("wifi-scan", resolve, reject);
      self.send(
        Rts.RtsConnection_3.NewRtsConnection_3WithRtsWifiScanRequest(
          new Rts.RtsWifiScanRequest()
        )
      );
    });

    return p;
  }

  doWifiConnect(ssid, password, auth, timeout) {
    let self = this;
    let p = new Promise(function (resolve, reject) {
      self.storePromiseMethods("wifi-connect", resolve, reject);
      self.send(
        Rts.RtsConnection_3.NewRtsConnection_3WithRtsWifiConnectRequest(
          new Rts.RtsWifiConnectRequest(
            RtsCliUtil.convertStrToHex(ssid),
            password,
            timeout,
            auth,
            false
          )
        )
      );
    });

    return p;
  }

  doWifiForget(ssid) {
    let self = this;
    let p = new Promise(function (resolve, reject) {
      self.storePromiseMethods("wifi-forget", resolve, reject);
      let deleteAll = ssid == "!all";
      let hexSsid = deleteAll ? "" : RtsCliUtil.convertStrToHex(ssid);
      self.send(
        Rts.RtsConnection_3.NewRtsConnection_3WithRtsWifiForgetRequest(
          new Rts.RtsWifiForgetRequest(deleteAll, hexSsid)
        )
      );
    });

    return p;
  }

  doWifiAp(enable) {
    let self = this;
    let p = new Promise(function (resolve, reject) {
      self.storePromiseMethods("wifi-ap", resolve, reject);
      self.send(
        Rts.RtsConnection_3.NewRtsConnection_3WithRtsWifiAccessPointRequest(
          new Rts.RtsWifiAccessPointRequest(enable.toLowerCase() == "true")
        )
      );
    });

    return p;
  }

  doWifiIp() {
    let self = this;
    let p = new Promise(function (resolve, reject) {
      self.storePromiseMethods("wifi-ip", resolve, reject);
      self.send(
        Rts.RtsConnection_3.NewRtsConnection_3WithRtsWifiIpRequest(
          new Rts.RtsWifiIpRequest()
        )
      );
    });

    return p;
  }

  doStatus() {
    let self = this;
    let p = new Promise(function (resolve, reject) {
      self.storePromiseMethods("status", resolve, reject);
      self.send(
        Rts.RtsConnection_3.NewRtsConnection_3WithRtsStatusRequest(
          new Rts.RtsStatusRequest()
        )
      );
    });

    return RtsCliUtil.addTimeout(p);
  }

  doAnkiAuth(sessionToken) {
    let self = this;
    let p = new Promise(function (resolve, reject) {
      self.storePromiseMethods("anki-auth", resolve, reject);
      self.send(
        Rts.RtsConnection_3.NewRtsConnection_3WithRtsCloudSessionRequest(
          new Rts.RtsCloudSessionRequest(sessionToken)
        )
      );
    });

    return p;
  }

  doOtaStart(url) {
    let self = this;
    let p = new Promise(function (resolve, reject) {
      self.storePromiseMethods("ota-start", resolve, reject);
      self.send(
        Rts.RtsConnection_3.NewRtsConnection_3WithRtsOtaUpdateRequest(
          new Rts.RtsOtaUpdateRequest(url)
        )
      );
    });

    return p;
  }

  doOtaCancel(url) {
    let self = this;
    let p = new Promise(function (resolve, reject) {
      self.storePromiseMethods("ota-cancel", resolve, reject);
      self.send(
        Rts.RtsConnection_3.NewRtsConnection_3WithRtsOtaCancelRequest(
          new Rts.RtsOtaCancelRequest(url)
        )
      );
    });

    return p;
  }

  doConnectionId() {
    let self = this;
    let p = new Promise(function (resolve, reject) {
      self.storePromiseMethods("connection-id", resolve, reject);
      self.send(
        Rts.RtsConnection_3.NewRtsConnection_3WithRtsAppConnectionIdRequest(
          new Rts.RtsAppConnectionIdRequest(url)
        )
      );
    });

    return p;
  }

  doLog() {
    let self = this;
    let p = new Promise(function (resolve, reject) {
      self.storePromiseMethods("logs", resolve, reject);
      self.send(
        Rts.RtsConnection_3.NewRtsConnection_3WithRtsLogRequest(
          new Rts.RtsLogRequest(0, [])
        )
      );
    });

    return p;
  }

  requireArgs(args, num) {
    if (args.length < num) {
      console.log(
        '"' + args[0] + '" command requires ' + (num - 1) + " arguments"
      );
      return false;
    }

    return true;
  }

  //
  // API Promises -->
  //
  setCliHelp() {
    let helpArgs = {
      "wifi-connect": {
        args: 2,
        des: "Connect Vector to a WiFi network.",
        help: "wifi-connect {ssid} {password}",
      },
      "wifi-scan": {
        args: 0,
        des: "Get WiFi networks that Vector can scan.",
        help: "wifi-scan",
      },
      "wifi-ip": {
        args: 0,
        des: "Get Vector's WiFi IPv4/IPv6 addresses.",
        help: "wifi-ip",
      },
      "wifi-ap": {
        args: 1,
        des: "Enable/Disable Vector as a WiFi access point.",
        help: "wifi-ap {true|false}",
      },
      "wifi-forget": {
        args: 1,
        des: "Forget a WiFi network, or optionally all of them.",
        help: "wifi-forget {ssid|!all}",
      },
      "ota-start": {
        args: 1,
        des: "Tell Vector to start an OTA update with the given URL.",
        help: "ota-start {url}",
      },
      "ota-progress": {
        args: 0,
        des: "Get the current OTA progress.",
        help: "ota-progress",
      },
      "ota-cancel": {
        args: 0,
        des: "Cancel an OTA in progress.",
        help: "ota-cancel",
      },
      logs: {
        args: 0,
        des: "Download logs over BLE from Vector.",
        help: "logs",
      },
      status: {
        args: 0,
        des: "Get status information from Vector.",
        help: "status",
      },
      "anki-auth": {
        args: 1,
        des: "Provision Vector with Anki account.",
        help: "anki-auth {session_token}",
      },
      "connection-id": {
        args: 1,
        des: "Give Vector a DAS/analytics id for this BLE session.",
        help: "connection-id {id}",
      },
      sdk: {
        args: 3,
        des: "Send an SDK request over BLE.",
        help: "sdk {path} {json} {client_app_guid}",
      },
    };

    this.helpArgs = helpArgs;

    return helpArgs;
  }

  handleCli(args) {
    let self = this;
    let cmd = args[0];
    let r = function (msg) {
      self.cliResolve(msg);
    };
    let output = "";

    switch (cmd) {
      case "quit":
      case "exit":
        self.vectorBle.tryDisconnect();
        return false;
      case "help":
        output = RtsCliUtil.printHelp(self.helpArgs);
        for (let i = 0; i < this.onPrintEvent.length; i++) {
          this.onPrintEvent[i](output);
        }
        break;
      case "wifi-scan":
        self.waitForResponse = "wifi-scan";
        self.doWifiScan().then(function (msg) {
          self.wifiScanResults = msg.value.scanResult;
          self.cliResolve(msg);
        }, r);
        break;
      case "wifi-connect":
        if (!self.requireArgs(args, 3)) break;

        self.waitForResponse = "wifi-connect";

        let ssid = args[1];
        let hasScanned = false;
        let result = null;

        for (let i = 0; i < self.wifiScanResults.length; i++) {
          let r = self.wifiScanResults[i];

          if (ssid == RtsCliUtil.convertHexToStr(r.wifiSsidHex)) {
            result = r;
            hasScanned = true;
            break;
          }
        }

        self
          .doWifiConnect(ssid, args[2], hasScanned ? result.authType : 6, 15)
          .then(function (msg) {
            self.cliResolve(msg);
          }, r);

        break;
      case "status":
        self.waitForResponse = "status";
        self.doStatus().then(function (msg) {
          self.cliResolve(msg);
        }, r);
        break;
      case "wifi-ip":
        self.waitForResponse = "wifi-ip";
        self.doWifiIp().then(function (msg) {
          self.cliResolve(msg);
        }, r);
        break;
      case "wifi-forget":
        if (!self.requireArgs(args, 2)) break;

        self.waitForResponse = "wifi-forget";
        self.doWifiForget(args[1]).then(function (msg) {
          self.cliResolve(msg);
        }, r);
        break;
      case "wifi-ap":
        if (!self.requireArgs(args, 2)) break;

        self.waitForResponse = "wifi-ap";
        self.doWifiAp(args[1]).then(function (msg) {
          self.cliResolve(msg);
        }, r);
        break;
      case "anki-auth":
        if (!self.requireArgs(args, 2)) break;

        self.waitForResponse = "anki-auth";
        self.doAnkiAuth(args[1]).then(function (msg) {
          self.cliResolve(msg);
        }, r);
        break;
      case "ota-start":
        if (!self.requireArgs(args, 2)) break;

        self.waitForResponse = "ota-start";
        self.hasProgressBar = true;
        output = "Updating robot with OTA from " + args[1];
        for (let i = 0; i < this.onPrintEvent.length; i++) {
          this.onPrintEvent[i](output);
        }
        for (let i = 0; i < this.onNewProgressBarEvent.length; i++) {
          this.onNewProgressBarEvent[i]();
        }

        self.doOtaStart(args[1]).then(function (msg) {
          self.otaProgress.value = msg.value;
          self.hasProgressBar = false;
          self.cliResolve(msg);
        }, r);
        break;
      case "ota-cancel":
        self.waitForResponse = "ota-cancel";
        self.doOtaCancel().then(function (msg) {
          self.otaProgress.value = msg.value;
          self.cliResolve(msg);
        }, r);
        break;
      case "ota-progress":
        if (self.otaProgress.value != null) {
          console.log(
            RtsCliUtil.rtsOtaUpdateResponseStr(self.otaProgress.value)
          );
        }

        break;
      case "connection-id":
        if (!self.requireArgs(args, 2)) break;

        self.waitForResponse = "connection-id";
        self.doConnectionId().then(function (msg) {
          self.cliResolve(msg);
        }, r);
        break;
      case "logs":
        console.log(
          "downloading logs over BLE will probably take about 30 seconds..."
        );
        self.waitForResponse = "logs";
        self.hasProgressBar = true;
        output = "Downloading logs...";
        for (let i = 0; i < this.onPrintEvent.length; i++) {
          this.onPrintEvent[i](output);
        }
        for (let i = 0; i < this.onNewProgressBarEvent.length; i++) {
          this.onNewProgressBarEvent[i]();
        }

        self.doLog().then(function (msg) {
          self.hasProgressBar = false;
          self.cliResolve(msg);
        }, r);
        break;
      default:
        self.waitForResponse = "";
        break;
    }

    if (self.waitForResponse == "") {
      return true;
    }

    return false;
  }
}

module.exports = { RtsV3Handler };

},{"./messageExternalComms.js":5,"./rtsCliUtil.js":6}],9:[function(require,module,exports){
/* Copyright (c) 2019-2020 Digital Dream Labs. See LICENSE file for details. */

var { RtsCliUtil } = require("./rtsCliUtil.js");
var { Anki } = require("./messageExternalComms.js");

if (!Rts) {
  var Rts = Anki.Vector.ExternalComms;
}

class RtsV4Handler {
  constructor(vectorBle, sodium, sessions) {
    this.vectorBle = vectorBle;
    this.vectorBle.onReceive(this);
    this.sodium = sodium;
    this.sessions = sessions;
    this.encrypted = false;
    this.keysAuthorized = false;
    this.waitForResponse = "";
    this.promiseKeys = {};

    // remembered state
    this.wifiScanResults = {};
    this.otaProgress = {};
    this.logId = 0;
    this.logFile = [];
    this.isReading = false;
    this.cryptoKeys = {};
    this.firstTimePair = true;
    this.hasProgressBar = false;
    this.helpArgs = {};
    this.connRequestHandle = null;

    // events
    this.onEncryptedConnectionEvent = [];
    this.onReadyForPinEvent = [];
    this.onOtaProgressEvent = [];
    this.onLogProgressEvent = [];
    this.onCliResponseEvent = [];
    this.onCloudAuthorizedEvent = [];
    this.onPrintEvent = [];
    this.onCommandDoneEvent = [];
    this.onNewProgressBarEvent = [];
    this.onUpdateProgressBarEvent = [];
    this.onLogsDownloadedEvent = [];

    this.setCliHelp();
  }

  onReadyForPin(fnc) {
    this.onReadyForPinEvent.push(fnc);
  }

  onOtaProgress(fnc) {
    this.onOtaProgressEvent.push(fnc);
  }

  onLogProgress(fnc) {
    this.onLogProgressEvent.push(fnc);
  }

  onEncryptedConnection(fnc) {
    this.onEncryptedConnectionEvent.push(fnc);
  }

  onCloudAuthorized(fnc) {
    this.onCloudAuthorizedEvent.push(fnc);
  }

  onCliResponse(fnc) {
    this.onCliResponseEvent.push(fnc);
  }

  onPrint(fnc) {
    this.onPrintEvent.push(fnc);
  }

  onCommandDone(fnc) {
    this.onCommandDoneEvent.push(fnc);
  }

  onNewProgressBar(fnc) {
    this.onNewProgressBarEvent.push(fnc);
  }

  onUpdateProgressBar(fnc) {
    this.onUpdateProgressBarEvent.push(fnc);
  }

  onLogsDownloaded(fnc) {
    this.onLogsDownloadedEvent.push(fnc);
  }

  enterPin(pin) {
    let clientKeys = this.sodium.crypto_kx_client_session_keys(
      this.keys.publicKey,
      this.keys.privateKey,
      this.remoteKeys.publicKey
    );
    let sharedRx = this.sodium.crypto_generichash(32, clientKeys.sharedRx, pin);
    let sharedTx = this.sodium.crypto_generichash(32, clientKeys.sharedTx, pin);

    this.cryptoKeys.decrypt = sharedRx;
    this.cryptoKeys.encrypt = sharedTx;

    this.send(
      Rts.RtsConnection_4.NewRtsConnection_4WithRtsAck(
        new Rts.RtsAck(Rts.RtsConnection_4Tag.RtsNonceMessage)
      )
    );

    this.encrypted = true;
  }

  cleanup() {
    this.vectorBle.onReceiveUnsubscribe(this);
  }

  send(rtsConn4) {
    let rtsConn = Rts.RtsConnection.NewRtsConnectionWithRtsConnection_4(
      rtsConn4
    );
    let extResponse = Rts.ExternalComms.NewExternalCommsWithRtsConnection(
      rtsConn
    );

    let data = extResponse.pack();

    if (this.encrypted) {
      data = this.encrypt(data);
    }

    let packet = Array.from(data); // todo: Buffer.from
    this.vectorBle.send(packet);
  }

  receive(data) {
    if (this.encrypted) {
      data = this.decrypt(data);
    }

    if (data == null) {
      return;
    }

    if (data[0] == 1 && data.length == 5) {
      // data is handshake so we should bail
      this.cancelConnection();
      return;
    }

    let comms = new Rts.ExternalComms();
    comms.unpack(data);

    if (comms.tag == Rts.ExternalCommsTag.RtsConnection) {
      switch (comms.value.tag) {
        case Rts.RtsConnectionTag.RtsConnection_4: {
          let rtsMsg = comms.value.value;

          switch (rtsMsg.tag) {
            case Rts.RtsConnection_4Tag.RtsConnRequest:
              this.onRtsConnRequest(rtsMsg.value);
              break;
            case Rts.RtsConnection_4Tag.RtsNonceMessage:
              this.onRtsNonceMessage(rtsMsg.value);
              break;
            case Rts.RtsConnection_4Tag.RtsChallengeMessage:
              this.onRtsChallengeMessage(rtsMsg.value);
              break;
            case Rts.RtsConnection_4Tag.RtsChallengeSuccessMessage:
              this.onRtsChallengeSuccessMessage(rtsMsg.value);
              break;

            // Post-connection messages
            case Rts.RtsConnection_4Tag.RtsWifiScanResponse_3:
              this.resolvePromise("wifi-scan", rtsMsg);
              break;
            case Rts.RtsConnection_4Tag.RtsWifiConnectResponse_3:
              this.resolvePromise("wifi-connect", rtsMsg);
              break;
            case Rts.RtsConnection_4Tag.RtsStatusResponse_4:
              this.resolvePromise("status", rtsMsg);
              break;
            case Rts.RtsConnection_4Tag.RtsWifiForgetResponse:
              this.resolvePromise("wifi-forget", rtsMsg);
              break;
            case Rts.RtsConnection_4Tag.RtsWifiAccessPointResponse:
              this.resolvePromise("wifi-ap", rtsMsg);
              break;
            case Rts.RtsConnection_4Tag.RtsWifiIpResponse:
              this.resolvePromise("wifi-ip", rtsMsg);
              break;
            case Rts.RtsConnection_4Tag.RtsCloudSessionResponse:
              for (let i = 0; i < this.onCloudAuthorizedEvent.length; i++) {
                this.onCloudAuthorizedEvent[i](rtsMsg.value);
              }

              this.resolvePromise("anki-auth", rtsMsg);
              break;
            case Rts.RtsConnection_4Tag.RtsOtaUpdateResponse:
              this.otaProgress["value"] = rtsMsg.value;

              for (let i = 0; i < this.onOtaProgressEvent.length; i++) {
                this.onOtaProgressEvent[i](rtsMsg.value);
              }

              if (this.hasProgressBar) {
                for (let i = 0; i < this.onUpdateProgressBarEvent.length; i++) {
                  this.onUpdateProgressBarEvent[i](
                    Number(rtsMsg.value.current),
                    Number(rtsMsg.value.expected)
                  );
                }
              }

              if (this.waitForResponse == "ota-start") {
                if (rtsMsg.status == 3) {
                  this.resolvePromise(this.waitForResponse, rtsMsg);
                } else if (rtsMsg.status >= 5) {
                  this.rejectPromise(this.waitForResponse, rtsMsg);
                }
              } else if (this.waitForResponse == "ota-cancel") {
                if (rtsMsg.status != 2) {
                  this.resolvePromise(this.waitForResponse, rtsMsg);
                }
              }
              break;
            case Rts.RtsConnection_4Tag.RtsResponse:
              this.rejectPromise(this.waitForResponse, rtsMsg);
              break;
            case Rts.RtsConnection_4Tag.RtsSdkProxyResponse:
              this.resolvePromise("sdk", rtsMsg);
              break;
            case Rts.RtsConnection_4Tag.RtsAppConnectionIdResponse:
              this.resolvePromise("connection-id", rtsMsg);
              break;
            case Rts.RtsConnection_4Tag.RtsLogResponse:
              if (rtsMsg.value.exitCode == 0) {
                this.logId = rtsMsg.value.fileId;
                this.logFile = [];
              } else {
                // todo: error case
              }
              break;
            case Rts.RtsConnection_4Tag.RtsFileDownload:
              let chunk = rtsMsg.value;
              if (chunk.fileId == this.logId) {
                this.logFile = this.logFile.concat(chunk.fileChunk);

                for (let i = 0; i < this.onLogProgressEvent.length; i++) {
                  this.onLogProgressEvent[i](rtsMsg.value);
                }

                if (this.hasProgressBar) {
                  for (
                    let i = 0;
                    i < this.onUpdateProgressBarEvent.length;
                    i++
                  ) {
                    this.onUpdateProgressBarEvent[i](
                      chunk.packetNumber,
                      chunk.packetTotal
                    );
                  }
                }

                if (chunk.packetNumber == chunk.packetTotal) {
                  // resolve promise
                  let fileName =
                    "vector-logs-" + RtsCliUtil.getDateString() + ".tar.bz2";
                  for (let i = 0; i < this.onLogsDownloadedEvent.length; i++) {
                    this.onLogsDownloadedEvent[i](fileName, this.logFile);
                  }

                  this.resolvePromise("logs", rtsMsg);
                }
              }
              break;
            default:
              break;
          }
          break;
        }
        default:
          break;
      }
    }
  }

  encrypt(data) {
    let txt = new Uint8Array(data);
    let nonce = new Uint8Array(this.nonces.encrypt);

    let cipher = this.sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(
      txt,
      null,
      null,
      nonce,
      this.cryptoKeys.encrypt
    );

    this.sodium.increment(this.nonces.encrypt);
    return cipher;
  }

  decrypt(cipher) {
    let c = new Uint8Array(cipher);
    let nonce = new Uint8Array(this.nonces.decrypt);

    let data = null;

    try {
      data = this.sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(
        null,
        c,
        null,
        nonce,
        this.cryptoKeys.decrypt
      );

      this.sodium.increment(this.nonces.decrypt);
    } catch (e) {
      console.log("error decrypting");
      this.sessions.deleteSession(this.remoteKeys.publicKey);
      this.sessions.save();
    }

    return data;
  }

  onRtsConnRequest(msg) {
    this.remoteKeys = {};
    this.remoteKeys.publicKey = msg.publicKey;

    let savedSession = this.sessions.getSession(this.remoteKeys.publicKey);

    if (savedSession != null) {
      this.keys = this.sessions.getKeys();
      this.cryptoKeys = { encrypt: savedSession.tx, decrypt: savedSession.rx };
      this.firstTimePair = false;

      // use saved session
      this.send(
        Rts.RtsConnection_4.NewRtsConnection_4WithRtsConnResponse(
          new Rts.RtsConnResponse(
            Rts.RtsConnType.Reconnection,
            this.keys.publicKey
          )
        )
      );
    } else if (
      this.remoteKeys.publicKey.toString() in this.vectorBle.sessions
    ) {
      let session = this.vectorBle.sessions[
        this.remoteKeys.publicKey.toString()
      ];
      this.keys = session.myKeys;
      this.cryptoKeys = session.cryptoKeys;
      this.firstTimePair = false;

      // use saved session
      this.send(
        Rts.RtsConnection_4.NewRtsConnection_4WithRtsConnResponse(
          new Rts.RtsConnResponse(
            Rts.RtsConnType.Reconnection,
            this.keys.publicKey
          )
        )
      );
    } else {
      // generate keys
      this.keys = this.sodium.crypto_kx_keypair();
      let self = this;
      this.connRequestHandle = setTimeout(function () {
        self.cancelConnection();
      }, 3000);
      this.send(
        Rts.RtsConnection_4.NewRtsConnection_4WithRtsConnResponse(
          new Rts.RtsConnResponse(
            Rts.RtsConnType.FirstTimePair,
            this.keys.publicKey
          )
        )
      );
    }
  }

  cancelConnection() {
    let msg =
      "\x1b[91mPairing failed. Double press robot button and try again. You may need to do 'ble-clear'.\x1b[0m";
    for (let i = 0; i < this.onPrintEvent.length; i++) {
      this.onPrintEvent[i](msg);
    }
    this.vectorBle.tryDisconnect();
    for (let i = 0; i < this.onCommandDoneEvent.length; i++) {
      this.onCommandDoneEvent[i]();
    }
  }

  onRtsNonceMessage(msg) {
    if (this.connRequestHandle != null) {
      clearTimeout(this.connRequestHandle);
      this.connRequestHandle = null;
    }
    this.nonces = {};

    this.nonces.decrypt = msg.toDeviceNonce;
    this.nonces.encrypt = msg.toRobotNonce;

    if (!this.firstTimePair) {
      // No need to enter pin
      this.send(
        Rts.RtsConnection_4.NewRtsConnection_4WithRtsAck(
          new Rts.RtsAck(Rts.RtsConnection_4Tag.RtsNonceMessage)
        )
      );

      this.encrypted = true;
      return;
    }

    for (let i = 0; i < this.onReadyForPinEvent.length; i++) {
      this.onReadyForPinEvent[i](this);
    }
  }

  onRtsChallengeMessage(msg) {
    this.send(
      Rts.RtsConnection_4.NewRtsConnection_4WithRtsChallengeMessage(
        new Rts.RtsChallengeMessage(msg.number + 1)
      )
    );
  }

  onRtsChallengeSuccessMessage(msg) {
    this.keysAuthorized = true;
    this.vectorBle.sessions[this.remoteKeys.publicKey.toString()] = {
      cryptoKeys: this.cryptoKeys,
      myKeys: this.keys,
    };

    // successfully received rtsChallengeSuccessMessage
    for (let i = 0; i < this.onEncryptedConnectionEvent.length; i++) {
      this.onEncryptedConnectionEvent[i](this);
    }
  }

  storePromiseMethods(str, resolve, reject) {
    this.promiseKeys[str] = {};
    this.promiseKeys[str].resolve = resolve;
    this.promiseKeys[str].reject = reject;
  }

  resolvePromise(str, msg) {
    if (this.promiseKeys[str] != null) {
      this.promiseKeys[str].resolve(msg);
      this.promiseKeys[str] = null;
    }
  }

  rejectPromise(str, msg) {
    if (this.promiseKeys[str] != null) {
      this.promiseKeys[str].reject(msg);
      this.promiseKeys[str] = null;
    }
  }

  cliResolve(msg) {
    let output = "";

    if (msg == null) {
      output = "Request timed out.";
    } else {
      output = RtsCliUtil.msgToStr(msg.value);
    }

    for (let i = 0; i < this.onCliResponseEvent.length; i++) {
      this.onCliResponseEvent[i](output);
    }

    this.waitForResponse = "";
  }

  //
  // <!-- API Promises
  //

  doWifiScan() {
    let self = this;
    let p = new Promise(function (resolve, reject) {
      self.storePromiseMethods("wifi-scan", resolve, reject);
      self.send(
        Rts.RtsConnection_4.NewRtsConnection_4WithRtsWifiScanRequest(
          new Rts.RtsWifiScanRequest()
        )
      );
    });

    return p;
  }

  doWifiConnect(ssid, password, auth, timeout) {
    let self = this;
    let p = new Promise(function (resolve, reject) {
      self.storePromiseMethods("wifi-connect", resolve, reject);
      self.send(
        Rts.RtsConnection_4.NewRtsConnection_4WithRtsWifiConnectRequest(
          new Rts.RtsWifiConnectRequest(
            RtsCliUtil.convertStrToHex(ssid),
            password,
            timeout,
            auth,
            false
          )
        )
      );
    });

    return p;
  }

  doWifiForget(ssid) {
    let self = this;
    let p = new Promise(function (resolve, reject) {
      self.storePromiseMethods("wifi-forget", resolve, reject);
      let deleteAll = ssid == "!all";
      let hexSsid = deleteAll ? "" : RtsCliUtil.convertStrToHex(ssid);
      self.send(
        Rts.RtsConnection_4.NewRtsConnection_4WithRtsWifiForgetRequest(
          new Rts.RtsWifiForgetRequest(deleteAll, hexSsid)
        )
      );
    });

    return p;
  }

  doWifiAp(enable) {
    let self = this;
    let p = new Promise(function (resolve, reject) {
      self.storePromiseMethods("wifi-ap", resolve, reject);
      self.send(
        Rts.RtsConnection_4.NewRtsConnection_4WithRtsWifiAccessPointRequest(
          new Rts.RtsWifiAccessPointRequest(enable.toLowerCase() == "true")
        )
      );
    });

    return p;
  }

  doWifiIp() {
    let self = this;
    let p = new Promise(function (resolve, reject) {
      self.storePromiseMethods("wifi-ip", resolve, reject);
      self.send(
        Rts.RtsConnection_4.NewRtsConnection_4WithRtsWifiIpRequest(
          new Rts.RtsWifiIpRequest()
        )
      );
    });

    return p;
  }

  doStatus() {
    let self = this;
    let p = new Promise(function (resolve, reject) {
      self.storePromiseMethods("status", resolve, reject);
      self.send(
        Rts.RtsConnection_4.NewRtsConnection_4WithRtsStatusRequest(
          new Rts.RtsStatusRequest()
        )
      );
    });

    return RtsCliUtil.addTimeout(p);
  }

  doAnkiAuth(sessionToken) {
    let self = this;
    let p = new Promise(function (resolve, reject) {
      self.storePromiseMethods("anki-auth", resolve, reject);
      self.send(
        Rts.RtsConnection_4.NewRtsConnection_4WithRtsCloudSessionRequest(
          new Rts.RtsCloudSessionRequest(sessionToken)
        )
      );
    });

    return p;
  }

  doOtaStart(url) {
    let self = this;
    let p = new Promise(function (resolve, reject) {
      self.storePromiseMethods("ota-start", resolve, reject);
      self.send(
        Rts.RtsConnection_4.NewRtsConnection_4WithRtsOtaUpdateRequest(
          new Rts.RtsOtaUpdateRequest(url)
        )
      );
    });

    return p;
  }

  doOtaCancel(url) {
    let self = this;
    let p = new Promise(function (resolve, reject) {
      self.storePromiseMethods("ota-cancel", resolve, reject);
      self.send(
        Rts.RtsConnection_4.NewRtsConnection_4WithRtsOtaCancelRequest(
          new Rts.RtsOtaCancelRequest(url)
        )
      );
    });

    return p;
  }

  doConnectionId() {
    let self = this;
    let p = new Promise(function (resolve, reject) {
      self.storePromiseMethods("connection-id", resolve, reject);
      self.send(
        Rts.RtsConnection_4.NewRtsConnection_4WithRtsAppConnectionIdRequest(
          new Rts.RtsAppConnectionIdRequest(url)
        )
      );
    });

    return p;
  }

  doLog() {
    let self = this;
    let p = new Promise(function (resolve, reject) {
      self.storePromiseMethods("logs", resolve, reject);
      self.send(
        Rts.RtsConnection_4.NewRtsConnection_4WithRtsLogRequest(
          new Rts.RtsLogRequest(0, [])
        )
      );
    });

    return p;
  }

  doSdk(clientGuid, id, path, json) {
    let self = this;
    let p = new Promise(function (resolve, reject) {
      self.storePromiseMethods("sdk", resolve, reject);
      self.send(
        Rts.RtsConnection_4.NewRtsConnection_4WithRtsSdkProxyRequest(
          new Rts.RtsSdkProxyRequest(clientGuid, id, path, json)
        )
      );
    });

    return p;
  }

  requireArgs(args, num) {
    if (args.length < num) {
      console.log(
        '"' + args[0] + '" command requires ' + (num - 1) + " arguments"
      );
      return false;
    }

    return true;
  }

  //
  // API Promises -->
  //
  setCliHelp() {
    let helpArgs = {
      "wifi-connect": {
        args: 2,
        des: "Connect Vector to a WiFi network.",
        help: "wifi-connect {ssid} {password}",
      },
      "wifi-scan": {
        args: 0,
        des: "Get WiFi networks that Vector can scan.",
        help: "wifi-scan",
      },
      "wifi-ip": {
        args: 0,
        des: "Get Vector's WiFi IPv4/IPv6 addresses.",
        help: "wifi-ip",
      },
      "wifi-ap": {
        args: 1,
        des: "Enable/Disable Vector as a WiFi access point.",
        help: "wifi-ap {true|false}",
      },
      "wifi-forget": {
        args: 1,
        des: "Forget a WiFi network, or optionally all of them.",
        help: "wifi-forget {ssid|!all}",
      },
      "ota-start": {
        args: 1,
        des: "Tell Vector to start an OTA update with the given URL.",
        help: "ota-start {url}",
      },
      "ota-progress": {
        args: 0,
        des: "Get the current OTA progress.",
        help: "ota-progress",
      },
      "ota-cancel": {
        args: 0,
        des: "Cancel an OTA in progress.",
        help: "ota-cancel",
      },
      logs: {
        args: 0,
        des: "Download logs over BLE from Vector.",
        help: "logs",
      },
      status: {
        args: 0,
        des: "Get status information from Vector.",
        help: "status",
      },
      "anki-auth": {
        args: 1,
        des: "Provision Vector with Anki account.",
        help: "anki-auth {session_token}",
      },
      "connection-id": {
        args: 1,
        des: "Give Vector a DAS/analytics id for this BLE session.",
        help: "connection-id {id}",
      },
    };

    this.helpArgs = helpArgs;

    return helpArgs;
  }

  // returns whether resolved immediately
  handleCli(args) {
    let self = this;
    let cmd = args[0];
    let r = function (msg) {
      self.cliResolve(msg);
    };
    let output = "";

    switch (cmd) {
      case "quit":
      case "exit":
        self.vectorBle.tryDisconnect();
        return false;
      case "help":
        output = RtsCliUtil.printHelp(self.helpArgs);
        for (let i = 0; i < this.onPrintEvent.length; i++) {
          this.onPrintEvent[i](output);
        }
        break;
      case "wifi-scan":
        self.waitForResponse = "wifi-scan";
        self.doWifiScan().then(function (msg) {
          self.wifiScanResults = msg.value.scanResult;
          self.cliResolve(msg);
        }, r);
        break;
      case "wifi-connect":
        if (!self.requireArgs(args, 3)) break;

        self.waitForResponse = "wifi-connect";

        let ssid = args[1];
        let hasScanned = false;
        let result = null;

        for (let i = 0; i < self.wifiScanResults.length; i++) {
          let r = self.wifiScanResults[i];

          if (ssid == RtsCliUtil.convertHexToStr(r.wifiSsidHex)) {
            result = r;
            hasScanned = true;
            break;
          }
        }

        self
          .doWifiConnect(ssid, args[2], hasScanned ? result.authType : 6, 15)
          .then(function (msg) {
            self.cliResolve(msg);
          }, r);

        break;
      case "status":
        self.waitForResponse = "status";
        self.doStatus().then(function (msg) {
          self.cliResolve(msg);
        }, r);
        break;
      case "wifi-ip":
        self.waitForResponse = "wifi-ip";
        self.doWifiIp().then(function (msg) {
          self.cliResolve(msg);
        }, r);
        break;
      case "wifi-forget":
        if (!self.requireArgs(args, 2)) break;

        self.waitForResponse = "wifi-forget";
        self.doWifiForget(args[1]).then(function (msg) {
          self.cliResolve(msg);
        }, r);
        break;
      case "wifi-ap":
        if (!self.requireArgs(args, 2)) break;

        self.waitForResponse = "wifi-ap";
        self.doWifiAp(args[1]).then(function (msg) {
          self.cliResolve(msg);
        }, r);
        break;
      case "anki-auth":
        if (!self.requireArgs(args, 2)) break;

        self.waitForResponse = "anki-auth";
        self.doAnkiAuth(args[1]).then(function (msg) {
          self.cliResolve(msg);
        }, r);
        break;
      case "ota-start":
        if (!self.requireArgs(args, 2)) break;

        self.waitForResponse = "ota-start";
        self.hasProgressBar = true;
        output = "Updating robot with OTA from " + args[1];
        for (let i = 0; i < this.onPrintEvent.length; i++) {
          this.onPrintEvent[i](output);
        }
        for (let i = 0; i < this.onNewProgressBarEvent.length; i++) {
          this.onNewProgressBarEvent[i]();
        }

        self.doOtaStart(args[1]).then(function (msg) {
          self.otaProgress.value = msg.value;
          self.hasProgressBar = false;
          self.cliResolve(msg);
        }, r);
        break;
      case "ota-cancel":
        self.waitForResponse = "ota-cancel";
        self.doOtaCancel().then(function (msg) {
          self.otaProgress.value = msg.value;
          self.cliResolve(msg);
        }, r);
        break;
      case "ota-progress":
        if (self.otaProgress.value != null) {
          console.log(
            RtsCliUtil.rtsOtaUpdateResponseStr(self.otaProgress.value)
          );
        }

        break;
      case "connection-id":
        if (!self.requireArgs(args, 2)) break;

        self.waitForResponse = "connection-id";
        self.doConnectionId().then(function (msg) {
          self.cliResolve(msg);
        }, r);
        break;
      case "sdk":
        if (!self.requireArgs(args, 3)) break;

        self.waitForResponse = "sdk";
        self
          .doSdk(args[3], RtsCliUtil.makeId(), args[1], args[2])
          .then(function (msg) {
            self.cliResolve(msg);
          }, r);
        break;
      case "logs":
        console.log(
          "downloading logs over BLE will probably take about 30 seconds..."
        );
        self.waitForResponse = "logs";
        self.hasProgressBar = true;
        output = "Downloading logs...";
        for (let i = 0; i < this.onPrintEvent.length; i++) {
          this.onPrintEvent[i](output);
        }
        for (let i = 0; i < this.onNewProgressBarEvent.length; i++) {
          this.onNewProgressBarEvent[i]();
        }

        self.doLog().then(function (msg) {
          self.hasProgressBar = false;
          self.cliResolve(msg);
        }, r);
        break;
      default:
        self.waitForResponse = "";
        break;
    }

    if (self.waitForResponse == "") {
      return true;
    }

    return false;
  }
}

module.exports = { RtsV4Handler };

},{"./messageExternalComms.js":5,"./rtsCliUtil.js":6}],10:[function(require,module,exports){
/* Copyright (c) 2019-2020 Digital Dream Labs. See LICENSE file for details. */

var { RtsCliUtil } = require("./rtsCliUtil.js");
var { Anki } = require("./messageExternalComms.js");

if (!Rts) {
  var Rts = Anki.Vector.ExternalComms;
}

class RtsV5Handler {
  constructor(vectorBle, sodium, sessions) {
    this.vectorBle = vectorBle;
    this.vectorBle.onReceive(this);
    this.sodium = sodium;
    this.sessions = sessions;
    this.encrypted = false;
    this.keysAuthorized = false;
    this.waitForResponse = "";
    this.promiseKeys = {};

    // remembered state
    this.wifiScanResults = {};
    this.otaProgress = {};
    this.logId = 0;
    this.logFile = [];
    this.isReading = false;
    this.cryptoKeys = {};
    this.firstTimePair = true;
    this.hasProgressBar = false;
    this.helpArgs = {};
    this.connRequestHandle = null;

    // events
    this.onEncryptedConnectionEvent = [];
    this.onReadyForPinEvent = [];
    this.onOtaProgressEvent = [];
    this.onLogProgressEvent = [];
    this.onCliResponseEvent = [];
    this.onCloudAuthorizedEvent = [];
    this.onPrintEvent = [];
    this.onCommandDoneEvent = [];
    this.onNewProgressBarEvent = [];
    this.onUpdateProgressBarEvent = [];
    this.onLogsDownloadedEvent = [];

    this.setCliHelp();
  }

  onReadyForPin(fnc) {
    this.onReadyForPinEvent.push(fnc);
  }

  onOtaProgress(fnc) {
    this.onOtaProgressEvent.push(fnc);
  }

  onLogProgress(fnc) {
    this.onLogProgressEvent.push(fnc);
  }

  onEncryptedConnection(fnc) {
    this.onEncryptedConnectionEvent.push(fnc);
  }

  onCloudAuthorized(fnc) {
    this.onCloudAuthorizedEvent.push(fnc);
  }

  onCliResponse(fnc) {
    this.onCliResponseEvent.push(fnc);
  }

  onPrint(fnc) {
    this.onPrintEvent.push(fnc);
  }

  onCommandDone(fnc) {
    this.onCommandDoneEvent.push(fnc);
  }

  onNewProgressBar(fnc) {
    this.onNewProgressBarEvent.push(fnc);
  }

  onUpdateProgressBar(fnc) {
    this.onUpdateProgressBarEvent.push(fnc);
  }

  onLogsDownloaded(fnc) {
    this.onLogsDownloadedEvent.push(fnc);
  }

  enterPin(pin) {
    let clientKeys = this.sodium.crypto_kx_client_session_keys(
      this.keys.publicKey,
      this.keys.privateKey,
      this.remoteKeys.publicKey
    );
    let sharedRx = this.sodium.crypto_generichash(32, clientKeys.sharedRx, pin);
    let sharedTx = this.sodium.crypto_generichash(32, clientKeys.sharedTx, pin);

    this.cryptoKeys.decrypt = sharedRx;
    this.cryptoKeys.encrypt = sharedTx;

    this.send(
      Rts.RtsConnection_5.NewRtsConnection_5WithRtsAck(
        new Rts.RtsAck(Rts.RtsConnection_5Tag.RtsNonceMessage)
      )
    );

    this.encrypted = true;
  }

  cleanup() {
    this.vectorBle.onReceiveUnsubscribe(this);
  }

  send(rtsConn5) {
    let rtsConn = Rts.RtsConnection.NewRtsConnectionWithRtsConnection_5(
      rtsConn5
    );
    let extResponse = Rts.ExternalComms.NewExternalCommsWithRtsConnection(
      rtsConn
    );

    let data = extResponse.pack();

    if (this.encrypted) {
      data = this.encrypt(data);
    }

    let packet = Array.from(data); // todo: Buffer.from
    this.vectorBle.send(packet);
  }

  receive(data) {
    if (this.encrypted) {
      data = this.decrypt(data);
    }

    if (data == null) {
      return;
    }

    if (data[0] == 1 && data.length == 5) {
      // data is handshake so we should bail
      this.cancelConnection();
      return;
    }

    let comms = new Rts.ExternalComms();
    comms.unpack(data);

    if (comms.tag == Rts.ExternalCommsTag.RtsConnection) {
      switch (comms.value.tag) {
        case Rts.RtsConnectionTag.RtsConnection_5: {
          let rtsMsg = comms.value.value;

          switch (rtsMsg.tag) {
            case Rts.RtsConnection_5Tag.RtsConnRequest:
              this.onRtsConnRequest(rtsMsg.value);
              break;
            case Rts.RtsConnection_5Tag.RtsNonceMessage:
              this.onRtsNonceMessage(rtsMsg.value);
              break;
            case Rts.RtsConnection_5Tag.RtsChallengeMessage:
              this.onRtsChallengeMessage(rtsMsg.value);
              break;
            case Rts.RtsConnection_5Tag.RtsChallengeSuccessMessage:
              this.onRtsChallengeSuccessMessage(rtsMsg.value);
              break;

            // Post-connection messages
            case Rts.RtsConnection_5Tag.RtsWifiScanResponse_3:
              this.resolvePromise("wifi-scan", rtsMsg);
              break;
            case Rts.RtsConnection_5Tag.RtsWifiConnectResponse_3:
              this.resolvePromise("wifi-connect", rtsMsg);
              break;
            case Rts.RtsConnection_5Tag.RtsStatusResponse_5:
              this.resolvePromise("status", rtsMsg);
              break;
            case Rts.RtsConnection_5Tag.RtsWifiForgetResponse:
              this.resolvePromise("wifi-forget", rtsMsg);
              break;
            case Rts.RtsConnection_5Tag.RtsWifiAccessPointResponse:
              this.resolvePromise("wifi-ap", rtsMsg);
              break;
            case Rts.RtsConnection_5Tag.RtsWifiIpResponse:
              this.resolvePromise("wifi-ip", rtsMsg);
              break;
            case Rts.RtsConnection_5Tag.RtsCloudSessionResponse:
              for (let i = 0; i < this.onCloudAuthorizedEvent.length; i++) {
                this.onCloudAuthorizedEvent[i](rtsMsg.value);
              }

              this.resolvePromise("anki-auth", rtsMsg);
              break;
            case Rts.RtsConnection_5Tag.RtsOtaUpdateResponse:
              this.otaProgress["value"] = rtsMsg.value;

              for (let i = 0; i < this.onOtaProgressEvent.length; i++) {
                this.onOtaProgressEvent[i](rtsMsg.value);
              }

              if (this.hasProgressBar) {
                for (let i = 0; i < this.onUpdateProgressBarEvent.length; i++) {
                  this.onUpdateProgressBarEvent[i](
                    Number(rtsMsg.value.current),
                    Number(rtsMsg.value.expected)
                  );
                }
              }

              if (this.waitForResponse == "ota-start") {
                if (rtsMsg.status == 3) {
                  this.resolvePromise(this.waitForResponse, rtsMsg);
                } else if (rtsMsg.status >= 5) {
                  this.rejectPromise(this.waitForResponse, rtsMsg);
                }
              } else if (this.waitForResponse == "ota-cancel") {
                if (rtsMsg.status != 2) {
                  this.resolvePromise(this.waitForResponse, rtsMsg);
                }
              }
              break;
            case Rts.RtsConnection_5Tag.RtsResponse:
              this.rejectPromise(this.waitForResponse, rtsMsg);
              break;
            case Rts.RtsConnection_5Tag.RtsSdkProxyResponse:
              this.resolvePromise("sdk", rtsMsg);
              break;
            case Rts.RtsConnection_5Tag.RtsAppConnectionIdResponse:
              this.resolvePromise("connection-id", rtsMsg);
              break;
            case Rts.RtsConnection_5Tag.RtsLogResponse:
              if (rtsMsg.value.exitCode == 0) {
                this.logId = rtsMsg.value.fileId;
                this.logFile = [];
              } else {
                // todo: error case
              }
              break;
            case Rts.RtsConnection_5Tag.RtsFileDownload:
              let chunk = rtsMsg.value;
              if (chunk.fileId == this.logId) {
                this.logFile = this.logFile.concat(chunk.fileChunk);

                for (let i = 0; i < this.onLogProgressEvent.length; i++) {
                  this.onLogProgressEvent[i](rtsMsg.value);
                }

                if (this.hasProgressBar) {
                  for (
                    let i = 0;
                    i < this.onUpdateProgressBarEvent.length;
                    i++
                  ) {
                    this.onUpdateProgressBarEvent[i](
                      chunk.packetNumber,
                      chunk.packetTotal
                    );
                  }
                }

                if (chunk.packetNumber == chunk.packetTotal) {
                  // resolve promise
                  let fileName =
                    "vector-logs-" + RtsCliUtil.getDateString() + ".tar.bz2";
                  for (let i = 0; i < this.onLogsDownloadedEvent.length; i++) {
                    this.onLogsDownloadedEvent[i](fileName, this.logFile);
                  }

                  this.resolvePromise("logs", rtsMsg);
                }
              }
              break;
            default:
              break;
          }
          break;
        }
        default:
          break;
      }
    }
  }

  encrypt(data) {
    let txt = new Uint8Array(data);
    let nonce = new Uint8Array(this.nonces.encrypt);

    let cipher = this.sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(
      txt,
      null,
      null,
      nonce,
      this.cryptoKeys.encrypt
    );

    this.sodium.increment(this.nonces.encrypt);
    return cipher;
  }

  decrypt(cipher) {
    let c = new Uint8Array(cipher);
    let nonce = new Uint8Array(this.nonces.decrypt);

    let data = null;

    try {
      data = this.sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(
        null,
        c,
        null,
        nonce,
        this.cryptoKeys.decrypt
      );

      this.sodium.increment(this.nonces.decrypt);
    } catch (e) {
      console.log("error decrypting");
      this.sessions.deleteSession(this.remoteKeys.publicKey);
      this.sessions.save();
    }

    return data;
  }

  onRtsConnRequest(msg) {
    this.remoteKeys = {};
    this.remoteKeys.publicKey = msg.publicKey;

    let savedSession = this.sessions.getSession(this.remoteKeys.publicKey);

    if (savedSession != null) {
      this.keys = this.sessions.getKeys();
      this.cryptoKeys = { encrypt: savedSession.tx, decrypt: savedSession.rx };
      this.firstTimePair = false;

      // use saved session
      this.send(
        Rts.RtsConnection_5.NewRtsConnection_5WithRtsConnResponse(
          new Rts.RtsConnResponse(
            Rts.RtsConnType.Reconnection,
            this.keys.publicKey
          )
        )
      );
    } else if (
      this.remoteKeys.publicKey.toString() in this.vectorBle.sessions
    ) {
      let session = this.vectorBle.sessions[
        this.remoteKeys.publicKey.toString()
      ];
      this.keys = session.myKeys;
      this.cryptoKeys = session.cryptoKeys;
      this.firstTimePair = false;

      // use saved session
      this.send(
        Rts.RtsConnection_5.NewRtsConnection_5WithRtsConnResponse(
          new Rts.RtsConnResponse(
            Rts.RtsConnType.Reconnection,
            this.keys.publicKey
          )
        )
      );
    } else {
      // generate keys
      this.keys = this.sodium.crypto_kx_keypair();
      let self = this;
      this.connRequestHandle = setTimeout(function () {
        self.cancelConnection();
      }, 3000);
      this.send(
        Rts.RtsConnection_5.NewRtsConnection_5WithRtsConnResponse(
          new Rts.RtsConnResponse(
            Rts.RtsConnType.FirstTimePair,
            this.keys.publicKey
          )
        )
      );
    }
  }

  cancelConnection() {
    let msg =
      "\x1b[91mPairing failed. Double press robot button and try again. You may need to do 'ble-clear'.\x1b[0m";
    for (let i = 0; i < this.onPrintEvent.length; i++) {
      this.onPrintEvent[i](msg);
    }
    this.vectorBle.tryDisconnect();
    for (let i = 0; i < this.onCommandDoneEvent.length; i++) {
      this.onCommandDoneEvent[i]();
    }
  }

  onRtsNonceMessage(msg) {
    if (this.connRequestHandle != null) {
      clearTimeout(this.connRequestHandle);
      this.connRequestHandle = null;
    }
    this.nonces = {};

    this.nonces.decrypt = msg.toDeviceNonce;
    this.nonces.encrypt = msg.toRobotNonce;

    if (!this.firstTimePair) {
      // No need to enter pin
      this.send(
        Rts.RtsConnection_5.NewRtsConnection_5WithRtsAck(
          new Rts.RtsAck(Rts.RtsConnection_5Tag.RtsNonceMessage)
        )
      );

      this.encrypted = true;
      return;
    }

    for (let i = 0; i < this.onReadyForPinEvent.length; i++) {
      this.onReadyForPinEvent[i](this);
    }
  }

  onRtsChallengeMessage(msg) {
    this.send(
      Rts.RtsConnection_5.NewRtsConnection_5WithRtsChallengeMessage(
        new Rts.RtsChallengeMessage(msg.number + 1)
      )
    );
  }

  onRtsChallengeSuccessMessage(msg) {
    this.keysAuthorized = true;
    this.vectorBle.sessions[this.remoteKeys.publicKey.toString()] = {
      cryptoKeys: this.cryptoKeys,
      myKeys: this.keys,
    };

    // successfully received rtsChallengeSuccessMessage
    for (let i = 0; i < this.onEncryptedConnectionEvent.length; i++) {
      this.onEncryptedConnectionEvent[i](this);
    }
  }

  storePromiseMethods(str, resolve, reject) {
    this.promiseKeys[str] = {};
    this.promiseKeys[str].resolve = resolve;
    this.promiseKeys[str].reject = reject;
  }

  resolvePromise(str, msg) {
    if (this.promiseKeys[str] != null) {
      this.promiseKeys[str].resolve(msg);
      this.promiseKeys[str] = null;
    }
  }

  rejectPromise(str, msg) {
    if (this.promiseKeys[str] != null) {
      this.promiseKeys[str].reject(msg);
      this.promiseKeys[str] = null;
    }
  }

  cliResolve(msg) {
    let output = "";

    if (msg == null) {
      output = "Request timed out.";
    } else {
      output = RtsCliUtil.msgToStr(msg.value);
    }

    for (let i = 0; i < this.onCliResponseEvent.length; i++) {
      this.onCliResponseEvent[i](output);
    }

    this.waitForResponse = "";
  }

  //
  // <!-- API Promises
  //

  doWifiScan() {
    let self = this;
    let p = new Promise(function (resolve, reject) {
      self.storePromiseMethods("wifi-scan", resolve, reject);
      self.send(
        Rts.RtsConnection_5.NewRtsConnection_5WithRtsWifiScanRequest(
          new Rts.RtsWifiScanRequest()
        )
      );
    });

    return p;
  }

  doWifiConnect(ssid, password, auth, timeout) {
    let self = this;
    let p = new Promise(function (resolve, reject) {
      self.storePromiseMethods("wifi-connect", resolve, reject);
      self.send(
        Rts.RtsConnection_5.NewRtsConnection_5WithRtsWifiConnectRequest(
          new Rts.RtsWifiConnectRequest(
            RtsCliUtil.convertStrToHex(ssid),
            password,
            timeout,
            auth,
            false
          )
        )
      );
    });

    return p;
  }

  doWifiForget(ssid) {
    let self = this;
    let p = new Promise(function (resolve, reject) {
      self.storePromiseMethods("wifi-forget", resolve, reject);
      let deleteAll = ssid == "!all";
      let hexSsid = deleteAll ? "" : RtsCliUtil.convertStrToHex(ssid);
      self.send(
        Rts.RtsConnection_5.NewRtsConnection_5WithRtsWifiForgetRequest(
          new Rts.RtsWifiForgetRequest(deleteAll, hexSsid)
        )
      );
    });

    return RtsCliUtil.addTimeout(p);
  }

  doWifiAp(enable) {
    let self = this;
    let p = new Promise(function (resolve, reject) {
      self.storePromiseMethods("wifi-ap", resolve, reject);
      self.send(
        Rts.RtsConnection_5.NewRtsConnection_5WithRtsWifiAccessPointRequest(
          new Rts.RtsWifiAccessPointRequest(enable.toLowerCase() == "true")
        )
      );
    });

    return RtsCliUtil.addTimeout(p);
  }

  doWifiIp() {
    let self = this;
    let p = new Promise(function (resolve, reject) {
      self.storePromiseMethods("wifi-ip", resolve, reject);
      self.send(
        Rts.RtsConnection_5.NewRtsConnection_5WithRtsWifiIpRequest(
          new Rts.RtsWifiIpRequest()
        )
      );
    });

    return RtsCliUtil.addTimeout(p);
  }

  doStatus() {
    let self = this;
    let p = new Promise(function (resolve, reject) {
      self.storePromiseMethods("status", resolve, reject);
      self.send(
        Rts.RtsConnection_5.NewRtsConnection_5WithRtsStatusRequest(
          new Rts.RtsStatusRequest()
        )
      );
    });

    return RtsCliUtil.addTimeout(p);
  }

  doAnkiAuth(sessionToken) {
    let self = this;
    let p = new Promise(function (resolve, reject) {
      self.storePromiseMethods("anki-auth", resolve, reject);
      self.send(
        Rts.RtsConnection_5.NewRtsConnection_5WithRtsCloudSessionRequest_5(
          new Rts.RtsCloudSessionRequest_5(sessionToken, "", "")
        )
      );
    });

    return p;
  }

  doOtaStart(url) {
    let self = this;
    let p = new Promise(function (resolve, reject) {
      self.storePromiseMethods("ota-start", resolve, reject);
      self.send(
        Rts.RtsConnection_5.NewRtsConnection_5WithRtsOtaUpdateRequest(
          new Rts.RtsOtaUpdateRequest(url)
        )
      );
    });

    return p;
  }

  doOtaCancel(url) {
    let self = this;
    let p = new Promise(function (resolve, reject) {
      self.storePromiseMethods("ota-cancel", resolve, reject);
      self.send(
        Rts.RtsConnection_5.NewRtsConnection_5WithRtsOtaCancelRequest(
          new Rts.RtsOtaCancelRequest(url)
        )
      );
    });

    return p;
  }

  doConnectionId() {
    let self = this;
    let p = new Promise(function (resolve, reject) {
      self.storePromiseMethods("connection-id", resolve, reject);
      self.send(
        Rts.RtsConnection_5.NewRtsConnection_5WithRtsAppConnectionIdRequest(
          new Rts.RtsAppConnectionIdRequest(url)
        )
      );
    });

    return RtsCliUtil.addTimeout(p);
  }

  doLog() {
    let self = this;
    let p = new Promise(function (resolve, reject) {
      self.storePromiseMethods("logs", resolve, reject);
      self.send(
        Rts.RtsConnection_5.NewRtsConnection_5WithRtsLogRequest(
          new Rts.RtsLogRequest(0, [])
        )
      );
    });

    return p;
  }

  doSdk(clientGuid, id, path, json) {
    let self = this;
    let p = new Promise(function (resolve, reject) {
      self.storePromiseMethods("sdk", resolve, reject);
      self.send(
        Rts.RtsConnection_5.NewRtsConnection_5WithRtsSdkProxyRequest(
          new Rts.RtsSdkProxyRequest(clientGuid, id, path, json)
        )
      );
    });

    return p;
  }

  requireArgs(args, num) {
    if (args.length < num) {
      console.log(
        '"' + args[0] + '" command requires ' + (num - 1) + " arguments"
      );
      return false;
    }

    return true;
  }

  //
  // API Promises -->
  //
  setCliHelp() {
    let helpArgs = {
      "wifi-connect": {
        args: 2,
        des: "Connect Vector to a WiFi network.",
        help: "wifi-connect {ssid} {password}",
      },
      "wifi-scan": {
        args: 0,
        des: "Get WiFi networks that Vector can scan.",
        help: "wifi-scan",
      },
      "wifi-ip": {
        args: 0,
        des: "Get Vector's WiFi IPv4/IPv6 addresses.",
        help: "wifi-ip",
      },
      "wifi-ap": {
        args: 1,
        des: "Enable/Disable Vector as a WiFi access point.",
        help: "wifi-ap {true|false}",
      },
      "wifi-forget": {
        args: 1,
        des: "Forget a WiFi network, or optionally all of them.",
        help: "wifi-forget {ssid|!all}",
      },
      "ota-start": {
        args: 1,
        des: "Tell Vector to start an OTA update with the given URL.",
        help: "ota-start {url}",
      },
      "ota-progress": {
        args: 0,
        des: "Get the current OTA progress.",
        help: "ota-progress",
      },
      "ota-cancel": {
        args: 0,
        des: "Cancel an OTA in progress.",
        help: "ota-cancel",
      },
      logs: {
        args: 0,
        des: "Download logs over BLE from Vector.",
        help: "logs",
      },
      status: {
        args: 0,
        des: "Get status information from Vector.",
        help: "status",
      },
      "anki-auth": {
        args: 1,
        des: "Provision Vector with Anki account.",
        help: "anki-auth {session_token}",
      },
      "connection-id": {
        args: 1,
        des: "Give Vector a DAS/analytics id for this BLE session.",
        help: "connection-id {id}",
      },
      sdk: {
        args: 3,
        des: "Send an SDK request over BLE.",
        help: "sdk {path} {json} {client_app_guid}",
      },
    };

    this.helpArgs = helpArgs;

    return helpArgs;
  }

  // returns whether resolved immediately
  handleCli(args) {
    let self = this;
    let cmd = args[0];
    let r = function (msg) {
      self.cliResolve(msg);
    };
    let output = "";

    switch (cmd) {
      case "quit":
      case "exit":
        self.vectorBle.tryDisconnect();
        return false;
      case "help":
        output = RtsCliUtil.printHelp(self.helpArgs);
        for (let i = 0; i < this.onPrintEvent.length; i++) {
          this.onPrintEvent[i](output);
        }
        break;
      case "wifi-scan":
        self.waitForResponse = "wifi-scan";
        self.doWifiScan().then(function (msg) {
          self.wifiScanResults = msg.value.scanResult;
          self.cliResolve(msg);
        }, r);
        break;
      case "wifi-connect":
        if (!self.requireArgs(args, 3)) break;

        self.waitForResponse = "wifi-connect";

        let ssid = args[1];
        let hasScanned = false;
        let result = null;

        for (let i = 0; i < self.wifiScanResults.length; i++) {
          let r = self.wifiScanResults[i];

          if (ssid == RtsCliUtil.convertHexToStr(r.wifiSsidHex)) {
            result = r;
            hasScanned = true;
            break;
          }
        }

        self
          .doWifiConnect(ssid, args[2], hasScanned ? result.authType : 6, 15)
          .then(function (msg) {
            self.cliResolve(msg);
          }, r);

        break;
      case "status":
        self.waitForResponse = "status";
        self.doStatus().then(function (msg) {
          self.cliResolve(msg);
        }, r);
        break;
      case "wifi-ip":
        self.waitForResponse = "wifi-ip";
        self.doWifiIp().then(function (msg) {
          self.cliResolve(msg);
        }, r);
        break;
      case "wifi-forget":
        if (!self.requireArgs(args, 2)) break;

        self.waitForResponse = "wifi-forget";
        self.doWifiForget(args[1]).then(function (msg) {
          self.cliResolve(msg);
        }, r);
        break;
      case "wifi-ap":
        if (!self.requireArgs(args, 2)) break;

        self.waitForResponse = "wifi-ap";
        self.doWifiAp(args[1]).then(function (msg) {
          self.cliResolve(msg);
        }, r);
        break;
      case "anki-auth":
        if (!self.requireArgs(args, 2)) break;

        self.waitForResponse = "anki-auth";
        self.doAnkiAuth(args[1]).then(function (msg) {
          self.cliResolve(msg);
        }, r);
        break;
      case "ota-start":
        if (!self.requireArgs(args, 2)) break;

        self.waitForResponse = "ota-start";
        self.hasProgressBar = true;
        output = "Updating robot with OTA from " + args[1];
        for (let i = 0; i < this.onPrintEvent.length; i++) {
          this.onPrintEvent[i](output);
        }
        for (let i = 0; i < this.onNewProgressBarEvent.length; i++) {
          this.onNewProgressBarEvent[i]();
        }

        self.doOtaStart(args[1]).then(function (msg) {
          self.otaProgress.value = msg.value;
          self.hasProgressBar = false;
          self.cliResolve(msg);
        }, r);
        break;
      case "ota-cancel":
        self.waitForResponse = "ota-cancel";
        self.doOtaCancel().then(function (msg) {
          self.otaProgress.value = msg.value;
          self.cliResolve(msg);
        }, r);
        break;
      case "ota-progress":
        if (self.otaProgress.value != null) {
          console.log(
            RtsCliUtil.rtsOtaUpdateResponseStr(self.otaProgress.value)
          );
        }

        break;
      case "connection-id":
        if (!self.requireArgs(args, 2)) break;

        self.waitForResponse = "connection-id";
        self.doConnectionId().then(function (msg) {
          self.cliResolve(msg);
        }, r);
        break;
      case "sdk":
        if (!self.requireArgs(args, 3)) break;

        self.waitForResponse = "sdk";
        self
          .doSdk(args[3], RtsCliUtil.makeId(), args[1], args[2])
          .then(function (msg) {
            self.cliResolve(msg);
          }, r);
        break;
      case "logs":
        console.log(
          "downloading logs over BLE will probably take about 30 seconds..."
        );
        self.waitForResponse = "logs";
        self.hasProgressBar = true;
        output = "Downloading logs...";
        for (let i = 0; i < this.onPrintEvent.length; i++) {
          this.onPrintEvent[i](output);
        }
        for (let i = 0; i < this.onNewProgressBarEvent.length; i++) {
          this.onNewProgressBarEvent[i]();
        }

        self.doLog().then(function (msg) {
          self.hasProgressBar = false;
          self.cliResolve(msg);
        }, r);
        break;
      default:
        self.waitForResponse = "";
        break;
    }

    if (self.waitForResponse == "") {
      return true;
    }

    return false;
  }
}

module.exports = { RtsV5Handler };

},{"./messageExternalComms.js":5,"./rtsCliUtil.js":6}],11:[function(require,module,exports){
/* Copyright (c) 2019-2020 Digital Dream Labs. See LICENSE file for details. */

var { RtsCliUtil } = require("./rtsCliUtil.js");
var { Anki } = require("./messageExternalComms.js");
var { Blesh } = require("./blesh.js");

if (!Rts) {
  var Rts = Anki.Vector.ExternalComms;
}

class RtsV6Handler {
  constructor(vectorBle, sodium, sessions) {
    this.vectorBle = vectorBle;
    this.vectorBle.onReceive(this);
    this.sodium = sodium;
    this.sessions = sessions;
    this.encrypted = false;
    this.keysAuthorized = false;
    this.waitForResponse = "";
    this.promiseKeys = {};

    // remembered state
    this.wifiScanResults = {};
    this.otaProgress = {};
    this.logId = 0;
    this.logFile = [];
    this.isReading = false;
    this.cryptoKeys = {};
    this.firstTimePair = true;
    this.hasProgressBar = false;
    this.helpArgs = {};
    this.connRequestHandle = null;

    // events
    this.onEncryptedConnectionEvent = [];
    this.onReadyForPinEvent = [];
    this.onOtaProgressEvent = [];
    this.onLogProgressEvent = [];
    this.onCliResponseEvent = [];
    this.onCloudAuthorizedEvent = [];
    this.onPrintEvent = [];
    this.onCommandDoneEvent = [];
    this.onNewProgressBarEvent = [];
    this.onUpdateProgressBarEvent = [];
    this.onLogsDownloadedEvent = [];

    this.blesh = new Blesh();

    this.setCliHelp();
  }

  onReadyForPin(fnc) {
    this.onReadyForPinEvent.push(fnc);
  }

  onOtaProgress(fnc) {
    this.onOtaProgressEvent.push(fnc);
  }

  onLogProgress(fnc) {
    this.onLogProgressEvent.push(fnc);
  }

  onEncryptedConnection(fnc) {
    this.onEncryptedConnectionEvent.push(fnc);
  }

  onCloudAuthorized(fnc) {
    this.onCloudAuthorizedEvent.push(fnc);
  }

  onCliResponse(fnc) {
    this.onCliResponseEvent.push(fnc);
  }

  onPrint(fnc) {
    this.onPrintEvent.push(fnc);
  }

  onCommandDone(fnc) {
    this.onCommandDoneEvent.push(fnc);
  }

  onNewProgressBar(fnc) {
    this.onNewProgressBarEvent.push(fnc);
  }

  onUpdateProgressBar(fnc) {
    this.onUpdateProgressBarEvent.push(fnc);
  }

  onLogsDownloaded(fnc) {
    this.onLogsDownloadedEvent.push(fnc);
  }

  enterPin(pin) {
    let clientKeys = this.sodium.crypto_kx_client_session_keys(
      this.keys.publicKey,
      this.keys.privateKey,
      this.remoteKeys.publicKey
    );
    let sharedRx = this.sodium.crypto_generichash(32, clientKeys.sharedRx, pin);
    let sharedTx = this.sodium.crypto_generichash(32, clientKeys.sharedTx, pin);

    this.cryptoKeys.decrypt = sharedRx;
    this.cryptoKeys.encrypt = sharedTx;

    this.send(
      Rts.RtsConnection_6.NewRtsConnection_6WithRtsAck(
        new Rts.RtsAck(Rts.RtsConnection_6Tag.RtsNonceMessage)
      )
    );

    this.encrypted = true;
  }

  cleanup() {
    this.vectorBle.onReceiveUnsubscribe(this);
  }

  send(rtsConn5) {
    let rtsConn = Rts.RtsConnection.NewRtsConnectionWithRtsConnection_6(
      rtsConn5
    );
    let extResponse = Rts.ExternalComms.NewExternalCommsWithRtsConnection(
      rtsConn
    );

    let data = extResponse.pack();

    if (this.encrypted) {
      data = this.encrypt(data);
    }

    let packet = Array.from(data); // todo: Buffer.from
    this.vectorBle.send(packet);
  }

  receive(data) {
    if (this.encrypted) {
      data = this.decrypt(data);
    }

    if (data == null) {
      return;
    }

    if (data[0] == 1 && data.length == 5) {
      // data is handshake so we should bail
      this.cancelConnection();
      return;
    }

    let comms = new Rts.ExternalComms();
    comms.unpack(data);

    if (comms.tag == Rts.ExternalCommsTag.RtsConnection) {
      switch (comms.value.tag) {
        case Rts.RtsConnectionTag.RtsConnection_6: {
          let rtsMsg = comms.value.value;

          switch (rtsMsg.tag) {
            case Rts.RtsConnection_6Tag.RtsConnRequest_6:
              this.onRtsConnRequest(rtsMsg.value);
              break;
            case Rts.RtsConnection_6Tag.RtsNonceMessage:
              this.onRtsNonceMessage(rtsMsg.value);
              break;
            case Rts.RtsConnection_6Tag.RtsChallengeMessage:
              this.onRtsChallengeMessage(rtsMsg.value);
              break;
            case Rts.RtsConnection_6Tag.RtsChallengeSuccessMessage:
              this.onRtsChallengeSuccessMessage(rtsMsg.value);
              break;

            // Post-connection messages
            case Rts.RtsConnection_6Tag.RtsWifiScanResponse_3:
              this.resolvePromise("wifi-scan", rtsMsg);
              break;
            case Rts.RtsConnection_6Tag.RtsWifiConnectResponse_3:
              this.resolvePromise("wifi-connect", rtsMsg);
              break;
            case Rts.RtsConnection_6Tag.RtsStatusResponse_5:
              this.resolvePromise("status", rtsMsg);
              break;
            case Rts.RtsConnection_6Tag.RtsWifiForgetResponse:
              this.resolvePromise("wifi-forget", rtsMsg);
              break;
            case Rts.RtsConnection_6Tag.RtsWifiAccessPointResponse:
              this.resolvePromise("wifi-ap", rtsMsg);
              break;
            case Rts.RtsConnection_6Tag.RtsWifiIpResponse:
              this.resolvePromise("wifi-ip", rtsMsg);
              break;
            case Rts.RtsConnection_6Tag.RtsCloudSessionResponse:
              for (let i = 0; i < this.onCloudAuthorizedEvent.length; i++) {
                this.onCloudAuthorizedEvent[i](rtsMsg.value);
              }

              this.resolvePromise("anki-auth", rtsMsg);
              break;
            case Rts.RtsConnection_6Tag.RtsOtaUpdateResponse:
              this.otaProgress["value"] = rtsMsg.value;

              for (let i = 0; i < this.onOtaProgressEvent.length; i++) {
                this.onOtaProgressEvent[i](rtsMsg.value);
              }

              if (this.hasProgressBar) {
                for (let i = 0; i < this.onUpdateProgressBarEvent.length; i++) {
                  this.onUpdateProgressBarEvent[i](
                    Number(rtsMsg.value.current),
                    Number(rtsMsg.value.expected)
                  );
                }
              }

              if (this.waitForResponse == "ota-start") {
                if (rtsMsg.status == 3) {
                  this.resolvePromise(this.waitForResponse, rtsMsg);
                } else if (rtsMsg.status >= 5) {
                  this.rejectPromise(this.waitForResponse, rtsMsg);
                }
              } else if (this.waitForResponse == "ota-cancel") {
                if (rtsMsg.status != 2) {
                  this.resolvePromise(this.waitForResponse, rtsMsg);
                }
              }
              break;
            case Rts.RtsConnection_6Tag.RtsResponse:
              this.rejectPromise(this.waitForResponse, rtsMsg);
              break;
            case Rts.RtsConnection_6Tag.RtsBleshConnectResponse:
              this.resolvePromise(this.waitForResponse, rtsMsg);
              break;
            case Rts.RtsConnection_6Tag.RtsBleshDisconnectResponse:
              this.resolvePromise(this.waitForResponse, rtsMsg);
              break;
            case Rts.RtsConnection_6Tag.RtsBleshToClientRequest:
              {
                this.blesh.send(rtsMsg.value.data);
              }
              break;
            case Rts.RtsConnection_6Tag.RtsSdkProxyResponse:
              this.resolvePromise("sdk", rtsMsg);
              break;
            case Rts.RtsConnection_6Tag.RtsAppConnectionIdResponse:
              this.resolvePromise("connection-id", rtsMsg);
              break;
            case Rts.RtsConnection_6Tag.RtsLogResponse:
              if (rtsMsg.value.exitCode == 0) {
                this.logId = rtsMsg.value.fileId;
                this.logFile = [];
              } else {
                // todo: error case
              }
              break;
            case Rts.RtsConnection_6Tag.RtsFileDownload:
              let chunk = rtsMsg.value;
              if (chunk.fileId == this.logId) {
                this.logFile = this.logFile.concat(chunk.fileChunk);

                for (let i = 0; i < this.onLogProgressEvent.length; i++) {
                  this.onLogProgressEvent[i](rtsMsg.value);
                }

                if (this.hasProgressBar) {
                  for (
                    let i = 0;
                    i < this.onUpdateProgressBarEvent.length;
                    i++
                  ) {
                    this.onUpdateProgressBarEvent[i](
                      chunk.packetNumber,
                      chunk.packetTotal
                    );
                  }
                }

                if (chunk.packetNumber == chunk.packetTotal) {
                  // resolve promise
                  let fileName =
                    "vector-logs-" + RtsCliUtil.getDateString() + ".tar.bz2";
                  for (let i = 0; i < this.onLogsDownloadedEvent.length; i++) {
                    this.onLogsDownloadedEvent[i](fileName, this.logFile);
                  }

                  this.resolvePromise("logs", rtsMsg);
                }
              }
              break;
            default:
              break;
          }
          break;
        }
        default:
          break;
      }
    }
  }

  encrypt(data) {
    let txt = new Uint8Array(data);
    let nonce = new Uint8Array(this.nonces.encrypt);

    let cipher = this.sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(
      txt,
      null,
      null,
      nonce,
      this.cryptoKeys.encrypt
    );

    this.sodium.increment(this.nonces.encrypt);
    return cipher;
  }

  decrypt(cipher) {
    let c = new Uint8Array(cipher);
    let nonce = new Uint8Array(this.nonces.decrypt);

    let data = null;

    try {
      data = this.sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(
        null,
        c,
        null,
        nonce,
        this.cryptoKeys.decrypt
      );

      this.sodium.increment(this.nonces.decrypt);
    } catch (e) {
      console.log("error decrypting");
      this.sessions.deleteSession(this.remoteKeys.publicKey);
      this.sessions.save();
    }

    return data;
  }

  onRtsConnRequest(msg) {
    this.remoteKeys = {};
    this.remoteKeys.publicKey = msg.publicKey;

    let savedSession = this.sessions.getSession(this.remoteKeys.publicKey);
    let isPairing = msg.isPairing;

    if (!isPairing) {
      if (savedSession != null) {
        this.keys = this.sessions.getKeys();
        this.cryptoKeys = {
          encrypt: savedSession.tx,
          decrypt: savedSession.rx,
        };
        this.firstTimePair = false;

        // use saved session
        this.send(
          Rts.RtsConnection_6.NewRtsConnection_6WithRtsConnResponse(
            new Rts.RtsConnResponse(
              Rts.RtsConnType.Reconnection,
              this.keys.publicKey
            )
          )
        );
      } else if (
        this.remoteKeys.publicKey.toString() in this.vectorBle.sessions
      ) {
        let session = this.vectorBle.sessions[
          this.remoteKeys.publicKey.toString()
        ];
        this.keys = session.myKeys;
        this.cryptoKeys = session.cryptoKeys;
        this.firstTimePair = false;

        // use saved session
        this.send(
          Rts.RtsConnection_6.NewRtsConnection_6WithRtsConnResponse(
            new Rts.RtsConnResponse(
              Rts.RtsConnType.Reconnection,
              this.keys.publicKey
            )
          )
        );
      } else {
        this.cancelConnection();
      }
    } else {
      // generate keys
      this.keys = this.sodium.crypto_kx_keypair();
      this.firstTimePair = true;
      let self = this;
      this.connRequestHandle = setTimeout(function () {
        self.cancelConnection();
      }, 3000);
      this.send(
        Rts.RtsConnection_6.NewRtsConnection_6WithRtsConnResponse(
          new Rts.RtsConnResponse(
            Rts.RtsConnType.FirstTimePair,
            this.keys.publicKey
          )
        )
      );
    }
  }

  cancelConnection() {
    let msg =
      "\x1b[91mPairing failed. Double press robot button and try again. You may need to do 'ble-clear'.\x1b[0m";
    for (let i = 0; i < this.onPrintEvent.length; i++) {
      this.onPrintEvent[i](msg);
    }
    this.vectorBle.tryDisconnect();
    for (let i = 0; i < this.onCommandDoneEvent.length; i++) {
      this.onCommandDoneEvent[i]();
    }
  }

  onRtsNonceMessage(msg) {
    if (this.connRequestHandle != null) {
      clearTimeout(this.connRequestHandle);
      this.connRequestHandle = null;
    }
    this.nonces = {};

    this.nonces.decrypt = msg.toDeviceNonce;
    this.nonces.encrypt = msg.toRobotNonce;

    if (!this.firstTimePair) {
      // No need to enter pin
      this.send(
        Rts.RtsConnection_6.NewRtsConnection_6WithRtsAck(
          new Rts.RtsAck(Rts.RtsConnection_6Tag.RtsNonceMessage)
        )
      );

      this.encrypted = true;
      return;
    }

    for (let i = 0; i < this.onReadyForPinEvent.length; i++) {
      this.onReadyForPinEvent[i](this);
    }
  }

  onRtsChallengeMessage(msg) {
    this.send(
      Rts.RtsConnection_6.NewRtsConnection_6WithRtsChallengeMessage(
        new Rts.RtsChallengeMessage(msg.number + 1)
      )
    );
  }

  onRtsChallengeSuccessMessage(msg) {
    this.keysAuthorized = true;
    this.vectorBle.sessions[this.remoteKeys.publicKey.toString()] = {
      cryptoKeys: this.cryptoKeys,
      myKeys: this.keys,
    };

    // successfully received rtsChallengeSuccessMessage
    for (let i = 0; i < this.onEncryptedConnectionEvent.length; i++) {
      this.onEncryptedConnectionEvent[i](this);
    }
  }

  storePromiseMethods(str, resolve, reject) {
    this.promiseKeys[str] = {};
    this.promiseKeys[str].resolve = resolve;
    this.promiseKeys[str].reject = reject;
  }

  resolvePromise(str, msg) {
    if (this.promiseKeys[str] != null) {
      this.promiseKeys[str].resolve(msg);
      this.promiseKeys[str] = null;
    }
  }

  rejectPromise(str, msg) {
    if (this.promiseKeys[str] != null) {
      this.promiseKeys[str].reject(msg);
      this.promiseKeys[str] = null;
    }
  }

  cliResolve(msg) {
    let output = "";

    if (msg == null) {
      output = "Request timed out.";
    } else {
      output = RtsCliUtil.msgToStr(msg.value);
    }

    for (let i = 0; i < this.onCliResponseEvent.length; i++) {
      this.onCliResponseEvent[i](output);
    }

    this.waitForResponse = "";
  }

  cliPrint(output) {
    for (let i = 0; i < this.onPrintEvent.length; i++) {
      this.onPrintEvent[i](output);
    }
  }

  //
  // <!-- API Promises
  //

  doWifiScan() {
    let self = this;
    let p = new Promise(function (resolve, reject) {
      self.storePromiseMethods("wifi-scan", resolve, reject);
      self.send(
        Rts.RtsConnection_6.NewRtsConnection_6WithRtsWifiScanRequest(
          new Rts.RtsWifiScanRequest()
        )
      );
    });

    return p;
  }

  doWifiConnect(ssid, password, auth, timeout) {
    let self = this;
    let p = new Promise(function (resolve, reject) {
      self.storePromiseMethods("wifi-connect", resolve, reject);
      self.send(
        Rts.RtsConnection_6.NewRtsConnection_6WithRtsWifiConnectRequest(
          new Rts.RtsWifiConnectRequest(
            RtsCliUtil.convertStrToHex(ssid),
            password,
            timeout,
            auth,
            false
          )
        )
      );
    });

    return p;
  }

  doWifiForget(ssid) {
    let self = this;
    let p = new Promise(function (resolve, reject) {
      self.storePromiseMethods("wifi-forget", resolve, reject);
      let deleteAll = ssid == "!all";
      let hexSsid = deleteAll ? "" : RtsCliUtil.convertStrToHex(ssid);
      self.send(
        Rts.RtsConnection_6.NewRtsConnection_6WithRtsWifiForgetRequest(
          new Rts.RtsWifiForgetRequest(deleteAll, hexSsid)
        )
      );
    });

    return RtsCliUtil.addTimeout(p);
  }

  doWifiAp(enable) {
    let self = this;
    let p = new Promise(function (resolve, reject) {
      self.storePromiseMethods("wifi-ap", resolve, reject);
      self.send(
        Rts.RtsConnection_6.NewRtsConnection_6WithRtsWifiAccessPointRequest(
          new Rts.RtsWifiAccessPointRequest(enable.toLowerCase() == "true")
        )
      );
    });

    return RtsCliUtil.addTimeout(p);
  }

  doWifiIp() {
    let self = this;
    let p = new Promise(function (resolve, reject) {
      self.storePromiseMethods("wifi-ip", resolve, reject);
      self.send(
        Rts.RtsConnection_6.NewRtsConnection_6WithRtsWifiIpRequest(
          new Rts.RtsWifiIpRequest()
        )
      );
    });

    return RtsCliUtil.addTimeout(p);
  }

  doStatus() {
    let self = this;
    let p = new Promise(function (resolve, reject) {
      self.storePromiseMethods("status", resolve, reject);
      self.send(
        Rts.RtsConnection_6.NewRtsConnection_6WithRtsStatusRequest(
          new Rts.RtsStatusRequest()
        )
      );
    });

    return RtsCliUtil.addTimeout(p);
  }

  doAnkiAuth(sessionToken) {
    let self = this;
    let p = new Promise(function (resolve, reject) {
      self.storePromiseMethods("anki-auth", resolve, reject);
      self.send(
        Rts.RtsConnection_6.NewRtsConnection_6WithRtsCloudSessionRequest_5(
          new Rts.RtsCloudSessionRequest_5(sessionToken, "", "")
        )
      );
    });

    return p;
  }

  doOtaStart(url) {
    let self = this;
    let p = new Promise(function (resolve, reject) {
      self.storePromiseMethods("ota-start", resolve, reject);
      self.send(
        Rts.RtsConnection_6.NewRtsConnection_6WithRtsOtaUpdateRequest(
          new Rts.RtsOtaUpdateRequest(url)
        )
      );
    });

    return p;
  }

  doOtaCancel(url) {
    let self = this;
    let p = new Promise(function (resolve, reject) {
      self.storePromiseMethods("ota-cancel", resolve, reject);
      self.send(
        Rts.RtsConnection_6.NewRtsConnection_6WithRtsOtaCancelRequest(
          new Rts.RtsOtaCancelRequest(url)
        )
      );
    });

    return p;
  }

  doConnectionId() {
    let self = this;
    let p = new Promise(function (resolve, reject) {
      self.storePromiseMethods("connection-id", resolve, reject);
      self.send(
        Rts.RtsConnection_6.NewRtsConnection_6WithRtsAppConnectionIdRequest(
          new Rts.RtsAppConnectionIdRequest(url)
        )
      );
    });

    return RtsCliUtil.addTimeout(p);
  }

  doLog() {
    let self = this;
    let p = new Promise(function (resolve, reject) {
      self.storePromiseMethods("logs", resolve, reject);
      self.send(
        Rts.RtsConnection_6.NewRtsConnection_6WithRtsLogRequest(
          new Rts.RtsLogRequest(0, [])
        )
      );
    });

    return p;
  }

  doSdk(clientGuid, id, path, json) {
    let self = this;
    let p = new Promise(function (resolve, reject) {
      self.storePromiseMethods("sdk", resolve, reject);
      self.send(
        Rts.RtsConnection_6.NewRtsConnection_6WithRtsSdkProxyRequest(
          new Rts.RtsSdkProxyRequest(clientGuid, id, path, json)
        )
      );
    });

    return p;
  }

  doBlesh(port) {
    let self = this;
    let p = new Promise(function (resolve, reject) {
      self.storePromiseMethods("blesh", resolve, reject);

      // start ssh server
      self.blesh.start(port).then(function () {
        self.blesh.onReceiveData(function (data) {
          self.send(
            Rts.RtsConnection_6.NewRtsConnection_6WithRtsBleshToServerRequest(
              new Rts.RtsBleshToServerRequest(data)
            )
          );
        });

        self.send(
          Rts.RtsConnection_6.NewRtsConnection_6WithRtsBleshConnectRequest(
            new Rts.RtsBleshConnectRequest()
          )
        );
      });
    });

    return p;
  }

  doBleshStop() {
    let self = this;
    let p = new Promise(function (resolve, reject) {
      self.storePromiseMethods("blesh-stop", resolve, reject);

      // stop ssh server
      self.blesh.stop();

      self.send(
        Rts.RtsConnection_6.NewRtsConnection_6WithRtsBleshDisconnectRequest(
          new Rts.RtsBleshDisconnectRequest()
        )
      );
    });

    return p;
  }

  requireArgs(args, num) {
    if (args.length < num) {
      console.log(
        '"' + args[0] + '" command requires ' + (num - 1) + " arguments"
      );
      return false;
    }

    return true;
  }

  //
  // API Promises -->
  //
  setCliHelp() {
    let helpArgs = {
      "wifi-connect": {
        args: 2,
        des: "Connect Vector to a WiFi network.",
        help: "wifi-connect {ssid} {password}",
      },
      "wifi-scan": {
        args: 0,
        des: "Get WiFi networks that Vector can scan.",
        help: "wifi-scan",
      },
      "wifi-ip": {
        args: 0,
        des: "Get Vector's WiFi IPv4/IPv6 addresses.",
        help: "wifi-ip",
      },
      "wifi-ap": {
        args: 1,
        des: "Enable/Disable Vector as a WiFi access point.",
        help: "wifi-ap {true|false}",
      },
      "wifi-forget": {
        args: 1,
        des: "Forget a WiFi network, or optionally all of them.",
        help: "wifi-forget {ssid|!all}",
      },
      "ota-start": {
        args: 1,
        des: "Tell Vector to start an OTA update with the given URL.",
        help: "ota-start {url}",
      },
      "ota-progress": {
        args: 0,
        des: "Get the current OTA progress.",
        help: "ota-progress",
      },
      "ota-cancel": {
        args: 0,
        des: "Cancel an OTA in progress.",
        help: "ota-cancel",
      },
      logs: {
        args: 0,
        des: "Download logs over BLE from Vector.",
        help: "logs",
      },
      status: {
        args: 0,
        des: "Get status information from Vector.",
        help: "status",
      },
      "anki-auth": {
        args: 1,
        des: "Provision Vector with Anki account.",
        help: "anki-auth {session_token}",
      },
      "connection-id": {
        args: 1,
        des: "Give Vector a DAS/analytics id for this BLE session.",
        help: "connection-id {id}",
      },
      sdk: {
        args: 3,
        des: "Send an SDK request over BLE.",
        help: "sdk {path} {json} {client_app_guid}",
      },
      blesh: {
        args: 1,
        des:
          'Tunnel SSH over BLE. In other shell, do "ssh root@127.0.0.1 -p {port}"',
        help: "blesh {port}",
      },
    };

    this.helpArgs = helpArgs;

    return helpArgs;
  }

  // returns whether resolved immediately
  handleCli(args) {
    let self = this;
    let cmd = args[0];
    let r = function (msg) {
      self.cliResolve(msg);
    };
    let output = "";

    switch (cmd) {
      case "quit":
      case "exit":
        self.vectorBle.tryDisconnect();
        return false;
      case "help":
        output = RtsCliUtil.printHelp(self.helpArgs);
        for (let i = 0; i < this.onPrintEvent.length; i++) {
          this.onPrintEvent[i](output);
        }
        break;
      case "wifi-scan":
        self.waitForResponse = "wifi-scan";
        self.doWifiScan().then(function (msg) {
          self.wifiScanResults = msg.value.scanResult;
          self.cliResolve(msg);
        }, r);
        break;
      case "wifi-connect":
        if (!self.requireArgs(args, 3)) break;

        self.waitForResponse = "wifi-connect";

        let ssid = args[1];
        let hasScanned = false;
        let result = null;

        for (let i = 0; i < self.wifiScanResults.length; i++) {
          let r = self.wifiScanResults[i];

          if (ssid == RtsCliUtil.convertHexToStr(r.wifiSsidHex)) {
            result = r;
            hasScanned = true;
            break;
          }
        }

        self
          .doWifiConnect(ssid, args[2], hasScanned ? result.authType : 6, 15)
          .then(function (msg) {
            self.cliResolve(msg);
          }, r);

        break;
      case "status":
        self.waitForResponse = "status";
        self.doStatus().then(function (msg) {
          self.cliResolve(msg);
        }, r);
        break;
      case "wifi-ip":
        self.waitForResponse = "wifi-ip";
        self.doWifiIp().then(function (msg) {
          self.cliResolve(msg);
        }, r);
        break;
      case "wifi-forget":
        if (!self.requireArgs(args, 2)) break;

        self.waitForResponse = "wifi-forget";
        self.doWifiForget(args[1]).then(function (msg) {
          self.cliResolve(msg);
        }, r);
        break;
      case "wifi-ap":
        if (!self.requireArgs(args, 2)) break;

        self.waitForResponse = "wifi-ap";
        self.doWifiAp(args[1]).then(function (msg) {
          self.cliResolve(msg);
        }, r);
        break;
      case "anki-auth":
        if (!self.requireArgs(args, 2)) break;

        self.waitForResponse = "anki-auth";
        self.doAnkiAuth(args[1]).then(function (msg) {
          self.cliResolve(msg);
        }, r);
        break;
      case "ota-start":
        if (!self.requireArgs(args, 2)) break;

        self.waitForResponse = "ota-start";
        self.hasProgressBar = true;
        output = "Updating robot with OTA from " + args[1];
        for (let i = 0; i < this.onPrintEvent.length; i++) {
          this.onPrintEvent[i](output);
        }
        for (let i = 0; i < this.onNewProgressBarEvent.length; i++) {
          this.onNewProgressBarEvent[i]();
        }

        self.doOtaStart(args[1]).then(function (msg) {
          self.otaProgress.value = msg.value;
          self.hasProgressBar = false;
          self.cliResolve(msg);
        }, r);
        break;
      case "ota-cancel":
        self.waitForResponse = "ota-cancel";
        self.doOtaCancel().then(function (msg) {
          self.otaProgress.value = msg.value;
          self.cliResolve(msg);
        }, r);
        break;
      case "ota-progress":
        if (self.otaProgress.value != null) {
          console.log(
            RtsCliUtil.rtsOtaUpdateResponseStr(self.otaProgress.value)
          );
        }

        break;
      case "connection-id":
        if (!self.requireArgs(args, 2)) break;

        self.waitForResponse = "connection-id";
        self.doConnectionId().then(function (msg) {
          self.cliResolve(msg);
        }, r);
        break;
      case "sdk":
        if (!self.requireArgs(args, 3)) break;

        self.waitForResponse = "sdk";
        self
          .doSdk(args[3], RtsCliUtil.makeId(), args[1], args[2])
          .then(function (msg) {
            self.cliResolve(msg);
          }, r);
        break;
      case "blesh":
        if (!Blesh.isSupported()) {
          self.cliPrint(
            "blesh is not supported on this platform. Try using node-client."
          );
          break;
        }

        if (!self.requireArgs(args, 2)) break;

        if (args[1] == "stop") {
          self.waitForResponse = "blesh-stop";
          self.doBleshStop().then(function (msg) {
            self.cliResolve(msg);
          }, r);
          break;
        }

        self.waitForResponse = "blesh";
        self.doBlesh(args[1]).then(function (msg) {
          self.cliResolve(msg);
        }, r);

        break;
      case "logs":
        console.log(
          "downloading logs over BLE will probably take about 30 seconds..."
        );
        self.waitForResponse = "logs";
        self.hasProgressBar = true;
        output = "Downloading logs...";
        for (let i = 0; i < this.onPrintEvent.length; i++) {
          this.onPrintEvent[i](output);
        }
        for (let i = 0; i < this.onNewProgressBarEvent.length; i++) {
          this.onNewProgressBarEvent[i]();
        }

        self.doLog().then(function (msg) {
          self.hasProgressBar = false;
          self.cliResolve(msg);
        }, r);
        break;
      default:
        self.waitForResponse = "";
        break;
    }

    if (self.waitForResponse == "") {
      return true;
    }

    return false;
  }
}

module.exports = { RtsV6Handler };

},{"./blesh.js":2,"./messageExternalComms.js":5,"./rtsCliUtil.js":6}],12:[function(require,module,exports){
/* Copyright (c) 2019-2020 Digital Dream Labs. See LICENSE file for details. */

var { RtsCliUtil } = require("./rtsCliUtil.js");

class Sessions {
  constructor() {
    this.sessions = {};
    this.getSessions();
  }

  getSessions() {
    try {
      this.sessions = JSON.parse(Sessions.getCookie("sessions"));
      if ("remote-keys" in this.sessions) {
        let remoteKeys = Object.keys(this.sessions["remote-keys"]);
        for (let i = 0; i < remoteKeys.length; i++) {
          this.sessions["remote-keys"][
            remoteKeys[i]
          ].tx = Sessions.keyDictToArray(
            this.sessions["remote-keys"][remoteKeys[i]].tx
          );
          this.sessions["remote-keys"][
            remoteKeys[i]
          ].rx = Sessions.keyDictToArray(
            this.sessions["remote-keys"][remoteKeys[i]].rx
          );
        }
      }

      if ("id-keys" in this.sessions) {
        this.sessions["id-keys"].publicKey = Sessions.keyDictToArray(
          this.sessions["id-keys"].publicKey
        );
        this.sessions["id-keys"].privateKey = Sessions.keyDictToArray(
          this.sessions["id-keys"].privateKey
        );
      }
    } catch (e) {
      console.log(e);
      this.sessions = {};
    }
  }

  // ---------------------------------------------------------------------------

  setLastVector(name) {
    this.sessions["last-vec"] = name;
  }

  getLastVector() {
    return this.sessions["last-vec"];
  }

  // ---------------------------------------------------------------------------

  setEnv(env) {
    this.sessions["env"] = env;
  }

  getEnv() {
    return this.sessions["env"];
  }

  // ---------------------------------------------------------------------------

  setKeys(publicKey, privateKey) {
    this.sessions["id-keys"] = { publicKey: publicKey, privateKey: privateKey };
  }

  getKeys() {
    return this.sessions["id-keys"];
  }

  // ---------------------------------------------------------------------------

  setViewMode(view) {
    this.sessions["view-mode"] = view;
  }

  getViewMode() {
    let mode = this.sessions["view-mode"];
    if (mode == null) {
      mode = 1;
    }

    return mode;
  }

  // ---------------------------------------------------------------------------

  setSession(remoteKey, name, encryptKey, decryptKey) {
    if (!("remote-keys" in this.sessions)) {
      this.sessions["remote-keys"] = {};
    }

    this.sessions["remote-keys"][RtsCliUtil.keyToHexStr(remoteKey)] = {
      name: name,
      tx: encryptKey,
      rx: decryptKey,
    };
  }

  getSession(remoteKey) {
    if (!("remote-keys" in this.sessions)) {
      return null;
    }

    if (RtsCliUtil.keyToHexStr(remoteKey) in this.sessions["remote-keys"]) {
      return this.sessions["remote-keys"][RtsCliUtil.keyToHexStr(remoteKey)];
    }

    return null;
  }

  clearSessions() {
    this.sessions["remote-keys"] = {};
  }

  deleteSession(remoteKey) {
    if (!("remote-keys" in this.sessions)) {
      return;
    }

    if (RtsCliUtil.keyToHexStr(remoteKey) in this.sessions["remote-keys"]) {
      delete this.sessions["remote-keys"];
    }
  }

  // ---------------------------------------------------------------------------

  // ---------------------------------------------------------------------------

  save() {
    Sessions.setCookie("sessions", JSON.stringify(this.sessions));
  }

  static keyDictToArray(dict) {
    let dKeys = Object.keys(dict);
    let ret = new Uint8Array(dKeys.length);

    for (let j = 0; j < dKeys.length; j++) {
      ret[j] = dict[dKeys[j]];
    }

    return ret;
  }

  static getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(";");
    for (var i = 0; i < ca.length; i++) {
      var c = ca[i];
      while (c.charAt(0) == " ") {
        c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
      }
    }
    return "";
  }

  static setCookie(cname, cvalue) {
    document.cookie = cname + "=" + cvalue + ";";
  }
}

module.exports = { Sessions };

},{"./rtsCliUtil.js":6}],13:[function(require,module,exports){
/* Copyright (c) 2019-2020 Digital Dream Labs. See LICENSE file for details. */

var { Stack } = require("./stack.js");
const STACK = "stacks";

class Settings {
  constructor(settingsJson) {
    this.stackDict = {};
    this.parse(settingsJson);
  }

  parse(json) {
    var stackJson = json[STACK];

    if (stackJson !== undefined) {
      for (const name in stackJson) {
        this.stackDict[name] = new Stack(name, stackJson[name]);
      }
    }
  }

  getStackNames() {
    return Object.keys(this.stackDict);
  }

  getStack(name) {
    return this.stackDict[name];
  }
}

module.exports = { Settings };

},{"./stack.js":14}],14:[function(require,module,exports){
/* Copyright (c) 2019-2020 Digital Dream Labs. See LICENSE file for details. */

const ACCOUNT_ENDPOINTS = "accountEndpoints";
const API_KEYS = "apiKeys";

const TYPE = {
  CLOUD: "cloud",
  LOCAL: "local",
};

class Stack {
  constructor(name, stackJson) {
    this.name = name;
    this.apiKeys = null;
    this.accountEndpoints = null;
    this.parse(stackJson);
  }

  parse(json) {
    if (json[API_KEYS] !== undefined) {
      this.apiKeys = json[API_KEYS];
    }

    if (json[ACCOUNT_ENDPOINTS] !== undefined) {
      this.accountEndpoints = json[ACCOUNT_ENDPOINTS];
    }
  }

  getAccountEndpoints() {
    return this.accountEndpoints;
  }

  getApiKeys() {
    return this.apiKeys;
  }
}

module.exports = { Stack, TYPE };

},{}],15:[function(require,module,exports){
/* Copyright (c) 2019-2020 Digital Dream Labs. See LICENSE file for details. */

var { BleMessageProtocol } = require("./bleMessageProtocol.js");

class VectorBluetooth {
  constructor() {
    this.vectorService = 0xfee3;
    this.readCharService = "7d2a4bda-d29b-4152-b725-2491478c5cd7";
    this.writeCharService = "30619f2d-0f54-41bd-a65a-7588d8c85b45";
    this.pairingChar = "p".charCodeAt(0);
    this.maxPacketSize = 20;
    this.bleMsgProtocol = null;
    this.readChar;
    this.writeChar;
    this.onReceiveEvent = [];
    this.onCancelSelectEvent = [];
    this.onDisconnectedEvent = [];
    this.writeQueue = [];
    this.writeReady = true;
    let self = this;
    this.tickInterval = window.setInterval(function () {
      self.tick();
    }, 70);
    this.sessions = {};

    this.initializeBleProtocol();
  }

  initializeBleProtocol() {
    let self = this;
    this.bleMsgProtocol = new BleMessageProtocol(this.maxPacketSize);
    this.bleMsgProtocol.setDelegate(this);
    this.bleMsgProtocol.onSendRaw(function (buffer) {
      self.sendMessage(Uint8Array.from(buffer), false);
    });
  }

  send(arr) {
    this.bleMsgProtocol.sendMessage(arr);
  }

  onReceive(fnc) {
    this.onReceiveEvent.push(fnc);
  }

  onCancelSelect(fnc) {
    this.onCancelSelectEvent.push(fnc);
  }

  onDisconnected(fnc) {
    this.onDisconnectedEvent.push(fnc);
  }

  onReceiveUnsubscribe(obj) {
    for (let i = 0; i < this.onReceiveEvent.length; i++) {
      if (obj == this.onReceiveEvent[i]) {
        this.onReceiveEvent.splice(i, 1);
        return;
      }
    }
  }

  handleReceive(data) {
    let listeners = this.onReceiveEvent.slice(0);

    for (let i = 0; i < listeners.length; i++) {
      listeners[i].receive(data);
    }
  }

  handleDisconnected() {
    this.bleName = "";
    this.bleDevice = null;

    for (let i = 0; i < this.onDisconnectedEvent.length; i++) {
      this.onDisconnectedEvent[i]();
    }
  }

  tryConnect(vectorFilter) {
    let self = this;
    let f = { services: [this.vectorService] };
    if (vectorFilter != null) {
      f["name"] = vectorFilter;
    }

    navigator.bluetooth
      .requestDevice({
        filters: [f],
        optionalServices: [],
      })
      .then(
        (device) => {
          self.bleName = device.name;
          self.bleDevice = device;
          self.bleDevice.addEventListener(
            "gattserverdisconnected",
            function () {
              self.handleDisconnected();
            }
          );
          self.connectToDevice(device);
        },
        (error) => {
          // user didn't select any peripherals
          for (let i = 0; i < this.onCancelSelectEvent.length; i++) {
            this.onCancelSelectEvent[i]();
          }
        }
      );
  }

  tryDisconnect() {
    if (this.bleDevice) {
      this.bleDevice.gatt.disconnect();
    }
  }

  connectToDevice(device) {
    device.gatt
      .connect()
      .then((server) => {
        return server.getPrimaryService(this.vectorService);
      })
      .then((service) => {
        let readChar = service.getCharacteristic(this.readCharService);
        let writeChar = service.getCharacteristic(this.writeCharService);
        return Promise.all([readChar, writeChar]);
      })
      .then((characteristics) => {
        let self = this;
        self.readChar = characteristics[0];
        self.writeChar = characteristics[1];

        characteristics[1].startNotifications().then((ch) => {
          ch.addEventListener("characteristicvaluechanged", function (event) {
            self.bleMsgProtocol.receiveRawBuffer(
              Array.from(new Uint8Array(event.target.value.buffer))
            );
          });
        });
      });
  }

  forceSendMsg() {
    if (this.writeQueue.length > 0) {
      let msg = this.writeQueue[0];
      this.writeReady = false;
      let self = this;
      this.readChar.writeValue(msg).then(
        function () {
          self.writeReady = true;
        },
        function (err) {
          console.log(err);
        }
      );
      this.writeQueue.shift();
    }
  }

  trySendMsg() {
    if (this.writeReady) {
      this.forceSendMsg();
    }
  }

  sendMessage(msg) {
    this.writeQueue.push(msg);
    this.trySendMsg();
  }

  tick() {
    this.trySendMsg();
  }
}

module.exports = { VectorBluetooth };

},{"./bleMessageProtocol.js":1}]},{},[4]);
