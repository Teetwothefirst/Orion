declare module 'crypto-js' {
  namespace CryptoJS {
    interface EncryptionConfig {
      iv?: CryptoJS.lib.WordArray;
      salt?: CryptoJS.lib.WordArray;
      keySize?: number;
      iterations?: number;
    }

    namespace lib {
      class WordArray {
        static random(nBytes: number): WordArray;
        toString(): string;
      }
    }

    namespace AES {
      function encrypt(plaintext: string, key: WordArray | string, options?: EncryptionConfig): any;
      function decrypt(ciphertext: string | any, key: WordArray | string, options?: EncryptionConfig): any;
    }

    namespace enc {
      const Hex: Encoder;
      const Utf8: Encoder;
      const Base64: Encoder;
    }

    interface Encoder {
      parse(str: string): lib.WordArray;
      stringify(wordArray: lib.WordArray): string;
    }

    function PBKDF2(
      password: string,
      salt: string | lib.WordArray,
      options: {
        keySize?: number;
        iterations?: number;
      }
    ): lib.WordArray;
  }

  const CryptoJS: {
    lib: typeof CryptoJS.lib;
    AES: typeof CryptoJS.AES;
    enc: typeof CryptoJS.enc;
    PBKDF2: typeof CryptoJS.PBKDF2;
  };

  export default CryptoJS;
}
