import * as admin from 'firebase-admin';

const serviceAccount = {
  type: "service_account",
  project_id: "day-one-1a8d8",
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDFefD5IOqTuMCk\n1n7897phbOP9UfzFE1HVQSoapF6CF5vnVyMSav453CW8n/D1yLjSiCAe17+qkp61\nCr/D36S+dpG6qFZUrBBMrO00OlOss8cU26duWC83I9arc+hSyljE53f+ycW/HlT3\nBK1jEDF1JOMj78TtOx4D7VBtRtxYLUdC1OFcd/4i+EP7QDWaEOWEJuoFtiPGHDbc\n75Gwj1ZJH4VRL3DgFUiAWAvgWUUhNW/09MhnEfMiWqqAwa6p0oe10NinlVJy6tpJ\nbzdB2ZIklwwO179YRZp1DDb0jrsGNCh40T7bPzt1eNEYxcRnvOFBO5pO5ed5wnxY\nGKOoDS8XAgMBAAECggEAK/ki5T7krV9TGoGfBnKdgKtQO20B1dqe+tdHamZWmy5p\nq4KWTzgfA0BX8OBGtlxrd4oTaPrO9csvZw4NNK88zqK1gbSRgMpN2N0a9unUDx17\nQ9RDvMkLPoKO/1/QiHsBeFs4t7YzgALflZ/ngistcDH2GF8AYXksDmDOa37/euy6\nCAkPs0d3zMAcZyU4YBHH61TVs/FFkCxQv3ay2B1MC48EG8O/dgDqYv/VbcVyYy/Y\nPiyz+uKZ5ziibHHyhG8i9qom+4nDiyQHcIYQbFADDoYFUZAb8+foZ53SxsWVfta6\niA8/RakfNfRE0ujPYIaHEarWMzrQFsmIZ8Vg8EGcSQKBgQDnV2Tunmri6gZxm+L3\n1z5wVYlvgmG7Hds6wEO1OcWkv/QTJH0XXGCZzSEv2C4/eLUr3CPMQkYZWha3xT+u\nfnfxCcKxsBs7sHWmThipwcdYM+V05QUf85BMgYG0S2fMcav8+JyibkacyaPjXoHV\neb6ydVK63768USNTqPhXfMNn6QKBgQDahnjs9NCGAYEnvIcmG/fUz4YjZPBFF3j9\nPRKMBzfI3ol8bEoF6dQ71g7G9AptGfNBYuf62BVdShfw/pCI8CWPi3OK73/t0W/9\n3RY1m6PB7PS1i3ROt5sMH9Sr20orVGcqtNOotyrK1z1r+YLKTgLSLghl785kNCUL\nmBInq6R+/wKBgCf65IiQfCxnAWIU7K6kVjgXsD7DK5yo1kBbBdiF+XA1dDryrWOi\nJVevKbMZCzUQ6U6BJvaf5XlwJkjwH8dKN/RCGZGXu70fC9YH3R9JS+gkX91Jzw7s\nit2N7Bp6hZ/BbVW0qW0w3acu+dHLfWilN52jxP5iuJXW9+H3a6PC/goxAoGBAI2H\nHBhzcf3oSYq/ylP/NyJoCTsxK3/D9QMmI7X3EsUQg8DGraZoy6C5QTbPZVVFwkst\n0Iqgmi2iSCE37coSpnDyYzGvbY5L35luL+0mUQfO/Kn7mKdGuK9Aik+HpeCsOGjr\nVk3l21wlzMz6ex+lKKSRVbUXe/df4kJBCjkRLGdnAoGBALqmYOSTGb8hQTG0Ueqw\nE19a1gAwe0OxNzwfTpyuZxN2ArsYmMoRxsglgk89fMwFEzMkFypAkQ9dGj2yqb4X\nUes+6tb5KsAkozzuGun/8Ec5ok4PNuISvuB4XAKa5cz0lKNXjw+rbSae55ADD7Rd\n8KF3XxYAoxJEGZKLlRqI0nsA\n-----END PRIVATE KEY-----\n",
  client_email: "firebase-adminsdk-fbsvc@day-one-1a8d8.iam.gserviceaccount.com"
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  });
}

export const adminAuth = admin.auth();
export default admin;