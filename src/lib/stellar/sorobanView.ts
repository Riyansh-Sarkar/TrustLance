import { Address, Operation, TransactionBuilder, rpc, xdr } from "@stellar/stellar-sdk";
import { horizonServer, sorobanServer } from "./client";
import { STELLAR_CONFIG } from "@/constants/stellar";

export async function buildSorobanViewTx(params: {
  contractAddress: Address;
  functionName: string;
  args: xdr.ScVal[];
}): Promise<rpc.Api.SimulateTransactionResponse | null> {
  const sourceAccount = await horizonServer.loadAccount(STELLAR_CONFIG.usdc.issuer);

  const hostFunction = xdr.HostFunction.hostFunctionTypeInvokeContract(
    new xdr.InvokeContractArgs({
      contractAddress: params.contractAddress.toScAddress(),
      functionName: params.functionName,
      args: params.args,
    })
  );

  const tx = new TransactionBuilder(sourceAccount, {
    fee: "0",
    networkPassphrase: STELLAR_CONFIG.network,
  })
    .addOperation(
      Operation.invokeHostFunction({
        func: hostFunction,
        auth: [],
      })
    )
    .setTimeout(30)
    .build();

  const simResult = await sorobanServer.simulateTransaction(tx);
  if (rpc.Api.isSimulationSuccess(simResult)) {
    return simResult;
  }
  return null;
}
