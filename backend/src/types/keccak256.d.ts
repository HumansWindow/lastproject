declare module 'keccak256' {
  /**
   * Keccak256 hash function
   * @param input - Buffer, string, number or array to hash
   * @returns Buffer containing the keccak256 hash of the input
   */
  function keccak256(input: Buffer | string | number[] | Uint8Array): Buffer;
  export default keccak256;
}