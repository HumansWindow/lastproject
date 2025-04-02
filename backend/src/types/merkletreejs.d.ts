declare module 'merkletreejs' {
  interface MerkleTreeOptions {
    hashLeaves?: boolean;
    sortLeaves?: boolean;
    sortPairs?: boolean;
    duplicateOdd?: boolean;
    isBitcoinTree?: boolean;
  }

  type HashFunction = (data: Buffer | string | number[] | Uint8Array) => Buffer;
  
  export class MerkleTree {
    /**
     * Creates a new Merkle Tree
     * @param leaves - Array of hashed leaves
     * @param hashFunction - Hash function to use for hashing nodes
     * @param options - Additional options
     */
    constructor(
      leaves: Buffer[] | string[], 
      hashFunction: HashFunction, 
      options?: MerkleTreeOptions
    );

    /**
     * Returns the merkle root hash as a Buffer
     */
    getRoot(): Buffer;

    /**
     * Returns the merkle root hash as a hex string
     */
    getHexRoot(): string;

    /**
     * Returns the proof for a leaf as an array of Buffers
     * @param leaf - Leaf to generate proof for
     */
    getProof(leaf: Buffer | string): Buffer[];

    /**
     * Returns the proof for a leaf as an array of hex strings
     * @param leaf - Leaf to generate proof for
     */
    getHexProof(leaf: Buffer | string): string[];

    /**
     * Verifies a proof for a leaf
     * @param proof - Proof array
     * @param leaf - Target leaf
     * @param root - Merkle root
     */
    verify(proof: Buffer[], leaf: Buffer, root: Buffer): boolean;

    /**
     * Verifies a hex-proof for a leaf
     * @param proof - Hex-string array proof
     * @param leaf - Target leaf
     * @param root - Merkle root
     */
    verify(proof: string[], leaf: string, root: string): boolean;
  }
}