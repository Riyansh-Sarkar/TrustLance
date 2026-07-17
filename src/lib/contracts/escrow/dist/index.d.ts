import { Buffer } from "buffer";
import { AssembledTransaction, Client as ContractClient, ClientOptions as ContractClientOptions, MethodOptions } from "@stellar/stellar-sdk/contract";
import type { u32, i128 } from "@stellar/stellar-sdk/contract";
export * from "@stellar/stellar-sdk";
export * as contract from "@stellar/stellar-sdk/contract";
export * as rpc from "@stellar/stellar-sdk/rpc";
export declare const networks: {
    readonly testnet: {
        readonly networkPassphrase: "Test SDF Network ; September 2015";
        readonly contractId: "CAC3XR6VYSDMTUNQXIJGOVJEEOO6H5PTFCS5VHPY5X64JAXKIJNBOGLU";
    };
};
export declare const Errors: {
    1: {
        message: string;
    };
    2: {
        message: string;
    };
    3: {
        message: string;
    };
    4: {
        message: string;
    };
    5: {
        message: string;
    };
    6: {
        message: string;
    };
    7: {
        message: string;
    };
    8: {
        message: string;
    };
};
export type DataKey = {
    tag: "Escrow";
    values: readonly [string];
};
export interface Milestone {
    amount: i128;
    description: string;
    id: u32;
    status: MilestoneStatus;
}
export interface EscrowState {
    admin: string;
    client: string;
    freelancer: string;
    initialized: boolean;
    is_closed: boolean;
    is_disputed: boolean;
    milestones: Array<Milestone>;
    token: string;
    total_amount: i128;
}
export type MilestoneStatus = {
    tag: "Pending";
    values: void;
} | {
    tag: "Submitted";
    values: void;
} | {
    tag: "Approved";
    values: void;
} | {
    tag: "Released";
    values: void;
} | {
    tag: "Disputed";
    values: void;
};
export interface Client {
    /**
     * Construct and simulate a get_state transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     */
    get_state: ({ project_id }: {
        project_id: string;
    }, options?: MethodOptions) => Promise<AssembledTransaction<EscrowState>>;
    /**
     * Construct and simulate a initialize transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     */
    initialize: ({ project_id, client, freelancer, token, milestone_amounts, milestone_descriptions }: {
        project_id: string;
        client: string;
        freelancer: string;
        token: string;
        milestone_amounts: Array<i128>;
        milestone_descriptions: Array<string>;
    }, options?: MethodOptions) => Promise<AssembledTransaction<u32>>;
    /**
     * Construct and simulate a flag_dispute transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     */
    flag_dispute: ({ project_id, caller }: {
        project_id: string;
        caller: string;
    }, options?: MethodOptions) => Promise<AssembledTransaction<null>>;
    /**
     * Construct and simulate a cancel_contract transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     */
    cancel_contract: ({ project_id }: {
        project_id: string;
    }, options?: MethodOptions) => Promise<AssembledTransaction<null>>;
    /**
     * Construct and simulate a resolve_dispute transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     */
    resolve_dispute: ({ project_id, resolver, release_to, amount }: {
        project_id: string;
        resolver: string;
        release_to: string;
        amount: i128;
    }, options?: MethodOptions) => Promise<AssembledTransaction<null>>;
    /**
     * Construct and simulate a submit_milestone transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     */
    submit_milestone: ({ project_id, milestone_id }: {
        project_id: string;
        milestone_id: u32;
    }, options?: MethodOptions) => Promise<AssembledTransaction<null>>;
    /**
     * Construct and simulate a approve_milestone transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     */
    approve_milestone: ({ project_id, milestone_id }: {
        project_id: string;
        milestone_id: u32;
    }, options?: MethodOptions) => Promise<AssembledTransaction<null>>;
}
export declare class Client extends ContractClient {
    readonly options: ContractClientOptions;
    static deploy<T = Client>(
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions & Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
    }): Promise<AssembledTransaction<T>>;
    constructor(options: ContractClientOptions);
    readonly fromJSON: {
        get_state: (json: string) => AssembledTransaction<EscrowState>;
        initialize: (json: string) => AssembledTransaction<number>;
        flag_dispute: (json: string) => AssembledTransaction<null>;
        cancel_contract: (json: string) => AssembledTransaction<null>;
        resolve_dispute: (json: string) => AssembledTransaction<null>;
        submit_milestone: (json: string) => AssembledTransaction<null>;
        approve_milestone: (json: string) => AssembledTransaction<null>;
    };
}
