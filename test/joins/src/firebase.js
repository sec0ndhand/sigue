const firebaseAdmin = require("firebase-admin");
const { nanoid } = require("nanoid");
const { to, atob } = require("./utils.js");

const firebaseDbUrl = process.env.FIREBASE_DB_URL;

// Initialize Firebase as a frontend app
// const { initializeApp } = require("firebase/app");
// const firebaseConfig = JSON.parse(atob(process.env.FIREBASE_ADMIN_JSON || 'e30K'));
// const app = initializeApp(firebaseConfig);

const theJSON = atob(process.env.FIREBASE_ADMIN_JSON || 'e30K');

const serviceAccount = JSON.parse(theJSON);

firebaseAdmin.initializeApp({
  credential: firebaseAdmin.credential.cert(serviceAccount),
  databaseURL: firebaseDbUrl,
})

const firebaseAuthSync = async (userInstance) => {
    let rtn, error, fireUser;
    const nano = nanoid();
    const { email, auth_level = 1, phone, firebase_id, name, active = true } = userInstance;
    [fireUser, error] = await to(firebaseAdmin.auth().getUserByEmail(email));

    let uid = fireUser
      ? fireUser.uid
      : firebase_id
      ? firebase_id
      : nano;

    console.log({uid});

    userInstance.firebase_id = uid;
    const fireBaseUser = {
      uid,
      email,
      ...(phone ? { phoneNumber: phone } : { }),
      displayName: name,
      disabled: !active,
    };

    if (!fireUser) {
      let userImportRecords = [{ ...fireBaseUser, uid }];
      [rtn, error] = await to(firebaseAdmin.auth().importUsers(userImportRecords));
      if (error) {
        console.log(error);
        throw error;
      }
    } else {
      [rtn, error] = await to(firebaseAdmin.auth().updateUser(uid, fireBaseUser));
    }
    [rtn, error] = await to(firebaseAdmin.auth().setCustomUserClaims(uid, { auth_level }));
  };

  module.exports = {
    firebaseAuthSync,
    firebaseAdmin
  }
