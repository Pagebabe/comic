import { readFile } from 'node:fs/promises';
import { validateOutputContract } from './check_legacy_asset_migration_output.mjs';

const root = new URL('../', import.meta.url);
const readJson = async (path) => JSON.parse(await readFile(new URL(path, root), 'utf8'));

const [contract, mappingContract] = await Promise.all([
  readJson('project/legacy-asset-migration-output-contract.json'),
  readJson('project/legacy-asset-mapping-contract.json')
]);

validateOutputContract(contract, mappingContract);

console.log(JSON.stringify({
  status: 'pass',
  contractId: contract.contractId,
  mappingContractId: mappingContract.contractId,
  requiredFiles: contract.requiredFiles,
  automaticMasterApprovals: contract.safety.automaticMasterApprovals,
  reviewStatus: contract.safety.reviewStatus
}, null, 2));
