/*
* Copyright (c) 2020 SECOM CO., LTD. All Rights reserved.
*
* SPDX-License-Identifier: BSD-2-Clause
*/
var express = require('express');
var router = express.Router();
//var jws = require('jws');
var teepP = require("../teep-p");
var jose = require('node-jose');
var cbor = require('cbor');
var fs = require('fs');
var nconf = require('nconf');
nconf.use('file', { file: './config.json' });
nconf.load();

var keystore = jose.JWK.createKeyStore();
var tee_pubkey = fs.readFileSync("./key/" + nconf.get('key:TEE_pub'), function (err, data) {
   console.log(data);
});

var tam_pubkey = fs.readFileSync("./key/" + nconf.get('key:TAM_pub'), function (err, data) {
   console.log(data);
});

var tam_privkey = fs.readFileSync("./key/" + nconf.get('key:TAM_priv'), function (err, data) {
   console.log(data);
});

var tee_privkey = fs.readFileSync("./key/" + nconf.get('key:TEE_priv'), function (err, data) {
   console.log(data);
});

var jwk_tam_privkey, jwk_tee_pubkey, jwk_tee_privkey, jwk_tam_pubkey;

keystore.add(tee_pubkey, "json").then(function (result) {
   jwk_tee_pubkey = result;
});
keystore.add(tam_privkey, "json").then(function (result) {
   jwk_tam_privkey = result;
});
keystore.add(tee_privkey, "json").then(function (result) {
   jwk_tee_privkey = result;
});
keystore.add(tam_pubkey, "json").then(function (result) {
   jwk_tam_pubkey = result;
});

router.get('/', function (req, res, next) {
   var param = { "key": "This is sample" };
   res.header('Content-Type', 'application/json; charset=utf-8');
   res.send(param);
});

let teepImplHandler = function (req, body) {
   let ret = null;
   if (req.headers['content-length'] == 0) {
      // body is empty
      console.log("TAM API launch");
      //Call OTrP Implementation's ProcessConnect API
      ret = teepP.initMessage();
      //res.send(JSON.stringify(ret));
      //res.end();
      return ret;
   } else {
      console.log("TAM ProcessTEEP-Pmessage instance");
      //console.log(body);

      ret = teepP.parse(body, req);
      console.log("TAM ProcessTEEP-Pmessage response");
      console.log(ret);
      //
      if (ret == null) {
         //invalid message from client device
         console.log("no content");
         //res.set(null);
         //res.status(204).send('no content');
         //res.end();
         return ret;
      } else {
         //send valid response to client device
         return ret;
         //res.set(ret);
         //res.status(200);
         //res.send(JSON.stringify(ret));
         //res.end();
      }
      return;
   }
}

// no encrypt
router.post('/tam', function (req, res, next) {
   // check POST content
   console.log("Access from: " + req.ip);
   console.log(req.headers);
   console.log(req.body);
   let ret = null;

   //set response header
   res.set({
      'Content-Type': 'application/teep+json',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'",
      'Referrer-Policy': 'no-referrer'
   });

   ret = teepImplHandler(req, req.body);

   if (ret == null) {
      res.set(null);
      res.status(204);
      res.end();
   } else {
      //res.set(ret);
      res.send(JSON.stringify(ret));
      res.end();
   }

   return;
   //if (!Object.keys(req.body).length) {
   // if (req.headers['content-length'] == 0) {
   //    // body is empty
   //    console.log("TAM API launch");
   //    //Call OTrP Implementation's ProcessConnect API
   //    ret = teepP.initMessage();
   //    res.send(JSON.stringify(ret));
   //    res.end();
   //    return;
   // } else {
   //    console.log("TAM ProcessTEEP-Pmessage instance");
   //    console.log(req.body);

   //    ret = teepP.parse(req.body);
   //    //
   //    if (ret == null) {
   //       //invalid message from client device
   //       console.log("no content");
   //       res.set(null);
   //       res.status(204).send('no content');
   //       res.end();
   //    } else {
   //       //send valid response to client device
   //       res.set(ret);
   //       res.status(200);
   //       res.send(JSON.stringify(ret));
   //       res.end();
   //    }
   //    return;
   // }
});

// no encrypt for TA delete
router.post('/tam_delete', function (req, res, next) {
   // check POST content
   console.log(req.headers);
   console.log(req.body);
   let ret = null;

   //set response header
   res.set({
      'Content-Type': 'application/teep+json',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'",
      'Referrer-Policy': 'no-referrer'
   });

   ret = teepImplHandler(req, req.body);

   if (ret == null) {
      res.set(null);
      res.status(204);
      res.end();
   } else {
      //res.set(ret);
      res.send(JSON.stringify(ret));
      res.end();
   }

   return;
});

//CBOR (no encrypt and sign)
router.post('/tam_cbor', function (req, res, next) {
   // check POST content
   console.log("Access from: " + req.ip);
   console.log(req.headers);
   console.log(req.body);
   let ret = null;
   let parsedCbor = null;

   //set response header
   res.set({
      'Content-Type': 'application/teep+cbor',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'",
      'Referrer-Policy': 'no-referrer'
   });

   if (req.headers['content-length'] != 0) {
      try {
         parsedCbor = cbor.decodeFirstSync(req.body);
      } catch (e) {
         console.log("Cbor parse error:" + e);
         res.status(400);
         res.end();
         return;
      }
      console.log(teepP.parseCborArray(parsedCbor));
      ret = teepImplHandler(req, teepP.parseCborArray(parsedCbor));
   } else {
      //Initialize TEEP-P
      ret = teepImplHandler(req, req.body);
   }

   if (ret == null) {
      res.set(null);
      res.status(204);
      res.end();
   } else {
      //console.log(ret);
      let cborResponseArray = teepP.buildCborArray(ret);
      console.log(cborResponseArray);
      res.send(cbor.encode(cborResponseArray));
      res.end();
   }

   return;
});

//COSE (with sign)　@TODO
router.post('/tam_cose', function (req, res, next) {
   // // check POST content
   // console.log("Access from: " + req.ip);
   // console.log(req.headers);
   // console.log(req.body);
   // let ret = null;
   // let parsedCbor = null;

   // //set response header
   // res.set({
   //    'Content-Type': 'application/teep+cbor',
   //    'Cache-Control': 'no-store',
   //    'X-Content-Type-Options': 'nosniff',
   //    'Content-Security-Policy': "default-src 'none'",
   //    'Referrer-Policy': 'no-referrer'
   // });

   // if (req.headers['content-length'] != 0) {
   //    try {
   //       parsedCbor = cbor.decodeFirstSync(req.body);
   //    } catch (e) {
   //       console.log("Cbor parse error:" + e);
   //       res.status(400);
   //       res.end();
   //       return;
   //    }
   //    console.log(parsedCbor);
   // }
   // //reconstruct TOKEN field?(workaround, To Be Fix!)
   // //parsedCbor.TOKEN = "hoge";

   // ret = teepImplHandler(req, parsedCbor.get(2));
   // if (ret == null) {
   //    res.set(null);
   //    res.status(204);
   //    res.end();
   // } else {
   //    //res.set(ret);
   //    //TOKEN: string => bstr
   //    let buf = new ArrayBuffer(ret.TOKEN);
   //    let dv = new DataView(buf);
   //    dv.setUint8(0, 3);
   //    ret.TOKEN = buf;

   //    let cborResponse = new cbor.Map();
   //    Object.keys(ret).forEach(function (key) {
   //       cborResponse.set(key, ret[key]);
   //    });
   //    //outer_wrapper
   //    let outerWrapper = new cbor.Map();
   //    outerWrapper.set(1, null); //nil
   //    outerWrapper.set(2, cborResponse);
   //    res.send(cbor.encode(outerWrapper));
   //    res.end();
   // }

   return;
});

let signAndEncrypt = function (data) {
   const p = new Promise((resolve, reject) => {
      jose.JWS.createSign({ format: "flattened" }, jwk_tee_privkey).update(JSON.stringify(data)).final().then(
         function (result) {
            console.log(result);
            console.log(typeof result);
            //signedRequest = result;
            jose.JWE.createEncrypt({ format: "flattened", fields: { alg: 'RSA1_5' } }, jwk_tam_privkey)
               .update(JSON.stringify(result))
               .final().then(
                  async function (ret) {
                     console.log(ret);
                     val = ret;
                     //return ret;
                     resolve(ret);
                  }
               );
         }
      );
   });
   return p;
};


// obsolete codes (JOSE implementations)
// //with encrypt
// router.post('/tam_jose_s_e', function (req, res, next) {
//    // check POST content
//    console.log(req.headers);
//    console.log(req.body); // encrypted body
//    let ret = null;

//    //set response header
//    res.set({
//       'Content-Type': 'application/teep+json',
//       'Cache-Control': 'no-store',
//       'X-Content-Type-Options': 'nosniff',
//       'Content-Security-Policy': "default-src 'none'",
//       'Referrer-Policy': 'no-referrer'
//    });

//    //decrypt & verify
//    let plainRequest = null;
//    let nullPromise = new Promise(function (resolve, reject) {
//       resolve(null);
//    });
//    console.log(req.body);
//    console.log(typeof req.body);
//    console.log(req.headers['content-length']);
//    let verifyReq = null;
//    if (req.headers['content-length'] == 0) {
//       console.log("null request");
//       verifyReq = new Promise(function (resolve, reject) {
//          let dummyObj = new Object();
//          dummyObj.payload = "{}";
//          resolve(dummyObj);
//       });
//    } else {
//       const decryptReq = jose.JWE.createDecrypt(jwk_tam_privkey)
//          .decrypt(req.body);
//       verifyReq = decryptReq.then(function (x) {
//          console.log("[verifyReq]");
//          console.log(x);
//          console.log(x.payload.toString());
//          let temp = JSON.parse(x.payload);
//          return jose.JWS.createVerify(keystore).verify(temp);
//       });
//    }

//    const signRes = verifyReq.then(function (x) {
//       console.log("[signRes]");
//       console.log(x.payload.toString());
//       let response = teepImplHandler(req, JSON.parse(x.payload.toString()));
//       if (response == null) {
//          return nullPromise;
//       } else {
//          return jose.JWS.createSign({ format: 'flattened' }, jwk_tam_privkey).update(JSON.stringify(response)).final();
//       }
//    })
//    const encryptRes = signRes.then(function (x) {
//       console.log("[encryptRes]");
//       console.log(x);
//       if (x == null) {
//          return nullPromise;
//       } else {
//          return jose.JWE.createEncrypt({ fields: { alg: 'RSA1_5' }, format: 'flattened' }, jwk_tee_pubkey).update(Buffer.from(JSON.stringify(x))).final();
//       }
//    });
//    const finalize = encryptRes.then(function (x) {
//       console.log("[finally sending]");
//       console.log(x);
//       if (x == null) {
//          res.set(null);
//          res.status(204);
//          res.end();
//       } else {
//          //res.set(ret);
//          res.send(JSON.stringify(x));
//          res.end();
//       }
//    });
//    //console.log(plainRequest);
//    // jose.JWS.createVerify(keystore)
//    //    .verify(JSON.stringify(plainRequest))
//    //    .then(function (result) {
//    //       console.log(result);
//    // });
//    return;

//    //process content
//    // ret = teepImplHandler(plainRequest);

//    // //encrypt(TBF)
//    // let encryptedResponse = null;
//    // jose.JWE.createEncrypt(keystore)
//    //    .update(ret)
//    //    .final()
//    //    .then(function(x){
//    //       encryptedResponse = x;
//    //    });

//    // if (ret == null) {
//    //    res.set(null);
//    //    res.status(204);
//    //    res.end();
//    // } else {
//    //    //res.set(ret);
//    //    res.send(JSON.stringify(encryptedResponse));
//    //    res.end();
//    // }

//    // return;


// });

// //with encrypt2(enc-then-sign)
// router.post('/tam_jose', function (req, res, next) {
//    // check POST content
//    console.log(req.headers);
//    console.log(req.body); // encrypted body
//    let ret = null;

//    //set response header
//    res.set({
//       'Content-Type': 'application/teep+json',
//       'Cache-Control': 'no-store',
//       'X-Content-Type-Options': 'nosniff',
//       'Content-Security-Policy': "default-src 'none'",
//       'Referrer-Policy': 'no-referrer'
//    });

//    //~~decrypt & verify~~ => verify & decrypt
//    let plainRequest = null;
//    let nullPromise = new Promise(function (resolve, reject) {
//       resolve(null);
//    });
//    console.log(req.body);
//    console.log(typeof req.body);
//    console.log(req.headers['content-length']);
//    let afterDecryptReq = null;
//    if (req.headers['content-length'] == 0) {
//       console.log("null request");
//       afterDecryptReq = new Promise(function (resolve, reject) {
//          let dummyObj = new Object();
//          dummyObj.payload = "{}";
//          resolve(dummyObj);
//       });
//    } else {
//       const firstVerifyReq = jose.JWS.createVerify(keystore)
//          .verify(req.body);
//       afterDecryptReq = firstVerifyReq.then(function (x) {
//          console.log("[verifyReq2]");
//          console.log(x);
//          console.log(x.payload.toString());
//          let temp = JSON.parse(x.payload);
//          return jose.JWE.createDecrypt(jwk_tam_privkey).decrypt(temp);
//       });
//    }

//    //encrypt then sign!
//    const firstEncryptRes = afterDecryptReq.then(function (x) {
//       console.log("[encryptRes]");
//       console.log(x.payload.toString());
//       let response = teepImplHandler(req, JSON.parse(x.payload.toString()));
//       if (response == null) {
//          return nullPromise;
//       } else {
//          return jose.JWE.createEncrypt({ fields: { alg: 'RSA1_5' }, format: 'flattened' }, jwk_tee_pubkey).update(JSON.stringify(response)).final();
//       }
//    })
//    const afterSignRes = firstEncryptRes.then(function (x) {
//       console.log("[signRes]");
//       console.log(x);
//       if (x == null) {
//          return nullPromise;
//       } else {
//          return jose.JWS.createSign({ format: 'flattened' }, jwk_tam_privkey).update(Buffer.from(JSON.stringify(x))).final();
//       }
//    });
//    const finalize = afterSignRes.then(function (x) {
//       console.log("[finally sending]");
//       console.log(x);
//       if (x == null) {
//          res.set(null);
//          res.status(204);
//          res.end();
//       } else {
//          //res.set(ret);
//          res.send(JSON.stringify(x));
//          res.end();
//       }
//    });
//    //console.log(plainRequest);
//    // jose.JWS.createVerify(keystore)
//    //    .verify(JSON.stringify(plainRequest))
//    //    .then(function (result) {
//    //       console.log(result);
//    // });
//    return;

// });

// //with encrypt
// router.post('/tam_jose_s_e_delete', function (req, res, next) {
//    // check POST content
//    console.log(req.headers);
//    console.log(req.body); // encrypted body
//    let ret = null;

//    //set response header
//    res.set({
//       'Content-Type': 'application/teep+json',
//       'Cache-Control': 'no-store',
//       'X-Content-Type-Options': 'nosniff',
//       'Content-Security-Policy': "default-src 'none'",
//       'Referrer-Policy': 'no-referrer'
//    });

//    //decrypt & verify
//    let plainRequest = null;
//    let nullPromise = new Promise(function (resolve, reject) {
//       resolve(null);
//    });
//    console.log(req.body);
//    console.log(typeof req.body);
//    console.log(req.headers['content-length']);
//    let verifyReq = null;
//    if (req.headers['content-length'] == 0) {
//       console.log("null request");
//       verifyReq = new Promise(function (resolve, reject) {
//          let dummyObj = new Object();
//          dummyObj.payload = "{}";
//          resolve(dummyObj);
//       });
//    } else {
//       const decryptReq = jose.JWE.createDecrypt(jwk_tam_privkey)
//          .decrypt(req.body);
//       verifyReq = decryptReq.then(function (x) {
//          console.log("[verifyReq]");
//          console.log(x);
//          console.log(x.payload.toString());
//          let temp = JSON.parse(x.payload);
//          return jose.JWS.createVerify(keystore).verify(temp);
//       });
//    }

//    const signRes = verifyReq.then(function (x) {
//       console.log("[signRes]");
//       console.log(x.payload.toString());
//       let response = teepImplHandler(req, JSON.parse(x.payload.toString()));
//       if (response == null) {
//          return nullPromise;
//       } else {
//          return jose.JWS.createSign({ format: 'flattened' }, jwk_tam_privkey).update(JSON.stringify(response)).final();
//       }
//    })
//    const encryptRes = signRes.then(function (x) {
//       console.log("[encryptRes]");
//       console.log(x);
//       if (x == null) {
//          return nullPromise;
//       } else {
//          return jose.JWE.createEncrypt({ fields: { alg: 'RSA1_5' }, format: 'flattened' }, jwk_tee_pubkey).update(Buffer.from(JSON.stringify(x))).final();
//       }
//    });
//    const finalize = encryptRes.then(function (x) {
//       console.log("[finally sending]");
//       console.log(x);
//       if (x == null) {
//          res.set(null);
//          res.status(204);
//          res.end();
//       } else {
//          //res.set(ret);
//          res.send(JSON.stringify(x));
//          res.end();
//       }
//    });
//    //console.log(plainRequest);
//    // jose.JWS.createVerify(keystore)
//    //    .verify(JSON.stringify(plainRequest))
//    //    .then(function (result) {
//    //       console.log(result);
//    // });
//    return;

//    //process content
//    // ret = teepImplHandler(plainRequest);

//    // //encrypt(TBF)
//    // let encryptedResponse = null;
//    // jose.JWE.createEncrypt(keystore)
//    //    .update(ret)
//    //    .final()
//    //    .then(function(x){
//    //       encryptedResponse = x;
//    //    });

//    // if (ret == null) {
//    //    res.set(null);
//    //    res.status(204);
//    //    res.end();
//    // } else {
//    //    //res.set(ret);
//    //    res.send(JSON.stringify(encryptedResponse));
//    //    res.end();
//    // }

//    // return;


// });

// //with encrypt2(enc-then-sign) delete
// router.post('/tam_jose_delete', function (req, res, next) {
//    // check POST content
//    console.log(req.headers);
//    console.log(req.body); // encrypted body
//    let ret = null;

//    //set response header
//    res.set({
//       'Content-Type': 'application/teep+json',
//       'Cache-Control': 'no-store',
//       'X-Content-Type-Options': 'nosniff',
//       'Content-Security-Policy': "default-src 'none'",
//       'Referrer-Policy': 'no-referrer'
//    });

//    //~~decrypt & verify~~ => verify & decrypt
//    let plainRequest = null;
//    let nullPromise = new Promise(function (resolve, reject) {
//       resolve(null);
//    });
//    console.log(req.body);
//    console.log(typeof req.body);
//    console.log(req.headers['content-length']);
//    let afterDecryptReq = null;
//    if (req.headers['content-length'] == 0) {
//       console.log("null request");
//       afterDecryptReq = new Promise(function (resolve, reject) {
//          let dummyObj = new Object();
//          dummyObj.payload = "{}";
//          resolve(dummyObj);
//       });
//    } else {
//       const firstVerifyReq = jose.JWS.createVerify(keystore)
//          .verify(req.body);
//       afterDecryptReq = firstVerifyReq.then(function (x) {
//          console.log("[verifyReq2]");
//          console.log(x);
//          console.log(x.payload.toString());
//          let temp = JSON.parse(x.payload);
//          return jose.JWE.createDecrypt(jwk_tam_privkey).decrypt(temp);
//       });
//    }

//    //encrypt then sign!
//    const firstEncryptRes = afterDecryptReq.then(function (x) {
//       console.log("[encryptRes]");
//       console.log(x.payload.toString());
//       let response = teepImplHandler(req, JSON.parse(x.payload.toString()));
//       if (response == null) {
//          return nullPromise;
//       } else {
//          return jose.JWE.createEncrypt({ fields: { alg: 'RSA1_5' }, format: 'flattened' }, jwk_tee_pubkey).update(JSON.stringify(response)).final();
//       }
//    })
//    const afterSignRes = firstEncryptRes.then(function (x) {
//       console.log("[signRes]");
//       console.log(x);
//       if (x == null) {
//          return nullPromise;
//       } else {
//          return jose.JWS.createSign({ format: 'flattened' }, jwk_tam_privkey).update(Buffer.from(JSON.stringify(x))).final();
//       }
//    });
//    const finalize = afterSignRes.then(function (x) {
//       console.log("[finally sending]");
//       console.log(x);
//       if (x == null) {
//          res.set(null);
//          res.status(204);
//          res.end();
//       } else {
//          //res.set(ret);
//          res.send(JSON.stringify(x));
//          res.end();
//       }
//    });
//    //console.log(plainRequest);
//    // jose.JWS.createVerify(keystore)
//    //    .verify(JSON.stringify(plainRequest))
//    //    .then(function (result) {
//    //       console.log(result);
//    // });
//    return;

// });


// To generate Teep messages as test vectors:
// These are not APIs.
router.get('/testgen', function (req, res) {
   //sign and encrypt by TEEP agent key
   //QueryResponse
   let sampleRequest = { "TYPE": 2, "TOKEN": "1", "TA_LIST": [{ "Vendor_ID": "ietf-teep-wg" }] };

   //signAndEncrypt(sampleRequest);
   signAndEncrypt(sampleRequest).then((val) => {
      res.status(200);
      console.log(val)
      res.send(val);
      res.end();
   });
});

router.get('/testgen_cbor', function (req, res) {
   //sign and encrypt by TEEP agent key
   //QueryRequest
   //let sampleRequest = null; //{ 'TYPE': 2, 'TOKEN': '1', 'TA_LIST': "hoge" };
   //let values = Object.values(sampleRequest);
   //cbor.Map
   let cborRequest = new cbor.Map();
   cborRequest.set('TYPE', 2);
   let buf = new ArrayBuffer(1);
   let dv = new DataView(buf);
   dv.setUint8(0, 3);
   cborRequest.set('TOKEN', buf);
   cborRequest.set('TA_LIST', "hoge");

   let encoded = cbor.encode(cborRequest);
   //signAndEncrypt(sampleRequest);

   //outer_wrapper
   let outerWrapper = new cbor.Map();
   outerWrapper.set(1, null); //nil
   outerWrapper.set(2, cborRequest);
   res.send(cbor.encode(outerWrapper));
   res.end();
   // signAndEncrypt(sampleRequest).then((val) => {
   //    res.status(200);
   //    console.log(cborRequest);
   //    res.send(encoded);
   //    res.end();
   // });
});

module.exports = router;
