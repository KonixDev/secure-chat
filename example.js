const { E2EE } = require("e2ee.js");
const crypto = require("crypto").webcrypto;

async function setupE2EEInstance(name, crypto) {
  const instance = new E2EE({ deps: { crypto } });
  await instance.generateKeyPair();
  return instance;
}

async function main() {
  const participants = {
    goat: await setupE2EEInstance("goat", crypto),
    cat: await setupE2EEInstance("cat", crypto),
    dog: await setupE2EEInstance("dog", crypto)
  };

  const publicKeys = {};

  for (const [name, instance] of Object.entries(participants)) {
    publicKeys[name] = await instance.exportPublicKey();
  }

  const setRemoteKeysPromises = [];

  for (const [name, instance] of Object.entries(participants)) {
    for (const [otherName, publicKey] of Object.entries(publicKeys)) {
      setRemoteKeysPromises.push(
        instance.setRemotePublicKey(publicKey, otherName)
      );
    }
  }

  await Promise.all(setRemoteKeysPromises);

  const goatSays = "ankara messi";
  const goat = participants.goat;
  const cat = participants.cat;
  const dog = participants.dog;

  const encryptedMessages = {};

  // Encrypt the message for each participant
  for (const [name, instance] of Object.entries(participants)) {
    encryptedMessages[name] = await goat.encrypt(goatSays, name);
  }

  // Decrypt and verify the message for each participant
  for (const [name, encryptedMessage] of Object.entries(encryptedMessages)) {
    const participant = participants[name];
    const decryptedMessage = await participant.decrypt(
      encryptedMessage,
      "goat"
    );
    console.log(`${name} says: ${decryptedMessage}`);
    console.assert(
      goatSays === decryptedMessage,
      `${name} should correctly decrypt the message`
    );
  }

  console.log("All participants successfully decrypted the message.");
}

main().catch(console.error);
